---
name: playable
description: >-
  Build a multiplayer web game on the user's own device — no cloud, no
  deploy, no accounts. Use when friends play together on the same Wi-Fi,
  in the same room (living room, park), or somewhere else by a direct link,
  room code, or QR; when they want to open a room, join from a phone, or
  change, extend, or debug a game this skill already built (a failed join,
  a late connection, moves that feel late). Do not use it for a solo
  polished Three.js showcase, a game to deploy (Netlify or any host), an
  FPS, mouse-look, an instant hit, a precise platformer, or a real hidden
  hand — reshape those into shot or an open party, or say this skill does
  not do them. Grill in rounds until they confirm a five-sentence replay
  (what is on screen, how you move including a phone, the pressure, how it
  ends, the first thing that happens). Pick one shape (tag, race, shot,
  hop, party, board) and fill only that game.js. A small change is one
  edit to game.js, then check-game. A different kind of game is a new
  scaffold; do not turn tag into hop in the same file. Hand over the
  address they open and the link or QR their friends open. The game runs
  only while their terminal (same Wi-Fi) or tab (friends elsewhere) stays
  open. Ask them to try two browser windows before inviting anyone. The
  user is not a programmer: talk about the game, not the code. If they
  write in Traditional Chinese, answer in Traditional Chinese and keep
  technical names in English.
---

# playable

Turn a plain-language description into a working multiplayer web game that
the user hosts on their own machine.

**The person you are talking to is probably not a programmer.** Talk about
the game. Keep the code to yourself.

## The four rules

1. Do not scaffold, do not write `game.js`, and do not launch a subagent
   until they confirm the five-sentence replay in `references/interview.md`.
2. After that, edit **only `game.js`**. If the game needs a change in
   `core/`, `net.js`, `renderer/`, `server.mjs`, or `templates/`, stop and
   say so. That is a template gap, not a patch in their project.
3. Tell them the address they open and the link their friends open. No
   stack traces, no library names.
4. Pick **one** shape from `references/shapes.md` before you scaffold.
   If the request is a fight, an FPS, a precise platformer, or a real
   secret, the first question is the reshape sentence in that file. Do not
   invent a seventh architecture.

You — the main model — grill, scaffold, edit `game.js`, run `check-game`,
and hand over the link. Subagents do not interview. A subagent is allowed
only when they name a game, film, or repo that is not already this catalog:
one Research brief (what to borrow, what not to copy), then you still fill
the chosen shape yourself. See `references/crew.md`. Do not launch
Research, Look, and Flow as the way the game gets written.

## Flow

### 1. Classify, then grill

Read `references/shapes.md` and `references/interview.md`. Work in rounds.
Each round is one message: numbered questions, each with a recommended
answer worded so "yes" accepts it. Wait. Never say Canvas2D, Three.js,
local server, WebRTC, virtual joystick, or pointer events.

The shape picks the renderer. "Flat", "top-down", "playground", and
"simple" stay on the 3D kit unless the shape is `party` or `board`.
`--render=2d` is only those two. Do not ask them to choose a renderer.

Phones belong in the first round, in plain language. The shape already
knows the move: stick (`tag`, `race`, `shot`), swipe (`hop`), or tap the
picture (`party`, `board`). Keyboard still works on a computer.

### 2. Confirm the replay

Read the five-sentence replay in `references/interview.md`. The sentences
are what is on screen, how you move (including a phone, if anyone is on
one), the pressure, how it ends, and the first thing that happens. Confirm
before scaffolding.

### 3. Pick the transport (your decision)

| They said | Use |
|---|---|
| Same room / same Wi-Fi / "my family" | `--transport=local` |
| Friends elsewhere / "online" / "over Discord" | `--transport=tab` |
| Not sure | `--transport=local` |

`references/transports.md` has the tradeoffs. Do not ask them to pick.

### 4. Scaffold that shape

Scripts and shapes live **next to this SKILL.md**, not in the user's
project and not under `examples/`.

```sh
node <skill-dir>/scripts/new-game.mjs <dir> --transport=local|tab --shape=tag|race|shot|hop|party|board
cd <dir> && npm install
```

