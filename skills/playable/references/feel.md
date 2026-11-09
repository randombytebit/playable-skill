# Feel, with the kit you already have

Read this before you tune a speed, a hit, a coin, or a win. Feedback lives
in `game.js`. Do not edit `renderer/`, `core/`, or `templates/` to make a
game feel better. Do not add a particle system, a post-process pass, or
another Three.js addon.

Hitstop and screen shake are not in this kit. Do not invent them. Use the
substitute in the shape row below.

Acceleration, turning, and "a bit faster" are numbers inside `step`. Do
not raise the tick rate. Name moving positions in `lerp`. Never lerp a
score, a coin count, or who is "it". `references/netcode.md` says why.

## What each shape may do

| Shape | When it happens | What you change |
|---|---|---|
| `tag` | "it" changes hands | The caught player is `hue: 'rust'` and a little taller. Their `g.halo` is larger. `g.hud` `topLeft` names who is "it". |
| `race` | a player passes a post, or finishes a lap | One line in `g.hud` `center` for that moment (`Lap 2`). The post stays `tone: 'mid'`. The local player stays `tone: 'lit'`. |
| `shot` | a shot hits | Add to `hits` in `step`. `g.hud` shows the new count. The shot mesh uses `tone: 'lit'` while it exists. |
| `hop` | a coin is taken, or a car is close | The coin is `tone: 'lit'` with a `g.halo` until it is taken, then it is not drawn. Do not spawn a burst. |
| `party` | a vote lands, or the round ends | `chip` or `label` from `renderer/paper.js`. Crimson `#C41E3A` is the score, not a new palette. |
| `board` | a square is taken, or the board ends | The taken square is a `panel` or `chip`. The result is a `label`. Same paper colours. |

Local player is `tone: 'lit'` on the 3D shapes. One `g.halo` under each
mover. `g.follow` once per frame, on that player.

2D shapes do not call `g.hud`, `g.halo`, or `tone`. They draw with
`panel`, `chip`, `button`, `label` from `renderer/paper.js`.

## Leave it alone

- A second palette, glow, fog, or bloom standing in for a missing object.
- A hop lane grid (`lane`, `rowAt`, `carX`) inside `tag`, `race`, `shot`,
  `party`, or `board`.
- `Math.random()` inside `step`.
- Sound. There is none. See the limit in `SKILL.md`.
