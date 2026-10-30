/** Four pitch seeds + an optional variation seed → Strudel mini-notation. */
const assertSize = size => {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError('Scale size must be a positive integer')
  }
}

export const randomFour = () =>
  Array.from({ length: 4 }, () => Math.floor(Math.random() * 101))

const assertSeed = value => {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new RangeError('Inputs must be integers from 0 to 100')
  }
}

// The last scale degree stays below the tonic (e.g. F# below G).
export const toDegree = (value, size = 7) => {
  assertSize(size)
  assertSeed(value)
  return ((value + 1) % size) - 1
}

export const makeHook = (degrees, size = 7) => {
  assertSize(size)
  if (!Array.isArray(degrees) || degrees.length !== 4 || !degrees.every(Number.isInteger)) {
    throw new TypeError('Expected exactly four integer scale degrees')
  }
  const [a, b, c, d] = degrees
  return [
    a, b, c, '~',
    b + 1, b, a, '~',
    d, a, b, a + 1,
    '~', d, c - size, '~'
  ].join(' ')
}

// A local seeded generator keeps live reevaluations repeatable, including seed 0.
const varyHook = (hook, seed, size) => {
  let state = seed + 1
  const random = () => {
    state = (state + 0x6D2B79F5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }

  const steps = hook.split(' ')
  // Shuffle notes and rests together: keep 16 equal steps and four rests.
  for (let i = steps.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const step = steps[i]
    steps[i] = steps[j]
    steps[j] = step
  }
  // Move some notes one scale octave up/down, retaining their pitch classes.
  return steps.map(step => {
    if (step === '~') return step
    const octave = Math.floor(random() * 4)
    return Number(step) + (octave === 0 ? -size : octave === 3 ? size : 0)
  }).join(' ')
}

export const makeBassHook = (numbers, size = 7) => {
  assertSize(size)
  if (!Array.isArray(numbers) || (numbers.length !== 4 && numbers.length !== 5)) {
    throw new TypeError('Expected four pitch inputs and an optional fifth variation input')
  }
  const hasVariation = numbers.length === 5
  if (hasVariation) assertSeed(numbers[4])
  const degrees = Array.from(numbers.slice(0, 4), value => toDegree(value, size))
  const motif = makeHook(degrees, size)
  const hook = hasVariation ? varyHook(motif, numbers[4], size) : motif
  return { degrees, bass: '<' + degrees.join(' ') + '>', hook }
}

// Install automatically when imported inside Strudel.
export const registerEffects = (register = globalThis.register) => {
  if (typeof register !== 'function') {
    throw new TypeError('Strudel register function is required')
  }
  register('acidenv', (x, pat) => pat.lpf(100).lpenv(x * 9).lps(.2).lpd(.12))
  register('acidenvi', (x, pat) => pat.hpf(200).hpenv(x * 9).hps(.2).hpd(.12))
}

if (typeof globalThis.register === 'function') registerEffects()

// One namespace for Strudel's editor/prebake; named ESM exports also work elsewhere.
globalThis.StrudelSketch = Object.freeze({ randomFour, toDegree, makeHook, makeBassHook, registerEffects })
