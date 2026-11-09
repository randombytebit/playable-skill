# Changelog

## Unreleased

- Ground shadows follow the key light: higher objects land softer and further along the ray. `check-halo.mjs` locks that projection.
- A Blender glTF can be placed with `g.model` after the user agrees to connect Blender. The kit stays the default. Collision stays in `game.js`.
- Catalog shapes (`tag`, `race`, `shot`, `hop`, `party`, `board`) live in the skill. Scaffold with `--shape`. The main model fills that `game.js`. One Research brief only when they name an outside title.
- 2D `paper.js` (`panel`, `chip`, `button`) for party and board. A flat chase stays on the 3D kit.
- `check-game.mjs` rejects a starter title, a tick-rate edit, random inside `step`, and a hop lane grid in the wrong shape.
- Grill-style interview before build. The main model does not launch Research, Look, and Flow as the way the game gets written.
- Lobby chrome: create or join a room, then a settings icon with room ID, invite link, QR, and ping.
- Settings: Traditional Chinese or English; optional shared card-read timer. 9UPPER: one guesser, one knower, the rest 9uppers; card closes when the clock hits zero.
- Skill for local multiplayer web games: `local` (WebSocket) and `tab` (WebRTC) transports, Canvas2D and Three.js renderers.
- Examples: `examples/hop` (3D Crossy Road) and `examples/9upper` (2D party).
- Phone input in plumbing: `game.input.touch` is `swipe` or `stick`.
- Lobby shows how the connection feels (ping), not a raw RTT dump.
- Simulation stays at 30Hz; motion is smoothed by named `lerp` fields.
- Shared chrome uses one paper look (lobby, type, 44pt buttons) for 2D and 3D.
