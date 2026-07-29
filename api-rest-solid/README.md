# api-rest-solid

API REST de estudo focada em uma única feature — **cadastro de usuário** — construída para praticar os princípios **SOLID** e **Clean Code** em um projeto Node.js/TypeScript real, com banco de dados de verdade.

## Stack

- **Node.js** + **TypeScript** (`strict` mode)
- **Express 5** — HTTP server
- **Prisma** + **PostgreSQL** — persistência
- **Zod** — validação de entrada
- **bcrypt** — hash de senha
- **Nodemailer** (Mailtrap) — envio de e-mail transacional
- **Vitest** — testes

## Arquitetura

O projeto segue uma separação em camadas inspirada em Clean Architecture, com um único fluxo ponta a ponta (`CreateUser`) como estudo de caso:

```
Request → Controller → UseCase → Repository / MailProvider / HashProvider (interfaces)
```

```
src/
├── config/          # validação de variáveis de ambiente (Zod)
├── database/         # client do Prisma
├── entities/         # entidades de domínio
├── errors/            # classe base de erro de aplicação
├── providers/         # abstrações de infraestrutura (hash, e-mail) + implementações
│   ├── implementations/
│   └── mailTemplates/
├── repositories/      # abstração de persistência + implementações (Prisma e in-memory)
├── useCases/
│   └── CreateUser/    # controller, use case, DTO, erro específico e composição (DI manual)
├── app.ts             # bootstrap do Express + error handler global
├── router.ts
└── server.ts
```

### Como o SOLID aparece aqui

- **SRP** — o `CreateUserUseCase` só orquestra a regra de negócio; a montagem do e-mail de boas-vindas vive em `providers/mailTemplates/welcomeUserMailTemplate.ts`.
- **OCP** — trocar o provedor de e-mail ou o banco de dados não exige alterar o use case, só uma nova implementação da interface.
- **LSP** — `InMemoryUsersRepository` e `PrismaUsersRepository` são intercambiáveis: implementam o mesmo contrato (`IUsersRepository`) e são usadas em testes e produção, respectivamente.
- **ISP** — interfaces enxutas e coesas (`IUsersRepository`, `IMailProvider`, `IHashProvider`), sem métodos que uma implementação precise ignorar.
- **DIP** — o `CreateUserUseCase` depende só de abstrações (`IUsersRepository`, `IMailProvider`, `IHashProvider`), recebidas via injeção no construtor. A composição concreta acontece em `useCases/CreateUser/index.ts`.

## Rodando o projeto

### Pré-requisitos
- Node.js 18+
- pnpm
- Docker (para o Postgres)

### Passos

```bash
# instalar dependências
pnpm install

# subir o Postgres
docker compose up -d

# copiar e preencher as variáveis de ambiente
cp .env.example .env

# aplicar as migrations e gerar o client do Prisma
pnpm prisma:migrate

# rodar em modo watch
pnpm start
```

O servidor sobe em `http://localhost:3000` (configurável via `PORT`).

### Variáveis de ambiente

Validadas em `src/config/env.ts` — a aplicação falha ao subir se alguma estiver ausente ou inválida.

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor HTTP |
| `DATABASE_URL` | Connection string do Postgres |
| `MAILTRAP_HOST` / `MAILTRAP_PORT` / `MAILTRAP_USER` / `MAILTRAP_PASS` | Credenciais do Mailtrap para envio de e-mail |
| `APP_MAIL_NAME` / `APP_MAIL_ADDRESS` | Remetente do e-mail de boas-vindas |

## Testes

```bash
pnpm test
```

Cobertura atual: `CreateUserUseCase` (regra de negócio, incluindo duplicidade de e-mail case-insensitive e resiliência à falha de envio de e-mail) e `CreateUserController` (validação de entrada, sucesso e repasse de erro).

## API

### `POST /user`

Cria um novo usuário e envia um e-mail de boas-vindas (falha no envio não impede a criação do usuário).

**Request**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

**Respostas**
| Status | Quando |
|---|---|
| `201` | Usuário criado |
| `400` | Corpo da requisição inválido (detalhes em `issues`) |
| `409` | Já existe um usuário com esse e-mail (comparação é case-insensitive) |

## Escopo intencional

Este projeto tem propósito de estudo e cobre deliberadamente **apenas** o cadastro de usuário. Autenticação, login, RBAC, paginação e rate limiting foram deixados de fora por não fazerem parte do que está sendo exercitado aqui.
