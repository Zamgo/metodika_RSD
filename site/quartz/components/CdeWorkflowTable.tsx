import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/cinnosti.scss"
import fs from "node:fs"
import path from "node:path"
// @ts-ignore
import script from "./scripts/cinnosti.inline"

const CdeWorkflowTable: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const cs = cfg.locale.startsWith("cs")
  const basePath = path.resolve(process.cwd(), "..", "03 - CDE workflow.base")
  const baseText = fs.existsSync(basePath) ? fs.readFileSync(basePath, "utf8") : ""
  return (
    <div
      id="cde-workflow-browser"
      class="cinnosti-table-root"
      data-cinnosti-ls-id="cde-workflow"
      data-cinnosti-rows="workflow"
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
          <div class="cinnosti-filter">
            <label>
              <span>{cs ? "Pohled" : "View"}</span>
              <select class="cinnosti-view-select" aria-label={cs ? "Pohled" : "View"} />
            </label>
          </div>
        </div>
        <div class="cinnosti-toolbar-group cinnosti-toolbar-group-structure">
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
          <div class="cinnosti-group-actions" hidden>
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
      <script
        class="cinnosti-base-config"
        type="application/x-yaml"
        dangerouslySetInnerHTML={{ __html: baseText }}
      />
    </div>
  )
}

CdeWorkflowTable.afterDOMLoaded = script
CdeWorkflowTable.css = style

export default (() => CdeWorkflowTable) satisfies QuartzComponentConstructor
