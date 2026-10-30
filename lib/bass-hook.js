/** Four integer seeds → scale degrees and Strudel mini-notation. */
const assertSize = size => {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError('Scale size must be a positive integer')
  }
}

export const randomFour = () =>
  Array.from({ length: 4 }, () => Math.floor(Math.random() * 101))

// The last scale degree stays below the tonic (e.g. F# below G).
export const toDegree = (value, size = 7) => {
  assertSize(size)
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new RangeError('Inputs must be integers from 0 to 100')
  }
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

export const makeBassHook = (numbers, size = 7) => {
  assertSize(size)
  if (!Array.isArray(numbers) || numbers.length !== 4) {
    throw new TypeError('Expected exactly four inputs')
  }
  const degrees = Array.from(numbers, value => toDegree(value, size))
  const hook = makeHook(degrees, size)
  return { degrees, bass: '<' + degrees.join(' ') + '>', hook, hook2: '[' + hook + ']/3' }
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
