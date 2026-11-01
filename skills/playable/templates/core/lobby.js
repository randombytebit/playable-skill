// Shared chrome: name, create / join a room, then a settings icon for room ID,
// invite link, QR, ping, language, optional card-read timer, and leave.

import { drawQr } from './qr.js'

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const LANG_KEY = 'playable.lang'
const NAME_KEY = 'playable.name'

const COPY = {
  en: {
    lead: 'Type a name, make a room, send the link.',
    create: 'Create a room',
    joinLabel: 'Join with a room ID',
    join: 'Join',
    settings: 'Settings',
    roomId: 'Room ID',
    invite: 'Invite link:',
    copy: 'Copy link',
    copied: 'Copied',
    copyManual: 'Copy manually',
    peers: (c, m) => `${c}/${m} players`,
    leave: 'Leave room',
    yourName: 'Your name',
    nameHint: 'A name',
    language: 'Language',
    langHint: 'Everyone in the room uses this',
    langFollow: 'The host picked this',
    timer: 'Card read time',
    pending: 'Discussion time',
    seconds: (n) => `${n} seconds`,
    ping: {
      'Feels instant': 'Feels instant',
      'Feels fine': 'Feels fine',
      'A bit delayed': 'A bit delayed',
      'Moves may feel late': 'Moves may feel late',
    },
  },
  zh: {
    lead: '寫名字、開房間、把連結傳出去。',
    create: '建立房間',
    joinLabel: '用房間 ID 加入',
    join: '加入',
    settings: '設定',
    roomId: '房間 ID',
    invite: '邀請連結：',
    copy: '複製連結',
    copied: '已複製',
    copyManual: '請手動複製',
    peers: (c, m) => `${c}/${m} 人`,
    leave: '離開房間',
    yourName: '你的名字',
    nameHint: '名字',
    language: '語言',
    langHint: '全房共用這個語言',
    langFollow: '房主已選好',
    timer: '讀牌時間',
    pending: '討論時間',
    seconds: (n) => `${n} 秒`,
    ping: {
      'Feels instant': '幾乎即時',
      'Feels fine': '還算順',
      'A bit delayed': '有點慢',
      'Moves may feel late': '動作會覺得晚',
    },
  },
}

export function makeRoomCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((n) => ALPHABET[n % ALPHABET.length])
    .join('')
}

function hashCode() {
  return location.hash.replace(/^#/, '').toUpperCase()
}

function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'zh' || saved === 'en') return saved
  } catch { /* private mode */ }
  const nav = (navigator.language || 'en').toLowerCase()
  return nav.startsWith('zh') ? 'zh' : 'en'
}

function stripName(raw) {
  return String(raw ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 12)
}

function cleanName(raw) {
  return stripName(raw).trim()
}

function loadName() {
  try {
    const saved = localStorage.getItem(NAME_KEY)
    if (typeof saved === 'string') return stripName(saved)
  } catch { /* private mode */ }
  return ''
}

function saveName(value) {
  try { localStorage.setItem(NAME_KEY, value) } catch { /* private mode */ }
}

