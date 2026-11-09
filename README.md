# playable

A Claude Code skill for building multiplayer web games that run on **your own
device**. No cloud backend, no deploy step, no accounts, no hosting bill.

You describe the game in plain language. Claude builds it and tells you which
link to send your friends.

## Install

This repository **is a skill**. The product is `skills/playable/`.

```sh
# After the repo is on GitHub:
npx skills add <you>/playable-skill
```

Until then, point Claude Code or Cursor at `skills/playable/SKILL.md` in this folder.

## Using it

Install the skill, then just say what you want:

> *"I want a game where 4 of us are dots in a box and one person is 'it' and has
> to chase the others."*

Claude asks enough about the game that you both know what you're making, then
builds it and hands you a link. You never need to read or write code.

## The two ways to play

Claude picks based on who you're playing with.

**Same Wi-Fi** — your computer runs the game and everyone opens a link on the
local network. Completely self-contained; works with no internet at all.

**Friends elsewhere** — your browser tab runs the game and friends join through a
direct peer-to-peer link. Nothing to deploy. A free matchmaking service
introduces players, then steps out of the way.

Worth knowing up front: some restrictive networks (many offices, some mobile data)
block direct connections entirely, and in that case the same-Wi-Fi option is the
one that works. Either way, the game only runs while your terminal or tab is open.

## Examples

Complete, playable projects. They stay on your machine. This skill does not
put a game on the internet.

| | |
|---|---|
| **[examples/hop](./examples/hop)** | Two players. A phone swipes one step at a time; a computer uses the arrows. First to lane 50 wins — dodge the traffic, grab the coins. |
| **[examples/9upper](./examples/9upper)** | 3–9 players. A phone taps the picture. One person knows the fact, the others bluff, and the guesser picks who knew. Invite with the link or the QR. |

```sh
cd examples/hop && npm install && npm start
```

Then open the printed address in two browser windows. Friends on the same
Wi-Fi use the second address. The game runs only while that terminal stays
open.

```sh
cd examples/9upper && npm install && npm start
```

Same idea: the printed address, two windows, and it stops when the terminal
closes. There is no public link for either example.

## For developers

The skill lives in `skills/playable/`. A generated project has exactly one
game-specific file — `game.js` — over a 30Hz host-authoritative simulation, with
two interchangeable transports (`ws` or WebRTC) and two interchangeable renderers
(Canvas2D or Three.js) behind fixed interfaces.

The 3D renderer ships an art layer: a palette with four-tone shading, outlines
on every edge, contact shadows and an orthographic camera, adapted from the craft
rules in [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy).

See [CLAUDE.md](./CLAUDE.md) for architecture and the verification loop, and
`skills/playable/references/` for the netcode contract, the 3D kit, transport
tradeoffs, and troubleshooting.

```sh
# Build a game project directly
node skills/playable/scripts/new-game.mjs /tmp/demo --transport=local --render=3d
(cd /tmp/demo && npm install && npm start)

# Headless end-to-end test, no browser required
node skills/playable/scripts/smoke-test.mjs /tmp/demo
```

### Current limits

- No client-side prediction — input applies about one round trip late. Fine on a
  LAN, noticeable across the world.
- Full state snapshots every tick. Keep *stored* entities in the tens; scenery
  that can be computed from a seed costs nothing on the wire.
- Every client receives the whole state: no hidden information.
- **The 2D renderer has no art layer** — it is a bare canvas context, so 2D games
  look plain unless you draw everything by hand. The 3D path is the one with a
  designed look.
- 3D needs WebGL, with no 2D fallback.

## License

[MIT](./LICENSE)
