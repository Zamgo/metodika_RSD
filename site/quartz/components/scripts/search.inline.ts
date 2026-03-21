import FlexSearch, { DefaultDocumentSearchResults } from "flexsearch"
import { ContentDetails } from "../../plugins/emitters/contentIndex"
import { registerEscapeHandler, removeAllChildren } from "./util"
import { FullSlug, normalizeRelativeURLs, resolveRelative } from "../../util/path"

interface Item {
  id: number
  slug: FullSlug
  title: string
  content: string
  tags: string[]
  [key: string]: any
}

type SearchType = "basic" | "tags"
let currentSearchTerm: string = ""

const encoder = (str: string): string[] => {
  const tokens: string[] = []
  let bufferStart = -1
  let bufferEnd = -1
  const lower = str.toLowerCase()

  let i = 0
  for (const char of lower) {
    const code = char.codePointAt(0)!

    const isCJK =
      (code >= 0x3040 && code <= 0x309f) ||
      (code >= 0x30a0 && code <= 0x30ff) ||
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0x20000 && code <= 0x2a6df)

    const isWhitespace = code === 32 || code === 9 || code === 10 || code === 13

    if (isCJK) {
      if (bufferStart !== -1) {
        tokens.push(lower.slice(bufferStart, bufferEnd))
        bufferStart = -1
      }
      tokens.push(char)
    } else if (isWhitespace) {
      if (bufferStart !== -1) {
        tokens.push(lower.slice(bufferStart, bufferEnd))
        bufferStart = -1
      }
    } else {
      if (bufferStart === -1) bufferStart = i
      bufferEnd = i + char.length
    }

    i += char.length
  }

  if (bufferStart !== -1) {
    tokens.push(lower.slice(bufferStart))
  }

  return tokens
}

let index = new FlexSearch.Document<Item>({
  encode: encoder,
  document: {
    id: "id",
    tag: "tags",
    index: [
      { field: "title", tokenize: "forward" },
      { field: "content", tokenize: "forward" },
      { field: "tags", tokenize: "forward" },
    ],
  },
})

const p = new DOMParser()
const fetchContentCache: Map<FullSlug, Element[]> = new Map()
const contextWindowWords = 30
const numSearchResults = 20
const numTagResults = 5

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const META_DIMS = ["faze", "role", "workflow"] as const

const DIM_LABELS_CS: Record<string, string> = {
  faze: "Fáze",
  role: "Role",
  workflow: "Workflow",
}
const DIM_LABELS_EN: Record<string, string> = {
  faze: "Phase",
  role: "Role",
  workflow: "Workflow",
}

function getPageDimValues(slug: FullSlug, dim: string, data: ContentIndex): string[] {
  const d = data[slug]
  if (!d) return []
  const meta = (d as ContentDetails & { meta?: Record<string, unknown> }).meta
  if (!meta) return []
  const v = meta[dim]
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []
}

function pageMatchesFacets(
  slug: FullSlug,
  selected: Map<string, Set<string>>,
  data: ContentIndex,
): boolean {
  for (const [dim, values] of selected) {
    if (values.size === 0) continue
    const pageVals = getPageDimValues(slug, dim, data)
    if (![...values].some((v) => pageVals.includes(v))) return false
  }
  return true
}

type FacetOptions = Map<string, Map<string, number>>

function buildFacetOptions(data: ContentIndex): FacetOptions {
  const out = new Map<string, Map<string, number>>()
  for (const dim of META_DIMS) out.set(dim, new Map())
  for (const details of Object.values<ContentDetails>(data)) {
    const meta = (details as ContentDetails & { meta?: Record<string, unknown> }).meta
    if (meta) {
      for (const k of META_DIMS) {
        const arr = meta[k]
        if (Array.isArray(arr)) {
          const target = out.get(k)!
          for (const x of arr) {
            const s = String(x).trim()
            if (s) target.set(s, (target.get(s) ?? 0) + 1)
          }
        }
      }
    }
  }
  return out
}

