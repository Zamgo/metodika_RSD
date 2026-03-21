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
    const facetAllLabel = cs ? "Vše" : "All"
    const dimTyp = cs ? "Typ" : "Type"
    const dimStav = cs ? "Stav" : "Status"
    const dimVlastnik = cs ? "Vlastník" : "Owner"
    const shortcutHint = cs ? "Ctrl+K · # tagy" : "Ctrl+K · # tags"
    const panelTitle = cs ? "Hledání v metodice" : "Search the site"
    const closeLabel = cs ? "Zavřít panel" : "Close panel"
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
          <span class="search-button-hint">{shortcutHint}</span>
        </button>
        <div
          class="search-container"
          data-search-no-results-title={s.noResultsTitle}
          data-search-no-results-hint={s.noResultsHint}
          data-search-locale={cfg.locale}
          data-str-active-filters={cs ? "Aktivní filtry" : "Active filters"}
          data-str-clear-all={cs ? "Zrušit filtry" : "Clear filters"}
          data-str-add-filter={cs ? "Vybrat z metadat" : "Filter by metadata"}
          data-str-filter-hint={cs ? "Klikněte na hodnotu — u tagů platí současně všechny vybrané." : "Click values to filter — tags use AND; other fields use OR within the same group."}
          data-str-facet-all={facetAllLabel}
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
                <button type="button" class="search-filters-toggle" aria-expanded="false">
                  <span class="search-filters-toggle-text">{s.tagFilterToggle}</span>
                </button>
                <div class="search-filters-panel">
                  <p class="search-filters-hint" />
                  <div class="search-facet-scalars">
                    <label class="search-facet-scalar">
                      <span class="search-facet-scalar-label">{dimTyp}</span>
                      <select class="search-facet-select" data-dim="typ" aria-label={dimTyp}>
                        <option value="">{facetAllLabel}</option>
                      </select>
                    </label>
                    <label class="search-facet-scalar">
                      <span class="search-facet-scalar-label">{dimStav}</span>
                      <select class="search-facet-select" data-dim="stav" aria-label={dimStav}>
                        <option value="">{facetAllLabel}</option>
                      </select>
                    </label>
                    <label class="search-facet-scalar">
                      <span class="search-facet-scalar-label">{dimVlastnik}</span>
                      <select class="search-facet-select" data-dim="vlastnik" aria-label={dimVlastnik}>
                        <option value="">{facetAllLabel}</option>
                      </select>
                    </label>
                  </div>
                  <input
                    type="search"
                    class="search-facet-filter"
                    autocomplete="off"
                    placeholder={s.tagFilterPlaceholder}
                    aria-label={s.tagFilterPlaceholder}
                  />
                  <div class="search-facet-sections" />
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
