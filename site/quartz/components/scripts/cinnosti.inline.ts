import { FullSlug, normalizeRelativeURLs, runtimeSitePath } from "../../util/path"
import { load as yamlLoad } from "js-yaml"
import { computePosition, flip, inline, shift } from "@floating-ui/dom"
import { fetchCanonical } from "./util"
import {
  CinnostiIndex,
  createNoteSlugResolver,
  escapeHtml,
  getMetaArray,
  getMetaString,
  groupRowsNested,
  isCdeWorkflowRow,
  isCinnostRow,
  metaStringToTableHtml,
  plainTextFromWikiMeta,
  RowGroupNode,
  SavedView,
  sortKeyForRow,
} from "./cinnostiShared"

const LS_HIDDEN = "cinnosti-hidden-cols:"
const LS_ORDER = "cinnosti-col-order:"
const LS_WIDTHS = "cinnosti-col-widths:"
const LS_GROUP_BY = "cinnosti-group-by:"
const LS_GROUP_COLLAPSED = "cinnosti-group-collapsed:"
const LS_USER_VIEWS = "cinnosti-user-views:"
const LS_ACTIVE_VIEW = "cinnosti-active-view:"
const LS_MIGRATED = "cinnosti-migrated-v1:"

/** Hardcoded fallback groupingy podle jména view (případně data-cinnosti-ls-id). */
const DEFAULT_GROUP_BY_BY_VIEW: Record<string, string> = {
  "Všechny dílčí činnosti": "oblast",
}

/** Fallback pokud view není v mapě nahoře - podle data-cinnosti-ls-id root elementu. */
const DEFAULT_GROUP_BY_BY_SCOPE: Record<string, string> = {
  cinnosti: "oblast",
  "cde-workflow": "typ",
}

function generateViewId(): string {
  const rnd = Math.random().toString(36).slice(2, 10)
  const t = Date.now().toString(36)
  return `user:${t}-${rnd}`
}

function encodeStateParam(obj: unknown): string {
  try {
    const json = JSON.stringify(obj)
    const b64 =
      typeof btoa === "function"
        ? btoa(unescape(encodeURIComponent(json)))
        : Buffer.from(json, "utf8").toString("base64")
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  } catch {
    return ""
  }
}

function decodeStateParam(s: string): unknown | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/")
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4))
    const raw =
      typeof atob === "function"
        ? decodeURIComponent(escape(atob(b64 + pad)))
        : Buffer.from(b64 + pad, "base64").toString("utf8")
    return JSON.parse(raw)
  } catch {
    return null
  }
}

