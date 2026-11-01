#!/usr/bin/env node
// Pre-flight check for a scaffolded game project.
//
//   node scripts/doctor.mjs <project-dir> [--port=8080]
//
// Answers the questions a stuck player cannot: is the runtime new enough, is
// the port free, are the files intact, and what address do friends actually use?

import { readFile, access } from 'node:fs/promises'
import { createServer } from 'node:http'
import { networkInterfaces } from 'node:os'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const dir = resolve(args.find((a) => !a.startsWith('--')) ?? '.')
const port = Number(args.find((a) => a.startsWith('--port='))?.slice(7)) || 8080

const results = []
const ok = (label, detail) => results.push({ level: 'ok', label, detail })
const warn = (label, detail) => results.push({ level: 'warn', label, detail })
const bad = (label, detail) => results.push({ level: 'bad', label, detail })

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  )

// --- runtime -------------------------------------------------------------

const major = Number(process.versions.node.split('.')[0])
if (major >= 18) ok('Node.js', `v${process.versions.node}`)
else bad('Node.js', `v${process.versions.node} is too old — this needs v18 or newer.`)

// --- project files -------------------------------------------------------

let pkg = null
try {
  pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
  ok('Project', `${pkg.name ?? 'unnamed'} at ${dir}`)
} catch {
  bad('Project', `No package.json in ${dir} — is this a game folder?`)
}

const isLocal = await exists(join(dir, 'server.mjs'))
const isTab = await exists(join(dir, 'serve.mjs'))
const transport = isLocal ? 'local' : isTab ? 'tab' : null

if (transport) ok('Transport', transport === 'local' ? 'local server (host machine is authoritative)' : 'browser tab (host tab is authoritative)')
else bad('Transport', 'Neither server.mjs nor serve.mjs found.')

for (const file of ['game.js', 'net.js', 'index.html', 'core/main.js', 'renderer/surface.js']) {
  if (!(await exists(join(dir, file)))) bad('Missing file', file)
}

// kit.js only ships with the 3D renderer, so its presence identifies which one
// was scaffolded.
const is3d = await exists(join(dir, 'renderer/kit.js'))
ok('Renderer', is3d ? '3D (three.js, orthographic)' : '2D (Canvas2D)')

const hasModules = await exists(join(dir, 'node_modules'))
if (hasModules) ok('Dependencies', 'installed')
else warn('Dependencies', 'not installed yet — run "npm install" first.')

// Vendored browser builds: missing ones mean a blank page, so check each.
const vendored = [
  transport === 'tab' && ['Networking library', 'vendor/peerjs.min.js'],
  is3d && ['3D library', 'vendor/three/three.module.js'],
  is3d && ['3D library core', 'vendor/three/three.core.js'],
].filter(Boolean)

for (const [label, file] of vendored) {
  if (await exists(join(dir, file))) ok(label, `vendored at ${file}`)
  else if (hasModules) bad(label, `${file} is missing — run "npm install" again.`)
  else warn(label, 'will be vendored by "npm install".')
}

// game.js must at least parse and expose the required hooks.
if (await exists(join(dir, 'game.js'))) {
  try {
    const game = (await import(join(dir, 'game.js'))).default
    const missing = ['init', 'step', 'draw'].filter((fn) => typeof game?.[fn] !== 'function')
    if (missing.length) bad('game.js', `missing required function(s): ${missing.join(', ')}`)
    else ok('game.js', `"${game.title ?? 'untitled'}", up to ${game.players?.max ?? 8} players`)
  } catch (err) {
    bad('game.js', `failed to load: ${err.message}`)
  }
}

// --- port ----------------------------------------------------------------

const portFree = await new Promise((done) => {
  const probe = createServer()
  probe.once('error', () => done(false))
  probe.once('listening', () => probe.close(() => done(true)))
  probe.listen(port, '0.0.0.0')
})

if (portFree) ok('Port', `${port} is free`)
else bad('Port', `${port} is in use. Start with PORT=${port + 1} npm start`)

// --- addresses -----------------------------------------------------------

const lan = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === 'IPv4' && !i.internal)
  .map((i) => i.address)

if (transport === 'local') {
  if (lan.length) ok('Invite address', lan.map((a) => `http://${a}:${port}`).join('  '))
  else warn('Invite address', 'No network connection found — only this computer can play.')
} else if (transport === 'tab') {
  ok('Invite address', 'the join link shown in your browser tab once the game opens')
}

// --- report --------------------------------------------------------------

const icon = { ok: '  ok  ', warn: ' warn ', bad: ' FAIL ' }
console.log('')
for (const r of results) console.log(`[${icon[r.level]}] ${r.label.padEnd(20)} ${r.detail}`)

const failures = results.filter((r) => r.level === 'bad')
const warnings = results.filter((r) => r.level === 'warn')
console.log('')
if (failures.length) {
  console.log(`  ${failures.length} problem(s) to fix before the game will run.\n`)
  process.exit(1)
}
console.log(warnings.length ? `  Ready, with ${warnings.length} thing(s) to note above.\n` : '  Ready to play.\n')
