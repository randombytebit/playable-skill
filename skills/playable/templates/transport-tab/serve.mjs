// Static file server, for playing on this machine during development.
//
//   npm start
//
// Unlike the local-server transport, this process has NO game logic in it and
// no authority — the browser tab runs the game. It exists only because
// browsers refuse to load ES modules from file:// URLs.
//
// Because it is only serving files, this whole folder can be dropped onto any
// static host instead, and the game still runs on the host player's device.

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)))
const PORT = Number(process.env.PORT) || 8080

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
    const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).slice(1)
    const path = resolve(join(ROOT, rel))

    if (path !== ROOT && !path.startsWith(ROOT + sep)) {
      res.writeHead(403).end('Forbidden')
      return
    }

    const body = await readFile(path)
    res.writeHead(200, {
      'content-type': MIME[extname(path)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    })
    res.end(body)
  } catch (err) {
    const code = err.code === 'ENOENT' || err.code === 'EISDIR' ? 404 : 500
    if (code === 500) console.error('[playable]', err)
    res.writeHead(code).end(code === 404 ? 'Not found' : 'Server error')
  }
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[playable] Port ${PORT} is busy. Try: PORT=8081 npm start\n`)
    process.exit(1)
  }
  throw err
})

server.listen(PORT, () => {
  console.log(`\n  Open http://localhost:${PORT} to start a game.`)
  console.log(`  You will get a join link to send to your friends.\n`)
  console.log(`  Keep this tab open — it is running the game.`)
  console.log(`  Stop the server with Ctrl+C.\n`)
})
