import { $, Signal } from 'signal-jsx'
import { appState, Sorting } from '../app-state.ts'
import { get, set } from 'idb-keyval'
import JSZip from 'jszip'
import { Player } from './Player.tsx'
import Sortable from 'sortablejs' ///modular/sortable.complete.esm.js'
import { Grid } from './Grid.tsx'
import { gridState } from '../grid-state.ts'

// declare const window: any

// {
//   Bass: '#b97bfb',
//   'Brass & Winds': '#ffe08b',
//   Chords: '#fd9227',
//   Drums: '#f9cd5a',
//   FX: '#e7f183',
//   Guitar: '#9ffd7c',
//   Keys: '#45dbfd',
//   Leads: '#70f442',
//   Others: '#cccccc',
//   Pads: '#872ffa',
//   Percussion: '#ff9791',
//   Strings: '#3c94fb',
//   Synth: '#ffc4c1',
//   Vocals: '#ff8aa6',
// }

const DEBUG = false


const BPM = 144
const TIME_BEAT = 60 / BPM
const TIME_BAR = TIME_BEAT * 4
const TIME_DELAY = 0.2

const VOL_TIME_CONSTANT = 0.03
const VOL_TIME_FADE = TIME_BAR

export interface Stack {
  name: string
  bpm: number
  stems: Stem[]
  info: $<{
    short: string
  }>
}

export interface Stem {
  stack: Stack
  index: number
  name: string
  bpm: number
  kind: StemKind
  buffer: AudioBuffer
  vol: number
  info: $<{
    isPlaying: boolean
    color: string
  }>
}

export enum StemKind {
  Drums = 'Drums',
  Bass = 'Bass',
  Percussion = 'Percussion',
  Others = 'Others',
  FX = 'FX',
  Chords = 'Chords',
  Pads = 'Pads',
  Keys = 'Keys',
  'Brass & Winds' = 'Brass & Winds',
  Strings = 'Strings',
  Guitar = 'Guitar',
  Leads = 'Leads',
  Synth = 'Synth',
  Vocals = 'Vocals',
}

export const StemColors = Object.fromEntries(Object.keys(StemKind).map((name, i) =>
  [name, `hsl(${(235 - (i * 20)) % 360}, 65%, 55%)`]
))

