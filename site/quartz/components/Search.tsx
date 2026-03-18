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
    return (
      <div class={classNames(displayClass, "search")}>
        <button class="search-button">
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
        >
          <div class="search-space">
            <div class="search-top-card">
              <input
                autocomplete="off"
                class="search-bar"
                name="search"
                type="text"
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
              />
              <div class="search-tag-panel">
                <button type="button" class="search-tag-toggle" aria-expanded="false">
                  {s.tagFilterToggle}
                </button>
                <div class="search-tag-panel-body">
                  <input
                    type="search"
                    class="search-tag-list-filter"
                    autocomplete="off"
                    placeholder={s.tagFilterPlaceholder}
                    aria-label={s.tagFilterPlaceholder}
                  />
                  <div class="search-tag-checkboxes" />
                  <button type="button" class="search-tag-clear">
                    {s.clearTagFilters}
                  </button>
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
