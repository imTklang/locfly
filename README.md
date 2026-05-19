# LocFly

Plataforma de busca e comparação de preços de aluguel de veículos no Brasil.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, Vite, TailwindCSS 4, shadcn/ui, Zustand, TanStack Query, Zod |
| Backend | Express 5, TypeScript, Zod, Prisma ORM, BullMQ, Pino |
| Scrapers | Playwright + stealth, Crawlee (HttpCrawler) |
| Banco | PostgreSQL 15, Redis 7 |
| Monitoramento | Sentry, Pino |

## Comandos

```bash
# Infraestrutura
docker compose up -d          # Sobe PostgreSQL + Redis

# Desenvolvimento
npm run dev:api               # API em http://localhost:4000
npm run dev:web               # Frontend em http://localhost:5173

# Banco de dados
npm run db:migrate            # Roda migrações Prisma
npm run db:studio             # Abre Prisma Studio
npm run db:generate           # Gera Prisma Client

# Scrapers
cd packages/scrapers
npm run test:localiza         # Testa scraper Localiza
npm run test:movida           # Testa scraper Movida
npm run test:unidas           # Testa scraper Unidas
npm run test:all              # Testa todos os scrapers
```

## Estrutura

```
apps/
  api/        # Express backend (porta 4000)
  web/        # React frontend (porta 5173)
packages/
  database/   # Prisma schema + migrations
  scrapers/   # Scrapers Playwright por locadora
  shared/     # Tipos TypeScript compartilhados
```

## Preferências de código

- TypeScript strict em todos os módulos (`"strict": true`)
- Zod para validação de entrada e saída (forms, API responses)
- Sem `any` implícito
- Sem `console.log` em produção — usar Pino (`logger.info`, `logger.error`)
- Componentes React funcionais, sem classes
- shadcn/ui como base de UI; customizar via `className`, não sobrescrever os componentes
- Erros de scraper nunca silenciados em produção — logar e enviar para Sentry

## Locadoras integradas (MVP)

| Locadora | Estratégia | Status |
|---|---|---|
| Localiza | API pública `GruposCarros/Brasil/resumo` | Dados reais (modelos + imagens) |
| Movida | Fallback frota estática | Cloudflare bloqueia headless |
| Unidas | Playwright + fallback estático | Angular CDK bloqueia headless |

## Variáveis de ambiente

Copie os arquivos `.env.example` antes de iniciar:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp packages/database/.env.example packages/database/.env
```
