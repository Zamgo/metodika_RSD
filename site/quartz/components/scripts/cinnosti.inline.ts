import { FullSlug, resolveRelative } from "../../util/path"
import { load as yamlLoad } from "js-yaml"
import {
  CinnostiIndex,
  createNoteSlugResolver,
  escapeHtml,
  getMetaArray,
  getMetaString,
  isCinnostRow,
  metaStringToTableHtml,
  sortKeyForRow,
} from "./cinnostiShared"

const FILTER_DIMS = ["zdroj_typ", "typ"] as const
const ARRAY_DIMS = ["faze", "role"] as const

const LS_HIDDEN_COLS_PREFIX = "cinnosti-hidden-cols:"

type BaseConfig = {
  properties?: Record<string, { displayName?: string }>
  views?: {
    name?: string
    filters?: { and?: string[]; or?: string[] }
    order?: string[]
  }[]
}

type BaseView = NonNullable<BaseConfig["views"]>[number]

type SortState = { col: string; dir: "asc" | "desc" } | null

type Row = {
  slug: FullSlug
  title: string
  fp: string
  meta?: Record<string, unknown>
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

function compareRowsByCol(a: Row, b: Row, col: string): number {
  if (col === "file.name") {
    return a.title.localeCompare(b.title, "cs")
  }
  if (col === "oznaceni") {
    const ka = sortKeyForRow(a.meta, a.title)
    const kb = sortKeyForRow(b.meta, b.title)
    return ka.localeCompare(kb, undefined, { numeric: true })
  }
  const va = getMetaString(a.meta, col)
  const vb = getMetaString(b.meta, col)
  if (!va && !vb) return 0
  if (!va) return 1
  if (!vb) return -1
  return va.localeCompare(vb, "cs", { numeric: true })
}

async function setupCinnosti(root: HTMLElement, currentSlug: FullSlug, data: CinnostiIndex) {
  const headRow = root.querySelector(".cinnosti-head-row") as HTMLElement
  const tbody = root.querySelector(".cinnosti-tbody") as HTMLElement
  const textInput = root.querySelector(".cinnosti-filter-text") as HTMLInputElement
  const viewSelect = root.querySelector(".cinnosti-view-select") as HTMLSelectElement
  const countEl = root.querySelector(".cinnosti-count") as HTMLElement
  const clearBtn = root.querySelector(".cinnosti-clear-filters") as HTMLButtonElement
  const colToggleBtn = root.querySelector(".cinnosti-column-toggle-btn") as HTMLButtonElement | null
  const colTogglePanel = root.querySelector(".cinnosti-column-toggle-panel") as HTMLElement | null
  if (!headRow || !tbody || !textInput || !countEl || !viewSelect) return

  const rows: Row[] = []
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

  const resolveNote = createNoteSlugResolver(data)

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

  // ── Column toggle ─────────────────────────────────────────────────────

  let hiddenCols = new Set<string>()

  function hiddenColsKey(): string {
    return LS_HIDDEN_COLS_PREFIX + (views[activeViewIdx]?.name ?? "default")
  }

  function loadHiddenCols() {
    try {
      const raw = localStorage.getItem(hiddenColsKey())
      hiddenCols = raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      hiddenCols = new Set()
    }
  }

  function saveHiddenCols() {
    localStorage.setItem(hiddenColsKey(), JSON.stringify([...hiddenCols]))
  }

  function getColLabel(col: string): string {
    return col === "file.name"
      ? "Činnost"
      : (baseConfig.properties?.[col]?.displayName ?? prettyLabel(col))
  }

  function renderColumnPanel() {
    if (!colTogglePanel) return
    const allCols = getColumnsForView(views[activeViewIdx])
    colTogglePanel.innerHTML = allCols
      .map((col) => {
        const label = getColLabel(col)
        const checked = !hiddenCols.has(col) ? " checked" : ""
        return `<label class="cinnosti-col-check"><input type="checkbox" value="${escapeHtml(col)}"${checked}><span>${escapeHtml(label)}</span></label>`
      })
      .join("")
  }

  loadHiddenCols()

  if (colToggleBtn && colTogglePanel) {
    const onColBtnClick = (e: Event) => {
      e.stopPropagation()
      colTogglePanel.classList.toggle("open")
    }
    colToggleBtn.addEventListener("click", onColBtnClick)

    const onPanelClick = (e: Event) => e.stopPropagation()
    colTogglePanel.addEventListener("click", onPanelClick)

    const onColChange = (e: Event) => {
      const input = e.target as HTMLInputElement
      if (input.tagName !== "INPUT") return
      const col = input.value
      const allCols = getColumnsForView(views[activeViewIdx])
      const currentlyVisibleCount = allCols.filter((c) => !hiddenCols.has(c)).length

      // Keep at least one column visible so the table cannot render "empty".
      if (!input.checked && currentlyVisibleCount <= 1) {
        input.checked = true
        return
      }

      if (input.checked) {
        hiddenCols.delete(col)
      } else {
        hiddenCols.add(col)
      }
      saveHiddenCols()
      render()
    }
    colTogglePanel.addEventListener("change", onColChange)

    const onDocClickClosePanel = () => colTogglePanel.classList.remove("open")
    document.addEventListener("click", onDocClickClosePanel)

    window.addCleanup(() => {
      colToggleBtn.removeEventListener("click", onColBtnClick)
      colTogglePanel.removeEventListener("click", onPanelClick)
      colTogglePanel.removeEventListener("change", onColChange)
      document.removeEventListener("click", onDocClickClosePanel)
    })
  }

  // ── Sort ───────────────────────────────────────────────────────────────

  let sortState: SortState = null

  const onHeaderClick = (e: Event) => {
    const th = (e.target as HTMLElement).closest("th[data-col]") as HTMLElement | null
    if (!th) return
    const col = th.dataset.col!
    if (sortState?.col === col) {
      sortState = sortState.dir === "asc" ? { col, dir: "desc" } : null
    } else {
      sortState = { col, dir: "asc" }
    }
    render()
  }
  headRow.addEventListener("click", onHeaderClick)
  window.addCleanup(() => headRow.removeEventListener("click", onHeaderClick))

  // ── Render ─────────────────────────────────────────────────────────────

  function resolveUrl(slug: FullSlug): string {
    return new URL(resolveRelative(currentSlug, slug), location.toString()).pathname
  }

  function renderHeader(cols: string[]) {
    headRow.innerHTML = cols
      .map((col) => {
        const label = getColLabel(col)
        let indicator = ""
        if (sortState?.col === col) {
          indicator = sortState.dir === "asc" ? " \u25B2" : " \u25BC"
        }
        return `<th data-col="${escapeHtml(col)}"><span class="cinnosti-th-label">${escapeHtml(label)}</span><span class="cinnosti-sort-indicator">${indicator}</span></th>`
      })
      .join("")
  }

  function getCellHtml(row: Row, col: string): string {
    if (col === "file.name") {
      return `<a href="${escapeHtml(resolveUrl(row.slug))}">${escapeHtml(row.title)}</a>`
    }
    return metaStringToTableHtml(getMetaString(row.meta, col), currentSlug, resolveNote)
  }

  function render() {
    const textQ = textInput.value
    tbody.innerHTML = ""
    const activeView = views[activeViewIdx]
    const allCols = getColumnsForView(activeView)
    const visibleCols = allCols.filter((c) => !hiddenCols.has(c))
    const cols = visibleCols.length > 0 ? visibleCols : [allCols[0] ?? "file.name"]
    renderHeader(cols)

    let sortedRows: Row[]
    if (sortState) {
      sortedRows = [...rows].sort((a, b) => {
        const cmp = compareRowsByCol(a, b, sortState!.col)
        return sortState!.dir === "desc" ? -cmp : cmp
      })
    } else {
      sortedRows = rows
    }

    let n = 0
    for (const row of sortedRows) {
      if (!rowMatchesFilters(row.meta, textQ, selected, row.title, activeView)) continue
      n++
      const tr = document.createElement("tr")
      tr.innerHTML = cols.map((col) => `<td>${getCellHtml(row, col)}</td>`).join("")
      tbody.appendChild(tr)
    }
    countEl.textContent = String(n)
  }

  // ── Dimension filters ──────────────────────────────────────────────────

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
    loadHiddenCols()
    sortState = null
    renderColumnPanel()
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
    sortState = null
    render()
  }
  clearBtn?.addEventListener("click", onClear)
  window.addCleanup(() => clearBtn?.removeEventListener("click", onClear))

  renderColumnPanel()
  render()
}

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  const root = document.getElementById("cinnosti-browser")
  if (!root) return
  const currentSlug = e.detail.url as FullSlug
  const data = (await fetchData) as CinnostiIndex
  await setupCinnosti(root, currentSlug, data)
})
