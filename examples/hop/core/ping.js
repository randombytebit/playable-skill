// Round-trip check for the lobby. The host just echoes { t: 'pong', at }.
// The client measures how long that took and turns it into a plain-language
// line — "Feels instant", not "RTT 12ms" — because the person reading it is
// not debugging a network.

const SAMPLE_COUNT = 3
const INTERVAL_MS = 2000

export function pongFor(msg) {
  if (msg?.t !== 'ping' || typeof msg.at !== 'number') return null
  return { t: 'pong', at: msg.at }
}

export function describeRtt(ms) {
  if (ms < 40) return { level: 'good', text: 'Feels instant' }
  if (ms < 90) return { level: 'good', text: 'Feels fine' }
  if (ms < 160) return { level: 'ok', text: 'A bit delayed' }
  return { level: 'bad', text: 'Moves may feel late' }
}

export function createPing({ send, intervalMs = INTERVAL_MS } = {}) {
  const samples = []
  let timer = null

  return {
    handle(msg) {
      if (msg?.t !== 'pong' || typeof msg.at !== 'number') return null
      const rtt = Math.max(0, Date.now() - msg.at)
      samples.push(rtt)
      if (samples.length > SAMPLE_COUNT) samples.shift()
      return Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
    },

    start() {
      if (timer || !send) return
      const beat = () => send({ t: 'ping', at: Date.now() })
      beat()
      timer = setInterval(beat, intervalMs)
    },

    stop() {
      clearInterval(timer)
      timer = null
    },
  }
}
