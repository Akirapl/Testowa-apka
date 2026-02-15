# CLAUDE.md

## Project Overview

Nokia 3310 Snake — a browser-based clone of the classic Snake game from Nokia 3310.
Built as a single-file HTML5/Canvas application optimized for mobile browsers.

## Tech Stack

- **HTML5 Canvas** for rendering (pixelated, Nokia-style green screen)
- **Vanilla JavaScript** (ES5+ IIFE, no frameworks or build tools)
- **CSS3** for Nokia phone UI shell and responsive layout
- Pure static site — no build step, no dependencies, no bundler

## File Structure

```
/
├── index.html   # Complete game (HTML + CSS + JS in one file)
├── README.md    # Project description
└── CLAUDE.md    # This file
```

## How to Run

Open `index.html` in any browser. No server required — works via `file://` protocol.
For mobile testing, serve with any static server (e.g. `python3 -m http.server 8000`).

## Game Features

- 16x16 grid, Nokia green-screen color palette (`#7b8c3e` bg, `#2d3a1a` pixels)
- Wall collision and self-collision detection
- Progressive speed increase as the snake eats food
- High score persistence via `localStorage`
- Polish UI text (Wynik, Koniec Gry, Nowy Rekord)

## Controls

| Input       | Action                          |
|-------------|---------------------------------|
| Swipe       | Change snake direction (mobile) |
| Tap         | Start / restart game (mobile)   |
| D-pad btns  | On-screen Nokia-style buttons   |
| Arrow keys  | Direction (desktop)             |
| WASD        | Direction (desktop)             |
| Enter/Space | Start / restart (desktop)       |

## Key Code Conventions

- All game logic is wrapped in an IIFE to avoid globals
- Game loop uses `setInterval` with dynamic speed adjustment
- Direction input is buffered in `nextDirection` to prevent same-tick reversals
- Touch handling uses `pointer` events for buttons and `touch` events for swipe area
- Canvas uses `image-rendering: pixelated` for crisp retro look

## Constants (tuning)

| Constant         | Value | Description                     |
|------------------|-------|---------------------------------|
| `GRID_SIZE`      | 20    | Pixel size of one grid cell     |
| `COLS` / `ROWS`  | 16    | Grid dimensions                 |
| `SPEED_INITIAL`  | 180ms | Starting tick interval          |
| `SPEED_MIN`      | 80ms  | Fastest possible tick interval  |
| `SPEED_DECREASE` | 3ms   | Speed gained per food eaten     |
