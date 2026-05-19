.PHONY: up down logs ps db-reset db-migrate db-studio

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

db-reset:
	docker compose down -v
	docker compose up -d
	@echo "Aguardando PostgreSQL ficar pronto..."
	@until docker compose exec postgres pg_isready -U locfly_user -d locfly_db > /dev/null 2>&1; do sleep 1; done
	npx prisma migrate dev --schema=packages/database/prisma/schema.prisma

db-migrate:
	npx prisma migrate dev --schema=packages/database/prisma/schema.prisma

db-studio:
	npx prisma studio --schema=packages/database/prisma/schema.prisma
