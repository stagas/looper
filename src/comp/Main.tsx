import { Signal } from 'signal-jsx'
import { appState } from '../app-state.ts'
import * as path from 'path'
import JSZip from 'jszip'
// import { Snap } from './Snap.tsx'

export function Main() {
  using $ = Signal()

  const audio = new AudioContext()

  const fileList = <ul></ul>

  const dropArea = <div
    class="w-80 h-80 flex items-center justify-center border-2 border-white"
    ondragover={(event: DragEvent) => {
      event.preventDefault()
      dropArea.style.backgroundColor = '#f0f0f0'
    }}
    ondragleave={() => {
      dropArea.style.backgroundColor = ''
    }}
    ondrop={async (event: DragEvent) => {
      event.preventDefault()
      dropArea.style.backgroundColor = ''
      const files = event.dataTransfer?.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type === 'application/zip') {
          const zip = await JSZip.loadAsync(file)
          for (const [name, file] of Object.entries(zip.files)) {
            if (file.dir) continue
            console.log(name, file.name)
            const arrayBuffer = await file.async('arraybuffer')
            console.log(arrayBuffer)
            const audioBuffer = await audio.decodeAudioData(arrayBuffer)
            console.log(audioBuffer)
            const bufferSource = audio.createBufferSource()
            bufferSource.buffer = audioBuffer
            bufferSource.loop = true
            bufferSource.connect(audio.destination)
            const playBtn = <button onmousedown={() => {
              bufferSource.start()
            }}>{file.name}</button>
            fileList.append(playBtn)
          }
          // let projectName: string = ''
          // const loopFiles: JSZip.JSZipObject[][] = []
          // zip.forEach((relativePath, zipObject) => {
          //   if (!zipObject.dir) {
          //     loopFiles.push(relativePath.split('/')[1].split(' - '))
          //   }
          // })
          // console.log(projectName, loopFiles)
        } else {
          alert('Please drop a ZIP file.')
        }
      }
    }}
  >
    Drop zip file here
  </div> as HTMLElement


  $.fx(() => () => {
    audio.close()
  })

  return <main
    data-theme={() => appState.theme}
    class="m-4">
    {dropArea}
    {fileList}
  </main>
}
