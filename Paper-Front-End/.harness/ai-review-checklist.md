# AI Review Checklist — Kami

> Checklist que um agente roda **antes de reportar código pronto** ou abrir PR.
> Reflete os boundaries e patterns deste repositório. Itens com 🚫 são bloqueio.

## 1. Generalidade do template (🚫 bloqueio)

- [ ] 🚫 Nenhuma referência a cliente, produto, domínio de negócio ou projeto
      específico.
- [ ] 🚫 Nenhum valor que varia por projeto está hardcoded (URL de API, nome de
      cookie, chave, texto de marca, cor de tema) — tudo entra por
      parâmetro/config.
- [ ] O código exportado seria útil em **qualquer** projeto Origami.
- [ ] API pública (`index.ts`) mínima e intencional; nada vazado por acidente.

## 2. Segurança (🚫 bloqueio)

- [ ] 🚫 Token nunca em `localStorage`/`sessionStorage`/global de cliente.
- [ ] 🚫 Token/`Authorization`/`Cookie`/`Set-Cookie` nunca logados.
- [ ] 🚫 Segredo nunca no bundle do navegador.
- [ ] Código server-only (`next/headers`, `cookies()`) não importado no cliente.
- [ ] Resposta de API validada por type guard antes de ser usada.
- [ ] `onUnauthorized` injetado, não hardcoded.

## 3. Edge-safety

- [ ] Código que deve rodar no Edge não usa `Buffer`/`fs`/`crypto` de Node.
- [ ] Usa `atob`/`fetch` nativos onde edge-safe é exigido (jwt, refresh).

## 4. Tratamento de erro

- [ ] Segue o pipeline Auth → UseCaseCore → Error; ordem dos interceptors
      preservada (ver comentário em `client.ts`).
- [ ] Erro re-lançado após efeito colateral; nenhum `catch` que engole.
- [ ] Mensagem ao usuário genérica e em pt-BR; sem vazar detalhe interno.
- [ ] `catch` tipa como `unknown`/`AxiosError`, nunca `any`.

## 5. Qualidade TypeScript (🚫 bloqueio em `any`)

- [ ] 🚫 Sem `any` para silenciar o compilador.
- [ ] Respeita `strict` + `noUncheckedIndexedAccess` (acesso a índice tratado).
- [ ] `import type` para imports de tipo (regra `consistent-type-imports`).
- [ ] Sem `console.log`/`debug` (só `warn`/`error`/`info`).

## 6. Documentação do "porquê"

- [ ] Decisão não-óbvia tem comentário explicando o **porquê** no ponto de uso
      (padrão do Kami).
- [ ] Mudança de contrato público → ADR registrado (`adr/template.md`).
- [ ] Atalho/trade-off intencional → registrado em `tech-debt/log.md`.
- [ ] Termo técnico novo → adicionado ao `domain-glossary.md`.

## 7. Testes (quando houver runner)

- [ ] Lógica não-trivial nova tem teste (caminho feliz + borda).
- [ ] Testes determinísticos (relógio/rede controlados).

## 8. Build verde

- [ ] `pnpm typecheck` passa.
- [ ] `pnpm lint` passa (sem novos warnings).
- [ ] `pnpm build` passa.

---

**Veredito:** só reporte "pronto" quando todos os 🚫 estiverem limpos e os
demais itens aplicáveis marcados. Item não aplicável → marque como N/A e diga
por quê.