function formatTagsForCard(slug: FullSlug, data: ContentIndex): string[] {
  const tags = data[slug]?.tags ?? []
  return tags.slice(0, numTagResults).map((tag: string) => `<li><p>#${escapeHtml(tag)}</p></li>`)
}

const tokenizeTerm = (term: string) => {
  const tokens = term.split(/\s+/).filter((t) => t.trim() !== "")
  const tokenLen = tokens.length
  if (tokenLen > 1) {
    for (let i = 1; i < tokenLen; i++) {
      tokens.push(tokens.slice(0, i + 1).join(" "))
    }
  }
  return tokens.sort((a, b) => b.length - a.length)
}

function highlight(searchTerm: string, text: string, trim?: boolean) {
  const tokenizedTerms = tokenizeTerm(searchTerm)
  let tokenizedText = text.split(/\s+/).filter((t) => t !== "")

  let startIndex = 0
  let endIndex = tokenizedText.length - 1
  if (trim && searchTerm.trim() !== "") {
    const includesCheck = (tok: string) =>
      tokenizedTerms.some((term) => tok.toLowerCase().startsWith(term.toLowerCase()))
    const occurrencesIndices = tokenizedText.map(includesCheck)

    let bestSum = 0
    let bestIndex = 0
    for (let i = 0; i < Math.max(tokenizedText.length - contextWindowWords, 0); i++) {
      const window = occurrencesIndices.slice(i, i + contextWindowWords)
      const windowSum = window.reduce((total, cur) => total + (cur ? 1 : 0), 0)
      if (windowSum >= bestSum) {
        bestSum = windowSum
        bestIndex = i
      }
    }

    startIndex = Math.max(bestIndex - contextWindowWords, 0)
    endIndex = Math.min(startIndex + 2 * contextWindowWords, tokenizedText.length - 1)
    tokenizedText = tokenizedText.slice(startIndex, endIndex)
  }

  const slice = tokenizedText
    .map((tok) => {
      for (const searchTok of tokenizedTerms) {
        if (tok.toLowerCase().includes(searchTok.toLowerCase())) {
          const regex = new RegExp(searchTok.toLowerCase(), "gi")
          return tok.replace(regex, `<span class="highlight">$&</span>`)
        }
      }
      return tok
    })
    .join(" ")

  return `${startIndex === 0 ? "" : "..."}${slice}${
    endIndex === tokenizedText.length - 1 ? "" : "..."
  }`
}

function highlightHTML(searchTerm: string, el: HTMLElement) {
  const parser = new DOMParser()
  const tokenizedTerms = tokenizeTerm(searchTerm)
  const html = parser.parseFromString(el.innerHTML, "text/html")

  const createHighlightSpan = (text: string) => {
    const span = document.createElement("span")
    span.className = "highlight"
    span.textContent = text
    return span
  }

  const highlightTextNodes = (node: Node, term: string) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const nodeText = node.nodeValue ?? ""
      const regex = new RegExp(term.toLowerCase(), "gi")
      const matches = nodeText.match(regex)
      if (!matches || matches.length === 0) return
      const spanContainer = document.createElement("span")
      let lastIndex = 0
      for (const match of matches) {
        const matchIndex = nodeText.indexOf(match, lastIndex)
        spanContainer.appendChild(document.createTextNode(nodeText.slice(lastIndex, matchIndex)))
        spanContainer.appendChild(createHighlightSpan(match))
        lastIndex = matchIndex + match.length
      }
      spanContainer.appendChild(document.createTextNode(nodeText.slice(lastIndex)))
      node.parentNode?.replaceChild(spanContainer, node)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as HTMLElement).classList.contains("highlight")) return
      Array.from(node.childNodes).forEach((child) => highlightTextNodes(child, term))
    }
  }

  for (const term of tokenizedTerms) {
    highlightTextNodes(html.body, term)
  }

  return html.body
}

