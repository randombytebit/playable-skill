// Local-server transport, host half. Run this on your own machine:
//
//   npm start
//
// It does two things: serves the game's static files, and runs the
// authoritative simulation. Players — including you — connect from a browser.

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { networkInterfaces } from 'node:os'
import { WebSocketServer } from 'ws'

import game from './game.js'
import { createHostLoop } from './core/host-loop.js'
import { decode, encode, TICK_HZ } from './core/protocol.js'
import { pongFor } from './core/ping.js'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)))
const PORT = Number(process.env.PORT) || 8080
const HOST = process.env.HOST || '0.0.0.0' // 0.0.0.0 so phones on the LAN can reach it.

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
    const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).slice(1)
    const path = resolve(join(ROOT, rel))

    // Never serve outside the project directory, however the path is encoded.
    if (path !== ROOT && !path.startsWith(ROOT + sep)) {
      res.writeHead(403).end('Forbidden')
      return
    }

    const body = await readFile(path)
    res.writeHead(200, {
      'content-type': MIME[extname(path)] ?? 'application/octet-stream',
      'cache-control': 'no-store', // Always pick up edits on reload.
    })
    res.end(body)
  } catch (err) {
    const code = err.code === 'ENOENT' || err.code === 'EISDIR' ? 404 : 500
    if (code === 500) console.error('[playable]', err)
    res.writeHead(code).end(code === 404 ? 'Not found' : 'Server error')
  }
})

// --- authoritative simulation -------------------------------------------

const host = createHostLoop(game, { tickHz: TICK_HZ })
const clients = new Map() // id -> socket
let nextId = 1

const wss = new WebSocketServer({ server })

wss.on('connection', (socket) => {
  if (host.isFull()) {
    socket.send(encode({ t: 'full', reason: 'This game is already full.' }))
    socket.close()
    return
  }

  const id = `p${nextId++}`
  clients.set(id, socket)
  host.join(id)
  socket.send(
    encode({ t: 'welcome', id, title: game.title ?? 'playable', tickHz: TICK_HZ }),
  )
  console.log(`[playable] ${id} joined (${host.playerCount} playing)`)

  socket.on('message', (raw) => {
    const msg = decode(raw)
    if (msg?.t === 'input') host.setInput(id, msg.input)
    const pong = pongFor(msg)
    if (pong && socket.readyState === socket.OPEN) socket.send(encode(pong))
  })

  const drop = () => {
    if (!clients.delete(id)) return
    host.leave(id)
    console.log(`[playable] ${id} left (${host.playerCount} playing)`)
  }
  socket.on('close', drop)
  socket.on('error', drop)
})

host.start((snapshot) => {
  // Serialize once, not once per client.
  const payload = encode(snapshot)
  for (const socket of clients.values()) {
    if (socket.readyState === socket.OPEN) socket.send(payload)
  }
})

function lanAddress() {
  for (const ifaces of Object.values(networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return null
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[playable] Port ${PORT} is already in use.\n` +
        `           Something else is running there — close it, or start with:\n` +
        `           PORT=8081 npm start\n`,
    )
    process.exit(1)
  }
  throw err
})

server.listen(PORT, HOST, () => {
  const lan = lanAddress()
  console.log(`\n  ${game.title ?? 'playable'} is running.\n`)
  console.log(`  You:              http://localhost:${PORT}`)
  if (lan) console.log(`  Same Wi-Fi:       http://${lan}:${PORT}`)
  console.log(`\n  Stop with Ctrl+C.\n`)
})

const shutdown = () => {
  host.stop()
  wss.close()
  server.close(() => process.exit(0))
  // Clients hold the socket open; don't wait on them forever.
  setTimeout(() => process.exit(0), 500).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
