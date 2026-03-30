import { Fragment } from "preact"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

type FrontmatterLike = Record<string, unknown>

type FieldDef = {
  key: string
  label: string
}

const FIELDS: FieldDef[] = [
  { key: "procesni_oblast", label: "Metadata procesní oblasti" },
  { key: "cinnost", label: "Činnost" },
  { key: "R - Odpovědnost za provádění činnosti", label: "R" },
  { key: "A - Právní odpovědnost za dokončení činnosti", label: "A" },
  { key: "C - Konzultace v průběhu činnosti", label: "C" },
  { key: "I - Informování po dokončení činnosti", label: "I" },
]

const ACTIVITY_TYPES = new Set(["cinnost", "dilci_cinnost", "raci_cinnost"])

function normalizeValue(v: unknown): string[] {
  if (v == null) return []
  if (Array.isArray(v)) {
    return v
      .flatMap((item) => normalizeValue(item))
      .map((item) => item.trim())
      .filter(Boolean)
  }
  const raw = String(v).trim()
  if (!raw) return []
  return [raw]
}

function prettifyItem(value: string): string {
  const wikiMatch = value.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/)
  if (!wikiMatch) return value
  const alias = (wikiMatch[2] ?? "").trim()
  if (alias) return alias
  const target = wikiMatch[1].split("#")[0]
  const segs = target.split("/")
  return (segs[segs.length - 1] ?? target).trim()
}

const MetadataPanel: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const fm = (fileData.frontmatter ?? {}) as FrontmatterLike
  const typ = String(fm.typ ?? "")
  const showAllFields = ACTIVITY_TYPES.has(typ)

  const rows = FIELDS.map(({ key, label }) => {
    const values = normalizeValue(fm[key]).map(prettifyItem)
    return { key, label, values }
  })

  const displayRows = showAllFields ? rows : rows.filter((row) => row.values.length > 0)

  if (displayRows.length === 0) return null

  return (
    <section class={classNames(displayClass, "metadata-panel")} data-metadata-panel>
      <div class="metadata-panel-header">
        <h2>Metadata</h2>
        <button
          type="button"
          class="metadata-panel-toggle"
          aria-expanded="true"
          aria-controls="metadata-panel-fields"
        >
          Skrýt
        </button>
      </div>
      <dl id="metadata-panel-fields" class="metadata-panel-body">
        {displayRows.map((row) => (
          <Fragment key={row.key}>
            <dt>{row.label}</dt>
            <dd>{row.values.length > 0 ? row.values.join(", ") : "—"}</dd>
          </Fragment>
        ))}
      </dl>
    </section>
  )
}

MetadataPanel.css = `
.metadata-panel {
  margin: 0.75rem 0 1rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  background: var(--light);
}

.metadata-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.metadata-panel h2 {
  font-size: 0.95rem;
  margin: 0;
}

.metadata-panel-toggle {
  flex-shrink: 0;
  font-size: 0.8rem;
  padding: 0.25rem 0.55rem;
  border: 1px solid var(--lightgray);
  border-radius: 6px;
  background: var(--light);
  color: var(--dark);
  cursor: pointer;
}

.metadata-panel-toggle:hover {
  background: var(--lightgray);
}

.metadata-panel-body[hidden] {
  display: none;
}

.metadata-panel dl {
  margin: 0;
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.35rem 0.75rem;
}

.metadata-panel dt {
  font-weight: 600;
  color: var(--darkgray);
}

.metadata-panel dd {
  margin: 0;
  color: var(--dark);
  word-break: break-word;
}
`

MetadataPanel.afterDOMLoaded = `
  document.querySelectorAll("[data-metadata-panel]").forEach((panel) => {
    const btn = panel.querySelector(".metadata-panel-toggle");
    const body = panel.querySelector(".metadata-panel-body");
    if (!btn || !body || !(btn instanceof HTMLButtonElement)) return;

    btn.addEventListener("click", () => {
      const nextHidden = !body.hidden;
      body.hidden = nextHidden;
      btn.setAttribute("aria-expanded", String(!nextHidden));
      btn.textContent = nextHidden ? "Zobrazit" : "Skrýt";
    });
  });
`

export default (() => MetadataPanel) satisfies QuartzComponentConstructor
