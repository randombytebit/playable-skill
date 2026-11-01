// Starter game — a placeholder so a fresh project runs before anything is
// written. Replace the whole file with the real game.
//
//   init / onJoin / onLeave / step  run ONLY on the host -> no DOM access
//   draw                           runs in EVERY browser -> never mutate state

const W = 960
const H = 540
const SPEED = 240
const RADIUS = 16

const COLORS = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#39c5cf']
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export default {
  title: 'New game',
  players: { min: 1, max: 8 },
  input: { keys: ['up', 'down', 'left', 'right'], touch: 'stick' },
  view: { width: W, height: H },
  lerpKeys: ['x', 'y'],

  init() {
    return { players: {} }
  },

  onJoin(state, id) {
    const taken = Object.keys(state.players).length
    state.players[id] = {
      x: W / 2,
      y: H / 2,
      color: COLORS[taken % COLORS.length],
    }
  },

  onLeave(state, id) {
    delete state.players[id]
  },

  step(state, inputs, dt) {
    for (const [id, p] of Object.entries(state.players)) {
      const i = inputs[id] ?? {}
      let dx = (i.right ? 1 : 0) - (i.left ? 1 : 0)
      let dy = (i.down ? 1 : 0) - (i.up ? 1 : 0)
      if (dx && dy) {
        dx *= Math.SQRT1_2
        dy *= Math.SQRT1_2
      }
      p.x = clamp(p.x + dx * SPEED * dt, RADIUS, W - RADIUS)
      p.y = clamp(p.y + dy * SPEED * dt, RADIUS, H - RADIUS)
    }
  },

  draw(g, state, selfId) {
    g.fillStyle = '#0d1117'
    g.fillRect(0, 0, W, H)

    for (const [id, p] of Object.entries(state.players)) {
      g.beginPath()
      g.arc(p.x, p.y, RADIUS, 0, Math.PI * 2)
      g.fillStyle = p.color
      g.fill()
      if (id === selfId) {
        g.strokeStyle = '#e6edf3'
        g.lineWidth = 3
        g.stroke()
      }
    }

    g.fillStyle = '#8b949e'
    g.font = '16px ui-sans-serif, system-ui, sans-serif'
    g.textAlign = 'center'
    g.fillText('Stick or arrow keys to move', W / 2, H - 28)
  },
}
