import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/cinnosti.scss"
// @ts-ignore
import script from "./scripts/cinnosti.inline"

const CinnostiTable: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const cs = cfg.locale.startsWith("cs")
  return (
    <div
      id="cinnosti-browser"
      data-str-typ={cs ? "Typ stránky" : "Page type"}
      data-str-zdroj-typ={cs ? "Typ zdroje" : "Source type"}
      data-str-faze={cs ? "Fáze" : "Phase"}
      data-str-role={cs ? "Role" : "Role"}
    >
      <div class="cinnosti-toolbar">
        <input
          type="search"
          class="cinnosti-filter-text"
          placeholder={cs ? "Hledat v názvu…" : "Search title…"}
          autocomplete="off"
          aria-label={cs ? "Filtrovat podle názvu" : "Filter by title"}
        />
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
            <tr>
              <th>{cs ? "Činnost" : "Activity"}</th>
              <th>ID</th>
              <th>{cs ? "Typ" : "Type"}</th>
              <th>{cs ? "Typ zdroje" : "Src type"}</th>
              <th>{cs ? "Zdroj" : "Source"}</th>
              <th>{cs ? "Fáze" : "Phase"}</th>
              <th>{cs ? "Role" : "Role"}</th>
              <th>R (Obj.)</th>
              <th>R (Ved.)</th>
              <th>R (Pod.)</th>
              <th>SpSt</th>
              <th>BIM k.</th>
              <th>{cs ? "Stav" : "Status"}</th>
            </tr>
          </thead>
          <tbody class="cinnosti-tbody" />
        </table>
      </div>
    </div>
  )
}

CinnostiTable.afterDOMLoaded = script
CinnostiTable.css = style

export default (() => CinnostiTable) satisfies QuartzComponentConstructor
