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

export default ((userOpts?: Partial<SearchOptions>) => {
  const Search: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const opts = { ...defaultOptions, ...userOpts }
    const s = i18n(cfg.locale).components.search
    const searchPlaceholder = s.searchBarPlaceholder
    const cs = cfg.locale.startsWith("cs")
    const panelTitle = cs ? "Hledání v metodice" : "Search the site"
    const closeLabel = cs ? "Zavřít" : "Close"

    return (
      <div class={classNames(displayClass, "search")}>
        <button class="search-button" type="button" data-search-trigger>
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
