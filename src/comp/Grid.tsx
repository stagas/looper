import { $ } from 'signal-jsx'
import tippy, { Instance } from 'tippy.js'
import { MouseButtons, prevent } from 'utils'
import { appState, CellEvent } from '../app-state.ts'
import { gridState } from '../grid-state.ts'
import { Stack, Stem } from './Main.tsx'

const SIZE_X = 4
const SIZE_Y = 4

interface Row {
  y: number
  cells: Cell[]
  el: HTMLDivElement
}

interface Cell {
  x: number
  y: number
  el: Element
  tippy: Instance | null
  info: $<{
    stem: Stem | null
  }>
}

export function Grid({ play, info }: { play(startX: number): void, info: { stacks: Stack[] } }) {
  let el = <div class="flex flex-col gap-1" />

  function findCellStem(x: number, y: number) {
    for (const ev of appState.cellEvents) {
      if (ev.x === x && ev.y === y) {
        for (const stack of info.stacks) {
          if (stack.name === ev.stack) {
            for (const stem of stack.stems) {
              if (stem.name === ev.stem) {
                return stem
              }
            }
          }
        }
      }
    }
    return null
  }

  function update() {
    const rows: Row[] = []

    function updateCellEvents() {
      const cellEvents: CellEvent[] = []
      for (const row of rows) {
        for (const cell of row.cells) {
          if (cell.info.stem) {
            cellEvents.push({
              x: cell.x,
              y: cell.y,
              stack: cell.info.stem.stack.name,
              stem: cell.info.stem.name
            })
          }
        }
      }
      appState.cellEvents = [...cellEvents]
    }

    const sizeY = Math.max(...appState.cellEvents.map(ev => ev.y + 2), SIZE_Y)
    const sizeX = Math.max(...appState.cellEvents.map(ev => ev.x + 2), SIZE_X)

    for (let y = 0; y < sizeY; y++) {
      const cells: Cell[] = []

      for (let x = 0; x < sizeX; x++) {
        const el = <div
          class={`${x % 8 >= 4 ? 'bg-slate-600' : 'bg-slate-700'}
            min-w-[30px] min-h-[30px] flex text-black items-center justify-center`}
          onmousedown={(e: MouseEvent) => {
            e.preventDefault()
            let changed = false
            const isRight = e.buttons & MouseButtons.Right
            if (cell.info.stem) {
              if (isRight) {
                for (const ev of appState.cellEvents) {
                  if (ev.x === x && ev.y === y) {
                    appState.cellEvents = appState.cellEvents.filter(other => ev !== other)
                    break
                  }
                }
                cell.info.stem = null
                if (cell.tippy) {
                  cell.tippy.destroy()
                  cell.tippy = null
                }
                changed = true
              }
              else {
                gridState.stemBrush = cell.info.stem
              }
            }
            else if (!isRight && gridState.stemBrush) {
              cell.info.stem = gridState.stemBrush
              if (cell.tippy) cell.tippy.destroy()
              cell.tippy = tippy(el, { content: cell.info.stem.name })
              changed = true
            }
            if (changed) {
              updateCellEvents()
              update()
            }
          }}
        /> as HTMLDivElement

        const stem = findCellStem(x, y)

        const cell: Cell = {
          x,
          y,
          el,
          tippy: stem ? tippy(el, { content: stem.name }) : null,
          info: $({
            stem
          })
        }

        cells.push(cell)

        $.fx(() => {
          const { stem } = cell.info
          $()
          el.style.backgroundColor = stem?.info.color ?? ''
          el.textContent = stem?.stack.info.short ?? ''
        })
      }

      const row = <div class="text-black flex flex-row gap-1 items-start justify-start">
        {...cells.map(x => x.el)}
      </div> as HTMLDivElement

      rows.push({ y, cells, el: row })
    }

    const indicators = <div class="flex flex-row gap-1 items-start justify-start">{Array.from({ length: sizeX }, (_, x) =>
      gridState.indicators[x] = <div class="indicator bg-slate-500 min-w-[30px] h-4"
        onclick={() => play(x)}
      /> as HTMLDivElement
    )}</div>

    const newEl = <div class="flex flex-col gap-1" oncontextmenu={prevent}>
      {indicators}
      {...rows.map(x => x.el)}
    </div>
    el.replaceWith(newEl)
    el = newEl
  }

  $.fx(() => {
    const { stacks } = info
    $()
    update()
  })

  return el
}
