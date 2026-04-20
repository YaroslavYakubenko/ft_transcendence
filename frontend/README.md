# Frontend (ft_transcendence)

React frontend for the ft_transcendence application based on Vite, TypeScript, React Router, and i18next.

## Configuration Strategy

Frontend configuration lives in ft_transcendence/.env and is intentionally limited to VITE_-prefixed variables. Vite injects those values into the client bundle at build time, so this file must never contain secrets.

- VITE_API_URL should point at the public HTTPS endpoint exposed by Nginx in local development.
- VITE_REDIRECT_URI should match the OAuth callback route served by the frontend.
- VITE_GITHUB_CLIENT_ID and VITE_FORTY_TWO_CLIENT_ID are public OAuth client IDs only.

Server-only values, database credentials, and provider secrets stay in backend/.env.

## Requirements

- Node.js 22+
- npm

## Development

```bash
npm install
npm run dev
```

Default URL in dev mode: http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Linting

```bash
npm run lint
```

## Important Environment Variables

Configuration in ft_transcendence/.env:

- VITE_API_URL: Backend API base (e.g., https://localhost:8443/api)
- VITE_REDIRECT_URI: OAuth callback URL
- VITE_GITHUB_CLIENT_ID: GitHub OAuth Client ID
- VITE_FORTY_TWO_CLIENT_ID: 42 OAuth Client ID

## Routing Overview

- /login
- /register
- /home
- /profile
- /profile/edit
- /friends
- /lobby
- /game
- /leaderboard
- /users/:id
- /oauth/callback

## Architecture Notes

- Auth context manages token and user state.
- API layer is located under src/api.
- Internationalization via i18next in src/i18n.

## Known Limitations

- Chat is currently a placeholder in the frontend.
- Game statistics/leaderboard currently use mock data.
- Additional hardening steps are required for production deployment.

## Why This Stack

- Vite gives fast feedback during frontend development and keeps the build pipeline simple.
- React fits the route-heavy, interactive UI and works well with reusable widgets and shared state.
- TypeScript helps keep API contracts, auth state, and page props explicit.
- React Router matches the app's multi-page flow without forcing a full meta-framework.
- i18next supports the multilingual UI requirements with a clear translation structure.
