// Load once here, or move this import to Strudel Settings → Prebake.
await import('https://cdn.jsdelivr.net/gh/kasparsj/strudel-sketch@main/lib/bass-hook.js')

const tonic = 'G'
const scaleType = 'major'
const numbers = [14, 23, 39, 97] // Or: StrudelSketch.randomFour()
const { bass, hook, hook2 } = StrudelSketch.makeBassHook(numbers, 7)

$: n(mini(bass))
  .scale(tonic + '1:' + scaleType)
  .s('sawtooth')
  .lpf(450)
  .gain(0.35)

// Use mini(hook2) for the slower version.
$: n(mini(hook))
  .scale(tonic + '4:' + scaleType)
  .s('triangle')
  .release(0.2)
  .gain(0.25)
