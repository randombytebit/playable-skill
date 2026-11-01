// 9UPPER — a 3–9 player social-deduction party game.
//
// One guesser, one knower, everyone else is a 9upper. All players share
// the same card-read clock; when it hits zero the card closes.
//
//   init / onJoin / onLeave / step  run ONLY on the host -> no DOM access
//   draw                           runs in EVERY browser -> never mutate state
//
// Everyone sees a proper-noun topic and its category tag. The knower
// also sees the fact behind the name. The whole state still crosses
// the wire. Cards live in cards.js.

import { DECK } from './cards.js'

const W = 390
const H = 780
const PAD = 20
const BTN_H = 48

const C = {
  bg: '#000000',
  paper: '#FFFFFF',
  card: '#FFFFFF',
  ink: '#111111',
  light: '#FFFFFF',
  muted: '#B4B4B4',
  mutedInk: '#5F6368',
  line: '#2A2A2A',
  accent: '#C41E3A',
  accentInk: '#111111',
  asker: '#FFFFFF',
  knower: '#2B5A8A',
  fibber: '#C41E3A',
  pick: '#2A2A2A',
  closed: '#111111',
}

const TEXT = {
  en: {
    need: (n) => `Need ${n} more`,
    playing: (n) => `${n} playing`,
    guesser: 'You guess.',
    knower: 'You know.',
    nine: 'You are a 9upper.',
    hidden: 'The fact is hidden.',
    closed: 'Card closed.',
    you: 'You',
    seat: (n) => `Seat ${n}`,
    pts: (n) => `${n} pts`,
    asked: '  ·  guessed',
    knew: '  ·  knew',
    bluffed: '  ·  9upper',
    called: '  ·  called',
    start: 'Start',
    waiting: 'Waiting for people',
    reading: (s) => `Read the card · ${s}s`,
    pending: (s) => `Discuss · ${s}s`,
    timedOut: 'Time is up.',
    roundTitle: 'This round',
    roleGuesser: 'Guesser',
    roleKnower: 'Knower',
    roleNine: '9upper',
    wonRound: 'scored this round',
    pick: 'Tap a person, then guess',
    guess: 'That’s the one',
    listen: 'Listen — the guesser guesses',
    next: 'Next card',
    results: 'See who won',
    again: 'Play again',
    call: 'Call a 9upper (once)',
    callThat: 'Call their bluff',
    win: 'You win',
    over: 'Game over',
    points: (n) => `${n} points`,
    found: 'The guesser found the knower.',
    wrong: 'A 9upper took the points.',
    timeout: 'No guess in time — the guesser loses the card.',
    hitKnow: ' Call hit the knower (−3).',
    hitBluff: ' Call hit a 9upper (+1 / −1).',
    need3: 'Need three people to play.',
  },
  zh: {
    need: (n) => `還差 ${n} 人`,
    playing: (n) => `${n} 人在場`,
    guesser: '你是猜的人。',
    knower: '你是知情的人。',
    nine: '你是 9upper。',
    hidden: '說明已隱藏。',
    closed: '牌已蓋上。',
    you: '你',
    seat: (n) => `座位 ${n}`,
    pts: (n) => `${n} 分`,
    asked: '  ·  猜的人',
    knew: '  ·  知情',
    bluffed: '  ·  9upper',
    called: '  ·  已喊破',
    start: '開始',
    waiting: '等人到齊',
    reading: (s) => `讀牌 · ${s} 秒`,
    pending: (s) => `討論 · ${s} 秒`,
    timedOut: '時間到。',
    roundTitle: '這一輪',
    roleGuesser: '猜的人',
    roleKnower: '知情的人',
    roleNine: '9upper',
    wonRound: '這輪得分',
    pick: '先點一個人，再猜',
    guess: '就是這位',
    listen: '聽他們說 —— 猜的人來選',
    next: '下一張',
    results: '看誰贏了',
    again: '再玩一局',
    call: '喊破一次 9upper',
    callThat: '喊破這個人',
    win: '你贏了',
    over: '遊戲結束',
    points: (n) => `${n} 分`,
    found: '猜的人找到知情的人。',
    wrong: '9upper 拿走了分數。',
    timeout: '沒在時間內猜 —— 猜的人扣這張牌的分。',
    hitKnow: ' 喊破打中知情的人（−3）。',
    hitBluff: ' 喊破打中 9upper（+1 / −1）。',
    need3: '至少要三個人才能玩。',
  },
}

const idsOf = (state) => Object.keys(state.players)
const roomLang = (state) => (state?.lang === 'zh' ? 'zh' : 'en')

