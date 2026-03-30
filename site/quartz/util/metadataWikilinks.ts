import { slug as slugifyHeading } from "github-slugger"
import { FullSlug, resolveRelative } from "./path"
import type { QuartzPluginData } from "../plugins/vfile"

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function normalizePath(fp: string): string {
  return fp.replace(/\\/g, "/")
}

function normalizeWikiPathPart(s: string): string {
  return s
    .trim()
    .replace(/\\/g, "/")
    .replace(/\.md$/i, "")
    .replace(/^\.+\//, "")
}

function normalizeWikiBracketChars(s: string): string {
  return s.replace(/\uFF3B/g, "[").replace(/\uFF3D/g, "]")
}

function displayTextFromWikiInner(inner: string): string {
  const pipe = inner.indexOf("|")
  const targetPart = (pipe >= 0 ? inner.slice(0, pipe) : inner).trim()
  const displayFromPipe = pipe >= 0 ? inner.slice(pipe + 1).trim() : ""
  const hashIdx = targetPart.indexOf("#")
  return (
    displayFromPipe ||
    (hashIdx >= 0 ? targetPart.slice(0, hashIdx) : targetPart).trim() ||
    targetPart
  )
}

const WIKI_RE = /\[\[([^\]]+)\]\]/g

/**
 * Mapuje cíl Obsidian wikilinku na Quartz FullSlug (stejná heuristika jako u tabulky činností).
 */
export function createSlugResolverFromAllFiles(
  allFiles: QuartzPluginData[],
): (pathWithoutAnchor: string) => FullSlug | null {
  const pathToSlug = new Map<string, FullSlug>()
  const basenameToSlugs = new Map<string, FullSlug[]>()
  const titleToSlug = new Map<string, FullSlug>()

  for (const f of allFiles) {
    const slug = f.slug
    if (!slug) continue
    const fp = normalizePath(String(f.filePath ?? ""))
    if (!fp.toLowerCase().endsWith(".md")) continue
    const noExt = fp.replace(/\.md$/i, "")
    pathToSlug.set(noExt, slug)
    const base = noExt.split("/").pop()!
    if (!basenameToSlugs.has(base)) basenameToSlugs.set(base, [])
    basenameToSlugs.get(base)!.push(slug)
    const titleRaw = f.frontmatter?.title
    const title = typeof titleRaw === "string" ? titleRaw.trim() : ""
    if (title) titleToSlug.set(title, slug)
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

/**
 * `[[cíl|alias]]` a prostý text → HTML s odkazy `a.internal` (popover + SPA jako v obsahu).
 */
export function wikiStringToMetadataHtml(
  currentSlug: FullSlug | undefined,
  resolveNote: (pathWithoutAnchor: string) => FullSlug | null,
  raw: string,
): string {
  const normalized = normalizeWikiBracketChars(raw)
  if (!currentSlug) {
    return escapeHtml(normalized)
  }
  const fromSlug = currentSlug
  if (!normalized.includes("[[")) {
    return escapeHtml(normalized)
  }

  function noteHref(targetSlug: FullSlug, headingAnchor: string): string {
    const base = resolveRelative(fromSlug, targetSlug)
    const h = headingAnchor.trim()
    const hash = h !== "" ? "#" + slugifyHeading(h) : ""
    return base + hash
  }

  let out = ""
  let last = 0
  normalized.replace(WIKI_RE, (full, inner: string, offset) => {
    out += escapeHtml(normalized.slice(last, offset))
    last = offset + full.length

    const pipe = inner.indexOf("|")
    const targetPart = (pipe >= 0 ? inner.slice(0, pipe) : inner).trim()

    const hashIdx = targetPart.indexOf("#")
    const pathOnly = hashIdx >= 0 ? targetPart.slice(0, hashIdx) : targetPart
    const anchor = hashIdx >= 0 ? targetPart.slice(hashIdx + 1) : ""

    const slug = resolveNote(pathOnly)
    const display = displayTextFromWikiInner(inner)

    if (!slug) {
      out += escapeHtml(full)
    } else {
      const href = noteHref(slug, anchor)
      out += `<a class="internal" href="${escapeHtml(href)}">${escapeHtml(display)}</a>`
    }
    return ""
  })
  out += escapeHtml(normalized.slice(last))
  return out
}
