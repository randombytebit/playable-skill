# Interview the game before you build it

Do not scaffold a project and do not write `game.js` until they confirm a
four-or-five-sentence replay of the game. You — the main model — talk to the
user. Subagents never interview.

## How a round works

Treat the game as a **design tree**: every settled choice unlocks the
questions that hang off it. The **frontier** is only those questions whose
prerequisites are already answered. Ask nothing that still depends on a
guess.

- One message per round. Number each question.
- Every question ships a recommended answer. Word it so **"yes" accepts
  the recommendation.**
- Wait for their answers before the next round.
- Facts are not questions. A named game, `examples/hop`, `examples/9upper`,
  or a URL they mentioned is looked up by a research subagent or by you —
  never asked of the user.

Recommend from what they already said. If they have not said, pick the
nearest playable shape and offer it as the yes. When they are vague, give
three or four concrete options and let them point.

```
❓ **Q1** - **What do the players do?**: Chase, collect, hop across lanes,
or something else? I would start with a chase: one person is "it" and the
others run.

➡︎ Chase — one person is "it".
```

## First-round frontier

Always ask these together. They pick the game, not the technology. Never
say Canvas2D, Three.js, local server, WebRTC, virtual joystick, or pointer
events. Each of the six ships a recommended answer.

1. **What players do** — move, shoot, race, collect, draw, guess…
2. **How it looks** — flat and top-down, or depth / little 3D objects you
   look down on?
3. **How many people** play at once.
4. **How someone wins**, or is it just for fun.
5. **Same room / same Wi-Fi**, or people somewhere else.
6. **Phones or only computers?** If phones: **swipe** (one hop or step),
   a **little stick** (keep moving), or **tap the picture** (cards / people).

## A feature on a game that already exists

Same rules. Do not edit `game.js` or the templates until they confirm a
short replay of the **new thing**, not the whole game again.

First-round frontier for a feature — ask these together:

1. **What changes in play** — what people now do or see.
2. **When it happens** — first screen, each round, settings, only once…
3. **Who sees it** — everyone, only that person, only the host.
4. **Skip / empty** — what the game does if they do not fill it in.
5. **Anything else in this change** — other wants that belong with it.
   Empty is a valid answer.

Recommend from the existing game. For 9UPPER / party games, a name on the
first screen that everyone sees, with "Seat 2" if they skip, is the usual
yes.

## Later rounds

Ask only what the first answers unblocked. Typical next branches:

- Teams vs free-for-all
- Everyone at once vs taking turns
- Cooperative vs competitive
- Hidden-info honesty, if the game needs secrets (see below)

Do not ask speed, size, timing, or board size until the fun is confirmed.
Those have defaults.

## Defaults — after the fun is settled

Fill these yourself and mention them in the replay. They are not first-round
questions.

| Gap | Default |
|---|---|
| Keyboard | Arrows + WASD to move, Space for the main action |
| Player count still fuzzy | 2–8 |
| Speed / size / timing | Something playable; tune after they try it |
| Art style | Little 3D objects, four tones, outlines |
| Win condition still fuzzy | A score, no forced ending |
| Board size | A small arena you can take in at a glance |

If they said phones but not swipe / stick / tap:

| The game is… | Phone move |
|---|---|
| Hop, grid, race, one step at a time | swipe |
| Chase, wandering / keep moving | stick |
| Taps on cards, people, or a board | tap the picture — no stick |
| Unsure | stick for a continuous walker; swipe if it is hop-like |

## Shapes that fit

A shared world, everyone moving or taking turns, the host deciding what
happened:

- Chase / survival, collect-the-things, arena shooters, racing
- Co-op avoidance, drawing / party games
- Turn-based boards (ignore everyone else's input on their off-turn)

## Shapes that need reshaping

Say so early and offer the nearest thing that works:

- **Fast twitch** (fighting, precise platforming). Moves land a beat late.
  Fine in the same room; mushy across the internet. Offer a slower version.
- **Huge stored worlds.** Hundreds of saved objects choke the link. Tens
  of stored things are fine. Scenery that follows from a seed and a clock
  costs nothing on the wire — `examples/hop` is that pattern.
- **Persistence between sessions.** Closing the host ends the game. Offer
  in-session scoring.
- **Hidden info** (hands, fog of war). Every screen gets the whole state.
  Do not claim secrets on the wire. Play it open, or among people who
  trust each other not to peek.

## Done when

Play the game back in four or five sentences: what is on screen, how you
move (including a phone, if anyone is on one), how it ends. When they say
that is the game, the main model scaffolds and launches the crew — research,
look, and flow in parallel, then programming. See `references/crew.md`.

> You and up to 7 friends are dots in a box. One of you is "it" and glows
> red — they move slightly faster and chase everyone else. Touch someone
> and they become "it". On a phone you hold a little stick to keep moving;
> on a computer the arrows still work. A scoreboard tracks how long each
> person has spent being "it", and the lowest time is winning. It runs
> until you stop it.
