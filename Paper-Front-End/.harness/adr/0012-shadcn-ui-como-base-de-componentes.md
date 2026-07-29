# ADR-0012 — shadcn/ui como base de componentes do Kami

- **Status:** Aceito
- **Data:** 2026-07-03
- **Decisores:** Italo Castro
- **Contexto técnico:** `src/core/components/ui/` (camada de UI base) + Tailwind v4
- **Emendas:**
  - 2026-07-03 (1) — linguagem visual default ("pele Kami": tokens + skin via
    `data-slot` + fontes via `next/font`). Ver seção ao final.
  - 2026-07-03 (2) — **tema default = Design System Origami Lab v2.0** (substitui
    os VALORES da emenda 1; mantém o MECANISMO). Ver seção ao final.

## Contexto

O Kami já padroniza a camada de API (`http-client`), hooks e formulário
(`useForm` + TypeBox), mas **não tinha componentes de UI**. Cada projeto novo
recria do zero os mesmos elementos (botão, input, dialog, table…), sem
consistência de acessibilidade nem de estilo.

Por ser um **template replicado em N projetos**, uma base de componentes precisa:

- ser **agnóstica de marca** — não pode carregar cor/fonte de um projeto
  específico (boundary de generalidade, o mais importante do Kami);
- expor estilo via **props/tokens**, não cores fixas;
- não introduzir **dependência pesada/opinativa** sem registro (boundary 4);
- não conflitar com os padrões já estabelecidos (formulário `useForm`+TypeBox,
  toast via `sonner` + interceptor).

O `patterns/frontend.md` do time (injetado pela skill de frontend) **já previa**
shadcn: *"`core/` ← shared kernel: genérico (**inclui componentes shadcn**)"*.
Este ADR formaliza essa adoção.

## Decisão

Adotar **shadcn/ui** (estilo `new-york`, base **Radix** unificada) como a base de
componentes do Kami, instalados como **source-code próprio** em `core/`.

1. **Componentes viram código nosso**, não dependência. shadcn copia o source
   para o repo → ownership total, customização direta, sem lock-in de versão de
   biblioteca de componentes.
2. **Localização em `core/` (ADR-015 / shared kernel):**
   - componentes → `src/core/components/ui/`
   - `cn()` → `src/core/lib/utils.ts`
   - tokens/tema → `src/core/styles/globals.css`
   - `components.json` com aliases apontando para `@/core/*` (não o default
     `@/components`), para respeitar a estrutura por bounded-context do time.
3. **Tema neutro por construção.** Paleta base **`neutral`**, 100% em CSS
   variables (light + `.dark`). **Nenhuma cor de marca** é hardcoded — o projeto
   consumidor sobrescreve `--primary`/`--primary-foreground` etc. no seu próprio
   `globals.css`. **Nenhuma fonte** é fixada aqui (fica a cargo do consumidor).
4. **Kit base essencial** nesta 1ª leva (18 componentes): `button`, `input`,
   `textarea`, `label`, `card`, `dialog`, `alert-dialog`, `select`,
   `dropdown-menu`, `table`, `tabs`, `tooltip`, `popover`, `sheet`, `badge`,
   `avatar`, `separator`, `skeleton`. O resto entra sob demanda via
   `pnpm dlx shadcn@latest add <nome>`.
5. **Duas exclusões deliberadas** (ver Alternativas):
   - **`form` do shadcn NÃO entra** — é baseado em `react-hook-form` + `zod`, o
     que **conflita com o pattern oficial** (`useForm` + TypeBox). Traria duas
     libs de formulário concorrentes para todos os consumidores.
   - **`sonner` do shadcn NÃO entra** — o Kami **já depende de `sonner`** e o
     interceptor já dispara o toast; o wrapper do shadcn ainda forçaria
     `next-themes`.
6. **`cursor: pointer` resolvido na base** (`@layer base`), pois o Tailwind v4
   removeu esse default do preflight — regra cobrada por `patterns/frontend.md`.
7. **Sem barrel para a UI.** Importa-se direto (`@/core/components/ui/button`),
   idioma do shadcn — evita re-export gigante, ciclos e prejuízo de tree-shaking.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|-------------|------|---------|-------------|
