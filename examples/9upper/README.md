# 9UPPER

A 3–9 player party game. Create a room, invite people with the link or the
QR code, then play. Everyone sees a proper-noun topic and its category.
One person also sees the fact behind the name. Everyone else has to talk
as if they read it too. Then the guesser picks who actually knew.

Cards here are original. This is not the published tabletop and is not
affiliated with 9upper-online.com.

Built with the `playable` skill. Play lives in **game.js**. Cards live in
**cards.js**.

## Setup

```sh
npm install
npm start
```

## Playing together

Run `npm start`. The terminal prints two addresses:

- **You:** open the `localhost` one.
- **Friends on the same Wi-Fi:** send them the second address.

You need at least three people. Everyone needs to be on the same network. To
play with someone elsewhere, you would need to expose this port to the
internet with a tunnel — ask Claude about that first, since it makes a port
on this computer publicly reachable.

The game only runs while this terminal is open.

## How a round works

1. Wait until three or more people have joined, then tap **Start**.
2. Everyone sees the topic and its tag. One seat sees the fact. The rest bluff.
3. The asker can **Call a bluff** once, then tap a person and **That’s the one**.
4. Right guess: asker and knower score the card. Wrong guess: the accused scores.

Play with people you trust. The fact is hidden on screen, but it is still
in the data the game sends — peeking in developer tools spoils the round.

## Changing the game

Describe what you want changed in plain language and let Claude edit `game.js`
or `cards.js`. The surrounding files (`core/`, `net.js`, `renderer/`) are
plumbing and should not need to change.
