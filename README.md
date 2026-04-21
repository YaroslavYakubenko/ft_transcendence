# ft_transcendence

Multi-container setup with Django backend, PostgreSQL, React frontend (Vite), and Nginx as HTTPS reverse proxy.

## Architecture

- frontend: React + TypeScript + Vite
- backend: Django + Django REST Framework
- db: PostgreSQL 16
- nginx: Reverse proxy with local self-signed certificates

Orchestration is managed via Docker Compose.

## Configuration Strategy

This repository uses three separate environment files on purpose:

- .env: Docker Compose interpolation and shared local database defaults
- backend/.env: Django runtime settings, database connection, and OAuth secrets
- frontend/.env: Frontend-only Vite variables exposed to the browser

Rules of thumb:

- Keep secrets out of the frontend env file because Vite variables are bundled into client-side code.
- Keep backend secrets and server-only settings in backend/.env.
- Keep the root .env limited to values Docker Compose needs before containers start.
- Use localhost HTTPS URLs in development so the frontend talks to Nginx, not directly to Django.

## Relevant Directories

- backend: Django project incl. API
- frontend: React frontend
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
cp frontend/.env.example frontend/.env
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
- Frontend cannot reach API: check frontend/.env and VITE_API_URL.
- OAuth not working: verify client IDs and secrets in backend/.env and frontend/.env.
- HTTPS warning in browser: normal for local self-signed certificates.

## Security

- Never commit production secrets.
- The provided certificates are only suitable for local development.

## Why This Stack

- Django provides a mature auth, ORM, and admin foundation for user- and profile-heavy applications.
- Django REST Framework keeps the API layer straightforward while staying close to Django's data model.
- PostgreSQL fits the relational data model for accounts, friendships, tokens, and game-related records.
- React with TypeScript gives a maintainable UI layer with explicit types for API and state handling.
- Vite keeps frontend development fast with a lightweight dev server and quick rebuilds.
- Nginx centralizes HTTPS termination and reverse proxying so the browser sees one stable entry point.
- Docker Compose makes the backend, frontend, database, and proxy reproducible across local machines.