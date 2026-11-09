// Hop — a two-player Crossy Road. First to lane 50 wins.
//
//   init / onJoin / onLeave / step  run ONLY on the host -> no DOM access
//   draw                           runs in EVERY browser -> never mutate state
//
// THE WORLD IS NOT IN THE STATE.
//
// Rows, trees, coins and cars are all a pure function of (state.seed, row), so
// the only things on the wire are the two players, which coins have been taken,
// and a clock. The host calls rowAt() in step() to test collisions; every
// client calls the same function in draw() to render. Same file, same answer.
//
// That buys three things at once: a snapshot stays around 1KB instead of
// shipping ~120 moving cars at 30Hz; cars move perfectly smoothly because their
// position is computed from an interpolated clock rather than sampled 30 times
// a second; and the world can run to lane 50 without the state ever growing.
//
// The cost is that rowAt() MUST stay pure. No Math.random(), no Date.now(), no
// reading from state. If it ever disagrees between host and client, players see
// different cars and the game becomes unplayable in a way that is very hard to
// debug.

const LANES = 9 // playable half-width, in cells
const SPAN = 24 // half-width of the strip cars travel along
const FINISH = 50 // the lane you are racing to
const HOP_TIME = 0.13 // seconds per hop
const HOP_HEIGHT = 0.42
const RESPAWN_DELAY = 1.5
const RESET_DELAY = 7
const CAR_HALF = 0.9
const HIT_PAD = 0.3

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// --- deterministic world ---------------------------------------------------

