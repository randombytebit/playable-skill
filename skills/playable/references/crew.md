# Crew — parallel subagents after the replay is confirmed

You are the **main model**. The user talks only to you. After they confirm the
four-or-five-sentence replay (`references/interview.md`), you launch subagents
to research, plan look and flow, then write `game.js`. You never hand the user
to a subagent.

## You stay the host

- **Only you** grill, confirm, and hand over addresses in plain language.
- **Only you** pick transport + renderer (SKILL tables), scaffold with
  `scripts/new-game.mjs`, run `doctor.mjs` / `smoke-test.mjs`, and edit files
  after merge if briefs conflict.
- Subagents **never** interview the user. They **never** edit `core/`, `net.js`,
  `renderer/`, `server.mjs`, `serve.mjs`, or anything under `templates/`.
- If you cannot launch subagents, still do the four jobs as **separate passes
  in this order**. Do not skip Research / Look / Flow and jump to coding.

## After they confirm the replay

1. Pick `--transport` and `--render` from the SKILL tables. Scaffold. Do **not**
   pass `--example` unless they asked to see hop or 9UPPER first.

```sh
node skills/playable/scripts/new-game.mjs <dir> --transport=local|tab --render=2d|3d
cd <dir> && npm install
```

2. **Wave 1 — one turn, in parallel.** Same message, three Task / subagent
   calls: Research, Look, Flow. Each returns a brief. None of them edit.

3. Merge the three briefs into one page. If they fight, the **confirmed replay**
   and the hop / 9UPPER contract win (`init`/`onJoin`/`onLeave`/`step` never
   touch the DOM; `draw` never mutates state; state is JSON-serializable).

4. **Wave 2 — Programming.** One subagent writes **only** `<dir>/game.js` from
   hop (3D) or 9UPPER (2D tap / party) plus the merged brief.

5. You run doctor + smoke-test (local), then hand over the addresses they and
   their friends open. Talk about the game, not the code.

## Wave 1 jobs

Each brief is **15–25 lines**. Return a brief. Do not edit plumbing.

### Research

If they named a game, film, site, or repo, **go look at it**. Do not guess.

Return: the loop to take, the feel to take, what **not** to copy (title, cards,
art, trademarks). For party games, write **original** cards and names. Cite
**hop** (computed scenery from a seed + clock — do not send every moving mesh)
or **9UPPER** (pointer taps, hidden-info honesty: `draw` hides, the wire does
not) when relevant.

### Look ("2d/3d models")

Not Blender. A drawing plan the programmer can implement in `game.js`. Do not
invent a new renderer.

- **3D:** hues / tones from the kit; stable string ids (`tree:12:3`); what is a
  box / sphere / cylinder; `g.follow` once per frame; no Three addons; no extra
  vendor. Camera in world units (`view.units`).
- **2D:** true black ground `#000000`, white paper, crimson `#C41E3A` on
  data only, steel `#2B5A8A`. Hit targets **44pt+**. Name portrait or
  landscape `view: { width, height }`. No glass, no gradients, no frost.
- Create-a-room, room ID, invite link, and QR already live in the templates.
  Do not draw another status panel.
- Restyling chrome: read `~/.cursor/skills/design-taste-frontend/SKILL.md`
  and `references/app-screens.md`. Deal with `--app --keep palette,type`
  `--out ~/.taste-skill/playable`. Do not vendor that skill. Do not add
  Google Fonts. Never write `.taste-skill/` in the project.

Return 15–25 lines plus a short id list.

### Flow

Phases; who may act in each; `init` state shape (JSON-serializable — no `Map`,
`Set`, or functions); `onJoin` / `onLeave`; how someone wins; what `step` reads
from `inputs` (`up`/`down`/`left`/`right`/`action`/`px`/`py`/`pressed`).

Remind: **no hidden info on the wire.** Every client gets the whole snapshot.
`draw` may hide a card; developer tools still see it. Play with people they
trust, or treat peeking as spoiling.

## Wave 2 — Programming

One subagent. Read `examples/hop/game.js` first (3D) or `examples/9upper/game.js`
(2D tap / party), then write **only** `<dir>/game.js`.

Enforce:

- Host functions never touch the DOM. `draw` never mutates `state`.
- Name every moving pose in `lerp` / `lerpKeys`. Never lerp scores, coins,
  lives, "it", or counters. Do not raise `TICK_HZ`. Do not edit `core/`.
- Moving scenery: a `time` clock on state, lerp it, compute positions with a
  **pure** function of `(seed, id, time)`. Copy hop.
- `touch: 'swipe' | 'stick'` only when phones move a character. Cards / people:
  `pointer: true`, no stick.

## How to prompt each subagent

Fill the blanks. Launch Wave 1 as three calls in one turn.

**Research**

```
Confirmed replay: <four or five sentences>
Render / transport: <2d|3d> / <local|tab>
Project dir: <dir>
They named: <game / film / site / repo, or "none">

Look at what they named. Return a 15–25 line brief: the loop to take, the
feel to take, what not to copy (title, cards, art, trademarks). Original
cards/names for party games. Cite hop (computed scenery) or 9UPPER (pointer
taps, hidden-info honesty) when relevant. Return a brief. Do not edit
plumbing. Do not interview the user.
```

**Look**

```
Confirmed replay: <replay>
Render / transport: <2d|3d> / <local|tab>
Project dir: <dir>

Drawing plan for game.js only — not Blender, not a new renderer.
3D: kit hues/tones, stable ids (tree:12:3), box/sphere/cyl, camera follow,
no Three addons, no extra vendor.
2D: paper #F3EEE4, ink #1C1915, one clay accent #C45C26, 44pt+ hit targets,
portrait or landscape view size.
Return 15–25 lines + a short id list. Return a brief. Do not edit plumbing.
Do not interview the user.
```

**Flow**

```
Confirmed replay: <replay>
Render / transport: <2d|3d> / <local|tab>
Project dir: <dir>

Phases, who may act, init state (JSON only — no Map/Set/functions),
onJoin/onLeave, win, what step reads from input. Remind: no hidden info
on the wire. Return 15–25 lines. Return a brief. Do not edit plumbing.
Do not interview the user.
```

**Programming**

```
Confirmed replay: <replay>
Merged brief: <your one-page merge of Research + Look + Flow>
Render / transport: <2d|3d> / <local|tab>
Project dir: <dir>

Read examples/hop/game.js first (3D) or examples/9upper/game.js (2D tap/party).
Write ONLY <dir>/game.js. Host functions never touch DOM; draw never mutates
state; name moving poses in lerp; never lerp scores; do not raise TICK_HZ;
do not edit core/, net.js, renderer/, server.mjs, or templates.
Do not interview the user. When the file is written, return a short note
of what step and draw do.
```

## Iterate

"Make the red one faster" → you or **one** programming subagent edit `game.js`
only. Tell them both players must reload. Do not re-grill or relaunch the
whole crew unless they changed what the game *is*.
