// Four-band toon shading, and the material cache.
//
// MeshToonMaterial quantises lighting through a gradient map instead of
// smoothing it, which is what gives each solid flat bands of tone with a
// lighter top — the look described in theme.js.
//
// Materials are cached by `hue:tone`. Creating one per frame would recompile
// shaders constantly and stutter badly; there are only a few dozen
// combinations, so they are built once and reused forever.

import * as THREE from '../vendor/three/three.module.js'
import { outlineColor, toneColor } from './theme.js'

// Four bands, darkest to lightest. Spread much wider than the ~3% used between
// part tones: these bands are what communicate three-dimensional form, and at
// 3% a cube would read as a flat hexagon.
const BANDS = new Uint8Array([96, 164, 214, 255])

let gradientMap = null

function getGradientMap() {
  if (!gradientMap) {
    gradientMap = new THREE.DataTexture(BANDS, BANDS.length, 1, THREE.RedFormat)
    // Nearest filtering is essential — linear would smooth the bands back into
    // the gradient this whole approach exists to avoid.
    gradientMap.minFilter = THREE.NearestFilter
    gradientMap.magFilter = THREE.NearestFilter
    gradientMap.generateMipmaps = false
    gradientMap.needsUpdate = true
  }
  return gradientMap
}

const fillCache = new Map()
const lineCache = new Map()

export function fillMaterial(hue, tone = 'mid') {
  const key = `${hue}:${tone}`
  let material = fillCache.get(key)
  if (!material) {
    material = new THREE.MeshToonMaterial({
      color: toneColor(hue, tone),
      gradientMap: getGradientMap(),
    })
    fillCache.set(key, material)
  }
  return material
}

export function lineMaterial(hue) {
  let material = lineCache.get(hue)
  if (!material) {
    // linewidth is ignored by every major browser's WebGL implementation, so
    // border lines are always one device pixel. That lands close to the "thin
    // 0.6px" intent; going thicker would need the Line2 addon, which imports
    // bare 'three' and would force an import map.
    material = new THREE.LineBasicMaterial({ color: outlineColor(hue) })
    lineCache.set(hue, material)
  }
  return material
}

/** Soft dark blob used as a contact shadow under each solid. */
export function haloTexture() {
  if (haloTexture.cached) return haloTexture.cached
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(0,0,0,0.42)')
  gradient.addColorStop(0.6, 'rgba(0,0,0,0.16)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  haloTexture.cached = texture
  return texture
}
