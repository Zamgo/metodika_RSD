import { ContentDetails } from "../../plugins/emitters/contentIndex"
import { FullSlug, resolveRelative } from "../../util/path"

type CinnostiIndex = Record<string, ContentDetails & { meta?: Record<string, unknown> }>

const FOLDER_MARKERS = ["02_Oblasti správy informací/", "07_RACI_cinnosti/"]

const FILTER_DIMS = ["zdroj_typ", "typ"] as const
const ARRAY_DIMS = ["faze", "role"] as const

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function normalizePath(fp: string): string {
  return fp.replace(/\\/g, "/")
}

function isCinnostRow(fp: string): boolean {
  const p = normalizePath(fp)
  if (p.includes("Seznam-cinnosti.md")) return false
  return FOLDER_MARKERS.some((m) => p.includes(m)) && p.endsWith(".md")
}

function getMetaString(meta: Record<string, unknown> | undefined, key: string): string {
  if (!meta) return ""
  const v = meta[key]
  if (v == null) return ""
  if (Array.isArray(v)) return v.join(", ")
  return String(v).trim()
}

function getMetaArray(meta: Record<string, unknown> | undefined, key: string): string[] {
  if (!meta) return []
  const v = meta[key]
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  if (typeof v === "string" && v.trim()) return [v.trim()]
  return []
}

function rowMatchesFilters(
  meta: Record<string, unknown> | undefined,
  textQ: string,
  selected: Map<string, Set<string>>,
  title: string,
): boolean {
  const tq = textQ.trim().toLowerCase()
  if (tq && !title.toLowerCase().includes(tq)) return false

  for (const dim of FILTER_DIMS) {
    const want = selected.get(dim)
    if (!want || want.size === 0) continue
    const val = getMetaString(meta, dim)
    if (!want.has(val)) return false
  }

  for (const dim of ARRAY_DIMS) {
    const want = selected.get(dim)
    if (!want || want.size === 0) continue
    const vals = getMetaArray(meta, dim)
    if (![...want].some((w) => vals.includes(w))) return false
  }

  return true
}

function collectOptions(data: CinnostiIndex): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>()
  for (const dim of [...FILTER_DIMS, ...ARRAY_DIMS]) out.set(dim, new Set())

  for (const details of Object.values(data)) {
    if (!isCinnostRow(details.filePath)) continue
    const meta = details.meta as Record<string, unknown> | undefined
    if (!meta) continue
    for (const dim of FILTER_DIMS) {
      const v = getMetaString(meta, dim)
      if (v) out.get(dim)!.add(v)
    }
    for (const dim of ARRAY_DIMS) {
      for (const v of getMetaArray(meta, dim)) {
        out.get(dim)!.add(v)
      }
    }
  }
  return out
}

function sortKeyForRow(meta: Record<string, unknown> | undefined, title: string): string {
  const oz = getMetaString(meta, "oznaceni")
  if (oz) {
    const parts = oz.split(".").map((x) => parseInt(x, 10) || 0)
    return parts.map((n) => n.toString().padStart(6, "0")).join(".")
  }
  return "zzz" + title.toLowerCase()
}

