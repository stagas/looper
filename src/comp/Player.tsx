import { Signal } from 'signal-jsx'
import { appState, Sorting } from '../app-state.ts'
import { Stack, StemColors } from './Main.tsx'
import Sortable from 'sortablejs'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'

export function Player({ stack, onEnd }: { stack: Stack, onEnd: (ev: Sortable.SortableEvent) => void }) {
  using $ = Signal()

  stack.stems.sort((a, b) =>
    appState.sorting[stack.name]?.indexOf(a.name)
    - appState.sorting[stack.name]?.indexOf(b.name)
  )

  const stems = stack.stems.map(stem => {
    const el = <div style={{
      width: '30px',
      height: '30px',
      backgroundColor: StemColors[stem.kind], //`hsl(${(240 - (i * 40)) % 360}, 50%, 50%)`
    }} data-name={stem.name} />

    tippy(el, { content: stem.name })

    $.fx(() => {
      const { isPlaying } = stem.info
      $()
      if (isPlaying) {
        el.classList.add('playing')
      }
      else {
        el.classList.remove('playing')
      }
    })

    return ({
      name: stem.name,
      el,
    })
  })

  const stemsEl = <div class="flex items-center justify-start flex-row gap-1">
    {...stems.map(stem => stem.el)}
  </div> as HTMLDivElement

  Sortable.create(stemsEl, {
    animation: 120,
    delay: 0, // 100
    onEnd,
  })

  const el = <div class="flex flex-row gap-2" data-name={stack.name}>
    <div class="w-40 flex items-center justify-end">{stack.name}</div>
    {stemsEl}
  </div>

  return el
}
