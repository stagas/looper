import { cleanup, fx, hmr, mount } from 'signal-jsx'
import { appState, replaceAppState } from './app-state.ts'
import { Main } from './comp/Main.tsx'

export const start = mount('#container', target => {
  return fx(() => {
    target.replaceChildren(<div class="h-full w-full"><Main /></div>)
    return cleanup
  })
})

if (import.meta.hot) {
  import.meta.hot.accept(hmr(start, appState, replaceAppState))
}
else {
  start()
}
