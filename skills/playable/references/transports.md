# Choosing a transport

Both options keep the game on the user's own device. They differ in who they can
reach and what they depend on.

## Side by side

| | `--transport=local` | `--transport=tab` |
|---|---|---|
| Authority | Node process (`server.mjs`) | The host's browser tab |
| Players reach it via | `http://<lan-ip>:8080` | a join link with a room code |
| Reaches friends elsewhere | only through a tunnel | yes, directly |
| Third-party dependency | none | a free matchmaking broker |
| Can fail to connect at all | no (if on the same network) | yes — strict NATs |
| Works with no internet | yes | no |
| Host must keep open | the terminal | the browser tab |
| Node needed to play | yes | only to serve the files locally |

## Pick `local` when

The players are in the same house, office, or classroom. It is strictly more
reliable: no broker, no NAT traversal, no external service to be down. It also
works with the internet entirely unavailable, which makes it the right answer for
a classroom or a long flight.

It is also the only transport that can be tested without a browser
(`scripts/smoke-test.mjs`), so prefer it when debugging a game's logic.

### Playing over the internet with `local`

Requires a tunnel (`cloudflared`, `ngrok`) that makes port 8080 on the user's
machine publicly reachable.

**Confirm this with the user explicitly before setting one up.** A non-coder will
not infer that "share this link" means "a port on my computer is now exposed to
the internet", and anyone with the URL can join. Explain it in one sentence, get
a yes, and tell them to stop the tunnel when they are finished.

## Pick `tab` when

The players are somewhere else and the user does not want to run a tunnel. After
the broker introduces the two sides, game data flows **directly** between players
— the broker sees no gameplay.

### What `tab` depends on

1. **A public matchmaking broker** (PeerJS's free cloud) to exchange connection
   details. If it is down, *new* connections cannot form; games already running
   are unaffected.
2. **NAT traversal succeeding.** Two peers behind restrictive routers may be
   unable to establish a direct path. There is no TURN relay in this setup — a
   relay costs money and defeats "runs on your own device" — so on those networks
   the connection simply fails. Corporate and university networks are the common
   culprits, and some mobile carriers.

Both failure modes open the settings sheet with an explanation. They are never
silent, because a non-coder staring at a blank canvas has no other way to know.

The vendored `vendor/peerjs.min.js` means no CDN is contacted at page load; the
only network dependency is the broker itself, during connection setup.

### Hosting the files elsewhere

A `tab` project is pure static files. Drop the folder on any static host and the
user does not need Node at all — the game still runs in the host player's browser.
`serve.mjs` exists only because browsers refuse to load ES modules from `file://`.

## Switching later

There is no migration path and there does not need to be one: `game.js` is
transport-blind. Scaffold a new project with the other transport and copy
`game.js` across.

```sh
node skills/playable/scripts/new-game.mjs ./game-v2 --transport=tab
cp ./game-v1/game.js ./game-v2/game.js
cd ./game-v2 && npm install
```

That portability is the whole point of the `net.js` interface, and the reason not
to let game logic leak into the plumbing.
