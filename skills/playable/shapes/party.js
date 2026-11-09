// Party — everyone sees the same vote. Tap a person, points are public.
//
// The whole state crosses the wire. Drawing a card face-down does not make
// it a secret. Keep `pointer: true` and the paper.js import. Do not set
// touch to stick or swipe.
//
//   init / onJoin / onLeave / step  run ONLY on the host -> no DOM access
//   draw                           runs in EVERY browser -> never mutate state

import { button, chip, hit, ink, label, panel } from './renderer/paper.js'

const W = 390
const H = 780
const PAD = 20
const GOAL = 5
const ROUND = 20
const edges = {}

function rising(id, input) {
  const down = Boolean(input?.pressed)
  const prev = Boolean(edges[id])
  edges[id] = down
  return down && !prev
}

function idsOf(state) {
  return Object.keys(state.players)
}

function rowBox(index) {
  return { x: PAD, y: 168 + index * 64, w: W - PAD * 2, h: 56 }
}

function nextBox() {
  return { x: PAD, y: H - PAD - 48, w: W - PAD * 2, h: 48 }
}

function nameOf(p, index) {
  return p.name ? p.name : `Seat ${index + 1}`
}

export default {
  title: 'Party',
  players: { min: 2, max: 8 },
  input: { keys: [], pointer: true },
  view: { width: W, height: H },

  init() {
    return { phase: 'vote', votes: {}, lead: null, left: ROUND, winner: null, players: {} }
  },

  onJoin(state, id) {
    const n = idsOf(state).length
    state.players[id] = { score: 0, hue: n, name: '' }
  },

  onLeave(state, id) {
    delete state.players[id]
    delete state.votes[id]
    delete edges[id]
    if (state.winner === id) state.winner = null
    for (const voter of Object.keys(state.votes)) {
      if (state.votes[voter] === id) delete state.votes[voter]
    }
  },

  step(state, inputs, dt) {
    if (state.winner) return
    const ids = idsOf(state)

    if (state.phase === 'show') {
      state.left -= dt
      if (state.left > 0) return
      state.phase = 'vote'
      state.votes = {}
      state.lead = null
      state.left = ROUND
      return
    }

    state.left -= dt
    for (const id of ids) {
      const i = inputs[id] ?? {}
      if (!rising(id, i)) continue
      ids.forEach((other, index) => {
        if (other === id) return
        if (hit(i.px, i.py, rowBox(index))) state.votes[id] = other
      })
    }

    const ready = ids.length >= 2 && ids.every((id) => state.votes[id])
    if (!ready && state.left > 0) return

    const tally = {}
    for (const target of Object.values(state.votes)) tally[target] = (tally[target] || 0) + 1
    let lead = null
    let best = 0
    for (const [id, count] of Object.entries(tally)) {
      if (count > best) {
        lead = id
        best = count
      }
    }
    if (lead && state.players[lead]) state.players[lead].score += 1
    state.lead = lead
    state.phase = 'show'
    state.left = 4
    if (lead && state.players[lead].score >= GOAL) state.winner = lead
  },

  draw(g, state, selfId) {
    g.fillStyle = ink.bg
    g.fillRect(0, 0, W, H)
    panel(g, 0, 0, W * 0.38, 6, ink.accent, 0)
    panel(g, W * 0.38, 0, W * 0.62, 6, ink.light, 0)

    label(g, 'Party', PAD, 48, { size: 28, weight: 800 })
    const ids = idsOf(state)
    const mine = state.votes[selfId]
    label(
      g,
      state.winner
        ? 'Game over'
        : state.phase === 'show'
          ? 'Point scored'
          : ids.length < 2
            ? 'Need 2 people'
            : 'Tap someone else',
      PAD,
      78,
      { size: 16, color: ink.muted },
    )

    ids.forEach((id, index) => {
      const p = state.players[id]
      const box = rowBox(index)
      const picked = mine === id || state.lead === id
      panel(g, box.x, box.y, box.w, box.h, picked ? ink.line : ink.closed, 14)
      chip(g, `${p.score}`, box.x + 12, box.y + 18, true)
      label(g, id === selfId ? `${nameOf(p, index)} · you` : nameOf(p, index), box.x + 12, box.y + 44, {
        size: 18,
        weight: 700,
      })
    })

    if (state.phase === 'show' || state.winner) {
      const box = nextBox()
      const lead = state.lead ? state.players[state.lead] : null
      const leadIndex = state.lead ? ids.indexOf(state.lead) : -1
      button(
        g,
        lead ? `${nameOf(lead, leadIndex)} gets the point` : 'No point this round',
        box.x,
        box.y,
        box.w,
        box.h,
        { fill: ink.light, color: ink.ink },
      )
    } else {
      label(g, `${Math.max(0, Math.ceil(state.left))}s`, W - PAD, 48, {
        size: 18,
        color: ink.accent,
        align: 'right',
        weight: 700,
      })
    }
  },
}
