import test from 'node:test'
import assert from 'node:assert/strict'
import { randomFour, toDegree, makeHook, makeBassHook } from '../lib/bass-hook.js'

test('original seeds preserve bass and exact 16-step hook', () => {
  const result = makeBassHook([14, 23, 39, 97])
  assert.deepEqual(result.degrees, [0, 2, 4, -1])
  assert.equal(result.bass, '<0 2 4 -1>')
  assert.equal(result.hook, '0 2 4 ~ 3 2 0 ~ -1 0 2 1 ~ -1 -3 ~')
  assert.deepEqual(Object.keys(result), ['degrees', 'bass', 'hook'])
})

test('all inputs wrap into the same bass range, including endpoints', () => {
  for (const size of [1, 5, 7, 12]) {
    for (let value = 0; value <= 100; value++) {
      const degree = toDegree(value, size)
      assert.ok(degree >= -1 && degree <= size - 2)
      if (value + size <= 100) assert.equal(toDegree(value + size, size), degree)
    }
  }
  assert.equal(toDegree(100), 2)
})

test('invalid seeds and scale sizes fail clearly', () => {
  for (const value of [-1, 101, 0.5, '14', NaN]) assert.throws(() => toDegree(value))
  for (const size of [0, -1, 2.5, NaN]) assert.throws(() => makeBassHook([1, 2, 3, 4], size))
  for (const values of [[], [1, 2, 3], [1, 2, 3, 4, 5, 6], null]) assert.throws(() => makeBassHook(values))
  assert.throws(() => makeHook([0, 2, '4', -1]))
})

test('fifth seed varies the hook reproducibly without changing bass or inputs', () => {
  const numbers = Object.freeze([14, 23, 39, 97, 42])
  const original = makeBassHook(numbers.slice(0, 4))
  const result = makeBassHook(numbers)
  assert.deepEqual(result.degrees, original.degrees)
  assert.equal(result.bass, original.bass)
  assert.deepEqual(Object.keys(result), ['degrees', 'bass', 'hook'])
  assert.equal(result.hook, '2 4 2 ~ -3 7 -5 -8 7 1 -1 ~ 0 ~ 10 ~')
  assert.deepEqual(makeBassHook(numbers), result)
  assert.notEqual(makeBassHook([14, 23, 39, 97, 0]).hook, original.hook)
  assert.notEqual(makeBassHook([14, 23, 39, 97, 100]).hook, result.hook)
})

test('variation preserves phrase length, rest count and scale pitch classes for every seed', () => {
  for (const size of [1, 5, 7, 12]) {
    // Include identical pitch inputs: octave/rhythm variation still applies.
    for (const pitches of [[14, 23, 39, 97], [0, 0, 0, 0]]) {
      const original = makeBassHook(pitches, size).hook.split(' ')
      const pitchClasses = steps => steps.filter(step => step !== '~')
        .map(step => ((Number(step) % size) + size) % size).sort((a, b) => a - b)
      const restPatterns = new Set()
      const contours = new Set()
      for (let seed = 0; seed <= 100; seed++) {
        const inputs = [...pitches, seed]
        const result = makeBassHook(inputs, size)
        assert.deepEqual(makeBassHook(inputs, size), result)
        const steps = result.hook.split(' ')
        assert.equal(steps.length, 16)
        assert.equal(steps.filter(step => step === '~').length, 4)
        assert.ok(steps.every(step => step === '~' || /^-?\d+$/.test(step)))
        assert.deepEqual(pitchClasses(steps), pitchClasses(original))
        restPatterns.add(steps.map(step => step === '~' ? '-' : 'x').join(''))
        const notes = steps.filter(step => step !== '~').map(Number)
        contours.add(notes.slice(1).map((note, i) => note - notes[i]).join(' '))
      }
      assert.ok(restPatterns.size > 1, 'fifth seed changes rest positions')
      assert.ok(contours.size > 1, 'fifth seed changes melodic contour')
    }
  }
})

test('invalid fifth seeds and missing pitch seeds are rejected', () => {
  for (const seed of [-1, 101, .5, '42', NaN, Infinity, null, undefined]) {
    assert.throws(() => makeBassHook([14, 23, 39, 97, seed]), RangeError)
  }
  assert.throws(() => makeBassHook([14, 23, , 97, 42]), RangeError)
  assert.throws(() => makeBassHook([14, 23, 39, 97, ,]), RangeError)
  assert.throws(() => makeBassHook([14, 23, 39, 97, 42], 0), RangeError)
})

test('random seeds and browser namespace are usable', () => {
  for (let i = 0; i < 100; i++) {
    const values = randomFour()
    assert.equal(values.length, 4)
    assert.ok(values.every(value => Number.isInteger(value) && value >= 0 && value <= 100))
  }
  assert.equal(globalThis.StrudelSketch.makeBassHook, makeBassHook)
})

test('import registers both acid envelopes with the supplied effect chains', async () => {
  const effects = new Map()
  globalThis.register = (name, fn) => effects.set(name, fn)
  try {
    await import('../lib/bass-hook.js?effects-test')
  } finally {
    delete globalThis.register
  }
  assert.deepEqual([...effects.keys()], ['acidenv', 'acidenvi'])
  for (const [name, methods] of [
    ['acidenv', [['lpf', 100], ['lpenv', 4.5], ['lps', .2], ['lpd', .12]]],
    ['acidenvi', [['hpf', 200], ['hpenv', 4.5], ['hps', .2], ['hpd', .12]]]
  ]) {
    const calls = []
    const pattern = Object.fromEntries(methods.map(([method]) => [method, value => {
      calls.push([method, value])
      return pattern
    }]))
    assert.equal(effects.get(name)(.5, pattern), pattern)
    assert.deepEqual(calls, methods)
  }
})
