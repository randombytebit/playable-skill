// Wires game.js to the transport, the loops, and the renderer.
// Nothing here is game-specific — a generated game never edits this file.

import game from '../game.js'
import { createNet } from '../net.js'
import { createHostLoop } from './host-loop.js'
import { createClientLoop } from './client-loop.js'
import { createInput } from './input.js'
import { createLobby, makeRoomCode } from './lobby.js'
// Whichever renderer was scaffolded (2D or 3D) lands at ./renderer/ and exports
// the same createSurface shape, so nothing here knows which one it got.
import { createSurface } from '../renderer/surface.js'
import { TICK_HZ } from './protocol.js'

const canvas = document.getElementById('stage')
const lobby = createLobby(document.getElementById('lobby'), game)
// The 3D renderer throws here when WebGL will not start. Without this the page
// would be a blank canvas with no explanation.
let surface
try {
  surface = createSurface(canvas, game.view)
} catch (err) {
  lobby.fail('This game cannot start.', err.message)
  throw err
}
const readRawInput = createInput(game, canvas)
const maxPlayers = game.players?.max ?? 8

document.title = game.title ?? 'playable'

// Pointer arrives in CSS pixels; the game thinks in logical coordinates.
function readInput() {
  const input = readRawInput()
  if (typeof input.px === 'number') {
    const { x, y } = surface.toGameCoords(input.px, input.py)
    input.px = x
    input.py = y
  }
  Object.assign(input, lobby.consumeSettings())
  return input
}

function draw(state, selfId) {
  if (state?.lang === 'zh' || state?.lang === 'en') lobby.followLang(state.lang)
  const g = surface.begin()
  try {
    game.draw(g, state, selfId)
  } catch (err) {
    console.error('[playable] game.draw() threw:', err)
  } finally {
    surface.end()
  }
}

const room = await lobby.chooseRoom(game.title ?? 'playable')
if (room.action === 'join' && room.code) location.hash = room.code
else if (room.action === 'create') location.hash = ''

const net = await createNet({ game, lobby })
if (net.roomCode) location.hash = net.roomCode
else if (room.action === 'create' && !location.hash) location.hash = makeRoomCode()
// Refresh after the hash is settled so the QR encodes the real invite URL.
lobby.setShare(
  'Invite link:',
  `${location.origin}${location.pathname}${location.hash}`,
  net.roomCode || location.hash.replace(/^#/, ''),
)

const client = createClientLoop(game, {
  draw,
  getInput: readInput,
  tickHz: TICK_HZ,
  // Host feeds its own input straight into the simulation; a client ships it
  // over the wire. Same call site, different destination.
  sendInput: net.role === 'host' ? (input) => host.setInput(net.selfId, input) : net.sendInput,
})
client.setSelfId(net.selfId)

let host = null
if (net.role === 'host') {
  host = createHostLoop(game, { tickHz: TICK_HZ })
  host.join(net.selfId) // The host plays too.

  net.onPeerJoin((id) => {
    if (host.isFull()) {
      net.reject(id, 'Room is full')
      return
    }
    host.join(id)
    lobby.setPeers(host.playerCount, maxPlayers)
  })
  net.onPeerLeave((id) => {
    host.leave(id)
    lobby.setPeers(host.playerCount, maxPlayers)
  })
  net.onInput((id, input) => host.setInput(id, input))

  // Host state is mutated in place, so clone before holding it. The host
  // then interpolates like every other tab (~one tick behind) instead of
  // drawing raw 30Hz steps while guests glide.
  client.onSnapshot(structuredClone(host.state))
  host.start((snapshot) => {
    net.broadcastState(snapshot)
    client.onSnapshot(structuredClone(snapshot.state))
  })
  lobby.setPeers(host.playerCount, maxPlayers)
} else {
  net.onState((state) => client.onSnapshot(state))
}

client.start()

window.addEventListener('beforeunload', () => {
  host?.stop()
  net.close()
})
