# Docker Setup Documentation

## Services

### Backend (Django)
- Runs on internal port `8000`
- Uses PostgreSQL when environment variables are present
- Automatically:
  - waits for DB
  - runs migrations
  - collects static files
  - starts the server

---

### Database (PostgreSQL)
- Uses official `postgres:16` image
- Configured via root `.env`
- Data is persisted using a Docker volume

---

### Reverse Proxy (Nginx)
- Handles incoming traffic
- Provides HTTPS (local, self-signed)
- Routes requests to Django backend

---

## HTTPS Reverse Proxy

### Behavior
- HTTP: `http://localhost:8080`
- HTTPS: `https://localhost:8443`
- HTTP requests are redirected to HTTPS
- Nginx forwards requests to Django (`backend:8000`)

Django is configured to trust the proxy via:

```python
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
```

# Local Development Setup Documentation

## TLS Certificates (Local Development)

Self-signed certificates are used for development:

- `nginx/certs/local.crt`
- `nginx/certs/local.key`

Note: Browsers will show a security warning for self-signed certificates in local development.

---

## Media (Avatars)

User-uploaded files are stored in:
`/app/media/avatars`


### Persistence

Media files are backed by a Docker volume:
`media_data`


Files persist across:
- Container restarts
- Image rebuilds
- Full stack restarts

---

## Health Checks and Restart Behavior

### Health Checks

The services include built-in health checks:

- **PostgreSQL** → uses `pg_isready`
- **Backend** → endpoint: `/api/health/`
- **Nginx** → validates configuration and HTTPS endpoint

---

### Restart Policy

All services use:
`restart: unless-stopped`


---

### Dependency Handling

- **Backend** waits for a healthy database
- **Nginx** waits for a healthy backend

---

## Verification

### Check Service Status

```bash
docker compose ps
```

### Test HTTPS Endpoint

```bash
curl -k https://localhost:8443/api/health/
```

### Test HTTP -> HTTPS Redirect

```bash
curl -I http://localhost:8080/api/health/
```

### Test Restart Reliability

```bash
docker compose restart db
docker compose restart backend
docker compose ps
```