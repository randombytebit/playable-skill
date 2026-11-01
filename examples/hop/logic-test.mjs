// Logic tests for Hop. No server, no browser — the simulation is driven
// directly through the same host loop the real game uses.
//
//   node logic-test.mjs
//
// The determinism checks matter most: the entire design rests on rowAt() and
// carX() being pure functions, because the host trusts them for collision while
// every client trusts them for rendering. If they ever disagree, players see
// different worlds.

import { createHostLoop } from './core/host-loop.js'
import game, { carX, rowAt } from './game.js'

let failed = 0
const results = []

function check(label, pass, detail = '') {
  results.push(`[${pass ? '  ok  ' : ' FAIL '}] ${label}${detail ? ` — ${detail}` : ''}`)
  if (!pass) failed++
}

// Runs `ticks` of simulation with a fixed input, as the host would.
function run(host, id, input, ticks) {
  host.setInput(id, input)
  for (let i = 0; i < ticks; i++) {
    game.step(host.state, { [id]: input }, 1 / 30)
  }
}

function fresh() {
  const host = createHostLoop(game)
  host.join('p1')
  return host
}

// --- determinism -----------------------------------------------------------

{
  const pairs = [
    [7, 3],
    [7, 11],
    [99, 3],
    [12345, 48],
  ]
  let stable = true
  for (const [seed, z] of pairs) {
    const a = JSON.stringify(rowAt(seed, z))
    const b = JSON.stringify(rowAt(seed, z))
    if (a !== b) stable = false
  }
  check('rowAt is stable across calls', stable)

  // Different seeds must actually produce different worlds, or every match
  // would be the same race.
  const worldA = [...Array(30).keys()].map((z) => rowAt(1, z).kind).join('')
  const worldB = [...Array(30).keys()].map((z) => rowAt(777, z).kind).join('')
  check('different seeds give different worlds', worldA !== worldB)
}

{
  const row = rowAt(42, 11)
  const roadRow = row.kind === 'road' ? row : rowAt(42, 13)
  if (roadRow.kind === 'road') {
    const sample = (t) => [0, 1, 2].map((k) => carX(roadRow, k, t).toFixed(6)).join(',')
    check('carX is a pure function of (row, k, time)', sample(3.5) === sample(3.5))

    // Cars must stay on the strip whatever the time value.
    let inBounds = true
    for (let t = 0; t < 400; t += 0.37) {
      for (let k = 0; k < roadRow.count; k++) {
        if (Math.abs(carX(roadRow, k, t)) > 40) inBounds = false
      }
    }
    check('cars stay within the strip as time grows', inBounds)
  } else {
    check('found a road row to test', false, 'no road row at seed 42')
  }
}

// --- world rules -------------------------------------------------------------

{
  // The apron and the finish must always be safe ground.
  const safeStart = [0, -1, -2].every((z) => rowAt(5, z).kind === 'grass')
  check('start apron is always safe', safeStart)
  check('finish row is always safe', rowAt(5, 50).kind === 'grass')

  // Every seventh row is forced to grass, so a run of roads cannot wall you in.
  let breathers = true
  for (let z = 7; z < 49; z += 7) {
    if (rowAt(5, z).kind !== 'grass') breathers = false
  }
  check('guaranteed grass row every 7 lanes', breathers)

  // No row may be fully blocked by trees.
  let passable = true
  for (let seed = 1; seed < 40; seed++) {
    for (let z = 1; z < 50; z++) {
      const row = rowAt(seed, z)
      if (row.kind === 'grass' && row.trees.length >= 19) passable = false
    }
  }
  check('no row is ever fully walled off by trees', passable)
}

// --- movement ----------------------------------------------------------------

{
  const host = fresh()
  const p = host.state.players.p1
  const startZ = p.gz
  run(host, 'p1', { up: true }, 12) // one hop takes ~4 ticks
  check('holding forward advances lanes', p.gz > startZ, `lane ${startZ} -> ${p.gz}`)
}

{
  // A tree must block a hop. Find a real tree and try to walk into it.
  const host = fresh()
  const p = host.state.players.p1
  let found = null
  for (let z = 1; z < 40 && !found; z++) {
    const row = rowAt(host.state.seed, z)
    if (row.kind === 'grass' && row.trees.length) found = { z, col: row.trees[0] }
  }

  if (found) {
    // Place the player right beside the tree and hop into it.
    p.gz = found.z
    p.fz = found.z
    p.z = found.z
    p.gx = found.col - 1
    p.fx = p.gx
    p.x = p.gx
    p.hopT = 1
    const before = p.gx
    run(host, 'p1', { right: true }, 6)
    check('a tree blocks a hop', p.gx === before, `tried to enter col ${found.col}`)
  } else {
    check('found a tree to test against', false)
  }
}

{
  // Standing in traffic must kill, and respawn must put you back, not out.
  const host = fresh()
  const p = host.state.players.p1
  let road = null
  for (let z = 1; z < 40 && !road; z++) {
    if (rowAt(host.state.seed, z).kind === 'road') road = z
  }

  const row = rowAt(host.state.seed, road)
  // Park the player exactly on top of a car.
  p.gz = road
  p.fz = road
  p.z = road
  const target = carX(row, 0, host.state.time)
  p.gx = Math.round(target)
  p.fx = p.gx
  p.x = target
  p.hopT = 1

  game.step(host.state, { p1: {} }, 1 / 30)
  check('a car kills the player it hits', p.dead === true, `on road lane ${road}`)

  const deathLane = p.gz
  for (let i = 0; i < 60; i++) game.step(host.state, { p1: {} }, 1 / 30) // ~2s
  check('player respawns behind, not eliminated', !p.dead && p.gz <= deathLane, `respawned at lane ${p.gz}`)
}

{
  // Reaching the finish wins, and only for the player who got there.
  const host = createHostLoop(game)
  host.join('p1')
  host.join('p2')
  const p1 = host.state.players.p1
  p1.gz = 50
  p1.z = 50
  game.step(host.state, { p1: {}, p2: {} }, 1 / 30)
  check('reaching lane 50 wins the race', host.state.winner === 'p1', `winner: ${host.state.winner}`)

  const p2Lane = host.state.players.p2.gz
  check('the loser is not teleported or removed', p2Lane === 0 && 'p2' in host.state.players)
}

{
  // A coin counts once, for the collector only.
  const host = createHostLoop(game)
  host.join('p1')
  host.join('p2')
  const p = host.state.players.p1
  let coin = null
  for (let z = 1; z < 60 && !coin; z++) {
    const row = rowAt(host.state.seed, z)
    if (row.coin !== null && row.kind === 'grass') coin = { z, col: row.coin }
  }

  p.gz = coin.z
  p.z = coin.z
  p.gx = coin.col
  p.x = coin.col
  p.hopT = 1
  game.step(host.state, { p1: {}, p2: {} }, 1 / 30)
  check('landing on a coin collects it', p.coins === 1, `${p.coins} coin(s)`)
  check('the other player gets nothing', host.state.players.p2.coins === 0)

  game.step(host.state, { p1: {}, p2: {} }, 1 / 30)
  check('a coin cannot be collected twice', p.coins === 1)
}

// --- report -------------------------------------------------------------------

console.log('')
for (const line of results) console.log(line)
console.log('')
console.log(failed ? `  ${failed} check(s) failed.\n` : `  All ${results.length} checks passed.\n`)
process.exit(failed ? 1 : 0)
