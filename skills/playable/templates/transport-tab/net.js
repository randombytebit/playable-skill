// Browser-tab transport. One tab is the authority; everyone else connects to
// it directly over WebRTC.
//
//   open index.html          -> you are the HOST, you get a room code
//   open index.html#ABC234   -> you are a CLIENT joining that code
//
// A free public broker (PeerJS's cloud) introduces the peers, then drops out of
// the conversation. Two consequences a player will eventually hit:
//   - if that broker is down, NEW connections cannot form
//   - with no TURN relay, strict/symmetric NATs never connect at all
// Both surface in the lobby panel rather than hanging silently.

import { decode, encode } from './core/protocol.js'
import { createEmitter } from './core/emitter.js'
import { createPing, describeRtt, pongFor } from './core/ping.js'

// Room codes share a global namespace on the public broker, so they carry a
// prefix. Alphabet omits 0/O/1/I/L — these get read aloud and mistyped.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6
const PREFIX = 'playable-'

const makeCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(CODE_LENGTH)))
    .map((n) => ALPHABET[n % ALPHABET.length])
    .join('')

// Vendored locally: no CDN at runtime, so the folder works on any static host.
function loadPeerJs() {
  if (window.Peer) return Promise.resolve(window.Peer)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = './vendor/peerjs.min.js'
    script.onload = () => resolve(window.Peer)
    script.onerror = () => reject(new Error('Could not load the networking library.'))
    document.head.append(script)
  })
}

const joinUrl = (code) => `${location.origin}${location.pathname}#${code}`

export async function createNet({ game, lobby }) {
  const Peer = await loadPeerJs().catch((err) => {
    lobby.fail(err.message, 'Is vendor/peerjs.min.js still next to index.html?')
    throw err
  })

  const requested = location.hash.slice(1).toUpperCase()
  return requested ? joinAsClient(Peer, requested, lobby) : hostRoom(Peer, game, lobby)
}

// Resolves once the broker has accepted us under `id`. Retries on collision,
// which is a live risk on a shared public namespace.
function claimId(Peer, id, attemptsLeft, onCollision) {
  return new Promise((resolve, reject) => {
    const peer = new Peer(id, { debug: 1 })
    const cleanup = () => {
      peer.off('open', ok)
      peer.off('error', fail)
    }
    const ok = () => {
      cleanup()
      resolve(peer)
    }
    const fail = (err) => {
      cleanup()
      peer.destroy()
      if (err.type === 'unavailable-id' && attemptsLeft > 0) {
        const next = onCollision()
        resolve(claimId(Peer, next.id, attemptsLeft - 1, onCollision))
      } else {
        reject(err)
      }
    }
    peer.on('open', ok)
    peer.on('error', fail)
  })
}

function brokerHint(err) {
  if (err?.type === 'network' || err?.type === 'server-error' || err?.type === 'socket-error') {
    return 'The free matchmaking service looks unreachable. Try again shortly, or switch to the local-server setup.'
  }
  if (err?.type === 'peer-unavailable') {
    return 'No game is running under that code. Check the code, and that the host still has their tab open.'
  }
  return 'Some networks (office Wi-Fi, some mobile data) block direct connections. The local-server setup works where this does not.'
}

async function hostRoom(Peer, game, lobby) {
  lobby.setStatus('connecting', 'Opening your game room…')

  let code = makeCode()
  const peer = await claimId(Peer, PREFIX + code, 5, () => {
    code = makeCode() // Collision: take a new code and try again.
    return { id: PREFIX + code }
  }).catch((err) => {
    lobby.fail('Could not open a room.', brokerHint(err))
    throw err
  })

  const events = createEmitter()
  const conns = new Map() // peerId -> DataConnection

  peer.on('connection', (conn) => {
    conn.on('open', () => {
      conns.set(conn.peer, conn)
      events.emit('join', conn.peer)
      conn.send(encode({ t: 'welcome', id: conn.peer, title: game.title ?? 'playable' }))
    })
    conn.on('data', (raw) => {
      const msg = decode(raw)
      if (msg?.t === 'input') events.emit('input', conn.peer, msg.input)
      const pong = pongFor(msg)
      if (pong && conn.open) conn.send(encode(pong))
    })
    const drop = () => {
      if (conns.delete(conn.peer)) events.emit('leave', conn.peer)
    }
    conn.on('close', drop)
    conn.on('error', drop)
  })

  peer.on('error', (err) => {
    // Per-connection failures must not take down a running game.
    if (err.type === 'peer-unavailable') return
    lobby.fail('Matchmaking problem.', brokerHint(err))
  })

  lobby.setStatus('connected', 'Your room is open. Invite people with the link or QR code.')
  lobby.setShare('Invite link:', joinUrl(code), code)

  return {
    role: 'host',
    selfId: 'host',
    roomCode: code,
    onPeerJoin: (fn) => events.on('join', fn),
    onPeerLeave: (fn) => events.on('leave', fn),
    onInput: (fn) => events.on('input', fn),
    broadcastState(snapshot) {
      const payload = encode(snapshot)
      for (const conn of conns.values()) if (conn.open) conn.send(payload)
    },
    reject(id, reason) {
      const conn = conns.get(id)
      if (!conn) return
      conn.send(encode({ t: 'full', reason }))
      conn.close()
      conns.delete(id)
    },
    onState() {},
    sendInput() {},
    close: () => peer.destroy(),
  }
}

async function joinAsClient(Peer, code, lobby) {
  lobby.setStatus('connecting', `Joining game ${code}…`)
  const events = createEmitter()

  // Clients take a broker-assigned id; only the host needs a specific one.
  const peer = await new Promise((resolve, reject) => {
    const p = new Peer({ debug: 1 })
    p.on('open', () => resolve(p))
    p.on('error', reject)
  }).catch((err) => {
    lobby.fail('Could not reach matchmaking.', brokerHint(err))
    throw err
  })

  const conn = peer.connect(PREFIX + code, { reliable: true })
  const ping = createPing({
    send(msg) {
      if (conn.open) conn.send(encode(msg))
    },
  })

  const welcome = await new Promise((resolve, reject) => {
    // WebRTC gives up silently; without this the panel would say "Joining…" forever.
    const timer = setTimeout(
      () => reject(new Error('Could not connect to the host.')),
      15000,
    )

    conn.on('data', (raw) => {
      const msg = decode(raw)
      if (!msg) return
      if (msg.t === 'welcome') {
        clearTimeout(timer)
        resolve(msg)
      } else if (msg.t === 'full') {
        clearTimeout(timer)
        reject(new Error(msg.reason ?? 'That game is full.'))
      } else if (msg.t === 'state') {
        events.emit('state', msg.state)
      } else if (msg.t === 'pong') {
        const rtt = ping.handle(msg)
        if (rtt != null) lobby.setPing({ ...describeRtt(rtt), ms: rtt })
      }
    })

    conn.on('close', () => {
      clearTimeout(timer)
      lobby.show()
      lobby.fail('The host closed the game.', 'Reload once they open it again.')
    })
    peer.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  }).catch((err) => {
    lobby.fail(err.message, brokerHint(err))
    throw err
  })

  lobby.setStatus('connected', `Connected to ${code}`)
  ping.start()

  return {
    role: 'client',
    selfId: welcome.id,
    roomCode: code,
    onState: (fn) => events.on('state', fn),
    sendInput(input) {
      if (conn.open) conn.send(encode({ t: 'input', input }))
    },
    onPeerJoin() {},
    onPeerLeave() {},
    onInput() {},
    broadcastState() {},
    reject() {},
    close() {
      ping.stop()
      peer.destroy()
    },
  }
}
