---
name: playable
description: Build a multiplayer web game that runs on the user's own device, with no cloud backend, no deploy and no accounts — players join over the local network or by a direct peer-to-peer link. Use whenever someone describes a game they want to make and play with other people ("I want a game", "I want to make a game where…", "build me a 2-player game", "can we make a game my friends can join"), or asks to change, extend or debug a game previously built with this skill. Grill the idea in rounds until they confirm a plain-language replay, then scaffold and build with parallel helpers. Assume the user is NOT a programmer: do the technical work for them and talk about the game, not the code.
---

# playable

Turn a plain-language description of a game into a working multiplayer web game
that the user hosts on their own machine.

**The person you are talking to is probably not a programmer.** They can describe
a game and they can follow "open this link". They cannot debug a stack trace, and
they did not ask for one. Talk about the game. Keep the code to yourself.

## The one rule

Everything game-specific lives in **one file: `game.js`**. Everything else —
`core/`, `net.js`, `render-2d/`, `server.mjs` — is plumbing that ships as-is.

If you find yourself editing plumbing to make a game work, stop: either the game
belongs in `game.js`, or you have found a real gap in the templates worth
mentioning to the user rather than patching around.

Shared chrome is already in the templates. Do not rebuild it in `game.js`.

- First visit: a **name** (about 12 characters), then **Create a room** or
  **Join with a room ID**. An invite link skips this and joins with the saved
  name, or Seat N until they set one in settings. Everyone in the room sees
  every name.
- After that: a **settings icon in the top-right**. Room ID, invite link, QR
  code, player count, how the connection feels, **name** (they can change it),
  **language** (Traditional Chinese or English — the host picks, everyone
  follows), optional **card-read and discussion timers** (host clock, same for
  everyone), and **Leave room**. After a round, show who scored and who was
  guesser / knower / 9upper. A failed connection opens the sheet by itself. On
  a phone, stack the join field above the Join button and keep 44pt hit
  targets inside the safe area.
- Look of the chrome: true black ground `#000000`, panels one step up `#111111`,
  nested `#2A2A2A`. No glass, no blur, no resting shadows. The one primary
  control is a white pill with black type. Crimson `#C41E3A` is for data (the
  clock, a selected person, a failed ping), never for buttons or nav. Steel
  `#2B5A8A` is the knower. Keep system type — no webfont, so it still works
  offline. When restyling, follow the personal skill
  `design-taste-frontend` (tasteskill) as teacher: app-screen run, `--keep
  palette,type`. Do not copy that skill into this repo. Draw and inspect
  with `--out ~/.taste-skill/playable` — never a `.taste-skill/` folder here.

## Flow

### 1. Grill

You — the main model — talk to the user. Subagents never interview. Do not
scaffold and do not write `game.js` until they confirm the replay in step 2.

The same pause applies when they ask to **add a feature** to a game that
already exists. Ask through what they want — when it happens, who sees it,
what happens if they skip, and whether anything else belongs in the same
change — then play the feature back and wait. Only then may a programming
subagent start.

Work in **rounds**. Each round is one message: numbered questions you can
already ask, each with a **recommended answer** worded so "yes" accepts it.
Wait before the next round. Phones (and swipe / a little stick / tap the
picture) belong in the **first** round. Never say Canvas2D, Three.js, local
server, WebRTC, virtual joystick, or pointer events.

If they confirm phones but still do not pick a style:

| The game is… | Phone move |
|---|---|
| Hop, grid, race, one step at a time | swipe |
| Chase, wandering / keep moving | stick |
| Taps on cards, people, or a board | they tap the picture — no stick |
| Unsure | stick for a continuous 3D walker; swipe if it is hop-like |

If they name a game, a film, or a repo as a style reference, look it up —
do not ask them to describe it. Keyboard always works on a computer.

See `references/interview.md` for the round format, later-round branches,
and shapes that need reshaping first.

### 2. Confirm the spec

Play the game back in four or five sentences — what is on screen, what the
controls do (including how a phone moves, if anyone is playing on one), what
makes it end. This is the shared-understanding gate: confirm before picking
a transport or scaffolding. Wrong assumptions are cheap here.

### 3. Pick the transport (your decision, not theirs)

