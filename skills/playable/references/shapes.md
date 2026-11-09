# Catalog of shapes

Pick one before scaffolding. The main model fills that shape's `game.js`.
It does not invent a seventh architecture, and it does not open `examples/hop`
unless the shape is hop.

Scaffold from the skill directory (the folder that contains this file's
parent, `scripts/`, and `shapes/`):

```sh
node <skill-dir>/scripts/new-game.mjs <dir> --transport=local|tab --shape=<name>
```

`--shape` sets the renderer. Do not pass `--render` unless it matches.

| They want | Shape | Render | Phone | Keep in game.js |
|---|---|---|---|---|
| Chase, tag, wander, collect in a small arena | `tag` | 3d | stick | `itId`, `touch: 'stick'` |
| Laps around a short loop | `race` | 3d | stick | `lap`, `touch: 'stick'` |
| Shooting, or a twitch game after the reshape below | `shot` | 3d | stick | `shots`, `'action'`, `touch: 'stick'` |
| One step at a time, cross a road | `hop` | 3d | swipe | `lane`, `rowAt`, `touch: 'swipe'` |
| Tap people, party, bluff, open cards | `party` | 2d | tap the picture | `pointer: true`, import `paper.js` |
| Take turns tapping a grid | `board` | 2d | tap the picture | `turn`, `pointer: true`, import `paper.js` |

"Flat", "top-down", "playground", and "simple" are still `tag` (or `race` /
`shot` / `hop` if that is the verb). The 3D kit already looks down on little
objects. `--render=2d` is only `party` and `board`.

After the scaffold, edit `game.js` only. Change speeds, scores, copy, and
colours. Do not rename the words in the last column — `check-game.mjs`
fails the handover if they disappear, and it fails if `race` / `tag` /
`shot` / `party` / `board` grow a hop lane grid (`lane`, `rowAt`, `carX`).

## Say this, then wait

Use these sentences as the recommended yes. Do not soften them.

**Fighting, FPS, mouse-look, instant hit, precise platformer** — the first
question, before the other grill questions:

> You face the way you move, and one button fires a slow shot. There is no
> mouse-look and no instant hit. Same-room play feels fine; across the
> internet it is mushy, so this is the version that works.

Then scaffold `--shape=shot` only after they accept that.

**Hidden hands, fog of war, "they must not see my card"** — the first
question:

> Everyone's screen receives the whole game. A card can be drawn face-down,
> but that does not stop someone from looking closely. Play it with people
> you trust, or play it in the open.

Do not promise a secret on the wire. Do not edit `core/` to filter
snapshots. If they accept open play or a trust-table game, use `party`.

## What each file already does

- **tag** — one `itId`, that player is faster, a touch hands it over. Score
  is time spent as it. No finish line.
- **race** — four posts. `lap` increments each time a player comes back
  around. First to three wins.
- **shot** — facing is the last move direction. `action` pushes onto
  `shots`. A hit adds to `hits`. First to five wins.
- **hop** — swipe moves one cell. Roads and cars come from `rowAt(seed,
  lane)` and a lerped `time`. Open `examples/hop` only to copy that pure
  clock, not to replace this file with the demo.
- **party** — public vote, tap a person, points on screen. Import
  `renderer/paper.js` (`panel`, `chip`, `button`, `label`, `hit`, `ink`).
- **board** — two players, nine squares, `turn` advances on a tap. Same
  paper import. Ignore the off-turn.

`paper.js` is the 2D art layer (black, white, crimson `#C41E3A`, steel
`#2B5A8A`). Do not paint the starter's dark-blue dots, and do not introduce
a second palette.

## A shape the blocks cannot make

Cars, posts, trees, and people in the six shapes stay boxes, spheres, and
cylinders. Do not open Blender to make those look nicer.

When they want an object that is obviously not one of those — a car, a
person, a tree that is not a box — stop and ask. Recommended yes, in their
words, not as a tool name:

> This shape cannot be built out of blocks. I can make it in Blender and
> drop it into the game. That needs you to connect Blender.

- **No:** build it from `g.box` / `g.sphere` / `g.cylinder` / `g.cone`.
- **Yes, but no Blender tool is connected:** stop. Say Blender is not
  connected yet, in plain language. Do not invent a model, and do not edit
  `core/`.
- **Yes, and a Blender tool is connected:** build an original model there,
  export glTF into the project's `models/`, and place it with `g.model`.
  Do not copy someone else's portfolio models. Collision stays in `step`.

With no Blender, keep stacking blocks. Do not open Mixos Studio, Spline,
KoKraft, CoCraft, Clara.io, or Tinkercad, and do not log in or add their
runtimes. A glTF file does not have to come from Blender: if they already
have their own `.gltf` or `.glb`, put it in `models/` and place it with
`g.model`. Do not build that file for them on another website.

## Check before you hand over a link

```sh
node <skill-dir>/scripts/check-game.mjs <dir>
```

Exit 0 is required. `doctor.mjs` does not replace it.
