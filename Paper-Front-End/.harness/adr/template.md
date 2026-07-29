# ADR-NNNN — <título curto da decisão>

> Architecture Decision Record. Copie este arquivo para `adr/NNNN-slug.md`
> (NNNN sequencial, ex.: `0001-adotar-vitest.md`). Um ADR é **imutável** depois
> de aceito — para mudar, crie um novo que o **supersede**.

- **Status:** Proposto | Aceito | Substituído por ADR-XXXX | Descontinuado
- **Data:** AAAA-MM-DD
- **Decisores:** <quem decidiu>
- **Contexto técnico:** <módulo/área afetada, ex.: next-http-client>

## Contexto

Qual problema ou força motriz levou a esta decisão? Que restrições existem?
Por ser um **template replicado**, registre o impacto sobre projetos
consumidores (esta decisão é herdada por todos?).

## Decisão

O que foi decidido, de forma afirmativa e clara. "Vamos usar X para Y."

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|-------------|------|---------|-------------|
| A | | | |
| B | | | |

## Consequências

- **Positivas:** o que melhora.
- **Negativas / trade-offs:** o que piora ou fica mais complexo.
- **Impacto no template:** breaking change para consumidores? Precisa de nota de
  migração? Afeta a API pública (`index.ts`)?
- **Boundaries afetados:** esta decisão cria/altera algum boundary?

## Follow-ups

- [ ] Atualizar `patterns/*.md` afetado
- [ ] Atualizar `domain-glossary.md` se introduziu termo novo
- [ ] Registrar dívida em `tech-debt/log.md` se houver atalho intencional
