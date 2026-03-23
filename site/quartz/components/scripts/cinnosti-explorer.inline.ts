import {
  CinnostiIndex,
  getCinnostGroup,
  getMetaString,
  isCinnostRow,
  normalizePath,
  sortKeyForRow,
} from "./cinnostiShared"
import { FullSlug, resolveRelative } from "../../util/path"

type Row = {
  slug: FullSlug
  title: string
  fp: string
  meta?: Record<string, unknown>
  group: NonNullable<ReturnType<typeof getCinnostGroup>>
}

const GROUP_ORDER: { key: Row["group"]; labelKey: string }[] = [
  { key: "oblasti", labelKey: "lblOblasti" },
  { key: "raci", labelKey: "lblRaci" },
]

let filterListenerAttached = false
let explorerState: { rows: Row[]; currentSlug: FullSlug } | null = null

function resolveUrl(currentSlug: FullSlug, slug: FullSlug): string {
  return new URL(resolveRelative(currentSlug, slug), location.toString()).pathname
}

function renderExplorerList(root: HTMLElement) {
  const groupsEl = root.querySelector(".cinnosti-explorer-groups") as HTMLElement | null
  const filterInput = root.querySelector(".cinnosti-explorer-filter") as HTMLInputElement | null
  if (!groupsEl || !filterInput || !explorerState) return

  const q = filterInput.value.trim().toLowerCase()
  const { rows, currentSlug } = explorerState
  const labels: Record<string, string> = {
    lblOblasti: root.dataset.lblOblasti ?? "Oblasti správy informací",
    lblRaci: root.dataset.lblRaci ?? "RACI činnosti",
  }

  groupsEl.innerHTML = ""
  for (const { key, labelKey } of GROUP_ORDER) {
    const sub = rows.filter((r) => r.group === key && (!q || r.title.toLowerCase().includes(q)))
    if (sub.length === 0) continue

    const section = document.createElement("section")
    section.className = "cinnosti-explorer-group"
    const title = document.createElement("div")
    title.className = "cinnosti-explorer-group-title"
    title.textContent = labels[labelKey] ?? key
    section.appendChild(title)

    const ul = document.createElement("ul")
    ul.className = "cinnosti-explorer-ul"
    for (const r of sub) {
      const oz = getMetaString(r.meta, "oznaceni")
      const li = document.createElement("li")
      const a = document.createElement("a")
      a.href = resolveUrl(currentSlug, r.slug)
      a.textContent = r.title
      if (oz) {
        const idSpan = document.createElement("span")
        idSpan.className = "cinnosti-explorer-id"
        idSpan.textContent = oz + " "
        li.appendChild(idSpan)
      }
      li.appendChild(a)
      ul.appendChild(li)
    }
    section.appendChild(ul)
    groupsEl.appendChild(section)
  }
}

async function setupCinnostiExplorer(currentSlug: FullSlug, data: CinnostiIndex) {
  const root = document.getElementById("cinnosti-explorer")
  if (!root) return

  const seznamLink = root.querySelector(".cinnosti-explorer-seznam") as HTMLAnchorElement | null
  let seznamSlug: FullSlug | null = null
  for (const [slug, d] of Object.entries(data)) {
    if (normalizePath(d.filePath).includes("Seznam-cinnosti.md")) {
      seznamSlug = slug as FullSlug
      break
    }
  }
  if (seznamLink && seznamSlug) {
    seznamLink.href = resolveUrl(currentSlug, seznamSlug)
  }

  const rows: Row[] = []
  for (const [slug, details] of Object.entries(data)) {
    if (!isCinnostRow(details.filePath)) continue
    const g = getCinnostGroup(details.filePath)
    if (!g) continue
    rows.push({
      slug: slug as FullSlug,
      title: details.title ?? slug,
      fp: details.filePath,
      meta: details.meta as Record<string, unknown> | undefined,
      group: g,
    })
  }

  rows.sort((a, b) => {
    const ka = sortKeyForRow(a.meta, a.title)
    const kb = sortKeyForRow(b.meta, b.title)
    if (ka !== kb) return ka.localeCompare(kb, undefined, { numeric: true })
    return a.title.localeCompare(b.title, "cs")
  })

  explorerState = { rows, currentSlug }

  const filterInput = root.querySelector(".cinnosti-explorer-filter") as HTMLInputElement | null
  if (filterInput && !filterListenerAttached) {
    const onInput = () => renderExplorerList(root)
    filterInput.addEventListener("input", onInput)
    window.addCleanup(() => filterInput.removeEventListener("input", onInput))
    filterListenerAttached = true
  }

  renderExplorerList(root)
}

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  const root = document.getElementById("cinnosti-explorer")
  if (!root) return
  const currentSlug = e.detail.url as FullSlug
  const data = (await fetchData) as CinnostiIndex
  await setupCinnostiExplorer(currentSlug, data)
})
