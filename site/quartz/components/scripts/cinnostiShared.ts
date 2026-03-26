import { ContentDetails } from "../../plugins/emitters/contentIndex"
import { slug as slugAnchor } from "github-slugger"
import { resolveRelative, type FullSlug } from "../../util/path"

/** Index stránek z contentIndex.json (klíč = slug). */
export type CinnostiIndex = Record<string, ContentDetails & { meta?: Record<string, unknown> }>

export const FOLDER_MARKERS = ["03_Oblasti správy informací/"] as const

export function normalizePath(fp: string): string {
  return fp.replace(/\\/g, "/")
}

/** Stejný výběr souborů jako Obsidian Bases `Cinnosti.base`. */
export function isCinnostRow(fp: string): boolean {
  const p = normalizePath(fp)
  if (p.includes("Seznam-cinnosti.md")) return false
  return FOLDER_MARKERS.some((m) => p.includes(m)) && p.endsWith(".md")
}

export function getMetaString(meta: Record<string, unknown> | undefined, key: string): string {
  if (!meta) return ""
  const v = meta[key]
  if (v == null) return ""
  if (Array.isArray(v)) return v.join(", ")
  return String(v).trim()
}

export function getMetaArray(meta: Record<string, unknown> | undefined, key: string): string[] {
  if (!meta) return []
  const v = meta[key]
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  if (typeof v === "string" && v.trim()) return [v.trim()]
  return []
}

export function sortKeyForRow(meta: Record<string, unknown> | undefined, title: string): string {
  const oz = getMetaString(meta, "oznaceni")
  if (oz) {
    const parts = oz.split(".").map((x) => parseInt(x, 10) || 0)
    return parts.map((n) => n.toString().padStart(6, "0")).join(".")
  }
  return "zzz" + title.toLowerCase()
}

export type CinnostSidebarGroup = "oblasti"

export function getCinnostGroup(fp: string): CinnostSidebarGroup | null {
  const p = normalizePath(fp)
  if (p.includes("03_Oblasti správy informací/")) return "oblasti"
  return null
}

/** Escaping pro text / href uvnitř tabulky činností. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function normalizeWikiPathPart(s: string): string {
  return s
    .trim()
    .replace(/\\/g, "/")
    .replace(/\.md$/i, "")
    .replace(/^\.+\//, "")
}

/**
 * Mapuje cíl Obsidian wikilinku (bez #kotvy) na Quartz FullSlug podle contentIndexu.
 */
export function createNoteSlugResolver(
  data: CinnostiIndex,
): (pathWithoutAnchor: string) => FullSlug | null {
  const pathToSlug = new Map<string, FullSlug>()
  const basenameToSlugs = new Map<string, FullSlug[]>()
  const titleToSlug = new Map<string, FullSlug>()

  for (const [slug, details] of Object.entries(data)) {
    const fp = normalizePath(details.filePath)
    if (!fp.toLowerCase().endsWith(".md")) continue
    const noExt = fp.replace(/\.md$/i, "")
    pathToSlug.set(noExt, slug as FullSlug)
    const base = noExt.split("/").pop()!
    if (!basenameToSlugs.has(base)) basenameToSlugs.set(base, [])
    basenameToSlugs.get(base)!.push(slug as FullSlug)
    const title = details.title?.trim()
    if (title) titleToSlug.set(title, slug as FullSlug)
  }

  return (rawTarget: string): FullSlug | null => {
    const t = normalizeWikiPathPart(rawTarget)
    if (!t) return null

    const direct = pathToSlug.get(t)
    if (direct) return direct

    const byTitle = titleToSlug.get(t)
    if (byTitle) return byTitle

    if (!t.includes("/")) {
      const list = basenameToSlugs.get(t)
      if (list?.length === 1) return list[0]
    }

    let found: FullSlug | null = null
    for (const [p, s] of pathToSlug) {
      if (p === t || p.endsWith("/" + t)) {
        if (found != null && found !== s) return null
        found = s
      }
    }
    return found
  }
}

const WIKI_RE = /\[\[([^\]]+)\]\]/g

/**
 * Obsidian `[[cíl|alias]]` → klikatelné odkazy na stránky Quartz.
 */
export function metaStringToTableHtml(
  raw: string,
  currentSlug: FullSlug,
  resolveNote: (pathWithoutAnchor: string) => FullSlug | null,
): string {
  if (!raw.includes("[[")) return escapeHtml(raw)

  function noteHref(targetSlug: FullSlug, headingAnchor: string): string {
    const path = new URL(resolveRelative(currentSlug, targetSlug), location.toString()).pathname
    const h = headingAnchor.trim()
    const hash = h !== "" ? "#" + slugAnchor(h) : ""
    return path + hash
  }

  let out = ""
  let last = 0
  raw.replace(WIKI_RE, (full, inner: string, offset) => {
    out += escapeHtml(raw.slice(last, offset))
    last = offset + full.length

    const pipe = inner.indexOf("|")
    const targetPart = (pipe >= 0 ? inner.slice(0, pipe) : inner).trim()
    const displayFromPipe = pipe >= 0 ? inner.slice(pipe + 1).trim() : ""

    const hashIdx = targetPart.indexOf("#")
    const pathOnly = hashIdx >= 0 ? targetPart.slice(0, hashIdx) : targetPart
    const anchor = hashIdx >= 0 ? targetPart.slice(hashIdx + 1) : ""

    const slug = resolveNote(pathOnly)
    const display =
      displayFromPipe ||
      (hashIdx >= 0 ? targetPart.slice(0, hashIdx) : targetPart).trim() ||
      pathOnly

    if (!slug) {
      out += escapeHtml(full)
    } else {
      const href = noteHref(slug, anchor)
      out += `<a href="${escapeHtml(href)}">${escapeHtml(display)}</a>`
    }
    return ""
  })
  out += escapeHtml(raw.slice(last))
  return out
}
