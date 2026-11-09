// 3D surface. Exports the same createSurface(canvas, view) shape as
// render-2d/surface.js, so core/main.js is identical for both renderers.
//
// Orthographic camera at a fixed three-quarter angle: no perspective
// distortion, so a solid looks the same size wherever it sits. That is what
// keeps the scene legible while everything is moving, and it is the projection
// the anatomy style assumes.
//
// view = { units }  — how many world units tall the camera shows (default 15).

import * as THREE from '../vendor/three/three.module.js'
import { createKit } from './kit.js'
import { BACKGROUND, KEY_LIGHT } from './theme.js'

// Direction from the camera's target to the camera. Mostly above and behind,
// offset sideways for the three-quarter view.
const EYE = new THREE.Vector3(7.5, 11, -9.5).normalize()
const EYE_DISTANCE = 60 // Far enough that ortho clipping planes are forgiving.
const FOLLOW_SMOOTHING = 9 // Higher snaps harder to the target.

function assertWebGL(canvas) {
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
  if (!gl) {
    throw new Error(
      'This game needs 3D graphics (WebGL), which this browser will not start. ' +
        'Try a different browser, or check that hardware acceleration is enabled.',
    )
  }
}

export function createSurface(canvas, { units = 15 } = {}) {
  assertWebGL(canvas)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setClearColor(BACKGROUND)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(BACKGROUND)

  // One key light from above gives the lighter tops the style calls for; the
  // hemisphere fill keeps the shadowed sides from going to mud. No shadow maps.
  // The ground shadow in kit.js follows this same KEY_LIGHT.
  const key = new THREE.DirectionalLight(0xffffff, 2.1)
  key.position.set(KEY_LIGHT.x, KEY_LIGHT.y, KEY_LIGHT.z)
  scene.add(key)
  scene.add(new THREE.HemisphereLight(0xdfefff, 0x6b6250, 1.5))

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400)
  const target = new THREE.Vector3(0, 0, 0)
  const current = new THREE.Vector3(0, 0, 0)
  let placed = false

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2) // Cap: 3x costs a lot for little.
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    renderer.setPixelRatio(dpr)
    renderer.setSize(w, h, false)

    const aspect = w / Math.max(h, 1)
    const halfH = units / 2
    const halfW = halfH * aspect
    camera.left = -halfW
    camera.right = halfW
    camera.top = halfH
    camera.bottom = -halfH
    camera.updateProjectionMatrix()
  }

  resize()
  window.addEventListener('resize', resize)

  const kit = createKit(scene)
  const hud = createHud()
  const g = { ...kit, hud: hud.set }

  let lastFrameAt = performance.now()

  return {
    get width() {
      return canvas.clientWidth
    },
    get height() {
      return canvas.clientHeight
    },
    units,

    /** Pointer position projected onto the ground plane (y = 0). */
    toGameCoords(px, py) {
      const ndc = new THREE.Vector2(
        (px / Math.max(canvas.clientWidth, 1)) * 2 - 1,
        -((py / Math.max(canvas.clientHeight, 1)) * 2 - 1),
      )
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(ndc, camera)
      const hit = new THREE.Vector3()
      const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      return raycaster.ray.intersectPlane(ground, hit) ? { x: hit.x, y: hit.z } : { x: 0, y: 0 }
    },

    begin() {
      kit._beginFrame()
      hud.clear()
      return g
    },

    end() {
      const requested = kit._endFrame()
      const now = performance.now()
      const dt = Math.min((now - lastFrameAt) / 1000, 0.1)
      lastFrameAt = now

      if (requested.set) {
        target.set(requested.x, requested.y, requested.z)
        if (!placed) {
          current.copy(target)
          placed = true
        } else {
          // Exponential smoothing, frame-rate independent: the camera eases to
          // the player instead of being welded to them, which reads as weight.
          current.lerp(target, 1 - Math.exp(-FOLLOW_SMOOTHING * dt))
        }
      }

      camera.position.copy(current).addScaledVector(EYE, EYE_DISTANCE)
      camera.lookAt(current)
      hud.flush()
      renderer.render(scene, camera)
    },
  }
}

// Text overlay. Drawing text into WebGL needs either a font atlas or a texture
// per string; a DOM layer is sharper, cheaper, and selectable.
function createHud() {
  let root = document.getElementById('hud3d')
  if (!root) {
    root = document.createElement('div')
    root.id = 'hud3d'
    document.body.append(root)
  }

  const slots = {}
  for (const name of ['topLeft', 'topRight', 'center', 'bottom']) {
    const el = document.createElement('div')
    el.className = `hud3d-${name}`
    root.append(el)
    slots[name] = el
  }

  let pending = {}

  return {
    set(spec) {
      Object.assign(pending, spec)
    },
    clear() {
      pending = {}
    },
    flush() {
      for (const [name, el] of Object.entries(slots)) {
        const value = pending[name] ?? ''
        // Only touch the DOM when the text actually changed — writing every
        // frame would force layout 60 times a second.
        if (el.textContent !== value) el.textContent = value
      }
    },
  }
}
