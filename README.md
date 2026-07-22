*This project has been created as part of the 42 curriculum by jastomme, yyakuben, jfischer, tabading.*

# Table of Contents
- [Description](#description)
	- [Team Information](#team-information)
	- [Project Management](#project-management)
	- [Technical Stack](#technical-stack)
	- [Database Schema](#database-schema)
	- [Features List](#features-list)
	- [Modules](#modules)
	- [Individual Contributions](#individual-contributions)
- [Instructions](#instructions)
- [Resources](#resources)
- [Additional Information](#additional-information)

# Description

**ft_transcendence** is a real-time, browser-based chess platform built for the 42 curriculum's `ft_transcendence` project. It lets registered users play chess against each other in real time, over WebSockets, from separate devices, or against a built-in AI opponent with three difficulty levels — while also providing the full surrounding social/account layer the subject requires: profiles, friends, live presence, chat, match history, a leaderboard, multi-language support, and a monitored, containerized deployment.

### Goal
Deliver a single-page web application that satisfies the `ft_transcendence` mandatory requirements (secure account system, a real, playable game, HTTPS everywhere, containerized single-command deployment) and reaches the required 14 module points through a coherent set of Major and Minor modules built around the chess game.

### Key Features
- Account creation, profile management, and account deletion
- Secure authentication (hashed + salted passwords) and OAuth 2.0 login via GitHub and 42
- Real-time chess: play a live game against another user on a different device, or against an AI opponent (easy / medium / hard)
- Friends system with live online-status tracking
- Real-time chat between users, over WebSocket
- Game statistics, match history, and leaderboard
- Game customization: board themes, piece themes, timer modes, color selection
- 4 supported languages (English, German, Russian, Arabic) with right-to-left layout support for Arabic
- Health checks, automated database backups, and a Prometheus + Grafana monitoring stack
- Fully containerized with Docker Compose, served entirely over HTTPS through an Nginx reverse proxy

## Team Information

| Login | Role(s) | Responsibilities |
|---|---|---|
| jastomme | PO/PM, Developer| Project management; Docker/monitoring infrastructure; chess bot (AI opponent) |
| yyakuben | Frontend, Developer | Base frontend architecture; OAuth; i18n/RTL; game stats & match history |
| jfischer | Backend, Developer | Database implementation; chat feature; friends feature; WebSockets; remote (live) multiplayer |
| tabading | Game, Developer | Chess implementation; game customization; gamification-adjacent features |

## Project Management

- **Workflow:** Started by planning out responsibilities as a team, then held regular meetings to check on progress throughout development.
- **Tools used:** GitHub (issues / project board) for task tracking / backlog management.
- **Communication:** Slack.
- **Work breakdown:** Pull-based workflow: During organization team members could select roles, responsibilities and modules according to their own preferences.
- **Code review process:** All team members reviewed and tested not only their own, but also other members contributions respectiveley

## Technical Stack

- **Frontend:** React + TypeScript, built with Vite. Chosen for a strongly-typed, component-based SPA with a fast local dev loop.
- **Backend:** Django + Django REST Framework. Chosen for its mature built-in auth/ORM/admin tooling, which suits an account- and profile-heavy application.
- **Database:** PostgreSQL 16. Chosen over SQLite for its relational integrity, concurrency handling, and production-readiness; SQLite is kept only as an optional local fallback (`USE_SQLITE=True`).
- **Real-time layer:** Django Channels + Redis — Redis backs the Channels layer (WebSocket pub/sub for chat, presence, and live chess moves) and also directly tracks per-user connection counts for online-status accuracy.
- **Chess logic:** `python-chess` — used deliberately instead of a hand-rolled rules engine, since the project's goal is building the surrounding platform/website, not reimplementing chess move-legality from scratch.
- **Reverse proxy:** Nginx, terminating HTTPS with a local self-signed certificate and forwarding to the frontend/backend containers.
- **Monitoring:** Prometheus + Grafana, with node_exporter, cAdvisor, and an Nginx exporter feeding it.
- **Styling:** Tailwind CSS.
- **Containerization:** Docker Compose, orchestrating 11 services (see [Additional Information](#additional-information) for the full list).

## Database Schema

Core models and their relationships:

- **User** (custom `AbstractBaseUser`): email (unique, login field), username, avatar, OAuth avatar URL, online status, email verification flag, plus embedded game stats (wins/losses/draws, ELO, win streak).
- **Friendship**: `from_user` → `to_user`, both FKs to `User`; a `unique_together` constraint prevents duplicate friend requests.
- **ChatMessage**: `sender` / `recipient` FKs to `User`, message text, timestamp, read flag.
- **EmailVerificationToken**: one-to-one with `User`, UUID token.
- **Game** (chess): FKs to `white_player` / `black_player` (both `User`, nullable until a slot is filled), `status`/`result`/`timer`/`difficulty` fields, current FEN board state, timestamps.
- **Move**: FK to `Game`; from/to squares, promotion piece, FEN snapshots before/after the move, ordered by `move_number`.

```
User ──< Friendship >── User        User ──< ChatMessage >── User
  │                                                  │
  └──< Game (white_player) >──┐                      │
  └──< Game (black_player) >──┴── Game ──< Move       └── EmailVerificationToken (1:1)
```

## Features List

| Feature | Owner(s) | Description |
|---|---|---|
| Account creation, modification, deletion | yyakuben | Register, update, delete Account |
| Profile & statistics | yyakuben, tabading | Profile page with avatar, wins/losses/draws/ELO/streak, Achievements |
| Friend system | jfischer | Add/remove friends, live online-status |
| Chess vs. other users (remote/live) | jfischer, tabading | Real-time WebSocket-driven 1v1 chess between two devices |
| Chess vs. AI bot, 3 difficulties | jastomme, tabading | Minimax-based bot with difficulty-scaled randomness (easy/medium/hard) |
| Basic chat feature | jfischer | Real-time 1:1 chat over WebSocket |
| Leaderboard | yyakuben | Ranking based on ELO/wins |
| 4 languages (en/de/ru/ar) | yyakuben | Full i18n with RTL support for Arabic |
| Monitoring stack | jastomme | Prometheus + Grafana with custom dashboard and alert rules |
| Health checks / backup & restore | jastomme | `/api/health/`, `/api/status/`, `backup_db.sh`/`restore_db.sh` |
| Privacy Policy / Terms of Service pages | tabading | Real, substantive content, linked in-app |

## Modules

> Major = 2 points, Minor = 1 point. Minimum required: 14 points. Rows below are cross-checked against the subject's own module definitions, not just the team's initial list — two originally-listed rows were removed with an explanation, since they don't hold up against either the subject text or the current code.

| Module | Type | Pts | Contributor(s) | Notes |
|---|---|---|---|---|
| Frontend & Backend framework (React + Django) | Major | 2 | jfischer, yyakuben | Matches "use a framework for both frontend and backend" |
| Real-time features (WebSocket) | Major | 2 | jfischer | Django Channels + Redis; chat, presence, and live chess moves, with server-side move validation |
| User Interaction (chat, profile, friends) | Major | 2 | jfischer, yyakuben | Real chat backend (not a frontend placeholder), friends + online status, profile page |
| User Management & Auth | Major | 2 | yyakuben | Profile update/delete, avatar upload, hashed+salted passwords (`pbkdf2_sha256`) |
| Web-based game (Chess) | Major | 2 | tabading | Full legal-move engine via `python-chess`: checkmate/stalemate/castling/promotion/en passant |
| AI Opponent | Major | 2 | jastomme | Minimax with difficulty-scaled randomness. **Verify before defense:** confirm the difficulty-selection fix (migration + `create_game`/`_play_bot_move` wiring) is deployed, and that easy/medium/hard visibly differ |
| Remote players (separate devices, live) | Major | 2 | jfischer | Reconnection logic, server-authoritative state sync. Disconnect handling currently relies on a client-side timer rather than a server-enforced timeout — be ready to explain this if asked |
| Monitoring (Prometheus + Grafana) | Major | 2 | jastomme | Real scrape configs, alert rules, provisioned dashboard, multiple exporters |
| ORM (Django ORM) | Minor | 1 | jfischer | Used throughout, no raw SQL |
| Remote OAuth 2.0 (GitHub + 42) | Minor | 1 | yyakuben | CSRF-safe state validation, verified-email requirement |
| Aditional browser support | Minor | 1 | yyakuben | Firefox and Google  |
| Complete notification system | Minor | 1 | yyakuben | Creation, update and deletion actions |
| Multi-language support (en/de/ru/ar) | Minor | 1 | yyakuben | 4 languages, above the 3-language minimum |
| RTL support (Arabic) | Minor | 1 | yyakuben | Working `dir=rtl` + Tailwind `rtl:` variants; verify *every* page mirrors, not just Navbar/chat, since the subject requires "complete layout mirroring" |
| Health check/status page + backups | Minor | 1 | jastomme | `/api/health/`, `/api/status/`, working backup/restore scripts |
| Game stats & match history | Minor | 1 | yyakuben | Wins/losses/draws/ELO/streak, match history |
| Game customization | Minor | 1 | tabading, yyakuben | Board theme, piece theme, timer mode, color, each with defaults |
| Gamification System | Minor | 1 | tabading, yyakuben | Achievements, leaderboard, ELO rating |

| **Total** | | **26** | | 8 Majors (16) + 10 Minors (10) — comfortably clears the 14-point minimum |


## Individual Contributions

### yyakuben
- Contributions: Built the full base frontend architecture the rest of the team worked from; OAuth integration; i18n/RTL; game stats & match history.
- Challenges faced: [PLACEHOLDER]

### jastomme
- Contributions: Full DevOps setup (Docker Compose stack, monitoring with Prometheus/Grafana, health checks, backups); chess bot / AI opponent.
- Challenges faced: jump starting DevOps without prior knowledge of Docker because of dropout of one team member. Wiring the bot into a complex logic front & backend.

### jfischer
- Contributions: Database schema/implementation; chat feature; friends feature; WebSocket infrastructure (Channels + Redis) powering presence, chat, and live multiplayer chess.
- Challenges faced: [PLACEHOLDER]

### tabading
- Contributions: Chess game implementation in frontend and backend (rules, legal moves, promotion/castling/en passant via `python-chess`); game customization (piece themes); gamification-adjacent features.
- Challenges faced: learning how to use the diffrent languages, establishing the connection between front and back over Django 

# Instructions

## Prerequisites
- Docker and Docker Compose
- Free local ports: 3000, 5173, 5432, 8000, 8080, 8081, 8443, 9090, 9100
- A GitHub OAuth App and/or 42 intra OAuth app (only required if you want to test OAuth login — see [Additional Information](#additional-information) for the exact variables needed)

## Setup

1. **Create environment files from the provided templates:**
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Fill in `backend/.env` and `frontend/.env` with real values where needed (database credentials are pre-filled with local defaults; OAuth client IDs/secrets are only required if testing OAuth login).

2. **Build and start the full stack:**
```bash
docker compose up --build
```
This starts all 11 services (frontend, backend, database, Redis, Nginx, and the monitoring stack) in the correct dependency order, applies database migrations automatically, and collects static files — no manual steps required beyond this command.

3. **Check that everything is healthy:**
```bash
docker compose ps
```

4. **Open the application:**
```
https://localhost:8443
```
Your browser will show a certificate warning — this is expected, since the project uses a local self-signed certificate for development. Proceed past the warning to reach the app.

## Useful Commands

```bash
docker compose down                          # stop everything
docker compose logs -f backend               # tail backend logs
docker compose exec backend python manage.py migrate   # run migrations manually
```

See [Additional Information](#additional-information) for the full service URL list, OAuth configuration details, backup/restore commands, and troubleshooting steps.

# Resources

### Classic References
- [Django documentation](https://docs.djangoproject.com/)
- [Django REST Framework documentation](https://www.django-rest-framework.org/)
- [Django Channels documentation](https://channels.readthedocs.io/)
- [React documentation](https://react.dev/)
- [Vite documentation](https://vitejs.dev/)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
- [python-chess documentation](https://python-chess.readthedocs.io/)
- [Redis documentation](https://redis.io/docs/)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Prometheus documentation](https://prometheus.io/docs/)
- [Grafana documentation](https://grafana.com/docs/)
- [Nginx documentation](https://nginx.org/en/docs/)
- [python-chess documentation](https://python-chess.readthedocs.io/en/latest/)
- [react-chessboard documentation](https://react-chessboard.vercel.app/?path=/docs/get-started--docs)
- [PLACEHOLDER: add any specific tutorials/articles the team actually followed, e.g. for the minimax chess AI, Django Channels + Redis presence tracking, or the OAuth flow]

### How AI Was Used

AI assistance (an LLM-based coding assistant) was used during this project for the following tasks. This section should be reviewed and adjusted by the team to accurately reflect actual usage before the defense, since evaluators may ask about this directly.

- **Code review / security auditing:** reviewing the codebase against the evaluation rubric and the subject PDF, and identifying specific issues such as: the WebSocket token being passed as a URL query parameter, missing `@permission_classes` on several chess API endpoints, a race condition risk in bot move handling, and a bug where the bot-difficulty setting was read from the request but never persisted to the database.
- **Debugging guidance:** step-by-step help diagnosing why bot difficulty wasn't affecting gameplay (tracing it to a migration that added, then removed, the `Game.difficulty` field without updating the code that depended on it), and why a console error appeared on logout (a race between token invalidation and an in-flight request).
- **Implementation guidance:** suggesting specific code changes (e.g., the migration and view changes to fix bot difficulty and how to expose the app to another device on the same network).
- **Documentation:** drafting/restructuring this `README.md` against the evaluation rubric, and writing a separate `devops.md` explaining the Docker/monitoring setup in plain language.
- **Module/rubric cross-checking:** comparing the team's claimed module list against the subject's actual module definitions, which surfaced two modules that don't hold up as claimed (see the note under [Modules](#modules)).

AI was **not** used to generate the core game logic, the chess AI's move-selection algorithm, or the primary application features themselves — those were implemented by the team members listed under [Individual Contributions](#individual-contributions). [PLACEHOLDER: the team should adjust this paragraph to be precise about what was and wasn't AI-assisted, since this is exactly what an evaluator may probe on.]

# Additional Information

## Architecture

- Frontend: React + TypeScript + Vite
- Backend: Django + Django REST Framework
- Database: PostgreSQL 16
- Nginx: reverse proxy with local self-signed certificates

Orchestration is managed via Docker Compose, across 11 services: frontend, backend, db, redis, nginx, nginx_exporter, prometheus, grafana, node_exporter, cadvisor, mailhog.

## Configuration Strategy

This repository uses three separate environment files on purpose:

- `.env`: Docker Compose interpolation and shared local database defaults
- `backend/.env`: Django runtime settings, database connection, and OAuth secrets
- `frontend/.env`: Frontend-only Vite variables exposed to the browser

Rules of thumb:
- Keep secrets out of the frontend env file, since Vite variables are bundled into client-side code.
- Keep backend secrets and server-only settings in `backend/.env`.
- Keep the root `.env` limited to values Docker Compose needs before containers start.
- Use localhost HTTPS URLs in development so the frontend talks to Nginx, not directly to Django.

## Data Persistence

The primary application database is PostgreSQL, persisted through the named Docker volume `postgres_data`.

- Game records, user stats, match history, leaderboard data, friendships, and auth tokens live in PostgreSQL.
- Uploaded media is persisted separately in the `media_data` volume.
- SQLite is only available if `USE_SQLITE=True` is set explicitly in `backend/.env`, as a local-only fallback.

## Relevant Directories

- `backend`: Django project incl. API
- `frontend`: React frontend
- `nginx`: Nginx configuration and TLS certificates
- `prometheus`: Prometheus scrape config and alert rules
- `grafana`: Grafana provisioning and dashboards
- `docker-compose.yml`: service definitions

## Service URLs

- Frontend (Vite dev server): `http://localhost:5173`
- Backend directly: `http://localhost:8000`
- Nginx HTTP: `http://localhost:8080`
- Nginx HTTPS: `https://localhost:8443`
- Healthcheck via Nginx: `https://localhost:8443/api/health/`

## API Overview

Currently implemented endpoints:

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`
- `POST /api/auth/logout/`
- `GET /api/auth/oauth/state/?provider=github|42`
- `POST /api/auth/oauth/`
- `PATCH /api/users/me/`
- `DELETE /api/users/me/delete/`
- `GET /api/users/<id>/`
- `GET /api/users/<id>/stats/`
- `GET /api/users/<id>/matches/`
- `GET /api/leaderboard/`
- `GET /api/friends/`
- `POST /api/friends/<id>/`
- `DELETE /api/friends/<id>/remove/`
- `POST /create-game/`
- `POST /resign/`
- `POST /make-move/`
- `POST /do-promotion/`
- `POST /legal-moves/`
- `GET /api/health/`
- `GET /api/status/`

## OAuth Flow (GitHub + 42)

This project uses a backend-managed OAuth flow with state validation to prevent CSRF/login swapping.

**Required environment variables — `backend/.env`:**
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `FORTY_TWO_CLIENT_ID`, `FORTY_TWO_CLIENT_SECRET`
- `OAUTH_REDIRECT_URI` (example: `http://localhost:5173/oauth/callback`)

**Required environment variables — `frontend/.env`:**
- `VITE_API_URL` (example: `/api` in local dev with the Vite proxy)
- `VITE_REDIRECT_URI` (must match `OAUTH_REDIRECT_URI`)
- `VITE_GITHUB_CLIENT_ID`, `VITE_FORTY_TWO_CLIENT_ID`

Important: the redirect URI configured in the GitHub/42 developer consoles must exactly match `OAUTH_REDIRECT_URI`, and the frontend/backend redirect URIs must match each other.

**End-to-end sequence:**
1. User clicks "Login with GitHub" or "Login with 42" on `/login`.
2. Frontend calls `GET /api/auth/oauth/state/?provider=<provider>`.
3. Backend stores a one-time state value in session and returns it.
4. Frontend redirects the user to the provider's authorize URL with that state.
5. Provider redirects to `/oauth/callback` with `code` + `state`.
6. Frontend sends provider/code/state to `POST /api/auth/oauth/`.
7. Backend validates state, exchanges the code for an access token, fetches the user's profile/email, creates/updates the local user, and returns a DRF auth token.
8. Frontend stores the token and fetches `/api/auth/me/`.

**Security notes:** OAuth state is one-time and session-bound; GitHub login only accepts a verified primary email; provider requests use timeouts; cookie policy is DEBUG-aware.

**Troubleshooting:**
- OAuth callback fails immediately → check `VITE_REDIRECT_URI` and `OAUTH_REDIRECT_URI` match exactly.
- Provider returns `redirect_uri` mismatch → update the callback URL in the provider dashboard.
- State validation fails → make sure the frontend calls `/api/auth/oauth/state/` first, with credentials included on both calls.


## Troubleshooting

- Port already in use → check which ports are free and stop conflicting processes.
- Frontend cannot reach API → check `frontend/.env` and `VITE_API_URL`.
- OAuth not working → verify client IDs/secrets in `backend/.env` and `frontend/.env`.
- HTTPS warning in browser → expected, this is a local self-signed certificate.

## Security Notes

- Never commit production secrets; `.env` files are git-ignored, only `.env.example` templates are tracked.
- The provided TLS certificates are only suitable for local development.

## Database Backup and Restore

```bash
./scripts/backup_db.sh
./scripts/restore_db.sh backups/<backup-file>.sql
curl -k https://localhost:8443/api/status/
```
Use the backup script before major schema changes or when moving data between environments.

## Monitoring

Prometheus scrapes backend metrics, Nginx exporter metrics, Node Exporter host/system metrics, and cAdvisor container metrics.

- Prometheus: `http://localhost:9090` (loopback only)
- Grafana: `http://localhost:3000` (loopback only) — fresh volumes start with `admin`/`admin`
- Node Exporter: `http://localhost:9100`
- cAdvisor: `http://localhost:8081`
- adminer (dbGUI) `http://localhost:8082`

Grafana is auto-provisioned with a Prometheus data source and a starter dashboard (CPU, memory, disk, uptime). Config lives in `prometheus/prometheus.yml` (scrape targets) and `prometheus/alerts.yml` (alert rules).