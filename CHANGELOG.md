# Changelog

## Unreleased

- Grill-style interview before build; the main model launches research / look / flow in parallel, then programming writes `game.js`.
- Lobby chrome: create or join a room, then a settings icon with room ID, invite link, QR, and ping.
- Settings: Traditional Chinese or English; optional shared card-read timer. 9UPPER: one guesser, one knower, the rest 9uppers; card closes when the clock hits zero.
- Skill for local multiplayer web games: `local` (WebSocket) and `tab` (WebRTC) transports, Canvas2D and Three.js renderers.
- Examples: `examples/hop` (3D Crossy Road) and `examples/9upper` (2D party).
- Phone input in plumbing: `game.input.touch` is `swipe` or `stick`.
- Lobby shows how the connection feels (ping), not a raw RTT dump.
- Simulation stays at 30Hz; motion is smoothed by named `lerp` fields.
- Shared chrome uses one paper look (lobby, type, 44pt buttons) for 2D and 3D.
