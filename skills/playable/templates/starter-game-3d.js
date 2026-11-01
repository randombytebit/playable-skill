// Starter 3D game — a placeholder so a fresh project runs before anything is
// written. Replace the whole file with the real game.
//
//   init / onJoin / onLeave / step  run ONLY on the host -> no DOM access
//   draw                           runs in EVERY browser -> never mutate state
//
// Every draw call needs a stable `id`: the renderer pools objects by it rather
// than rebuilding the scene each frame. See references/render-3d.md.

const FIELD = 9 // half-width of the play area, in world units
const SPEED = 6 // units per second

const HUES = ['cyan', 'magenta', 'gold', 'rust']
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export default {
  title: 'New 3D game',
  players: { min: 1, max: 4 },
  input: { keys: ['up', 'down', 'left', 'right'], touch: 'stick' },
  view: { units: 16 },
  lerp: { players: ['x', 'y', 'z'] },

  init() {
    return { players: {} }
  },

  onJoin(state, id) {
    const taken = Object.keys(state.players).length
    state.players[id] = { x: taken * 1.5 - 1, z: 0, hue: HUES[taken % HUES.length] }
  },

  onLeave(state, id) {
    delete state.players[id]
  },

  step(state, inputs, dt) {
    for (const [id, p] of Object.entries(state.players)) {
      const i = inputs[id] ?? {}
      let dx = (i.right ? 1 : 0) - (i.left ? 1 : 0)
      let dz = (i.up ? 1 : 0) - (i.down ? 1 : 0)
      if (dx && dz) {
        dx *= Math.SQRT1_2
        dz *= Math.SQRT1_2
      }
      p.x = clamp(p.x + dx * SPEED * dt, -FIELD, FIELD)
      p.z = clamp(p.z + dz * SPEED * dt, -FIELD, FIELD)
    }
  },

  draw(g, state, selfId) {
    g.box({ id: 'ground', x: 0, y: -0.5, z: 0, w: FIELD * 2 + 2, h: 0.5, d: FIELD * 2 + 2, hue: 'grass', tone: 'mid' })

    for (const [id, p] of Object.entries(state.players)) {
      g.halo({ id, x: p.x, z: p.z, size: 1.6 })
      g.box({
        id,
        x: p.x,
        y: 0,
        z: p.z,
        w: 0.9,
        h: 0.9,
        d: 0.9,
        hue: p.hue,
        tone: id === selfId ? 'lit' : 'mid',
      })
    }

    const me = state.players[selfId]
    if (me) g.follow(me.x, 0, me.z)

    g.hud({ bottom: 'Stick or arrow keys to move' })
  },
}
