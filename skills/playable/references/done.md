# Done, before you hand over a link

Answer every line yes or no. A no is not a finished game. This is not a
visual scorecard: the picture is supposed to be a few flat blocks (or the
paper board for `party` and `board`). Do not score colour entropy, edge
density, or luminance, and do not add clutter to raise a number.

Blocks are the finished look, unless they agreed to a glTF for an object
the blocks cannot be.

## Checklist

- Two people can join. Say how: same Wi-Fi address, or the room link / QR.
- The phone move matches the shape: `stick` for `tag` / `race` / `shot`,
  `swipe` for `hop`, tap the picture for `party` / `board`. A computer
  still has the keyboard.
- Every position that moves is named in `lerp`. Scores are not.
- On a 3D shape, the local player is `tone: 'lit'` and each mover has a
  `g.halo`. On `party` or `board`, the score or the ending is a `label`
  or `chip` from `renderer/paper.js`, not `g.hud`.
- On a 3D shape, the win or the ending is a line in `g.hud`.
- `node <skill-dir>/scripts/check-game.mjs <dir>` exits 0.
- `node <skill-dir>/scripts/doctor.mjs <dir>` exits 0.
- For `--transport=local`, `node <skill-dir>/scripts/smoke-test.mjs <dir>`
  exits 0. `tab` has no headless smoke test; say that you did not run one.

## What you did not see

This environment does not show the game in a browser. Say that in the
handover. Ask them to open two windows, create a room, and look at the
settings icon (room ID, invite link, QR, and how the connection feels)
before they invite anyone.

The address **they** open, the link or code **their friends** open, and
that the game stops when the terminal (`local`) or their tab (`tab`)
closes. No stack traces, no library names.
