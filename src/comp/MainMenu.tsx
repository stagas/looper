import { appState } from '../app-state.ts'

export function MainMenu() {
  return <div class="dropdown bg-none h-full">
    <button tabindex="0" role="button" class="m-0 p-3 hover:text-white hover:bg-base-100 focus:ring-1 focus:ring-accent">
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
        height="16"
        viewBox="0 -1 17 15">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M1 1h15M1 7h15M1 13h15" />
      </svg>
    </button>
    <ul tabindex="0" class="dropdown-content z-[1] bg-base-300 menu p-2 shadow w-52 right-0">
      {appState.pages.map(page =>
        <li><a class={() => `hover:bg-base-100 hover:text-primary ${appState.page === page ? "bg-base-100 text-primary" : ""}`}
          onclick={() => appState.page = page}
        >{page}</a></li>
      )}
    </ul>
  </div>
}
