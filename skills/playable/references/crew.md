# Crew — only when they name something outside the catalog

You are the **main model**. You grill, scaffold `--shape`, edit `game.js`,
run `check-game.mjs`, and hand over the link. That is the default. Do not
launch Research, Look, and Flow in parallel to produce the game.

## When a subagent is allowed

They named a game, film, site, or repo that is **not** `hop` or `9UPPER`
(those already live in this skill). Launch **one** Research subagent. It
returns a brief. It does not edit files and it does not talk to the user.

You then pick the closest catalog shape and fill that `game.js` yourself.
If Research and the shape disagree, the confirmed replay and the shape
file win.

If you cannot launch a subagent, do the lookup yourself in one pass, then
fill the shape. Do not skip the replay gate, and do not dump a new
architecture because the lookup was short.

Hop and 9UPPER are not outside titles. Shape `hop` may read `examples/hop`
for the pure clock. Shape `party` does not clone `examples/9upper`.

## Research brief

15–25 lines. No file edits.

```
Confirmed replay: <five sentences: screen, move, pressure, ending, first thing>
Shape: <tag|race|shot|hop|party|board>
They named: <game / film / site / repo>

Look at what they named. Return the loop to borrow and the feel to borrow.
Name what not to copy (title, cards, art, trademarks). For a party game,
cards and names stay original. Do not interview the user. Do not edit
plumbing or game.js.
```

## If you do edit with a helper

One helper, after the scaffold, may edit **only** `<dir>/game.js`, starting
from the file `--shape` copied. Pass it the confirmed replay and the
Research brief if there was one.

```
Confirmed replay: <replay>
Shape: <name>
Project dir: <dir>
Brief: <research, or "none">

Edit ONLY <dir>/game.js. It is already the shape file. Keep the tokens in
references/shapes.md (itId, lap, shots, lane, pointer, turn, paper.js).
Do not replace a tag, race, shot, party, or board with a hop lane grid.
Host functions never touch the DOM. draw never mutates state. Do not raise
the tick rate. Do not edit core/, net.js, renderer/, server.mjs, or templates.
2D colours are true black #000000, white #FFFFFF, crimson #C41E3A on data
only, steel #2B5A8A. Use renderer/paper.js. No second palette.
3D uses the kit hues and stable ids. No extra Three addons — the template
already vendors the glTF loader. Do not add OrbitControls.
Do not interview the user.
```

If that helper edits anything except `game.js`, revert those files.

## Look, when you need a drawing note

You usually do not. The shape file is the drawing plan. If you write one
for yourself, keep it under 25 lines:

- **3D:** kit hues and tones, stable ids (`tree:12:3`), box / sphere /
  cylinder, `g.follow` once per frame. A glTF is `g.model`, only after
  they agreed to Blender. No extra Three addons.
- **2D:** `#000000` ground, `#FFFFFF` paper, crimson `#C41E3A` on data,
  steel `#2B5A8A`. Hit targets 44px or taller. `panel`, `chip`, `button`
  from `renderer/paper.js`. No glass, no gradients, no second palette.

Create-a-room, room ID, invite link, and QR already live in the templates.
Do not draw another status panel.

## Iterate

"Make the red one faster" is you editing `game.js`, then `check-game`.
Do not relaunch Research unless they changed what the game is.
