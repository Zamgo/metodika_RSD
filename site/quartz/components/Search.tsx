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

const FACET_DIMS = ["faze", "role", "workflow"] as const

export default ((userOpts?: Partial<SearchOptions>) => {
  const Search: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const opts = { ...defaultOptions, ...userOpts }
    const s = i18n(cfg.locale).components.search
    const searchPlaceholder = s.searchBarPlaceholder
    const cs = cfg.locale.startsWith("cs")
    const dimLabel: Record<string, string> = cs
      ? {
          faze: "Fáze",
          role: "Role",
          workflow: "Workflow",
        }
      : {
          faze: "Phase",
          role: "Role",
          workflow: "Workflow",
        }
    const panelTitle = cs ? "Hledání v metodice" : "Search the site"
    const closeLabel = cs ? "Zavřít" : "Close"
    const multiHint = cs
      ? "Filtrujte podle fáze, role nebo workflow. V každém poli stačí shoda s jednou z vybraných hodnot."
      : "Filter by phase, role or workflow. Within each field, a match with any selected value is sufficient."

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
          data-str-dd-placeholder={cs ? "Vyberte…" : "Choose…"}
          data-str-dd-n={cs ? "{n} vybráno" : "{n} selected"}
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
                <div class="search-facet-dd-grid">
                  {FACET_DIMS.map((dim) => {
                    const label = dimLabel[dim] ?? dim
                    return (
                      <div key={dim} class="search-facet-dd" data-dim={dim}>
                        <span class="search-facet-dd-caption" id={`search-dd-cap-${dim}`}>
                          {label}
                        </span>
                        <button
                          type="button"
                          class="search-facet-dd-trigger"
                          aria-expanded="false"
                          aria-haspopup="listbox"
                          aria-labelledby={`search-dd-cap-${dim} search-dd-val-${dim}`}
                        >
                          <span class="search-facet-dd-text" id={`search-dd-val-${dim}`} />
                          <span class="search-facet-dd-chevron" aria-hidden="true">
                            ▾
                          </span>
                        </button>
                        <div class="search-facet-dd-panel" hidden>
                          <div class="search-facet-dd-list" />
                        </div>
                      </div>
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