export function createLobby(root, game = {}) {
  const showTimer = game.settings?.readTimer === true
  let lang = detectLang()
  let displayName = loadName()
  let isHost = false
  let readSec = 10
  let talkSec = 30
  let pending = {}
  let hideTimer = 0
  let lastPeers = { count: 0, max: 0 }
  let lastPing = null
  let shareUrl = ''

  root.innerHTML = `
    <div class="lobby-gate" hidden>
      <div class="lobby-gate-card">
        <div class="lobby-mark" aria-hidden="true">
          <i class="m-sand"></i>
          <i class="m-clay"></i>
          <i class="m-umber"></i>
          <i class="m-olive"></i>
          <i class="m-ink"></i>
        </div>
        <h1 class="lobby-gate-brand"></h1>
        <p class="lobby-gate-lead"></p>
        <div class="lobby-field lobby-gate-name">
          <label class="lobby-label lobby-gate-name-label" for="lobby-name"></label>
          <input id="lobby-name" class="lobby-name-input" name="displayName" maxlength="12" autocomplete="nickname" spellcheck="false" />
        </div>
        <button type="button" class="lobby-gate-create"></button>
        <form class="lobby-gate-join">
          <label class="lobby-label" for="lobby-room-id"></label>
          <div class="lobby-gate-row">
            <input id="lobby-room-id" class="lobby-room-input" name="code" maxlength="8" autocomplete="off" spellcheck="false" placeholder="ABC234" />
            <button type="submit"></button>
          </div>
        </form>
      </div>
    </div>
    <button type="button" class="lobby-gear" hidden aria-expanded="false" aria-controls="lobby-sheet">
      <svg class="lobby-gear-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.15 7.15 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.5.42l-.36 2.54c-.59.22-1.14.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.8 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.92 14.16a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.49.41 1.04.72 1.63.94l.36 2.54c.05.24.26.42.5.42h3.8c.24 0 .45-.18.5-.42l.36-2.54c.59-.22 1.14-.53 1.63-.94l2.39.96c.24.1.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/>
      </svg>
      <span class="lobby-dot" data-state="connecting"></span>
    </button>
    <div class="lobby-sheet" id="lobby-sheet" hidden role="dialog">
      <div class="lobby-status" data-state="connecting">Connecting…</div>
      <div class="lobby-room" hidden>
        <div class="lobby-label lobby-room-label"></div>
        <div class="lobby-room-code"></div>
      </div>
      <canvas class="lobby-qr" hidden width="148" height="148"></canvas>
      <div class="lobby-share" hidden></div>
      <div class="lobby-peers"></div>
      <div class="lobby-ping" hidden></div>
      <div class="lobby-error" hidden></div>
      <div class="lobby-field">
        <label class="lobby-label lobby-name-label" for="lobby-name-settings"></label>
        <input id="lobby-name-settings" class="lobby-name-input" name="displayName" maxlength="12" autocomplete="nickname" spellcheck="false" />
      </div>
      <div class="lobby-field">
        <div class="lobby-label lobby-lang-label"></div>
        <div class="lobby-langs" role="group">
          <button type="button" class="lobby-chip" data-lang="zh">繁體中文</button>
          <button type="button" class="lobby-chip" data-lang="en">English</button>
        </div>
        <div class="lobby-hint lobby-lang-hint"></div>
      </div>
      <div class="lobby-field lobby-timer-field" ${showTimer ? '' : 'hidden'}>
        <div class="lobby-label lobby-timer-label"></div>
        <div class="lobby-timer">
          <button type="button" class="lobby-chip" data-timer="-5" aria-label="-">−</button>
          <div class="lobby-timer-value"></div>
          <button type="button" class="lobby-chip" data-timer="5" aria-label="+">+</button>
        </div>
      </div>
      <div class="lobby-field lobby-talk-field" ${showTimer ? '' : 'hidden'}>
        <div class="lobby-label lobby-talk-label"></div>
        <div class="lobby-timer">
          <button type="button" class="lobby-chip" data-talk="-5" aria-label="-">−</button>
          <div class="lobby-talk-value"></div>
          <button type="button" class="lobby-chip" data-talk="5" aria-label="+">+</button>
        </div>
      </div>
      <button type="button" class="lobby-leave"></button>
    </div>
  `
  const gate = root.querySelector('.lobby-gate')
  const brand = root.querySelector('.lobby-gate-brand')
  const lead = root.querySelector('.lobby-gate-lead')
  const createBtn = root.querySelector('.lobby-gate-create')
  const gateNameLabel = root.querySelector('.lobby-gate-name-label')
  const gateNameInput = root.querySelector('#lobby-name')
  const settingsNameLabel = root.querySelector('.lobby-name-label')
  const settingsNameInput = root.querySelector('#lobby-name-settings')
  const joinForm = root.querySelector('.lobby-gate-join')
  const joinLabel = joinForm.querySelector('label')
  const joinInput = root.querySelector('.lobby-room-input')
  const joinBtn = joinForm.querySelector('button[type="submit"]')
  const gear = root.querySelector('.lobby-gear')
  const sheet = root.querySelector('.lobby-sheet')
  const dot = root.querySelector('.lobby-dot')
  const statusEl = root.querySelector('.lobby-status')
  const roomEl = root.querySelector('.lobby-room')
  const roomLabel = root.querySelector('.lobby-room-label')
  const codeEl = root.querySelector('.lobby-room-code')
  const qrEl = root.querySelector('.lobby-qr')
  const shareEl = root.querySelector('.lobby-share')
  const peersEl = root.querySelector('.lobby-peers')
  const pingEl = root.querySelector('.lobby-ping')
  const errorEl = root.querySelector('.lobby-error')
  const leaveBtn = root.querySelector('.lobby-leave')
  const langLabel = root.querySelector('.lobby-lang-label')
  const langHint = root.querySelector('.lobby-lang-hint')
  const timerLabel = root.querySelector('.lobby-timer-label')
  const timerValue = root.querySelector('.lobby-timer-value')
  const talkLabel = root.querySelector('.lobby-talk-label')
  const talkValue = root.querySelector('.lobby-talk-value')

  const t = () => COPY[lang]

  function applyLang() {
    const c = t()
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en'
    lead.textContent = c.lead
    if (gateNameLabel) gateNameLabel.textContent = c.yourName
    if (gateNameInput) gateNameInput.placeholder = c.nameHint
    if (settingsNameLabel) settingsNameLabel.textContent = c.yourName
    if (settingsNameInput) settingsNameInput.placeholder = c.nameHint
    createBtn.textContent = c.create
    joinLabel.textContent = c.joinLabel
    joinBtn.textContent = c.join
    gear.setAttribute('aria-label', c.settings)
    gear.setAttribute('title', c.settings)
    sheet.setAttribute('aria-label', c.settings)
    roomLabel.textContent = c.roomId
    leaveBtn.textContent = c.leave
    langLabel.textContent = c.language
    if (langHint) langHint.textContent = isHost ? c.langHint : c.langFollow
    timerLabel.textContent = c.timer
    timerValue.textContent = c.seconds(readSec)
    if (talkLabel) talkLabel.textContent = c.pending
    if (talkValue) talkValue.textContent = c.seconds(talkSec)
    root.querySelectorAll('.lobby-chip[data-lang]').forEach((el) => {
      el.classList.toggle('is-on', el.dataset.lang === lang)
      el.disabled = !isHost
    })
    if (lastPeers.count) peersEl.textContent = c.peers(lastPeers.count, lastPeers.max)
    if (lastPing) {
      pingEl.textContent = `${c.ping[lastPing.text] ?? lastPing.text} · ${lastPing.ms} ms`
    }
    if (shareUrl) paintShare()
  }

  function paintShare() {
    const c = t()
    shareEl.hidden = false
    shareEl.innerHTML = `<span class="lobby-label"></span> <code></code>
      <button type="button"></button>`
    shareEl.querySelector('.lobby-label').textContent = c.invite
    shareEl.querySelector('code').textContent = shareUrl
    const btn = shareEl.querySelector('button')
    btn.textContent = c.copy
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl)
        btn.textContent = c.copied
      } catch {
        btn.textContent = c.copyManual
      }
    })
  }

  function setOpen(open) {
    window.clearTimeout(hideTimer)
    sheet.setAttribute('aria-hidden', String(!open))
    if (open) {
      sheet.hidden = false
      requestAnimationFrame(() => {
        root.classList.add('is-open')
        gear.setAttribute('aria-expanded', 'true')
      })
    } else {
      root.classList.remove('is-open')
      gear.setAttribute('aria-expanded', 'false')
      hideTimer = window.setTimeout(() => {
        if (!root.classList.contains('is-open')) sheet.hidden = true
      }, 240)
    }
  }

  function showChrome() {
    gear.hidden = false
  }

  function setLang(next, broadcast = true) {
    if (next !== 'zh' && next !== 'en') return
    lang = next
    try { localStorage.setItem(LANG_KEY, lang) } catch { /* private mode */ }
    if (broadcast && isHost) pending.lang = lang
    applyLang()
  }

  gear.addEventListener('click', (event) => {
    event.stopPropagation()
    setOpen(sheet.hidden)
  })

  document.addEventListener('pointerdown', (event) => {
    if (sheet.hidden) return
    if (!root.contains(event.target)) setOpen(false)
  })

  leaveBtn.addEventListener('click', () => {
    location.assign(`${location.origin}${location.pathname}`)
  })

  root.querySelectorAll('.lobby-chip[data-lang]').forEach((el) => {
    el.addEventListener('click', () => {
      if (!isHost) return
      setLang(el.dataset.lang)
    })
  })

  root.querySelectorAll('.lobby-chip[data-timer]').forEach((el) => {
    el.addEventListener('click', () => {
      readSec = Math.max(5, Math.min(20, readSec + Number(el.dataset.timer)))
      pending.readSec = readSec
      applyLang()
    })
  })

  root.querySelectorAll('.lobby-chip[data-talk]').forEach((el) => {
    el.addEventListener('click', () => {
      talkSec = Math.max(10, Math.min(60, talkSec + Number(el.dataset.talk)))
      pending.talkSec = talkSec
      applyLang()
    })
  })

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !sheet.hidden) {
      event.preventDefault()
      setOpen(false)
    }
    if ((event.metaKey || event.ctrlKey) && event.key === ',') {
      event.preventDefault()
      setOpen(sheet.hidden)
    }
  })

  function persistName(raw, source) {
    displayName = stripName(raw)
    saveName(displayName)
    if (source !== gateNameInput && gateNameInput && gateNameInput.value !== displayName) {
      gateNameInput.value = displayName
    }
    if (source !== settingsNameInput && settingsNameInput && settingsNameInput.value !== displayName) {
      settingsNameInput.value = displayName
    }
  }

  if (gateNameInput) {
    gateNameInput.value = displayName
    gateNameInput.addEventListener('input', () => persistName(gateNameInput.value, gateNameInput))
  }
  if (settingsNameInput) {
    settingsNameInput.value = displayName
    settingsNameInput.addEventListener('input', () => persistName(settingsNameInput.value, settingsNameInput))
  }

  applyLang()

  return {
    consumeSettings() {
      const out = { ...pending, name: cleanName(displayName) }
      pending = {}
      return out
    },

    followLang(next) {
      if (isHost) return
      if (next === lang) return
      setLang(next, false)
    },

    chooseRoom(title = 'playable') {
      brand.textContent = title
      const existing = hashCode()
      if (existing) {
        displayName = loadName()
        if (settingsNameInput) settingsNameInput.value = displayName
        if (gateNameInput) gateNameInput.value = displayName
        showChrome()
        return Promise.resolve({ action: 'join', code: existing })
      }
      gate.hidden = false
      return new Promise((resolve) => {
        createBtn.addEventListener('click', () => {
          persistName(gateNameInput?.value ?? displayName, gateNameInput)
          gate.hidden = true
          showChrome()
          isHost = true
          pending.readSec = readSec
          pending.talkSec = talkSec
          pending.lang = lang
          applyLang()
          resolve({ action: 'create' })
        }, { once: true })
        joinForm.addEventListener('submit', (event) => {
          event.preventDefault()
          const code = joinInput.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
          if (code.length < 4) return
          persistName(gateNameInput?.value ?? displayName, gateNameInput)
          gate.hidden = true
          showChrome()
          pending.readSec = readSec
          pending.talkSec = talkSec
          resolve({ action: 'join', code })
        })
      })
    },

    setStatus(state, text) {
      statusEl.dataset.state = state
      statusEl.textContent = text
      dot.dataset.state = state
    },

    setShare(label, value, code) {
      shareUrl = value
      paintShare()
      const id = (code || hashCode() || '').toUpperCase()
      if (id) {
        roomEl.hidden = false
        codeEl.textContent = id
      }
      try {
        drawQr(qrEl, value)
        qrEl.hidden = false
      } catch (err) {
        console.error('[playable] QR failed:', err)
        qrEl.hidden = true
      }
      setOpen(true)
    },

    setPeers(count, max) {
      lastPeers = { count, max }
      peersEl.textContent = count ? t().peers(count, max) : ''
    },

    setPing(reading) {
      lastPing = reading
      if (!reading) {
        pingEl.hidden = true
        pingEl.textContent = ''
        return
      }
      pingEl.hidden = false
      pingEl.dataset.level = reading.level
      pingEl.textContent = `${t().ping[reading.text] ?? reading.text} · ${reading.ms} ms`
    },

    fail(message, hint) {
      showChrome()
      gate.hidden = true
      statusEl.dataset.state = 'failed'
      statusEl.textContent = 'Not connected'
      dot.dataset.state = 'failed'
      pingEl.hidden = true
      errorEl.hidden = false
      errorEl.innerHTML = `<strong></strong><span></span>`
      errorEl.querySelector('strong').textContent = message
      errorEl.querySelector('span').textContent = hint ? ` ${hint}` : ''
      setOpen(true)
    },

    hide() {
      root.hidden = true
      setOpen(false)
    },
    show() {
      root.hidden = false
    },
  }
}
