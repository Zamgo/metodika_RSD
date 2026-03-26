import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/cinnosti.scss"
import fs from "node:fs"
import path from "node:path"
// @ts-ignore
import script from "./scripts/cinnosti.inline"

const CinnostiTable: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const cs = cfg.locale.startsWith("cs")
  const basePath = path.resolve(
    process.cwd(),
    "..",
    "02_Oblasti správy informací",
    "0 - Seznam činností.base",
  )
  const baseText = fs.existsSync(basePath) ? fs.readFileSync(basePath, "utf8") : ""
  return (
    <div
      id="cinnosti-browser"
      data-str-typ={cs ? "Typ stránky" : "Page type"}
      data-str-zdroj-typ={cs ? "Typ zdroje" : "Source type"}
      data-str-faze={cs ? "Fáze" : "Phase"}
      data-str-role={cs ? "Role" : "Role"}
      data-str-view={cs ? "Pohled" : "View"}
      data-str-view-all={cs ? "Vše" : "All"}
      data-str-columns={cs ? "Sloupce" : "Columns"}
      data-str-wide-on={cs ? "Zúžit" : "Narrow"}
      data-str-wide-off={cs ? "Rozšířit" : "Expand"}
    >
      <div class="cinnosti-toolbar">
        <input
          type="search"
          class="cinnosti-filter-text"
          placeholder={cs ? "Hledat v názvu…" : "Search title…"}
          autocomplete="off"
          aria-label={cs ? "Filtrovat podle názvu" : "Filter by title"}
        />
        <div class="cinnosti-filter">
          <label>
            <span>{cs ? "Pohled" : "View"}</span>
            <select class="cinnosti-view-select" aria-label={cs ? "Pohled" : "View"} />
          </label>
        </div>
        <div class="cinnosti-filter" data-dim="typ">
          <label>
            <span>{cs ? "Typ" : "Type"}</span>
            <select aria-label={cs ? "Typ stránky" : "Page type"} />
          </label>
        </div>
        <div class="cinnosti-filter" data-dim="zdroj_typ">
          <label>
            <span>{cs ? "Zdroj (typ)" : "Source (type)"}</span>
            <select aria-label={cs ? "Typ zdroje" : "Source type"} />
          </label>
        </div>
        <div class="cinnosti-filter" data-dim="faze">
          <label>
            <span>{cs ? "Fáze" : "Phase"}</span>
            <select aria-label={cs ? "Fáze" : "Phase"} />
          </label>
        </div>
        <div class="cinnosti-filter" data-dim="role">
          <label>
            <span>{cs ? "Role" : "Role"}</span>
            <select aria-label={cs ? "Role" : "Role"} />
          </label>
        </div>
        <div class="cinnosti-column-toggle">
          <button type="button" class="cinnosti-column-toggle-btn">
            {cs ? "Sloupce" : "Columns"}
          </button>
          <div class="cinnosti-column-toggle-panel" />
        </div>
        <button
          type="button"
          class="cinnosti-wide-toggle"
          data-label-on={cs ? "Zúžit" : "Narrow"}
          data-label-off={cs ? "Rozšířit" : "Expand"}
        >
          {cs ? "Rozšířit" : "Expand"}
        </button>
        <button type="button" class="cinnosti-clear-filters">
          {cs ? "Zrušit filtry" : "Clear filters"}
        </button>
      </div>
      <p class="cinnosti-meta">
        {cs ? "Zobrazeno řádků: " : "Rows: "}
        <strong class="cinnosti-count">0</strong>
      </p>
      <div class="cinnosti-table-scroll">
        <table class="cinnosti-table">
          <thead>
            <tr class="cinnosti-head-row" />
          </thead>
          <tbody class="cinnosti-tbody" />
        </table>
      </div>
      <script class="cinnosti-base-config" type="application/x-yaml">
        {baseText}
      </script>
    </div>
  )
}

CinnostiTable.afterDOMLoaded = script
CinnostiTable.css = style

export default (() => CinnostiTable) satisfies QuartzComponentConstructor