| **shadcn source em `core/`, tema neutro (escolhida)** | Ownership total; acessível (Radix); agnóstico de marca; sem lock-in | Herda Tailwind v4 + radix-ui + cva no template; manutenção do source é nossa | — |
| Biblioteca pronta (MUI/Chakra/AntD) | Zero manutenção de source | Opinativa, pesada, tema acoplado, difícil de neutralizar num template | Contraria generalidade e boundary 4 |
| Componentes 100% caseiros | Controle máximo | Reinventa acessibilidade (foco, ARIA, teclado) e custa muito | Sem ganho sobre Radix/shadcn |
| shadcn no default `@/components` | Segue a doc | Ignora a estrutura por bounded-context (ADR-015) | Alinhamos aliases a `core/` |
| Incluir `form` + `sonner` do shadcn | Kit "completo" | `react-hook-form`/`zod` brigam com `useForm`+TypeBox; `next-themes` forçado | Conflita com patterns existentes |
| Base UI em vez de Radix | Alternativa nova | Menos maduro; incompat. com AI Elements | Radix é o default seguro |

## Consequências

- **Positivas:** base de UI padronizada, acessível e consistente; source próprio
  (customizável e versionável no repo); tema neutro que cada projeto tematiza via
  tokens; sem conflito com formulário/toast do time.
- **Negativas / trade-offs:** novas dependências **herdadas por todos os
  consumidores** (boundary 4): `tailwindcss` v4, `@tailwindcss/postcss`,
  `tw-animate-css`, `radix-ui`, `class-variance-authority`, `tailwind-merge`,
  `clsx`, `lucide-react`. Manter o source dos componentes atualizado passa a ser
  responsabilidade do time (`shadcn add --overwrite`/`diff` para pegar upstream).
- **Impacto no template:** **aditivo, não-breaking.** Nada da API pública
  existente (`http-client`, `hooks`) muda. Consumidores que adotarem a UI precisam
  do Tailwind v4 configurado e importar `core/styles/globals.css` no seu
  `app/layout`. `tooltip` exige `TooltipProvider` na raiz do app consumidor.
- **Ajuste correlato:** removido `baseUrl` do `tsconfig.json` (deprecado no TS 6;
  `paths` resolve relativo ao `tsconfig`) — `pnpm typecheck` volta a passar.
- **Boundaries afetados:** **boundary 1** (generalidade) — respeitado via tema
  neutro/sem marca/sem fonte fixa; **boundary 4** (dep nova em template) —
  registrado aqui. Sem dado sensível.

## Emenda 2026-07-03 — linguagem visual default ("pele Kami")

> Extensão da decisão original (não a substitui). O tema deixou de ser o default
> cru do shadcn e ganhou uma **direção visual própria** — "ferramenta de
> precisão" — permanecendo 100% agnóstico de marca.

### Contexto da emenda

O default cru do shadcn tem "cara de IA": paleta e raio genéricos, fonte de
sistema, zero assinatura. Como o Kami é o **ponto de partida de todo projeto**,
o default precisa de personalidade — sem violar o boundary 1 (nenhuma cor/fonte
de **cliente**; ter ponto de vista visual próprio não é marca).

### Decisão da emenda

1. **Direção: "ferramenta de precisão".** Neutro frio (hue ~260, chroma mínimo),
   contraste alto, `--radius: 0.375rem` (crisp), sombras hairline
   (`--shadow-xs/sm/md` próprios), detalhes técnicos em mono.
2. **Pele via `data-slot`** (`@layer components` no `globals.css`): botões com
   peso 500/tracking fechado/press físico; badges e cabeçalhos de tabela em mono
   compacto; números tabulares em células; sombras de precisão em superfícies
   flutuantes. **Nenhum `.tsx` vendorizado foi editado** — preserva
   `shadcn add --diff/--overwrite`. Por estar em `@layer components`, qualquer
   `className` (utility ou CSS Module) do consumidor continua vencendo.
3. **Fontes como contrato de token:** o core consome
   `--font-sans-app`/`--font-mono-app` com fallback para stack de sistema. Quem
   **define** a fonte é o app layer (`app/layout.tsx`, via `next/font` —
   built-in, sem dep nova). Default do template: **Instrument Sans** (UI) +
   **JetBrains Mono** (dados). Projeto consumidor troca em duas linhas do layout.

### Alternativas consideradas (emenda)

