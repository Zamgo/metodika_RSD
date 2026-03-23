import { ContentDetails } from "../../plugins/emitters/contentIndex"

/** Index stránek z contentIndex.json (klíč = slug). */
export type CinnostiIndex = Record<string, ContentDetails & { meta?: Record<string, unknown> }>

export const FOLDER_MARKERS = ["02_Oblasti správy informací/", "07_RACI_cinnosti/"] as const

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

export type CinnostSidebarGroup = "oblasti" | "raci"

export function getCinnostGroup(fp: string): CinnostSidebarGroup | null {
  const p = normalizePath(fp)
  if (p.includes("02_Oblasti správy informací/")) return "oblasti"
  if (p.includes("07_RACI_cinnosti/")) return "raci"
  return null
}
