import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/cinnosti.scss"
import fs from "node:fs"
import path from "node:path"
// @ts-ignore
import script from "./scripts/cinnosti.inline"

type CinnostiTableOptions = {
  rootId?: string
  lsId?: string
  rowsDataset?: string
  roleFilterTerms?: string[]
}

/** Shared toolbar + table DOM používané jak Seznamem činností, tak per-role RACI tabulkou.
 *  Logika/state žije v scripts/cinnosti.inline.ts a pracuje přes class selectory
 *  a data-cinnosti-* atributy — umí tedy obsluhovat víc instancí najednou. */
export function renderCinnostiTableMarkup({
  cs,
  baseText,
  rootId = "cinnosti-browser",
  lsId = "cinnosti",
  rowsDataset = "oblasti",
  roleFilterTerms,
}: CinnostiTableOptions & { cs: boolean; baseText: string }) {
  const roleFilterAttr =
    roleFilterTerms && roleFilterTerms.length > 0
      ? JSON.stringify(roleFilterTerms)
      : undefined
  return (
    <div
      id={rootId}
      class="cinnosti-table-root"
      data-cinnosti-ls-id={lsId}
      data-cinnosti-rows={rowsDataset}
      data-cinnosti-role-filter={roleFilterAttr}
      data-str-view-all={cs ? "Vše" : "All"}
    >
      <div class="cinnosti-toolbar">
        <div class="cinnosti-toolbar-group cinnosti-toolbar-group-data">
          <input
            type="search"
            class="cinnosti-filter-text"
            placeholder={cs ? "Hledat v názvu…" : "Search title…"}
            autocomplete="off"
            aria-label={cs ? "Filtrovat podle názvu" : "Filter by title"}
          />
          <div class="cinnosti-filter cinnosti-view-filter cinnosti-inline-divider">
            <label>
              <span>{cs ? "Pohled" : "View"}</span>
              <select class="cinnosti-view-select" aria-label={cs ? "Pohled" : "View"} />
            </label>
            <div class="cinnosti-view-menu" data-cinnosti-views-ui>
              <button
                type="button"
                class="cinnosti-icon-btn cinnosti-view-menu-btn"
                aria-haspopup="menu"
                aria-expanded="false"
                title={cs ? "Akce pohledu" : "View actions"}
                aria-label={cs ? "Akce pohledu" : "View actions"}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="5" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="12" cy="19" r="1.8" />
                </svg>
              </button>
              <div class="cinnosti-view-menu-panel" role="menu">
                <button
                  type="button"
                  class="cinnosti-view-menu-item cinnosti-view-save-btn"
                  role="menuitem"
                  title={cs ? "Uložit aktuální stav jako pohled" : "Save current state as view"}
                >
                  {cs ? "Uložit jako nový pohled…" : "Save as new view…"}
                </button>
                <button
                  type="button"
                  class="cinnosti-view-menu-item cinnosti-view-reset-btn"
                  role="menuitem"
                  title={cs ? "Obnovit výchozí stav pohledu" : "Reset view to defaults"}
                >
                  {cs ? "Obnovit výchozí nastavení" : "Reset to defaults"}
                </button>
                <button
                  type="button"
                  class="cinnosti-view-menu-item cinnosti-view-share-btn"
                  role="menuitem"
                  title={cs ? "Zkopírovat odkaz s aktuálním stavem" : "Copy link with current state"}
                >
                  {cs ? "Sdílet odkaz na pohled" : "Copy share link"}
                </button>
                <hr />
                <button
                  type="button"
                  class="cinnosti-view-menu-item cinnosti-view-manage-btn"
                  role="menuitem"
                  title={cs ? "Spravovat pohledy" : "Manage views"}
                >
                  {cs ? "Spravovat pohledy…" : "Manage views…"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="cinnosti-toolbar-group cinnosti-toolbar-group-structure">
          <div class="cinnosti-column-toggle">
            <button
              type="button"
              class="cinnosti-column-toggle-btn"
              aria-haspopup="menu"
              aria-expanded="false"
            >
              <span>{cs ? "Sloupce" : "Columns"}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div class="cinnosti-column-toggle-panel" />
          </div>
          <div class="cinnosti-filter cinnosti-group-filter">
            <span class="cinnosti-group-filter-title">{cs ? "Seskupit podle" : "Group by"}</span>
            <div class="cinnosti-group-chain">
              <div class="cinnosti-group-chips" aria-live="polite" />
              <select
                class="cinnosti-group-add"
                aria-label={cs ? "Přidat úroveň seskupení" : "Add grouping level"}
              />
            </div>
          </div>
          <div class="cinnosti-group-actions cinnosti-inline-divider" hidden>
            <button
              type="button"
              class="cinnosti-icon-btn cinnosti-group-expand-all"
              title={cs ? "Rozbalit všechny skupiny" : "Expand all groups"}
              aria-label={cs ? "Rozbalit všechny skupiny" : "Expand all groups"}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="7 6 12 11 17 6" />
                <polyline points="7 13 12 18 17 13" />
              </svg>
            </button>
            <button
              type="button"
              class="cinnosti-icon-btn cinnosti-group-collapse-all"
              title={cs ? "Sbalit všechny skupiny" : "Collapse all groups"}
              aria-label={cs ? "Sbalit všechny skupiny" : "Collapse all groups"}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="7 11 12 6 17 11" />
                <polyline points="7 18 12 13 17 18" />
              </svg>
            </button>
          </div>
        </div>
        <div class="cinnosti-toolbar-group cinnosti-toolbar-group-state">
          <button type="button" class="cinnosti-clear-filters" hidden>
            <span class="cinnosti-clear-filters-label">
              {cs ? "Zrušit filtry" : "Clear filters"}
            </span>
            <span class="cinnosti-active-filter-count" />
          </button>
        </div>
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
      <div class="cinnosti-modal-root" data-cinnosti-modal-root />
      <div class="cinnosti-toast" data-cinnosti-toast role="status" aria-live="polite" />
      <script
        class="cinnosti-base-config"
        type="application/x-yaml"
        dangerouslySetInnerHTML={{ __html: baseText }}
      />
    </div>
  )
}

const CinnostiTable: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const cs = cfg.locale.startsWith("cs")
  const basePath = path.resolve(process.cwd(), "..", "02 - Seznam činností.base")
  const baseText = fs.existsSync(basePath) ? fs.readFileSync(basePath, "utf8") : ""
  return renderCinnostiTableMarkup({ cs, baseText })
}

CinnostiTable.afterDOMLoaded = script
CinnostiTable.css = style

export default (() => CinnostiTable) satisfies QuartzComponentConstructor