export function Main() {
  using $ = Signal()

  const audio = new AudioContext()

  const players = <div class="flex flex-col gap-1" /> as HTMLDivElement

  function onEnd(ev: Sortable.SortableEvent) {
    const sorting: Sorting = {}
    for (const stack of players.children) {
      const name = (stack as HTMLElement).dataset.name || '<invalid>'
      const stems: string[] = []
      for (const stem of (stack.lastChild as HTMLElement).children) {
        const name = (stem as HTMLElement).dataset.name || '<invalid>'
        stems.push(name)
      }
      sorting[name] = stems
    }
    appState.sorting = sorting
  }

  Sortable.create(players, {
    animation: 120,
    onEnd,
  })

  const info = $({
    stacks: [] as Stack[],
  })

  $.fx(() => {
    const { stacks } = info
    $()
    const els = stacks.map(stack =>
      <Player {...{ audio, stack, onEnd }} />
    )

    players.innerHTML = ''

    for (const el of els) {
      players.append(el)
    }
  })

  const openFolder = <button onclick={async () => {
    const dirHandle = await window.showDirectoryPicker({ startIn: 'downloads' })
    await set('dirHandle', dirHandle)
    DEBUG && console.log('SET dirHandle', dirHandle)
    await tryReadDir()
  }} class="
    btn
    btn-primary
  ">
    select a folder with Splice zip files
  </button>

  function findCellStem(x: number, y: number) {
    for (const ev of appState.cellEvents) {
      if (ev.x === x && ev.y === y) {
        for (const stack of info.stacks) {
          if (stack.name === ev.stack) {
            for (const stem of stack.stems) {
              if (stem.name === ev.stem) {
                return { ev, stem }
              }
            }
          }
        }
      }
    }
    return null
  }

  let timeouts: NodeJS.Timeout[] = []
  let sources: AudioBufferSourceNode[] = []

  function stop() {
    for (const t of timeouts) {
      clearTimeout(t)
    }
    timeouts = []
    for (const s of sources) {
      s.stop()
    }
    for (const i of gridState.indicators) {
      i.style.backgroundColor = ''
    }
    sources = []
    stopBtn.replaceWith(playBtn)
  }

  function play(startX = 0) {
    stop()
    playBtn.replaceWith(stopBtn)
    const busy: boolean[][] = []
    const timeStart = audio.currentTime + TIME_DELAY
    const rowGains: GainNode[] = []
    for (const ev of appState.cellEvents) {
      if (ev.x < startX) continue

      const cellStem = findCellStem(ev.x, ev.y)

      rowGains[ev.y] ??= audio.createGain()

      if (cellStem) {
        const stem = cellStem.stem

        // determine playback times

        busy[ev.y] ??= []

        const stemTimeStart = (ev.x - startX) * TIME_BAR

        const gain = rowGains[ev.y]
        gain.gain.value = 0
        gain.gain.setTargetAtTime(
          ev.fade === '-' || ev.fade === '/' ? stem.vol : 0,
          timeStart + stemTimeStart,
          ev.fade === '-' ? VOL_TIME_CONSTANT : VOL_TIME_FADE
        )

        timeouts.push(setTimeout(() => {
          gridState.indicators[ev.x].style.backgroundColor = '#fff'
        }, (TIME_DELAY + stemTimeStart) * 1000))

        if (busy[ev.y][ev.x]) {
          continue
        }

        busy[ev.y][ev.x] = true

        const bars = Math.round(stem.buffer.duration / TIME_BAR)

        let actualBarEnd = ev.x
        for (let x = ev.x; x < ev.x + bars; x++) {
          if (findCellStem(x, ev.y)?.stem === stem) {
            actualBarEnd++
            busy[ev.y][x] = true
          }
          else {
            break
          }
        }
        const stemTimeEnd = (actualBarEnd - startX) * TIME_BAR

        // prepare audio

        const source = audio.createBufferSource()
        sources.push(source)
        source.buffer = stem.buffer

        source.connect(gain)
        gain.connect(audio.destination)

        source.start(timeStart + stemTimeStart)
        source.stop(timeStart + stemTimeEnd)
      }
    }
    // const timeEnd =
  }

  const playBtn = <div class="flex flex-row items-start justify-start gap-2">
    {/* <div class="w-36" /> */}
    <button
      class="
      btn
      btn-primary
      w-44
    "
      onclick={() => play()}
    >Play</button>
  </div>

  const stopBtn = <div class="flex flex-row items-start justify-start gap-2">
    {/* <div class="w-36" /> */}
    <button
      class="
      btn
      btn-primary
      w-44
    "
      onclick={stop}
    >Stop</button>
  </div>

  async function tryReadDir() {
    const dirHandle = await get('dirHandle')
    if (dirHandle) {
      DEBUG && console.log('GOT dirHandle', dirHandle)
      const zipFiles = await findZipFiles(dirHandle)
      openFolder.replaceWith(playBtn)

      // TEMP
      let count = 4
      for (const file of zipFiles) {
        // TEMP
        if (!--count) break

        const stack = await readZipFile(dirHandle, file.name)
        info.stacks.push(stack)
        info.stacks.sort((a, b) =>
          Object.keys(appState.sorting).indexOf(a.name)
          - Object.keys(appState.sorting).indexOf(b.name)
        )
        info.stacks = [...info.stacks]
      }
    }
    else {
      DEBUG && console.warn('dirHandle not found')
    }
  }

  async function readZipFile(dirHandle: FileSystemDirectoryHandle, fileName: string) {
    const fileHandle = await dirHandle.getFileHandle(fileName)
    const zipFile = await fileHandle.getFile()
    const arrayBuffer = await zipFile.arrayBuffer()

    const zip = new JSZip()
    const zipContent = await zip.loadAsync(arrayBuffer)

    // NOTE: The following code is brittle. We expect
    // certain patterns to be followed by the stems zip and its contents,
    // so any weird deviation will most likely break something here.
    let stack: Stack | undefined
    for (const file of Object.values(zipContent.files)) {
      if (file.dir) {
        const name = file.name.slice(0, -1).replace(/\s*\[Stems\]\s*/, '').trim()
        const info = $({
          get short() {
            return name.split(' ').map(x => x[0]).join('')
          }
        })
        stack = {
          name,
          bpm: 0,
          stems: [],
          info,
        }

        continue
      }

      if (!stack) continue

      const name = file.name.split('/')[1].split(' - ').slice(2).join(' - ').replace('.wav', '')
      const bpm = Number(file.name.split('/')[1].split(' - ')[1].split(' ')[0])
      const index = Number(file.name.split('/')[1].split(' - ')[2])
      const kind = file.name.split('/')[1].split(' - ')[3] as StemKind

      const arrayBuffer = await file.async('arraybuffer')
      const buffer = await audio.decodeAudioData(arrayBuffer)

      const info = $({
        isPlaying: false,
        get color() {
          return `hsl(${(286 - (stem.index * 46)) % 360}, 75%, 50%)`
        }
      })

      const stem: Stem = {
        stack,
        index,
        name,
        bpm,
        kind,
        buffer,
        vol: 1,
        info,
      }

      stack.bpm ||= bpm
      stack.stems.push(stem)
    }

    if (!stack) throw new Error('Cannot read stack zip: ' + fileName)

    return stack
  }

  async function findZipFiles(dirHandle: FileSystemDirectoryHandle) {
    const zipFiles = []
    for await (const [name, handle] of dirHandle.entries()) {
      if (
        handle.kind === 'file'
        && name.endsWith('.zip')
        && name.includes('[Stems]')
      ) {
        zipFiles.push({ name, handle })
      }
    }
    return zipFiles
  }

  $.fx(() => () => {
    audio.close()
  })

  tryReadDir()

  let grid = <div />

  setTimeout(() => {
    grid.replaceWith(grid = <Grid {...{ play, info }} />)
  })
  return <main class="flex flex-col gap-2 max-w-full p-4 items-center justify-center">
    {openFolder}
    <div class="w-full relative overflow-x-scroll pb-1">
      {grid}
    </div>
    <div class="flex flex-row items-start justify-start gap-1.5">
      {players}
    </div>
  </main>
}