| They said | Use | Why |
|---|---|---|
| Same room / same Wi-Fi / "my family" | `--transport=local` | Rock solid, no third parties, works offline |
| Friends elsewhere / "online" / "over Discord" | `--transport=tab` | Direct peer-to-peer, nothing to deploy |
| Not sure | `--transport=local` | Fewer ways to fail; switching later is a rescaffold |

`references/transports.md` has the full tradeoffs, including when `tab` simply
cannot connect.

### 4. Pick a renderer (also your decision)

| They described | Use | Notes |
|---|---|---|
| Depth, hopping, driving, anything "3D" | `--render=3d` | Three.js, orthographic, with a real art layer |
| Top-down, flat, board-like, "simple" | `--render=2d` | Canvas2D, no dependency |
| Nothing visual at all | `--render=3d` | It looks better by default; see below |

**This skill is for Three.js games first.** Prefer `--render=3d` unless they
clearly want a flat board. `--render=3d` ships a palette, four-tone shading,
outlines and contact shadows, so a game looks designed without the user asking.

Be straight about this: **`--render=2d` is a bare canvas context with no art
layer.** Games built on it look like debug output unless you hand-draw
everything. Copy `examples/9upper` when they want a flat board that still
looks designed (black, white, crimson, steel).

### 5. Scaffold

```sh
node skills/playable/scripts/new-game.mjs <dir> --transport=local|tab [--render=2d|3d] \
  [--example=hop|9upper] [--title="…"]
cd <dir> && npm install
```

Pass `--example` only when the user wants to see something working first.
Otherwise the scaffold lands a runnable placeholder you then replace.

Existing examples live in `examples/` at the repo root and are complete,
playable projects — read one before writing a new game:

- **`examples/hop`** — 3D, two-player Crossy Road. **The default reference** for
  the 3D kit, for smooth motion, and for computing world content instead of
  sending it.
- **`examples/9upper`** — titled **9UPPER**. 2D party game, 3–9 players.
  Pointer taps, no stick. Black, white, crimson, steel. Original cards:
  a public proper-noun topic plus category tag, a hidden fact — take a
  published game's shape, not its deck.

### 6. Crew — parallel subagents

You stay the host. Subagents never talk to the user and never edit plumbing
(`core/`, `net.js`, `renderer/`, `server.mjs`, templates).

After the scaffold:

1. **Wave 1**, in **one turn**, in parallel: **Research** (named games /
   films / repos — what to take, what not to copy), **Look** (the 2D or 3D
   drawing plan), **Flow** (phases, state, who may act).
2. Merge the three briefs. If they fight, the confirmed replay and the hop /
   9UPPER contract win.
3. **Wave 2:** Programming writes only `game.js`.

If you cannot launch subagents, do the four jobs yourself as separate passes
in the same order — do not skip to coding.

See `references/crew.md` for prompts and what each brief must contain.

### 7. Write `game.js`

Read `examples/hop` first (or `examples/9upper` for a tap / party board) and
follow its shape. The contract — 3D is the default:

```js
export default {
  title: 'Hop',
  players: { min: 2, max: 4 },
  input: { keys: ['up','down','left','right'], pointer: false, touch: 'swipe' },
  // touch: 'swipe' | 'stick' when phones play; omit if computers only. Keyboard always works.
  view: { units: 15 },                 // 3D: world units of camera height
  // view: { width: 960, height: 540 }, // 2D only: logical pixels
  lerp: { players: ['x', 'y', 'z'] },  // 3D positions. Never scores.

  init()                  { return { players: {} } },  // host: initial state
  onJoin(state, id)       {},                          // host: add a player
  onLeave(state, id)      {},                          // host: remove a player
  step(state, inputs, dt) {},                          // host: advance the game
  draw(g, state, selfId)  {},                          // everyone: render
}
```

For 3D, `g` is a pooled drawing kit rather than a canvas context — every call
takes a stable `id`, and colour is a `hue` plus a four-step `tone`:

```js
g.box({ id: `tree:${row}:${col}`, x, y: 0, z, w: 0.9, h: 1, d: 0.9, hue: 'moss', tone: 'mid' })
g.halo({ id: `tree:${row}:${col}`, x, z, size: 1.5 })
g.follow(me.x, 0, me.z)
g.hud({ topLeft: `lane ${me.gz}` })
```