Do not pass `--render` (the shape sets it) or `--example` (that copies a
demo and skips the shape check). Do not open `examples/hop` unless the
shape is hop. Do not open `examples/9upper` to clone it; `party` is the
file you fill.

### 5. Fill `game.js`

The scaffold already copied the shape. Change rules, scores, and words.
Keep the tokens `references/shapes.md` lists, or `check-game` will fail.
Read `references/feel.md` before you tune a speed, a hit, a coin, or a
win. Feedback stays in `game.js` with the kit that file names.

`init` / `onJoin` / `onLeave` / `step` run only on the host and must not
touch the DOM. `draw` runs everywhere and must not change `state`. State
stays JSON. Name moving positions in `lerp`. Never lerp scores. Do not
raise the tick rate. `references/netcode.md` says why. For 3D drawing,
read `references/render-3d.md` before you add a mesh.

Blocks first: `g.box`, `g.sphere`, `g.cylinder`, `g.cone`. The shapes
already are those. Ask about Blender only when they want an object the
blocks cannot be — a car, a person, a tree that is not a box. Say this,
and wait. Do not say "MCP":

> This shape cannot be built out of blocks. I can make it in Blender and
> drop it into the game. That needs you to connect Blender.

If they say no, stack blocks. If they say yes and no Blender tool is
connected, stop and tell them Blender is not connected yet. Do not fake
the model. If they say yes and it is connected, build an original glTF
into `models/` and place it with `g.model`. See `references/shapes.md`.

With no Blender, keep stacking blocks. Do not open Mixos Studio, Spline,
KoKraft, CoCraft, Clara.io, or Tinkercad, and do not log in or add their
runtimes. A glTF file does not have to come from Blender: if they already
have their own `.gltf` or `.glb`, put it in `models/` and place it with
`g.model`. Do not build that file for them on another website.

### 6. Check, then hand over

```sh
node <skill-dir>/scripts/check-game.mjs <dir>
node <skill-dir>/scripts/doctor.mjs <dir>
```

Read `references/done.md` and answer every line before you hand over a
link. You have not seen the game in a browser. Say that, and ask them to
try two windows. Do not give them an address until `check-game` exits 0.
A starter title, a hop lane grid inside `race` / `tag` / `shot`, or
`Math.random()` inside `step` is a failed game, not a finished one.

For a `local` project you can also run, without a browser:

```sh
node <skill-dir>/scripts/smoke-test.mjs <dir>
```

Then, in plain language: the address **they** open, the link or code
**their friends** open, and that the game runs only while the terminal
(`local`) or their tab (`tab`) stays open. **Create a room**, then the
**settings icon** in the top-right: room ID, invite link, QR code, and
how the connection **feels**. Ask them to try two browser windows before
inviting anyone.

### 7. Iterate

"Make the red one faster" is one edit to `game.js`, then `check-game`
again. Both players reload. Grill again only if they changed what the
game *is* — including a request that belongs to a different shape. Do
not morph `tag` into `hop` inside the same file. Scaffold the new shape.

## Limits worth saying out loud

- `tab` mode cannot connect on some office and mobile networks. The
  fallback is `local`.
- Play beyond the same Wi-Fi needs a tunnel. Explain that and get an
  explicit yes before opening a port.
- Nothing stays online after the host closes the terminal or tab.
- Every client receives the whole state. Face-down is not a secret.
- Fast twitch is mushy. Offer `shot` or a slower `tag` / `race`.
- There is no sound. A request for sound is a template gap: stop and say
  so. Do not add an audio library, a paid API, or sound bytes inside
  `state`.

`references/troubleshooting.md` covers a failed join, a late connection,
and a busy port.

## Chrome you do not rebuild

The templates already show a name, Create / Join, and a settings icon
(room ID, invite link, QR, names, Traditional Chinese or English, optional
card timers, Leave). Ground `#000000`, panels `#111111`, nested `#2A2A2A`.
White pill, black type. Crimson `#C41E3A` is for data, never buttons.
Steel `#2B5A8A` is the knower. System type only, so it works offline.
2D games draw with `renderer/paper.js`. Do not restyle the lobby unless
they asked, and do not copy another design skill into this repo.
