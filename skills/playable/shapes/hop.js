// Hop — one step at a time across a few lanes. First to the far side wins.
//
// The short pattern: rows come from a pure function of (seed, lane), and a
// clock on state drives cars. Copy that idea when you add scenery. The full
// demo is examples/hop — open it only because this shape is hop.
//
// Keep `lane`, `rowAt`, and `touch: 'swipe'`.
//
//   init / onJoin / onLeave / step  run ONLY on the host -> no DOM access
//   draw                           runs in EVERY browser -> never mutate state

const HALF = 4
const FINISH = 8
const HOP_TIME = 0.14
const HOP_HEIGHT = 0.4
const HUES = ['cyan', 'magenta', 'gold', 'rust']

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const rowCache = new Map()

function hash(seed, lane, salt) {
  let h = Math.imul(seed ^ (lane * 0x9e3779b1), 2654435761)
  h = Math.imul(h ^ (salt * 0x85ebca6b + 1), 1597334677)
  h = Math.imul(h ^ (h >>> 15), 2246822507)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function rowAt(seed, lane) {
  const key = `${seed}:${lane}`
  const hit = rowCache.get(key)
  if (hit) return hit
  const row = buildRow(seed, lane)
  if (rowCache.size > 200) rowCache.clear()
  rowCache.set(key, row)
  return row
}

function buildRow(seed, lane) {
  if (lane <= 0 || lane >= FINISH) return { kind: 'grass', trees: [], count: 0 }
  if (lane % 3 !== 0) {
    const trees = []
    for (let col = -HALF; col <= HALF; col++) {
      if (hash(seed, lane, col + 20) < 0.18) trees.push(col)
    }
    if (trees.length > HALF * 2 - 1) trees.length = HALF
    return { kind: 'grass', trees, count: 0 }
  }
  return {
    kind: 'road',
    trees: [],
    dir: hash(seed, lane, 1) < 0.5 ? 1 : -1,
    speed: 3 + hash(seed, lane, 2) * 3,
    gap: 4.2,
    count: 4,
    phase: hash(seed, lane, 3) * 16,
    hue: hash(seed, lane, 4) < 0.5 ? 'slate' : 'rust',
  }
}

export function carX(row, k, time) {
  const total = row.gap * row.count
  const raw = row.phase + k * row.gap + row.dir * row.speed * time
  const wrapped = ((raw % total) + total) % total
  return wrapped - total / 2
}

function blocked(seed, lane, col) {
  if (col < -HALF || col > HALF || lane < 0 || lane > FINISH) return true
  const row = rowAt(seed, lane)
  return row.kind === 'grass' && row.trees.includes(col)
}

function hitByCar(state, p) {
  const row = rowAt(state.seed, p.lane)
  if (row.kind !== 'road') return false
  for (let k = 0; k < row.count; k++) {
    if (Math.abs(carX(row, k, state.time) - p.x) < 0.85) return true
  }
  return false
}

function place(p, col, lane) {
  p.col = col
  p.lane = lane
  p.x = col
  p.z = lane
  p.y = 0
  p.hopT = 1
  p.fromX = col
  p.fromZ = lane
  p.toX = col
  p.toZ = lane
}

export default {
  title: 'Hop',
  players: { min: 1, max: 4 },
  input: { keys: ['up', 'down', 'left', 'right'], touch: 'swipe' },
  view: { units: 14 },
  lerp: { top: ['time'], players: ['x', 'y', 'z'] },

  init() {
    return { seed: 1, time: 0, winner: null, players: {} }
  },

  onJoin(state, id) {
    const n = Object.keys(state.players).length
    const p = { hue: HUES[n % HUES.length], name: '' }
    place(p, n - 1, 0)
    state.players[id] = p
  },

  onLeave(state, id) {
    delete state.players[id]
    if (state.winner === id) state.winner = null
  },

  step(state, inputs, dt) {
    state.time += dt
    for (const [id, p] of Object.entries(state.players)) {
      if (p.hopT < 1) {
        p.hopT = Math.min(1, p.hopT + dt / HOP_TIME)
        const t = p.hopT
        p.x = p.fromX + (p.toX - p.fromX) * t
        p.z = p.fromZ + (p.toZ - p.fromZ) * t
        p.y = Math.sin(t * Math.PI) * HOP_HEIGHT
        continue
      }
      if (state.winner) continue
      if (hitByCar(state, p)) {
        place(p, 0, 0)
        continue
      }
      const i = inputs[id] ?? {}
      let dc = (i.right ? 1 : 0) - (i.left ? 1 : 0)
      let dl = (i.up ? 1 : 0) - (i.down ? 1 : 0)
      if (dc && dl) dl = 0
      if (!dc && !dl) continue
      const col = clamp(p.col + dc, -HALF, HALF)
      const lane = clamp(p.lane + dl, 0, FINISH)
      if (blocked(state.seed, lane, col)) continue
      p.fromX = p.x
      p.fromZ = p.z
      p.toX = col
      p.toZ = lane
      p.col = col
      p.lane = lane
      p.hopT = 0
      if (lane >= FINISH && !state.winner) state.winner = id
    }
  },

  draw(g, state, selfId) {
    const me = state.players[selfId]
    const focus = me ? me.lane : 0
    for (let lane = focus - 2; lane <= focus + 8; lane++) {
      if (lane < 0 || lane > FINISH) continue
      const row = rowAt(state.seed, lane)
      g.box({
        id: `row:${lane}`,
        x: 0,
        y: -0.2,
        z: lane,
        w: HALF * 2 + 1,
        h: 0.2,
        d: 1,
        hue: row.kind === 'road' ? 'road' : 'grass',
        tone: 'lo',
      })
      for (const col of row.trees) {
        g.box({
          id: `tree:${lane}:${col}`,
          x: col,
          y: 0,
          z: lane,
          w: 0.7,
          h: 1.1,
          d: 0.7,
          hue: 'moss',
          tone: 'mid',
        })
      }
      for (let k = 0; k < row.count; k++) {
        g.box({
          id: `car:${lane}:${k}`,
          x: carX(row, k, state.time),
          y: 0,
          z: lane,
          w: 1.3,
          h: 0.45,
          d: 0.7,
          hue: row.hue,
          tone: 'hi',
        })
      }
    }

    for (const [id, p] of Object.entries(state.players)) {
      g.halo({ id, x: p.x, z: p.z, y: p.y, h: 0.7, size: 1.3 })
      g.box({
        id,
        x: p.x,
        y: p.y,
        z: p.z,
        w: 0.7,
        h: 0.7,
        d: 0.7,
        hue: p.hue,
        tone: id === selfId ? 'lit' : 'mid',
      })
    }

    if (me) g.follow(me.x, 0, me.z)
    const won = state.winner ? state.players[state.winner] : null
    g.hud({
      topLeft: won ? `${won.name || 'winner'} made it` : me ? `lane ${me.lane}/${FINISH}` : 'hop',
      bottom: 'Swipe or arrows. One step at a time.',
    })
  },
}
