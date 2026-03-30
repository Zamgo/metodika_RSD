import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

type FrontmatterLike = Record<string, unknown>

type FieldDef = {
  key: string
  label: string
}

const FIELDS: FieldDef[] = [
  { key: "procesni_oblast", label: "Procesní oblast" },
  { key: "pracovni_balicek", label: "Pracovní balíček" },
  { key: "R - Odpovědnost za provádění činnosti", label: "R" },
  { key: "A - Právní odpovědnost za dokončení činnosti", label: "A" },
  { key: "C - Konzultace v průběhu činnosti", label: "C" },
  { key: "I - Informování po dokončení činnosti", label: "I" },
]

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
  const rows = FIELDS.map(({ key, label }) => {
    const values = normalizeValue(fm[key]).map(prettifyItem)
    return { label, values }
  }).filter((row) => row.values.length > 0)

  if (rows.length === 0) return null

  return (
    <section class={classNames(displayClass, "metadata-panel")}>
      <h2>Metadata</h2>
      <dl>
        {rows.map((row) => (
          <>
            <dt>{row.label}</dt>
            <dd>{row.values.join(", ")}</dd>
          </>
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

.metadata-panel h2 {
  font-size: 0.95rem;
  margin: 0 0 0.6rem;
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

export default (() => MetadataPanel) satisfies QuartzComponentConstructor