async function setupCinnosti(root: HTMLElement, currentSlug: FullSlug, data: CinnostiIndex) {
  const tbody = root.querySelector(".cinnosti-tbody") as HTMLElement
  const textInput = root.querySelector(".cinnosti-filter-text") as HTMLInputElement
  const countEl = root.querySelector(".cinnosti-count") as HTMLElement
  const clearBtn = root.querySelector(".cinnosti-clear-filters") as HTMLButtonElement
  if (!tbody || !textInput || !countEl) return

  const rows: { slug: FullSlug; title: string; fp: string; meta?: Record<string, unknown> }[] = []
  for (const [slug, details] of Object.entries(data)) {
    if (!isCinnostRow(details.filePath)) continue
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

  const options = collectOptions(data)
  const selected = new Map<string, Set<string>>()
  for (const dim of [...FILTER_DIMS, ...ARRAY_DIMS]) selected.set(dim, new Set())

  const ds = root.dataset

  function render() {
    const textQ = textInput.value
    tbody.innerHTML = ""
    let n = 0
    for (const row of rows) {
      if (!rowMatchesFilters(row.meta, textQ, selected, row.title)) continue
      n++
      const m = row.meta
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td class="cinnosti-col-title"><a href="${escapeHtml(resolveUrl(row.slug))}">${escapeHtml(row.title)}</a></td>
        <td>${escapeHtml(getMetaString(m, "oznaceni"))}</td>
        <td>${escapeHtml(getMetaString(m, "typ"))}</td>
        <td>${escapeHtml(getMetaString(m, "zdroj_typ"))}</td>
        <td class="cinnosti-col-zdroj">${escapeHtml(getMetaString(m, "zdroj"))}</td>
        <td>${escapeHtml(getMetaString(m, "faze"))}</td>
        <td>${escapeHtml(getMetaString(m, "role"))}</td>
        <td>${escapeHtml(getMetaString(m, "raci_poverejici"))}</td>
        <td>${escapeHtml(getMetaString(m, "raci_vedouci_poverena"))}</td>
        <td>${escapeHtml(getMetaString(m, "raci_poverena"))}</td>
        <td>${escapeHtml(getMetaString(m, "raci_spravce_stavby"))}</td>
        <td>${escapeHtml(getMetaString(m, "raci_bim_koordinator"))}</td>
        <td>${escapeHtml(getMetaString(m, "stav"))}</td>
      `
      tbody.appendChild(tr)
    }
    countEl.textContent = String(n)
  }

  function resolveUrl(slug: FullSlug): string {
    return new URL(resolveRelative(currentSlug, slug), location.toString()).pathname
  }

  const dimLabels: Record<string, string> = {
    typ: ds.strTyp ?? "Typ",
    zdroj_typ: ds.strZdrojTyp ?? "Typ zdroje",
    faze: ds.strFaze ?? "Fáze",
    role: ds.strRole ?? "Role",
  }

  for (const dim of [...FILTER_DIMS, ...ARRAY_DIMS]) {
    const wrap = root.querySelector(`.cinnosti-filter[data-dim="${CSS.escape(dim)}"]`) as HTMLElement | null
    if (!wrap) continue
    const select = wrap.querySelector("select") as HTMLSelectElement
    if (!select) continue
    const vals = [...(options.get(dim) ?? new Set())].sort((a, b) => a.localeCompare(b, "cs"))
    const placeholder = dimLabels[dim] ?? dim
    select.innerHTML =
      `<option value="">${escapeHtml(placeholder)}</option>` +
      vals.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("")

    const onChange = () => {
      const s = selected.get(dim)!
      s.clear()
      if (select.value) s.add(select.value)
      render()
    }
    select.addEventListener("change", onChange)
    window.addCleanup(() => select.removeEventListener("change", onChange))
  }

  const onInput = () => render()
  textInput.addEventListener("input", onInput)
  window.addCleanup(() => textInput.removeEventListener("input", onInput))

  const onClear = () => {
    textInput.value = ""
    for (const dim of [...FILTER_DIMS, ...ARRAY_DIMS]) {
      selected.get(dim)!.clear()
      const wrap = root.querySelector(`.cinnosti-filter[data-dim="${CSS.escape(dim)}"]`) as HTMLElement | null
      const sel = wrap?.querySelector("select") as HTMLSelectElement | null
      if (sel) sel.value = ""
    }
    render()
  }
  clearBtn?.addEventListener("click", onClear)
  window.addCleanup(() => clearBtn?.removeEventListener("click", onClear))

  render()
}

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  const root = document.getElementById("cinnosti-browser")
  if (!root) return
  const currentSlug = e.detail.url as FullSlug
  const data = (await fetchData) as CinnostiIndex
  await setupCinnosti(root, currentSlug, data)
})
