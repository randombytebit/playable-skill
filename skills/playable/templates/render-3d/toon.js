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
import { HALO, outlineColor, toneColor } from './theme.js'

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

/**
 * One shared shadow disc. kit.js writes uPenumbra and uOpacity per object in
 * onBeforeRender, so a jumper can be softer than a contact blob without a
 * second shader compile.
 */
export function createHaloMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uPenumbra: { value: 0 },
      uOpacity: { value: 0.55 },
      uColor: { value: new THREE.Color(HALO) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform float uPenumbra;
      uniform float uOpacity;
      uniform vec3 uColor;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float edge = mix(0.04, 0.55, clamp(uPenumbra, 0.0, 1.0));
        float alpha = (1.0 - smoothstep(1.0 - edge, 1.0, d)) * uOpacity;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  })
}
