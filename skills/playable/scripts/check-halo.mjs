// Ground-shadow projection. No browser, no Three.js.
//
//   node scripts/check-halo.mjs

import { projectHalo } from '../templates/render-3d/theme.js'

const failed = []
const check = (label, pass) => {
  if (!pass) failed.push(label)
  console.log(`[${pass ? '  ok  ' : ' FAIL '}] ${label}`)
}

const grounded = projectHalo({ x: 2, z: -4, y: 0, h: 0, size: 1.3 })
check('on the ground, no sideways offset', grounded.x === 2 && grounded.z === -4)
check('on the ground, the blob stays the requested size', grounded.size === 1.3)
check('on the ground, the edge is sharp', grounded.penumbra === 0)

const raised = projectHalo({ x: 2, z: -4, y: 0.6, h: 0, size: 1.3 })
check('higher caster shifts along the light', raised.x !== grounded.x || raised.z !== grounded.z)
check('higher caster is softer', raised.penumbra > grounded.penumbra)
check('higher caster is larger', raised.size > grounded.size)
check('higher caster is fainter', raised.opacity < grounded.opacity)

const dx = raised.x - 2
const dz = raised.z + 4
check('offset follows the key light across x', dx < 0)
check('offset follows the key light across z', dz > 0)

const higher = projectHalo({ x: 2, z: -4, y: 1.2, h: 0, size: 1.3 })
check('more height, more offset', Math.hypot(higher.x - 2, higher.z + 4) > Math.hypot(dx, dz))
check('more height, softer still', higher.penumbra > raised.penumbra)

const capped = projectHalo({ x: 2, z: -4, y: 8, h: 0, size: 1.3 })
check('a very high caster stays fully soft, not harder', capped.penumbra === 1 && capped.penumbra >= higher.penumbra)

console.log('')
if (failed.length) {
  console.log(`  ${failed.length} check(s) failed.\n`)
  process.exit(1)
}
console.log('  Shadow projection passed.\n')
