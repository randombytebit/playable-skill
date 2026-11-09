#!/usr/bin/env node
// Checks that game.js is still the shape it was scaffolded as.
//
//   node scripts/check-game.mjs <project-dir>
//
// Read-only. Does not start a server or open a browser. doctor.mjs answers
// "can it run"; this answers "did the game stay the shape we named".
// Exit 0 only when every line below is ok.

import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const dir = resolve(process.argv[2] ?? '.')
const results = []
const ok = (label, detail) => results.push({ level: 'ok', label, detail })
const bad = (label, detail) => results.push({ level: 'bad', label, detail })

const STARTER_TITLES = new Set(['New game', 'New 3D game'])

const RULES = {
  tag: {
    need: [
      [/itId/, 'itId'],
      [/touch\s*:\s*['"]stick['"]/, "touch: 'stick'"],
    ],
    forbid: [
      [/\blane\b/, 'a lane grid'],
      [/rowAt\b/, 'rowAt'],
      [/carX\b/, 'carX'],
    ],
  },
  race: {
    need: [
      [/\blap\b/, 'lap'],
      [/touch\s*:\s*['"]stick['"]/, "touch: 'stick'"],
    ],
    forbid: [
      [/\blane\b/, 'a lane grid'],
      [/rowAt\b/, 'rowAt'],
      [/carX\b/, 'carX'],
    ],
  },
  shot: {
    need: [
      [/\bshots\b/, 'a shots array'],
      [/['"]action['"]/, 'an action key'],
      [/touch\s*:\s*['"]stick['"]/, "touch: 'stick'"],
    ],
    forbid: [
      [/\blane\b/, 'a lane grid'],
      [/rowAt\b/, 'rowAt'],
      [/carX\b/, 'carX'],
    ],
  },
  hop: {
    need: [
      [/\blane\b/, 'lane'],
      [/rowAt\b/, 'rowAt'],
      [/touch\s*:\s*['"]swipe['"]/, "touch: 'swipe'"],
    ],
    forbid: [],
  },
  party: {
    need: [
      [/pointer\s*:\s*true/, 'pointer: true'],
      [/paper\.js/, 'paper.js'],
    ],
    forbid: [
      [/touch\s*:\s*['"](?:stick|swipe)['"]/, 'touch stick or swipe'],
      [/\blane\b/, 'a lane grid'],
      [/rowAt\b/, 'rowAt'],
    ],
  },
  board: {
    need: [
      [/pointer\s*:\s*true/, 'pointer: true'],
      [/paper\.js/, 'paper.js'],
      [/\bturn\b/, 'turn'],
    ],
    forbid: [
      [/touch\s*:\s*['"](?:stick|swipe)['"]/, 'touch stick or swipe'],
      [/\blane\b/, 'a lane grid'],
      [/rowAt\b/, 'rowAt'],
    ],
  },
}

function stepBody(source) {
  const match = source.match(/\bstep\s*\([^)]*\)\s*\{/)
  if (!match) return null
  let i = match.index + match[0].length
  let depth = 1
  let quote = null
  while (i < source.length && depth > 0) {
    const c = source[i]
    const prev = source[i - 1]
    if (quote) {
      if (c === quote && prev !== '\\') quote = null
    } else if (c === '"' || c === "'" || c === '`') {
      quote = c
    } else if (c === '{') {
      depth++
    } else if (c === '}') {
      depth--
    }
    i++
  }
  return source.slice(match.index + match[0].length, i - 1)
}

let source = ''
try {
  source = await readFile(join(dir, 'game.js'), 'utf8')
  ok('game.js', 'found')
} catch {
  bad('game.js', `No game.js in ${dir}`)
}

let shape = null
try {
  const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
  shape = pkg?.playable?.shape ?? null
  if (!shape) bad('Shape', 'package.json has no playable.shape — scaffold with --shape=')
  else if (!RULES[shape]) bad('Shape', `unknown shape "${shape}"`)
  else ok('Shape', shape)
} catch {
  bad('Shape', 'No package.json — is this a scaffolded game?')
}

if (source) {
  const title = source.match(/title\s*:\s*['"]([^'"]+)['"]/)?.[1] ?? ''
  if (STARTER_TITLES.has(title)) bad('Title', `"${title}" is still the starter`)
  else if (!title) bad('Title', 'game.js has no title')
  else ok('Title', title)

  if (source.includes('TICK_HZ')) bad('Tick', 'game.js mentions TICK_HZ — do not change the tick rate')
  else ok('Tick', 'tick rate left alone')

  if (/from\s+['"][^'"]*\bcore\b/.test(source)) bad('Imports', 'game.js imports core/ — plumbing stays untouched')
  else ok('Imports', 'does not import core/')

  const body = stepBody(source)
  if (body == null) bad('step', 'no step() function')
  else if (/Math\.random\s*\(/.test(body) || /Date\.now\s*\(/.test(body)) {
    bad('step', 'step() calls Math.random or Date.now — host and clients would disagree')
  } else ok('step', 'no clock or random in step()')

  const rules = RULES[shape]
  if (rules) {
    for (const [pattern, label] of rules.need) {
      if (pattern.test(source)) ok('Needs', label)
      else bad('Needs', `missing ${label}`)
    }
    for (const [pattern, label] of rules.forbid) {
      if (pattern.test(source)) bad('Forbids', `still has ${label}`)
      else ok('Forbids', `no ${label}`)
    }
  }
}

const icon = { ok: '  ok  ', bad: ' FAIL ' }
console.log('')
for (const row of results) console.log(`[${icon[row.level]}] ${row.label.padEnd(12)} ${row.detail}`)
const failures = results.filter((row) => row.level === 'bad')
console.log('')
if (failures.length) {
  console.log(`  ${failures.length} problem(s). Fix game.js, or scaffold again with --shape=${shape || '<name>'}.\n`)
  process.exit(1)
}
console.log('  Shape checks passed.\n')
