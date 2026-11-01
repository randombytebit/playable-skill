// Turns raw browser events into the plain input object that game.step sees.
//
// The vocabulary is fixed on purpose. A generated game may declare any subset
// of these in game.input.keys, and step() reads them as booleans:
//
//   up, down, left, right, action, action2
//
// Arrows and WASD both map to the directions; Space/Enter map to action;
// Shift maps to action2. With game.input.pointer the input also carries
// { px, py, pressed } in canvas coordinates.
//
// game.input.touch is optional. 'swipe' latches one direction from a canvas
// flick; 'stick' shows a virtual stick. Both write the same direction names
// keyboard uses. Omit it or set false for keyboard only.

const KEY_MAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'action', Enter: 'action',
  ShiftLeft: 'action2', ShiftRight: 'action2',
}

const DIRS = ['up', 'down', 'left', 'right']
const SWIPE_PX = 32
// Must outlive one 30Hz tick (~33ms) so last-input-wins cannot drop it, but
// stay shorter than a hop (~130ms in hop) so one flick is one step.
const SWIPE_HOLD_MS = 80
const STICK_DEADZONE = 0.28

export function createInput(game, canvas, doc = document) {
  const wanted = new Set(game.input?.keys ?? ['up', 'down', 'left', 'right'])
  const wantPointer = game.input?.pointer === true
  const touchMode = game.input?.touch
  const held = new Set()
  const touchHeld = new Set()
  const pointer = { px: 0, py: 0, pressed: false }
  const listenOpts = { passive: false }

  const onKey = (down) => (event) => {
    const name = KEY_MAP[event.code]
    if (!name || !wanted.has(name)) return
    // Stop the page scrolling out from under the game.
    event.preventDefault()
    if (down) held.add(name)
    else held.delete(name)
  }

  window.addEventListener('keydown', onKey(true))
  window.addEventListener('keyup', onKey(false))

  let releaseTouch = () => {}

  // A tab losing focus strands every held key in the "down" position.
  window.addEventListener('blur', () => {
    held.clear()
    releaseTouch()
  })

  if (wantPointer) {
    const track = (event) => {
      const rect = canvas.getBoundingClientRect()
      // Map CSS pixels to the canvas coordinate space the game draws in.
      pointer.px = ((event.clientX - rect.left) / rect.width) * canvas.clientWidth
      pointer.py = ((event.clientY - rect.top) / rect.height) * canvas.clientHeight
    }
    canvas.addEventListener('pointermove', track)
    canvas.addEventListener('pointerdown', (e) => {
      track(e)
      pointer.pressed = true
    })
    window.addEventListener('pointerup', () => {
      pointer.pressed = false
    })
  }

  if (touchMode === 'swipe') {
    releaseTouch = bindSwipe(canvas, doc, wanted, touchHeld, listenOpts)
  } else if (touchMode === 'stick') {
    releaseTouch = bindStick(doc, wanted, touchHeld, listenOpts)
  }

  return function readInput() {
    const input = {}
    for (const name of wanted) input[name] = held.has(name) || touchHeld.has(name)
    if (wantPointer) Object.assign(input, pointer)
    return input
  }
}

function clearDirs(touchHeld) {
  for (const name of DIRS) touchHeld.delete(name)
}

function bindSwipe(canvas, doc, wanted, touchHeld, listenOpts) {
  let origin = null
  let latched = null
  let timer = null

  function latch(dir) {
    clearDirs(touchHeld)
    latched = dir
    if (wanted.has(dir)) touchHeld.add(dir)
    if (timer) clearTimeout(timer)
    // Host loop is last-input-wins at 30Hz; a one-frame pulse can be dropped.
    timer = setTimeout(() => {
      if (latched === dir) touchHeld.delete(dir)
      if (latched === dir) latched = null
      timer = null
    }, SWIPE_HOLD_MS)
  }

  function onDown(event) {
    if (!event.isPrimary) return
    if (event.button !== 0) return
    origin = { id: event.pointerId, x: event.clientX, y: event.clientY }
    try { canvas.setPointerCapture(event.pointerId) } catch { /* capture is optional */ }
    event.preventDefault()
  }

  function onMove(event) {
    if (!origin || event.pointerId !== origin.id) return
    event.preventDefault()
  }

  function onUp(event) {
    if (!origin || event.pointerId !== origin.id) return
    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y
    origin = null
    event.preventDefault()
    if (Math.hypot(dx, dy) < SWIPE_PX) return
    const dir = Math.abs(dx) >= Math.abs(dy)
      ? (dx > 0 ? 'right' : 'left')
      : (dy > 0 ? 'down' : 'up')
    latch(dir)
  }

  canvas.addEventListener('pointerdown', onDown, listenOpts)
  canvas.addEventListener('pointermove', onMove, listenOpts)
  canvas.addEventListener('pointerup', onUp, listenOpts)
  canvas.addEventListener('pointercancel', onUp, listenOpts)
  doc.addEventListener('pointerup', onUp, listenOpts)
  doc.addEventListener('pointercancel', onUp, listenOpts)

  return function releaseSwipe() {
    origin = null
    latched = null
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    clearDirs(touchHeld)
  }
}

