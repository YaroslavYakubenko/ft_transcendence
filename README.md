# ft_transcendence

Multicontainer-Setup mit Django-Backend, PostgreSQL, React-Frontend (Vite) und Nginx als HTTPS-Reverse-Proxy.

## Architektur

- frontend: React + TypeScript + Vite
- backend: Django + Django REST Framework
- db: PostgreSQL 16
- nginx: Reverse Proxy mit lokalen Self-Signed Zertifikaten

Orchestrierung erfolgt über Docker Compose.

## Relevante Ordner

- backend: Django-Projekt inkl. API
- ft_transcendence: React-Frontend
- nginx: Nginx-Konfiguration und TLS-Zertifikate
- docker-compose.yml: Service-Definitionen

## Voraussetzungen

- Docker + Docker Compose
- Freie Ports: 5173, 8000, 8080, 8443, 5432

## Schnellstart

1. Env-Dateien aus Vorlagen erstellen.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp ft_transcendence/.env.example ft_transcendence/.env
```

2. Stack bauen und starten.

```bash
docker compose up --build
```

3. Status prüfen.

```bash
docker compose ps
```

## Service-URLs

- Frontend (Vite Dev Server): http://localhost:5173
- Backend direkt: http://localhost:8000
- Nginx HTTP: http://localhost:8080
- Nginx HTTPS: https://localhost:8443
- Healthcheck via Nginx: https://localhost:8443/api/health/

Hinweis: Browser zeigen bei Self-Signed Zertifikaten eine Warnung.

## Nützliche Kommandos

```bash
docker compose down
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
docker compose exec backend python manage.py migrate
```

## API-Überblick

Derzeit implementierte Endpunkte:

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

## Projektstatus

Bereiche, die aktuell noch unvollständig sind:

- Chat-Backend ist nicht implementiert.
- Spielstatistiken und Leaderboard laufen im Frontend aktuell mit Mock-Daten.
- Testabdeckung ist noch im Aufbau.

## Troubleshooting

- Port bereits belegt: freie Ports prüfen und ggf. Prozesse stoppen.
- Frontend kann API nicht erreichen: ft_transcendence/.env und VITE_API_URL prüfen.
- OAuth funktioniert nicht: Client-IDs und Secrets in backend/.env und ft_transcendence/.env prüfen.
- HTTPS-Warnung im Browser: bei lokalen Self-Signed Zertifikaten normal.

## Sicherheit

- Niemals produktive Secrets committen.
- Die bereitgestellten Zertifikate sind nur für lokale Entwicklung geeignet.