import { FullSlug, getFullSlug, resolveRelative, normalizeRelativeURLs } from "../../util/path"
import { computePosition, flip, inline, shift } from "@floating-ui/dom"
import { fetchCanonical } from "./util"
import type { CinnostiIndex } from "./cinnostiShared"
import {
  createNoteSlugResolver,
  escapeHtml,
  getMetaString,
  groupRows,
  isCinnostRow,
  metaStringToTableHtml,
} from "./cinnostiShared"

const LS_OBLAST_GROUP_BY = "oblast-group-by:"
const LS_OBLAST_GROUP_COLLAPSED = "oblast-group-collapsed:"

/** Výchozí seskupení na stránkách procesních oblastí. */
const DEFAULT_OBLAST_GROUP_BY = "cinnost"

interface DvColumn {
  field: string
  alias: string
}

interface DvSort {
  field: string
  dir: "ASC" | "DESC"
}

interface DvConfig {
  columns: DvColumn[]
  filterTyp: string
  linkField: string
  sort: DvSort[]
}

type Row = { slug: FullSlug; title: string; meta?: Record<string, unknown> }

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

// ── Table rendering ──────────────────────────────────────────────────────

function normalizeTyp(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, "")
}

function typMatches(row: Row, expected: string): boolean {
  const t = normalizeTyp(getMetaString(row.meta, "typ"))
  if (t === expected) return true
  if (expected === "cinnost" && t === "činnost") return true
  return false
}

function rowLinkFieldMatchesSlug(
  row: Row,
  fieldName: string,
  currentSlug: FullSlug,
  resolve: ReturnType<typeof createNoteSlugResolver>,
): boolean {
  const raw = getMetaString(row.meta, fieldName)
  if (!raw || !raw.includes("[[")) return false
  const m = raw.match(/\[\[([^\]]+)\]\]/)
  if (!m) return false
  const inner = m[1]
  const pathOnly = inner.split("|")[0].split("#")[0].trim()
  return resolve(pathOnly) === currentSlug
}

function noteHref(currentSlug: FullSlug, targetSlug: FullSlug): string {
  return new URL(resolveRelative(currentSlug, targetSlug), location.toString()).pathname
}

function renderCellValue(
  field: string,
  row: Row,
  currentSlug: FullSlug,
  resolve: ReturnType<typeof createNoteSlugResolver>,
): string {
  if (field === "file.link") {
    const href = noteHref(currentSlug, row.slug)
    return `<a class="internal" href="${escapeHtml(href)}">${escapeHtml(row.title)}</a>`
  }
  if (field === "file.name") {
    return escapeHtml(row.title)
  }
  const raw = getMetaString(row.meta, field)
  if (raw.includes("[[")) {
    return metaStringToTableHtml(raw, currentSlug, resolve)
  }
  return escapeHtml(raw)
}

function getSortValue(field: string, row: Row): string {
  if (field === "file.link" || field === "file.name") {
    return row.title.toLowerCase()
  }
  const raw = getMetaString(row.meta, field)
  const numParts = raw.split(".").map((x) => parseInt(x, 10))
  if (numParts.length > 0 && numParts.every((n) => !isNaN(n))) {
    return numParts.map((n) => n.toString().padStart(6, "0")).join(".")
  }
  return raw.toLowerCase()
}

type OblastRenderRow = { cells: string[]; row: Row }
type OblastColumn = { field: string; alias: string }

function storageKey(prefix: string, slug: FullSlug, idx: number): string {
  return prefix + String(slug) + ":" + idx
}

function loadGroupBy(slug: FullSlug, idx: number, fallback: string): string {
  try {
    const raw = localStorage.getItem(storageKey(LS_OBLAST_GROUP_BY, slug, idx))
    return raw === null ? fallback : raw
  } catch {
    return fallback
  }
}

function saveGroupBy(slug: FullSlug, idx: number, value: string) {
  try {
    localStorage.setItem(storageKey(LS_OBLAST_GROUP_BY, slug, idx), value)
  } catch {
    // ignore
  }
}