function bindStick(doc, wanted, touchHeld, listenOpts) {
  const body = doc.body
  if (!body) return () => clearDirs(touchHeld)

  // Invisible left-thumb pad. The visible stick appears under the finger
  // (Apple: show a thumbstick wherever the player lands their thumb).
  const pad = doc.createElement('div')
  pad.id = 'touch-pad'
  pad.setAttribute('aria-hidden', 'true')

  const root = doc.createElement('div')
  root.id = 'touch-stick'
  root.setAttribute('aria-hidden', 'true')
  const base = doc.createElement('div')
  base.className = 'touch-stick-base'
  const knob = doc.createElement('div')
  knob.className = 'touch-stick-knob'
  base.appendChild(knob)
  root.appendChild(base)
  body.appendChild(pad)
  body.appendChild(root)

  let activeId = null
  let origin = { x: 0, y: 0 }

  function setKnob(x, y) {
    knob.style.setProperty('--kx', `${x}px`)
    knob.style.setProperty('--ky', `${y}px`)
  }

  function placeStick(x, y) {
    const half = 64
    const minX = half + 8
    const maxX = window.innerWidth - half - 8
    const minY = half + 8
    const maxY = window.innerHeight - half - 8
    origin = {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    }
    root.style.left = `${origin.x}px`
    root.style.top = `${origin.y}px`
  }

  function applyVector(dx, dy, radius) {
    clearDirs(touchHeld)
    const nx = dx / radius
    const ny = dy / radius
    if (nx <= -STICK_DEADZONE && wanted.has('left')) touchHeld.add('left')
    if (nx >= STICK_DEADZONE && wanted.has('right')) touchHeld.add('right')
    if (ny <= -STICK_DEADZONE && wanted.has('up')) touchHeld.add('up')
    if (ny >= STICK_DEADZONE && wanted.has('down')) touchHeld.add('down')
  }

  function updateFromEvent(event) {
    const radius = 64
    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y
    const reach = radius * 0.55
    const len = Math.hypot(dx, dy)
    const scale = len > reach ? reach / len : 1
    setKnob(dx * scale, dy * scale)
    applyVector(dx, dy, radius)
  }

  function onDown(event) {
    if (!event.isPrimary) return
    if (event.button !== 0) return
    activeId = event.pointerId
    placeStick(event.clientX, event.clientY)
    root.classList.add('is-active')
    try { pad.setPointerCapture(event.pointerId) } catch { /* capture is optional */ }
    event.preventDefault()
    event.stopPropagation()
    updateFromEvent(event)
  }

  function onMove(event) {
    if (activeId !== event.pointerId) return
    event.preventDefault()
    updateFromEvent(event)
  }

  function onUp(event) {
    if (activeId !== event.pointerId) return
    activeId = null
    clearDirs(touchHeld)
    setKnob(0, 0)
    root.classList.remove('is-active')
  }

  pad.addEventListener('pointerdown', onDown, listenOpts)
  pad.addEventListener('pointermove', onMove, listenOpts)
  pad.addEventListener('pointerup', onUp)
  pad.addEventListener('pointercancel', onUp)

  return function releaseStick() {
    activeId = null
    clearDirs(touchHeld)
    setKnob(0, 0)
    root.classList.remove('is-active')
  }
}
