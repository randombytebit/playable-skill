// Local-server transport, browser half.
//
// In this mode the authority lives in server.mjs on the host's machine, so
// EVERY browser — including the one on the host's own computer — is a client.
// That is the main difference from the tab transport.

import { decode, encode } from './core/protocol.js'
import { createEmitter } from './core/emitter.js'
import { createPing, describeRtt } from './core/ping.js'

export async function createNet({ lobby }) {
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${scheme}://${location.host}`)
  const events = createEmitter()
  const ping = createPing({
    send(msg) {
      if (ws.readyState === WebSocket.OPEN) ws.send(encode(msg))
    },
  })

  lobby.setStatus('connecting', 'Connecting to the game host…')

  const welcome = await new Promise((resolve, reject) => {
    ws.addEventListener('message', (event) => {
      const msg = decode(event.data)
      if (!msg) return
      if (msg.t === 'welcome') {
        resolve(msg)
      } else if (msg.t === 'full') {
        reject(new Error(msg.reason ?? 'Room is full'))
      } else if (msg.t === 'state') {
        events.emit('state', msg.state)
      } else if (msg.t === 'pong') {
        const rtt = ping.handle(msg)
        if (rtt != null) lobby.setPing({ ...describeRtt(rtt), ms: rtt })
      }
    })

    ws.addEventListener('error', () => reject(new Error('Could not reach the game host')))

    ws.addEventListener('close', () => {
      // Covers both "never connected" and "host quit mid-game".
      lobby.show()
      lobby.fail(
        'Disconnected from the host.',
        'The host may have stopped the game. Reload once it is running again.',
      )
    })
  }).catch((err) => {
    lobby.fail(err.message, 'Check that the host is still running, then reload.')
    throw err
  })

  lobby.setStatus('connected', 'Your room is open. Invite people with the link or QR code.')
  lobby.setShare('Invite link:', location.href, location.hash.replace(/^#/, ''))
  ping.start()

  return {
    role: 'client',
    selfId: welcome.id,
    roomCode: null,
    onState: (fn) => events.on('state', fn),
    sendInput(input) {
      if (ws.readyState === WebSocket.OPEN) ws.send(encode({ t: 'input', input }))
    },
    // Host-only hooks: present so main.js can stay transport-blind.
    onPeerJoin() {},
    onPeerLeave() {},
    onInput() {},
    broadcastState() {},
    reject() {},
    close() {
      ping.stop()
      ws.close()
    },
  }
}