function loadCollapsed(slug: FullSlug, idx: number, groupBy: string): Set<string> {
  try {
    const raw = localStorage.getItem(
      storageKey(LS_OBLAST_GROUP_COLLAPSED, slug, idx) + ":" + (groupBy || "_none_"),
    )
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveCollapsed(slug: FullSlug, idx: number, groupBy: string, set: Set<string>) {
  try {
    localStorage.setItem(
      storageKey(LS_OBLAST_GROUP_COLLAPSED, slug, idx) + ":" + (groupBy || "_none_"),
      JSON.stringify([...set]),
    )
  } catch {
    // ignore
  }
}

function renderToolbar(
  columns: OblastColumn[],
  groupBy: string,
  hostIdx: number,
): string {
  const noneOpt = `<option value="">(žádné seskupení)</option>`
  const opts = columns
    .filter((c) => c.field !== "file.link" && c.field !== "file.name")
    .map((c) => {
      const sel = c.field === groupBy ? " selected" : ""
      return `<option value="${escapeHtml(c.field)}"${sel}>${escapeHtml(c.alias)}</option>`
    })
    .join("")
  const showHostIdx = escapeHtml(String(hostIdx))
  return `<div class="quartz-oblast-toolbar" data-host-idx="${showHostIdx}"><label><span>Seskupit podle</span><select class="quartz-oblast-group-select">${noneOpt}${opts}</select></label><button type="button" class="quartz-oblast-expand-all">Rozbalit vše</button><button type="button" class="quartz-oblast-collapse-all">Sbalit vše</button></div>`
}

function renderTableNoGroup(
  headers: string[],
  rows: OblastRenderRow[],
): string {
  const thr = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")
  const trs = rows
    .map(({ cells }) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")
  return `<div class="quartz-oblast-table-wrap"><table class="quartz-oblast-table"><thead><tr>${thr}</tr></thead><tbody>${trs}</tbody></table></div>`
}

function renderTableWithGroups(
  headers: string[],
  rows: OblastRenderRow[],
  groupBy: string,
  groupLabel: string,
  collapsed: Set<string>,
): string {
  const groups = groupRows(rows.map((r) => ({ ...r.row, __cells: r.cells })), groupBy) as {
    id: string
    label: string
    rows: (Row & { __cells: string[] })[]
  }[]
  const thr = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")
  const groupChunks: string[] = []
  for (const g of groups) {
    const isCollapsed = collapsed.has(g.id)
    const collapsedAttr = isCollapsed ? ` data-collapsed="true"` : ""
    const ariaExp = isCollapsed ? "false" : "true"
    const headerTr = `<tr class="quartz-oblast-group-row" data-group="${escapeHtml(g.id)}"${collapsedAttr}><td colspan="${headers.length}"><button type="button" class="quartz-oblast-group-toggle" aria-expanded="${ariaExp}"><span class="quartz-oblast-group-chevron" aria-hidden="true">▾</span><span class="quartz-oblast-group-label"><span class="quartz-oblast-group-col-label">${escapeHtml(groupLabel)}:</span> <strong>${escapeHtml(g.label)}</strong></span><span class="quartz-oblast-group-count">${g.rows.length}</span></button></td></tr>`
    const bodyTrs = g.rows
      .map((r) => {
        const style = isCollapsed ? ` style="display:none"` : ""
        return `<tr class="quartz-oblast-detail-row" data-group="${escapeHtml(g.id)}"${style}>${r.__cells.map((c) => `<td>${c}</td>`).join("")}</tr>`
      })
      .join("")
    groupChunks.push(headerTr + bodyTrs)
  }
  return `<div class="quartz-oblast-table-wrap"><table class="quartz-oblast-table"><thead><tr>${thr}</tr></thead><tbody>${groupChunks.join("")}</tbody></table></div>`
}

function labelForField(columns: OblastColumn[], field: string): string {
  const c = columns.find((col) => col.field === field)
  return c?.alias ?? field
}

async function fillTables(slug: FullSlug) {
  const hosts = document.querySelectorAll<HTMLElement>("[data-dv-config]")
  if (hosts.length === 0) return

  const data = (await fetchData) as CinnostiIndex
  const resolve = createNoteSlugResolver(data)

  const pool: Row[] = []
  for (const [s, details] of Object.entries(data)) {
    if (!isCinnostRow(details.filePath)) continue
    pool.push({
      slug: s as FullSlug,
      title: details.title ?? s,
      meta: details.meta as Record<string, unknown> | undefined,
    })
  }

  hosts.forEach((host, hostIdx) => {
    const configStr = host.dataset.dvConfig
    if (!configStr) return
    let config: DvConfig
    try {
      config = JSON.parse(configStr)
    } catch {
      return
    }

    let rows = pool.filter((r) => {
      if (config.filterTyp && !typMatches(r, config.filterTyp)) return false
      if (config.linkField && !rowLinkFieldMatchesSlug(r, config.linkField, slug, resolve))
        return false
      return true
    })

    if (config.sort.length > 0) {
      rows.sort((a, b) => {
        for (const s of config.sort) {
          const va = getSortValue(s.field, a)
          const vb = getSortValue(s.field, b)
          const cmp = va.localeCompare(vb, "cs", { numeric: true })
          if (cmp !== 0) return s.dir === "DESC" ? -cmp : cmp
        }
        return 0
      })
    }

    const headers = config.columns.map((c) => c.alias)
    const renderRows: OblastRenderRow[] = rows.map((r) => ({
      row: r,
      cells: config.columns.map((c) => renderCellValue(c.field, r, slug, resolve)),
    }))

    if (renderRows.length === 0) {
      host.innerHTML = `<p class="quartz-oblast-empty">Žádné záznamy.</p>`
      return
    }

    // Výchozí groupBy: akceptujeme jen pokud existuje mezi sloupci; jinak prázdný string.
    const hasDefaultGroupCol = config.columns.some((c) => c.field === DEFAULT_OBLAST_GROUP_BY)
    const fallback = hasDefaultGroupCol ? DEFAULT_OBLAST_GROUP_BY : ""
    let groupBy = loadGroupBy(slug, hostIdx, fallback)

    function paint() {
      const toolbar = renderToolbar(config.columns, groupBy, hostIdx)
      if (!groupBy) {
        host.innerHTML = toolbar + renderTableNoGroup(headers, renderRows)
      } else {
        const collapsed = loadCollapsed(slug, hostIdx, groupBy)
        const groupLabel = labelForField(config.columns, groupBy)
        host.innerHTML =
          toolbar + renderTableWithGroups(headers, renderRows, groupBy, groupLabel, collapsed)
      }
      attachTablePopovers(host)
    }

    paint()

    // ── Delegované handlery na hostu ───────────────────────────────────
    host.addEventListener("change", (e) => {
      const target = e.target as HTMLElement
      if (!target.classList.contains("quartz-oblast-group-select")) return
      groupBy = (target as HTMLSelectElement).value || ""
      saveGroupBy(slug, hostIdx, groupBy)
      paint()
    })

    host.addEventListener("click", (e) => {
      const target = e.target as HTMLElement

      const expandAll = target.closest(".quartz-oblast-expand-all")
      if (expandAll) {
        if (!groupBy) return
        saveCollapsed(slug, hostIdx, groupBy, new Set())
        host
          .querySelectorAll<HTMLElement>("tr.quartz-oblast-group-row")
          .forEach((tr) => {
            delete tr.dataset.collapsed
            const btn = tr.querySelector(".quartz-oblast-group-toggle") as HTMLElement | null
            btn?.setAttribute("aria-expanded", "true")
          })
        host
          .querySelectorAll<HTMLElement>("tr.quartz-oblast-detail-row")
          .forEach((tr) => (tr.style.display = ""))
        return
      }

      const collapseAll = target.closest(".quartz-oblast-collapse-all")
      if (collapseAll) {
        if (!groupBy) return
        const all = new Set<string>()
        host
          .querySelectorAll<HTMLElement>("tr.quartz-oblast-group-row")
          .forEach((tr) => {
            const gid = tr.dataset.group
            if (gid) all.add(gid)
            tr.dataset.collapsed = "true"
            const btn = tr.querySelector(".quartz-oblast-group-toggle") as HTMLElement | null
            btn?.setAttribute("aria-expanded", "false")
          })
        host
          .querySelectorAll<HTMLElement>("tr.quartz-oblast-detail-row")
          .forEach((tr) => (tr.style.display = "none"))
        saveCollapsed(slug, hostIdx, groupBy, all)
        return
      }

      const toggle = target.closest(".quartz-oblast-group-toggle") as HTMLElement | null
      if (!toggle) return
      const tr = toggle.closest("tr.quartz-oblast-group-row") as HTMLElement | null
      if (!tr) return
      const gid = tr.dataset.group
      if (!gid) return
      const willCollapse = tr.dataset.collapsed !== "true"
      if (willCollapse) tr.dataset.collapsed = "true"
      else delete tr.dataset.collapsed
      toggle.setAttribute("aria-expanded", willCollapse ? "false" : "true")
      host
        .querySelectorAll<HTMLElement>(
          `tr.quartz-oblast-detail-row[data-group="${CSS.escape(gid)}"]`,
        )
        .forEach((r) => (r.style.display = willCollapse ? "none" : ""))
      const collapsed = loadCollapsed(slug, hostIdx, groupBy)
      if (willCollapse) collapsed.add(gid)
      else collapsed.delete(gid)
      saveCollapsed(slug, hostIdx, groupBy, collapsed)
    })
  })
}

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  await fillTables(e.detail.url as FullSlug)
})

if (document.querySelector("[data-dv-config]")) {
  void fillTables(getFullSlug(window))
}
