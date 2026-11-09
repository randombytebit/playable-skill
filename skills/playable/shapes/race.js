// Race — a short loop. First to three laps wins.
//
// Fill this file in. Keep `lap` and `touch: 'stick'`. This is a loop of
// posts, not a crossing. Do not import traffic from another shape.
//
//   init / onJoin / onLeave / step  run ONLY on the host -> no DOM access
//   draw                           runs in EVERY browser -> never mutate state

const FIELD = 9
const REACH = 1.45
const LAPS = 3
const HUES = ['cyan', 'magenta', 'gold', 'rust']
const MARKS = [
  { x: -6, z: -4 },
  { x: 6, z: -4 },
  { x: 6, z: 4 },
  { x: -6, z: 4 },
]

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function dist(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz)
}

function spawn(index) {
  return {
    x: -1.5 + (index % 4) * 1,
    z: 0,
    hue: HUES[index % HUES.length],
    next: 0,
    lap: 0,
    name: '',
  }
}

export default {
  title: 'Race',
  players: { min: 1, max: 4 },
  input: { keys: ['up', 'down', 'left', 'right'], touch: 'stick' },
  view: { units: 20 },
  lerp: { players: ['x', 'z'] },

  init() {
    return { winner: null, players: {} }
  },

  onJoin(state, id) {
    state.players[id] = spawn(Object.keys(state.players).length)
  },

  onLeave(state, id) {
    delete state.players[id]
    if (state.winner === id) state.winner = null
  },

  step(state, inputs, dt) {
    if (state.winner) return

    for (const [id, p] of Object.entries(state.players)) {
      const i = inputs[id] ?? {}
      let dx = (i.right ? 1 : 0) - (i.left ? 1 : 0)
      let dz = (i.up ? 1 : 0) - (i.down ? 1 : 0)
      if (dx && dz) {
        dx *= Math.SQRT1_2
        dz *= Math.SQRT1_2
      }
      p.x = clamp(p.x + dx * 6.5 * dt, -FIELD, FIELD)
      p.z = clamp(p.z + dz * 6.5 * dt, -FIELD, FIELD)

      const mark = MARKS[p.next]
      if (dist(p.x, p.z, mark.x, mark.z) > REACH) continue
      p.next = (p.next + 1) % MARKS.length
      if (p.next === 0) p.lap += 1
      if (p.lap >= LAPS) state.winner = id
    }
  },

  draw(g, state, selfId) {
    g.box({
      id: 'ground',
      x: 0,
      y: -0.35,
      z: 0,
      w: FIELD * 2 + 1,
      h: 0.35,
      d: FIELD * 2 + 1,
      hue: 'road',
      tone: 'lo',
    })

    MARKS.forEach((mark, index) => {
      g.cylinder({
        id: `mark:${index}`,
        x: mark.x,
        y: 0,
        z: mark.z,
        r: 0.45,
        h: 1.1,
        hue: 'bone',
        tone: 'mid',
      })
    })

    for (const [id, p] of Object.entries(state.players)) {
      const next = MARKS[p.next]
      g.cylinder({
        id: `next:${id}`,
        x: next.x,
        y: 0,
        z: next.z,
        r: 0.7,
        h: 0.15,
        hue: 'gold',
        tone: 'lit',
      })
      g.halo({ id, x: p.x, z: p.z, size: 1.6 })
      g.box({
        id,
        x: p.x,
        y: 0,
        z: p.z,
        w: 0.85,
        h: 0.55,
        d: 1.3,
        hue: p.hue,
        tone: id === selfId ? 'lit' : 'hi',
      })
    }

    const me = state.players[selfId]
    if (me) g.follow(me.x, 0, me.z)
    const lead = state.winner ? state.players[state.winner] : null
    g.hud({
      topLeft: lead ? `${lead.name || 'winner'} finished` : me ? `lap ${me.lap}/${LAPS}` : 'race',
      bottom: 'Drive through the gold ring. Three laps win.',
    })
  },
}
