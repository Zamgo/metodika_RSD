import { FullSlug, resolveRelative, normalizeRelativeURLs } from "../../util/path"
import { load as yamlLoad } from "js-yaml"
import { computePosition, flip, inline, shift } from "@floating-ui/dom"
import { fetchCanonical } from "./util"
import {
  CinnostiIndex,
  createNoteSlugResolver,
  escapeHtml,
  getMetaArray,
  getMetaString,
  isCdeWorkflowRow,
  isCinnostRow,
  metaStringToTableHtml,
  plainTextFromWikiMeta,
  sortKeyForRow,
} from "./cinnostiShared"

const ARRAY_COLS = new Set(["faze", "role"])

const LS_HIDDEN = "cinnosti-hidden-cols:"
const LS_ORDER = "cinnosti-col-order:"
const LS_WIDTHS = "cinnosti-col-widths:"

type BaseConfig = {
  formulas?: Record<string, string>
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

const FILTER_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46"/></svg>`

function prettyLabel(key: string): string {
  if (key === "file.name") return "Název záznamu"
  if (key === "formula.dilci_cinnost") return "Dílčí činnost"
  return key
}

function getRaciHelpText(col: string, label: string): string | null {
  const key = `${col} ${label}`.toLowerCase()
  if (key.includes("r - ")) {
    return "R - Činnost strana/role sama nebo ve spolupráci vykonává"
  }
  if (key.includes("a - ")) {
    return "A - Strana/role je odpovědná za úkol jako celek včetně schvalování"
  }
  if (key.includes("c - ")) {
    return "C - Činnost je konzultována se stranou/rolí"
  }
  if (key.includes("i - ")) {
    return "I - Strana/role je o průběhu činnosti a řešení informována"
  }
  return null
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

/** Stejné chování jako formule v 02 - Seznam činností.base: dilci_cinnost. */
function dilciCinnostDisplay(row: Row): string {
  if (getMetaString(row.meta, "typ") !== "dilci_cinnost") return ""
  return row.title.trim()
}

function getCellValues(row: Row, col: string): string[] {
  if (col === "file.name") return [row.title]
  if (col === "formula.dilci_cinnost") {
    const s = dilciCinnostDisplay(row)
    return s ? [s] : []
  }
  if (ARRAY_COLS.has(col)) return getMetaArray(row.meta, col)
  const v = getMetaString(row.meta, col)
  return v ? [v] : []
}

function collectColumnUniqueValues(rows: Row[], col: string, view?: BaseView): string[] {
  const valueSet = new Set<string>()
  let hasEmpty = false
  for (const row of rows) {
    if (!rowMatchesViewFilters(row.meta, view)) continue
    const vals = getCellValues(row, col)
    if (vals.length === 0) {
      hasEmpty = true
    } else {
      for (const v of vals) {
        if (v) valueSet.add(v)
        else hasEmpty = true
      }
    }
  }
  const sorted = [...valueSet].sort((a, b) => a.localeCompare(b, "cs"))
  if (hasEmpty) sorted.push("")
  return sorted
}

function compareRowsByCol(a: Row, b: Row, col: string): number {
  if (col === "file.name") return a.title.localeCompare(b.title, "cs")
  if (col === "formula.dilci_cinnost") {
    const va = dilciCinnostDisplay(a)
    const vb = dilciCinnostDisplay(b)
    if (!va && !vb) return 0
    if (!va) return 1
    if (!vb) return -1
    return va.localeCompare(vb, "cs", { numeric: true })
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

// ── Popover ──────────────────────────────────────────────────────────────

const domParser = new DOMParser()
let activePopoverLink: HTMLAnchorElement | null = null

function clearActivePopovers() {
  activePopoverLink = null
  document.querySelectorAll(".popover.active-popover").forEach((el) => {
    el.classList.remove("active-popover")
  })
}

async function positionPopover(
  anchor: HTMLElement,
  popoverEl: HTMLElement,
  cx: number,
  cy: number,
) {
  const { x, y } = await computePosition(anchor, popoverEl, {
    strategy: "fixed",
    middleware: [inline({ x: cx, y: cy }), shift(), flip()],
  })
  popoverEl.style.transform = `translate(${x.toFixed()}px, ${y.toFixed()}px)`
}

function scrollPopoverToHash(popoverEl: HTMLElement, hash: string) {
  const inner = popoverEl.querySelector(".popover-inner") as HTMLElement | null
  if (!inner || !hash) return
  const heading = inner.querySelector(`#popover-internal-${hash.slice(1)}`) as HTMLElement
  if (heading) inner.scroll({ top: heading.offsetTop - 12, behavior: "instant" })
}

async function handlePopoverEnter(link: HTMLAnchorElement, ev: MouseEvent) {
  activePopoverLink = link
  const targetUrl = new URL(link.href)
  const hash = decodeURIComponent(targetUrl.hash)
  targetUrl.hash = ""
  targetUrl.search = ""
  const popoverId = `popover-${link.pathname}`

  function showIt(el: HTMLElement) {
    clearActivePopovers()
    activePopoverLink = link
    el.classList.add("active-popover")
    positionPopover(link, el, ev.clientX, ev.clientY)
    scrollPopoverToHash(el, hash)
  }

  const existing = document.getElementById(popoverId)
  if (existing) {
    showIt(existing)
    return
  }

  const response = await fetchCanonical(targetUrl).catch(() => null)
  if (!response?.ok || activePopoverLink !== link) return

  const [contentType] = (response.headers.get("Content-Type") ?? "").split(";")
  const [category, typeInfo] = contentType.split("/")

  const popoverEl = document.createElement("div")
  popoverEl.id = popoverId
  popoverEl.classList.add("popover")
  const inner = document.createElement("div")
  inner.classList.add("popover-inner")
  inner.dataset.contentType = contentType
  popoverEl.appendChild(inner)

  switch (category) {
    case "image": {
      const img = document.createElement("img")
      img.src = targetUrl.toString()
      inner.appendChild(img)
      break
    }
    case "application":
      if (typeInfo === "pdf") {
        const pdf = document.createElement("iframe")
        pdf.src = targetUrl.toString()
        inner.appendChild(pdf)
      }
      break
    default: {
      const text = await response.text()
      const doc = domParser.parseFromString(text, "text/html")
      normalizeRelativeURLs(doc, targetUrl)
      doc.querySelectorAll("[id]").forEach((el) => {
        el.id = `popover-internal-${el.id}`
      })
      const hints = [...doc.getElementsByClassName("popover-hint")]
      if (hints.length === 0) return
      hints.forEach((h) => inner.appendChild(h))
    }
  }

  if (document.getElementById(popoverId) || activePopoverLink !== link) return
  document.body.appendChild(popoverEl)
  showIt(popoverEl)
}

function attachTablePopovers(container: HTMLElement) {
  const links = container.querySelectorAll("a.internal") as NodeListOf<HTMLAnchorElement>
  for (const link of links) {
    if ((link as any).__popoverBound) continue
    ;(link as any).__popoverBound = true
    const enterFn = (e: MouseEvent) => handlePopoverEnter(link, e)
    link.addEventListener("mouseenter", enterFn)
    link.addEventListener("mouseleave", clearActivePopovers)
  }
}

// ── Main setup ───────────────────────────────────────────────────────────

async function setupCinnosti(root: HTMLElement, currentSlug: FullSlug, data: CinnostiIndex) {
  const headRow = root.querySelector(".cinnosti-head-row") as HTMLElement
  const tbody = root.querySelector(".cinnosti-tbody") as HTMLElement
  const textInput = root.querySelector(".cinnosti-filter-text") as HTMLInputElement
  const viewSelect = root.querySelector(".cinnosti-view-select") as HTMLSelectElement
  const countEl = root.querySelector(".cinnosti-count") as HTMLElement
  const clearBtn = root.querySelector(".cinnosti-clear-filters") as HTMLButtonElement
  const colToggleBtn = root.querySelector(".cinnosti-column-toggle-btn") as HTMLButtonElement | null
  const colTogglePanel = root.querySelector(
    ".cinnosti-column-toggle-panel",
  ) as HTMLElement | null
  const filterCountEl = root.querySelector(
    ".cinnosti-active-filter-count",
  ) as HTMLElement | null
  if (!headRow || !tbody || !textInput || !countEl || !viewSelect) return

  const lsScope = root.dataset.cinnostiLsId ?? "cinnosti"
  const workflowTable = root.dataset.cinnostiRows === "workflow"
  const rowFilter = workflowTable ? isCdeWorkflowRow : isCinnostRow

  const rows: Row[] = []
  for (const [slug, details] of Object.entries(data)) {
    if (!rowFilter(details.filePath)) continue
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
  const baseConfig = readBaseConfig(root)
  const ds = root.dataset
  const allViews = Array.isArray(baseConfig.views)
    ? baseConfig.views.filter((v) => !!v?.name)
    : []
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

  const getDefaultCols = (view?: BaseView): string[] => {
    const cols = Array.isArray(view?.order) ? view!.order!.filter(Boolean) : []
    return cols.length > 0 ? cols : fallbackView.order!
  }

  // ── State ────────────────────────────────────────────────────────────
  let sortState: SortState = null
  let hiddenCols = new Set<string>()
  let columnOrder: string[] = []
  const columnWidths = new Map<string, number>()
  const columnFilters = new Map<string, Set<string>>()

  function viewKey(): string {
    return views[activeViewIdx]?.name ?? "default"
  }

  function loadHiddenCols() {
    try {
      const raw = localStorage.getItem(lsScope + ":" + LS_HIDDEN + viewKey())
      hiddenCols = raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      hiddenCols = new Set()
    }
  }
  function saveHiddenCols() {
    localStorage.setItem(lsScope + ":" + LS_HIDDEN + viewKey(), JSON.stringify([...hiddenCols]))
  }

  function loadColumnOrder() {
    try {
      const raw = localStorage.getItem(lsScope + ":" + LS_ORDER + viewKey())
      if (raw) {
        const saved: string[] = JSON.parse(raw)
        const defaults = getDefaultCols(views[activeViewIdx])
        const savedSet = new Set(saved)
        const merged = [...saved]
        for (const col of defaults) {
          if (!savedSet.has(col)) merged.push(col)
        }
        const defaultSet = new Set(defaults)
        columnOrder = merged.filter((c) => defaultSet.has(c))
      } else {
        columnOrder = [...getDefaultCols(views[activeViewIdx])]
      }
    } catch {
      columnOrder = [...getDefaultCols(views[activeViewIdx])]
    }
  }
  function saveColumnOrder() {
    localStorage.setItem(lsScope + ":" + LS_ORDER + viewKey(), JSON.stringify(columnOrder))
  }

  function loadColumnWidths() {
    try {
      const raw = localStorage.getItem(lsScope + ":" + LS_WIDTHS + viewKey())
      columnWidths.clear()
      if (raw) {
        for (const [k, v] of Object.entries(JSON.parse(raw))) {
          columnWidths.set(k, v as number)
        }
      }
    } catch {
      columnWidths.clear()
    }
  }
  function saveColumnWidths() {
    localStorage.setItem(
      lsScope + ":" + LS_WIDTHS + viewKey(),
      JSON.stringify(Object.fromEntries(columnWidths)),
    )
  }

  loadHiddenCols()
  loadColumnOrder()
  loadColumnWidths()

  function getColLabel(col: string): string {
    const fromFm = baseConfig.properties?.[col]?.displayName
    if (fromFm) return fromFm
    if (col === "file.name") {
      return workflowTable ? "Workflow / dokument" : "Činnost / dílčí činnost"
    }
    return prettyLabel(col)
  }

  function getVisibleCols(): string[] {
    const cols = columnOrder.filter((c) => !hiddenCols.has(c))
    return cols.length > 0 ? cols : [columnOrder[0] ?? "file.name"]
  }

  // ── Column toggle panel ──────────────────────────────────────────────

  function renderColumnPanel() {
    if (!colTogglePanel) return
    colTogglePanel.innerHTML = columnOrder
      .map((col) => {
        const label = getColLabel(col)
        const checked = !hiddenCols.has(col) ? " checked" : ""
        return `<label class="cinnosti-col-check"><input type="checkbox" value="${escapeHtml(col)}"${checked}><span>${escapeHtml(label)}</span></label>`
      })
      .join("")
  }

  if (colToggleBtn && colTogglePanel) {
    const onColBtnClick = (e: Event) => {
      e.stopPropagation()
      colTogglePanel.classList.toggle("open")
    }
    colToggleBtn.addEventListener("click", onColBtnClick)
    colTogglePanel.addEventListener("click", (e: Event) => e.stopPropagation())
    const onColChange = (e: Event) => {
      const input = e.target as HTMLInputElement
      if (input.tagName !== "INPUT") return
      const col = input.value
      const visCount = columnOrder.filter((c) => !hiddenCols.has(c)).length
      if (!input.checked && visCount <= 1) {
        input.checked = true
        return
      }
      if (input.checked) hiddenCols.delete(col)
      else hiddenCols.add(col)
      saveHiddenCols()
      render()
    }
    colTogglePanel.addEventListener("change", onColChange)
    const onDocClosePanel = () => colTogglePanel.classList.remove("open")
    document.addEventListener("click", onDocClosePanel)
    window.addCleanup(() => {
      colToggleBtn.removeEventListener("click", onColBtnClick)
      colTogglePanel.removeEventListener("change", onColChange)
      document.removeEventListener("click", onDocClosePanel)
    })
  }

  // ── URL helper ───────────────────────────────────────────────────────

  function resolveUrl(slug: FullSlug): string {
    return new URL(resolveRelative(currentSlug, slug), location.toString()).pathname
  }

  // ── Cell HTML ────────────────────────────────────────────────────────

  function getCellHtml(row: Row, col: string): string {
    if (col === "file.name") {
      return `<a class="internal" href="${escapeHtml(resolveUrl(row.slug))}">${escapeHtml(row.title)}</a>`
    }
    if (col === "formula.dilci_cinnost") {
      const s = dilciCinnostDisplay(row)
      if (!s) return ""
      return `<a class="internal" href="${escapeHtml(resolveUrl(row.slug))}">${escapeHtml(s)}</a>`
    }
    return metaStringToTableHtml(getMetaString(row.meta, col), currentSlug, resolveNote)
  }

  // ── Matching ─────────────────────────────────────────────────────────

  function rowMatchesAllFilters(row: Row, textQ: string, activeView?: BaseView): boolean {
    const tq = textQ.trim().toLowerCase()
    if (tq && !row.title.toLowerCase().includes(tq)) return false
    if (!rowMatchesViewFilters(row.meta, activeView)) return false
    for (const [col, selected] of columnFilters) {
      if (selected.size === 0) return false
      const vals = getCellValues(row, col)
      if (vals.length === 0) {
        if (!selected.has("")) return false
      } else {
        if (!vals.some((v) => selected.has(v))) return false
      }
    }
    return true
  }

  // ── Render ───────────────────────────────────────────────────────────

  function renderHeader(cols: string[]) {
    const activeView = views[activeViewIdx]
    headRow.innerHTML = cols
      .map((col) => {
        const label = getColLabel(col)
        const raciHelp = getRaciHelpText(col, label)
        const labelTitleAttr = raciHelp ? ` title="${escapeHtml(raciHelp)}"` : ""
        const w = columnWidths.get(col)
        const wStyle = w ? ` style="width:${w}px;min-width:${w}px"` : ""
        let sortInd = ""
        if (sortState?.col === col)
          sortInd = sortState.dir === "asc" ? " \u25B2" : " \u25BC"

        const filterActive = columnFilters.has(col) && columnFilters.get(col)!.size > 0
        const filterBtnCls = filterActive ? " active" : ""

        const allValues = collectColumnUniqueValues(rows, col, activeView)
        const selectedSet = columnFilters.get(col)

        const checkboxes = allValues
          .map((val) => {
            const isChecked =
              !selectedSet || selectedSet.size === 0 || selectedSet.has(val)
            const ck = isChecked ? " checked" : ""
            const display = val ? plainTextFromWikiMeta(String(val)) : "(prázdné)"
            return `<label class="cinnosti-filter-value"><input type="checkbox" value="${escapeHtml(val)}"${ck}><span>${escapeHtml(display)}</span></label>`
          })
          .join("")

        return `<th data-col="${escapeHtml(col)}" draggable="true"${wStyle}><div class="cinnosti-th-content"><span class="cinnosti-th-label"${labelTitleAttr}>${escapeHtml(label)}</span><span class="cinnosti-sort-indicator">${sortInd}</span><button type="button" class="cinnosti-col-filter-btn${filterBtnCls}" title="Filtrovat sloupec">${FILTER_ICON}</button></div><div class="cinnosti-col-filter-dropdown"><div class="cinnosti-col-filter-sort-btns"><button type="button" class="cinnosti-col-sort-btn" data-dir="asc">\u2191 Vzestupn\u011B</button><button type="button" class="cinnosti-col-sort-btn" data-dir="desc">\u2193 Sestupn\u011B</button></div><hr><input type="search" class="cinnosti-col-filter-search" placeholder="Hledat hodnoty\u2026" autocomplete="off"><div class="cinnosti-col-filter-actions"><button type="button" class="cinnosti-col-filter-all">Vybrat v\u0161e</button><button type="button" class="cinnosti-col-filter-none">Zru\u0161it v\u00FDb\u011Br</button></div><div class="cinnosti-col-filter-list">${checkboxes}</div></div><div class="cinnosti-resize-handle"></div></th>`
      })
      .join("")
  }

  function renderBody(cols: string[], textQ: string, activeView?: BaseView) {
    let sortedRows: Row[]
    if (sortState) {
      sortedRows = [...rows].sort((a, b) => {
        const cmp = compareRowsByCol(a, b, sortState!.col)
        return sortState!.dir === "desc" ? -cmp : cmp
      })
    } else {
      sortedRows = rows
    }
    tbody.innerHTML = ""
    let n = 0
    for (const row of sortedRows) {
      if (!rowMatchesAllFilters(row, textQ, activeView)) continue
      n++
      const tr = document.createElement("tr")
      tr.innerHTML = cols.map((col) => `<td>${getCellHtml(row, col)}</td>`).join("")
      tbody.appendChild(tr)
    }
    countEl.textContent = String(n)
  }

  function updateFilterIcons() {
    headRow.querySelectorAll("th[data-col]").forEach((th: Element) => {
      const col = (th as HTMLElement).dataset.col!
      const btn = th.querySelector(".cinnosti-col-filter-btn") as HTMLElement
      if (!btn) return
      const isActive = columnFilters.has(col) && columnFilters.get(col)!.size > 0
      btn.classList.toggle("active", isActive)
    })
  }

  function updateActiveFilterCount() {
    if (!filterCountEl) return
    let count = 0
    for (const [, s] of columnFilters) {
      if (s.size > 0) count++
    }
    if (textInput.value.trim()) count++
    filterCountEl.textContent = count > 0 ? `(${count})` : ""
    filterCountEl.style.display = count > 0 ? "inline" : "none"
  }

  function render() {
    const cols = getVisibleCols()
    renderHeader(cols)
    renderBody(cols, textInput.value, views[activeViewIdx])
    attachTablePopovers(tbody)
    updateActiveFilterCount()
  }

  function renderBodyOnly() {
    const cols = getVisibleCols()
    renderBody(cols, textInput.value, views[activeViewIdx])
    attachTablePopovers(tbody)
    updateFilterIcons()
    updateActiveFilterCount()
  }

  // ── Header click delegation ──────────────────────────────────────────

  const onHeadClick = (e: Event) => {
    const target = e.target as HTMLElement

    // Filter button
    const filterBtn = target.closest(".cinnosti-col-filter-btn") as HTMLElement
    if (filterBtn) {
      e.stopPropagation()
      const th = filterBtn.closest("th[data-col]") as HTMLElement
      if (!th) return
      const dropdown = th.querySelector(".cinnosti-col-filter-dropdown") as HTMLElement
      if (!dropdown) return
      headRow.querySelectorAll(".cinnosti-col-filter-dropdown.open").forEach((d) => {
        if (d !== dropdown) d.classList.remove("open")
      })
      dropdown.classList.toggle("open")
      if (dropdown.classList.contains("open")) {
        const si = dropdown.querySelector(".cinnosti-col-filter-search") as HTMLInputElement
        si?.focus()
      }
      return
    }

    // Sort buttons inside dropdown
    const sortBtn = target.closest(".cinnosti-col-sort-btn") as HTMLElement
    if (sortBtn) {
      e.stopPropagation()
      const th = sortBtn.closest("th[data-col]") as HTMLElement
      if (!th) return
      sortState = { col: th.dataset.col!, dir: sortBtn.dataset.dir as "asc" | "desc" }
      render()
      return
    }

    // Select all
    if (target.closest(".cinnosti-col-filter-all")) {
      e.stopPropagation()
      const th = target.closest("th[data-col]") as HTMLElement
      if (!th) return
      columnFilters.delete(th.dataset.col!)
      th.querySelectorAll<HTMLInputElement>(
        ".cinnosti-col-filter-list input[type=checkbox]",
      ).forEach((cb) => (cb.checked = true))
      renderBodyOnly()
      return
    }

    // Deselect all
    if (target.closest(".cinnosti-col-filter-none")) {
      e.stopPropagation()
      const th = target.closest("th[data-col]") as HTMLElement
      if (!th) return
      columnFilters.set(th.dataset.col!, new Set())
      th.querySelectorAll<HTMLInputElement>(
        ".cinnosti-col-filter-list input[type=checkbox]",
      ).forEach((cb) => (cb.checked = false))
      renderBodyOnly()
      return
    }

    // Stop propagation inside dropdown
    if (target.closest(".cinnosti-col-filter-dropdown")) {
      e.stopPropagation()
      return
    }

    // Resize handle — ignore
    if (target.closest(".cinnosti-resize-handle")) return

    // Column header click → sort
    const th = target.closest("th[data-col]") as HTMLElement
    if (!th) return
    const col = th.dataset.col!
    if (sortState?.col === col) {
      sortState = sortState.dir === "asc" ? { col, dir: "desc" } : null
    } else {
      sortState = { col, dir: "asc" }
    }
    render()
  }
  headRow.addEventListener("click", onHeadClick)
  window.addCleanup(() => headRow.removeEventListener("click", onHeadClick))

  // ── Checkbox change in filter dropdown ───────────────────────────────

  const onHeadChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (!target.closest(".cinnosti-col-filter-list")) return
    e.stopPropagation()
    const th = target.closest("th[data-col]") as HTMLElement
    if (!th) return
    const col = th.dataset.col!
    const activeView = views[activeViewIdx]
    const allValues = collectColumnUniqueValues(rows, col, activeView)

    const checked = new Set<string>()
    th.querySelectorAll<HTMLInputElement>(
      ".cinnosti-col-filter-list input[type=checkbox]:checked",
    ).forEach((cb) => checked.add(cb.value))

    if (checked.size >= allValues.length) {
      columnFilters.delete(col)
    } else {
      columnFilters.set(col, checked)
    }
    renderBodyOnly()
  }
  headRow.addEventListener("change", onHeadChange)
  window.addCleanup(() => headRow.removeEventListener("change", onHeadChange))

  // ── Filter search within dropdown ────────────────────────────────────

  const onHeadInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (!target.classList.contains("cinnosti-col-filter-search")) return
    const q = target.value.trim().toLowerCase()
    const list = target
      .closest(".cinnosti-col-filter-dropdown")
      ?.querySelector(".cinnosti-col-filter-list")
    if (!list) return
    list.querySelectorAll<HTMLElement>(".cinnosti-filter-value").forEach((label) => {
      const text = label.querySelector("span")?.textContent?.toLowerCase() ?? ""
      label.style.display = text.includes(q) ? "" : "none"
    })
  }
  headRow.addEventListener("input", onHeadInput)
  window.addCleanup(() => headRow.removeEventListener("input", onHeadInput))

  // ── Close filter dropdowns on outside click ──────────────────────────

  const onDocCloseDropdown = (e: Event) => {
    if (
      (e.target as HTMLElement).closest(
        ".cinnosti-col-filter-dropdown, .cinnosti-col-filter-btn",
      )
    )
      return
    headRow
      .querySelectorAll(".cinnosti-col-filter-dropdown.open")
      .forEach((d) => d.classList.remove("open"))
  }
  document.addEventListener("click", onDocCloseDropdown)
  window.addCleanup(() => document.removeEventListener("click", onDocCloseDropdown))

  // ── Column drag & drop ───────────────────────────────────────────────

  let dragCol: string | null = null

  const onDragStart = (e: DragEvent) => {
    if ((e.target as HTMLElement).closest(".cinnosti-resize-handle")) {
      e.preventDefault()
      return
    }
    const th = (e.target as HTMLElement).closest("th[data-col]") as HTMLElement
    if (!th) return
    dragCol = th.dataset.col!
    th.classList.add("dragging")
    e.dataTransfer!.effectAllowed = "move"
    e.dataTransfer!.setData("text/plain", dragCol)
  }
  headRow.addEventListener("dragstart", onDragStart)
  window.addCleanup(() => headRow.removeEventListener("dragstart", onDragStart))

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (!dragCol) return
    const th = (e.target as HTMLElement).closest("th[data-col]") as HTMLElement
    if (!th || th.dataset.col === dragCol) return
    e.dataTransfer!.dropEffect = "move"
    const rect = th.getBoundingClientRect()
    const midX = rect.left + rect.width / 2
    th.classList.remove("drop-left", "drop-right")
    th.classList.add(e.clientX < midX ? "drop-left" : "drop-right")
  }
  headRow.addEventListener("dragover", onDragOver)
  window.addCleanup(() => headRow.removeEventListener("dragover", onDragOver))

  const onDragLeave = (e: DragEvent) => {
    const th = (e.target as HTMLElement).closest("th[data-col]") as HTMLElement
    if (th) th.classList.remove("drop-left", "drop-right")
  }
  headRow.addEventListener("dragleave", onDragLeave)
  window.addCleanup(() => headRow.removeEventListener("dragleave", onDragLeave))

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    if (!dragCol) return
    const th = (e.target as HTMLElement).closest("th[data-col]") as HTMLElement
    if (!th) return
    const targetCol = th.dataset.col!
    if (targetCol === dragCol) return
    const rect = th.getBoundingClientRect()
    const insertBefore = e.clientX < rect.left + rect.width / 2
    const fromIdx = columnOrder.indexOf(dragCol)
    if (fromIdx < 0) return
    columnOrder.splice(fromIdx, 1)
    let toIdx = columnOrder.indexOf(targetCol)
    if (!insertBefore) toIdx++
    columnOrder.splice(toIdx, 0, dragCol)
    saveColumnOrder()
    dragCol = null
    render()
  }
  headRow.addEventListener("drop", onDrop)
  window.addCleanup(() => headRow.removeEventListener("drop", onDrop))

  const onDragEnd = () => {
    dragCol = null
    headRow
      .querySelectorAll("th")
      .forEach((th) => th.classList.remove("dragging", "drop-left", "drop-right"))
  }
  headRow.addEventListener("dragend", onDragEnd)
  window.addCleanup(() => headRow.removeEventListener("dragend", onDragEnd))

  // ── Column resize ────────────────────────────────────────────────────

  let resizeCol: string | null = null
  let resizeStartX = 0
  let resizeStartW = 0

  const onResizeDown = (e: MouseEvent) => {
    const handle = (e.target as HTMLElement).closest(
      ".cinnosti-resize-handle",
    ) as HTMLElement
    if (!handle) return
    e.preventDefault()
    e.stopPropagation()
    const th = handle.closest("th[data-col]") as HTMLElement
    if (!th) return
    resizeCol = th.dataset.col!
    resizeStartX = e.clientX
    resizeStartW = th.offsetWidth
    th.classList.add("resizing")
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }
  headRow.addEventListener("mousedown", onResizeDown)
  window.addCleanup(() => headRow.removeEventListener("mousedown", onResizeDown))

  const onResizeMove = (e: MouseEvent) => {
    if (!resizeCol) return
    const dx = e.clientX - resizeStartX
    const newW = Math.max(60, resizeStartW + dx)
    columnWidths.set(resizeCol, newW)
    const th = headRow.querySelector(
      `th[data-col="${CSS.escape(resizeCol)}"]`,
    ) as HTMLElement
    if (th) {
      th.style.width = `${newW}px`
      th.style.minWidth = `${newW}px`
    }
    const idx = getVisibleCols().indexOf(resizeCol)
    if (idx >= 0) {
      tbody.querySelectorAll("tr").forEach((tr) => {
        const td = tr.children[idx] as HTMLElement
        if (td) {
          td.style.width = `${newW}px`
          td.style.minWidth = `${newW}px`
        }
      })
    }
  }
  document.addEventListener("mousemove", onResizeMove)
  window.addCleanup(() => document.removeEventListener("mousemove", onResizeMove))

  const onResizeUp = () => {
    if (!resizeCol) return
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
    const th = headRow.querySelector(
      `th[data-col="${CSS.escape(resizeCol)}"]`,
    ) as HTMLElement
    if (th) th.classList.remove("resizing")
    saveColumnWidths()
    resizeCol = null
  }
  document.addEventListener("mouseup", onResizeUp)
  window.addCleanup(() => document.removeEventListener("mouseup", onResizeUp))

  // ── Toolbar events ───────────────────────────────────────────────────

  const onTextInput = () => renderBodyOnly()
  textInput.addEventListener("input", onTextInput)
  window.addCleanup(() => textInput.removeEventListener("input", onTextInput))

  viewSelect.innerHTML = views
    .map(
      (view, idx) =>
        `<option value="${idx}">${escapeHtml(view.name ?? `View ${idx + 1}`)}</option>`,
    )
    .join("")

  const onViewChange = () => {
    activeViewIdx = Number.parseInt(viewSelect.value || "0", 10) || 0
    loadHiddenCols()
    loadColumnOrder()
    loadColumnWidths()
    sortState = null
    columnFilters.clear()
    renderColumnPanel()
    render()
  }
  viewSelect.addEventListener("change", onViewChange)
  window.addCleanup(() => viewSelect.removeEventListener("change", onViewChange))

  const onClear = () => {
    textInput.value = ""
    sortState = null
    columnFilters.clear()
    render()
  }
  clearBtn?.addEventListener("click", onClear)
  window.addCleanup(() => clearBtn?.removeEventListener("click", onClear))

  renderColumnPanel()
  render()
}

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  const roots = document.querySelectorAll(".cinnosti-table-root")
  if (roots.length === 0) return
  const currentSlug = e.detail.url as FullSlug
  const data = (await fetchData) as CinnostiIndex
  for (const root of roots) {
    await setupCinnosti(root as HTMLElement, currentSlug, data)
  }
})
