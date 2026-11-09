// The drawing kit a 3D game sees. Three.js never appears in game.js.
//
// THE POOLING MODEL — the one thing to understand before changing this file.
//
// game.draw() is immediate mode: it describes the whole scene every frame.
// Three.js is retained mode: you build objects once and mutate them. Bridging
// the two naively (clear the scene, rebuild it) would allocate thousands of
// meshes per second and stutter.
//
// So every call carries a stable `id`. The kit keeps a pool keyed by that id,
// reuses the Mesh behind it, and hides whatever went undrawn this frame. Ids
// must be stable across frames and unique within a frame — `tree:12:3` good,
// array index bad (objects would swap identity as the array shifts).
//
// Pool entries unused for a few seconds are evicted, which matters for a
// scrolling world where ids like `tree:<row>:<col>` are created without bound.
//
// Geometries are unit-sized and shared; size comes from per-instance scale, so
// a thousand boxes of different dimensions still share one BoxGeometry.

import * as THREE from '../vendor/three/three.module.js'
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js'
import { createHaloMaterial, fillMaterial, lineMaterial } from './toon.js'
import { projectHalo } from './theme.js'

const PRUNE_AFTER_FRAMES = 180 // ~3 seconds at 60fps

// Sides are smooth-shaded away by the 30° threshold, leaving only the rims —
// a cylinder outlined at every segment reads as a wireframe, not a solid.
const EDGE_THRESHOLD = 30

function unitGeometries() {
  return {
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
    cone: new THREE.ConeGeometry(0.5, 1, 20),
    // Deliberately coarse. A smoother sphere has no facet angle above the 30°
    // edge threshold, so it would come out with NO border line at all and
    // break the one rule the whole look rests on. Measured: (10,6) gives 40
    // outline lines, (12,8) gives zero.
    sphere: new THREE.SphereGeometry(0.5, 10, 6),
  }
}

