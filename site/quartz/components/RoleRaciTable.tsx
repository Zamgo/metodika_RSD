import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/cinnosti.scss"
import fs from "node:fs"
import path from "node:path"
// @ts-ignore
import script from "./scripts/cinnosti.inline"
import { renderCinnostiTableMarkup } from "./CinnostiTable"

function coerceStringArray(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value.flatMap(coerceStringArray).filter(Boolean)
  }
  const raw = String(value).trim()
  if (!raw) return []
  return [raw]
}

function buildRoleFilterTerms(fm: Record<string, unknown>): string[] {
  const title = typeof fm.title === "string" ? fm.title.trim() : ""
  const aliases = coerceStringArray(fm.aliases)
  const terms = [title, ...aliases].filter(Boolean)
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of terms) {
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

const RoleRaciTable: QuartzComponent = ({ cfg, fileData }: QuartzComponentProps) => {
  const cs = cfg.locale.startsWith("cs")
  const basePath = path.resolve(
    process.cwd(),
    "..",
    "05_Knihovna průvodce",
    "Role",
    "_Role - RACI.base",
  )
  const baseText = fs.existsSync(basePath) ? fs.readFileSync(basePath, "utf8") : ""
  const fm = (fileData.frontmatter ?? {}) as Record<string, unknown>
  const roleFilterTerms = buildRoleFilterTerms(fm)
  const lsId = `role:${fileData.slug ?? "unknown"}`

  return (
    <section class="role-raci-section" aria-labelledby="role-raci-title">
      <h2 id="role-raci-title" class="role-raci-title">
        {cs ? "Činnosti této role (RACI)" : "Activities of this role (RACI)"}
      </h2>
      <p class="role-raci-hint">
        {cs
          ? "Úkoly, kde je tato role uvedena ve sloupcích R nebo A. Filtry, pohledy i seskupení fungují stejně jako v Seznamu činností."
          : "Activities where this role appears in the R or A column. Filters, views and grouping work the same as on the full list."}
      </p>
      {renderCinnostiTableMarkup({
        cs,
        baseText,
        rootId: "role-raci-browser",
        lsId,
        rowsDataset: "oblasti",
        roleFilterTerms,
      })}
    </section>
  )
}

RoleRaciTable.afterDOMLoaded = script
RoleRaciTable.css =
  style +
  `
.role-raci-section {
  margin-top: 2rem;
}
.role-raci-title {
  font-size: 1.15rem;
  margin: 0 0 0.35rem;
}
.role-raci-hint {
  margin: 0 0 1rem;
  color: var(--darkgray);
  font-size: 0.92rem;
}
`

export default (() => RoleRaciTable) satisfies QuartzComponentConstructor
