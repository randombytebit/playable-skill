// Board — two players, three in a row. Tap a square on your turn.
//
// Keep `turn`, `pointer: true`, and the paper.js import. Do not set touch
// to stick or swipe. Ignore input on the off-turn.
//
//   init / onJoin / onLeave / step  run ONLY on the host -> no DOM access
//   draw                           runs in EVERY browser -> never mutate state

import { button, hit, ink, label, panel } from './renderer/paper.js'

const W = 390
const H = 780
const PAD = 20
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]
const edges = {}

function rising(id, input) {
  const down = Boolean(input?.pressed)
  const prev = Boolean(edges[id])
  edges[id] = down
  return down && !prev
}

function orderOf(state) {
  return Object.keys(state.players)
}

function cellBox(index) {
  const size = 96
  const gap = 10
  const span = size * 3 + gap * 2
  const x0 = (W - span) / 2
  const y0 = 230
  const col = index % 3
  const row = Math.floor(index / 3)
  return { x: x0 + col * (size + gap), y: y0 + row * (size + gap), w: size, h: size }
}

function winnerId(state) {
  const ids = orderOf(state)
  for (const line of LINES) {
    const mark = state.cells[line[0]]
    if (!mark) continue
    if (line.every((i) => state.cells[i] === mark)) return mark
  }
  if (ids.length >= 2 && state.cells.every(Boolean)) return 'draw'
  return null
}

function nameOf(state, id) {
  if (!id || id === 'draw') return 'Draw'
  const p = state.players[id]
  const index = orderOf(state).indexOf(id)
  if (p?.name) return p.name
  return index === 0 ? 'X' : 'O'
}

export default {
  title: 'Board',
  players: { min: 2, max: 2 },
  input: { keys: [], pointer: true },
  view: { width: W, height: H },

  init() {
    return {
      cells: [null, null, null, null, null, null, null, null, null],
      turn: null,
      winner: null,
      players: {},
    }
  },

  onJoin(state, id) {
    state.players[id] = { name: '' }
    if (!state.turn) state.turn = id
  },

  onLeave(state, id) {
    delete state.players[id]
    delete edges[id]
    if (state.turn === id) state.turn = orderOf(state)[0] ?? null
  },

  step(state, inputs) {
    if (state.winner) return
    const ids = orderOf(state)
    if (ids.length < 2 || !state.turn) return

    for (const id of ids) {
      if (id !== state.turn) continue
      const i = inputs[id] ?? {}
      if (!rising(id, i)) continue
      for (let n = 0; n < 9; n++) {
        if (state.cells[n]) continue
        if (!hit(i.px, i.py, cellBox(n))) continue
        state.cells[n] = id
        state.winner = winnerId(state)
        if (!state.winner) {
          const next = ids.indexOf(id)
          state.turn = ids[(next + 1) % ids.length]
        }
        break
      }
    }
  },

  draw(g, state, selfId) {
    g.fillStyle = ink.bg
    g.fillRect(0, 0, W, H)
    panel(g, 0, 0, W * 0.38, 6, ink.accent, 0)
    panel(g, W * 0.38, 0, W * 0.62, 6, ink.light, 0)

    label(g, 'Board', PAD, 48, { size: 28, weight: 800 })
    const ids = orderOf(state)
    const turnName = nameOf(state, state.turn)
    const headline = state.winner
      ? state.winner === 'draw'
        ? 'Draw'
        : `${nameOf(state, state.winner)} wins`
      : ids.length < 2
        ? 'Need 2 people'
        : state.turn === selfId
          ? 'Your turn'
          : `${turnName}'s turn`
    label(g, headline, PAD, 80, { size: 16, color: state.turn === selfId ? ink.accent : ink.muted })

    state.cells.forEach((mark, index) => {
      const box = cellBox(index)
      const mine = mark === selfId
      panel(g, box.x, box.y, box.w, box.h, mine ? ink.line : ink.closed, 16)
      if (!mark) return
      const first = ids[0] === mark
      label(g, first ? 'X' : 'O', box.x + box.w / 2, box.y + box.h / 2 + 12, {
        size: 42,
        weight: 800,
        align: 'center',
        color: first ? ink.accent : ink.steel,
      })
    })

    if (state.winner) {
      button(g, state.winner === 'draw' ? 'Draw' : `${nameOf(state, state.winner)} wins`, PAD, H - PAD - 48, W - PAD * 2, 48)
    } else if (state.turn) {
      label(g, `turn · ${turnName}`, PAD, H - PAD, { size: 15, color: ink.muted })
    }
  },
}