function pickCard(state) {
  const used = new Set(state.used)
  const pool = DECK.map((_, i) => i).filter((i) => !used.has(i))
  const i = pool.length ? pool[state.deckCursor % pool.length] : state.deckCursor % DECK.length
  state.used.push(i)
  state.deckCursor++
  return DECK[i]
}

function startRound(state) {
  const ids = idsOf(state)
  if (ids.length < 3) return
  const asker = ids[state.round % ids.length]
  const others = ids.filter((id) => id !== asker)
  const knower = others[(state.round * 13 + state.deckCursor * 7 + ids.length) % others.length]
  const card = pickCard(state)
  state.phase = 'read'
  state.asker = asker
  state.knower = knower
  state.card = card
  state.called = null
  state.guess = null
  state.selected = null
  state.noteKey = ''
  state.noteExtra = ''
  state.outcome = ''
  state.readLeft = state.readSec
  state.talkLeft = 0
}

function scoreGuess(state) {
  const D = state.card.stars
  const asker = state.players[state.asker]
  const knower = state.players[state.knower]
  const accused = state.players[state.guess]
  if (!asker || !accused) return
  if (state.guess === state.knower) {
    asker.score += D
    if (knower) knower.score += D
    state.noteKey = 'found'
    state.outcome = 'found'
  } else {
    accused.score += D
    state.noteKey = 'wrong'
    state.outcome = 'wrong'
  }
  if (state.called) {
    const hit = state.players[state.called]
    if (state.called === state.knower) {
      asker.score -= 3
      state.noteExtra = 'hitKnow'
    } else if (hit) {
      asker.score += 1
      hit.score -= 1
      state.noteExtra = 'hitBluff'
    }
  }
}

function scoreTimeout(state) {
  const asker = state.players[state.asker]
  if (asker && state.card) asker.score -= state.card.stars
  state.guess = null
  state.noteKey = 'timeout'
  state.noteExtra = ''
  state.outcome = 'timeout'
}

function roleOf(state, id) {
  if (id === state.asker) return 'asker'
  if (id === state.knower) return 'knower'
  return 'fibber'
}

function hitButton(px, py, box) {
  return px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h
}

function chrome(state) {
  const n = Math.max(idsOf(state).length, 1)
  const twoButtons = state.phase === 'talk' && !state.called
  const btnBlock = (twoButtons ? 2 : 1) * (BTN_H + 10) + PAD
  const listTop = state.phase === 'reveal' ? 400 : 348
  const listBottom = H - btnBlock
  const row = Math.min(50, Math.max(34, (listBottom - listTop) / n))
  return { listTop, row, twoButtons }
}

function playerRow(state, i) {
  const { listTop, row } = chrome(state)
  return { x: PAD, y: listTop + i * row, w: W - PAD * 2, h: row - 6 }
}

function primaryBtn() {
  return { x: PAD, y: H - PAD - BTN_H, w: W - PAD * 2, h: BTN_H }
}

function callBtn() {
  const p = primaryBtn()
  return { x: p.x, y: p.y - BTN_H - 10, w: p.w, h: p.h }
}

function roundBox(g, x, y, w, h, r) {
  g.beginPath()
  if (typeof g.roundRect === 'function') g.roundRect(x, y, w, h, r)
  else g.rect(x, y, w, h)
}

function fillFrost(g, x, y, w, h, color) {
  g.fillStyle = color
  g.fill()
}

function fillRectFrost(g, x, y, w, h, color) {
  g.beginPath()
  g.rect(x, y, w, h)
  fillFrost(g, x, y, w, h, color)
}

function tagChip(g, label, x, y, onDark) {
  g.font = '600 11px ui-sans-serif, system-ui, -apple-system, sans-serif'
  g.textAlign = 'left'
  const padX = 8
  const w = Math.ceil(g.measureText(label).width) + padX * 2
  const h = 20
  roundBox(g, x, y, w, h, 10)
  fillFrost(g, x, y, w, h, onDark ? C.closed : C.ink)
  g.fillStyle = onDark ? C.light : C.paper
  g.fillText(label, x + padX, y + 14)
  return w
}

function wrapText(g, text, x, y, max, lh) {
  const raw = String(text)
  const latin = /[a-zA-Z]/.test(raw) && raw.includes(' ')
  const parts = latin ? raw.split(' ') : [...raw]
  let line = ''
  let yy = y
  for (const part of parts) {
    const next = latin ? (line ? `${line} ${part}` : part) : line + part
    if (g.measureText(next).width > max && line) {
      g.fillText(line, x, yy)
      line = part
      yy += lh
    } else line = next
  }
  if (line) g.fillText(line, x, yy)
}

