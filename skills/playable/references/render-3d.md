# The 3D renderer

Scaffold with `--render=3d`. The renderer lands at `renderer/` either way, so
`core/main.js` is identical for both — only `game.draw` changes.

## The drawing kit

`draw(g, state, selfId)` gets a `g` with these calls. No Three.js in `game.js`.

The sim stays at 30Hz. If it moves on screen, name that field in `lerp` — do
not raise the tick rate. See **Smooth motion** below.

```js
g.box({ id, x, y, z, w, h, d, hue, tone, ry, rx, outline })
g.cylinder({ id, x, y, z, r, h, hue, tone, ry, rx })
g.cone({ id, x, y, z, r, h, hue, tone, rx })
g.sphere({ id, x, y, z, r, hue, tone })
g.halo({ id, x, z, size })        // soft contact shadow
g.follow(x, y, z)                 // point the camera; call once per frame
g.hud({ topLeft, topRight, center, bottom })  // text, drawn in the DOM
```

**`y` is the bottom of the solid, not its centre.** Games think in "sitting on
the ground"; the kit converts. `y: 0` rests on the ground plane.

Axes: `x` is left/right, `z` is forward/back (away from the camera), `y` is up.

## Every call needs a stable id

The kit pools objects by `id` and reuses the mesh behind it, because rebuilding
a scene graph 60 times a second allocates thousands of objects and stutters.
Ids must be **stable across frames** and **unique within a frame**:

```js
g.box({ id: `tree:${row}:${col}`, … })   // good — same tree, same id, every frame
g.box({ id: `tree:${i}`, … })            // bad  — i shifts as the array changes,
                                         //        so trees swap identity and smear
```

Entries that go undrawn are hidden, and evicted after ~3 seconds. That eviction
is what lets a scrolling world mint ids like `tree:412:7` without leaking.

## Colour: hue and tone

Two separate things, easy to confuse (see `renderer/theme.js`):

- **`hue`** — which palette colour: `grass`, `road`, `moss`, `bark`, `slate`,
  `rust`, `cyan`, `magenta`, `gold`, `bone`, `ink`.
- **`tone`** — which of four shades of it: `lo`, `mid`, `hi`, `lit`. These sit
  **~3% apart in luminance** (measured: 3.0 / 2.7 / 3.0 points), so they read as
  the same material catching different light, not as different colours.

Shading *across* a single solid is separate again: the toon gradient map in
`renderer/toon.js` quantises the light into four bands, which is what gives
lighter tops and darker sides for free.

Pick `tone` by role, following the style this is modelled on:
`lo` for bases and floors, `mid` for structure, `hi` for the thing in focus,
`lit` for a single highlight (the local player, a coin).

## Where the look comes from

Modelled on the craft rules in
[github.com/wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) —
an isometric SVG illustration skill, not a Three.js one, so the rules were
ported rather than copied:

| anatomy rule | here |
|---|---|
| Four tones, ~3% apart | `toneColor()` in `theme.js` |
| Thin border lines on every edge | `EdgesGeometry` + `LineSegments` per mesh |
| Lighter tops, shaded sides | 4-band toon gradient map + one key light |
| Soft dark halo under the base | `g.halo()`, a radial-gradient sprite |
| Clear readable solids | Orthographic camera, fixed three-quarter angle |

Two deliberate deviations, both for a game rather than an illustration:

- **Wider light bands.** The bands across a solid are spread much further apart
  than 3%; at 3% a cube reads as a flat hexagon. The *part tones* keep the 3%.
- **More hues.** anatomy is near-monochrome. A player has to tell a car from a
  tree at a glance while moving, so each object type gets its own muted hue.

## Known rough edges

- **Outlines are always one device pixel.** `LineBasicMaterial.linewidth` is
  ignored by every major browser's WebGL. That lands near the "thin 0.6px"
  intent; anything thicker needs the `Line2` addon, which imports bare `'three'`
  and would force an import map.
- **Smooth shapes get no outline.** Border lines come from real geometric edges,
  so a high-segment sphere has none. `g.sphere` is deliberately coarse
  (10×6 segments → 40 lines); at 12×8 it silently drops to zero.
- **No shadow maps.** Contact is sold by `g.halo()`. Cheaper, and more
  controllable than a real shadow at this scale.
- **Draw calls.** Each solid costs two (mesh + outline). A few hundred solids is
  comfortable; a few thousand is not. Pass `outline: false` on ground slabs and
  other large flat pieces — a grid of lines under everything reads as noise
  anyway, and it halves their cost.

## Smooth motion

Snapshots arrive at 30Hz; screens redraw at 60–120Hz. `core/client-loop.js`
interpolates only the fields the game names, and **every tab** — including the
host — draws from those interpolated copies. Raising `TICK_HZ` doubles
bandwidth and does not fix a missing axis.

If a prompted 3D game feels steppy, the usual cause is `z` left out of `lerp`.
The ground plane is `x` / `z`; `y` is up. The short form reaches player entries:

```js
lerpKeys: ['x', 'z']
```

The full form also reaches top-level fields and other collections — this is
what a Three.js game should declare:

```js
lerp: {
  top: ['time'],          // a clock, for positions computed in draw()
  players: ['x', 'y', 'z'],
}
```

Never put scores, coins, lives, or "who is it" in `lerp`. Those are counters.

`examples/hop/game.js` is the pattern to copy: no car is ever sent over the
network. Each road row carries a seed, car positions are a pure function of
`(row, k, time)`, and interpolating `state.time` makes them glide. That keeps
the snapshot tiny (~250 bytes/tick) and the motion smooth.

The catch: that function **must stay pure**. No `Math.random()`, no
`Date.now()`, no reading state. The host trusts it for collisions while every
client trusts it for rendering; if they disagree, players see different worlds.
