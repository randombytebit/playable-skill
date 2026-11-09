# Interview the game before you build it

Do not scaffold, do not write `game.js`, and do not launch a subagent
until they confirm the five-sentence replay below. You — the main model —
talk to the user. Subagents never interview.

Read `references/shapes.md` first and classify the request into `tag`,
`race`, `shot`, `hop`, `party`, or `board`. The shape picks the look.
Do not ask them to choose flat versus 3D. "Flat", "top-down", and
"playground" are still the 3D kit unless the shape is `party` or `board`.

## How a round works

Treat the game as a **design tree**: every settled choice unlocks the
questions that hang off it. The **frontier** is only those questions whose
prerequisites are already answered.

- One message per round. Number each question.
- Every question ships a recommended answer. Word it so **"yes" accepts
  the recommendation.**
- Wait for their answers before the next round.
- Facts are not questions. A named game, film, or repo is looked up —
  never described back to them as a question. That lookup is the one
  Research brief in `references/crew.md`. You still fill a catalog shape
  afterwards. Hop and 9UPPER are already in this skill; do not "research"
  them as if they were outside titles.

Recommend from what they already said. If they have not said, pick the
nearest shape and offer it as the yes.

```
❓ **Q1** - **What do the players do?**: Chase, collect, hop across lanes,
or something else? I would start with a chase: one person is "it" and the
others run.

➡︎ Chase — one person is "it".
```

## Reshape before anything else

If the request is a fight, an FPS, mouse-look, an instant hit, or a
precise platformer, round 1 is only this question. Recommended yes:

> You face the way you move, and one button fires a slow shot. There is no
> mouse-look and no instant hit. Same-room play feels fine; across the
> internet it is mushy, so this is the version that works.

If they need a hidden hand, fog of war, or a card nobody else can see,
round 1 is only this question. Recommended yes:

> Everyone's screen receives the whole game. A card can be drawn face-down,
> but that does not stop someone from looking closely. Play it with people
> you trust, or play it in the open.

Do not scaffold either one until they accept the sentence. Do not edit
`core/` to filter snapshots or to add mouse-look.

## First-round frontier

Ask these together once the shape fits, or in the round after they accept
a reshape. Never say Canvas2D, Three.js, local server, WebRTC, virtual
joystick, or pointer events.

1. **What players do** — name the shape in plain language, not the file.
2. **How many people** play at once.
3. **How someone wins**, or is it just for fun.
4. **Same room / same Wi-Fi**, or people somewhere else.
5. **Phones or only computers?** Offer the move the shape already uses:
   swipe for hop, a little stick for tag / race / shot, tap the picture
   for party / board.

## A feature on a game that already exists

Same pause. Do not edit `game.js` until they confirm a short replay of
the **new thing**. If the new thing is a different shape, say so and
scaffold that shape. Do not bend `tag` into `hop` in the same file.

1. **What changes in play.**
2. **When it happens.**
3. **Who sees it.**
4. **What happens if they skip it.**
5. **Anything else in this change.** Empty is a valid answer.

## Later rounds

Ask only what the first answers unblocked: teams versus free-for-all,
everyone at once versus turns, cooperative versus competitive. Do not ask
speed, size, or timing until the fun is confirmed. Those have defaults.

If the pressure or the first moment is still missing, one more question,
with a recommended yes taken from the shape they already accepted. Do not
ask it when the first answers already imply it. The replay has to be able
to name both. For a chase, the yes is:

```
❓ **Q** - **What pushes you?**: I would make the pressure being caught —
touch someone and they become "it". The first thing you see is one person
already "it", and everyone else runs.

➡︎ Being caught is the pressure. One person starts as "it".
```

## Defaults — say them in the replay, do not ask them first

| Gap | Default |
|---|---|
| Keyboard | Arrows + WASD. Space fires in `shot`. |
| Player count still fuzzy | Whatever the shape file allows |
| Speed / size / timing | Something playable; tune after they try it |
| Look | Little 3D objects, except `party` and `board`, which are a flat board |
| Win condition still fuzzy | The shape's own ending |
| Phone move still unsaid | The shape's move |

## Other limits — mention them if they come up

Do not add them as first-round questions.

- **Huge stored worlds.** Tens of stored things are fine. Scenery that
  follows from a seed and a clock costs nothing on the wire. That is the
  hop shape.
- **Persistence between sessions.** Closing the host ends the game. Offer
  in-session scoring.
- **A car, a person, a tree that is not a block.** Ask before building it.
  The recommended yes is: "This shape cannot be built out of blocks. I can
  make it in Blender and drop it into the game. That needs you to connect
  Blender." Do not say "MCP". If they decline, use the blocks. If they
  accept and Blender is not connected, stop. Do not invent the model.
  Do not open Mixos Studio, Spline, KoKraft, CoCraft, Clara.io, or
  Tinkercad, and do not log in or add their runtimes. If they already
  have their own `.gltf` or `.glb`, put it in `models/` and place it
  with `g.model`. Do not build that file for them on another website.

## Done when

Play the game back in **five sentences**, in this order. When they say
that is the game, scaffold with `--shape` and edit that `game.js`. Run
`check-game.mjs` before you hand over a link. Name the shape you will
fill (`tag`, `race`, `shot`, `hop`, `party`, or `board`) after the five
sentences, not instead of one of them.

1. **What is on screen.**
2. **How you move**, including a phone if anyone is on one.
3. **The pressure** — what repeats every few seconds, what a better player
   does, and how a danger is visible before it lands. Success has to
   change the score or who is "it", not only the picture.
4. **How it ends**, or that it runs until they stop.
5. **The first thing that happens.**

> You and up to 7 friends are little figures in a small field; one of you
> glows because they are "it" and move a bit faster.
>
> On a phone you hold a little stick to keep moving; on a computer the
> arrows still work.
>
> The pressure is being caught: a touch hands "it" over, and the score is
> how long you have been "it".
>
> It runs until you stop it.
>
> The first thing that happens is one person starts as "it" and the others
> run.

That replay is `tag`, even if they called the field flat.
