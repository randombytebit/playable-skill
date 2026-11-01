// The wire format, shared by every transport. Both transports send these
// shapes; nothing else may go over the wire.
//
//   client -> host : { t: 'input', input }
//   client -> host : { t: 'ping', at }          // at = client Date.now(); host echoes
//   host -> client : { t: 'welcome', id, title, tickHz, lerpKeys }
//   host -> client : { t: 'state', seq, state }
//   host -> client : { t: 'pong', at }          // echo; client subtracts to get RTT
//   host -> client : { t: 'full', reason }      // room is full, connection will close
//
// Keep this file identical across transports. If you add a message type,
// add it here first, then teach both adapters about it.

export const TICK_HZ = 30

export const encode = (msg) => JSON.stringify(msg)

export function decode(raw) {
  try {
    const msg = JSON.parse(typeof raw === 'string' ? raw : String(raw))
    return msg && typeof msg.t === 'string' ? msg : null
  } catch {
    return null // Malformed frame from a peer: ignore it, never throw into the loop.
  }
}
