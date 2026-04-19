## Backend (Docker)

| File               | Job                 |
| ------------------ | ------------------- |
| docker-compose.yml | run everything      |
| Dockerfile         | build backend       |
| requirements.txt   | install Python deps |
| entrypoint.sh      | control startup     |
| .env               | config              |
| settings.py        | apply config        |

### Setup

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up --build

## Health checks and restart behavior

The Docker setup includes health checks for the backend and PostgreSQL services.

- **PostgreSQL** uses `pg_isready` to report healthy status.
- **Backend** uses the `/api/health/` endpoint to report healthy status.
- The backend depends on the database being healthy before startup.
- Both services use `restart: unless-stopped` for better reliability during development.

### Verification

docker compose restart db
docker compose restart backend
docker compose ps