function resetTable(state) {
  state.phase = 'wait'
  state.card = null
  state.asker = null
  state.knower = null
  state.called = null
  state.guess = null
  state.selected = null
  state.noteKey = 'need3'
  state.noteExtra = ''
  state.outcome = ''
  state.readLeft = 0
  state.talkLeft = 0
}

export default {
  title: '9UPPER',
  players: { min: 3, max: 9 },
  input: { keys: [], pointer: true },
  settings: { readTimer: true },
  view: { width: W, height: H },

  init() {
    return {
      players: {},
      phase: 'wait',
      round: 0,
      asker: null,
      knower: null,
      card: null,
      called: null,
      guess: null,
      selected: null,
      used: [],
      deckCursor: 0,
      noteKey: '',
      noteExtra: '',
      outcome: '',
      readSec: 10,
      readLeft: 0,
      talkSec: 30,
      talkLeft: 0,
      lang: 'en',
    }
  },

  onJoin(state, id) {
    const n = idsOf(state).length
    state.players[id] = { score: 0, seat: n, wasDown: false, name: '' }
  },

  onLeave(state, id) {
    delete state.players[id]
    if (state.selected === id) state.selected = null
    if (state.called === id) state.called = null
    if (idsOf(state).length < 3) {
      resetTable(state)
      return
    }
    if ((state.phase === 'talk' || state.phase === 'read') && (id === state.asker || id === state.knower)) {
      startRound(state)
    }
  },

  step(state, inputs, dt) {
    for (const i of Object.values(inputs)) {
      if (typeof i.readSec === 'number') {
        state.readSec = Math.max(5, Math.min(20, Math.round(i.readSec)))
      }
      if (typeof i.talkSec === 'number') {
        state.talkSec = Math.max(10, Math.min(60, Math.round(i.talkSec)))
      }
      if (i.lang === 'zh' || i.lang === 'en') state.lang = i.lang
    }

    if (state.phase === 'read') {
      state.readLeft -= dt
      if (state.readLeft <= 0) {
        state.readLeft = 0
        state.phase = 'talk'
        state.talkLeft = state.talkSec
      }
    } else if (state.phase === 'talk') {
      state.talkLeft -= dt
      if (state.talkLeft <= 0) {
        state.talkLeft = 0
        scoreTimeout(state)
        state.phase = 'reveal'
      }
    }

    const btn = primaryBtn()
    const call = callBtn()
    const roster = idsOf(state)

    for (const [id, p] of Object.entries(state.players)) {
      const i = inputs[id] ?? {}
      const down = i.pressed === true
      const tap = down && !p.wasDown
      p.wasDown = down
      if (!tap || typeof i.px !== 'number') continue

      if (state.phase === 'wait' && roster.length >= 3 && hitButton(i.px, i.py, btn)) {
        state.round = 0
        startRound(state)
        continue
      }

      if (state.phase === 'talk' && id === state.asker) {
        roster.forEach((pid, idx) => {
          if (pid === id) return
          if (hitButton(i.px, i.py, playerRow(state, idx))) state.selected = pid
        })
        if (!state.called && state.selected && state.selected !== id && hitButton(i.px, i.py, call)) {
          state.called = state.selected
        }
        if (state.selected && state.selected !== id && hitButton(i.px, i.py, btn)) {
          state.guess = state.selected
          scoreGuess(state)
          state.phase = 'reveal'
        }
      }

      if (state.phase === 'reveal' && hitButton(i.px, i.py, btn)) {
        state.round += 1
        if (state.round >= roster.length) {
          state.phase = 'done'
          state.card = null
        } else {
          startRound(state)
        }
        continue
      }

      if (state.phase === 'done' && hitButton(i.px, i.py, btn)) {
        state.used = []
        state.round = 0
        for (const pl of Object.values(state.players)) pl.score = 0
        startRound(state)
        continue
      }
    }
  },

  draw(g, state, selfId) {
    const L = TEXT[roomLang(state)]
    const n = idsOf(state).length
    const roster = idsOf(state)
    const btn = primaryBtn()
    const myRole = state.asker ? roleOf(state, selfId) : null
    const zh = roomLang(state) === 'zh'
    const open = state.phase === 'read'
    g.save()

    fillRectFrost(g, 0, 0, W, H, C.bg)
    fillRectFrost(g, 0, 0, W * 0.38, 6, C.accent)
    fillRectFrost(g, W * 0.38, 0, W * 0.62, 6, C.light)

    g.fillStyle = C.light
    g.font = '800 26px ui-sans-serif, system-ui, -apple-system, sans-serif'
    g.textAlign = 'left'
    g.fillText('9UPPER', PAD, 48)

    g.fillStyle = C.muted
    g.font = '15px ui-sans-serif, system-ui, -apple-system, sans-serif'
    g.fillText(n < 3 ? L.need(3 - n) : L.playing(n), PAD, 72)

    if (myRole && state.phase !== 'wait' && state.phase !== 'done') {
      const label = myRole === 'asker' ? L.guesser : myRole === 'knower' ? L.knower : L.nine
      g.fillStyle = myRole === 'knower' ? C.knower : myRole === 'fibber' ? C.fibber : C.asker
      g.font = '600 17px ui-sans-serif, system-ui, -apple-system, sans-serif'
      g.fillText(label, PAD, 96)
    }

    if (state.phase === 'read') {
      g.fillStyle = C.accent
      g.font = '700 20px ui-sans-serif, system-ui, -apple-system, sans-serif'
      g.fillText(L.reading(Math.max(0, Math.ceil(state.readLeft))), PAD, 118)
    }
    if (state.phase === 'talk') {
      g.fillStyle = C.accent
      g.font = '700 20px ui-sans-serif, system-ui, -apple-system, sans-serif'
      g.fillText(L.pending(Math.max(0, Math.ceil(state.talkLeft))), PAD, 118)
    }

    if (state.phase === 'reveal') {
      g.fillStyle = C.light
      g.font = '800 22px ui-sans-serif, system-ui, -apple-system, sans-serif'
      g.fillText(L.roundTitle, PAD, 118)
      g.fillStyle = C.accent
      g.font = '600 18px ui-sans-serif, system-ui, -apple-system, sans-serif'
      wrapText(g, L[state.noteKey] ?? '', PAD, 146, W - PAD * 2, 22)
      if (state.card) {
        const chipW = tagChip(g, zh ? state.card.tagz : state.card.tag, PAD, 176, true)
        g.fillStyle = C.muted
        g.font = '12px ui-sans-serif, system-ui, -apple-system, sans-serif'
        g.fillText('*'.repeat(state.card.stars), PAD + chipW + 8, 190) // taste-skill-ignore — card difficulty
        g.fillStyle = C.light
        g.font = '800 26px ui-sans-serif, system-ui, -apple-system, sans-serif'
        wrapText(g, zh ? state.card.qz : state.card.q, PAD, 216, W - PAD * 2, 30)
        g.fillStyle = C.knower
        g.font = '500 13px ui-sans-serif, system-ui, -apple-system, sans-serif'
        wrapText(g, zh ? state.card.az : state.card.a, PAD, 280, W - PAD * 2, 18)
      }
    }

    if (state.card && state.phase !== 'done' && state.phase !== 'reveal') {
      const cardY = 132
      const cardH = 196
      const showFact = open && selfId === state.knower
      roundBox(g, PAD, cardY, W - PAD * 2, cardH, 16)
      fillFrost(g, PAD, cardY, W - PAD * 2, cardH, open ? C.paper : C.closed)

      const chipW = tagChip(g, zh ? state.card.tagz : state.card.tag, PAD + 16, cardY + 14, !open)
      g.fillStyle = open ? C.mutedInk : C.muted
      g.font = '12px ui-sans-serif, system-ui, -apple-system, sans-serif'
      g.fillText('*'.repeat(state.card.stars), PAD + 16 + chipW + 8, cardY + 28) // taste-skill-ignore — card difficulty
      g.fillStyle = open ? C.ink : C.light
      g.font = '800 26px ui-sans-serif, system-ui, -apple-system, sans-serif'
      wrapText(g, zh ? state.card.qz : state.card.q, PAD + 16, cardY + 52, W - PAD * 2 - 32, 30)
      if (showFact) {
        g.fillStyle = C.knower
        g.font = '500 13px ui-sans-serif, system-ui, -apple-system, sans-serif'
        wrapText(g, zh ? state.card.az : state.card.a, PAD + 16, cardY + 120, W - PAD * 2 - 32, 18)
      } else {
        g.fillStyle = open ? C.mutedInk : C.muted
        g.font = '13px ui-sans-serif, system-ui, -apple-system, sans-serif'
        g.fillText(open ? L.hidden : L.closed, PAD + 16, cardY + 160)
      }
    }

    if (state.noteKey && state.phase !== 'reveal') {
      const note = `${L[state.noteKey] ?? ''}${state.noteExtra ? L[state.noteExtra] ?? '' : ''}`
      g.fillStyle = C.light
      g.font = '15px ui-sans-serif, system-ui, -apple-system, sans-serif'
      wrapText(g, note, PAD, 318, W - PAD * 2, 20)
    }

    roster.forEach((id, idx) => {
      const p = state.players[id]
      const r = playerRow(state, idx)
      const selected = state.selected === id
      roundBox(g, r.x, r.y, r.w, r.h, 12)
      fillFrost(g, r.x, r.y, r.w, r.h, selected ? C.pick : C.closed)
      if (selected) {
        g.strokeStyle = C.accent
        g.lineWidth = 1
        g.stroke()
      }

      g.fillStyle = C.light
      g.font = '600 16px ui-sans-serif, system-ui, -apple-system, sans-serif'
      g.textAlign = 'left'
      const shown = typeof p.name === 'string' && p.name
        ? p.name
        : (id === selfId ? L.you : L.seat(p.seat + 1))
      g.fillText(shown, r.x + 14, r.y + Math.min(22, r.h * 0.45))
      g.fillStyle = C.muted
      g.font = '13px ui-sans-serif, system-ui, -apple-system, sans-serif'
      let extra = L.pts(p.score)
      if (state.phase === 'reveal' || state.phase === 'done') {
        const role = roleOf(state, id)
        extra = role === 'asker' ? L.roleGuesser : role === 'knower' ? L.roleKnower : L.roleNine
        extra += `  ·  ${L.pts(p.score)}`
        if (state.phase === 'reveal') {
          if (state.outcome === 'found' && (id === state.asker || id === state.knower)) extra += `  ·  ${L.wonRound}`
          if (state.outcome === 'wrong' && id === state.guess) extra += `  ·  ${L.wonRound}`
        }
      } else if (state.called === id) extra += L.called
      if (r.h > 36) g.fillText(extra, r.x + 14, r.y + r.h - 10)
    })

    let label = ''
    if (state.phase === 'wait' && n >= 3) label = L.start
    else if (state.phase === 'wait') label = L.waiting
    else if (state.phase === 'read') label = L.reading(Math.max(0, Math.ceil(state.readLeft)))
    else if (state.phase === 'talk' && selfId === state.asker) label = state.selected ? L.guess : L.pick
    else if (state.phase === 'talk') label = `${L.listen} · ${Math.max(0, Math.ceil(state.talkLeft))}s`
    else if (state.phase === 'reveal') label = state.round + 1 >= n ? L.results : L.next
    else if (state.phase === 'done') label = L.again

    const canPress =
      (state.phase === 'wait' && n >= 3) ||
      (state.phase === 'talk' && selfId === state.asker && state.selected) ||
      state.phase === 'reveal' ||
      state.phase === 'done'

    roundBox(g, btn.x, btn.y, btn.w, btn.h, 999)
    if (canPress) {
      fillFrost(g, btn.x, btn.y, btn.w, btn.h, C.paper)
      g.fillStyle = C.ink
    } else {
      fillFrost(g, btn.x, btn.y, btn.w, btn.h, C.closed)
      g.fillStyle = C.muted
    }
    g.font = '600 17px ui-sans-serif, system-ui, -apple-system, sans-serif'
    g.textAlign = 'center'
    g.fillText(label, W / 2, btn.y + 31)

    if (state.phase === 'talk' && selfId === state.asker && !state.called) {
      const call = callBtn()
      roundBox(g, call.x, call.y, call.w, call.h, 999)
      fillFrost(g, call.x, call.y, call.w, call.h, C.closed)
      g.fillStyle = C.light
      g.font = '600 16px ui-sans-serif, system-ui, -apple-system, sans-serif'
      g.fillText(state.selected ? L.callThat : L.call, W / 2, call.y + 31)
    }

    if (state.phase === 'done') {
      const ranked = Object.entries(state.players).sort((a, b) => b[1].score - a[1].score)
      const winner = ranked[0]
      g.fillStyle = C.accent
      g.font = '600 28px ui-sans-serif, system-ui, -apple-system, sans-serif'
      g.fillText(winner && winner[0] === selfId ? L.win : L.over, W / 2, 160)
      g.font = '17px ui-sans-serif, system-ui, -apple-system, sans-serif'
      g.fillStyle = C.muted
      g.fillText(winner ? L.points(winner[1].score) : '', W / 2, 192)
    }

    g.textAlign = 'left'
    g.restore()
  },
}