Read `references/render-3d.md` before writing a 3D game — the id rule, the
hue/tone split, and the lerp rule are the three things that go wrong otherwise.

**The split that matters:** `init`/`onJoin`/`onLeave`/`step` run only on the host,
so they must never touch the DOM. `draw` runs in every browser and must never
change `state`. Violating this produces games that work for the host and glitch
for everyone else — the single most common failure. `references/netcode.md`
explains why.

#### Smooth motion (do this; do not raise the tick rate)

The sim stays at **30Hz**. Screens redraw at 60–120Hz. Motion looks smooth
because named fields are interpolated — not because the host ticks faster. Do
not edit `core/` or `TICK_HZ` to "make it smoother."

- **Always name every moving position in `lerp`.** 3D ground is `x` and `z`;
  include `y` if they hop or jump. 2D is `lerpKeys: ['x', 'y']`.
- **Never lerp scores, coins, lives, "it", or any counter.** Those would render
  as fractions mid-tick.
- **Moving scenery** (cars, waves, patrols): put a `time` clock on state, lerp
  it, and compute positions in `draw` from a **pure** function of
  `(seed, id, time)`. Copy `examples/hop`. Do not send every moving mesh.
- **Stable `id`s every frame** (`tree:12:3`, not an array index) or the pool
  smears and looks like stutter.

```js
lerp: {
  top: ['time'],             // clock that drives computed scenery
  players: ['x', 'y', 'z'],  // 3D player pose
}
```

Practical notes:

- `input.touch` is `'swipe'` or `'stick'` when anyone will play on a phone
  *and the game is about moving*. Swipe is one hop or step per flick; stick
  is a little on-screen stick they hold to keep moving. Omit `touch` when
  only computers will play, or when the game is taps on cards or people —
  then set `pointer: true` and let thumbs hit the picture. Keyboard still
  always works for movement games. The template maps swipe or stick onto the
  same `up`/`down`/`left`/`right` booleans — `step` does not read a separate
  touch object.
- `inputs` is `{ playerId: {up, down, left, right, action, action2, px, py, pressed} }`,
  carrying only the keys declared in `game.input.keys`.
- `dt` is seconds since the last tick. Multiply all movement by it.
- Draw in the fixed `view` coordinate space; it is scaled to fit any screen.
- Keep `state` JSON-serializable — it crosses the network every tick. No
  functions, no `Map`, no `Set`, no class instances.

### 8. Check and hand over

```sh
node skills/playable/scripts/doctor.mjs <dir>
cd <dir> && npm start
```

Then give the user, in plain language:

- the address **they** open,
- the link or code **their friends** open,
- the fact that the game only runs while the terminal (local) or their tab (tab)
  stays open.
- **Create a room**, then the **settings icon** in the top-right: room ID,
  invite link, QR code, and the line that says how the connection **feels**
  (instant / fine / delayed / late). Friends open the link or scan the code.
  That feel line is the delay to the host, not a score.

Tell them to test with two browser windows side by side before inviting anyone.
For a `local` project you can verify it yourself first, without a browser:

```sh
node skills/playable/scripts/smoke-test.mjs <dir>
```

### 9. Iterate

Change requests arrive as "make the red one faster", not as diffs. That is
one programming pass on `game.js`, not a new grill and not a new crew. Tell
them to reload — both players must, because the host is running the
authoritative copy. Re-grill only if they changed what the game *is*.

## Being honest about the limits

Do not promise more than this setup delivers. When it is relevant, say plainly:

- In `tab` mode a free third-party service introduces the players. On some
  networks — many offices, some mobile data — a direct connection **cannot** be
  made at all. The fallback is `local` mode.
- In `local` mode, play beyond the same Wi-Fi needs a tunnel, which makes a port
  on their computer reachable from the internet. **Explain that and get an
  explicit yes before setting one up** — do not quietly open their machine to
  the world.
- Nobody can play while the host's terminal or tab is closed. There is no "the
  game is always online" in this design, and that is the tradeoff for having no
  server to pay for.

`references/troubleshooting.md` covers what to do when a player cannot connect,
the game feels laggy, or the port is busy.
