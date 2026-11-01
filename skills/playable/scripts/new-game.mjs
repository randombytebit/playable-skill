#!/usr/bin/env node
// Scaffolds a playable game project.
//
//   node scripts/new-game.mjs <target-dir> --transport=local|tab [--render=2d|3d]
//                             [--example=hop|9upper] [--title="…"]
//
// Composes: shell + core + renderer + one transport. The result is a complete,
// runnable project whose only game-specific file is game.js.

import { cp, mkdir, readdir, writeFile } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATES = join(SKILL, 'templates')
// Runnable example projects live at the repo root; their game.js is the source
// of truth. Falls back to templates/examples so a standalone copy of
// skills/playable/ still works on its own.
const REPO_EXAMPLES = resolve(SKILL, '..', '..', 'examples')

function parseArgs(argv) {
  const opts = { transport: 'local', render: '2d', example: null, title: null, target: null }
  for (const arg of argv) {
    if (arg.startsWith('--transport=')) opts.transport = arg.slice(12)
    else if (arg.startsWith('--render=')) opts.render = arg.slice(9)
    else if (arg.startsWith('--example=')) opts.example = arg.slice(10)
    else if (arg.startsWith('--title=')) opts.title = arg.slice(8)
    else if (!arg.startsWith('--')) opts.target ??= arg
  }
  return opts
}

// Returns the game.js path for an example, or null if there is no such example.
function findExample(name) {
  const resolved = name === 'bluff' ? '9upper' : name
  for (const base of [REPO_EXAMPLES, join(TEMPLATES, 'examples')]) {
    const path = join(base, resolved, 'game.js')
    if (existsSync(path)) return path
  }
  return null
}

function listExamples() {
  const names = new Set()
  for (const base of [REPO_EXAMPLES, join(TEMPLATES, 'examples')]) {
    if (!existsSync(base)) continue
    for (const name of readdirSync(base)) {
      if (existsSync(join(base, name, 'game.js'))) names.add(name)
    }
  }
  return [...names].sort()
}

const die = (msg) => {
  console.error(`\n[playable] ${msg}\n`)
  process.exit(1)
}

const opts = parseArgs(process.argv.slice(2))

if (!opts.target) die('Pass a target directory.\n           node scripts/new-game.mjs ./my-game --transport=local')
if (!['local', 'tab'].includes(opts.transport)) {
  die(`Unknown transport "${opts.transport}". Use --transport=local or --transport=tab.`)
}
if (!['2d', '3d'].includes(opts.render)) {
  die(`Unknown renderer "${opts.render}". Use --render=2d or --render=3d.`)
}

const target = resolve(opts.target)

// Refuse to scatter files into an existing project; an empty dir is fine.
if (existsSync(target) && (await readdir(target)).length > 0) {
  die(`${target} already exists and is not empty.\n           Pick a new directory, or delete that one first.`)
}

if (opts.example && !findExample(opts.example)) {
  die(`No example called "${opts.example}". Available: ${listExamples().join(', ') || 'none'}`)
}

await mkdir(target, { recursive: true })

// Shared pieces.
await cp(join(TEMPLATES, 'shell'), target, { recursive: true })
await cp(join(TEMPLATES, 'core'), join(target, 'core'), { recursive: true })
// Always lands at ./renderer/, so core/main.js imports one fixed path whichever
// renderer was chosen.
await cp(join(TEMPLATES, `render-${opts.render}`), join(target, 'renderer'), { recursive: true })

// The chosen transport supplies net.js, which core/main.js imports blindly.
const transportDir = join(TEMPLATES, `transport-${opts.transport}`)
await cp(join(transportDir, 'net.js'), join(target, 'net.js'))

const pkg = {
  name: basename(target).toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
  private: true,
  type: 'module',
  scripts: {},
  dependencies: {},
}

if (opts.transport === 'local') {
  await cp(join(transportDir, 'server.mjs'), join(target, 'server.mjs'))
  pkg.scripts.start = 'node server.mjs'
  pkg.dependencies.ws = '^8.22.0'
} else {
  await cp(join(transportDir, 'serve.mjs'), join(target, 'serve.mjs'))
  pkg.scripts.start = 'node serve.mjs'
  pkg.dependencies.peerjs = '^1.5.5'
}

if (opts.render === '3d') {
  pkg.dependencies.three = '^0.186.1'
}

// Anything that has to reach the browser as a plain file gets copied out of
// node_modules into vendor/ after install — no bundler, no runtime CDN.
if (pkg.dependencies.peerjs || pkg.dependencies.three) {
  await cp(join(TEMPLATES, 'vendor-deps.mjs'), join(target, 'vendor-deps.mjs'))
  pkg.scripts.postinstall = 'node vendor-deps.mjs'
}

// The one game-specific file.
const gameSrc = opts.example
  ? findExample(opts.example)
  : join(TEMPLATES, opts.render === '3d' ? 'starter-game-3d.js' : 'starter-game.js')
await cp(gameSrc, join(target, 'game.js'))

await writeFile(join(target, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
await writeFile(join(target, '.gitignore'), 'node_modules/\nvendor/\n')
await writeFile(join(target, 'README.md'), readmeFor(opts))

console.log(`\n  Created ${target}\n`)
console.log(`  Next:\n`)
console.log(`    cd ${opts.target}`)
console.log(`    npm install`)
console.log(`    npm start\n`)

function readmeFor({ transport, title }) {
  const name = title ?? (transport === 'local' ? 'Your game' : 'Your game')
  const how =
    transport === 'local'
      ? `## Playing together

Run \`npm start\`. The terminal prints two addresses:

- **You:** open the \`localhost\` one.
- **Friends on the same Wi-Fi:** send them the second address.

Everyone needs to be on the same network. To play with someone elsewhere, you
would need to expose this port to the internet with a tunnel — ask Claude about
that first, since it makes a port on this computer publicly reachable.

The game only runs while this terminal is open.`
      : `## Playing together

Run \`npm start\` and open the address it prints. That tab becomes the game
host and shows a **join link** — send it to your friends.

- Keep your tab open: it is running the game for everyone.
- Players connect directly to you, so there is nothing to deploy.
- A free matchmaking service introduces players to each other. On some
  restrictive networks (many offices, some mobile data) direct connections
  cannot be established at all — see TROUBLESHOOTING in the skill, or use the
  local-server setup instead.`

  return `# ${name}

Built with the \`playable\` skill. Everything game-specific lives in **game.js** —
that is the only file worth editing by hand.

## Setup

\`\`\`sh
npm install
npm start
\`\`\`

${how}

## Changing the game

Describe what you want changed in plain language and let Claude edit \`game.js\`.
The surrounding files (\`core/\`, \`net.js\`, \`render-2d/\`) are plumbing and should
not need to change.
`
}
