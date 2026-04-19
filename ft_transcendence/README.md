# Frontend (ft_transcendence)

React-Frontend der ft_transcendence-Anwendung auf Basis von Vite, TypeScript, React Router und i18next.

## Voraussetzungen

- Node.js 22+
- npm

## Entwicklung

```bash
npm install
npm run dev
```

Standard-URL im Dev-Modus: http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Linting

```bash
npm run lint
```

## Wichtige Umgebungsvariablen

Konfiguration in ft_transcendence/.env:

- VITE_API_URL: Backend-API-Basis (z. B. https://localhost:8443/api)
- VITE_REDIRECT_URI: OAuth-Callback-URL
- VITE_GITHUB_CLIENT_ID: GitHub OAuth Client-ID
- VITE_FORTY_TWO_CLIENT_ID: 42 OAuth Client-ID

## Routing-Überblick

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

## Architekturhinweise

- Auth-Kontext verwaltet Token + Userzustand.
- API-Layer liegt unter src/api.
- Mehrsprachigkeit über i18next in src/i18n.

## Bekannte Limitierungen

- Chat ist im Frontend derzeit als Platzhalter angelegt.
- Spielstatistiken/Leaderboard nutzen aktuell Mock-Daten.
- Für produktiven Betrieb sind zusätzliche Hardening-Schritte erforderlich.
