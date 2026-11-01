# Hop

Built with the `playable` skill. Everything game-specific lives in **game.js** —
that is the only file worth editing by hand.

## Setup

```sh
npm install
npm start
```

## Playing together

Run `npm start`. The terminal prints two addresses:

- **You:** open the `localhost` one.
- **Friends on the same Wi-Fi:** send them the second address.

Everyone needs to be on the same network. To play with someone elsewhere, you
would need to expose this port to the internet with a tunnel — ask Claude about
that first, since it makes a port on this computer publicly reachable.

The game only runs while this terminal is open.

## Changing the game

Describe what you want changed in plain language and let Claude edit `game.js`.
The surrounding files (`core/`, `net.js`, `render-2d/`) are plumbing and should
not need to change.
