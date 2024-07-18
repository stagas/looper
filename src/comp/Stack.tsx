import JSZip from 'jszip'
import { $, Signal } from 'signal-jsx'

const TIME_CONSTANT = .03
const TIME_TOGGLE_MUTE = .03
const TIME_START = .25

export interface Loop {
  el: HTMLButtonElement
  name: string
  bpm: number
  buffer: AudioBuffer
  source: AudioBufferSourceNode
  gain: GainNode
  vol: number
  isMuted: boolean
}

export type Stack = ReturnType<typeof Stack>

export function Stack({ audio, zip }: { audio: AudioContext, zip: JSZip }) {
  const el = <div />

  const header = <h3 />
  const loops: Loop[] = []

  async function readZip() {
    using $ = Signal()

    let stackName
    for (const [fileName, file] of Object.entries(zip.files)) {
      if (file.dir) {
        stackName = fileName.slice(0, -1)
        header.textContent = stackName
        continue
      }
      const arrayBuffer = await file.async('arraybuffer')
      const buffer = await audio.decodeAudioData(arrayBuffer)
      const source = audio.createBufferSource()
      source.buffer = buffer
      source.loop = true
      const gain = audio.createGain()
      source.connect(gain)
      gain.connect(audio.destination)
      gain.gain.value = 0

      function toggleMute() {
        loop.isMuted = !loop.isMuted
      }
      console.log(file.name)
      const bpm = Number(file.name.split('/')[1].split(' - ')[1].split(' ')[0])
      const name = file.name.split('/')[1].split(' - ').slice(2).join(' - ')

      const el = <button class="flex" onmousedown={toggleMute}>
        {name}
      </button> as HTMLButtonElement

      const loop: $<Loop> = $({
        el,
        name,
        bpm,
        buffer,
        source,
        gain,
        vol: 0,
        isMuted: false,
      })

      $.fx(() => {
        const { isMuted, vol } = loop
        $()
        const targetTime = audio.currentTime + TIME_TOGGLE_MUTE

        gain.gain.setTargetAtTime(
          isMuted ? 0 : vol,
          targetTime,
          TIME_CONSTANT
        )

        if (isMuted) {
          el.classList.add('bg-red')
        }
        else {
          el.classList.remove('bg-red')
        }
      })

      loops.push(loop)
    }
    el.replaceWith(
      <div>
        <button onmousedown={() => {
          const targetTime = audio.currentTime + TIME_START
          for (const loop of loops) {
            loop.source.start(targetTime)
            loop.vol = 1
            // loop.gain.gain.setTargetAtTime(1, targetTime, TIME_CONSTANT)
          }
        }}>
          {stackName}
        </button>

        {loops.map(l => l.el)}
      </div>
    )
  }

  readZip()

  return el
}
