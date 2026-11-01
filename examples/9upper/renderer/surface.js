// Canvas2D surface. game.draw(g, state, selfId) receives the `g` this builds.
//
// The game draws in a fixed logical coordinate space (default 960x540) and
// this scales it to whatever the window actually is, letterboxing to keep the
// aspect ratio. That way a generated game can hard-code coordinates and still
// look right on a phone and a desktop.
//
// A future render-3d/ should export createSurface with this same shape so
// main.js does not need to care which renderer is in play.

export function createSurface(canvas, { width = 960, height = 540 } = {}) {
  const ctx = canvas.getContext('2d')
  let scale = 1
  let offsetX = 0
  let offsetY = 0

  function resize() {
    const dpr = window.devicePixelRatio || 1
    const vw = canvas.clientWidth
    const vh = canvas.clientHeight
    canvas.width = Math.round(vw * dpr)
    canvas.height = Math.round(vh * dpr)
    // Fit the logical box inside the viewport without distorting it.
    scale = Math.min(vw / width, vh / height)
    offsetX = (vw - width * scale) / 2
    offsetY = (vh - height * scale) / 2
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  resize()
  window.addEventListener('resize', resize)

  return {
    width,
    height,
    ctx,
    // Converts a pointer position in CSS pixels into logical game coordinates.
    toGameCoords(px, py) {
      return { x: (px - offsetX) / scale, y: (py - offsetY) / scale }
    },
    begin() {
      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      ctx.save()
      ctx.translate(offsetX, offsetY)
      ctx.scale(scale, scale)
      // Clip so a game drawing out of bounds cannot scribble on the letterbox.
      ctx.beginPath()
      ctx.rect(0, 0, width, height)
      ctx.clip()
      return ctx
    },
    end() {
      ctx.restore()
    },
  }
}
