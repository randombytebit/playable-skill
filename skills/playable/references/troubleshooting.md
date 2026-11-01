# Troubleshooting

Start with `node skills/playable/scripts/doctor.mjs <dir>` — it catches the
mechanical problems (old Node, busy port, missing files, broken `game.js`,
un-vendored library) before any guessing is needed.

Translate findings into plain language for the user. "ECONNREFUSED" means nothing
to them; "the game isn't running yet — start it with `npm start`" does.

## Nobody can connect

**`local`: friend opens the link and gets nothing.**

1. Same Wi-Fi? Phones silently fall back to mobile data — have them disable it.
2. Right address? They need the LAN address (`http://192.168.x.x:8080`), not
   `localhost`. `localhost` on their device means *their* device.
3. macOS firewall prompt? First run pops a dialog asking whether `node` may
   accept incoming connections. If it was dismissed, allow Node under
   System Settings → Network → Firewall → Options.
4. Guest / public Wi-Fi often enables **client isolation**, which blocks devices
   from seeing each other entirely. Nothing can be done from the app side; use a
   phone hotspot or switch to `tab`.

**`tab`: the join link spins, then fails.**

1. Is the host's tab still open? Closing it ends the game.
2. Was the code typed by hand? The alphabet deliberately excludes `0 O 1 I L`,
   but a transcription slip is still the likeliest cause. Send the full link.
3. "Matchmaking unreachable" means the free broker is not responding. Wait and
   retry, or switch to `local`.
4. Connects for some players but not others → almost certainly NAT. Office,
   university and some mobile networks block direct peer connections. There is no
   fix within this design; use `local`, or have that player tether to a different
   network.

Tell the user which of these it is rather than asking them to try all four.

## The game is laggy or jerky

Tap the settings icon in the top-right corner. After a second or two it shows
how the connection **feels**: **Feels instant**, **Feels fine**, **A bit
delayed**, or **Moves may feel late**, plus the time in milliseconds. Read
that first — it is the delay from this player to the host, not a score.

- **Moves may feel late, one player** — their link is the slow one. Same Wi-Fi
  (and off mobile data) is the usual fix. Across the world it will stay late;
  slowing the game down helps more than raising the tick rate.
- **Jerky, everyone, local network** — probably `game.step` doing too much work.
  Check for loops over every pair of entities.
- **Smooth for the host, laggy for others** — expected over long distances; it is
  the round trip described in `netcode.md`. Slowing the game down genuinely helps.
- **Entities teleport instead of gliding** — they are outside `lerp`. 3D
  players need `x` and `z` (and `y` if they hop). Scenery should be computed
  from a lerped `time` clock, like hop — or listed in `game.lerp`. Do not
  raise the tick rate.
- **Everything stutters as players join** — the whole state ships every tick.
  Count the entities; tens are fine, hundreds are not.

## "It works for me but my friend sees something different"

Almost always `draw` mutating `state`. Both host and guests draw interpolated
*copies*, but `step` still owns the live object — a write inside `draw` is
either discarded or (if it somehow reaches live state) desyncs everyone.
Read `draw` carefully for assignments to `state` or its contents.

The other cause is randomness or `Date.now()` inside `draw`: the host and clients
then disagree on screen even with identical state. Anything that must be shared
belongs in `step`.

## Port 8080 is busy

```sh
PORT=8081 npm start
```

Remember the invite address changes to match.

## A 3D game shows nothing

- **"This game cannot start" in the panel** — WebGL would not start. Usually
  hardware acceleration is disabled in the browser's settings, or the device is
  too old. There is no 2D fallback; a different browser is the first thing to try.
- **Console error about `three.core.js`** — the vendored library is missing or
  half-copied. `npm install` again; `doctor.mjs` reports this directly.
- **Objects smear, swap colours, or flicker between frames** — unstable draw
  ids. The renderer pools by `id`, so `tree:${i}` over a shifting array makes
  two objects trade identity. Key by something fixed: `tree:${row}:${col}`.
- **A shape has no outline** — border lines come from real geometric edges, so
  smooth surfaces have none. Reduce the segment count (see
  `references/render-3d.md`).
- **Frame rate sags with a lot on screen** — every solid costs two draw calls,
  one for the fill and one for the outline. Pass `outline: false` on ground
  slabs and other large flat pieces.

## A phone does not move the player

Computers still use the keyboard. A phone only moves if the game set
`input.touch` to `'swipe'` or `'stick'`. If they said phones would play and
nothing happens when they swipe or drag, add that field in `game.js` — do not
edit `core/` to invent mobile controls for one project.

## A player's screen is blank

Open the browser console. The templates deliberately catch and log errors from
`game.step` and `game.draw` rather than letting one bad frame kill the loop, so
the message is usually waiting there with the name of the function that threw.

A blank canvas with the settings icon still in the top-right means `draw` is
failing or drawing nothing. A missing settings icon means the module graph
failed to load — check that the project is being served over `http://`, not
opened as a `file://` path.

## Changes are not showing up

Both the host and every player must reload: the host is running the simulation,
so stale host code keeps the old rules regardless of what the clients loaded. For
`local`, restart `npm start` too, since `server.mjs` imported `game.js` at startup.

## After editing templates in the skill

Scaffolded projects are **copies**. Editing `skills/playable/templates/` does not
change a game that already exists; rescaffold, or apply the same edit to the
project. Re-run the smoke test after template changes:

```sh
node skills/playable/scripts/new-game.mjs /tmp/check --transport=local --example=9upper
cd /tmp/check && npm install && cd -
node skills/playable/scripts/smoke-test.mjs /tmp/check
```
