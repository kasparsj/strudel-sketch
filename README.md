# strudel-sketch

Reusable four-number bass and hook helpers for Strudel, with an optional fifth number for melodic variation. No dependencies. Automatically registers the acid envelope effects when loaded in Strudel.

## Play

Paste [sketches/action.js](sketches/action.js) into the Strudel editor and evaluate it.
The first line loads the library from this public repository through jsDelivr:

```js
await import('https://cdn.jsdelivr.net/gh/kasparsj/strudel-sketch@main/lib/bass-hook.js')
```

You can instead put that line in Settings → Prebake, save, and reload Strudel.
Then your action sketches only need to call the helpers:

```js
const { bass, hook } = StrudelSketch.makeBassHook([14, 23, 39, 97])

$: n(mini(bass)).scale('G1:major').s('sawtooth').lpf(450).gain(0.35)
$: n(mini(hook)).slow(3).scale('G4:major').s('triangle').release(0.2).gain(0.25)
```

Use `StrudelSketch.randomFour()` instead of the array for fresh inputs.
Use `.slow(3)` on the hook pattern to stretch it over three cycles.
Random inputs are regenerated whenever that call is evaluated; fixed inputs are deterministic.

### Optional fifth number

```js
const { bass, hook } = StrudelSketch.makeBassHook([14, 23, 39, 97, 42])
```

The first four numbers still choose the bass notes. The fifth (a whole number
from 0 through 100) reshapes the hook: it shuffles notes and rests and moves
some notes one scale octave up or down. The phrase keeps 16 equal steps,
12 notes, and four rests, but their positions and the melodic contour vary.
The original hook's pitch classes are preserved; octave moves can extend its range.

The same five numbers always produce the same result on reevaluation.
Zero is a valid variation seed; omit the fifth number to get the exact original
motif. `randomFour()` still returns only four pitch inputs.
For a performance, you can ask a fifth audience member for this number after
revealing the original melody, then add it to the array and hear the transformation.
Load the updated library before using five inputs (see caching notes below).

## Helpers

- `randomFour()` returns four integers from 0 through 100, inclusive.
- `toDegree(value, size = 7)` returns `((value + 1) % size) - 1`.
- `makeHook(degrees, size = 7)` returns the original 16-step hook as mini-notation.
- `makeBassHook(numbers, size = 7)` accepts four pitch inputs plus an optional fifth variation input, and returns `{ degrees, bass, hook }`. `degrees` always contains four values; the second argument remains the scale size.

`[14, 23, 39, 97]` maps to `[0, 2, 4, -1]`.
For seven-note scales, degrees stay between -1 and 5: the final scale note
is below the tonic, preserving F#1 with G1 major. Inputs repeat every seven;
0, 7, and 14 select G, while 100 selects B. The hook intentionally reaches
outside the bass range. If you change the scale, pass its note count as the
second argument and change `.scale(...)` in the sketch to match.

The module exposes `globalThis.StrudelSketch` for the live editor and also
provides named ESM exports for normal JavaScript projects.

## Updates and verification

jsDelivr caches branch URLs, and browsers cache imported modules. For reproducible
sketches, replace `@main` with a Git commit SHA. After library edits, use the new
SHA and reload the editor to load that version.

Run `npm test` (Node.js 18+). Tests cover mapping, exact hook output, seeded
variation, phrase structure, ranges, validation, random input bounds, and the browser namespace. Audio playback in
the Strudel editor is a separate manual check.

## Acid envelopes

The library import also registers `.acidenv(x)` and `.acidenvi(x)`:

```js
$: n("0 2 4 -1").scale('G2:major').s('sawtooth').acidenv(0.6)
$: n("0 2 4 -1").scale('G4:major').s('sawtooth').acidenvi(0.4)
```

`acidenv` applies `lpf(100).lpenv(x * 9).lps(.2).lpd(.12)`.
`acidenvi` applies `hpf(200).hpenv(x * 9).hps(.2).hpd(.12)`.
If importing before Strudel initializes, call `StrudelSketch.registerEffects(register)`
once after its `register` function becomes available.
