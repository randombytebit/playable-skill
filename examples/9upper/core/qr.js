// Draws an invite QR on a canvas. Encoding comes from uqr.js (MIT).

import { encode } from './uqr.js'

export function drawQr(canvas, text, fg = '#111111', bg = '#ffffff') {
  const { data } = encode(text, { ecc: 'M', border: 2 })
  const dim = data.length
  const scale = Math.max(3, Math.floor(148 / dim))
  canvas.width = dim * scale
  canvas.height = dim * scale
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = fg
  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      if (data[y][x]) ctx.fillRect(x * scale, y * scale, scale, scale)
    }
  }
}