type BaseConfig = {
  formulas?: Record<string, string>
  properties?: Record<string, { displayName?: string }>
  views?: {
    name?: string
    filters?: { and?: string[]; or?: string[] }
    order?: string[]
    /**
     * Volitelný override defaultního groupBy (spätně kompatibilní - chybí → použije se fallback).
     * Přijímá řetězec nebo pole řetězců pro víceúrovňové seskupení.
     */
    groupBy?: string | string[] | { property?: string } | Array<string | { property?: string }>
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

function isRaciLabel(label: string): boolean {
  return /^[RACI]\s*-\s*/i.test(label.trim())
}

function classifyRaciParticipant(text: string): "party" | "role" | "other" {
  const t = text.toLowerCase()
  if (
    t.includes("pověřující strana") ||
    t.includes("pověřená strana") ||
    t.includes("vedoucí pověřená strana")
  ) {
    return "party"
  }
  if (
    t.includes("správce stavby") ||
    t.includes("asistent") ||
    t.includes("koordinátor") ||
    t.includes("člen týmu")
  ) {
    return "role"
  }
  return "other"
}

function isFazeLabel(col: string): boolean {
  return col.trim().toLowerCase() === "faze"
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

/** Stejné chování jako formule v 02 - Seznam všech činností.base: dilci_cinnost. */
function dilciCinnostDisplay(row: Row): string {
  if (getMetaString(row.meta, "typ") !== "ukol") return ""
  return row.title.trim()
}

function getCellValues(row: Row, col: string): string[] {
  if (col === "file.name") return [row.title]
  if (col === "formula.dilci_cinnost") {
    const s = dilciCinnostDisplay(row)
    return s ? [s] : []
  }
  return getMetaArray(row.meta, col)
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
  const fullscreenBtn = root.querySelector(".cinnosti-fullscreen-btn") as HTMLButtonElement | null
  const colToggleBtn = root.querySelector(".cinnosti-column-toggle-btn") as HTMLButtonElement | null
  const colTogglePanel = root.querySelector(".cinnosti-column-toggle-panel") as HTMLElement | null
  const filterCountEl = root.querySelector(".cinnosti-active-filter-count") as HTMLElement | null
  const groupAddSelect = root.querySelector(".cinnosti-group-add") as HTMLSelectElement | null
  const groupChipsEl = root.querySelector(".cinnosti-group-chips") as HTMLElement | null
  const groupExpandAllBtn = root.querySelector(
    ".cinnosti-group-expand-all",
  ) as HTMLButtonElement | null
  const groupCollapseAllBtn = root.querySelector(
    ".cinnosti-group-collapse-all",
  ) as HTMLButtonElement | null
  if (!headRow || !tbody || !textInput || !countEl || !viewSelect) return

  const lsScope = root.dataset.cinnostiLsId ?? "cinnosti"
  const workflowTable = root.dataset.cinnostiRows === "workflow"
  const rowFilter = workflowTable ? isCdeWorkflowRow : isCinnostRow

  const updateFullscreenButton = () => {
    if (!fullscreenBtn) return
    const isFullscreen =
      document.fullscreenElement === root || root.classList.contains("is-fullscreen-fallback")
    const label = isFullscreen
      ? (root.dataset.strFullscreenExit ?? "Zpět z celé obrazovky")
      : (root.dataset.strFullscreenEnter ?? "Celá obrazovka")
    fullscreenBtn.setAttribute("aria-pressed", isFullscreen ? "true" : "false")
    fullscreenBtn.setAttribute("title", label)
    fullscreenBtn.setAttribute("aria-label", label)
    const labelEl = fullscreenBtn.querySelector(".cinnosti-fullscreen-label")
    if (labelEl) labelEl.textContent = label
  }

  const exitFullscreen = async () => {
    if (document.fullscreenElement === root && document.exitFullscreen) {
      await document.exitFullscreen()
    } else {
      root.classList.remove("is-fullscreen-fallback")
    }
    updateFullscreenButton()
  }

  const enterFullscreen = async () => {
    if (root.requestFullscreen) {
      await root.requestFullscreen()
    } else {
      root.classList.add("is-fullscreen-fallback")
    }
    updateFullscreenButton()
  }

  const toggleFullscreen = () => {
    const isFullscreen =
      document.fullscreenElement === root || root.classList.contains("is-fullscreen-fallback")
    ;(isFullscreen ? exitFullscreen() : enterFullscreen()).catch(() => {
      root.classList.toggle("is-fullscreen-fallback", !isFullscreen)
      updateFullscreenButton()
    })
  }

  fullscreenBtn?.addEventListener("click", toggleFullscreen)
  document.addEventListener("fullscreenchange", updateFullscreenButton)
  window.addCleanup(() => {
    fullscreenBtn?.removeEventListener("click", toggleFullscreen)
    document.removeEventListener("fullscreenchange", updateFullscreenButton)
    root.classList.remove("is-fullscreen-fallback")
  })
  updateFullscreenButton()

  /** Implicitní filtr pro per-role tabulku: seznam termů (title + aliases role).
   *  Řádek projde, pokud alespoň jeden term je obsažen v hodnotách sloupce
   *  `R - …` NEBO `A - …` (case-insensitive, ignoruje wikilink obal). Tento filtr
   *  NENÍ vázaný na `columnFilters` a neovlivňuje dropdowny filtrů — je to scope
   *  stránky, ne uživatelský filtr. */
  const roleFilterTerms: string[] = (() => {
    const raw = root.dataset.cinnostiRoleFilter
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed
        .map((v) => (typeof v === "string" ? v.trim().toLowerCase() : ""))
        .filter(Boolean)
    } catch {
      return []
    }
  })()
  const hasRoleFilter = roleFilterTerms.length > 0
  const ROLE_FILTER_COLUMNS = [
    "R - Odpovědnost za provádění činnosti",
    "A - Právní odpovědnost za dokončení činnosti",
  ]

  /** Vrací true, pokud alespoň jeden term role filtru figuruje v R nebo A
   *  sloupci daného meta záznamu. Pracuje přímo s raw meta (bez Row), ať se
   *  dá aplikovat už při prvotním filtrování před sestavením Row. */
  function metaMatchesRoleFilter(meta: Record<string, unknown> | undefined): boolean {
    if (!hasRoleFilter) return true
    for (const col of ROLE_FILTER_COLUMNS) {
      const vals = getMetaArray(meta, col)
      for (const v of vals) {
        const plain = plainTextFromWikiMeta(String(v)).toLowerCase()
        if (!plain) continue
        for (const term of roleFilterTerms) {
          if (plain.includes(term)) return true
        }
      }
    }
    return false
  }

  const rows: Row[] = []
  for (const [slug, details] of Object.entries(data)) {
    if (!rowFilter(details.filePath)) continue
    const meta = details.meta as Record<string, unknown> | undefined
    if (!metaMatchesRoleFilter(meta)) continue
    rows.push({
      slug: slug as FullSlug,
      title: details.title ?? slug,
      fp: details.filePath,
      meta,
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
  const allViews = Array.isArray(baseConfig.views) ? baseConfig.views.filter((v) => !!v?.name) : []
  const fallbackView: BaseView = {
    name: ds.strViewAll ?? "Vše",
    order: [
      "file.name",
      "oznaceni",
      "typ",
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

  // ── Views system ─────────────────────────────────────────────────────

  const viewsUiEnabled = lsScope === "cinnosti"
  function buildBaseSavedViews(): SavedView[] {
    return views.map((v) => ({
      id: `base:${v.name ?? "default"}`,
      name: v.name ?? "default",
      kind: "base" as const,
      baseView: v.name ?? "default",
      groupBy: [],
      hiddenCols: [],
      schemaVersion: 1 as const,
    }))
  }

  let baseViews: SavedView[] = buildBaseSavedViews()
  let userViews: SavedView[] = []
  let activeViewId: string = baseViews[0]?.id ?? "base:default"

  function loadUserViews(): SavedView[] {
    if (!viewsUiEnabled) return []
    try {
      const raw = localStorage.getItem(LS_USER_VIEWS + lsScope)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.filter(
        (v: unknown): v is SavedView =>
          !!v && typeof v === "object" && typeof (v as SavedView).id === "string",
      )
    } catch {
      return []
    }
  }
  function saveUserViews() {
    if (!viewsUiEnabled) return
    try {
      localStorage.setItem(LS_USER_VIEWS + lsScope, JSON.stringify(userViews))
    } catch {}
  }

  function listAllViews(): SavedView[] {
    return [...baseViews, ...userViews]
  }

  function findViewById(id: string): SavedView | null {
    return listAllViews().find((v) => v.id === id) ?? null
  }

  function getActiveSavedView(): SavedView {
    return (
      findViewById(activeViewId) ??
      baseViews[0] ?? {
        id: "base:default",
        name: "default",
        kind: "base",
        baseView: "default",
        groupBy: [],
        hiddenCols: [],
        schemaVersion: 1,
      }
    )
  }

  function getActiveBaseView(): BaseView {
    const sv = getActiveSavedView()
    const idx = views.findIndex((v) => v.name === sv.baseView)
    if (idx >= 0) {
      activeViewIdx = idx
      return views[idx]
    }
    activeViewIdx = 0
    return views[0]
  }

  /** Jednorazová migrace starých LS klíčů pojmenovaných pouze dle base view name. */
  function migrateLegacyKeys() {
    if (!viewsUiEnabled) return
    const marker = LS_MIGRATED + lsScope
    try {
      if (localStorage.getItem(marker)) return
      for (const bv of baseViews) {
        const legacyName = bv.baseView
        const newId = bv.id
        const keys = [LS_HIDDEN, LS_ORDER, LS_WIDTHS, LS_GROUP_BY]
        for (const k of keys) {
          const legacy = lsScope + ":" + k + legacyName
          const next = lsScope + ":" + k + newId
          const v = localStorage.getItem(legacy)
          if (v != null && localStorage.getItem(next) == null) {
            localStorage.setItem(next, v)
          }
        }
        const prefix = lsScope + ":" + LS_GROUP_COLLAPSED + legacyName + ":"
        const nextPrefix = lsScope + ":" + LS_GROUP_COLLAPSED + newId + ":"
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!key || !key.startsWith(prefix)) continue
          const suffix = key.slice(prefix.length)
          const nextKey = nextPrefix + suffix
          if (localStorage.getItem(nextKey) == null) {
            const v = localStorage.getItem(key)
            if (v != null) localStorage.setItem(nextKey, v)
          }
        }
      }
      localStorage.setItem(marker, "1")
    } catch {}
  }

  // ── State ────────────────────────────────────────────────────────────
  let sortState: SortState = null
  let hiddenCols = new Set<string>()
  let columnOrder: string[] = []
  const columnWidths = new Map<string, number>()
  const columnFilters = new Map<string, Set<string>>()
  /** Pořadí úrovní seskupení (prázdné pole = žádné seskupení). */
  let groupBy: string[] = []
  /** Sada `data-group` (path-based hash) u sbalených skupin v aktuálním view. */
  let collapsedGroups = new Set<string>()

  function viewKey(): string {
    if (viewsUiEnabled) return activeViewId
    return views[activeViewIdx]?.name ?? "default"
  }

  function defaultGroupByForView(view: BaseView | undefined): string[] {
    if (!view) return []
    const fromFm = view.groupBy
    const groupByFromObject = (value: unknown): string | null => {
      if (typeof value !== "object" || value == null) return null
      const prop = (value as { property?: unknown }).property
      if (typeof prop !== "string" || !prop.trim()) return null
      return prop.trim()
    }
    if (Array.isArray(fromFm)) {
      const filtered = fromFm
        .map((x) => (typeof x === "string" ? x.trim() : (groupByFromObject(x) ?? "")))
        .filter((x): x is string => !!x)
      if (filtered.length > 0) return filtered.map((s) => s.trim())
    } else if (typeof fromFm === "string" && fromFm.trim()) {
      return [fromFm.trim()]
    } else {
      const single = groupByFromObject(fromFm)
      if (single) return [single]
    }
    const byName = view.name ? DEFAULT_GROUP_BY_BY_VIEW[view.name] : undefined
    if (byName) return [byName]
    const scope = root.dataset.cinnostiLsId ?? ""
    const byScope = DEFAULT_GROUP_BY_BY_SCOPE[scope]
    return byScope ? [byScope] : []
  }

  function loadHiddenCols() {
    const sv = viewsUiEnabled ? getActiveSavedView() : null
    try {
      const raw = localStorage.getItem(lsScope + ":" + LS_HIDDEN + viewKey())
      if (raw !== null) {
        hiddenCols = new Set(JSON.parse(raw))
        return
      }
      if (sv && sv.kind !== "base" && Array.isArray(sv.hiddenCols)) {
        hiddenCols = new Set(sv.hiddenCols)
        return
      }
      hiddenCols = new Set()
    } catch {
      hiddenCols = new Set()
    }
  }
  function saveHiddenCols() {
    localStorage.setItem(lsScope + ":" + LS_HIDDEN + viewKey(), JSON.stringify([...hiddenCols]))
  }

  function loadColumnOrder() {
    const sv = viewsUiEnabled ? getActiveSavedView() : null
    const defaults = getDefaultCols(views[activeViewIdx])
    const defaultSet = new Set(defaults)
    try {
      const raw = localStorage.getItem(lsScope + ":" + LS_ORDER + viewKey())
      const source =
        raw != null
          ? (JSON.parse(raw) as string[])
          : sv && Array.isArray(sv.colOrder) && sv.colOrder.length > 0
            ? sv.colOrder
            : null
      if (source) {
        const savedSet = new Set(source)
        const merged = [...source]
        for (const col of defaults) {
          if (!savedSet.has(col)) merged.push(col)
        }
        columnOrder = merged.filter((c) => defaultSet.has(c))
      } else {
        columnOrder = [...defaults]
      }
    } catch {
      columnOrder = [...defaults]
    }
  }
  function saveColumnOrder() {
    localStorage.setItem(lsScope + ":" + LS_ORDER + viewKey(), JSON.stringify(columnOrder))
  }

  function loadColumnWidths() {
    const sv = viewsUiEnabled ? getActiveSavedView() : null
    try {
      const raw = localStorage.getItem(lsScope + ":" + LS_WIDTHS + viewKey())
      columnWidths.clear()
      const source =
        raw != null
          ? (JSON.parse(raw) as Record<string, number>)
          : sv && sv.colWidths
            ? sv.colWidths
            : null
      if (source) {
        for (const [k, v] of Object.entries(source)) {
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

  function loadGroupBy() {
    const sv = viewsUiEnabled ? getActiveSavedView() : null
    try {
      const raw = localStorage.getItem(lsScope + ":" + LS_GROUP_BY + viewKey())
      if (raw === null) {
        if (sv && sv.kind !== "base" && Array.isArray(sv.groupBy)) {
          groupBy = [...sv.groupBy]
        } else {
          groupBy = defaultGroupByForView(views[activeViewIdx])
        }
      } else {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          groupBy = parsed.filter((x: unknown): x is string => typeof x === "string" && !!x.trim())
        } else if (typeof parsed === "string") {
          groupBy = parsed ? [parsed] : []
        } else {
          groupBy = []
        }
      }
    } catch {
      try {
        const raw = localStorage.getItem(lsScope + ":" + LS_GROUP_BY + viewKey())
        groupBy = raw ? [raw] : defaultGroupByForView(views[activeViewIdx])
      } catch {
        groupBy = defaultGroupByForView(views[activeViewIdx])
      }
    }
  }
  function saveGroupBy() {
    localStorage.setItem(lsScope + ":" + LS_GROUP_BY + viewKey(), JSON.stringify(groupBy))
  }

  function dropGroupedColsFromHidden() {
    let changed = false
    for (const col of groupBy) {
      if (hiddenCols.delete(col)) changed = true
    }
    if (changed) saveHiddenCols()
  }

  function collapsedKeySuffix(): string {
    return groupBy.length ? groupBy.join("|") : "_none_"
  }

  function loadCollapsedGroups() {
    try {
      const raw = localStorage.getItem(
        lsScope + ":" + LS_GROUP_COLLAPSED + viewKey() + ":" + collapsedKeySuffix(),
      )
      collapsedGroups = raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      collapsedGroups = new Set()
    }
  }
  function saveCollapsedGroups() {
    localStorage.setItem(
      lsScope + ":" + LS_GROUP_COLLAPSED + viewKey() + ":" + collapsedKeySuffix(),
      JSON.stringify([...collapsedGroups]),
    )
  }

  // Init views system.
  migrateLegacyKeys()
  userViews = loadUserViews()

  function initActiveViewFromEnv() {
    if (!viewsUiEnabled) {
      activeViewId = baseViews[0]?.id ?? "base:default"
      return
    }
    try {
      const url = new URL(location.href)
      const fromUrl = url.searchParams.get("view")
      if (fromUrl && findViewById(fromUrl)) {
        activeViewId = fromUrl
        return
      }
    } catch {}
    try {
      const stored = localStorage.getItem(LS_ACTIVE_VIEW + lsScope)
      if (stored && findViewById(stored)) {
        activeViewId = stored
        return
      }
    } catch {}
    activeViewId = baseViews[0]?.id ?? "base:default"
  }
  initActiveViewFromEnv()
  getActiveBaseView()

  function persistActiveViewId() {
    if (!viewsUiEnabled) return
    try {
      localStorage.setItem(LS_ACTIVE_VIEW + lsScope, activeViewId)
    } catch {}
    try {
      const url = new URL(location.href)
      url.searchParams.set("view", activeViewId)
      url.searchParams.delete("state")
      history.replaceState(null, "", url.toString())
    } catch {}
  }
  persistActiveViewId()

  loadHiddenCols()
  loadColumnOrder()
  loadColumnWidths()
  loadGroupBy()
  dropGroupedColsFromHidden()
  loadCollapsedGroups()

  // Případná podkladová overlay přes ?state= z URL (např. sdílený link).
  function applyUrlStateOverlay() {
    if (!viewsUiEnabled) return
    try {
      const url = new URL(location.href)
      const s = url.searchParams.get("state")
      if (!s) return
      const decoded = decodeStateParam(s) as {
        hiddenCols?: string[]
        colOrder?: string[]
        colWidths?: Record<string, number>
        groupBy?: string[]
        sort?: { col: string; dir: "asc" | "desc" } | null
      } | null
      if (!decoded || typeof decoded !== "object") return
      if (Array.isArray(decoded.hiddenCols)) hiddenCols = new Set(decoded.hiddenCols)
      if (Array.isArray(decoded.colOrder) && decoded.colOrder.length > 0) {
        const defaults = getDefaultCols(views[activeViewIdx])
        const ds = new Set(defaults)
        columnOrder = decoded.colOrder.filter((c) => ds.has(c))
        for (const c of defaults) if (!columnOrder.includes(c)) columnOrder.push(c)
      }
      if (decoded.colWidths) {
        columnWidths.clear()
        for (const [k, v] of Object.entries(decoded.colWidths)) {
          if (typeof v === "number") columnWidths.set(k, v)
        }
      }
      if (Array.isArray(decoded.groupBy)) {
        groupBy = decoded.groupBy.filter((x): x is string => typeof x === "string" && !!x.trim())
      }
      if (decoded.sort && typeof decoded.sort === "object") {
        sortState = decoded.sort
      }
    } catch {}
  }
  applyUrlStateOverlay()

  function getColLabel(col: string): string {
    const fromFm = baseConfig.properties?.[col]?.displayName
    if (fromFm) return fromFm
    if (col === "file.name") {
      return workflowTable ? "Workflow / dokument" : "Činnost / dílčí činnost"
    }
    return prettyLabel(col)
  }

  function getVisibleCols(): string[] {
    const groupedCols = new Set(groupBy)
    const cols = columnOrder.filter((c) => !hiddenCols.has(c) && !groupedCols.has(c))
    return cols.length > 0 ? cols : [columnOrder[0] ?? "file.name"]
  }

  // ── Column toggle panel ──────────────────────────────────────────────

  function renderColumnPanel() {
    if (!colTogglePanel) return
    colTogglePanel.innerHTML = columnOrder
      .map((col) => {
        const label = getColLabel(col)
        const grouped = groupBy.includes(col)
        const checked = !hiddenCols.has(col) && !grouped ? " checked" : ""
        const disabled = grouped ? " disabled" : ""
        const title = grouped ? ` title="Skryto kvůli aktivnímu seskupení"` : ""
        return `<label class="cinnosti-col-check${grouped ? " is-grouped" : ""}"${title}><input type="checkbox" value="${escapeHtml(col)}"${checked}${disabled}><span>${escapeHtml(label)}</span></label>`
      })
      .join("")
  }

  if (colToggleBtn && colTogglePanel) {
    const onColBtnClick = (e: Event) => {
      e.stopPropagation()
      const isOpen = colTogglePanel.classList.toggle("open")
      colToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false")
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
    const onDocClosePanel = () => {
      colTogglePanel.classList.remove("open")
      colToggleBtn.setAttribute("aria-expanded", "false")
    }
    document.addEventListener("click", onDocClosePanel)
    window.addCleanup(() => {
      colToggleBtn.removeEventListener("click", onColBtnClick)
      colTogglePanel.removeEventListener("change", onColChange)
      document.removeEventListener("click", onDocClosePanel)
    })
  }

  // ── View kebab menu (Uložit jako / Obnovit / Sdílet / Spravovat) ─────

  const viewMenuBtn = root.querySelector(".cinnosti-view-menu-btn") as HTMLButtonElement | null
  const viewMenuPanel = root.querySelector(".cinnosti-view-menu-panel") as HTMLElement | null
  if (viewMenuBtn && viewMenuPanel) {
    const closeMenu = () => {
      viewMenuPanel.classList.remove("open")
      viewMenuBtn.setAttribute("aria-expanded", "false")
    }
    const onMenuBtnClick = (e: Event) => {
      e.stopPropagation()
      const isOpen = viewMenuPanel.classList.toggle("open")
      viewMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false")
    }
    viewMenuBtn.addEventListener("click", onMenuBtnClick)
    // Klik uvnitř panelu nezavírá – zavření provede samotná položka po akci.
    viewMenuPanel.addEventListener("click", (e: Event) => {
      const target = e.target as HTMLElement
      if (target.closest(".cinnosti-view-menu-item")) {
        closeMenu()
      } else {
        e.stopPropagation()
      }
    })
    const onDocCloseMenu = () => closeMenu()
    document.addEventListener("click", onDocCloseMenu)
    const onEscCloseMenu = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewMenuPanel.classList.contains("open")) closeMenu()
    }
    document.addEventListener("keydown", onEscCloseMenu)
    window.addCleanup(() => {
      viewMenuBtn.removeEventListener("click", onMenuBtnClick)
      document.removeEventListener("click", onDocCloseMenu)
      document.removeEventListener("keydown", onEscCloseMenu)
    })
  }

  // ── URL helper ───────────────────────────────────────────────────────

  function resolveUrl(slug: FullSlug): string {
    return runtimeSitePath(currentSlug, slug)
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
    const label = getColLabel(col)
    if (isRaciLabel(label)) {
      const vals = getCellValues(row, col)
      if (vals.length === 0) return ""
      const badges = vals
        .map((raw) => {
          const plain = plainTextFromWikiMeta(String(raw)).trim()
          const kind = classifyRaciParticipant(plain)
          const content = metaStringToTableHtml(String(raw), currentSlug, resolveNote)
          const kindTitle =
            kind === "party" ? "Smluvní strana" : kind === "role" ? "Role" : "Nezařazený subjekt"
          return `<span class="cinnosti-pill cinnosti-pill-raci-${kind}" title="${escapeHtml(kindTitle)}">${content}</span>`
        })
        .join("")
      return `<div class="cinnosti-pill-list">${badges}</div>`
    }
    if (isFazeLabel(col)) {
      const vals = getCellValues(row, col)
      if (vals.length === 0) return ""
      const badges = vals
        .map((raw) => {
          const plain = plainTextFromWikiMeta(String(raw)).trim()
          if (!plain) return ""
          return `<span class="cinnosti-pill cinnosti-pill-phase">${escapeHtml(plain)}</span>`
        })
        .filter(Boolean)
        .join("")
      if (!badges) return ""
      return `<div class="cinnosti-pill-list">${badges}</div>`
    }
    return metaStringToTableHtml(getMetaString(row.meta, col), currentSlug, resolveNote)
  }

  // ── Matching ─────────────────────────────────────────────────────────

  function rowMatchesAllFilters(row: Row, textQ: string, activeView?: BaseView): boolean {
    // Role filter je aplikovaný už při budování `rows` výše — zde netřeba.
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
        if (sortState?.col === col) sortInd = sortState.dir === "asc" ? " \u25B2" : " \u25BC"

        const filterActive = columnFilters.has(col) && columnFilters.get(col)!.size > 0
        const filterBtnCls = filterActive ? " active" : ""

        const allValues = collectColumnUniqueValues(rows, col, activeView)
        const selectedSet = columnFilters.get(col)

        const checkboxes = allValues
          .map((val) => {
            const isChecked = !selectedSet || selectedSet.size === 0 || selectedSet.has(val)
            const ck = isChecked ? " checked" : ""
            const display = val ? plainTextFromWikiMeta(String(val)) : "(prázdné)"
            return `<label class="cinnosti-filter-value"><input type="checkbox" value="${escapeHtml(val)}"${ck}><span>${escapeHtml(display)}</span></label>`
          })
          .join("")

        return `<th data-col="${escapeHtml(col)}" draggable="true"${wStyle}><div class="cinnosti-th-content"><span class="cinnosti-th-label"${labelTitleAttr}>${escapeHtml(label)}</span><span class="cinnosti-sort-indicator">${sortInd}</span><button type="button" class="cinnosti-col-filter-btn${filterBtnCls}" title="Filtrovat sloupec">${FILTER_ICON}</button></div><div class="cinnosti-col-filter-dropdown"><div class="cinnosti-col-filter-sort-btns"><button type="button" class="cinnosti-col-sort-btn" data-dir="asc">\u2191 Vzestupn\u011B</button><button type="button" class="cinnosti-col-sort-btn" data-dir="desc">\u2193 Sestupn\u011B</button></div><hr><input type="search" class="cinnosti-col-filter-search" placeholder="Hledat hodnoty\u2026" autocomplete="off"><div class="cinnosti-col-filter-actions"><button type="button" class="cinnosti-col-filter-all">Vybrat v\u0161e</button><button type="button" class="cinnosti-col-filter-none">Zru\u0161it v\u00FDb\u011Br</button><button type="button" class="cinnosti-col-filter-only-visible" style="display:none">Pouze filtrov\u00E1n\u00E9</button></div><div class="cinnosti-col-filter-list">${checkboxes}</div></div><div class="cinnosti-resize-handle"></div></th>`
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
    const visibleRows = sortedRows.filter((r) => rowMatchesAllFilters(r, textQ, activeView))

    tbody.innerHTML = ""
    countEl.textContent = String(visibleRows.length)

    // Bez seskupení - jednoduchý render jako dříve.
    if (groupBy.length === 0) {
      for (const row of visibleRows) {
        const tr = document.createElement("tr")
        tr.innerHTML = cols.map((col) => `<td>${getCellHtml(row, col)}</td>`).join("")
        tbody.appendChild(tr)
      }
      return
    }

    const tree = groupRowsNested(visibleRows, groupBy)
    emitGroupNodes(tree, cols, false)
  }

  function renderGroupValueHtml(node: RowGroupNode<Row>): string {
    if (node.empty) return escapeHtml(node.label)
    const raw = getMetaString(node.sampleRow.meta, node.col)
    if (raw.includes("[[")) {
      return metaStringToTableHtml(raw, currentSlug, resolveNote)
    }
    const resolved = resolveNote(node.label)
    if (resolved) {
      return `<a class="internal" href="${escapeHtml(resolveUrl(resolved))}">${escapeHtml(node.label)}</a>`
    }
    return escapeHtml(node.label)
  }

  function emitGroupNodes(nodes: RowGroupNode<Row>[], cols: string[], parentHidden: boolean) {
    for (const node of nodes) {
      const isCollapsed = collapsedGroups.has(node.id)
      const headerTr = document.createElement("tr")
      headerTr.className = "cinnosti-group-row"
      headerTr.dataset.group = node.id
      headerTr.dataset.depth = String(node.depth)
      if (isCollapsed) headerTr.dataset.collapsed = "true"
      if (parentHidden) headerTr.style.display = "none"
      const groupColLabel = getColLabel(node.col)
      const valueHtml = renderGroupValueHtml(node)
      headerTr.innerHTML = `<td colspan="${cols.length}" class="cinnosti-group-cell" style="--cinnosti-group-depth:${node.depth}"><span class="cinnosti-group-cell-inner"><button type="button" class="cinnosti-group-toggle" aria-expanded="${isCollapsed ? "false" : "true"}" aria-label="Rozbalit nebo sbalit skupinu"><svg class="cinnosti-group-chevron" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span class="cinnosti-group-info"><span class="cinnosti-group-col-label">${escapeHtml(groupColLabel)}:</span> <strong class="cinnosti-group-value">${valueHtml}</strong></span></span></td>`
      tbody.appendChild(headerTr)

      const childrenHidden = parentHidden || isCollapsed

      if (node.rows && node.rows.length > 0) {
        for (const row of node.rows) {
          const tr = document.createElement("tr")
          tr.className = "cinnosti-detail-row"
          tr.dataset.group = node.id
          tr.dataset.depth = String(node.depth + 1)
          if (childrenHidden) tr.style.display = "none"
          tr.innerHTML = cols
            .map((col, idx) => {
              const style = idx === 0 ? ` style="--cinnosti-detail-depth:${node.depth + 1}"` : ""
              return `<td${style}>${getCellHtml(row, col)}</td>`
            })
            .join("")
          tbody.appendChild(tr)
        }
      } else if (node.children) {
        emitGroupNodes(node.children, cols, childrenHidden)
      }
    }
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
    let count = 0
    for (const [, s] of columnFilters) {
      if (s.size > 0) count++
    }
    if (textInput.value.trim()) count++
    if (filterCountEl) {
      filterCountEl.textContent = count > 0 ? String(count) : ""
    }
    if (clearBtn) {
      if (count > 0) clearBtn.removeAttribute("hidden")
      else clearBtn.setAttribute("hidden", "")
    }
  }

  function updateGroupActionsVisibility() {
    const groupActions = root.querySelector(".cinnosti-group-actions") as HTMLElement | null
    if (!groupActions) return
    if (groupBy.length > 0) groupActions.removeAttribute("hidden")
    else groupActions.setAttribute("hidden", "")
  }

  function render() {
    const cols = getVisibleCols()
    renderHeader(cols)
    renderBody(cols, textInput.value, views[activeViewIdx])
    attachTablePopovers(tbody)
    updateActiveFilterCount()
    renderGroupUI()
  }

  function renderBodyOnly() {
    const cols = getVisibleCols()
    renderBody(cols, textInput.value, views[activeViewIdx])
    attachTablePopovers(tbody)
    updateFilterIcons()
    updateActiveFilterCount()
  }

  function syncFilterFromCheckboxes(th: HTMLElement, col: string) {
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

    // Select only visible (filtered) checkboxes, deselect all hidden
    if (target.closest(".cinnosti-col-filter-only-visible")) {
      e.stopPropagation()
      const th = target.closest("th[data-col]") as HTMLElement
      if (!th) return
      const col = th.dataset.col!
      th.querySelectorAll<HTMLElement>(".cinnosti-col-filter-list .cinnosti-filter-value").forEach(
        (label) => {
          const cb = label.querySelector("input[type=checkbox]") as HTMLInputElement
          if (!cb) return
          cb.checked = label.style.display !== "none"
        },
      )
      syncFilterFromCheckboxes(th, col)
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
    const dropdown = target.closest(".cinnosti-col-filter-dropdown")
    const list = dropdown?.querySelector(".cinnosti-col-filter-list")
    if (!list) return
    list.querySelectorAll<HTMLElement>(".cinnosti-filter-value").forEach((label) => {
      const text = label.querySelector("span")?.textContent?.toLowerCase() ?? ""
      label.style.display = text.includes(q) ? "" : "none"
    })
    const onlyVisBtn = dropdown?.querySelector(
      ".cinnosti-col-filter-only-visible",
    ) as HTMLElement | null
    if (onlyVisBtn) onlyVisBtn.style.display = q ? "" : "none"
  }
  headRow.addEventListener("input", onHeadInput)
  window.addCleanup(() => headRow.removeEventListener("input", onHeadInput))

  // ── Close filter dropdowns on outside click ──────────────────────────

  const onDocCloseDropdown = (e: Event) => {
    if (
      (e.target as HTMLElement).closest(".cinnosti-col-filter-dropdown, .cinnosti-col-filter-btn")
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
    const handle = (e.target as HTMLElement).closest(".cinnosti-resize-handle") as HTMLElement
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
    const th = headRow.querySelector(`th[data-col="${CSS.escape(resizeCol)}"]`) as HTMLElement
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
    const th = headRow.querySelector(`th[data-col="${CSS.escape(resizeCol)}"]`) as HTMLElement
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

  // ── Group row toggle (chevron + whole header button) ─────────────────

  const onTbodyClick = (e: Event) => {
    const target = e.target as HTMLElement
    // Klikateľný odkaz v labeli skupiny má prednosť — nezakrývame ho togglom.
    if (target.closest("a")) return
    const tr = target.closest("tr.cinnosti-group-row") as HTMLElement | null
    if (!tr) return
    const gid = tr.dataset.group
    if (!gid) return
    if (collapsedGroups.has(gid)) collapsedGroups.delete(gid)
    else collapsedGroups.add(gid)
    saveCollapsedGroups()
    // Re-render tbody aby se správně propsalo skrytí na všechny vnořené úrovně.
    renderBodyOnly()
  }
  tbody.addEventListener("click", onTbodyClick)
  window.addCleanup(() => tbody.removeEventListener("click", onTbodyClick))

  // ── Group chips + "přidat skupinu" select ──────────────────────────────

  function renderGroupUI() {
    renderGroupChips()
    populateGroupAddSelect()
    updateGroupActionsVisibility()
  }

  function renderGroupChips() {
    if (!groupChipsEl) return
    if (groupBy.length === 0) {
      groupChipsEl.innerHTML = ""
      return
    }
    groupChipsEl.innerHTML = groupBy
      .map(
        (col, idx) =>
          `<span class="cinnosti-group-chip" data-col="${escapeHtml(col)}" data-idx="${idx}"><span class="cinnosti-group-chip-idx">${idx + 1}</span><span class="cinnosti-group-chip-label">${escapeHtml(getColLabel(col))}</span><button type="button" class="cinnosti-group-chip-remove" title="Odebrat" aria-label="Odebrat úroveň seskupení">\u2715</button></span>`,
      )
      .join("")
  }

  function populateGroupAddSelect() {
    if (!groupAddSelect) return
    const placeholder = ds.strGroupAdd ?? "+ Přidat skupinu"
    const opts = [`<option value="">${escapeHtml(placeholder)}</option>`]
    const seen = new Set<string>(groupBy)
    for (const col of columnOrder) {
      if (seen.has(col)) continue
      seen.add(col)
      opts.push(`<option value="${escapeHtml(col)}">${escapeHtml(getColLabel(col))}</option>`)
    }
    groupAddSelect.innerHTML = opts.join("")
    groupAddSelect.value = ""
  }

  const onGroupAdd = () => {
    if (!groupAddSelect) return
    const col = groupAddSelect.value
    if (!col || groupBy.includes(col)) {
      groupAddSelect.value = ""
      return
    }
    groupBy = [...groupBy, col]
    saveGroupBy()
    dropGroupedColsFromHidden()
    loadCollapsedGroups()
    render()
  }
  groupAddSelect?.addEventListener("change", onGroupAdd)
  window.addCleanup(() => groupAddSelect?.removeEventListener("change", onGroupAdd))

  const onChipClick = (e: Event) => {
    const target = e.target as HTMLElement
    const removeBtn = target.closest(".cinnosti-group-chip-remove") as HTMLElement | null
    if (!removeBtn) return
    const chip = removeBtn.closest(".cinnosti-group-chip") as HTMLElement | null
    if (!chip) return
    const col = chip.dataset.col
    if (!col) return
    groupBy = groupBy.filter((c) => c !== col)
    saveGroupBy()
    dropGroupedColsFromHidden()
    loadCollapsedGroups()
    render()
  }
  groupChipsEl?.addEventListener("click", onChipClick)
  window.addCleanup(() => groupChipsEl?.removeEventListener("click", onChipClick))

  const onExpandAll = () => {
    collapsedGroups.clear()
    saveCollapsedGroups()
    renderBodyOnly()
  }
  groupExpandAllBtn?.addEventListener("click", onExpandAll)
  window.addCleanup(() => groupExpandAllBtn?.removeEventListener("click", onExpandAll))

  const onCollapseAll = () => {
    if (groupBy.length === 0) return
    tbody.querySelectorAll<HTMLElement>("tr.cinnosti-group-row").forEach((tr) => {
      const gid = tr.dataset.group
      if (gid) collapsedGroups.add(gid)
    })
    saveCollapsedGroups()
    renderBodyOnly()
  }
  groupCollapseAllBtn?.addEventListener("click", onCollapseAll)
  window.addCleanup(() => groupCollapseAllBtn?.removeEventListener("click", onCollapseAll))

  function populateViewSelect() {
    if (viewsUiEnabled) {
      const groupLabels = {
        base: "Výchozí",
        user: "Vlastní",
      } as const
      const parts: string[] = []
      const kinds: Array<"base" | "user"> = ["base", "user"]
      for (const kind of kinds) {
        const list = listAllViews().filter((v) => v.kind === kind)
        if (list.length === 0 && kind !== "user") continue
        parts.push(`<optgroup label="${escapeHtml(groupLabels[kind])}">`)
        if (list.length === 0) {
          parts.push(`<option value="" disabled>— zatím žádné uložené —</option>`)
        } else {
          for (const v of list) {
            const sel = v.id === activeViewId ? " selected" : ""
            parts.push(`<option value="${escapeHtml(v.id)}"${sel}>${escapeHtml(v.name)}</option>`)
          }
        }
        parts.push(`</optgroup>`)
      }
      viewSelect.innerHTML = parts.join("")
    } else {
      viewSelect.innerHTML = views
        .map(
          (view, idx) =>
            `<option value="${idx}">${escapeHtml(view.name ?? `View ${idx + 1}`)}</option>`,
        )
        .join("")
    }
  }
  populateViewSelect()

  const onViewChange = () => {
    if (viewsUiEnabled) {
      const id = viewSelect.value
      if (!id || !findViewById(id)) return
      activeViewId = id
      getActiveBaseView()
      persistActiveViewId()
      loadHiddenCols()
      loadColumnOrder()
      loadColumnWidths()
      loadGroupBy()
      dropGroupedColsFromHidden()
      loadCollapsedGroups()
      sortState = null
      columnFilters.clear()
      renderColumnPanel()
      updateViewActionState()
      render()
      return
    }
    activeViewIdx = Number.parseInt(viewSelect.value || "0", 10) || 0
    loadHiddenCols()
    loadColumnOrder()
    loadColumnWidths()
    loadGroupBy()
    dropGroupedColsFromHidden()
    loadCollapsedGroups()
    sortState = null
    columnFilters.clear()
    renderColumnPanel()
    render()
  }
  viewSelect.addEventListener("change", onViewChange)
  window.addCleanup(() => viewSelect.removeEventListener("change", onViewChange))

  // ── Views toolbar actions + modals ──────────────────────────────────

  const viewSaveBtn = root.querySelector(".cinnosti-view-save-btn") as HTMLButtonElement | null
  const viewResetBtn = root.querySelector(".cinnosti-view-reset-btn") as HTMLButtonElement | null
  const viewShareBtn = root.querySelector(".cinnosti-view-share-btn") as HTMLButtonElement | null
  const viewManageBtn = root.querySelector(".cinnosti-view-manage-btn") as HTMLButtonElement | null
  const modalRoot = root.querySelector("[data-cinnosti-modal-root]") as HTMLElement | null
  const toastEl = root.querySelector("[data-cinnosti-toast]") as HTMLElement | null
  const viewActionsContainer = root.querySelector("[data-cinnosti-views-ui]") as HTMLElement | null

  // Scope guard: pro /cde-workflow UI nerenderujeme vůbec.
  if (!viewsUiEnabled && viewActionsContainer) {
    viewActionsContainer.style.display = "none"
  }

  let toastTimer: number | null = null
  function showToast(msg: string) {
    if (!toastEl) return
    toastEl.textContent = msg
    toastEl.classList.add("visible")
    if (toastTimer !== null) window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove("visible")
      toastTimer = null
    }, 2400)
  }

  function closeModal() {
    if (!modalRoot) return
    modalRoot.innerHTML = ""
    modalRoot.classList.remove("open")
  }

  function openModal(html: string) {
    if (!modalRoot) return
    modalRoot.innerHTML = `<div class="cinnosti-modal-backdrop"><div class="cinnosti-modal" role="dialog" aria-modal="true">${html}</div></div>`
    modalRoot.classList.add("open")
    const backdrop = modalRoot.querySelector(".cinnosti-modal-backdrop") as HTMLElement | null
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal()
    })
    modalRoot
      .querySelectorAll<HTMLButtonElement>("[data-modal-close]")
      .forEach((b) => b.addEventListener("click", () => closeModal()))
    const first = modalRoot.querySelector("input, textarea, button") as HTMLElement | null
    first?.focus()
  }

  function updateViewActionState() {
    if (!viewsUiEnabled) return
    const sv = getActiveSavedView()
    const isReadOnly = sv.kind !== "user"
    if (viewResetBtn) {
      viewResetBtn.disabled = false
      viewResetBtn.title = isReadOnly
        ? "Obnovit výchozí stav pohledu"
        : "Obnovit pohled na uložený stav"
    }
  }

  function snapshotCurrentState(): Pick<
    SavedView,
    "groupBy" | "hiddenCols" | "colOrder" | "colWidths" | "sort"
  > {
    return {
      groupBy: [...groupBy],
      hiddenCols: [...hiddenCols],
      colOrder: [...columnOrder],
      colWidths: Object.fromEntries(columnWidths),
      sort: sortState ? { col: sortState.col, dir: sortState.dir } : null,
    }
  }

  function saveCurrentAsNewView(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const sv = getActiveSavedView()
    const nv: SavedView = {
      id: generateViewId(),
      name: trimmed,
      kind: "user",
      baseView: sv.baseView,
      ...snapshotCurrentState(),
      schemaVersion: 1,
    }
    userViews.push(nv)
    saveUserViews()
    activeViewId = nv.id
    persistActiveViewId()
    // Reset working overrides — nový pohled má svůj vlastní stav.
    try {
      localStorage.removeItem(lsScope + ":" + LS_HIDDEN + nv.id)
      localStorage.removeItem(lsScope + ":" + LS_ORDER + nv.id)
      localStorage.removeItem(lsScope + ":" + LS_WIDTHS + nv.id)
      localStorage.removeItem(lsScope + ":" + LS_GROUP_BY + nv.id)
    } catch {}
    loadHiddenCols()
    loadColumnOrder()
    loadColumnWidths()
    loadGroupBy()
    dropGroupedColsFromHidden()
    loadCollapsedGroups()
    populateViewSelect()
    renderColumnPanel()
    updateViewActionState()
    render()
    showToast(`Pohled „${nv.name}" uložen`)
  }

  function deleteUserView(id: string) {
    const idx = userViews.findIndex((v) => v.id === id)
    if (idx < 0) return
    userViews.splice(idx, 1)
    saveUserViews()
    try {
      localStorage.removeItem(lsScope + ":" + LS_HIDDEN + id)
      localStorage.removeItem(lsScope + ":" + LS_ORDER + id)
      localStorage.removeItem(lsScope + ":" + LS_WIDTHS + id)
      localStorage.removeItem(lsScope + ":" + LS_GROUP_BY + id)
      const cp = lsScope + ":" + LS_GROUP_COLLAPSED + id + ":"
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && key.startsWith(cp)) localStorage.removeItem(key)
      }
    } catch {}
    if (activeViewId === id) {
      activeViewId = baseViews[0]?.id ?? "base:default"
      persistActiveViewId()
      getActiveBaseView()
      loadHiddenCols()
      loadColumnOrder()
      loadColumnWidths()
      loadGroupBy()
      dropGroupedColsFromHidden()
      loadCollapsedGroups()
      sortState = null
      columnFilters.clear()
    }
    populateViewSelect()
    renderColumnPanel()
    updateViewActionState()
    render()
  }

  function renameUserView(id: string, name: string) {
    const v = userViews.find((u) => u.id === id)
    if (!v) return
    const trimmed = name.trim()
    if (!trimmed) return
    v.name = trimmed
    saveUserViews()
    populateViewSelect()
  }

  function resetCurrentView() {
    try {
      localStorage.removeItem(lsScope + ":" + LS_HIDDEN + activeViewId)
      localStorage.removeItem(lsScope + ":" + LS_ORDER + activeViewId)
      localStorage.removeItem(lsScope + ":" + LS_WIDTHS + activeViewId)
      localStorage.removeItem(lsScope + ":" + LS_GROUP_BY + activeViewId)
      const cp = lsScope + ":" + LS_GROUP_COLLAPSED + activeViewId + ":"
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && key.startsWith(cp)) localStorage.removeItem(key)
      }
    } catch {}
    sortState = null
    columnFilters.clear()
    loadHiddenCols()
    loadColumnOrder()
    loadColumnWidths()
    loadGroupBy()
    dropGroupedColsFromHidden()
    loadCollapsedGroups()
    renderColumnPanel()
    render()
    showToast("Pohled obnoven do výchozího stavu")
  }

  function shareCurrentState() {
    try {
      const url = new URL(location.href)
      url.searchParams.set("view", activeViewId)
      const encoded = encodeStateParam(snapshotCurrentState())
      if (encoded) url.searchParams.set("state", encoded)
      else url.searchParams.delete("state")
      const str = url.toString()
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(str).then(
          () => showToast("Odkaz zkopírován do schránky"),
          () => {
            history.replaceState(null, "", str)
            showToast("Odkaz aktualizován v adresním řádku")
          },
        )
      } else {
        history.replaceState(null, "", str)
        showToast("Odkaz aktualizován v adresním řádku")
      }
    } catch {}
  }

  function openSaveAsModal() {
    const sv = getActiveSavedView()
    const suggested = sv.kind === "user" ? `${sv.name} (kopie)` : sv.name
    openModal(`
      <h3 class="cinnosti-modal-title">Uložit jako pohled</h3>
      <p class="cinnosti-modal-desc">Pojmenujte pohled. Uloží se aktuální stav (skryté sloupce, seskupení, pořadí, šířky, třídění).</p>
      <label class="cinnosti-modal-label">
        <span>Název pohledu</span>
        <input type="text" class="cinnosti-modal-input" data-modal-name value="${escapeHtml(
          suggested,
        )}" />
      </label>
      <div class="cinnosti-modal-actions">
        <button type="button" class="cinnosti-modal-btn" data-modal-close>Zrušit</button>
        <button type="button" class="cinnosti-modal-btn primary" data-modal-save>Uložit</button>
      </div>
    `)
    if (!modalRoot) return
    const input = modalRoot.querySelector("[data-modal-name]") as HTMLInputElement | null
    const saveBtn = modalRoot.querySelector("[data-modal-save]") as HTMLButtonElement | null
    const submit = () => {
      const name = input?.value.trim() ?? ""
      if (!name) {
        input?.focus()
        return
      }
      closeModal()
      saveCurrentAsNewView(name)
    }
    saveBtn?.addEventListener("click", submit)
    input?.addEventListener("keydown", (ev) => {
      if ((ev as KeyboardEvent).key === "Enter") submit()
    })
    input?.select()
  }

  function renderManageViewsList(): string {
    if (userViews.length === 0) {
      return `<p class="cinnosti-modal-empty">Zatím žádné uložené pohledy.</p>`
    }
    return `
      <ul class="cinnosti-manage-views-list">
        ${userViews
          .map(
            (v) => `
          <li data-view-id="${escapeHtml(v.id)}">
            <span class="cinnosti-manage-views-name" title="${escapeHtml(v.baseView)}">${escapeHtml(
              v.name,
            )}</span>
            <span class="cinnosti-manage-views-actions">
              <button type="button" data-act="rename" title="Přejmenovat">Přejmenovat</button>
              <button type="button" data-act="duplicate" title="Duplikovat">Duplikovat</button>
              <button type="button" data-act="export" title="Exportovat JSON">Export</button>
              <button type="button" data-act="delete" title="Smazat" class="danger">Smazat</button>
            </span>
          </li>`,
          )
          .join("")}
      </ul>
    `
  }

  function openManageViewsModal() {
    openModal(`
      <h3 class="cinnosti-modal-title">Spravovat pohledy</h3>
      <div class="cinnosti-manage-views-body">
        ${renderManageViewsList()}
      </div>
      <hr />
      <details class="cinnosti-modal-import">
        <summary>Importovat pohled z JSON</summary>
        <textarea class="cinnosti-modal-textarea" data-modal-import placeholder='{"id":"user:…","name":"…",…}'></textarea>
        <div class="cinnosti-modal-actions">
          <button type="button" class="cinnosti-modal-btn" data-modal-import-run>Importovat</button>
        </div>
      </details>
      <div class="cinnosti-modal-actions">
        <button type="button" class="cinnosti-modal-btn" data-modal-close>Zavřít</button>
      </div>
    `)
    if (!modalRoot) return

    const body = modalRoot.querySelector(".cinnosti-manage-views-body") as HTMLElement | null
    const refresh = () => {
      if (body) body.innerHTML = renderManageViewsList()
      populateViewSelect()
    }

    modalRoot.querySelector(".cinnosti-manage-views-body")?.addEventListener("click", (ev) => {
      const target = ev.target as HTMLElement
      const btn = target.closest("button[data-act]") as HTMLButtonElement | null
      if (!btn) return
      const li = btn.closest("li[data-view-id]") as HTMLElement | null
      const id = li?.dataset.viewId
      if (!id) return
      const v = userViews.find((u) => u.id === id)
      if (!v) return
      const act = btn.dataset.act
      if (act === "rename") {
        const name = window.prompt("Nový název pohledu:", v.name)
        if (name && name.trim()) {
          renameUserView(id, name)
          refresh()
        }
      } else if (act === "duplicate") {
        const copy: SavedView = {
          ...v,
          id: generateViewId(),
          name: `${v.name} (kopie)`,
        }
        userViews.push(copy)
        saveUserViews()
        refresh()
        showToast(`Pohled duplikován jako „${copy.name}"`)
      } else if (act === "export") {
        const json = JSON.stringify(v, null, 2)
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          navigator.clipboard.writeText(json).then(
            () => showToast("JSON pohledu zkopírován do schránky"),
            () => showToast("Kopírování selhalo — JSON v konzoli"),
          )
        }
        console.info("[cinnosti] Exportovaný pohled", json)
      } else if (act === "delete") {
        if (window.confirm(`Opravdu smazat pohled „${v.name}"?`)) {
          deleteUserView(id)
          refresh()
        }
      }
    })

    const importBtn = modalRoot.querySelector("[data-modal-import-run]") as HTMLButtonElement | null
    const importArea = modalRoot.querySelector("[data-modal-import]") as HTMLTextAreaElement | null
    importBtn?.addEventListener("click", () => {
      const raw = importArea?.value?.trim() ?? ""
      if (!raw) return
      try {
        const parsed = JSON.parse(raw) as SavedView
        if (!parsed || typeof parsed !== "object" || typeof parsed.name !== "string") {
          throw new Error("Invalid shape")
        }
        const nv: SavedView = {
          ...parsed,
          id: generateViewId(),
          kind: "user",
          schemaVersion: 1,
        }
        userViews.push(nv)
        saveUserViews()
        if (importArea) importArea.value = ""
        refresh()
        showToast(`Pohled „${nv.name}" importován`)
      } catch {
        showToast("Import selhal — neplatný JSON")
      }
    })
  }

  viewSaveBtn?.addEventListener("click", () => {
    if (!viewsUiEnabled) return
    openSaveAsModal()
  })
  viewResetBtn?.addEventListener("click", () => {
    if (!viewsUiEnabled) return
    if (window.confirm("Obnovit výchozí stav pohledu? Neuložené úpravy se zahodí.")) {
      resetCurrentView()
    }
  })
  viewShareBtn?.addEventListener("click", () => {
    if (!viewsUiEnabled) return
    shareCurrentState()
  })
  viewManageBtn?.addEventListener("click", () => {
    if (!viewsUiEnabled) return
    openManageViewsModal()
  })

  const onEscClose = (e: KeyboardEvent) => {
    if (e.key === "Escape" && modalRoot?.classList.contains("open")) closeModal()
  }
  document.addEventListener("keydown", onEscClose)
  window.addCleanup(() => document.removeEventListener("keydown", onEscClose))

  updateViewActionState()

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
