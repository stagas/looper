import { Signal } from 'signal-jsx'
import { appState } from '../app-state.ts'
import { get, set } from 'idb-keyval'
import JSZip from 'jszip'
// import { Stack } from './Stack.tsx'

// declare const window: any

function getFile(entry: FileSystemEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    (entry as FileSystemFileEntry).file(resolve, reject)
  })
}

interface Stack {
  name: string
  bpm: number
  stems: Stem[]
}

interface Stem {
  stack: Stack
  name: string
  bpm: number
  buffer: AudioBuffer
}

export function Main() {
  using $ = Signal()

  const audio = new AudioContext()

  // const stacks = <div /> //Loop[] = []

  const openFolder = <button onclick={
    async () => {
      const dirHandle = await window.showDirectoryPicker({ startIn: 'downloads' })
      await set('dirHandle', dirHandle)
      console.log('SET', dirHandle)
      await tryOpen()
      // await traverseDirectory(directoryHandle)
      // displayFolderContent()
    }
  }>open folder</button>

  async function tryOpen() {
    const stacks: Stack[] = []
    const dirHandle = await get('dirHandle')
    if (dirHandle) {
      console.log('GOT', dirHandle)
      const zipFiles = await findZipFiles(dirHandle)
      for (const file of zipFiles) {
        const stack = await readZipFile(dirHandle, file.name)
        stacks.push(stack)
      }
    }
    else {
      console.log('dirHandle not found')
    }
    console.log(stacks)
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
      const arrayBuffer = await file.async('arraybuffer')
      const buffer = await audio.decodeAudioData(arrayBuffer)

      const stem: Stem = {
        stack,
        name,
        bpm,
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

  // const dropArea = <div
  //   class="w-80 h-80 flex items-center justify-center border-2 border-white"
  //   ondragover={(event: DragEvent) => {
  //     event.preventDefault()
  //     dropArea.style.backgroundColor = '#f0f0f0'
  //   }}
  //   ondragleave={() => {
  //     dropArea.style.backgroundColor = ''
  //   }}
  //   ondrop={async (event: DragEvent) => {
  //     event.preventDefault()

  //     dropArea.style.backgroundColor = ''

  //     const items = event.dataTransfer?.items

  //     if (items) {
  //       for (let i = 0; i < items.length; i++) {
  //         const item = items[i].webkitGetAsEntry()
  //         console.log(item)
  //         if (item && item.isDirectory) {
  //           (item as FileSystemDirectoryEntry).getDirectory()
  //           const file = await getFile(item)
  //           console.log(file)
  //           if (file.type === 'application/zip') {
  //             console.log('yeah', item)
  //           }
  //         }
  //       }
  //     }
  //     // if (files && files.length > 0) {
  //     //   const file = files[0]
  //     //   if (file.type === 'application/zip') {
  //     //     const zip = await JSZip.loadAsync(file)
  //     //     stacks.append(<Stack {...{ audio, zip }} />)
  //     //   } else {
  //     //     alert('Drop Splice Stack ZIP file.')
  //     //   }
  //     // }
  //   }}
  // >
  //   Drop a Splice Stack zip file here
  // </div> as HTMLDivElement


  $.fx(() => () => {
    audio.close()
  })

  tryOpen()

  return <main
    data-theme={() => appState.theme}
    class="m-4">
    {/* {dropArea} */}
    {openFolder}
    {/* {stacks} */}
  </main>
}
