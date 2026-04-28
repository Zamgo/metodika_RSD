import { FullSlug, getFullSlug, normalizeRelativeURLs, runtimeSitePath } from "../../util/path"
import { computePosition, flip, inline, shift } from "@floating-ui/dom"
import { fetchCanonical } from "./util"
import type { CinnostiIndex, RowGroupNode } from "./cinnostiShared"
import {
  createNoteSlugResolver,
  escapeHtml,
  getMetaString,
  groupRowsNested,
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
  return runtimeSitePath(currentSlug, targetSlug)
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

function loadGroupBy(slug: FullSlug, idx: number, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(storageKey(LS_OBLAST_GROUP_BY, slug, idx))
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((x: unknown): x is string => typeof x === "string" && !!x.trim())
    }
    if (typeof parsed === "string") return parsed ? [parsed] : []
    return []
  } catch {
    try {
      // Zpětná kompatibilita: dřívější verze ukládala holý řetězec.
      const raw = localStorage.getItem(storageKey(LS_OBLAST_GROUP_BY, slug, idx))
      return raw ? [raw] : fallback
    } catch {
      return fallback
    }
  }
}

function saveGroupBy(slug: FullSlug, idx: number, value: string[]) {
  try {
    localStorage.setItem(storageKey(LS_OBLAST_GROUP_BY, slug, idx), JSON.stringify(value))
  } catch {
    // ignore
  }
}

function collapsedSuffix(groupBy: string[]): string {
  return groupBy.length ? groupBy.join("|") : "_none_"
}

