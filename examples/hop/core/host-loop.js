// The authoritative simulation. Runs on exactly one machine:
//   - local transport : inside server.mjs (Node)
//   - tab transport   : inside the host's browser tab
//
// Deliberately free of DOM and of Node APIs so it can run in either place.
// It calls game.init / onJoin / onLeave / step. It NEVER calls game.draw.

import { TICK_HZ } from './protocol.js'

export function createHostLoop(game, { tickHz = TICK_HZ } = {}) {
  const state = game.init()
  const inputs = new Map() // playerId -> latest input object
  const dt = 1 / tickHz
  let seq = 0
  let timer = null

  const maxPlayers = game.players?.max ?? 8

  return {
    get state() {
      return state
    },
    get seq() {
      return seq
    },
    get playerCount() {
      return inputs.size
    },
    isFull() {
      return inputs.size >= maxPlayers
    },

    join(id) {
      if (inputs.has(id)) return
      inputs.set(id, {})
      game.onJoin?.(state, id)
    },

    leave(id) {
      if (!inputs.delete(id)) return
      game.onLeave?.(state, id)
    },

    // Last input wins. We do not queue inputs: a dropped frame of input is
    // less harmful than a growing backlog that plays back late.
    setInput(id, input) {
      if (inputs.has(id) && input && typeof input === 'object') {
        inputs.set(id, input)
      }
    },

    // onTick receives the snapshot message to broadcast.
    start(onTick) {
      if (timer) return
      timer = setInterval(() => {
        seq++
        const snapshot = Object.fromEntries(inputs)
        for (const i of Object.values(snapshot)) {
          if (i && (i.lang === 'zh' || i.lang === 'en')) state.lang = i.lang
        }
        for (const [id, i] of Object.entries(snapshot)) {
          if (state.players?.[id] && i && typeof i.name === 'string') {
            state.players[id].name = String(i.name)
              .replace(/[\u0000-\u001f\u007f]/g, '')
              .trim()
              .slice(0, 12)
          }
        }
        try {
          game.step(state, snapshot, dt)
        } catch (err) {
          // A throwing step() would otherwise kill the interval and freeze
          // the game for everyone with no message.
          console.error('[playable] game.step() threw:', err)
        }
        onTick({ t: 'state', seq, state })
      }, 1000 / tickHz)
    },

    stop() {
      clearInterval(timer)
      timer = null
    },
  }
}
