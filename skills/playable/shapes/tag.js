// Tag — a small arena. One player is it and chases the others.
//
// Fill this file in. Keep `itId` and `touch: 'stick'`. Do not import a
// crossing layout or a traffic clock from another shape.
//
//   init / onJoin / onLeave / step  run ONLY on the host -> no DOM access
//   draw                           runs in EVERY browser -> never mutate state

const FIELD = 8
const REACH = 1.15
const HUES = ['cyan', 'magenta', 'gold', 'rust']
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function dist(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz)
}

export default {
  title: 'Tag',
  players: { min: 1, max: 8 },
  input: { keys: ['up', 'down', 'left', 'right'], touch: 'stick' },
  view: { units: 18 },
  lerp: { players: ['x', 'z'] },

  init() {
    return { itId: null, players: {} }
  },

  onJoin(state, id) {
    const n = Object.keys(state.players).length
    state.players[id] = {
      x: (n % 4) * 2 - 3,
      z: Math.floor(n / 4) * 2 - 1,
      hue: HUES[n % HUES.length],
      tagged: 0,
      name: '',
    }
    if (!state.itId) state.itId = id
  },

  onLeave(state, id) {
    delete state.players[id]
    if (state.itId === id) state.itId = Object.keys(state.players)[0] ?? null
  },

  step(state, inputs, dt) {
    const ids = Object.keys(state.players)
    for (const id of ids) {
      const p = state.players[id]
      const i = inputs[id] ?? {}
      const it = id === state.itId
      const speed = it ? 7.4 : 5.6
      let dx = (i.right ? 1 : 0) - (i.left ? 1 : 0)
      let dz = (i.up ? 1 : 0) - (i.down ? 1 : 0)
      if (dx && dz) {
        dx *= Math.SQRT1_2
        dz *= Math.SQRT1_2
      }
      p.x = clamp(p.x + dx * speed * dt, -FIELD, FIELD)
      p.z = clamp(p.z + dz * speed * dt, -FIELD, FIELD)
      if (it) p.tagged += dt
    }

    const it = state.players[state.itId]
    if (!it) return
    for (const id of ids) {
      if (id === state.itId) continue
      const other = state.players[id]
      if (dist(it.x, it.z, other.x, other.z) < REACH) {
        state.itId = id
        break
      }
    }
  },

  draw(g, state, selfId) {
    g.box({
      id: 'ground',
      x: 0,
      y: -0.4,
      z: 0,
      w: FIELD * 2 + 2,
      h: 0.4,
      d: FIELD * 2 + 2,
      hue: 'grass',
      tone: 'lo',
    })

    for (const [id, p] of Object.entries(state.players)) {
      const it = id === state.itId
      g.halo({ id, x: p.x, z: p.z, size: it ? 2 : 1.5 })
      g.box({
        id,
        x: p.x,
        y: 0,
        z: p.z,
        w: 0.9,
        h: it ? 1.3 : 0.9,
        d: 0.9,
        hue: it ? 'rust' : p.hue,
        tone: id === selfId ? 'lit' : 'mid',
      })
    }

    const me = state.players[selfId]
    if (me) g.follow(me.x, 0, me.z)
    const who = state.players[state.itId]
    const name = who?.name || 'someone'
    g.hud({
      topLeft: who ? `${name} is it` : 'waiting',
      bottom: 'Hold the stick, or use the arrows',
    })
  },
}
