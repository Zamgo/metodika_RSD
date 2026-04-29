import { ContentDetails } from "../../plugins/emitters/contentIndex"
import { slug as slugAnchor } from "github-slugger"
import { runtimeSitePath, type FullSlug } from "../../util/path"

/** Index stránek z contentIndex.json (klíč = slug). */
export type CinnostiIndex = Record<string, ContentDetails & { meta?: Record<string, unknown> }>

export const FOLDER_MARKERS = [
  "03_Oblasti správy informací/",
  "03_Katalog všech činností/",
] as const
export const CDE_WORKFLOW_FOLDER = "05_Knihovna průvodce/CDE workflow/"

export function normalizePath(fp: string): string {
  return fp.replace(/\\/g, "/")
}

/** Stejný výběr souborů jako Obsidian Bases `Cinnosti.base`. */
export function isCinnostRow(fp: string): boolean {
  const p = normalizePath(fp)
  if (p.includes("Seznam-cinnosti.md")) return false
  return FOLDER_MARKERS.some((m) => p.includes(m)) && p.endsWith(".md")
}

/** Řádky pro přehled CDE workflow (srov. `03 - CDE workflow.base`). */
export function isCdeWorkflowRow(fp: string): boolean {
  const p = normalizePath(fp)
  if (p.includes("03 - CDE workflow.md")) return false
  return p.includes(CDE_WORKFLOW_FOLDER) && p.endsWith(".md")
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
  if (FOLDER_MARKERS.some((marker) => p.includes(marker))) return "oblasti"
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

/** Placeholder pro prázdnou hodnotu skupiny. */
export const EMPTY_GROUP_LABEL = "(prázdné)"

/** Bezpečný klíč pro `data-group` atribut (stabilní napříč render voláními). */
export function hashGroupKey(key: string): string {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

/**
 * Vrátí řetězec použitý pro zařazení řádku do skupiny.
 * Pro wikilinky vytáhne zobrazovaný text (bez [[]] a |aliasu),
 * u multihodnotových polí bere první neprázdnou hodnotu.
 */
export function getGroupValue<T extends { meta?: Record<string, unknown>; title?: string }>(
  row: T,
  col: string,
): string {
  if (col === "file.name") return (row.title ?? "").trim()
  if (col === "formula.dilci_cinnost") {
    const typ = getMetaString(row.meta, "typ")
    if (typ !== "ukol") return ""
    return (row.title ?? "").trim()
  }
  const arr = getMetaArray(row.meta, col)
  if (arr.length > 0) {
    const first = plainTextFromWikiMeta(arr[0]).trim()
    return first
  }
  const single = getMetaString(row.meta, col)
  if (!single) return ""
  return plainTextFromWikiMeta(single).trim()
}

export type RowGroup<T> = {
  /** Hash-bezpečný identifikátor do DOM (data-group). */
  id: string
  /** Raw label (prázdné → EMPTY_GROUP_LABEL). */
  label: string
  /** Zda jde o fallback "(prázdné)" skupinu (řadí se vždy dolů). */
  empty: boolean
  rows: T[]
}

/**
 * Rozdělí již setříděné řádky do skupin podle `col`.
 * Pořadí skupin respektuje pořadí prvního výskytu ve vstupu (to umožňuje řídit ho existujícím sortem),
 * fallback "(prázdné)" skupina se umístí vždy na konec.
 */
export function groupRows<T extends { meta?: Record<string, unknown>; title?: string }>(
  rows: T[],
  col: string,
): RowGroup<T>[] {
  const order: string[] = []
  const map = new Map<string, RowGroup<T>>()
  for (const row of rows) {
    const raw = getGroupValue(row, col)
    const isEmpty = !raw
    const label = isEmpty ? EMPTY_GROUP_LABEL : raw
    if (!map.has(label)) {
      order.push(label)
      map.set(label, { id: hashGroupKey(label), label, empty: isEmpty, rows: [] })
    }
    map.get(label)!.rows.push(row)
  }
  const nonEmpty: RowGroup<T>[] = []
  let empty: RowGroup<T> | null = null
  for (const l of order) {
    const g = map.get(l)!
    if (g.empty) empty = g
    else nonEmpty.push(g)
  }
  return empty ? [...nonEmpty, empty] : nonEmpty
}

/**
 * Uzel stromu víceúrovňového seskupení.
 * - `rows` jsou vyplněné jen v listových uzlech (tj. na poslední úrovni cols).
 * - `children` jsou jen v non-listových.
 */
export type RowGroupNode<T> = {
  /** Cestou sestavený stabilní identifikátor (parentId/ownId) pro `data-group`. */
  id: string
  label: string
  /** Sloupec podle kterého je tato úroveň seskupena. */
  col: string
  empty: boolean
  /** 0-indexovaná hloubka (0 = kořenová skupina). */
  depth: number
  /** První řádek dané skupiny pro případné odvození raw metadata hodnoty. */
  sampleRow: T
  rows?: T[]
  children?: RowGroupNode<T>[]
}

/**
 * Víceúrovňové seskupení. Vstupem je pole sloupců (první = nejvnější).
 * Respektuje pořadí ze vstupu (po setřídění volajícím) v každé úrovni a
 * "(prázdné)" skupina je vždy jako poslední v dané úrovni.
 */
export function groupRowsNested<T extends { meta?: Record<string, unknown>; title?: string }>(
  rows: T[],
  cols: string[],
  depth = 0,
  parentId = "",
): RowGroupNode<T>[] {
  if (cols.length === 0) return []
  const [first, ...rest] = cols
  const top = groupRows(rows, first)
  return top.map((g) => {
    const id = parentId ? `${parentId}/${g.id}` : g.id
    if (rest.length === 0) {
      return {
        id,
        label: g.label,
        col: first,
        empty: g.empty,
        depth,
        sampleRow: g.rows[0]!,
        rows: g.rows,
      }
    }
    return {
      id,
      label: g.label,
      col: first,
      empty: g.empty,
      depth,
      sampleRow: g.rows[0]!,
      children: groupRowsNested(g.rows, rest, depth + 1, id),
    }
  })
}

/**
 * Pojmenovaný pohled (view) pro tabulku činností.
 * - `base` = pohled definovaný v `.base` souboru (read-only, id = `base:<name>`)
 * - `preset` = shipped read-only doporučený pohled (id = `preset:<slug>`)
 * - `user` = uživatelem uložený pohled (id = `user:<uuid>`)
 */
export type SavedView = {
  id: string
  name: string
  kind: "base" | "preset" | "user"
  /** Název `.base` view, z níž pohled dědí filtry a pořadí sloupců. */
  baseView: string
  groupBy: string[]
  hiddenCols: string[]
  colOrder?: string[]
  colWidths?: Record<string, number>
  sort?: { col: string; dir: "asc" | "desc" } | null
  schemaVersion: 1
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

/** Plnotvárné Unicode závorky (někdy z copy-paste / jiného editoru) → ASCII pro parsování odkazů. */
function normalizeWikiBracketChars(s: string): string {
  return s.replace(/\uFF3B/g, "[").replace(/\uFF3D/g, "]")
}

/** Text u odkazu v buňce i ve filtru — stejné pravidlo jako u `[[cíl|alias]]` / `[[cíl#nadpis]]`. */
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

/**
 * Čitelný řetězec pro popisky ve filtru sloupce (bez `[[` … `|` … `]]`).
 * Nový `RegExp` na volání — bez sdíleného `/g` a `lastIndex` napříč voláními.
 */
export function plainTextFromWikiMeta(raw: string | number | unknown): string {
  const s = normalizeWikiBracketChars(String(raw ?? ""))
  if (!s.includes("[[")) return s
  return s.replace(new RegExp("\\[\\[([^\\]]+)\\]\\]", "g"), (_, inner: string) =>
    displayTextFromWikiInner(inner),
  )
}

/**
 * Obsidian `[[cíl|alias]]` → klikatelné odkazy na stránky Quartz.
 */
export function metaStringToTableHtml(
  raw: string,
  currentSlug: FullSlug,
  resolveNote: (pathWithoutAnchor: string) => FullSlug | null,
): string {
  const normalized = normalizeWikiBracketChars(raw)
  if (!normalized.includes("[[")) return escapeHtml(normalized)

  function noteHref(targetSlug: FullSlug, headingAnchor: string): string {
    const path = runtimeSitePath(currentSlug, targetSlug)
    const h = headingAnchor.trim()
    const hash = h !== "" ? "#" + slugAnchor(h) : ""
    return path + hash
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
