# ft_transcendence (Docker setup)

This project uses Docker to run the Django backend, PostgreSQL database, React frontend, and Nginx reverse proxy together in a reproducible development environment.

---

## Overview

The application runs as a multi-container setup:

- **frontend** → React + Vite SPA
- **backend** → Django API  
- **db** → PostgreSQL database  
- **nginx** → reverse proxy with HTTPS  

All services are orchestrated using Docker Compose.

---

## Project structure (relevant parts)

| File / Folder            | Purpose                          |
|--------------------------|----------------------------------|
| docker-compose.yml       | Defines all services             |
| backend/                 | Django backend                   |
| backend/Dockerfile       | Builds Django container          |
| backend/entrypoint.sh    | Handles backend startup logic    |
| backend/requirements.txt | Python dependencies              |
| backend/.env             | Backend configuration            |
| ft_transcendence/        | React frontend                   |
| ft_transcendence/Dockerfile | Builds frontend container   |
| ft_transcendence/.env    | Frontend configuration           |
| .env                     | Docker Compose / DB config       |
| nginx/                   | Reverse proxy config + TLS       |

---

## Setup

Clone the repository and create environment files & run:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp ft_transcendence/.env.example ft_transcendence/.env

docker compose up --build