import { Theme } from 'daisyui'
import themes from 'daisyui/src/theming/themes'
import { appState } from '../app-state.ts'

export function ThemePicker() {
  return <div class="dropdown bg-none h-full">
    <button tabindex="0" role="button" class="m-0 p-3 hover:text-white hover:bg-base-100 focus:ring-1 focus:ring-accent text-primary">
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
        fill="none"
        height="18"
        viewBox="0 0 18 15">
        <circle stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" cx="8" cy="8" r="6" />
      </svg>
    </button>
    <ul tabindex="0" class="dropdown-content z-[1] bg-base-300 menu menu-s p-2 shadow grid-rows-8 grid grid-cols-4 w-[400px] right-0">
      {Object.keys(themes).map(theme =>
        <li><a
          class={() => [
            "hover:bg-base-100 hover:text-primary",
            appState.theme === theme && "bg-base-100 text-primary"
          ]}
          onclick={() => appState.theme = theme as Theme}
        >{theme}</a></li>
      )}
    </ul>
  </div>
}
