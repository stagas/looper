import { Theme } from 'daisyui'
import themes from 'daisyui/src/theming/themes'
import { $, storage } from 'signal-jsx'
import { Stem } from './comp/Main.tsx'

export interface Sorting {
  [K: string]: string[]
}

export interface CellEvent {
  x: number
  y: number
  stack: string
  stem: string
}

class AppState {
  name = 'App'
  theme = <Theme>'sunset' //storage<Theme>('coffee')
  get colors() { return themes[appState.theme] }
  sorting = storage<Sorting>({})
  cellEvents = storage<CellEvent[]>([])
}

export let appState = $(new AppState)

export function replaceAppState<T extends AppState>(newAppState: T) {
  appState = $(newAppState)
}
