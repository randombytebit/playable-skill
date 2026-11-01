#!/usr/bin/env node
// End-to-end test for a local-transport project, with no browser involved.
//
//   node scripts/smoke-test.mjs <project-dir>
//
// Starts the project's real server and drives it with two WebSocket clients,
// checking the things that actually break: that snapshots flow at the right
// rate, that input reaches the simulation, that players see *each other* and
// not just themselves, and that a disconnect is cleaned up.
//
// The tab transport cannot be covered here — WebRTC needs a real browser — so
// it is verified by opening two tabs by hand.

import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const dir = resolve(process.argv[2] ?? '.')
const PORT = Number(process.env.PORT) || 8099
const require = createRequire(join(dir, 'package.json'))
const WebSocket = require('ws')

const results = []
let failed = 0

function check(label, pass, detail = '') {
  results.push(`[${pass ? '  ok  ' : ' FAIL '}] ${label}${detail ? ` — ${detail}` : ''}`)
  if (!pass) failed++
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// A test client that records every snapshot it is sent.
function connect(url) {
  const ws = new WebSocket(url)
  const client = { id: null, snapshots: [], pongs: [], ws, closed: false }
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw)
    if (msg.t === 'welcome') client.id = msg.id
    else if (msg.t === 'state') client.snapshots.push(msg)
    else if (msg.t === 'pong') client.pongs.push(msg)
  })
  ws.on('close', () => {
    client.closed = true
  })
  client.ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timed out waiting for welcome')), 5000)
    const poll = setInterval(() => {
      if (client.id) {
        clearTimeout(timer)
        clearInterval(poll)
        resolve(client)
      }
    }, 10)
    ws.on('error', reject)
  })
  client.send = (input) => ws.send(JSON.stringify({ t: 'input', input }))
  return client
}

const server = spawn('node', ['server.mjs'], {
  cwd: dir,
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let serverLog = ''
server.stdout.on('data', (d) => (serverLog += d))
server.stderr.on('data', (d) => (serverLog += d))

const stopServer = () => {
  server.kill('SIGINT')
  setTimeout(() => server.kill('SIGKILL'), 1500).unref()
}

try {
  // Give the server a moment to bind before the first connection.
  await sleep(600)
  if (server.exitCode !== null) throw new Error(`server exited early:\n${serverLog}`)

  const url = `ws://127.0.0.1:${PORT}`

  // --- 1. a client can join -------------------------------------------
  const a = await connect(url).ready
  check('client A joins and is assigned an id', Boolean(a.id), a.id)

  const pingAt = Date.now()
  a.ws.send(JSON.stringify({ t: 'ping', at: pingAt }))
  await sleep(200)
  const pong = a.pongs.find((p) => p.at === pingAt)
  check('host echoes a ping', Boolean(pong), pong ? 'pong' : 'no pong')

  // --- 2. snapshots arrive at roughly the tick rate --------------------
  a.snapshots.length = 0
  await sleep(1000)
  const rate = a.snapshots.length
  check('snapshots arrive at ~30Hz', rate >= 24 && rate <= 36, `${rate}/sec`)

  // --- 3. snapshots stay small -----------------------------------------
  // The whole state ships every tick, so size is the thing that decides
  // whether a game is playable over a remote connection. 4KB at 30Hz is
  // ~120KB/s, which a typical home upload can carry alongside everything else.
  const bytes = Buffer.byteLength(JSON.stringify(a.snapshots.at(-1)))
  check('snapshot is small enough to stream', bytes < 4096, `${bytes} bytes/tick ≈ ${Math.round((bytes * 30) / 1024)}KB/s`)

  // --- 4. the server serves the client files ---------------------------
  const page = await fetch(`http://127.0.0.1:${PORT}/`).then((r) => r.text())
  check('index.html is served', page.includes('core/main.js'))
  const traversal = await fetch(`http://127.0.0.1:${PORT}/../../etc/passwd`)
  check('path traversal is refused', traversal.status === 403 || traversal.status === 404, `HTTP ${traversal.status}`)

  // --- 5. input reaches the simulation ---------------------------------
  // Movement games change a pose field (x/y/z). Party / tap games have no
  // pose — holding a direction must not crash, and the player stays listed.
  const moved = (snapshotBefore, snapshotAfter, id) => {
    const before = snapshotBefore.state.players[id] ?? {}
    const after = snapshotAfter.state.players[id] ?? {}
    const changed = Object.keys(after).filter(
      (k) => typeof after[k] === 'number' && typeof before[k] === 'number' && after[k] !== before[k],
    )
    return changed
  }
  const hasPose = (p) => p && ['x', 'y', 'z'].some((k) => typeof p[k] === 'number')

  const aBefore = a.snapshots.at(-1)
  a.send({ right: true, left: false, up: false, down: false })
  await sleep(500)
  const aAfter = a.snapshots.at(-1)
  const aChanged = moved(aBefore, aAfter, a.id)
  const aStill = Boolean(aAfter?.state?.players?.[a.id])
  if (hasPose(aBefore.state.players[a.id])) {
    check('input moves the player', aChanged.length > 0, `changed: ${aChanged.join(', ') || 'nothing'}`)
  } else {
    check('input is accepted', aStill, aStill ? 'player still in state' : 'player missing')
  }
  a.send({ right: false })

  // --- 6. players can see each other ------------------------------------
  const b = await connect(url).ready
  await sleep(300)
  const seenByA = Object.keys(a.snapshots.at(-1).state.players)
  check('A sees B join', seenByA.includes(b.id), `A sees [${seenByA}]`)

  // Read from A's snapshots, not B's: this proves the host broadcasts other
  // players, rather than merely echoing each client to itself.
  const bBefore = a.snapshots.at(-1)
  b.send({ up: true })
  await sleep(500)
  const bAfter = a.snapshots.at(-1)
  const bChanged = moved(bBefore, bAfter, b.id)
  if (hasPose(bBefore.state.players[b.id])) {
    check("A sees B's movement", bChanged.length > 0, `changed: ${bChanged.join(', ') || 'nothing'}`)
  } else {
    check('A still sees B after B sends input', Boolean(bAfter.state.players[b.id]))
  }
  b.send({ up: false })

  a.send({ name: 'Ada' })
  await sleep(200)
  const aNamed = a.snapshots.at(-1).state.players[a.id]
  check('player name from input', aNamed?.name === 'Ada', aNamed?.name ?? 'missing')

  // --- 7. leaving is cleaned up and the game keeps running --------------
  b.ws.close()
  await sleep(400)
  const afterLeave = a.snapshots.at(-1).state.players
  check('B is removed when it disconnects', !(b.id in afterLeave))

  const seqBefore = a.snapshots.at(-1).seq
  await sleep(300)
  check('game keeps ticking after a player leaves', a.snapshots.at(-1).seq > seqBefore)

  a.ws.close()
} catch (err) {
  check('test harness ran', false, err.message)
} finally {
  stopServer()
}

console.log('')
for (const line of results) console.log(line)
console.log('')
console.log(failed ? `  ${failed} check(s) failed.\n` : `  All ${results.length} checks passed.\n`)
process.exit(failed ? 1 : 0)