// Hash of (seed, row, salt) -> 0..1. Pure, stable across machines.
function rand(seed, z, salt) {
  let h = Math.imul(seed ^ (z * 0x9e3779b1), 2654435761)
  h = Math.imul(h ^ (salt * 0x85ebca6b + 1), 1597334677)
  h = Math.imul(h ^ (h >>> 15), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// Derived data is cached outside the state — it is reproducible, so it never
// needs to be sent or stored.
const rowCache = new Map()

export function rowAt(seed, z) {
  const key = `${seed}:${z}`
  const hit = rowCache.get(key)
  if (hit) return hit

  const row = buildRow(seed, z)
  // Bound the cache so a long match cannot grow it without limit.
  if (rowCache.size > 4000) rowCache.clear()
  rowCache.set(key, row)
  return row
}

function buildRow(seed, z) {
  // Safe apron at the start and a clear run at the finish.
  if (z <= 0 || z >= FINISH) {
    return { kind: 'grass', trees: [], coin: null, safe: true }
  }

  // Every seventh row is guaranteed grass, so a bad streak of roads can never
  // make the race unwinnable.
  const isRoad = z % 7 !== 0 && rand(seed, z, 0) < 0.46

  if (isRoad) {
    const gap = 5.5 + rand(seed, z, 1) * 4.5
    const count = Math.max(2, Math.ceil((SPAN * 2) / gap))
    const row = {
      kind: 'road',
      dir: rand(seed, z, 2) < 0.5 ? 1 : -1,
      speed: 2.8 + rand(seed, z, 3) * 4.2,
      gap,
      count,
      phase: rand(seed, z, 4) * gap * count,
      hue: rand(seed, z, 5) < 0.5 ? 'slate' : 'rust',
      trees: [],
      coin: null,
    }
    // Coins are more common on roads: that is the whole point of them.
    if (rand(seed, z, 6) < 0.38) row.coin = pickCol(seed, z, 7)
    return row
  }

  const trees = []
  for (let col = -LANES; col <= LANES; col++) {
    if (rand(seed, z, col + 100) < 0.17) trees.push(col)
  }
  // Never wall a row off completely.
  if (trees.length > LANES * 2 - 1) trees.length = LANES
  const row = { kind: 'grass', trees, coin: null }

  if (rand(seed, z, 8) < 0.14) {
    const col = pickCol(seed, z, 9)
    if (!trees.includes(col)) row.coin = col
  }
  return row
}

function pickCol(seed, z, salt) {
  return Math.floor(rand(seed, z, salt) * (LANES * 2 + 1)) - LANES
}

/** X position of car `k` in a road row at a given time. Pure. */
export function carX(row, k, time) {
  const total = row.gap * row.count
  const raw = row.phase + k * row.gap + row.dir * row.speed * time
  const wrapped = ((raw % total) + total) % total
  return wrapped - total / 2
}

function blocked(seed, z, col) {
  if (col < -LANES || col > LANES) return true
  if (z < 0) return true
  const row = rowAt(seed, z)
  return row.kind === 'grass' && row.trees.includes(col)
}

// --- game ------------------------------------------------------------------

function spawn(player, z = 0) {
  player.gx = 0
  player.gz = z
  player.fx = 0
  player.fz = z
  player.x = 0
  player.z = z
  player.y = 0
  player.hopT = 1
  player.dead = false
  player.respawnIn = 0
}

export default {
  title: 'Hop',
  players: { min: 1, max: 2 },
  input: { keys: ['up', 'down', 'left', 'right'], touch: 'swipe' },
  view: { units: 15 },
  // state.time drives the computed car positions, so it has to arrive smoothed
  // or every car in the world would judder at the 30Hz tick rate.
  lerp: { top: ['time'], players: ['x', 'y', 'z'] },

  init() {
    return {
      seed: 1,
      time: 0,
      players: {},
      taken: {}, // "row:col" of collected coins
      winner: null,
      resetIn: 0,
    }
  },

  onJoin(state, id) {
    const taken = Object.keys(state.players).length
    const player = {
      hue: taken === 0 ? 'cyan' : 'magenta',
      coins: 0,
      best: 0,
      wins: 0,
      name: '',
    }
    spawn(player)
    state.players[id] = player
  },

  onLeave(state, id) {
    delete state.players[id]
  },

  step(state, inputs, dt) {
    state.time += dt

    if (state.winner) {
      state.resetIn -= dt
      if (state.resetIn <= 0) {
        // New seed means a brand new world, not the same one replayed.
        state.seed = (Math.imul(state.seed, 1103515245) + 12345) >>> 8
        state.taken = {}
        state.winner = null
        for (const p of Object.values(state.players)) {
          p.coins = 0
          p.best = 0
          spawn(p)
        }
      }
      return
    }

    for (const [id, p] of Object.entries(state.players)) {
      const input = inputs[id] ?? {}

      if (p.dead) {
        p.respawnIn -= dt
        if (p.respawnIn <= 0) spawn(p, Math.max(0, p.gz - 3))
        continue
      }

      // Advance the current hop.
      if (p.hopT < 1) {
        p.hopT = Math.min(1, p.hopT + dt / HOP_TIME)
        const t = p.hopT
        p.x = p.fx + (p.gx - p.fx) * t
        p.z = p.fz + (p.gz - p.fz) * t
        p.y = Math.sin(t * Math.PI) * HOP_HEIGHT
      } else {
        p.y = 0
      }

      // Start a new hop as soon as the previous one lands.
      if (p.hopT >= 1) {
        const dir = pickDirection(input)
        if (dir) {
          const tx = p.gx + dir.dx
          const tz = p.gz + dir.dz
          if (!blocked(state.seed, tz, tx)) {
            p.fx = p.gx
            p.fz = p.gz
            p.gx = tx
            p.gz = tz
            p.hopT = 0
          }
        }
      }

      // Collision against the computed cars of whichever row we are over.
      const row = rowAt(state.seed, Math.round(p.z))
      if (row.kind === 'road') {
        for (let k = 0; k < row.count; k++) {
          if (Math.abs(carX(row, k, state.time) - p.x) < CAR_HALF + HIT_PAD) {
            p.dead = true
            p.respawnIn = RESPAWN_DELAY
            break
          }
        }
      }

      // Coins: only the player who lands on the cell gets it.
      if (!p.dead && p.hopT >= 1) {
        const landed = rowAt(state.seed, p.gz)
        if (landed.coin === p.gx) {
          const coinId = `${p.gz}:${p.gx}`
          if (!state.taken[coinId]) {
            state.taken[coinId] = true
            p.coins++
          }
        }
      }

      p.best = Math.max(p.best, p.gz)
      if (p.gz >= FINISH && !state.winner) {
        state.winner = id
        state.resetIn = RESET_DELAY
        p.wins++
      }
    }
  },

  draw(g, state, selfId) {
    const me = state.players[selfId]
    const centre = me ? me.z : 0
    if (me) g.follow(me.x, 0, me.z)

    const from = Math.floor(centre) - 10
    const to = Math.floor(centre) + 16

    for (let z = from; z <= to; z++) {
      const row = rowAt(state.seed, z)
      const isRoad = row.kind === 'road'

      // Ground slabs carry no outline: a grid of lines across every row would
      // fight the objects standing on it.
      g.box({
        id: `row:${z}`,
        x: 0,
        y: -0.25,
        z,
        w: SPAN * 2,
        h: 0.25,
        d: 1,
        hue: isRoad ? 'road' : 'grass',
        tone: isRoad ? 'mid' : z % 2 ? 'mid' : 'hi',
        outline: false,
      })

      if (isRoad) {
        // Two kerb strips instead of dashed markings: three objects a row
        // rather than twenty.
        for (const side of [-0.5, 0.5]) {
          g.box({
            id: `kerb:${z}:${side}`,
            x: 0,
            y: -0.02,
            z: z + side * 0.94,
            w: SPAN * 2,
            h: 0.06,
            d: 0.08,
            hue: 'bone',
            tone: 'lo',
            outline: false,
          })
        }

        for (let k = 0; k < row.count; k++) {
          const x = carX(row, k, state.time)
          if (x < -SPAN || x > SPAN) continue
          g.halo({ id: `carh:${z}:${k}`, x, z, size: 2.4 })
          g.box({
            id: `car:${z}:${k}`,
            x,
            y: 0,
            z,
            w: 1.8,
            h: 0.62,
            d: 0.92,
            hue: row.hue,
            tone: 'mid',
          })
          g.box({
            id: `cab:${z}:${k}`,
            x: x - row.dir * 0.22,
            y: 0.62,
            z,
            w: 0.9,
            h: 0.4,
            d: 0.82,
            hue: row.hue,
            tone: 'hi',
          })
        }
      }

      for (const col of row.trees) {
        g.halo({ id: `treeh:${z}:${col}`, x: col, z, size: 1.5 })
        g.cylinder({ id: `trunk:${z}:${col}`, x: col, y: 0, z, r: 0.17, h: 0.55, hue: 'bark', tone: 'mid' })
        g.box({
          id: `leaf:${z}:${col}`,
          x: col,
          y: 0.55,
          z,
          w: 0.86,
          h: 0.95,
          d: 0.86,
          hue: 'moss',
          tone: 'mid',
        })
      }

      if (row.coin !== null && !state.taken[`${z}:${row.coin}`]) {
        const bob = Math.sin(state.time * 3 + z) * 0.08
        g.cylinder({
          id: `coin:${z}:${row.coin}`,
          x: row.coin,
          y: 0.42 + bob,
          z,
          r: 0.3,
          h: 0.09,
          hue: 'gold',
          tone: 'lit',
          rx: Math.PI / 2,
          ry: state.time * 2.2,
        })
      }

      if (z === FINISH) {
        g.box({
          id: 'finish',
          x: 0,
          y: -0.02,
          z,
          w: SPAN * 2,
          h: 0.08,
          d: 0.9,
          hue: 'bone',
          tone: 'lit',
          outline: false,
        })
      }
    }

    for (const [id, p] of Object.entries(state.players)) {
      if (p.dead) continue
      const self = id === selfId
      g.halo({ id: `ph:${id}`, x: p.x, z: p.z, y: p.y, h: 0.78, size: 1.3 })
      g.box({
        id: `p:${id}`,
        x: p.x,
        y: p.y,
        z: p.z,
        w: 0.78,
        h: 0.78,
        d: 0.78,
        hue: p.hue,
        tone: self ? 'lit' : 'mid',
      })
      // A small nub so you can tell which way a frog is facing.
      g.box({
        id: `pn:${id}`,
        x: p.x,
        y: p.y + 0.78,
        z: p.z,
        w: 0.34,
        h: 0.16,
        d: 0.34,
        hue: p.hue,
        tone: 'hi',
      })
    }

    // The rival, when they are off the top or bottom of the screen.
    const rival = Object.entries(state.players).find(([id]) => id !== selfId)
    if (me && rival) {
      const [rivalId, r] = rival
      const delta = r.z - me.z
      if (Math.abs(delta) > 7) {
        const ahead = delta > 0
        g.cone({
          id: `arrow:${rivalId}`,
          x: clamp(r.x, -LANES, LANES),
          y: 0.5,
          z: me.z + (ahead ? 7 : -7),
          r: 0.5,
          h: 0.9,
          hue: r.hue,
          tone: 'lit',
          rx: ahead ? 0 : Math.PI,
        })
      }
    }

    // --- HUD ---
    const label = (p) => `lane ${p.gz}  ·  ${p.coins} coins`
    const who = (p, fallback) => (typeof p.name === 'string' && p.name ? p.name : fallback)
    const hud = {}
    if (me) hud.topLeft = `${who(me, 'YOU')}\n${label(me)}`
    if (rival) hud.topRight = `${who(rival[1], 'FRIEND')}\n${label(rival[1])}`

    if (state.winner) {
      const won = state.winner === selfId
      hud.center = won ? 'You win!' : 'Friend wins'
      hud.bottom = `Next race in ${Math.ceil(state.resetIn)}…`
    } else if (Object.keys(state.players).length < 2) {
      hud.bottom = 'Waiting for your friend — send them the link. Swipe or use arrow keys to hop.'
    } else if (me?.dead) {
      hud.center = 'Squashed'
      hud.bottom = 'Back in a moment, three lanes behind.'
    } else {
      hud.bottom = `First to lane ${FINISH} wins  ·  coins are just bragging rights`
    }
    g.hud(hud)
  },
}

// Reads the held keys directly rather than tracking a rising edge: holding
// forward should keep you hopping, which is what you want in a race.
function pickDirection(input) {
  // Forward first: if two keys are down, that is the one you meant.
  if (input.up) return { dx: 0, dz: 1 }
  if (input.down) return { dx: 0, dz: -1 }
  if (input.left) return { dx: -1, dz: 0 }
  if (input.right) return { dx: 1, dz: 0 }
  return null
}
