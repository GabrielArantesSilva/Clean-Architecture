# Tech Debt Log — kami-backend

## TD-0001 — `console.error` no boot antes da validação de env

- Status: aceito permanentemente (não é debt a resolver — é limitação estrutural)
- Prioridade: baixa
- Local: `src/env.ts`, dentro de `loadEnv()`
- Impacto: nenhum em produção — só roda no caminho de falha do boot, antes do
  processo subir; nunca está no caminho de request.
- Causa: o Logger (`core/logger`) é selecionado por `env.NODE_ENV` via
  `logger.factory.ts`. Se `loadEnv()` falhou, `env` ainda não existe — não há
  porta de log disponível para usar. `console.error` + `process.exit(1)` é o
  único canal possível nesse ponto específico do bootstrap.
- Próximo passo: nenhum. Revisar só se o boot ganhar um logger
  pré-validação (ex.: logger fixo de bootstrap, independente do env) — não
  planejado hoje, custo não justifica a complexidade extra.
