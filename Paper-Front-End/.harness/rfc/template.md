# RFC-NNNN — <título da proposta>

> Request for Comments. Use para **mudanças amplas** antes de implementar:
> novo padrão de referência, mudança estrutural, breaking change na API pública.
> Para decisões pontuais já tomadas, use um ADR. RFC discute; ADR registra o
> resultado.

- **Status:** Rascunho | Em discussão | Aceito | Rejeitado | Implementado
- **Autor:** <nome>
- **Data:** AAAA-MM-DD
- **Discussão:** <link da thread/PR/issue, se houver>

## Resumo

Um parágrafo: o que está sendo proposto e por quê.

## Motivação

Que dor ou oportunidade justifica mexer em algo que afeta **todos os projetos
consumidores** do Kami? O que acontece se não fizermos nada?

## Proposta detalhada

A mudança concreta. Inclua:

- API pública afetada (assinaturas em `index.ts`).
- Exemplo de uso antes/depois.
- É **edge-safe**? Respeita a fronteira server/client?
- Novas dependências (lembre: toda dep é herdada por todos os projetos).

## Impacto nos consumidores

- [ ] É breaking change? Qual o caminho de migração?
- [ ] Quais projetos consumidores precisam mudar?
- [ ] Há período de convivência (deprecação) ou é troca direta?

## Alternativas

O que mais foi considerado e por que esta proposta vence.

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| | | |

## Plano de adoção

1. …
2. …

## Pendências em aberto

Perguntas que ainda precisam de resposta antes do "Aceito".

---

> Ao ser **Aceito**, destile a decisão final num ADR (`adr/template.md`) e
> atualize os `patterns/` e `boundaries.md` afetados.
