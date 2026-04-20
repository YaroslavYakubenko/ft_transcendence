# ft_transcendence

Multi-container setup with Django backend, PostgreSQL, React frontend (Vite), and Nginx as HTTPS reverse proxy.

## Architecture

- frontend: React + TypeScript + Vite
- backend: Django + Django REST Framework
- db: PostgreSQL 16
- nginx: Reverse proxy with local self-signed certificates

Orchestration is managed via Docker Compose.

## Relevant Directories

- backend: Django project incl. API
- ft_transcendence: React frontend
- nginx: Nginx configuration and TLS certificates
- docker-compose.yml: Service definitions

## Requirements

- Docker + Docker Compose
- Available ports: 5173, 8000, 8080, 8443, 5432

## Quick Start

1. Create env files from templates.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp ft_transcendence/.env.example ft_transcendence/.env
```

2. Build and start the stack.

```bash
docker compose up --build
```

3. Check status.

```bash
docker compose ps
```

## Service URLs

- Frontend (Vite Dev Server): http://localhost:5173
- Backend directly: http://localhost:8000
- Nginx HTTP: http://localhost:8080
- Nginx HTTPS: https://localhost:8443
- Healthcheck via Nginx: https://localhost:8443/api/health/

Note: Browsers will display a warning for self-signed certificates.

## Useful Commands

```bash
docker compose down
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
docker compose exec backend python manage.py migrate
```

## API Overview

Currently implemented endpoints:

- POST /api/auth/register/
- POST /api/auth/login/
- GET /api/auth/me/
- POST /api/auth/logout/
- POST /api/auth/oauth/
- PATCH /api/users/me/
- DELETE /api/users/me/delete/
- GET /api/users/<id>/
- GET /api/friends/
- POST /api/friends/<id>/
- DELETE /api/friends/<id>/remove/
- GET /api/health/

## Project Status

Areas that are currently incomplete:

- Chat backend is not yet implemented.
- Game statistics and leaderboard currently use mock data in the frontend.
- Test coverage is still being built.

## Troubleshooting

- Port already in use: check available ports and stop processes if needed.
- Frontend cannot reach API: check ft_transcendence/.env and VITE_API_URL.
- OAuth not working: verify client IDs and secrets in backend/.env and ft_transcendence/.env.
- HTTPS warning in browser: normal for local self-signed certificates.

## Security

- Never commit production secrets.
- The provided certificates are only suitable for local development.