// Copies browser-ready builds out of node_modules into vendor/ after install.
//
// Why vendor at all: there is no bundler here, and the browser cannot resolve
// bare imports like `from 'three'`. Copying the self-contained builds keeps the
// game folder portable (any static host, or a LAN with no internet) and avoids
// a third-party CDN call on every page load.
//
// Only the packages actually in package.json are processed, so this one script
// serves every combination of transport and renderer.
//
// Run automatically by the "postinstall" script.

import { copyFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'

const root = resolve(dirname(fileURLToPath(import.meta.url)))

const JOBS = {
  peerjs: [['dist/peerjs.min.js', 'vendor/peerjs.min.js']],
  // three.module.js imports ./three.core.js by relative path, so both files
  // must land side by side. Neither has bare imports, which is what makes a
  // bundler unnecessary.
  three: [
    ['build/three.module.js', 'vendor/three/three.module.js'],
    ['build/three.core.js', 'vendor/three/three.core.js'],
    // GLTFLoader imports bare 'three' (resolved by the import map) plus these
    // two siblings. Copy the tree so a Blender glTF loads with no CDN.
    ['examples/jsm/loaders/GLTFLoader.js', 'vendor/three/addons/loaders/GLTFLoader.js'],
    ['examples/jsm/utils/BufferGeometryUtils.js', 'vendor/three/addons/utils/BufferGeometryUtils.js'],
    ['examples/jsm/utils/SkeletonUtils.js', 'vendor/three/addons/utils/SkeletonUtils.js'],
  ],
}

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const wanted = Object.keys(JOBS).filter((name) => pkg.dependencies?.[name])

if (!wanted.length) {
  console.log('[playable] nothing to vendor')
  process.exit(0)
}

for (const name of wanted) {
  for (const [from, to] of JOBS[name]) {
    const src = join(root, 'node_modules', name, from)
    const dest = join(root, to)

    if (!existsSync(src)) {
      console.error(
        `\n[playable] Could not vendor ${name}: ${from} is missing.\n` +
          `           The game will not run. Try "npm install" again.\n`,
      )
      process.exit(1)
    }

    await mkdir(dirname(dest), { recursive: true })
    await copyFile(src, dest)
    console.log(`[playable] vendored ${name} -> ${to}`)
  }
}
