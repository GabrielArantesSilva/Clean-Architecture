# Boundaries — Kami

> Limites inegociáveis. Um agente **nunca** cruza um boundary sem ADR explícito.
> Como o Kami é uma **codebase-template**, os boundaries protegem sobretudo a
> **generalidade e reusabilidade** do código — não há dados de negócio a proteger.

## 1. Generalidade (o boundary mais importante)

O Kami é replicado em N projetos. Código acoplado a um projeto específico
**contamina todos**. Por isso:

- ❌ **NUNCA** referencie um cliente, produto, domínio de negócio ou projeto
  específico (nomes de entidade de negócio, rotas de telas de um app, regras
  de um cliente). Se aparecer "Pedido", "Paciente", "Apólice" — está no lugar
  errado.
- ❌ **NUNCA** hardcode valores que variam por projeto: URLs de API, nomes de
  cookie, chaves, feature flags, textos de marca. Tudo isso entra por
  **parâmetro / configuração** (padrão `CreateApiClientOptions`).
- ❌ **NUNCA** acople a um design system ou tema de um projeto. Componentes do
  Kami expõem estilo via props/tokens, não cores fixas de uma marca.
- ✅ Tudo exportado deve fazer sentido **fora de qualquer projeto**. Pergunta de
  controle: *"isso seria útil num projeto Origami totalmente diferente?"* Se não,
  não pertence ao Kami.

## 2. Segurança de credenciais e tokens

Mesmo sendo template, o Kami define **como** os projetos lidam com auth — então
o padrão precisa ser seguro por construção:

- ❌ **NUNCA** persista access/refresh token em `localStorage`, `sessionStorage`
  ou variável global de cliente. O padrão é **cookie httpOnly** (gerido pela
  API), consumido via `withCredentials`. Ver `auth.interceptor.ts`.
- ❌ **NUNCA** logue tokens, headers `Authorization`, `Cookie` ou `Set-Cookie`.
- ❌ **NUNCA** verifique assinatura de JWT no front. `isAccessTokenLive` só lê
  `exp` — a verificação real é do backend. Não introduza libs de verificação.
- ✅ Refresh é **single-flight** (uma chamada concorrente compartilhada). Não
  remova o `refreshPromise`.

## 3. Fronteira server / client (Next.js)

- ❌ **NUNCA** importe `server.ts`, `next/headers` ou `cookies()` em código que
  roda no cliente. Isso quebra o build ou vaza contexto de request.
- ❌ **NUNCA** ponha segredo em código que vai para o bundle do navegador. Só
  `NEXT_PUBLIC_*` é público — e mesmo esses não devem conter segredo.
- ✅ Código compartilhado (jwt, refresh) deve ser **edge-safe**: sem `Buffer`,
  `fs`, `crypto` de Node. Use `atob`/`fetch` nativos.

## 4. Compatibilidade do template

- ❌ **NUNCA** introduza dependência pesada/opinativa sem ADR. Cada dep nova é
  herdada por todos os projetos consumidores.
- ❌ **NUNCA** faça breaking change em API pública exportada (`index.ts`) sem
  registrar ADR e nota de migração. Outros projetos dependem dessas assinaturas.
- ✅ Mantenha as exportações públicas mínimas e estáveis (barrel `index.ts`).

## 5. Qualidade não-negociável

- ❌ **NUNCA** use `any` para silenciar o compilador. `strict` +
  `noUncheckedIndexedAccess` estão ligados de propósito.
- ❌ **NUNCA** deixe `console.log` (apenas `warn`/`error`/`info` são permitidos
  pelo ESLint).
- ✅ Decisão não-óbvia → comentário explicando o **porquê** no ponto de uso.

---

## Compliance / dados sensíveis

**Não aplicável.** O Kami não processa, armazena nem trafega dados pessoais ou
sensíveis — é infraestrutura de software. Projetos que **consomem** o Kami e
lidam com PII devem aplicar suas próprias exigências (LGPD etc.) na camada deles.
Se algum dia o Kami passar a embutir tratamento de dado sensível, **isto vira um
boundary novo e exige ADR**.
