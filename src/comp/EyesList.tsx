import { Signal } from 'signal-jsx'
import { isMobile } from 'utils'
import { env } from '../env.ts'

const WIDTH = 640
const HEIGHT = 480
const IS_MOBILE = isMobile()

export function EyesList() {
  using $ = Signal()

  const list = <div />

  async function fetchList() {
    const res = await fetch(`${env.API_URL}/list-eyes`)
    const json = await res.json() as string[]
    const items = json.map(b64 => {
      const img = new Image()
      img.src = `data:image/webp;base64,${b64}`
      return img
    })

    items.forEach(item => list.append(item))
  }

  fetchList()

  return list
}
