// Shot — a slow arena. You face the way you move. Action fires a slow shot.
//
// There is no mouse-look and no instant hit. Keep the `shots` array, the
// `action` key, and `touch: 'stick'`. Do not import a crossing layout.
//
//   init / onJoin / onLeave / step  run ONLY on the host -> no DOM access
//   draw                           runs in EVERY browser -> never mutate state

const FIELD = 8
const HITS = 5
const SHOT_SPEED = 9
const SHOT_LIFE = 1.15
const COOL = 0.45
const MAX_SHOTS = 16
const HUES = ['cyan', 'magenta', 'gold', 'rust']

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const edges = {}

function rising(id, input, key) {
  const down = Boolean(input?.[key])
  const prev = Boolean(edges[id]?.[key])
  if (!edges[id]) edges[id] = {}
  edges[id][key] = down
  return down && !prev
}

function dist(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz)
}

export default {
  title: 'Shot',
  players: { min: 1, max: 6 },
  input: { keys: ['up', 'down', 'left', 'right', 'action'], touch: 'stick' },
  view: { units: 18 },
  lerp: { players: ['x', 'z'] },

  init() {
    return { shots: [], winner: null, seq: 1, players: {} }
  },

  onJoin(state, id) {
    const n = Object.keys(state.players).length
    state.players[id] = {
      x: (n % 3) * 3 - 3,
      z: Math.floor(n / 3) * 3 - 1.5,
      faceX: 0,
      faceZ: 1,
      cool: 0,
      hits: 0,
      hue: HUES[n % HUES.length],
      name: '',
    }
  },

  onLeave(state, id) {
    delete state.players[id]
    delete edges[id]
    state.shots = state.shots.filter((shot) => shot.owner !== id)
    if (state.winner === id) state.winner = null
  },

  step(state, inputs, dt) {
    if (!state.winner) {
      for (const [id, p] of Object.entries(state.players)) {
        const i = inputs[id] ?? {}
        let dx = (i.right ? 1 : 0) - (i.left ? 1 : 0)
        let dz = (i.up ? 1 : 0) - (i.down ? 1 : 0)
        if (dx && dz) {
          dx *= Math.SQRT1_2
          dz *= Math.SQRT1_2
        }
        if (dx || dz) {
          p.faceX = dx
          p.faceZ = dz
        }
        p.x = clamp(p.x + dx * 5.5 * dt, -FIELD, FIELD)
        p.z = clamp(p.z + dz * 5.5 * dt, -FIELD, FIELD)
        p.cool = Math.max(0, p.cool - dt)

        if (rising(id, i, 'action') && p.cool <= 0 && state.shots.length < MAX_SHOTS) {
          p.cool = COOL
          state.seq += 1
          state.shots.push({
            id: state.seq,
            owner: id,
            x: p.x + p.faceX * 0.8,
            z: p.z + p.faceZ * 0.8,
            vx: p.faceX * SHOT_SPEED,
            vz: p.faceZ * SHOT_SPEED,
            life: SHOT_LIFE,
          })
        }
      }
    }

    const kept = []
    for (const shot of state.shots) {
      shot.x += shot.vx * dt
      shot.z += shot.vz * dt
      shot.life -= dt
      if (shot.life <= 0) continue
      if (Math.abs(shot.x) > FIELD + 1 || Math.abs(shot.z) > FIELD + 1) continue

      let hit = false
      if (!state.winner) {
        for (const [id, p] of Object.entries(state.players)) {
          if (id === shot.owner) continue
          if (dist(shot.x, shot.z, p.x, p.z) > 0.75) continue
          const owner = state.players[shot.owner]
          if (owner) owner.hits += 1
          if (owner && owner.hits >= HITS) state.winner = shot.owner
          hit = true
          break
        }
      }
      if (!hit) kept.push(shot)
    }
    state.shots = kept
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
      hue: 'slate',
      tone: 'lo',
    })

    for (const shot of state.shots) {
      g.sphere({
        id: `shot:${shot.id}`,
        x: shot.x,
        y: 0.35,
        z: shot.z,
        r: 0.22,
        hue: 'gold',
        tone: 'lit',
      })
    }

    for (const [id, p] of Object.entries(state.players)) {
      g.halo({ id, x: p.x, z: p.z, size: 1.5 })
      g.box({
        id,
        x: p.x,
        y: 0,
        z: p.z,
        w: 0.85,
        h: 1.1,
        d: 0.85,
        hue: p.hue,
        tone: id === selfId ? 'lit' : 'mid',
      })
      g.box({
        id: `face:${id}`,
        x: p.x + p.faceX * 0.55,
        y: 0.7,
        z: p.z + p.faceZ * 0.55,
        w: 0.28,
        h: 0.28,
        d: 0.28,
        hue: 'bone',
        tone: 'hi',
      })
    }

    const me = state.players[selfId]
    if (me) g.follow(me.x, 0, me.z)
    const won = state.winner ? state.players[state.winner] : null
    g.hud({
      topLeft: won ? `${won.name || 'winner'} wins` : me ? `hits ${me.hits}/${HITS}` : 'shot',
      bottom: 'Move to face. Action fires a slow shot.',
    })
  },
}
