# allu invest - Avaliacao de Experiencia de Investimento

Desafio tecnico para vaga de Desenvolvedor(a) Full Stack Pleno na allu.

## Status

Projeto em desenvolvimento. Este README sera expandido conforme as etapas avancam.

- [x] Setup de infraestrutura (Docker, PostgreSQL, Prisma, NestJS, Vite)
- [x] Schema de dados (avaliacoes, notas por criterio, anexos, log de auditoria)
- [ ] Autenticacao e autorizacao (JWT RS256, RBAC)
- [ ] Dominio (aggregate Avaliacao, regras de negocio)
- [ ] Casos de uso (submeter, moderar, listar)
- [ ] API REST (controllers, DTOs)
- [ ] Frontend (React)
- [ ] Testes automatizados
- [ ] Documentacao final de decisoes arquiteturais

## Stack

Backend: NestJS + TypeScript + Prisma + PostgreSQL
Frontend: React + TypeScript + Vite
Infra local: Docker Compose

## Como rodar

```powershell
docker compose up -d
cd backend
pnpm install
pnpm run start:dev
```

Backend sobe em http://localhost:3000/api

## Autor

Ediller Watzek Aureliano
