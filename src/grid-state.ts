import { $ } from 'signal-jsx'
import { Stem } from './comp/Main.tsx'

export const gridState = $({
  stemBrush: null as null | Stem,
})
