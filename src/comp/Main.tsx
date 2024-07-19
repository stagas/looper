import { Signal } from 'signal-jsx'
import { appState, Sorting } from '../app-state.ts'
import { get, set } from 'idb-keyval'
import JSZip from 'jszip'
import { Player } from './Player.tsx'
import Sortable from 'sortablejs' ///modular/sortable.complete.esm.js'

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

const SEPARATOR_TRACKS = '%%%'

export interface Stack {
  name: string
  bpm: number
  stems: Stem[]
}

export interface Stem {
  stack: Stack
  name: string
  bpm: number
  kind: StemKind
  buffer: AudioBuffer
}

export enum StemKind {
  Bass = 'Bass',
  'Brass & Winds' = 'Brass & Winds',
  Chords = 'Chords',
  Drums = 'Drums',
  FX = 'FX',
  Guitar = 'Guitar',
  Keys = 'Keys',
  Leads = 'Leads',
  Others = 'Others',
  Pads = 'Pads',
  Percussion = 'Percussion',
  Strings = 'Strings',
  Synth = 'Synth',
  Vocals = 'Vocals',
}

export const StemColors = Object.fromEntries(Object.keys(StemKind).map((name, i) =>
  [name, `hsl(${(230 - (i * 95)) % 360}, 70%, 60%)`]
))

export function Main() {
  using $ = Signal()

  const audio = new AudioContext()

  const players = <div class="flex flex-col gap-1" /> as HTMLDivElement

  Sortable.create(players, {
    animation: 120,
    onEnd(ev) {
      const sorting: Sorting = {}
      for (const stack of players.children) {
        const name = (stack as HTMLElement).dataset.name || '<invalid>'
        const stems: string[] = []
        for (const stem of stack.children) {
          const name = (stem as HTMLElement).dataset.name || '<invalid>'
          stems.push(name)
        }
        sorting[name] = stems
      }
      appState.sorting = sorting
    }
  })

  const info = $({
    stacks: [] as Stack[],
  })

  $.fx(() => {
    const { stacks } = info
    $()
    const els = stacks.map(stack =>
      <Player {...{ stack }} />
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

  async function tryReadDir() {
    const dirHandle = await get('dirHandle')
    if (dirHandle) {
      DEBUG && console.log('GOT dirHandle', dirHandle)
      const zipFiles = await findZipFiles(dirHandle)
      for (const file of zipFiles) {
        const stack = await readZipFile(dirHandle, file.name)
        openFolder.remove()
        info.stacks.push(stack)
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

    // NOTE: The following code is not robust. We expect
    // certain patterns to be followed by the stems zip and its contents,
    // so any weird deviation will most likely break something here.
    let stack: Stack | undefined
    for (const file of Object.values(zipContent.files)) {
      if (file.dir) {
        const name = file.name.slice(0, -1).replace(/\s*\[Stems\]\s*/, '').trim()
        stack = {
          name,
          bpm: 0,
          stems: []
        }

        continue
      }

      if (!stack) continue

      const name = file.name.split('/')[1].split(' - ').slice(2).join(' - ')
      const bpm = Number(file.name.split('/')[1].split(' - ')[1].split(' ')[0])
      const kind = file.name.split('/')[1].split(' - ')[3] as StemKind

      const arrayBuffer = await file.async('arraybuffer')
      const buffer = await audio.decodeAudioData(arrayBuffer)

      const stem: Stem = {
        stack,
        name,
        bpm,
        kind,
        buffer,
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

  return <main>
    {openFolder}
    {players}
  </main>
}
