import { FullSlug, getFullSlug, resolveRelative, normalizeRelativeURLs } from "../../util/path"
import { computePosition, flip, inline, shift } from "@floating-ui/dom"
import { fetchCanonical } from "./util"
import type { CinnostiIndex } from "./cinnostiShared"
import {
  createNoteSlugResolver,
  escapeHtml,
  getMetaString,
  isCinnostRow,
  metaStringToTableHtml,
} from "./cinnostiShared"

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

function renderTable(headers: string[], bodyRows: string[][]): string {
  const thr = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")
  const trs = bodyRows
    .map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")
  return `<div class="quartz-oblast-table-wrap"><table class="quartz-oblast-table"><thead><tr>${thr}</tr></thead><tbody>${trs}</tbody></table></div>`
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

  for (const host of hosts) {
    const configStr = host.dataset.dvConfig
    if (!configStr) continue
    let config: DvConfig
    try {
      config = JSON.parse(configStr)
    } catch {
      continue
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
    const bodyRows = rows.map((r) =>
      config.columns.map((c) => renderCellValue(c.field, r, slug, resolve)),
    )
    host.innerHTML = bodyRows.length
      ? renderTable(headers, bodyRows)
      : `<p class="quartz-oblast-empty">Žádné záznamy.</p>`
    attachTablePopovers(host)
  }
}

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  await fillTables(e.detail.url as FullSlug)
})

if (document.querySelector("[data-dv-config]")) {
  void fillTables(getFullSlug(window))
}