function loadCollapsed(slug: FullSlug, idx: number, groupBy: string[]): Set<string> {
  try {
    const raw = localStorage.getItem(
      storageKey(LS_OBLAST_GROUP_COLLAPSED, slug, idx) + ":" + collapsedSuffix(groupBy),
    )
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveCollapsed(slug: FullSlug, idx: number, groupBy: string[], set: Set<string>) {
  try {
    localStorage.setItem(
      storageKey(LS_OBLAST_GROUP_COLLAPSED, slug, idx) + ":" + collapsedSuffix(groupBy),
      JSON.stringify([...set]),
    )
  } catch {
    // ignore
  }
}

function renderToolbar(columns: OblastColumn[], groupBy: string[], hostIdx: number): string {
  const addPlaceholder = `<option value="">+ Přidat skupinu</option>`
  const inUse = new Set(groupBy)
  const addOpts = columns
    .filter((c) => c.field !== "file.link" && c.field !== "file.name" && !inUse.has(c.field))
    .map((c) => `<option value="${escapeHtml(c.field)}">${escapeHtml(c.alias)}</option>`)
    .join("")
  const chips = groupBy
    .map((field, i) => {
      const label = labelForField(columns, field)
      return `<span class="quartz-oblast-group-chip" data-col="${escapeHtml(field)}"><span class="quartz-oblast-group-chip-idx">${i + 1}</span><span class="quartz-oblast-group-chip-label">${escapeHtml(label)}</span><button type="button" class="quartz-oblast-group-chip-remove" title="Odebrat" aria-label="Odebrat úroveň seskupení">\u2715</button></span>`
    })
    .join("")
  const showHostIdx = escapeHtml(String(hostIdx))
  return `<div class="quartz-oblast-toolbar" data-host-idx="${showHostIdx}"><span class="quartz-oblast-group-filter-title">Seskupit podle</span><div class="quartz-oblast-group-chain"><div class="quartz-oblast-group-chips">${chips}</div><select class="quartz-oblast-group-add" aria-label="Přidat úroveň seskupení">${addPlaceholder}${addOpts}</select></div><button type="button" class="quartz-oblast-expand-all">Rozbalit vše</button><button type="button" class="quartz-oblast-collapse-all">Sbalit vše</button></div>`
}

function renderTableNoGroup(
  headers: string[],
  visibleIdx: number[],
  rows: OblastRenderRow[],
): string {
  const thr = visibleIdx.map((i) => `<th>${escapeHtml(headers[i])}</th>`).join("")
  const trs = rows
    .map(({ cells }) => `<tr>${visibleIdx.map((i) => `<td>${cells[i]}</td>`).join("")}</tr>`)
    .join("")
  return `<div class="quartz-oblast-table-wrap"><table class="quartz-oblast-table"><thead><tr>${thr}</tr></thead><tbody>${trs}</tbody></table></div>`
}

function renderOblastGroupValueHtml(
  node: RowGroupNode<Row & { __cells: string[] }>,
  currentSlug: FullSlug,
  resolve: ReturnType<typeof createNoteSlugResolver>,
): string {
  if (node.empty) return escapeHtml(node.label)
  const raw = getMetaString(node.sampleRow.meta, node.col)
  if (raw.includes("[[")) {
    return metaStringToTableHtml(raw, currentSlug, resolve)
  }
  const resolved = resolve(node.label)
  if (resolved) {
    return `<a class="internal" href="${escapeHtml(noteHref(currentSlug, resolved as FullSlug))}">${escapeHtml(node.label)}</a>`
  }
  return escapeHtml(node.label)
}

function emitGroupNodesHtml(
  nodes: RowGroupNode<Row & { __cells: string[] }>[],
  visibleIdx: number[],
  colspan: number,
  columns: OblastColumn[],
  collapsed: Set<string>,
  parentHidden: boolean,
  currentSlug: FullSlug,
  resolve: ReturnType<typeof createNoteSlugResolver>,
): string {
  let html = ""
  for (const node of nodes) {
    const isCollapsed = collapsed.has(node.id)
    const hiddenByParent = parentHidden
    const collapsedAttr = isCollapsed ? ` data-collapsed="true"` : ""
    const hideStyle = hiddenByParent ? ` style="display:none"` : ""
    const ariaExp = isCollapsed ? "false" : "true"
    const groupLabel = labelForField(columns, node.col)
    const valueHtml = renderOblastGroupValueHtml(node, currentSlug, resolve)
    html += `<tr class="quartz-oblast-group-row" data-group="${escapeHtml(node.id)}" data-depth="${node.depth}"${collapsedAttr}${hideStyle}><td colspan="${colspan}" class="quartz-oblast-group-cell" style="--quartz-oblast-group-depth:${node.depth}"><span class="quartz-oblast-group-cell-inner"><button type="button" class="quartz-oblast-group-toggle" aria-expanded="${ariaExp}" aria-label="Rozbalit nebo sbalit skupinu"><svg class="quartz-oblast-group-chevron" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span class="quartz-oblast-group-info"><span class="quartz-oblast-group-col-label">${escapeHtml(groupLabel)}:</span> <strong class="quartz-oblast-group-value">${valueHtml}</strong></span></span></td></tr>`

    const childHidden = hiddenByParent || isCollapsed

    if (node.rows && node.rows.length > 0) {
      for (const r of node.rows) {
        const hs = childHidden ? ` style="display:none"` : ""
        const tds = visibleIdx
          .map((i, pos) => {
            const styleAttr =
              pos === 0 ? ` style="--quartz-oblast-detail-depth:${node.depth + 1}"` : ""
            return `<td${styleAttr}>${r.__cells[i]}</td>`
          })
          .join("")
        html += `<tr class="quartz-oblast-detail-row" data-group="${escapeHtml(node.id)}" data-depth="${node.depth + 1}"${hs}>${tds}</tr>`
      }
    } else if (node.children) {
      html += emitGroupNodesHtml(
        node.children,
        visibleIdx,
        colspan,
        columns,
        collapsed,
        childHidden,
        currentSlug,
        resolve,
      )
    }
  }
  return html
}

function renderTableWithGroups(
  headers: string[],
  visibleIdx: number[],
  rows: OblastRenderRow[],
  groupBy: string[],
  columns: OblastColumn[],
  collapsed: Set<string>,
  currentSlug: FullSlug,
  resolve: ReturnType<typeof createNoteSlugResolver>,
): string {
  const tree = groupRowsNested(
    rows.map((r) => ({ ...r.row, __cells: r.cells })),
    groupBy,
  )
  const thr = visibleIdx.map((i) => `<th>${escapeHtml(headers[i])}</th>`).join("")
  const body = emitGroupNodesHtml(
    tree,
    visibleIdx,
    visibleIdx.length,
    columns,
    collapsed,
    false,
    currentSlug,
    resolve,
  )
  return `<div class="quartz-oblast-table-wrap"><table class="quartz-oblast-table"><thead><tr>${thr}</tr></thead><tbody>${body}</tbody></table></div>`
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

    // Výchozí groupBy: akceptujeme jen pokud existuje mezi sloupci; jinak prázdné pole.
    const hasDefaultGroupCol = config.columns.some((c) => c.field === DEFAULT_OBLAST_GROUP_BY)
    const fallback: string[] = hasDefaultGroupCol ? [DEFAULT_OBLAST_GROUP_BY] : []
    let groupBy = loadGroupBy(slug, hostIdx, fallback)

    function visibleColIdx(): number[] {
      const groupSet = new Set(groupBy)
      const idx: number[] = []
      config.columns.forEach((c, i) => {
        if (!groupSet.has(c.field)) idx.push(i)
      })
      // Garance že alespoň jeden sloupec zůstane viditelný (fallback: první)
      return idx.length > 0 ? idx : [0]
    }

    function paint() {
      const toolbar = renderToolbar(config.columns, groupBy, hostIdx)
      const vIdx = visibleColIdx()
      if (groupBy.length === 0) {
        host.innerHTML = toolbar + renderTableNoGroup(headers, vIdx, renderRows)
      } else {
        const collapsed = loadCollapsed(slug, hostIdx, groupBy)
        host.innerHTML =
          toolbar +
          renderTableWithGroups(
            headers,
            vIdx,
            renderRows,
            groupBy,
            config.columns,
            collapsed,
            slug,
            resolve,
          )
      }
      attachTablePopovers(host)
    }

    paint()

    // ── Delegované handlery na hostu ───────────────────────────────────
    host.addEventListener("change", (e) => {
      const target = e.target as HTMLElement
      if (!target.classList.contains("quartz-oblast-group-add")) return
      const sel = target as HTMLSelectElement
      const col = sel.value
      if (!col || groupBy.includes(col)) {
        sel.value = ""
        return
      }
      groupBy = [...groupBy, col]
      saveGroupBy(slug, hostIdx, groupBy)
      paint()
    })

    host.addEventListener("click", (e) => {
      const target = e.target as HTMLElement

      const chipRemove = target.closest(".quartz-oblast-group-chip-remove")
      if (chipRemove) {
        const chip = chipRemove.closest(".quartz-oblast-group-chip") as HTMLElement | null
        if (!chip) return
        const col = chip.dataset.col
        if (!col) return
        groupBy = groupBy.filter((c) => c !== col)
        saveGroupBy(slug, hostIdx, groupBy)
        paint()
        return
      }

      const expandAll = target.closest(".quartz-oblast-expand-all")
      if (expandAll) {
        if (groupBy.length === 0) return
        saveCollapsed(slug, hostIdx, groupBy, new Set())
        paint()
        return
      }

      const collapseAll = target.closest(".quartz-oblast-collapse-all")
      if (collapseAll) {
        if (groupBy.length === 0) return
        const all = new Set<string>()
        host.querySelectorAll<HTMLElement>("tr.quartz-oblast-group-row").forEach((tr) => {
          const gid = tr.dataset.group
          if (gid) all.add(gid)
        })
        saveCollapsed(slug, hostIdx, groupBy, all)
        paint()
        return
      }

      // Klikateľný odkaz má prednosť — nezakrývame ho togglom.
      if (target.closest("a")) return
      const tr = target.closest("tr.quartz-oblast-group-row") as HTMLElement | null
      if (!tr) return
      const gid = tr.dataset.group
      if (!gid) return
      const collapsed = loadCollapsed(slug, hostIdx, groupBy)
      if (collapsed.has(gid)) collapsed.delete(gid)
      else collapsed.add(gid)
      saveCollapsed(slug, hostIdx, groupBy, collapsed)
      paint()
    })
  })
}

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  await fillTables(e.detail.url as FullSlug)
})

if (document.querySelector("[data-dv-config]")) {
  void fillTables(getFullSlug(window))
}
