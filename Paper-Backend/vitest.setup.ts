import 'reflect-metadata'

// reflect-metadata precisa estar carregado antes de qualquer classe com
// decorator (@injectable/@inject/@ValidateWith) ser avaliada — este setup
// garante isso para todo spec, inclusive os que só constroem use cases com `new`.

// Env mínimo para os specs que sobem o boot (bootstrap/env). Use cases puros
// não dependem disto; só o smoke de DI e o que importa `env` precisam. Valores
// sintéticos — nunca segredo real (boundaries.md).
process.env['DATABASE_URL'] ??= 'postgres://kami:kami@localhost:5432/kami_test'
process.env['SESSION_SECRET'] ??= 'test-session-secret-key'
process.env['NODE_ENV'] ??= 'test'
