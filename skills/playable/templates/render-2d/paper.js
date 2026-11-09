// Shared 2D drawing helpers for party and board shapes.
//
// Lifted from the 9UPPER example (round rect, chip, filled panel, button).
// game.js imports this file. The canvas context `g` stays a canvas context.
// Colours are the playable chrome: true black, white, crimson on data, steel.

const FONT = 'ui-sans-serif, system-ui, -apple-system, sans-serif'

export const ink = {
  bg: '#000000',
  paper: '#FFFFFF',
  ink: '#111111',
  light: '#FFFFFF',
  muted: '#B4B4B4',
  mutedInk: '#5F6368',
  line: '#2A2A2A',
  accent: '#C41E3A',
  steel: '#2B5A8A',
  closed: '#111111',
}

export function roundBox(g, x, y, w, h, r) {
  g.beginPath()
  if (typeof g.roundRect === 'function') g.roundRect(x, y, w, h, r)
  else g.rect(x, y, w, h)
}

/** Filled rounded rectangle. `color` is a CSS colour from `ink`. */
export function panel(g, x, y, w, h, color, radius = 16) {
  roundBox(g, x, y, w, h, radius)
  g.fillStyle = color
  g.fill()
}

/** Small name / category chip. Returns the chip width. */
export function chip(g, text, x, y, onDark = false) {
  g.font = `600 11px ${FONT}`
  g.textAlign = 'left'
  g.textBaseline = 'alphabetic'
  const padX = 8
  const w = Math.ceil(g.measureText(String(text)).width) + padX * 2
  const h = 20
  roundBox(g, x, y, w, h, 10)
  g.fillStyle = onDark ? ink.closed : ink.ink
  g.fill()
  g.fillStyle = onDark ? ink.light : ink.paper
  g.fillText(String(text), x + padX, y + 14)
  return w
}

/** White pill by default. Hit target should be at least 44px tall. */
export function button(g, text, x, y, w, h, { fill = ink.light, color = ink.ink } = {}) {
  roundBox(g, x, y, w, h, h / 2)
  g.fillStyle = fill
  g.fill()
  g.fillStyle = color
  g.font = `600 16px ${FONT}`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(String(text), x + w / 2, y + h / 2)
  g.textBaseline = 'alphabetic'
}

export function label(g, text, x, y, { size = 16, color = ink.light, align = 'left', weight = 500 } = {}) {
  g.font = `${weight} ${size}px ${FONT}`
  g.fillStyle = color
  g.textAlign = align
  g.textBaseline = 'alphabetic'
  g.fillText(String(text), x, y)
}

export function hit(px, py, box) {
  return px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h
}