| Alternativa | Por que não |
|-------------|-------------|
| Manter default cru do shadcn | "Cara de IA" — sem assinatura; todo projeto nasceria genérico. |
| Editar os `.tsx` vendorizados | Quebraria o canal de update do upstream para sempre. |
| Fonte fixada no core (CSS `@import`) | Violaria boundary 1 e tiraria o controle do app layer; `next/font` faz self-host/subset de graça. |

### Consequências da emenda

- **Positivas:** identidade visual coesa e memorável por default; tudo continua
  sobrescrevível (tokens + `@layer`); zero dependência nova; upstream preservado.
- **Trade-offs:** a pele `data-slot` depende dos atributos `data-slot` do
  shadcn (estáveis desde 2025, mas é acoplamento a uma convenção do upstream);
  fontes Google baixadas em build (`next/font` self-host — sem request em runtime).
- **Impacto no template:** não-breaking. Projeto que não injetar
  `--font-sans-app` cai na stack de sistema.

## Emenda 2026-07-03 (2) — tema default = Design System Origami Lab v2.0

> Substitui os **valores** da emenda 1 ("ferramenta de precisão"); mantém todo o
> **mecanismo** (tokens + pele `data-slot` + fontes como contrato de token).

### Contexto e boundary

O time possui um Design System oficial (Origami Lab DS v2.0: Sea Green
`#0E895D`, Carbon Black `#252525`, Ivory `#F6F7EB`, Inter, pill em botões/tags,
cards 12px, **zero sombras**). Decidiu-se que o default do Kami carrega a
identidade **da casa**.

**Boundary 1 — cruzamento consciente e registrado:** o boundary "não acople a
design system de marca" protege o template de marca **de cliente**. Aqui a marca
é a **da própria Origami**, dona do template; e o mecanismo de generalidade
permanece: projeto de cliente re-tematiza sobrescrevendo tokens no próprio
`globals.css`, sem tocar em componente.

### Decisão da emenda

1. **Tokens = paleta oficial** (light: Ivory/White/`#E0E2D2`; dark: Carbon
   Black/`#2F2F2F`/`#3A3A3A`; `--primary` = Sea Green nos dois temas;
   `--accent` = tint de Sea Green p/ hover; charts na hierarquia cromática do
   DS com Palm Leaf como categoria secundária). `--radius: 0.75rem` (cards 12px).
2. **Pele = princípios do DS:** botões e badges **pill** (100px), botão peso 700
   com press `scale(.97)`, badges/table-heads no padrão `.ol-label`/`.ol-tag`
   (uppercase, 600, tracking amplo), **zero sombras** (bordas 1px fazem a
   profundidade — `box-shadow: none` nas superfícies flutuantes).
3. **Fonte oficial: Inter** (via `next/font` no app layer, token
   `--font-sans-app`). JetBrains Mono permanece para dados/código (o DS não
   define mono; números tabulares mantidos nas tabelas).
4. **Token novo `--gradient-brand`** (`linear-gradient(135deg, #0E895D, #2D4A4B)`)
   para capas/heros — espelha o símbolo da marca. Nunca sob texto longo (regra do DS).

### Consequências da emenda

- **Positivas:** todo projeto Origami nasce com a cara da casa; consistência
  imediata entre produtos internos; showcase vira vitrine viva do DS.
- **Trade-offs:** projeto de **cliente** precisa re-tematizar (sobrescrever
  tokens) antes de ir a produção — documentar esse passo no onboarding do
  template. Inter é fonte comum (a skill de frontend desaconselha genéricas),
  mas é a fonte **oficial do DS** — marca vence a heurística.
- **Impacto no template:** não-breaking (só valores de token/pele).

## Follow-ups

- [ ] Criar/atualizar `patterns/frontend.md` no `.harness/` (hoje referenciado
      pela skill mas **ausente** no repo) documentando: onde mora a UI, como
      tematizar via tokens, quando usar cada componente, e as exclusões `form`/`sonner`.
- [ ] Documentar no README do projeto consumidor: import de `globals.css`,
      `TooltipProvider`, e como sobrescrever `--primary`.
- [ ] Quando o runner de testes for adotado, cobrir smoke de render dos
      componentes base + variantes de `button`.
- [ ] Avaliar `next-themes` (dark mode toggle) só se/quando um consumidor pedir —
      não forçar no template.
