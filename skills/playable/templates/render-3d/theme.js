// Palette and the four-tone shading system.
//
// Style follows the craft rules from github.com/wheresryan22/anatomy: solids are
// shaded in four tones kept close together (~3% apart in luminance), with
// lighter tops, thin border lines on every edge, and a soft dark halo under the
// base. Those rules are what make flat geometry read as deliberate rather than
// unfinished.
//
// Two separate mechanisms, easy to confuse:
//
//   tone  — which of the four shades THIS PART uses (lo/mid/hi/lit). Picked by
//           the game, per object, and the tones sit ~3% apart as specified.
//   band  — the light/shadow banding ACROSS a single solid's faces. Produced by
//           the toon gradient map in toon.js from the light angle, so tops come
//           out lighter than sides for free.
//
// One deliberate deviation: anatomy is a near-monochrome technical illustration,
// so its tones sit 3% apart and its palette is "one lit accent plus true RGB".
// A game has to distinguish a car from a tree at a glance while moving, so each
// object type gets its own muted hue and the light bands are spread wider than
// 3% (see toon.js). The tone structure and the outlines are kept faithfully.

const HUES = {
  grass: { h: 96, s: 20, l: 44 },
  road: { h: 28, s: 5, l: 34 },
  moss: { h: 132, s: 24, l: 32 }, // tree foliage
  bark: { h: 22, s: 22, l: 28 },
  slate: { h: 212, s: 22, l: 44 }, // cars
  rust: { h: 12, s: 42, l: 44 }, // cars, second colourway
  cyan: { h: 186, s: 68, l: 50 }, // player one
  magenta: { h: 322, s: 60, l: 56 }, // player two
  gold: { h: 44, s: 74, l: 54 }, // coins
  bone: { h: 40, s: 16, l: 84 }, // finish line, markings
  ink: { h: 220, s: 24, l: 12 }, // outlines, halo
}

// Four tones, ~3% apart in luminance, centred on the hue's base lightness.
const TONE_SHIFT = { lo: -4.5, mid: -1.5, hi: 1.5, lit: 4.5 }

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function hslToHex(h, s, l) {
  s = clamp(s, 0, 100) / 100
  l = clamp(l, 0, 100) / 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const to255 = (v) => Math.round(clamp(v, 0, 1) * 255)
  return (to255(f(0)) << 16) | (to255(f(8)) << 8) | to255(f(4))
}

/** Fill colour for a part, as a 0xRRGGBB integer. */
export function toneColor(hue, tone = 'mid') {
  const base = HUES[hue]
  if (!base) throw new Error(`[playable] unknown hue "${hue}". Known: ${Object.keys(HUES).join(', ')}`)
  return hslToHex(base.h, base.s, base.l + (TONE_SHIFT[tone] ?? 0))
}

/**
 * Border line colour. Tinted toward the part's own hue rather than pure black —
 * a black outline on a coloured solid reads as a gap, a tinted one as an edge.
 */
export function outlineColor(hue) {
  const base = HUES[hue] ?? HUES.ink
  return hslToHex(base.h, clamp(base.s * 0.5, 0, 40), 14)
}

export const BACKGROUND = hslToHex(206, 22, 90)
export const HALO = hslToHex(HUES.ink.h, HUES.ink.s, HUES.ink.l)
export const HUE_NAMES = Object.keys(HUES)
