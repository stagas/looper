import { cleanup, fx, hmr, mount } from 'signal-jsx'
import { appState, replaceAppState } from './app-state.ts'
import { Main } from './comp/Main.tsx'
import seq from 'assembly-seq'

export const start = mount('#container', target => {
  return fx(() => {
    target.replaceChildren(
      <div
        data-theme={() => appState.theme}
        class="h-full w-full flex flex-col items-center justify-center"
      >
        <Main />
      </div>
    )
    return cleanup
  })
})

if (import.meta.hot) {
  import.meta.hot.accept(hmr(start, appState, replaceAppState))
}
else {
  start()
}
