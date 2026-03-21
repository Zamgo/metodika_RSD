import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/search.scss"
// @ts-ignore
import script from "./scripts/search.inline"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

export interface SearchOptions {
  enablePreview: boolean
}

const defaultOptions: SearchOptions = {
  enablePreview: true,
}

const FACET_DIMS: readonly { dim: string; size: number }[] = [
  { dim: "typ", size: 4 },
  { dim: "stav", size: 4 },
  { dim: "vlastnik", size: 4 },
  { dim: "faze", size: 5 },
  { dim: "role", size: 5 },
  { dim: "cinnosti", size: 5 },
  { dim: "workflow", size: 5 },
  { dim: "temata", size: 5 },
  { dim: "tags", size: 8 },
]

export default ((userOpts?: Partial<SearchOptions>) => {
  const Search: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const opts = { ...defaultOptions, ...userOpts }
    const s = i18n(cfg.locale).components.search
    const searchPlaceholder = s.searchBarPlaceholder
    const cs = cfg.locale.startsWith("cs")
    const dimLabel: Record<string, string> = cs
      ? {
          typ: "Typ",
          stav: "Stav",
          vlastnik: "Vlastník",
          faze: "Fáze",
          role: "Role",
          cinnosti: "Činnosti",
          workflow: "Workflow",
          temata: "Témata",
          tags: "Tagy",
        }
      : {
          typ: "Type",
          stav: "Status",
          vlastnik: "Owner",
          faze: "Phase",
          role: "Role",
          cinnosti: "Activities",
          workflow: "Workflow",
          temata: "Topics",
          tags: "Tags",
        }
    const panelTitle = cs ? "Hledání v metodice" : "Search the site"
    const closeLabel = cs ? "Zavřít" : "Close"
    const multiHint = cs
      ? "U každého pole můžete vybrat více položek: Ctrl+klik (Windows) nebo ⌘+klik (Mac). U tagů musí stránka mít všechny vybrané; u ostatních polí stačí jedna z vybraných hodnot."
      : "Select multiple values with Ctrl+click (Windows) or ⌘+click (Mac). Tags use AND; other fields use OR within the same group."

    return (
      <div class={classNames(displayClass, "search")}>
        <button class="search-button" type="button">
          <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.9 19.7">
            <title>Search</title>
            <g class="search-path" fill="none">
              <path stroke-linecap="square" d="M18.5 18.3l-5.4-5.4" />
              <circle cx="8" cy="8" r="7" />
            </g>
          </svg>
          <p>{s.title}</p>
        </button>
        <div
          class="search-container"
          data-search-no-results-title={s.noResultsTitle}
          data-search-no-results-hint={s.noResultsHint}
          data-search-locale={cfg.locale}
          data-str-active-filters={cs ? "Aktivní filtry" : "Active filters"}
          data-str-clear-all={cs ? "Zrušit filtry" : "Clear filters"}
        >
          <div class="search-space">
            <div class="search-top-card">
              <div class="search-panel-toolbar">
                <span class="search-panel-toolbar-title">{panelTitle}</span>
                <button type="button" class="search-panel-close" aria-label={closeLabel}>
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <input
                autocomplete="off"
                class="search-bar"
                name="search"
                type="text"
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
              />
              <div class="search-filters-ui">
                <div class="search-active-filters-wrap" hidden>
                  <span class="search-active-filters-label" />
                  <div class="search-active-filters" />
                  <button type="button" class="search-clear-all-filters">
                    {s.clearTagFilters}
                  </button>
                </div>
                <p class="search-facet-multi-hint">{multiHint}</p>
                <div class="search-facet-multis">
                  {FACET_DIMS.map(({ dim, size }) => {
                    const label = dimLabel[dim] ?? dim
                    return (
                      <label key={dim} class="search-facet-multi-wrap">
                        <span class="search-facet-multi-label">{label}</span>
                        <select
                          multiple
                          class="search-facet-multi"
                          data-dim={dim}
                          size={size}
                          aria-label={label}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
            <div class="search-layout" data-preview={opts.enablePreview}></div>
          </div>
        </div>
      </div>
    )
  }

  Search.afterDOMLoaded = script
  Search.css = style

  return Search
}) satisfies QuartzComponentConstructor
