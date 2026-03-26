import { FullSlug, resolveRelative } from "../../util/path"
import { load as yamlLoad } from "js-yaml"
import {
  CinnostiIndex,
  getMetaArray,
  getMetaString,
  isCinnostRow,
  sortKeyForRow,
} from "./cinnostiShared"

const FILTER_DIMS = ["zdroj_typ", "typ"] as const
const ARRAY_DIMS = ["faze", "role"] as const

type BaseConfig = {
  properties?: Record<string, { displayName?: string }>
  views?: {
    name?: string
    filters?: { and?: string[]; or?: string[] }
    order?: string[]
  }[]
}

type BaseView = NonNullable<BaseConfig["views"]>[number]

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function prettyLabel(key: string): string {
  if (key === "file.name") return "Činnost"
  return key
}

function readBaseConfig(root: HTMLElement): BaseConfig {
  const script = root.querySelector(".cinnosti-base-config") as HTMLScriptElement | null
  const raw = script?.textContent?.trim() ?? ""
  if (!raw) return {}
  try {
    const parsed = yamlLoad(raw)
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as BaseConfig
  } catch {
    return {}
  }
}

function exprMatches(meta: Record<string, unknown> | undefined, expr: string): boolean {
  const s = expr.trim()
  const eq = s.match(/^(.+?)\s*==\s*"([^"]*)"$/)
  if (eq) return getMetaString(meta, eq[1].trim()) === eq[2]
  const neq = s.match(/^(.+?)\s*!=\s*"([^"]*)"$/)
  if (neq) return getMetaString(meta, neq[1].trim()) !== neq[2]
  return true
}

function rowMatchesViewFilters(
  meta: Record<string, unknown> | undefined,
  view?: BaseView,
): boolean {
  if (!view?.filters) return true
  const andExpr = Array.isArray(view.filters.and) ? view.filters.and : []
  const orExpr = Array.isArray(view.filters.or) ? view.filters.or : []
  if (andExpr.length > 0 && !andExpr.every((expr) => exprMatches(meta, expr))) return false
  if (orExpr.length > 0 && !orExpr.some((expr) => exprMatches(meta, expr))) return false
  return true
}

function rowMatchesFilters(
  meta: Record<string, unknown> | undefined,
  textQ: string,
  selected: Map<string, Set<string>>,
  title: string,
  view?: BaseView,
): boolean {
  const tq = textQ.trim().toLowerCase()
  if (tq && !title.toLowerCase().includes(tq)) return false
  if (!rowMatchesViewFilters(meta, view)) return false

  for (const dim of FILTER_DIMS) {
    const want = selected.get(dim)
    if (!want || want.size === 0) continue
    const val = getMetaString(meta, dim)
    if (!want.has(val)) return false
  }

  for (const dim of ARRAY_DIMS) {
    const want = selected.get(dim)
    if (!want || want.size === 0) continue
    const vals = getMetaArray(meta, dim)
    if (![...want].some((w) => vals.includes(w))) return false
  }

  return true
}

function collectOptions(data: CinnostiIndex): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>()
  for (const dim of [...FILTER_DIMS, ...ARRAY_DIMS]) out.set(dim, new Set())

  for (const details of Object.values(data)) {
    if (!isCinnostRow(details.filePath)) continue
    const meta = details.meta as Record<string, unknown> | undefined
    if (!meta) continue
    for (const dim of FILTER_DIMS) {
      const v = getMetaString(meta, dim)
      if (v) out.get(dim)!.add(v)
    }
    for (const dim of ARRAY_DIMS) {
      for (const v of getMetaArray(meta, dim)) {
        out.get(dim)!.add(v)
      }
    }
  }
  return out
}

