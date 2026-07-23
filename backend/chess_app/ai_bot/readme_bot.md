# How the Chess Bot Works

## Overview

The bot is a **minimax chess engine with alpha-beta pruning**, deliberately handicapped to play imperfectly and vary by difficulty — not a "perfect" engine. It lives entirely on the backend (`backend/chess_app/ai_bot/`) and reuses the exact same game-creation and move-submission endpoints as a normal human-vs-human game, rather than having its own separate code path.

```
backend/chess_app/
├── views.py              ← integration points: create_game, make_move, _play_bot_move
└── ai_bot/
    ├── minimax.py         ← search algorithm, move ordering, difficulty randomness
    └── evaluation.py      ← scores a board position
```

## Where the bot enters the game

**1. Game creation** (`create_game`) — if `opponent == 'bot'`, a real `User` row (`chess-bot@transcendence.local`) is fetched or created and assigned to whichever color the player didn't pick. If the bot is White, it makes the opening move immediately, in the same request that creates the game.

**2. Every subsequent turn** (`make_move`) — after the human player's move is validated and saved, the view calls `_play_bot_move(game)` before returning the response. The bot's reply comes back in the *same* HTTP response as the player's own move — there's no separate polling or push involved.

```
Player submits a move
        │
        ▼
make_move validates + saves it
        │
        ▼
_play_bot_move(game) is called
        │
        ▼
Bot's move is computed, validated, and saved
        │
        ▼
Single response returned: { player's new fen, bot_move, result, ... }
```

## How a move is actually chosen

### 1. Evaluate the board (`evaluation.py`)
Every position gets a numeric score:
- **Material count** — pawns=100, knights/bishops≈320-330, rooks=500, queens=900, using standard relative piece values.
- **Piece-square tables** for knights, pawns, and bishops — small bonuses/penalties depending on *where* a piece sits (e.g. knights are worth less on the rim, more toward the center; pawns are worth more as they advance).
- **Checkmate/stalemate** are scored as extreme values (±99999) or exactly 0, so the search always prefers a forced win and avoids a forced draw when a win is available.

### 2. Search ahead (`minimax_alpha_beta`)

**What minimax actually does.** Chess is adversarial — a move that looks great right now can be a disaster one move later if the opponent has a strong reply. Minimax handles this by assuming *both* sides play their best possible move, alternating turns, down to a fixed depth:

- On the bot's turn (the "maximizing" side in the code), it picks whichever move leads to the **highest** score.
- On the opponent's turn (the "minimizing" side), it assumes they'll pick whichever move leads to the **lowest** score — i.e., the worst outcome *for the bot*.
- This alternates recursively until `depth == 0` (the search limit) or the game is actually over, at which point `evaluate_fen` scores whatever position is left on the board.
- The score then "bubbles back up" through each recursive call: at every minimizing level the smallest child score wins, at every maximizing level the largest child score wins, until you're left with one number representing "the best outcome the bot can guarantee, assuming the opponent doesn't cooperate."

Concretely, in the code, `find_best_move` tries each of the bot's own candidate moves, then calls `minimax_alpha_beta` starting from the *opponent's* perspective (`maximizing=False`) to find out how the opponent would best respond — and picks whichever of the bot's own moves leaves the opponent with the worst best-response.

**Why this matters in practice:** without looking ahead, the bot would just grab the best-looking capture in front of it and could walk straight into a losing counter-capture the very next move. Minimax is what lets it ask "yes, but what happens after that?" a few moves deep before committing.

**What alpha-beta pruning does.** A full minimax search explores *every* possible sequence of moves down to the depth limit — which grows explosively (roughly 20-35 legal moves per position, compounding every ply). Alpha-beta pruning is an optimization that skips branches that can't possibly change the final decision, without changing the result at all — it's not an approximation, it's the same answer, just faster to reach.

It works by tracking two running values while searching:
- **alpha** — the best score the maximizing side (the bot) has found so far, anywhere in the search.
- **beta** — the best score the minimizing side (the opponent) has found so far.

The prune happens here, in both branches of the code:
```python
if beta <= alpha:
    break
```
The logic: if, while exploring the opponent's replies to some bot move, you find a reply so good for the opponent (`beta`) that it's already at least as good for them as a move the bot could get elsewhere (`alpha`) — the bot would simply never choose this branch in the first place, since it already has a better guaranteed option. So there's no need to keep checking the opponent's *remaining* replies in that branch; whatever they are, they can't change the fact that the bot will avoid this branch entirely. The search "cuts off" there and moves on.

**Why move ordering makes this dramatically more effective:** pruning only cuts off *later* moves in a branch once a strong enough alpha/beta value has already been found. If the actual best move in a position happens to be checked *last*, nothing gets pruned along the way there — you still explore almost everything. That's exactly why `order_moves` checks captures/checks/promotions first: strong moves tend to be found early, `alpha`/`beta` tighten up quickly, and far more of the remaining, weaker-looking branches get skipped entirely. In practice this is the difference between a search that's fast enough to run inline in an HTTP request, and one that isn't.

### 3. Move ordering (`order_moves`)
Before searching, moves are sorted so captures, checks, and promotions are considered first, with a small bonus for moves toward the center. This isn't about picking the move directly — it's what makes alpha-beta pruning actually effective, since pruning works best when the strongest moves are evaluated early.

### 4. Difficulty = search depth + intentional randomness

| Difficulty | Search depth | Chance of *not* playing the top move |
|---|---|---|
| Easy | 1 ply | 40% chance to pick randomly from the top 3 moves |
| Medium | 2 ply | 20% chance to pick randomly from the top 2 moves |
| Hard | 3 ply | 5% chance to pick randomly from the top 2 moves |

This is the deliberate "make it human, not perfect" mechanism: depth alone would make Easy just "worse at seeing ahead," but the added randomness means even a shallow search occasionally throws in a visibly suboptimal move, and even Hard isn't flawless. Nothing here ever picks a move outside `board.legal_moves`, so it can *play* badly, but it can never play *illegally*.

## Difficulty selection — how it reaches the bot

The lobby's easy/medium/hard selector is sent with the game-creation request, stored on `Game.difficulty` (a real column), and read directly (`game.difficulty`) inside `_play_bot_move` when the depth and randomness profile are picked for that game.

*(Historical note: this was broken for a while — the field was added, then a later migration accidentally removed it, and the code was never updated to match, so every bot game silently played at "medium" regardless of what was selected. This has since been fixed by re-adding the field, wiring it through `create_game`, and reading it directly instead of falling back to a default.)*

## Legality, check, checkmate, castling, promotion, en passant

None of this is custom-built — it's all delegated to the `python-chess` library:
- `board.legal_moves` already excludes anything illegal, including moves that would leave your own king in check.
- Castling, en passant, and promotion are all just specific `Move` objects that `python-chess` generates and validates as part of `legal_moves` — the bot doesn't need any special-case code for them.
- `board.is_checkmate()` / `is_stalemate()` / `is_check()` are used directly to determine game-over conditions and score them in `evaluation.py`.

This is why the bot is described as playing "only legal moves" with confidence — legality isn't something this project reimplements, it's inherited for free from a well-tested chess library.

## Result handling

Whatever happens after the bot's move — ongoing, check, checkmate, stalemate — is fed back through the same `check_gameover`/`update_player_stats` logic used for human games, so bot games contribute to stats, match history, and the leaderboard identically to a human-vs-human game, with no separate code path to keep in sync.