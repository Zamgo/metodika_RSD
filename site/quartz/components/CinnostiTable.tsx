import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/cinnosti.scss"
import fs from "node:fs"
import path from "node:path"
// @ts-ignore
import script from "./scripts/cinnosti.inline"

const CinnostiTable: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const cs = cfg.locale.startsWith("cs")
  const basePath = path.resolve(process.cwd(), "..", "02 - Seznam činností.base")
  const baseText = fs.existsSync(basePath) ? fs.readFileSync(basePath, "utf8") : ""
  return (
    <div
      id="cinnosti-browser"
      class="cinnosti-table-root"
      data-cinnosti-ls-id="cinnosti"
      data-cinnosti-rows="oblasti"
      data-str-view-all={cs ? "Vše" : "All"}
    >
      <div class="cinnosti-toolbar">
        <input
          type="search"
          class="cinnosti-filter-text"
          placeholder={cs ? "Hledat v názvu…" : "Search title…"}
          autocomplete="off"
          aria-label={cs ? "Filtrovat podle názvu" : "Filter by title"}
        />
        <div class="cinnosti-filter cinnosti-view-filter">
          <label>
            <span>{cs ? "Pohled" : "View"}</span>
            <select class="cinnosti-view-select" aria-label={cs ? "Pohled" : "View"} />
          </label>
          <div class="cinnosti-view-actions" data-cinnosti-views-ui>
            <button
              type="button"
              class="cinnosti-view-action-btn cinnosti-view-save-btn"
              title={cs ? "Uložit aktuální stav jako pohled" : "Save current state as view"}
              aria-label={cs ? "Uložit jako pohled" : "Save as view"}
            >
              {cs ? "Uložit jako…" : "Save as…"}
            </button>
            <button
              type="button"
              class="cinnosti-view-action-btn cinnosti-view-reset-btn"
              title={cs ? "Obnovit výchozí stav pohledu" : "Reset view to defaults"}
              aria-label={cs ? "Obnovit výchozí" : "Reset defaults"}
            >
              {cs ? "Obnovit" : "Reset"}
            </button>
            <button
              type="button"
              class="cinnosti-view-action-btn cinnosti-view-share-btn"
              title={cs ? "Zkopírovat odkaz s aktuálním stavem" : "Copy link with current state"}
              aria-label={cs ? "Sdílet odkaz" : "Copy share link"}
            >
              {cs ? "Sdílet" : "Share"}
            </button>
            <button
              type="button"
              class="cinnosti-view-action-btn cinnosti-view-manage-btn"
              title={cs ? "Spravovat pohledy" : "Manage views"}
              aria-label={cs ? "Spravovat pohledy" : "Manage views"}
            >
              {cs ? "Spravovat…" : "Manage…"}
            </button>
          </div>
        </div>
        <div class="cinnosti-column-toggle">
          <button type="button" class="cinnosti-column-toggle-btn">
            {cs ? "Sloupce" : "Columns"}
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
        <div class="cinnosti-group-actions">
          <button
            type="button"
            class="cinnosti-group-expand-all"
            title={cs ? "Rozbalit všechny skupiny" : "Expand all groups"}
          >
            {cs ? "Rozbalit vše" : "Expand all"}
          </button>
          <button
            type="button"
            class="cinnosti-group-collapse-all"
            title={cs ? "Sbalit všechny skupiny" : "Collapse all groups"}
          >
            {cs ? "Sbalit vše" : "Collapse all"}
          </button>
        </div>
        <button type="button" class="cinnosti-clear-filters">
          {cs ? "Zrušit filtry" : "Clear filters"}
        </button>
        <span class="cinnosti-active-filter-count" />
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

CinnostiTable.afterDOMLoaded = script
CinnostiTable.css = style

export default (() => CinnostiTable) satisfies QuartzComponentConstructor
