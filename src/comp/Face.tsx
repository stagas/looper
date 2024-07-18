import { Signal } from 'signal-jsx'
import { isMobile } from 'utils'
import * as faceapi from 'face-api.js'
import { env } from '../env.ts'

const WIDTH = 640
const HEIGHT = 480
const IS_MOBILE = isMobile()

export function Face() {
  using $ = Signal()

  const video = <video autoplay class="
    hidden
    bg-black
  " /> as HTMLVideoElement

  let running = true
  const previewWidth = Math.min(400, visualViewport?.width ?? window.innerWidth)

  const preview = <canvas
    width={previewWidth}
    height={previewWidth * 0.45}
    class="
      bg-black
    "
  /> as HTMLCanvasElement
  preview.style.imageRendering = 'pixelated'

  const c = preview.getContext('2d')!
  c.imageSmoothingEnabled = false

  // show instructions
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillStyle = '#fff'
  c.font = '12pt monospace'
  c.fillText(
    'Point the camera to your face',
    preview.width / 2,
    preview.height / 2
  )

  async function playVideo() {
    const path = '/weights'
    await faceapi.nets.tinyFaceDetector.loadFromUri(path)
    await faceapi.nets.faceLandmark68Net.loadFromUri(path)

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: WIDTH,
        height: HEIGHT,
        facingMode: { ideal: 'user' },
      },
    })
    video.srcObject = stream
  }
  playVideo()

  let dims: any
  let bbox: any

  video.addEventListener('play', () => {
    dims = {
      width: video.videoWidth,
      height: video.videoHeight
    }
    start()
  })

  async function detect() {
    if (!running) return

    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 32 * 10,
      scoreThreshold: 0.1
    })

    const detections = await faceapi
      .detectAllFaces(video, options)
      .withFaceLandmarks()

    const resized = faceapi.resizeResults(
      detections,
      dims
    )

    if (resized.length) {
      controls.replaceWith(takeSelfie)
      const [face] = resized
      const eyes = [
        face.landmarks.getLeftEye(),
        face.landmarks.getLeftEyeBrow(),
        face.landmarks.getRightEye(),
        face.landmarks.getRightEyeBrow(),
        face.landmarks.getNose().slice(0, 2),
      ].flat()

      bbox = eyes.reduce((box, point) => {
        if (point.x < box.left) box.left = point.x
        if (point.x > box.right) box.right = point.x
        if (point.y < box.top) box.top = point.y
        if (point.y > box.bottom) box.bottom = point.y
        return box
      }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity })

      c.strokeStyle = '#f0f'
      bbox.top -= 5
      bbox.left -= 20
      bbox.right += 20
      bbox.bottom += 10
    }

    if (running) setTimeout(detect, 100)
  }

  function tick() {
    if (!running) return
    else requestAnimationFrame(tick)

    if (bbox) {
      c.clearRect(0, 0, preview.width, preview.height)

      const width = bbox.right - bbox.left
      const height = bbox.bottom - bbox.top

      preview.height = height / (width / preview.width)

      c.drawImage(
        video,
        bbox.left, bbox.top, width, height,
        0, 0, preview.width, preview.height
      )
    }
  }
  function start() {
    running = true
    detect()
    tick()
  }
  function stop() {
    running = false
  }
  function snap() {
    stop()
    snapBtn.replaceWith(finalizeSelfie)
  }
  function redo() {
    finalizeSelfie.replaceWith(snapBtn)
    start()
  }
  async function done() {
    preview.toBlob(async img => {
      if (!img) return

      console.log('size', img?.size)

      const formData = new FormData()
      formData.append('image', img, 'eyes.webp')

      const res = await fetch(`${env.API_URL}/upload-eyes`, {
        method: 'POST',
        body: formData
      })

      try {
        const answer = await res.json()
        console.log('ANSWER', answer)
        finalizeSelfie.remove()
        // list eyes
      }
      catch (e) {
        console.log(e)
        console.log('Not ok:', res.status, await res.text())
        alert('Failed')
      }
    }, 'image/webp')
  }

  const snapBtn = <button onclick={snap}>
    <div class="text-3xl p-10 flex flex-row items-center justify-center w-full gap-2">
      take
      <span class="-mt-3 text-6xl">📷</span>
      selfie
    </div>
  </button>
  const redoBtn = <button onclick={redo} class="text-5xl p-10">🔄</button>
  const doneBtn = <button onclick={done} class="text-5xl p-10">✔️</button>
  const finalizeSelfie = <div class="flex flex-row items-center justify-center">{redoBtn}{doneBtn}</div>
  const takeSelfie = <div>{snapBtn}</div>
  const controls = <div></div>

  const prepareSelfie = <div class="flex flex-col items-center justify-center">{video}{preview}{controls}</div>
  return prepareSelfie
}
