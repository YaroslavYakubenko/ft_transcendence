# ft_transcendence (Docker setup)

This project uses Docker to run the Django backend, PostgreSQL database, and Nginx reverse proxy together in a reproducible development environment.

---

## Overview

The application runs as a multi-container setup:

- **backend** → Django API  
- **db** → PostgreSQL database  
- **nginx** → reverse proxy with HTTPS  

All services are orchestrated using Docker Compose.

---

## Project structure (relevant parts)

| File / Folder            | Purpose                          |
|--------------------------|----------------------------------|
| docker-compose.yml       | Defines all services             |
| backend/Dockerfile       | Builds Django container          |
| backend/entrypoint.sh    | Handles startup logic            |
| backend/requirements.txt | Python dependencies              |
| backend/.env             | Django configuration             |
| .env                     | Docker Compose configuration     |
| nginx/                   | Reverse proxy config + TLS       |

---

## Setup

Clone the repository and create environment files & launch

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up --build