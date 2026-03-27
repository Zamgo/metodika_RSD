import { FullSlug, getFullSlug, resolveRelative } from "../../util/path"
import type { CinnostiIndex } from "./cinnostiShared"
import {
  createNoteSlugResolver,
  escapeHtml,
  getMetaString,
  isCinnostRow,
  metaStringToTableHtml,
  plainTextFromWikiMeta,
  sortKeyForRow,
} from "./cinnostiShared"

type Row = { slug: FullSlug; title: string; meta?: Record<string, unknown> }

function normalizeTyp(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, "")
}

function typMatches(row: Row, expected: "pracovni_balicek" | "cinnost"): boolean {
  const t = normalizeTyp(getMetaString(row.meta, "typ"))
  if (t === expected) return true
  if (expected === "cinnost" && t === "činnost") return true
  return false
}

function rowMatchesOblast(
  row: Row,
  currentSlug: FullSlug,
  resolve: ReturnType<typeof createNoteSlugResolver>,
): boolean {
  const raw = getMetaString(row.meta, "procesni_oblast")
  if (!raw || !raw.includes("[[")) return false
  const m = raw.match(/\[\[([^\]]+)\]\]/)
  if (!m) return false
  const inner = m[1]
  const pathOnly = inner.split("|")[0].split("#")[0].trim()
  return resolve(pathOnly) === currentSlug
}

function rowMatchesBalicek(
  row: Row,
  currentSlug: FullSlug,
  resolve: ReturnType<typeof createNoteSlugResolver>,
): boolean {
  const raw = getMetaString(row.meta, "pracovni_balicek")
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

function renderTable(headers: string[], bodyRows: string[][]): string {
  const thr = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")
  const trs = bodyRows
    .map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")
  return `<div class="quartz-oblast-table-wrap"><table class="quartz-oblast-table"><thead><tr>${thr}</tr></thead><tbody>${trs}</tbody></table></div>`
}

async function fillTables(slug: FullSlug) {
  const hosts = document.querySelectorAll<HTMLElement>("[data-oblast-dv]")
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
    const variant = host.dataset.oblastDv
    const wantTyp =
      variant === "balicky"
        ? "pracovni_balicek"
        : variant === "cinnosti" || variant === "balicek-cinnosti"
          ? "cinnost"
          : null
    if (!wantTyp) continue

    let rows = pool.filter((r) => {
      if (!typMatches(r, wantTyp)) return false
      if (variant === "balicek-cinnosti") return rowMatchesBalicek(r, slug, resolve)
      return rowMatchesOblast(r, slug, resolve)
    })

    if (wantTyp === "pracovni_balicek") {
      rows.sort((a, b) => {
        const ka = sortKeyForRow(a.meta, a.title)
        const kb = sortKeyForRow(b.meta, b.title)
        if (ka !== kb) return ka.localeCompare(kb, undefined, { numeric: true })
        return a.title.localeCompare(b.title, "cs")
      })
      const bodyRows = rows.map((r) => {
        const link = `<a class="internal" href="${escapeHtml(noteHref(slug, r.slug))}">${escapeHtml(r.title)}</a>`
        const oz = escapeHtml(getMetaString(r.meta, "oznaceni"))
        return [link, oz]
      })
      host.innerHTML = bodyRows.length
        ? renderTable(["Pracovní balíček", "Označení"], bodyRows)
        : `<p class="quartz-oblast-empty">Žádné záznamy.</p>`
    } else if (variant === "balicek-cinnosti") {
      rows.sort((a, b) => {
        const ka = sortKeyForRow(a.meta, a.title)
        const kb = sortKeyForRow(b.meta, b.title)
        if (ka !== kb) return ka.localeCompare(kb, undefined, { numeric: true })
        return a.title.localeCompare(b.title, "cs")
      })
      const bodyRows = rows.map((r) => {
        const link = `<a class="internal" href="${escapeHtml(noteHref(slug, r.slug))}">${escapeHtml(r.title)}</a>`
        const oz = escapeHtml(getMetaString(r.meta, "oznaceni"))
        return [link, oz]
      })
      host.innerHTML = bodyRows.length
        ? renderTable(["Činnost", "Označení"], bodyRows)
        : `<p class="quartz-oblast-empty">Žádné záznamy.</p>`
    } else {
      rows.sort((a, b) => {
        const pa = plainTextFromWikiMeta(getMetaString(a.meta, "pracovni_balicek"))
        const pb = plainTextFromWikiMeta(getMetaString(b.meta, "pracovni_balicek"))
        if (pa !== pb) return pa.localeCompare(pb, "cs")
        const ka = sortKeyForRow(a.meta, a.title)
        const kb = sortKeyForRow(b.meta, b.title)
        if (ka !== kb) return ka.localeCompare(kb, undefined, { numeric: true })
        return a.title.localeCompare(b.title, "cs")
      })
      const bodyRows = rows.map((r) => {
        const link = `<a class="internal" href="${escapeHtml(noteHref(slug, r.slug))}">${escapeHtml(r.title)}</a>`
        const oz = escapeHtml(getMetaString(r.meta, "oznaceni"))
        const pb = metaStringToTableHtml(getMetaString(r.meta, "pracovni_balicek"), slug, resolve)
        return [link, oz, pb]
      })
      host.innerHTML = bodyRows.length
        ? renderTable(["Činnost", "Označení", "Pracovní balíček"], bodyRows)
        : `<p class="quartz-oblast-empty">Žádné záznamy.</p>`
    }
  }
}

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  await fillTables(e.detail.url as FullSlug)
})

if (document.querySelector("[data-oblast-dv]")) {
  void fillTables(getFullSlug(window))
}
