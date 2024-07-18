import { Signal } from 'signal-jsx'
import { Stack, StemColors } from './Main.tsx'
import Sortable from 'sortablejs'

export function Player({ stack }: { stack: Stack }) {
  using $ = Signal()

  const stems = stack.stems.map((stem, i) =>
    <div style={{
      width: '30px',
      height: '30px',
      backgroundColor: StemColors[stem.kind], //`hsl(${(240 - (i * 40)) % 360}, 50%, 50%)`
    }} title={stem.name} />
  )

  const stemsEl = <div class="min-w-40 flex items-center justify-start flex-row gap-1">{...stems}</div> as HTMLDivElement

  Sortable.create(stemsEl, {
    delay: 100
  })

  const el = <div class="flex flex-row gap-2">
    <div class="w-60 flex items-center justify-end">{stack.name}</div>
    {stemsEl}
  </div>

  return el
}
