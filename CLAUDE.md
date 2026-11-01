# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This repo **is a Claude Code skill**, not an application. Its product is
`skills/playable/`, which teaches Claude to build multiplayer web games that run
on the user's own device — no cloud backend, no deploy, no accounts.

Two audiences, and keeping them straight prevents most confusion:

- **This file** is for Claude working *on the skill*.
- **`skills/playable/SKILL.md`** is for Claude working *with* the skill, on behalf
  of a non-programmer who wants a game.

Nothing in `templates/` ever runs in this repo. It is copied into a user's new
project by `scripts/new-game.mjs`. Editing a template does **not** change any game
that already exists — including the projects in `examples/`, which are copies.

`examples/` holds complete, runnable game projects. Their `game.js` is the
**source of truth** for that example: `--example=<name>` resolves against
`examples/<name>/game.js` first, falling back to `templates/examples/` so a
standalone copy of `skills/playable/` still works. Do not keep a second copy of
an example's `game.js` under `templates/` — they drift.

When a user wants a game, the skill's runtime is grill then crew waves — not
a single agent dumping `game.js`. The model that loaded `SKILL.md` interviews
in rounds (`references/interview.md`) until they confirm a replay, then
scaffolds and launches research / look / flow in parallel, then programming
writes only `game.js` (`references/crew.md`). Keep those procedures in the
reference files. Do not collapse the skill back into one-shot generation.

Chrome and restyles follow the personal skill
`~/.cursor/skills/design-taste-frontend` (tasteskill) as teacher: app-screen
run, `--keep palette,type`, no glass, colour on data. Do **not** copy that
skill into this repo. Draw and inspect with
`--out ~/.taste-skill/playable`. Never create a `.taste-skill/` folder here.

## Commands

```sh
# Scaffold a game project (the skill's main entry point)
node skills/playable/scripts/new-game.mjs <dir> --transport=local|tab [--render=2d|3d] \
  [--example=hop|9upper]

# Check a scaffolded project: Node, port, files, renderer, vendored libs, game.js
node skills/playable/scripts/doctor.mjs <dir>

# End-to-end test of a local-transport project — no browser needed.
# The regression test for anything in templates/core/ or transport-local/.
node skills/playable/scripts/smoke-test.mjs <dir>

# Hop's game-specific logic, including the purity of its world functions
(cd examples/hop && node logic-test.mjs)
```

Full verification loop after touching templates — run it for **both** renderers,
since they share `core/` but nothing else:

```sh
for r in 2d 3d; do
  rm -rf /tmp/check-$r
  node skills/playable/scripts/new-game.mjs /tmp/check-$r --transport=local --render=$r
  (cd /tmp/check-$r && npm install)
  node skills/playable/scripts/smoke-test.mjs /tmp/check-$r
done
node skills/playable/scripts/smoke-test.mjs examples/hop
node skills/playable/scripts/smoke-test.mjs examples/9upper
(cd examples/hop && node logic-test.mjs)
```

Templates are copied, so a fix in `templates/render-3d/` must also be synced
into any `examples/*/renderer/` you want to keep current.

**Nothing visual is verifiable in this environment** — there is no browser,
Playwright or Puppeteer. `node --check`, a served-module-graph test, and pure
math probes (tone luminance, `EdgesGeometry` line counts) are the ceiling. Say
so rather than implying a game was seen running.

There is no build step, no bundler, no lint config, and no test framework. The
browser loads ES modules directly; `smoke-test.mjs` is the test suite. Keep it
that way — a toolchain is one more thing standing between a non-coder and a
working game.

## Architecture

### Generated projects expose exactly one file

A scaffolded game is `game.js` plus plumbing:

```
game.js          <- the ONLY game-specific file; the one thing Claude writes
core/            <- loop, protocol, input, lobby, wiring
net.js           <- the chosen transport, copied from transport-local|tab/
renderer/        <- the chosen renderer, copied from render-2d/ or render-3d/
vendor/          <- browser builds copied out of node_modules on postinstall
server.mjs       <- local transport only: static files + authoritative sim
serve.mjs        <- tab transport only: static files, no game logic
```

Both the transport and the renderer land at **fixed paths** (`net.js`,
`renderer/`) so `core/main.js` imports one unchanging set of specifiers and
never branches on which was chosen.

If making a game work requires editing anything but `game.js`, that is a gap in
the templates. Fix the template and re-verify — do not special-case the project.

Phone movement is declared in `game.js` as `input.touch: 'swipe' | 'stick'`.
The template maps it onto the existing direction booleans. Do not patch
`core/input.js` per project.

### The transport seam