export function createKit(scene) {
  const geometries = unitGeometries()
  const edgeGeometries = Object.fromEntries(
    Object.entries(geometries).map(([k, g]) => [k, new THREE.EdgesGeometry(g, EDGE_THRESHOLD)]),
  )

  const haloGeometry = new THREE.PlaneGeometry(1, 1)
  const haloMaterial = createHaloMaterial()
  const gltfLoader = new GLTFLoader()
  const modelTemplates = new Map()

  const pool = new Map()
  let frame = 0
  const camera = { x: 0, y: 0, z: 0, set: false }

  function acquire(key, build) {
    let entry = pool.get(key)
    if (!entry) {
      entry = { object: build(), lastFrame: frame }
      scene.add(entry.object)
      pool.set(key, entry)
    }
    entry.lastFrame = frame
    entry.object.visible = true
    return entry.object
  }

  function solid(kind, opts) {
    const {
      id,
      x = 0,
      y = 0,
      z = 0,
      w = 1,
      h = 1,
      d = 1,
      r,
      hue = 'slate',
      tone = 'mid',
      ry = 0,
      rx = 0,
      outline = true,
    } = opts

    if (!id) throw new Error(`[playable] every ${kind} needs a stable id`)

    const key = `${kind}:${id}`
    const mesh = acquire(key, () => {
      const m = new THREE.Mesh(geometries[kind], fillMaterial(hue, tone))
      m.userData.edges = new THREE.LineSegments(edgeGeometries[kind], lineMaterial(hue))
      m.userData.edges.visible = outline
      m.add(m.userData.edges) // Child, so it inherits position/scale/rotation.
      return m
    })

    // y is the BOTTOM of the solid: games think in "sitting on the ground",
    // Three.js positions from the centre.
    const width = r !== undefined ? r * 2 : w
    const depth = r !== undefined ? r * 2 : d
    mesh.position.set(x, y + h / 2, z)
    mesh.scale.set(width, h, depth)
    mesh.rotation.set(rx, ry, 0)
    mesh.material = fillMaterial(hue, tone)
    mesh.userData.edges.material = lineMaterial(hue)
    mesh.userData.edges.visible = outline
    return mesh
  }

  const kit = {
    box: (opts) => solid('box', opts),
    cylinder: (opts) => solid('cylinder', opts),
    cone: (opts) => solid('cone', opts),
    sphere: (opts) => solid('sphere', opts),

    /**
     * Soft shadow on the ground. y is the bottom of the caster, h its height.
     * Leave both off and the blob stays under (x, z), small and sharp.
     */
    halo({ id, x = 0, z = 0, y = 0, h = 0, size = 1 }) {
      if (!id) throw new Error('[playable] every halo needs a stable id')
      const shadow = projectHalo({ x, z, y, h, size })
      const mesh = acquire(`halo:${id}`, () => {
        const m = new THREE.Mesh(haloGeometry, haloMaterial)
        m.rotation.x = -Math.PI / 2
        m.onBeforeRender = function () {
          haloMaterial.uniforms.uPenumbra.value = this.userData.penumbra
          haloMaterial.uniforms.uOpacity.value = this.userData.opacity
        }
        return m
      })
      mesh.position.set(shadow.x, shadow.y, shadow.z)
      mesh.scale.set(shadow.size, shadow.size, 1)
      mesh.userData.penumbra = shadow.penumbra
      mesh.userData.opacity = shadow.opacity
      return mesh
    },

    /**
     * A Blender glTF, drawn with the same toon material as the kit.
     * The file stays on disk — do not put its bytes in state.
     * y is the bottom of the model, same as g.box.
     */
    model({ id, url, x = 0, y = 0, z = 0, ry = 0, scale = 1, hue = 'slate', tone = 'mid' }) {
      if (!id) throw new Error('[playable] every model needs a stable id')
      if (!url) throw new Error('[playable] model needs a url')
      const group = acquire(`model:${id}`, () => new THREE.Group())
      if (group.userData.url !== url) {
        group.userData.url = url
        group.userData.hue = null
        group.clear()
        loadTemplate(url).then((template) => {
          if (group.userData.url !== url) return
          const inner = template.clone(true)
          seatOnGround(inner)
          paint(inner, hue, tone)
          group.add(inner)
          group.userData.hue = hue
          group.userData.tone = tone
        }).catch((err) => {
          console.error('[playable] model failed to load:', url, err)
        })
      } else if (group.userData.hue !== hue || group.userData.tone !== tone) {
        paint(group, hue, tone)
        group.userData.hue = hue
        group.userData.tone = tone
      }
      group.position.set(x, y, z)
      group.rotation.y = ry
      group.scale.setScalar(scale)
      return group
    },

    /** Point the camera at a spot in the world. Call once per frame. */
    follow(x, y, z) {
      camera.x = x
      camera.y = y ?? 0
      camera.z = z
      camera.set = true
    },

    _beginFrame() {
      frame++
      camera.set = false
    },

    _endFrame() {
      for (const [key, entry] of pool) {
        if (entry.lastFrame === frame) continue
        entry.object.visible = false
        if (frame - entry.lastFrame > PRUNE_AFTER_FRAMES) {
          scene.remove(entry.object)
          // Geometries and materials are shared caches — disposing them here
          // would break every other object using them.
          pool.delete(key)
        }
      }
      return camera
    },

    _stats: () => ({ pooled: pool.size, frame }),
  }

  function loadTemplate(url) {
    let pending = modelTemplates.get(url)
    if (!pending) {
      pending = gltfLoader.loadAsync(url).then((gltf) => gltf.scene)
      modelTemplates.set(url, pending)
    }
    return pending
  }

  function seatOnGround(object) {
    object.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(object)
    if (Number.isFinite(box.min.y)) object.position.y -= box.min.y
  }

  function paint(object, hue, tone) {
    const material = fillMaterial(hue, tone)
    object.traverse((child) => {
      if (child.isMesh) child.material = material
    })
  }

  return kit
}
