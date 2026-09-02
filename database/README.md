# Banco PostgreSQL

Crie um banco chamado `sistema_empresa` e aplique o schema:

```bash
psql -U postgres -d sistema_empresa -f database/schema.sql
```

Na raiz do projeto, copie `.env.example` para `.env` e ajuste `DATABASE_URL`, `JWT_SECRET` e os dados do administrador.

Depois crie o primeiro administrador e inicie a API:

```bash
npm run seed:admin
npm run api
```

A API ficará disponível em `http://localhost:3000`. O endpoint `GET /api/health` confirma a conexão com o PostgreSQL.