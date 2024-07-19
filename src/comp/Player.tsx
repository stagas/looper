import { Signal } from 'signal-jsx'
import { appState, Sorting } from '../app-state.ts'
import { Stack, StemColors } from './Main.tsx'
import Sortable from 'sortablejs'

export function Player({ stack, onEnd }: { stack: Stack, onEnd: (ev: Sortable.SortableEvent) => void }) {
  using $ = Signal()

  const stems = stack.stems.map(stem => ({
    name: stem.name,
    el: <div style={{
      width: '30px',
      height: '30px',
      backgroundColor: StemColors[stem.kind], //`hsl(${(240 - (i * 40)) % 360}, 50%, 50%)`
    }} title={stem.name} data-name={stem.name} />
  }))

  stems.sort((a, b) =>
    appState.sorting[stack.name]?.indexOf(a.name)
    - appState.sorting[stack.name]?.indexOf(b.name)
  )

  const stemsEl = <div class="min-w-40 flex items-center justify-start flex-row gap-1">
    {...stems.map(stem => stem.el)}
  </div> as HTMLDivElement

  Sortable.create(stemsEl, {
    animation: 120,
    delay: 0, // 100
    onEnd,
  })

  const el = <div class="flex flex-row gap-2" data-name={stack.name}>
    <div class="w-60 flex items-center justify-end">{stack.name}</div>
    {stemsEl}
  </div>

  return el
}
