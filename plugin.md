# Integrate Python chess backend as WebSocket game engine

## Description

We want to move chess game logic out of the client and into the Python backend. React should only render the board and send user actions, while the backend owns the canonical game state and validates every move.

## Current state

- The React UI already has a chess screen in [ft_transcendence/src/pages/GamePage.tsx](ft_transcendence/src/pages/GamePage.tsx).
- The current Python chess prototype lives in [tabading_chess/main.py](tabading_chess/main.py), [tabading_chess/movement.py](tabading_chess/movement.py), and [tabading_chess/helpers.py](tabading_chess/helpers.py).
- The backend currently exposes auth and social endpoints, but no chess endpoints yet. Relevant entry points are [backend/backend/urls.py](backend/backend/urls.py) and [backend/backend/settings.py](backend/backend/settings.py).

## Goal

- React renders the chessboard and sends move attempts.
- Python backend validates moves with python-chess.
- Game state is shared through the backend, not stored in the frontend.
- Use HTTP first for the MVP, then add WebSockets for real-time multiplayer.

## Proposed approach

- Extract or reimplement the chess logic as a backend service that works with FEN, move requests, and move validation.
- Add HTTP endpoints for:
  - create game
  - get current game state
  - submit move
  - resign and draw actions
- Add WebSocket support afterwards for:
  - real-time board sync
  - opponent move updates
  - game start/end events
- Persist game state by game_id, using either database rows or cache storage.

## Suggested data contract

- Client to server move request:
  - game_id
  - from_square
  - to_square
  - promotion piece if needed
- Server to client state update:
  - FEN
  - move history
  - legal move list or move validation result
  - current turn
  - check / checkmate / draw status
  - winner if the game ended

## Acceptance criteria

- A game can be initialized from the backend and the frontend receives an initial FEN.
- Legal moves are accepted by the backend.
- Illegal moves are rejected by the backend.
- React updates from backend state only.
- The backend path is ready for WebSockets once the HTTP version is working.
- The web app does not depend on pygame at runtime.

## Implementation notes

- Do not try to plug the pygame loop directly into React.
- Treat [tabading_chess](tabading_chess) as prototype/reference code, not as the web runtime.
- Keep the chess engine logic backend-owned and UI-agnostic.
- Add the frontend API layer in [ft_transcendence/src/api/game.ts](ft_transcendence/src/api/game.ts) and connect it in [ft_transcendence/src/pages/GamePage.tsx](ft_transcendence/src/pages/GamePage.tsx).

## Notes

If we want, the next step is to split this into concrete backend and frontend tasks, or scaffold the first WebSocket-ready chess endpoint.
