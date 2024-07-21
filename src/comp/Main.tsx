import { $, Signal } from 'signal-jsx'
import { appState, Sorting } from '../app-state.ts'
import { get, set } from 'idb-keyval'
import JSZip from 'jszip'
import { Player } from './Player.tsx'
import Sortable from 'sortablejs' ///modular/sortable.complete.esm.js'
import { Grid } from './Grid.tsx'

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

const VOL_TIME_CONSTANT = 0.03

const BPM = 144
const TIME_BEAT = 60 / BPM
const TIME_BAR = TIME_BEAT * 4

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

export interface ScheduleEvent {
  stem: Stem
  targetTime: number
  source: AudioBufferSourceNode
  gain: GainNode
  isStart: boolean
  isEnd: boolean
}

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

  function play_old() {
    // console.log(info.stacks)
    const schedule: ScheduleEvent[] = []
    let targetTime = audio.currentTime + 0.1

    for (const stack of info.stacks) {
      for (const [i, stem] of stack.stems.entries()) {
        const source = audio.createBufferSource()
        source.buffer = stem.buffer
        source.loop = true
        const gain = audio.createGain()
        gain.gain.value = 0
        source.connect(gain)
        gain.connect(audio.destination)
        schedule.push({
          stem,
          targetTime,
          source,
          gain,
          isStart: i === 0,
          isEnd: i === stack.stems.length - 1
        })
        targetTime += stem.buffer.duration
      }
    }

    const current = []
    let countUp = 0
    let countDown = 0

    for (let i = 0; i < schedule.length; i++) {
      const ev = schedule[i]

      ev.source.start(ev.targetTime)

      setTimeout(() => {
        ev.stem.info.isPlaying = true
      }, (ev.targetTime - audio.currentTime) * 1000)

      ev.gain.gain.setTargetAtTime(
        ev.stem.vol,
        ev.targetTime,
        VOL_TIME_CONSTANT // TODO: fade in
      )

      current.push(ev)
      ++countUp

      if (ev.isEnd) {
        countDown = countUp
        countUp = 0
      }

      if (--countDown >= 0) {
        const old = current.shift()
        if (old) {
          const endTime =
            schedule[i + 2]?.targetTime
            || schedule[i + 1]?.targetTime
            || ev.targetTime

          old.source.stop(endTime)
          old.gain.gain.setTargetAtTime(
            0,
            endTime,
            VOL_TIME_CONSTANT // TODO: fade out
          )

          setTimeout(() => {
            old.stem.info.isPlaying = false
          }, (endTime - audio.currentTime) * 1000)
        }
      }
    }
  }

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

  function play() {
    const timeBeat = 1000 / BPM
    const busy: boolean[][] = []
    for (const ev of appState.cellEvents) {
      // const timeStart = ev.x * TIME_BAR
      const stem = findCellStem(ev.x, ev.y)
      if (stem) {
        busy[ev.y] ??= []
        busy[ev.y][ev.x] = true

        const bars = Math.round(stem.buffer.duration / TIME_BAR)
        const barEnd = ev.x + bars
        // let actualTimeEnd = timeStart + TIME_BAR
        for (let i = ev.x; i < ev.x + bars; i++) {
          if (busy[ev.y][ev.x]) continue

        }
        const source = audio.createBufferSource()
        source.buffer = stem.buffer

      }

    }
  }

  const playBtn = <div class="flex flex-row items-start justify-start gap-2">
    {/* <div class="w-36" /> */}
    <button
      class="
      btn
      btn-primary
      w-44
    "
      onclick={play}
    >Play</button>
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
      // console.log(appState.sorting)
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

  const grid = <div />
  setTimeout(() => {
    grid.replaceWith(<Grid {...{ info }} />)
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
