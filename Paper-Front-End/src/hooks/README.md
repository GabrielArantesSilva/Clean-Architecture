# hooks

Kit de **hooks React reutilizáveis** para a cola do dia a dia que toda tela
re-implementa: flag de loading sem flicker, execução de ação async com
loading + notificação, carregamento de recurso com proteção de race, e
formulário tipado com validação [TypeBox](https://github.com/sinclairzx81/typebox).
São deliberadamente pequenos, componíveis e **livres de qualquer acoplamento
com UI ou negócio**.

> Este módulo vive em `src/hooks/` e é importado pelo alias `@/hooks`
> (ver [Setup](#setup)). O Kami é o template compartilhado — projetos criados a
> partir dele já nascem com estes hooks; não há pacote para instalar.

---

## Sumário

- [Por que isto existe](#por-que-isto-existe)
- [Setup](#setup)
- [Estrutura](#estrutura)
- [Pontos de entrada](#pontos-de-entrada)
- [Início rápido](#início-rápido)
- [Referência dos hooks](#referência-dos-hooks)
  - [`useLoadingDelay`](#useloadingdelay)
  - [`useAsyncAction`](#useasyncaction)
  - [`useResource`](#useresource)
  - [`useForm`](#useform)
- [Composição com a UI base](#composição-com-a-ui-base)
- [FAQ / gotchas](#faq--gotchas)

---

## Por que isto existe

Toda tela acaba re-resolvendo os mesmos problemas pequenos:

- Um spinner que **pisca** em respostas rápidas e some cedo demais nas lentas —
  irritante dos dois jeitos.
- Boilerplate em volta de um submit async: ligar/desligar loading, mostrar toast
  de sucesso, rodar callback, engolir o erro que a camada de API já reportou.
- Um "carrega no mount, expõe `reload`, não deixa resposta velha sobrescrever a
  nova".
- Estado de formulário controlado com validação ligada na mão.

Estes hooks centralizam esse comportamento para a tela ligar tudo em **uma
linha** em vez de re-derivar. Não guardam estado de app, não renderizam nada e
não dependem de nada além do React — por isso continuam reutilizáveis em
qualquer projeto nascido do template.

**Qual usar?**

| Preciso de… | Hook |
|---|---|
| Rodar ação do usuário (submit/salvar) com loading + toast de sucesso, sem `try/catch` | `useAsyncAction` |
| Carregar dado ao abrir a tela, com `reload` e proteção de race | `useResource` |
| Flag de loading sem flicker, controlada na mão | `useLoadingDelay` (é o primitivo dos dois acima) |
| Formulário controlado + validação TypeBox | `useForm` + `control` + `Validators` |

---

## Setup

Código TypeScript local em `src/hooks/` — sem pacote para instalar e sem build.
Os imports usam o alias `@/`, então o `tsconfig.json` do app precisa mapeá-lo
para `src/`:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Todos os hooks são `'use client'` — usam estado/efeitos do React e servem a
**componentes de cliente**. Chame-os de um componente `'use client'`, nunca de
um Server Component ou route handler.

---

## Estrutura

Um arquivo por hook; um hook vira pasta própria apenas quando carrega helpers e
tipos junto (como o `use-form`):

```
hooks/
├── index.ts                # barrel público — re-exporta todos os hooks
├── use-loading-delay.ts    # flag de loading com debounce (anti-flicker) [primitivo]
├── use-async-action.ts     # roda ação async: loading + notify + callbacks
├── use-resource.ts         # recurso no mount: race-safe + reload
└── use-form/               # form tipado + validação TypeBox
    ├── index.ts            # sub-barrel: useForm, control, Validators, tipos
    ├── use-form.ts         # o hook
    ├── control.ts          # control(value, validators) — fábrica de campo
    ├── validators.ts       # Validators: required / email / minLength / … / custom
    └── types.ts            # Control, ControlsMap, FormValues, FormErrors, Validator
```

`useAsyncAction` e `useResource` são construídos **sobre** o `useLoadingDelay` —
ele é o primitivo de loading compartilhado, não só um hook avulso.

---

## Pontos de entrada

| Import | Contém |
| --- | --- |
| `@/hooks` | tudo — `useLoadingDelay`, `useAsyncAction`, `useResource`, `useForm`, `control`, `Validators` e todos os tipos exportados |
| `@/hooks/use-form` | só a superfície de formulário — `useForm`, `control`, `Validators` e os tipos (`Control`, `ControlsMap`, `FormValues`, `FormErrors`, `Validator`) |

Os dois resolvem para o mesmo `useForm`; o sub-barrel só permite ao consumidor
de formulário importar sem puxar o resto para a vista.

---

## Início rápido

Um formulário de login combinando `useForm` (estado + validação) e
`useAsyncAction` (submit + loading + toast):

```tsx
'use client'
import { useForm, control, Validators, useAsyncAction } from '@/hooks'
import { toast } from 'sonner'

const form = useForm({
  email: control('', [Validators.required(), Validators.email()]),
  password: control('', [Validators.required(), Validators.minLength(8)]),
})

const login = useAsyncAction(
  (values: typeof form.values) => api.post('/auth/login', values),
  { successMessage: 'Bem-vindo de volta!', notify: toast.success },
)

return (
  <form onSubmit={form.handleSubmit(login.run)}>
    <input name="email" value={form.values.email} onChange={form.handleChange} />
    {form.errors.email && <span>{form.errors.email}</span>}

    <input name="password" type="password" value={form.values.password} onChange={form.handleChange} />
    {form.errors.password && <span>{form.errors.password}</span>}

    <button disabled={login.isLoading}>Entrar</button>
  </form>
)
```

`handleSubmit(onValid)` valida primeiro e só chama `onValid` (aqui `login.run`)
quando todos os campos passam; `login.run` liga o `isLoading`, dispara o toast
de sucesso e nunca deixa o erro estourar de volta no formulário.

---

## Referência dos hooks

### `useLoadingDelay`

```ts
useLoadingDelay(options?): { isLoading: boolean; start(): void; stop(): void }
// options: { showDelay?: number /* =30ms */, hideDelay?: number /* =150ms */ }
```

Uma flag de loading que resiste a flicker nas duas pontas:

- `start()` **não** liga o `isLoading` imediatamente — espera `showDelay` ms,
  então uma operação que termina antes disso nunca chega a mostrar loader.
- `stop()` ou cancela um show ainda pendente, ou — se o loader já está visível —
  o mantém na tela até completar pelo menos `hideDelay` ms, para o spinner nunca
  piscar por um único frame.
- Timers pendentes são limpos no unmount.

Você raramente chama este direto — `useAsyncAction` e `useResource` o embrulham.
Use quando controlar o loading na mão (ex.: uma fonte de eventos externa).

### `useAsyncAction`

```ts
useAsyncAction(action, options?): { run: (...args) => Promise<TResult | undefined>; isLoading: boolean }
```

Embrulha um `(...args) => Promise<TResult>` para o componente não repetir o
dance de loading/notify/callback.

- `run(...args)` chama a `action`, retorna o resultado dela, ou retorna
  **`undefined`** se ela lançou — **ramifique no valor de retorno, não embrulhe
  `run` em `try/catch`**.
- `isLoading` é a flag com debounce do `useLoadingDelay`.
- **`options`:**
  - `successMessage?: string | (result, ...args) => string` — resolvida após o
    sucesso.
  - `notify?: (message: string) => void` — para onde vai a `successMessage`
    resolvida; injete o toast do app (ex.: `toast.success` do `sonner`). Nada é
    exibido se você não passar.
  - `onSuccess?: (result, ...args) => void | Promise<void>` — roda depois do
    `notify`.
  - `onError?: (err, ...args) => void | Promise<void>` — **somente limpeza**; o
    interceptor de erro da API já mostra o toast de erro, não re-toaste aqui.

### `useResource`

```ts
useResource({ action, enabled? }): { data: T | null; isLoading: boolean; error: unknown; reload(): Promise<void>; setData }
// action: () => Promise<T>   enabled?: boolean  (=true)
```

Carrega um recurso no mount e expõe `reload`.

- Roda `action()` no mount e de novo sempre que a **identidade** da `action`
  mudar — então memoize com `useCallback`; uma arrow inline é recriada a cada
  render e dispara loop de reload.
- `enabled: false` pula o carregamento automático (ex.: esperando uma
  dependência).
- **Race-safe:** cada carga recebe um id incremental e só a última request em
  voo comita o resultado — uma resposta lenta antiga não sobrescreve dado novo.
- `reload()` re-executa sob demanda; `setData` permite patch otimista do valor.
  Em erro, `data` vira `null` e `error` guarda o valor lançado.

### `useForm`

```ts
useForm(controls): {
  values, errors, setValues, setFieldValue, handleChange, handleSubmit, validate, reset
}
```

Estado de formulário controlado e tipado, com validação. Monte o mapa de
`controls` com `control(valorInicial, validators)`:

```ts
const form = useForm({
  nome: control('', [Validators.required(), Validators.maxLength(80)]),
  idade: control(0, [Validators.custom((v) => Number(v) >= 18, 'Deve ser maior de 18.')]),
})
```

**`Validators`** (todos aceitam mensagem customizada opcional; as defaults são pt-BR):

| Validator | Verifica |
| --- | --- |
| `required(msg?)` | valor não-vazio (`null`/`''`/`[]`) |
| `email(msg?)` | string no formato `email` |
| `minLength(n, msg?)` / `maxLength(n, msg?)` | limites de tamanho de string |
| `pattern(regex, msg)` | string casa com a `RegExp` |
| `custom(predicate, msg)` | `predicate(value) === true` |

A validação é **compilada uma única vez** no mount via compilador nativo do
TypeBox (`Compile(Type.String(...))`) — checks de formato/tamanho/pattern rodam
pelo validador compilado, `custom` roda seu predicado, `required` checa
não-vazio. Rápida: não recompila a cada tecla.

**API retornada:**

- `values` / `errors` — valores atuais e mensagem de erro por campo.
- `handleChange` — ligue em
  `<input name="campo" value={…} onChange={handleChange} />`; lê
  `event.target.value` (**string**). Digitar num campo limpa o erro dele.
- `setFieldValue(campo, valor)` — seta um campo programaticamente (use para
  campos não-string, selects e inputs customizados).
- `handleSubmit(onValid)` — retorna o handler de `onSubmit` do `<form>`: faz
  `preventDefault`, valida e só chama `onValid(values)` se tudo passar.
- `validate()` — roda todos os validators, preenche `errors`, retorna `boolean`.
- `reset(nextValues?)` — limpa erros e restaura valores (default: os iniciais).

---

## Composição com a UI base

Os hooks **não conhecem** os componentes de `core/components/ui` (shadcn) — e
vice-versa. A integração acontece na tela (ou num componente composto),
por composição. O padrão de referência é a **tabela paginada**, demonstrada ao
vivo em `/componentes` (source: `src/app/componentes/_components/paginated-table-demo.tsx`):

```tsx
'use client'
const [page, setPage] = useState(1)

// A página é estado local; a action é memoizada COM a página na dependência.
// Trocar de página muda a identidade da action → useResource recarrega sozinho.
const action = useCallback(() => getUsuarios({ page }), [page])
const { data, isLoading } = useResource({ action })

// isLoading (anti-flicker) → linhas de <Skeleton>
// race-safety do hook → clique rápido entre páginas nunca mostra dado velho
// <Pagination> do core/ui só dispara setPage — zero estado de loading manual
```

Receitas equivalentes:

- **Ação destrutiva** — `AlertDialog` (core/ui) + `useAsyncAction`: o botão
  `AlertDialogAction` chama `action.run`, `isLoading` desabilita o botão.
- **Formulário** — `Input`/`Label` (core/ui) + `useForm`:
  `form.handleSubmit(salvar.run)` combina os dois mundos (ver
  [Início rápido](#início-rápido)).

---

## FAQ / gotchas

- **O loader ainda pisca / nunca aparece** → ajuste `showDelay` (suba para
  respostas rápidas pularem o loader) e `hideDelay` (suba para um loader breve
  ficar visível tempo de ler). Defaults: `30` / `150` ms.
- **`useResource` fica recarregando sem parar** → a `action` está sendo recriada
  a cada render. Memoize com `useCallback` (ou mova para fora do componente);
  mudança de identidade é o gatilho de reload **por design**.
- **`run` retornou `undefined`** → a action lançou. `useAsyncAction` engole o
  erro (o interceptor da API já reporta) e retorna `undefined` — verifique o
  retorno em vez de capturar.
- **Campo não-string não atualiza** → `handleChange` sempre escreve string de
  `event.target.value`. Para número, data, checkbox ou input customizado, chame
  `setFieldValue(campo, valorTipado)`.
- **Campo opcional com `pattern`/`email` passa vazio** → por design: só
  `required` falha no vazio; os demais checks são pulados quando o campo está
  vazio — opcional só valida depois de preenchido.
- **"Cannot use hook on the server"** → são hooks `'use client'`. Importe de um
  componente de cliente, nunca de RSC ou route handler.
