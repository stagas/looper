import { Theme } from 'daisyui'
import themes from 'daisyui/src/theming/themes'
import { $, storage } from 'signal-jsx'

export interface Sorting {
  [K: string]: string[]
}

class AppState {
  name = 'App'
  theme = <Theme>'sunset' //storage<Theme>('coffee')
  sorting = storage<Sorting>({})
  get colors() {
    return themes[appState.theme]
  }
  pages = ['Page one', 'Page two']
  page = this.pages[0]
}

export let appState = $(new AppState)

export function replaceAppState<T extends AppState>(newAppState: T) {
  appState = $(newAppState)
}
