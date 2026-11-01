// The render side. Runs in every browser tab, including the host's.
// It calls game.draw and nothing else from the game module.
//
// Two jobs:
//   1. Draw at the display's refresh rate (requestAnimationFrame), which is
//      usually 60Hz while snapshots only arrive at 30Hz.
//   2. Smooth the gap by interpolating between the two most recent snapshots.
//
// Interpolation is deliberately narrow: the game names the fields to smooth, so
// scores and counters are never rendered as fractions mid-tick.
//
// Two ways to declare it. The short form covers the common case:
//
//   lerpKeys: ['x', 'z']            // 3D ground plane. 2D uses ['x', 'y'].
//
// The full form also reaches top-level fields and other keyed collections:
//
//   lerp: {
//     top: ['time'],                // state.time  — e.g. a clock that drives
//                                   // positions computed in draw()
//     players: ['x', 'y', 'z'],     // state.players[id] — 3D default
//     balls: ['x', 'y'],            // state.balls[id].x  / .y
//   }

import { TICK_HZ } from './protocol.js'

// Includes z so a 3D game that forgets to declare lerp still glides on the
// depth axis. Missing keys are a no-op (mix only runs on numbers).
const DEFAULT_LERP_KEYS = ['x', 'y', 'z']

const mix = (a, b, t) =>
  typeof a === 'number' && typeof b === 'number' ? a + (b - a) * t : b

// Normalises both declaration styles into { top: [...], collections: {...} }.
function lerpSpec(game) {
  if (game.lerp) {
    const { top = [], ...collections } = game.lerp
    return { top, collections }
  }
  return { top: [], collections: { players: game.lerpKeys ?? DEFAULT_LERP_KEYS } }
}

function lerpCollection(from, to, t, keys) {
  const out = {}
  for (const [id, next] of Object.entries(to)) {
    const prev = from?.[id]
    if (!prev) {
      out[id] = next // Appeared between snapshots: nothing to lerp from.
      continue
    }
    const merged = { ...next }
    for (const key of keys) merged[key] = mix(prev[key], next[key], t)
    out[id] = merged
  }
  return out
}

function lerpSnapshots(from, to, t, spec) {
  if (!from || !to) return to
  const merged = { ...to }

  for (const key of spec.top) merged[key] = mix(from[key], to[key], t)

  for (const [name, keys] of Object.entries(spec.collections)) {
    if (!to[name] || typeof to[name] !== 'object') continue
    merged[name] = lerpCollection(from[name], to[name], t, keys)
  }

  return merged
}

export function createClientLoop(game, { draw, getInput, sendInput, tickHz = TICK_HZ }) {
  const spec = lerpSpec(game)
  const interpolate = game.interpolate !== false
  // Hold one tick of history so there is always a pair to interpolate between.
  const delayMs = 1000 / tickHz

  let selfId = null
  let prev = null // { state, at }
  let latest = null // { state, at }
  let lastSentInput = ''
  let frame = null

  function render(now) {
    frame = requestAnimationFrame(render)

    // Send input first so the host sees it as early as possible.
    if (sendInput) {
      const input = getInput()
      const encoded = JSON.stringify(input)
      if (encoded !== lastSentInput) {
        lastSentInput = encoded
        sendInput(input)
      }
    }

    let view = null
    if (latest) {
      view = latest.state
      if (interpolate && prev) {
        const target = now - delayMs
        const span = latest.at - prev.at
        if (span > 0) {
          const t = Math.max(0, Math.min(1, (target - prev.at) / span))
          view = lerpSnapshots(prev.state, latest.state, t, spec)
        }
      }
    }

    if (view) draw(view, selfId)
  }

  return {
    setSelfId(id) {
      selfId = id
    },
    onSnapshot(state) {
      // Hold a reference. Network snapshots are fresh objects per message;
      // the host path must clone first — it mutates one state object in place.
      prev = latest
      latest = { state, at: performance.now() }
    },
    start() {
      if (!frame) frame = requestAnimationFrame(render)
    },
    stop() {
      cancelAnimationFrame(frame)
      frame = null
    },
  }
}