async function setupCinnosti(root: HTMLElement, currentSlug: FullSlug, data: CinnostiIndex) {
  const headRow = root.querySelector(".cinnosti-head-row") as HTMLElement
  const tbody = root.querySelector(".cinnosti-tbody") as HTMLElement
  const textInput = root.querySelector(".cinnosti-filter-text") as HTMLInputElement
  const viewSelect = root.querySelector(".cinnosti-view-select") as HTMLSelectElement
  const countEl = root.querySelector(".cinnosti-count") as HTMLElement
  const clearBtn = root.querySelector(".cinnosti-clear-filters") as HTMLButtonElement
  if (!headRow || !tbody || !textInput || !countEl || !viewSelect) return

  const rows: { slug: FullSlug; title: string; fp: string; meta?: Record<string, unknown> }[] = []
  for (const [slug, details] of Object.entries(data)) {
    if (!isCinnostRow(details.filePath)) continue
    rows.push({
      slug: slug as FullSlug,
      title: details.title ?? slug,
      fp: details.filePath,
      meta: details.meta as Record<string, unknown> | undefined,
    })
  }

  rows.sort((a, b) => {
    const ka = sortKeyForRow(a.meta, a.title)
    const kb = sortKeyForRow(b.meta, b.title)
    if (ka !== kb) return ka.localeCompare(kb, undefined, { numeric: true })
    return a.title.localeCompare(b.title, "cs")
  })

  const options = collectOptions(data)
  const selected = new Map<string, Set<string>>()
  for (const dim of [...FILTER_DIMS, ...ARRAY_DIMS]) selected.set(dim, new Set())

  const ds = root.dataset
  const baseConfig = readBaseConfig(root)
  const allViews = Array.isArray(baseConfig.views) ? baseConfig.views.filter((v) => !!v?.name) : []
  const fallbackView: BaseView = {
    name: ds.strViewAll ?? "Vše",
    order: [
      "file.name",
      "oznaceni",
      "typ",
      "zdroj_typ",
      "zdroj",
      "faze",
      "role",
      "raci_poverejici",
      "raci_vedouci_poverena",
      "raci_poverena",
      "raci_spravce_stavby",
      "raci_bim_koordinator",
      "stav",
    ],
  }
  const views = allViews.length > 0 ? allViews : [fallbackView]
  let activeViewIdx = 0

  const getColumnsForView = (view?: BaseView): string[] => {
    const cols = Array.isArray(view?.order) ? view!.order!.filter(Boolean) : []
    return cols.length > 0 ? cols : fallbackView.order!
  }

  function resolveUrl(slug: FullSlug): string {
    return new URL(resolveRelative(currentSlug, slug), location.toString()).pathname
  }

  function renderHeader(cols: string[]) {
    headRow.innerHTML = cols
      .map((col) => {
        const label =
          col === "file.name"
            ? "Činnost"
            : (baseConfig.properties?.[col]?.displayName ?? prettyLabel(col))
        return `<th>${escapeHtml(label)}</th>`
      })
      .join("")
  }

  function getCellHtml(row: (typeof rows)[number], col: string): string {
    if (col === "file.name") {
      return `<a href="${escapeHtml(resolveUrl(row.slug))}">${escapeHtml(row.title)}</a>`
    }
    return escapeHtml(getMetaString(row.meta, col))
  }

  function render() {
    const textQ = textInput.value
    tbody.innerHTML = ""
    const activeView = views[activeViewIdx]
    const cols = getColumnsForView(activeView)
    renderHeader(cols)
    let n = 0
    for (const row of rows) {
      if (!rowMatchesFilters(row.meta, textQ, selected, row.title, activeView)) continue
      n++
      const tr = document.createElement("tr")
      tr.innerHTML = cols.map((col) => `<td>${getCellHtml(row, col)}</td>`).join("")
      tbody.appendChild(tr)
    }
    countEl.textContent = String(n)
  }

  const dimLabels: Record<string, string> = {
    typ: ds.strTyp ?? "Typ",
    zdroj_typ: ds.strZdrojTyp ?? "Typ zdroje",
    faze: ds.strFaze ?? "Fáze",
    role: ds.strRole ?? "Role",
  }

  for (const dim of [...FILTER_DIMS, ...ARRAY_DIMS]) {
    const wrap = root.querySelector(
      `.cinnosti-filter[data-dim="${CSS.escape(dim)}"]`,
    ) as HTMLElement | null
    if (!wrap) continue
    const select = wrap.querySelector("select") as HTMLSelectElement
    if (!select) continue
    const vals = [...(options.get(dim) ?? new Set())].sort((a, b) => a.localeCompare(b, "cs"))
    const placeholder = dimLabels[dim] ?? dim
    select.innerHTML =
      `<option value="">${escapeHtml(placeholder)}</option>` +
      vals.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("")

    const onChange = () => {
      const s = selected.get(dim)!
      s.clear()
      if (select.value) s.add(select.value)
      render()
    }
    select.addEventListener("change", onChange)
    window.addCleanup(() => select.removeEventListener("change", onChange))
  }

  const onInput = () => render()
  textInput.addEventListener("input", onInput)
  window.addCleanup(() => textInput.removeEventListener("input", onInput))

  viewSelect.innerHTML = views
    .map(
      (view, idx) =>
        `<option value="${idx}">${escapeHtml(view.name ?? `View ${idx + 1}`)}</option>`,
    )
    .join("")
  const onViewChange = () => {
    activeViewIdx = Number.parseInt(viewSelect.value || "0", 10) || 0
    render()
  }
  viewSelect.addEventListener("change", onViewChange)
  window.addCleanup(() => viewSelect.removeEventListener("change", onViewChange))

  const onClear = () => {
    textInput.value = ""
    for (const dim of [...FILTER_DIMS, ...ARRAY_DIMS]) {
      selected.get(dim)!.clear()
      const wrap = root.querySelector(
        `.cinnosti-filter[data-dim="${CSS.escape(dim)}"]`,
      ) as HTMLElement | null
      const sel = wrap?.querySelector("select") as HTMLSelectElement | null
      if (sel) sel.value = ""
    }
    render()
  }
  clearBtn?.addEventListener("click", onClear)
  window.addCleanup(() => clearBtn?.removeEventListener("click", onClear))

  render()
}

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  const root = document.getElementById("cinnosti-browser")
  if (!root) return
  const currentSlug = e.detail.url as FullSlug
  const data = (await fetchData) as CinnostiIndex
  await setupCinnosti(root, currentSlug, data)
})