`core/main.js` imports `../net.js` with no idea which transport provided it. Both
implement one interface (documented in `templates/core/protocol.js` for the wire
format, and in `SKILL.md` for the shape):

```
role, selfId, roomCode
onPeerJoin, onPeerLeave, onInput, broadcastState, reject   // host side
onState, sendInput                                        // client side
close
```

Adapters implement **every** method, stubbing the half that does not apply, so
`main.js` never branches on transport. Breaking this seam is what would make a
future 3D renderer or transport expensive, so treat it as load-bearing.

### Host authority, and the split that breaks games

One machine simulates; everyone else renders snapshots at 30Hz.

- `local`: the authority is the Node process. The host's own browser is *just a
  client*.
- `tab`: the authority is the host's browser tab, which is also a client.

`core/host-loop.js` must stay free of both DOM and Node APIs — that is the only
reason the same simulation runs in a server and a browser tab. Do not import
`node:*` or touch `window` in it.

**The rule to enforce in every generated game:** `init`/`onJoin`/`onLeave`/`step`
run host-only and must not touch the DOM; `draw` runs everywhere and must not
mutate state. A mutation inside `draw` changes the game for the host alone and
silently does nothing for everyone else. See `references/netcode.md`.

### The 3D renderer is a pooled façade

`game.draw` is immediate mode; Three.js is retained mode. `render-3d/kit.js`
bridges them by keying every call to a stable `id`, reusing the mesh behind it,
hiding whatever went undrawn, and evicting entries unused for ~3 seconds. That
eviction is not optional — a scrolling world mints ids without bound.

Geometries are unit-sized and shared; size comes from per-instance scale.
Materials are cached by `hue:tone`; building one per frame recompiles shaders
and stutters. Never dispose geometries or materials in the eviction path —
they are shared caches, and disposing one breaks every other object using it.

`g.sphere` is deliberately coarse (10×6). Border lines come from
`EdgesGeometry`, so a smoother sphere has **no outline at all** — measured, it
drops to zero lines at 12×8. If you change a geometry's segment count, re-check
its edge count.

### Interpolation is intentionally narrow

`core/client-loop.js` smooths only the fields the game names — never everything,
because lerping arbitrary numbers renders scores as fractions mid-tick.

Two declaration forms, both supported: `lerpKeys: ['x','z']` (3D) or
`['x','y']` (2D) reaches `state.players` entries; the fuller
`lerp: { top: [...], players: [...], … }` also reaches top-level fields and
other keyed collections. Default keys are `['x','y','z']` so a 3D game that
forgets to declare lerp still glides on the depth axis. `top` exists so a
clock can be smoothed, which is what makes `examples/hop`'s computed cars glide.
The host interpolates from cloned snapshots like every other tab — do not
raise `TICK_HZ` to chase smoothness.

### Computing world content instead of sending it

`examples/hop` sends no cars. Each road row carries a seed, car positions are a
pure function of `(row, k, time)` in `game.js`, and the host calls it for
collision while every client calls it for rendering. Snapshots went from an
estimated ~120 moving entities to **246 bytes/tick**.

This is the pattern to reach for when a game has more moving scenery than
players. Its one hard requirement: the function must be **pure**. No
`Math.random()`, no `Date.now()`, no reading state. Host and client disagreeing
means players see different worlds, and it is miserable to debug.

### Dependencies

Each transport pulls exactly one: `ws` (local) or `peerjs` (tab). `--render=3d`
adds `three`. Anything the browser needs as a plain file is copied out of
`node_modules` into `vendor/` by `templates/vendor-deps.mjs` on `postinstall`.

Which build gets vendored is not arbitrary:

- `peerjs/dist/peerjs.min.js` — the self-contained IIFE. `dist/bundler.mjs` has
  bare imports and cannot load without a bundler.
- `three/build/three.module.js` **and** `three.core.js` — the former imports the
  latter by relative path, so both must land side by side. Neither has bare
  imports, which is what makes a bundler unnecessary. Three.js *addons*
  (`OrbitControls` and friends) import bare `'three'` and would force an import
  map — avoid them.

Vendoring also keeps a project deployable to any static host with no runtime CDN
call, and playable on a LAN with no internet at all.

## Writing for the end user

The person the skill serves is not a programmer. In anything user-facing —
`SKILL.md`, lobby messages, server output, generated READMEs — describe the game
and the next action, never the mechanism. Error paths matter most: a failed
WebRTC connection must say what to try, because a blank canvas tells them nothing.

Be straight about the limits rather than letting them be discovered mid-game:
`tab` mode cannot connect on some networks, tunnels expose a port on their
machine, and nothing is playable once the host closes the terminal or tab. These
are documented in `references/troubleshooting.md` and should stay documented.
