import { Signal } from 'signal-jsx'
import { Point, chain, clamp, isMobile, on } from 'utils'
import { Logo } from './Logo.tsx'

const WIDTH = 640
const HEIGHT = 480
const IS_MOBILE = isMobile()

export function Snap() {
  using $ = Signal()

  const debug = <div class="
    fixed
    top-0
    left-0
    whitespace-pre-line
    -z-1
    pointer-events-none
  " />
  document.body.append(debug)

  const video = <video class="
    hidden
    bg-black
  " /> as HTMLVideoElement

  const preview = <canvas
    width={visualViewport?.width ?? window.innerWidth}
    height={visualViewport?.height ?? window.innerHeight}
    class="
      w-full
      bg-black
    "
  /> as HTMLCanvasElement

  const c = preview.getContext('2d')!

  let startDist = 0
  let startScale = 1
  let currScale = 2
  let currTranslate = { x: 0, y: 0 }
  let initTranslate = { x: 0, y: 0 }
  let initFinger = { x: 0, y: 0 }

  function getDistance(touches: any) {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.hypot(dx, dy)
  }

  function getFingerPosition(touch: any) {
    const rect = preview.getBoundingClientRect()
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }

  let running = false
  let offListeners: any

  const FRAME_TOP = 80
  const FRAME_HEIGHT = 180

  const frameBottom = FRAME_TOP + FRAME_HEIGHT

  function drawImage() {
    // const minScale = preview.width / (video.videoWidth || preview.width)
    // currScale = Math.max(minScale, currScale)
    // currTranslate.x = clamp(0, preview.width, currTranslate.x)
    // currTranslate.x = clamp(currScale * currTranslate.x
    // c.clearRect(0, 0, preview.width, preview.height)
    c.save()
    c.translate(currTranslate.x, currTranslate.y)
    c.scale(currScale, currScale)
    c.drawImage(video, 0, 0)
    c.restore()

    c.fillStyle = '#026b'
    c.fillRect(0, 0, preview.width, FRAME_TOP)
    c.fillRect(0, frameBottom, preview.width, preview.height - frameBottom)
    c.beginPath()
    c.moveTo(0, FRAME_TOP)
    c.lineTo(preview.width, FRAME_TOP)
    c.moveTo(0, frameBottom)
    c.lineTo(preview.width, frameBottom)
    c.strokeStyle = '#08f'
    c.lineWidth = 2
    c.stroke()
  }

  function tick() {
    if (running) requestAnimationFrame(tick)
    drawImage()
  }

  function stop() {
    running = false
    offListeners()
  }

  function start() {
    running = true

    offListeners = IS_MOBILE ? chain(
      on(window, 'touchstart', e => {
        if (e.touches.length === 2) {
          startDist = getDistance(e.touches)

          const f1 = getFingerPosition(e.touches[0])
          const f2 = getFingerPosition(e.touches[1])

          initFinger = {
            x: (f1.x + f2.x) / 2,
            y: (f1.y + f2.y) / 2
          }

          initTranslate = { ...currTranslate }
          currScale = startScale
        }
        else if (e.touches.length === 1) {
          initFinger = getFingerPosition(e.touches[0])
          initTranslate = { ...currTranslate }
        }
        e.preventDefault()
      }),

      on(window, 'touchmove', e => {
        if (e.touches.length === 2) {
          const dist = getDistance(e.touches)
          const scaleChange = dist / startDist

          currScale = startScale * scaleChange

          const f1 = getFingerPosition(e.touches[0])
          const f2 = getFingerPosition(e.touches[1])

          currTranslate = {
            x: (f1.x + f2.x) / 2
              - initFinger.x * scaleChange
              + initTranslate.x * scaleChange,
            y: (f1.y + f2.y) / 2
              - initFinger.y * scaleChange
              + initTranslate.y * scaleChange
          }
        }
        else if (e.touches.length === 1) {
          const f = getFingerPosition(e.touches[0])

          currTranslate = {
            x: f.x - initFinger.x + initTranslate.x,
            y: f.y - initFinger.y + initTranslate.y
          }
        }

        e.preventDefault()
      }),

      on(window, 'touchend', e => {
        if (e.touches.length === 1) {
          startScale = currScale
          initTranslate = { ...currTranslate }
          initFinger = getFingerPosition(e.touches[0])
        }
      }),
    ) : chain(
      on(window, 'mousedown', e => {
        // const matrix = new DOMMatrix()
        // currScale = clamp(0.5, 10, currScale + e.deltaY * 0.003)
        // matrix
        //   .translateSelf(currTranslate.x, currTranslate.y)
        //   .translateSelf(e.pageX, e.pageY)
        //   .scaleSelf(currScale, currScale)
        //   .translateSelf(-e.pageX, -e.pageY)
        const initMouse = {
          x: e.pageX, // * currScale, //* currScale, // + currTranslate.x,// * currScale,
          y: e.pageY, // * currScale, // * currScale, // + currTranslate.y,// * currScale
        }
        const off = on(window, 'mousemove', e => {
          // const matrix = new DOMMatrix()
          // matrix
          //   .translateSelf(currTranslate.x, currTranslate.y)
          //   .translateSelf(
          //     e.pageX - initMouse.x, // + initTranslate.x,
          //     e.pageY - initMouse.y, // + initTranslate.y
          //   )
          //   .scaleSelf(currScale, currScale)

          // initMouse.x

          currTranslate = {
            x: e.pageX - initMouse.x + initTranslate.x, ///currScale, // / currScale, //- initMouse.x + initTranslate.x * currScale,
            y: e.pageY - initMouse.y + initTranslate.y, ///currScale, // / currScale, //- initMouse.y + initTranslate.y * currScale,
          }
        })
        on(window, 'mouseup', () => {
          off()
          initTranslate = { ...currTranslate }
        }, { once: true })
      }),
      on(window, 'wheel', e => {
        const matrix = new DOMMatrix()
        currScale = clamp(0.5, 10, currScale + e.deltaY * 0.003)
        matrix
          .translateSelf(e.pageX, e.pageY)
          .scaleSelf(currScale, currScale)
          // .translateSelf(currTranslate.x, currTranslate.y)
          .translateSelf(-e.pageX, -e.pageY)
        currScale = matrix.a
        currTranslate.x = matrix.e // currScale
        currTranslate.y = matrix.f // currScale
      }),
    )

    tick()
  }

  async function beginPreview(e: MouseEvent) {
    takeSelfie.replaceWith(takingSelfie)

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: WIDTH,
        height: HEIGHT,
        facingMode: { ideal: 'user' },
      },
      audio: false
    })

    video.srcObject = stream
    video.play()

    start()
  }

  function snap() {
    stop()
    snapBtn.replaceWith(finalizeSelfie)
  }

  function redo() {
    start()
    finalizeSelfie.replaceWith(snapBtn)
  }

  function done() {
    //
  }

  const snapBtn = <button onclick={snap} class="text-5xl p-4">📷</button>
  const redoBtn = <button onclick={redo} class="text-5xl p-4">🔄</button>
  const doneBtn = <button onclick={done} class="text-5xl p-4">✔️</button>
  const finalizeSelfie = <div class="flex flex-row items-center justify-center">{redoBtn}{doneBtn}</div>
  const takingSelfie = <div class="flex flex-col">{video}{preview}{snapBtn}</div>
  const takeSelfie = <div class="flex flex-col items-center justify-center h-full gap-4">
    <Logo />
    <button
      onclick={beginPreview}
      class="
        bg-slate-700
        p-0
        pl-5
        pr-5
        flex
        items-center
        rounded-lg
      ">
      <span class="text-lg font-mono">take</span>
      <span class="text-3xl p-2 pb-4">📷</span>
      <span class="text-lg font-mono">selfie</span>
    </button>
  </div>

  $.fx(() => () => {
    running = false
    debug.remove()
    takeSelfie.remove()
    takingSelfie.remove()
  })

  return takeSelfie
}
