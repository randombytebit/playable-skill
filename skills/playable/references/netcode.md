# How the networking works

Read this before changing anything in `core/`, or when a game is desyncing.

## One authority, many renderers

Exactly one machine simulates the game. Everyone else renders what it reports
and sends their button presses. There is no vote, no merge, no reconciliation —
whatever the host says is simply true.

```
          inputs                       snapshots
 client  ------->   HOST (simulates)   --------->  client
                    30 ticks/second                client
```

Where the host lives is the only difference between transports:

| Transport | Host runs in | Host player's browser is |
|---|---|---|
| `local` | `server.mjs`, a Node process | just another client |
| `tab` | the host's browser tab | the authority *and* a client |

`core/host-loop.js` is written against neither environment — no DOM, no Node
APIs — which is why the same simulation runs in both places.

## Each tick (30Hz)

1. Take the most recent input from each player. Inputs are **not queued**: a late
   input is dropped rather than replayed, because a growing backlog plays back as
   a drifting ghost that nobody can aim.
2. Call `game.step(state, inputs, dt)` once. `dt` is always `1/30`.
3. Serialize the whole state and send it to everyone.

Full snapshots, not deltas. At this scale the simplicity is worth more than the
bandwidth, and delta encoding is the first thing to add if a game ever outgrows
it.

## The host/client split

| Function | Runs on | Must not |
|---|---|---|
| `init`, `onJoin`, `onLeave`, `step` | host only | touch `window`, `document`, or canvas |
| `draw` | every browser | mutate `state` |

Both halves of that table are load-bearing.

**Why `step` must not touch the DOM:** in `local` mode it runs in Node, where
`window` does not exist. The game crashes instantly — which is actually the
good case, because the failure is obvious.

**Why `draw` must not mutate state:** clients draw from *interpolated copies*
of snapshots, and the host draws its *live* state object. So a mutation inside
`draw` silently changes the real game for the host and silently does nothing for
everyone else. The symptom is "it works on my screen but my friend sees
something different" — the hardest bug in this architecture to track down, and
the reason the rule is stated in every template file.

## Smoothing

Snapshots arrive 30 times a second; screens redraw 60–120 times a second. Drawing
the latest snapshot each frame looks visibly steppy.

`core/client-loop.js` therefore renders ~33ms in the past and interpolates
between the two most recent snapshots. The cost is a third of a tick of extra
latency, paid for smooth motion.

Interpolation is **deliberately narrow**: only numeric keys listed in
`game.lerpKeys` (default `['x','y','z']`), and only on entries of
`state.players`. Interpolating everything would render a score of 3→4 as "3.4"
mid-tick. If a game adds smoothly-moving entities outside `state.players`, they
will snap rather than glide — name them in the fuller `lerp` form, or compute
them from a lerped clock (see `examples/hop`). Do not raise `TICK_HZ`.

Every tab interpolates, including the host. The host clones each snapshot
before holding it (the live state is mutated in place). That costs ~one tick
of view delay so the host glides like everyone else instead of drawing raw
30Hz steps.

## Latency, stated plainly

A client's input reaches the host, gets simulated, and comes back as a snapshot
before that player sees their own move. That is one full round trip:

- Same Wi-Fi: ~5–20ms. Imperceptible.
- Same city, peer-to-peer: ~30–60ms. Noticeable to twitch players, fine for most.
- Across the world: 150ms+. Visibly laggy.

There is **no client-side prediction** in v1. Adding it means simulating locally
and reconciling against the host's correction, which brings rollback and the
whole class of bugs that come with it. For the audience this skill serves — people
who want a game to play with friends tonight — predictable-but-slightly-late beats
smooth-but-occasionally-teleporting.

## Trust

Clients send only input, so a modified client cannot teleport or set its own
score — the host would simply overwrite it. That is a nice property and it comes
free with host authority.

But every client receives the **entire** state every tick. There are no secrets:
hidden hands, face-down cards and fog of war are all readable by anyone who opens
developer tools. Design around open information, or only play with people you
trust.