function getByField(results: DefaultDocumentSearchResults<Item>, field: string): number[] {
  const r = results.filter((x) => x.field === field)
  return r.length === 0 ? [] : ([...r[0].result] as number[])
}

async function setupSearch(searchElement: Element, currentSlug: FullSlug, data: ContentIndex) {
  const host = searchElement as HTMLElement
  const container = searchElement.querySelector(".search-container") as HTMLElement
  if (!container) return

  if (host.dataset.quartzSearchReady === "1") {
    host.dataset.searchBaseSlug = currentSlug
    return
  }
  host.dataset.quartzSearchReady = "1"
  host.dataset.searchBaseSlug = currentSlug

  const sidebar = container.closest(".sidebar") as HTMLElement | null
  const searchButton = searchElement.querySelector(".search-button") as HTMLButtonElement
  if (!searchButton) return
  const searchBar = searchElement.querySelector(".search-bar") as HTMLInputElement
  if (!searchBar) return
  const searchLayout = searchElement.querySelector(".search-layout") as HTMLElement
  if (!searchLayout) return

  const idDataMap = Object.keys(data) as FullSlug[]
  const activeFiltersWrap = searchElement.querySelector(
    ".search-active-filters-wrap",
  ) as HTMLElement | null
  const activeFiltersRoot = searchElement.querySelector(
    ".search-active-filters",
  ) as HTMLElement | null
  const activeFiltersLabel = searchElement.querySelector(
    ".search-active-filters-label",
  ) as HTMLElement | null
  const clearAllFiltersBtn = searchElement.querySelector(
    ".search-clear-all-filters",
  ) as HTMLButtonElement | null

  const noResultsTitle = container.dataset.searchNoResultsTitle ?? "No results."
  const noResultsHint = container.dataset.searchNoResultsHint ?? "Try another search term?"
  const isCs = (container.dataset.searchLocale ?? "").startsWith("cs")
  const dimLabels = isCs ? DIM_LABELS_CS : DIM_LABELS_EN
  const strActiveFilters = container.dataset.strActiveFilters ?? "Active filters"
  const strClearAll = container.dataset.strClearAll ?? "Clear filters"

  if (activeFiltersLabel) activeFiltersLabel.textContent = strActiveFilters + ": "
  if (clearAllFiltersBtn && strClearAll) clearAllFiltersBtn.textContent = strClearAll

  const strDdPlaceholder = container.dataset.strDdPlaceholder ?? "Choose…"
  const strDdN = container.dataset.strDdN ?? "{n} selected"

  function closeAllDdPanels() {
    for (const dd of searchElement.querySelectorAll(".search-facet-dd")) {
      const panel = dd.querySelector(".search-facet-dd-panel") as HTMLElement | null
      const trig = dd.querySelector(".search-facet-dd-trigger") as HTMLButtonElement | null
      panel?.setAttribute("hidden", "")
      trig?.setAttribute("aria-expanded", "false")
    }
  }

  function updateDdTriggerText(dim: string) {
    const dd = searchElement.querySelector(
      `.search-facet-dd[data-dim="${CSS.escape(dim)}"]`,
    ) as HTMLElement | null
    if (!dd) return
    const textEl = dd.querySelector(".search-facet-dd-text") as HTMLElement | null
    if (!textEl) return
    const checked = dd.querySelectorAll<HTMLInputElement>("input.search-facet-dd-cb:checked")
    const n = checked.length
    if (n === 0) {
      textEl.textContent = strDdPlaceholder
      return
    }
    if (n === 1) {
      const v = checked[0]!.dataset.value ?? ""
      textEl.textContent = v
      return
    }
    textEl.textContent = strDdN.replace("{n}", String(n))
  }

  function getSelectedFacets(): Map<string, Set<string>> {
    const out = new Map<string, Set<string>>()
    for (const cb of searchElement.querySelectorAll<HTMLInputElement>(
      "input.search-facet-dd-cb:checked",
    )) {
      const dim = cb.dataset.dim!
      const val = cb.dataset.value ?? ""
      if (!val) continue
      if (!out.has(dim)) out.set(dim, new Set())
      out.get(dim)!.add(val)
    }
    return out
  }

  function syncActiveFiltersBar() {
    if (!activeFiltersRoot || !activeFiltersWrap) return
    const sel = getSelectedFacets()
    let total = 0
    for (const s of sel.values()) total += s.size
    if (total === 0) {
      activeFiltersWrap.hidden = true
      return
    }
    activeFiltersWrap.hidden = false
    removeAllChildren(activeFiltersRoot)
    for (const [dim, values] of sel) {
      const label = dimLabels[dim] ?? dim
      for (const val of values) {
        const chip = document.createElement("span")
        chip.className = "search-active-chip"
        chip.innerHTML = `${escapeHtml(label)}: ${escapeHtml(val)} <button type="button" class="search-active-chip-remove" aria-label="Remove">×</button>`
        const removeBtn = chip.querySelector(".search-active-chip-remove") as HTMLButtonElement
        removeBtn?.addEventListener("click", () => {
          const cb = searchElement.querySelector(
            `input.search-facet-dd-cb[data-dim="${CSS.escape(dim)}"][data-value="${CSS.escape(val)}"]`,
          ) as HTMLInputElement | null
          if (cb) cb.checked = false
          updateDdTriggerText(dim)
          syncActiveFiltersBar()
          runSearch()
        })
        activeFiltersRoot.appendChild(chip)
      }
    }
  }

  function onDocPointerCloseDd(e: PointerEvent) {
    if (!container.classList.contains("active")) return
    const t = e.target
    if (!(t instanceof Element)) return
    if (t.closest(".search-facet-dd")) return
    closeAllDdPanels()
  }

  if (!host.dataset.searchFacetsBuilt) {
    host.dataset.searchFacetsBuilt = "1"
    const options = buildFacetOptions(data)
    for (const dim of META_DIMS) {
      const dd = searchElement.querySelector(
        `.search-facet-dd[data-dim="${dim}"]`,
      ) as HTMLElement | null
      if (!dd) continue
      const list = dd.querySelector(".search-facet-dd-list") as HTMLElement | null
      const filterIn = dd.querySelector(".search-facet-dd-filter") as HTMLInputElement | null
      const trig = dd.querySelector(".search-facet-dd-trigger") as HTMLButtonElement | null
      const panel = dd.querySelector(".search-facet-dd-panel") as HTMLElement | null
      if (!list || !trig || !panel) continue

      const valuesMap = options.get(dim)!
      const entries = [...valuesMap.entries()].sort((a, b) =>
        a[0].localeCompare(b[0], undefined, { sensitivity: "base" }),
      )

      if (entries.length === 0) {
        dd.classList.add("is-empty")
        updateDdTriggerText(dim)
        continue
      }
      dd.classList.remove("is-empty")

      removeAllChildren(list)
      for (const [value, count] of entries) {
        const display = count > 1 ? `${value} (${count})` : value
        const searchText = value.toLowerCase()
        const row = document.createElement("label")
        row.className = "search-facet-dd-row"
        row.setAttribute("data-searchable", searchText)
        const cb = document.createElement("input")
        cb.type = "checkbox"
        cb.className = "search-facet-dd-cb"
        cb.dataset.dim = dim
        cb.dataset.value = value
        const span = document.createElement("span")
        span.className = "search-facet-dd-row-text"
        span.textContent = display
        row.appendChild(cb)
        row.appendChild(span)
        cb.addEventListener("change", () => {
          updateDdTriggerText(dim)
          syncActiveFiltersBar()
          runSearch()
        })
        list.appendChild(row)
      }

      if (filterIn) {
        filterIn.addEventListener("input", () => {
          const q = filterIn.value.trim().toLowerCase()
          for (const row of list.querySelectorAll<HTMLElement>(".search-facet-dd-row")) {
            const s = row.getAttribute("data-searchable") ?? ""
            row.classList.toggle("is-hidden", q !== "" && !s.includes(q))
          }
        })
      }

      trig.addEventListener("click", (e) => {
        e.stopPropagation()
        const isOpen = !panel.hasAttribute("hidden")
        if (isOpen) {
          panel.setAttribute("hidden", "")
          trig.setAttribute("aria-expanded", "false")
        } else {
          closeAllDdPanels()
          panel.removeAttribute("hidden")
          trig.setAttribute("aria-expanded", "true")
          filterIn?.focus()
        }
      })

      updateDdTriggerText(dim)
    }

    document.addEventListener("pointerdown", onDocPointerCloseDd)
    window.addCleanup(() => document.removeEventListener("pointerdown", onDocPointerCloseDd))
  }

  const appendLayout = (el: HTMLElement) => {
    searchLayout.appendChild(el)
  }

  const enablePreview = searchLayout.dataset.preview === "true"
  let preview: HTMLDivElement | undefined
  const results = document.createElement("div")
  results.className = "results-container"
  appendLayout(results)

  if (enablePreview) {
    preview = document.createElement("div")
    preview.className = "preview-container"
    appendLayout(preview)
  }

  function resolveUrl(slug: FullSlug): URL {
    const base = (host.dataset.searchBaseSlug ?? currentSlug) as FullSlug
    return new URL(resolveRelative(base, slug), location.toString())
  }

  function hideSearch() {
    container.classList.remove("active")
    searchBar.value = ""
    searchElement.querySelectorAll<HTMLInputElement>("input.search-facet-dd-cb").forEach((cb) => {
      cb.checked = false
    })
    searchElement.querySelectorAll<HTMLInputElement>(".search-facet-dd-filter").forEach((inp) => {
      inp.value = ""
    })
    searchElement.querySelectorAll<HTMLElement>(".search-facet-dd-row.is-hidden").forEach((row) => {
      row.classList.remove("is-hidden")
    })
    for (const dim of META_DIMS) updateDdTriggerText(dim)
    closeAllDdPanels()
    syncActiveFiltersBar()
    if (sidebar) sidebar.style.zIndex = ""
    removeAllChildren(results)
    if (preview) removeAllChildren(preview)
    searchLayout.classList.remove("display-results")
    searchButton.focus()
  }

  function showSearch() {
    if (sidebar) sidebar.style.zIndex = "1"
    container.classList.add("active")
    container.scrollTop = 0
    searchBar.focus()
  }

  let currentHover: HTMLInputElement | null = null

  function highlightTagsBarMode(term: string, tags: string[]) {
    if (!tags) return []
    return tags
      .map((tag) => {
        if (tag.toLowerCase().includes(term.toLowerCase())) {
          return `<li><p class="match-tag">#${escapeHtml(tag)}</p></li>`
        }
        return `<li><p>#${escapeHtml(tag)}</p></li>`
      })
      .slice(0, numTagResults)
  }

  const formatForDisplay = (
    term: string,
    id: number,
    mode: SearchType,
    tagBarQuery: string,
    showPageTags: boolean,
  ) => {
    const slug = idDataMap[id]
    let cardTags: string[] = []
    if (mode === "tags" && !showPageTags) {
      cardTags = highlightTagsBarMode(tagBarQuery, data[slug]?.tags ?? [])
    } else if (showPageTags) {
      cardTags = formatTagsForCard(slug, data)
    }
    return {
      id,
      slug,
      title:
        mode === "tags" && !showPageTags
          ? escapeHtml(data[slug].title ?? "")
          : highlight(term, data[slug].title ?? ""),
      content: highlight(term, data[slug].content ?? "", true),
      tags: cardTags,
    }
  }

  const resultToHTML = ({ slug, title, content, tags }: Item) => {
    const htmlTags = tags.length > 0 ? `<ul class="tags">${tags.join("")}</ul>` : ``
    const itemTile = document.createElement("a")
    itemTile.classList.add("result-card")
    itemTile.id = slug
    itemTile.href = resolveUrl(slug).toString()
    itemTile.innerHTML = `
      <h3 class="card-title">${title}</h3>
      ${htmlTags}
      <p class="card-description">${content}</p>
    `
    itemTile.addEventListener("click", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      hideSearch()
    })

    const handler = (event: MouseEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      hideSearch()
    }

    async function onMouseEnter(ev: MouseEvent) {
      if (!ev.target) return
      const target = ev.target as HTMLInputElement
      await displayPreview(target)
    }

    itemTile.addEventListener("mouseenter", onMouseEnter)
    window.addCleanup(() => itemTile.removeEventListener("mouseenter", onMouseEnter))
    itemTile.addEventListener("click", handler)
    window.addCleanup(() => itemTile.removeEventListener("click", handler))

    return itemTile
  }

  async function displayResults(finalResults: Item[]) {
    removeAllChildren(results)
    if (finalResults.length === 0) {
      results.innerHTML = `<a class="result-card no-match">
          <h3>${escapeHtml(noResultsTitle)}</h3>
          <p>${escapeHtml(noResultsHint)}</p>
      </a>`
    } else {
      results.append(...finalResults.map(resultToHTML))
    }

    if (finalResults.length === 0 && preview) {
      removeAllChildren(preview)
    } else if (finalResults.length > 0) {
      const firstChild = results.firstElementChild as HTMLElement
      firstChild.classList.add("focus")
      currentHover = firstChild as HTMLInputElement
      await displayPreview(firstChild)
    }
  }

  async function fetchContent(slug: FullSlug): Promise<Element[]> {
    if (fetchContentCache.has(slug)) {
      return fetchContentCache.get(slug) as Element[]
    }
    const targetUrl = resolveUrl(slug).toString()
    const contents = await fetch(targetUrl)
      .then((res) => res.text())
      .then((contents) => {
        if (contents === undefined) {
          throw new Error(`Could not fetch ${targetUrl}`)
        }
        const html = p.parseFromString(contents ?? "", "text/html")
        normalizeRelativeURLs(html, targetUrl)
        return [...html.getElementsByClassName("popover-hint")]
      })
    fetchContentCache.set(slug, contents)
    return contents
  }

  async function displayPreview(el: HTMLElement | null) {
    if (!searchLayout || !enablePreview || !el || !preview) return
    const slug = el.id as FullSlug
    const innerDiv = await fetchContent(slug).then((contents) =>
      contents.flatMap((node) => [
        ...highlightHTML(currentSearchTerm, node as HTMLElement).children,
      ]),
    )
    const previewInner = document.createElement("div")
    previewInner.classList.add("preview-inner")
    previewInner.append(...innerDiv)
    preview.replaceChildren(previewInner)
    const highlights = [...preview.getElementsByClassName("highlight")].sort(
      (a, b) => b.innerHTML.length - a.innerHTML.length,
    )
    highlights[0]?.scrollIntoView({ block: "start" })
  }

  const filterIdsByFacets = (ids: number[], facets: Map<string, Set<string>>): number[] => {
    if (facets.size === 0) return ids
    return ids.filter((id) => pageMatchesFacets(idDataMap[id], facets, data))
  }

  function idsForFacetsOnly(facets: Map<string, Set<string>>): number[] {
    const slugs = idDataMap.filter((slug) => pageMatchesFacets(slug, facets, data))
    slugs.sort((a, b) =>
      (data[a].title ?? "").localeCompare(data[b].title ?? "", undefined, { sensitivity: "base" }),
    )
    return slugs.slice(0, numSearchResults).map((slug) => idDataMap.indexOf(slug))
  }

  async function runSearch() {
    if (!searchLayout || !index) return

    const facets = getSelectedFacets()
    const hasFacets = facets.size > 0 && [...facets.values()].some((s) => s.size > 0)
    const rawValue = searchBar.value
    const showResults = rawValue.trim() !== "" || hasFacets
    searchLayout.classList.toggle("display-results", showResults)

    if (!showResults) {
      removeAllChildren(results)
      if (preview) removeAllChildren(preview)
      return
    }

    let finalIds: number[] = []
    let highlightTerm = ""
    let mode: SearchType = "basic"
    let tagBarQuery = ""
    let showPageTags = false

    if (rawValue.startsWith("#")) {
      let rest = rawValue.slice(1).trim()
      const spaceIdx = rest.indexOf(" ")
      if (spaceIdx !== -1) {
        const singleTag = rest.slice(0, spaceIdx)
        const query = rest.slice(spaceIdx + 1).trim()
        highlightTerm = query
        mode = "basic"
        const searchResults = await index.searchAsync({
          query,
          limit: Math.max(numSearchResults, 10000),
          index: ["title", "content"],
          tag: { tags: singleTag },
        })
        for (const sr of searchResults) {
          sr.result = sr.result.slice(0, numSearchResults * 2)
        }
        const merged = [
          ...new Set([
            ...getByField(searchResults, "title"),
            ...getByField(searchResults, "content"),
          ]),
        ]
        finalIds = filterIdsByFacets(merged, facets).slice(0, numSearchResults)
      } else {
        mode = "tags"
        tagBarQuery = rest
        if (rest === "" && hasFacets) {
          finalIds = idsForFacetsOnly(facets)
          mode = "basic"
          highlightTerm = ""
          showPageTags = true
        } else {
          const searchResults = await index.searchAsync({
            query: rest,
            limit: numSearchResults * 3,
            index: ["tags"],
          })
          let merged = [...new Set(getByField(searchResults, "tags"))]
          merged = filterIdsByFacets(merged, facets).slice(0, numSearchResults)
          finalIds = merged
        }
      }
    } else {
      const query = rawValue.trim()
      if (!hasFacets) {
        if (query === "") {
          removeAllChildren(results)
          if (preview) removeAllChildren(preview)
          return
        }
        const searchResults = await index.searchAsync({
          query,
          limit: numSearchResults,
          index: ["title", "content"],
        })
        finalIds = [
          ...new Set([
            ...getByField(searchResults, "title"),
            ...getByField(searchResults, "content"),
          ]),
        ].slice(0, numSearchResults)
        highlightTerm = query
      } else {
        if (query === "") {
          finalIds = idsForFacetsOnly(facets)
          showPageTags = true
          highlightTerm = ""
        } else {
          highlightTerm = query
          const searchResults = await index.searchAsync({
            query,
            limit: 10000,
            index: ["title", "content"],
          })
          const merged = [
            ...new Set([
              ...getByField(searchResults, "title"),
              ...getByField(searchResults, "content"),
            ]),
          ]
          finalIds = filterIdsByFacets(merged, facets).slice(0, numSearchResults)
        }
      }
    }

    currentSearchTerm = highlightTerm
    const items = finalIds.map((id) =>
      formatForDisplay(highlightTerm, id, mode, tagBarQuery, showPageTags),
    )
    await displayResults(items)

    // Scroll results into view — needed when filter panel is open and pushes results below the fold
    if (items.length > 0 && showResults) {
      searchLayout.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }

  async function shortcutHandler(e: HTMLElementEventMap["keydown"]) {
    if (e.key === "k" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault()
      const open = container.classList.contains("active")
      open ? hideSearch() : showSearch()
      return
    } else if (e.shiftKey && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      const open = container.classList.contains("active")
      open ? hideSearch() : showSearch()
      searchBar.value = "#"
      await runSearch()
      return
    }

    if (currentHover) {
      currentHover.classList.remove("focus")
    }

    if (!container.classList.contains("active")) return
    if (e.key === "Enter" && !e.isComposing) {
      if (results.contains(document.activeElement)) {
        const active = document.activeElement as HTMLInputElement
        if (active.classList.contains("no-match")) return
        await displayPreview(active)
        active.click()
      } else {
        const anchor = document.getElementsByClassName("result-card")[0] as HTMLInputElement | null
        if (!anchor || anchor.classList.contains("no-match")) return
        await displayPreview(anchor)
        anchor.click()
      }
    } else if (e.key === "ArrowUp" || (e.shiftKey && e.key === "Tab")) {
      e.preventDefault()
      if (results.contains(document.activeElement)) {
        const currentResult = currentHover
          ? currentHover
          : (document.activeElement as HTMLInputElement | null)
        const prevResult = currentResult?.previousElementSibling as HTMLInputElement | null
        currentResult?.classList.remove("focus")
        prevResult?.focus()
        if (prevResult) currentHover = prevResult
        await displayPreview(prevResult)
      }
    } else if (e.key === "ArrowDown" || e.key === "Tab") {
      e.preventDefault()
      if (document.activeElement === searchBar || currentHover !== null) {
        const firstResult = currentHover
          ? currentHover
          : (document.getElementsByClassName("result-card")[0] as HTMLInputElement | null)
        const secondResult = firstResult?.nextElementSibling as HTMLInputElement | null
        firstResult?.classList.remove("focus")
        secondResult?.focus()
        if (secondResult) currentHover = secondResult
        await displayPreview(secondResult)
      }
    }
  }

  document.addEventListener("keydown", shortcutHandler)
  window.addCleanup(() => document.removeEventListener("keydown", shortcutHandler))

  registerEscapeHandler(container, hideSearch)

  const panelCloseBtn = searchElement.querySelector(
    ".search-panel-close",
  ) as HTMLButtonElement | null
  function onPanelCloseClick(e: MouseEvent) {
    e.stopPropagation()
    hideSearch()
  }
  panelCloseBtn?.addEventListener("click", onPanelCloseClick)
  window.addCleanup(() => panelCloseBtn?.removeEventListener("click", onPanelCloseClick))

  function onSearchButtonClick(e: MouseEvent) {
    e.stopPropagation()
    if (container.classList.contains("active")) hideSearch()
    else showSearch()
  }
  searchButton.addEventListener("click", onSearchButtonClick)
  window.addCleanup(() => searchButton.removeEventListener("click", onSearchButtonClick))
  searchBar.addEventListener("input", () => runSearch())
  window.addCleanup(() => searchBar.removeEventListener("input", () => runSearch()))

  if (clearAllFiltersBtn) {
    clearAllFiltersBtn.addEventListener("click", () => {
      searchElement.querySelectorAll<HTMLInputElement>("input.search-facet-dd-cb").forEach((cb) => {
        cb.checked = false
      })
      searchElement.querySelectorAll<HTMLInputElement>(".search-facet-dd-filter").forEach((inp) => {
        inp.value = ""
      })
      searchElement
        .querySelectorAll<HTMLElement>(".search-facet-dd-row.is-hidden")
        .forEach((row) => {
          row.classList.remove("is-hidden")
        })
      for (const dim of META_DIMS) updateDdTriggerText(dim)
      closeAllDdPanels()
      syncActiveFiltersBar()
      runSearch()
    })
  }

  await fillDocument(data)
}

let indexPopulated = false
async function fillDocument(data: ContentIndex) {
  if (indexPopulated) return
  let id = 0
  const promises: Array<Promise<unknown>> = []
  for (const [slug, fileData] of Object.entries<ContentDetails>(data)) {
    const docId = id
    promises.push(
      index.addAsync(docId, {
        id: docId,
        slug: slug as FullSlug,
        title: fileData.title,
        content: fileData.content,
        tags: fileData.tags,
      }),
    )
    id++
  }
  await Promise.all(promises)
  indexPopulated = true
}

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  const currentSlug = e.detail.url
  const data = await fetchData
  const searchElement = document.getElementsByClassName("search")
  for (const element of searchElement) {
    await setupSearch(element, currentSlug, data)
  }
})
