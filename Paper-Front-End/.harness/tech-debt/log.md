# Log de Dívida Técnica — Kami

> Registro vivo de atalhos intencionais, lacunas conhecidas e "consertar depois".
> Toda dívida tem dono implícito (quem registrou) e um critério de quitação.
> Atualize o status quando resolver. Não delete linhas — marque `Resolvido`.

## Como registrar

Adicione uma linha na tabela. Seja específico no **impacto** e no **gatilho de
quitação** (o que torna isto urgente o suficiente para pagar).

| ID | Data | Área | Descrição | Impacto | Gatilho de quitação | Status |
|----|------|------|-----------|---------|---------------------|--------|
| TD-001 | 2026-06-23 | testes | Sem runner/suíte de testes configurada (Vitest sugerido). Lógica edge-safe (jwt, type guards, interceptors) está sem rede de proteção. | Bug no template se propaga a todos os projetos consumidores sem aviso. | Antes de promover o Kami como dependência de um projeto em produção. | Aberto |
| TD-002 | 2026-06-23 | observabilidade | Sem ponto de observabilidade agnóstico formalizado (só `onUnauthorized` + interceptor como ganchos ad-hoc). | Projetos instrumentam de formas divergentes; sem padrão de referência. | Quando ≥2 projetos pedirem o mesmo gancho de telemetria. | Aberto |
| TD-003 | 2026-06-23 | componentes/hooks | `src/components` e `src/hooks` existem mas estão vazios — o template ainda só entrega a camada de API. | Promessa do Kami (componentes/hooks reutilizáveis) ainda não cumprida. | Conforme padrões forem extraídos de projetos reais. | Aberto |

## Princípios

- Dívida **registrada** é dívida gerenciável; dívida **silenciosa** é armadilha.
- Atalho intencional num PR → uma linha aqui, citada na descrição do PR.
- Se a dívida virar decisão de arquitetura, promova para um ADR e referencie.
