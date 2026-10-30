import test from 'node:test'
import assert from 'node:assert/strict'
import { randomFour, toDegree, makeHook, makeBassHook } from '../lib/bass-hook.js'

test('original seeds preserve bass and exact 16-step hook', () => {
  const result = makeBassHook([14, 23, 39, 97])
  assert.deepEqual(result.degrees, [0, 2, 4, -1])
  assert.equal(result.bass, '<0 2 4 -1>')
  assert.equal(result.hook, '0 2 4 ~ 3 2 0 ~ -1 0 2 1 ~ -1 -3 ~')
  assert.equal(result.hook2, '[' + result.hook + ']/3')
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
  for (const values of [[], [1, 2, 3], [1, 2, 3, 4, 5], null]) assert.throws(() => makeBassHook(values))
  assert.throws(() => makeHook([0, 2, '4', -1]))
})

test('random seeds and browser namespace are usable', () => {
  for (let i = 0; i < 100; i++) {
    const values = randomFour()
    assert.equal(values.length, 4)
    assert.ok(values.every(value => Number.isInteger(value) && value >= 0 && value <= 100))
  }
  assert.equal(globalThis.StrudelSketch.makeBassHook, makeBassHook)
})
