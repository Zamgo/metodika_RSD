type IndexItem = {
  title?: string
  content?: string
  tags?: string[]
}

type ContentIndex = Record<string, IndexItem>

let indexPromise: Promise<ContentIndex> | null = null
const pagePreviewCache = new Map<string, string>()

function getContentIndex(): Promise<ContentIndex> {
  if (!indexPromise) {
    indexPromise = fetch("/static/contentIndex.json")
      .then((res) => {
        if (!res.ok) throw new Error("Nepodarilo se nacist index vyhledavani")
        return res.json() as Promise<ContentIndex>
      })
      .catch(() => ({}))
  }
  return indexPromise
}

function wireHeroSearch() {
  const root = document.querySelector<HTMLElement>(".home-landing")
  if (!root) return

  const heroInput = root.querySelector<HTMLInputElement>(".home-landing-hero-input")
  const heroButton = root.querySelector<HTMLButtonElement>(".home-landing-hero-button")
  const heroSearchBox = root.querySelector<HTMLElement>(".home-landing-hero-searchbox")
  if (!heroInput || !heroButton || !heroSearchBox) return

  const existing = root.querySelector(".home-landing-hero-results")
  existing?.remove()

  const results = document.createElement("div")
  results.className = "home-landing-hero-results"
  results.hidden = true
  results.innerHTML = `
    <div class="home-landing-hero-results-list"></div>
    <div class="home-landing-hero-preview">
      <p class="home-landing-hero-preview-empty">Vyberte výsledek pro náhled stránky.</p>
    </div>
  `
  heroSearchBox.insertAdjacentElement("afterend", results)
  const resultsList = results.querySelector(".home-landing-hero-results-list") as HTMLElement
  const preview = results.querySelector(".home-landing-hero-preview") as HTMLElement
  const previewEmptyHtml = `<p class="home-landing-hero-preview-empty">Vyberte výsledek pro náhled stránky.</p>`

  const makeHref = (slug: string): string => {
    if (slug === "index") return "/"
    return `/${slug.replace(/^\/+/, "")}`
  }

  const findResults = (query: string, data: ContentIndex): Array<{ slug: string; title: string }> => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const tokens = q.split(/\s+/).filter(Boolean)
    const matches: Array<{ slug: string; title: string; score: number }> = []

    for (const [slug, item] of Object.entries(data)) {
      const title = (item.title ?? "").trim()
      if (!title) continue
      const haystack = `${title}\n${item.content ?? ""}\n${(item.tags ?? []).join(" ")}`
        .toLowerCase()
      if (!tokens.every((tok) => haystack.includes(tok))) continue

      let score = 0
      if (title.toLowerCase().includes(q)) score += 20
      if (title.toLowerCase().startsWith(q)) score += 10
      score += Math.max(0, 8 - title.length / 24)
      matches.push({ slug, title, score })
    }

    matches.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "cs"))
    return matches.slice(0, 8).map(({ slug, title }) => ({ slug, title }))
  }

  const absolutizeRelativeUrls = (container: HTMLElement, pageUrl: string) => {
    for (const el of container.querySelectorAll<HTMLElement>("[href], [src]")) {
      const href = el.getAttribute("href")
      if (href) {
        try {
          el.setAttribute("href", new URL(href, pageUrl).toString())
        } catch {
          // ignore malformed URLs in source
        }
      }
      const src = el.getAttribute("src")
      if (src) {
        try {
          el.setAttribute("src", new URL(src, pageUrl).toString())
        } catch {
          // ignore malformed URLs in source
        }
      }
    }
  }

  const makeExcerpt = (text: string, maxLen = 520): string => {
    const normalized = text.replace(/\s+/g, " ").trim()
    if (normalized.length <= maxLen) return normalized
    return `${normalized.slice(0, maxLen).trimEnd()}…`
  }

  const renderTextFallback = (title: string, rawContent: string): string => {
    const excerpt = makeExcerpt(rawContent || "Tato stránka zatím neobsahuje delší text.")
    return `
      <div class="home-landing-hero-preview-inner home-landing-hero-preview-fallback">
        <h3>${title}</h3>
        <p>${excerpt}</p>
      </div>
    `
  }

  const cleanupPreviewDom = (container: HTMLElement) => {
    container
      .querySelectorAll(
        ".page-header, .content-meta, .metadata-panel, .page-footer, hr, nav, .breadcrumb-container",
      )
      .forEach((el) => el.remove())
  }

  const loadPreviewHtml = async (href: string, title: string, fallbackContent: string) => {
    if (pagePreviewCache.has(href)) return pagePreviewCache.get(href)!
    const html = await fetch(href)
      .then((res) => (res.ok ? res.text() : ""))
      .catch(() => "")
    if (!html) return renderTextFallback(title, fallbackContent)
    const doc = new DOMParser().parseFromString(html, "text/html")
    const node = doc.querySelector(".popover-hint .article-surface, .popover-hint")
    if (!node) return renderTextFallback(title, fallbackContent)
    const wrapper = document.createElement("div")
    wrapper.className = "home-landing-hero-preview-inner"
    wrapper.innerHTML = node.innerHTML
    cleanupPreviewDom(wrapper)
    absolutizeRelativeUrls(wrapper, href)
    const textLen = wrapper.textContent?.trim().length ?? 0
    const output =
      textLen < 40 ? renderTextFallback(title, fallbackContent) : wrapper.outerHTML
    pagePreviewCache.set(href, output)
    return output
  }

  const showPreview = async (href: string, title: string, fallbackContent: string) => {
    preview.innerHTML = `<p class="home-landing-hero-preview-loading">Načítám náhled…</p>`
    const html = await loadPreviewHtml(href, title, fallbackContent)
    if (!html) {
      preview.innerHTML =
        `<p class="home-landing-hero-preview-empty">Náhled není dostupný. Otevřete stránku kliknutím.</p>`
      return
    }
    preview.innerHTML = html
  }

  const renderResults = async (query: string) => {
    const data = await getContentIndex()
    const found = findResults(query, data)
    resultsList.innerHTML = ""
    preview.innerHTML = previewEmptyHtml

    if (query.trim().length < 2) {
      results.hidden = true
      return
    }

    if (found.length === 0) {
      resultsList.innerHTML = `<p class="home-landing-hero-no-results">Nic jsme nenašli. Zkuste jiné slovo.</p>`
      results.hidden = false
      return
    }

    for (const hit of found) {
      const a = document.createElement("a")
      a.className = "home-landing-hero-result-item"
      a.href = makeHref(hit.slug)
      a.textContent = hit.title
      const previewHandler = () => {
        const fallbackContent = data[hit.slug]?.content ?? ""
        void showPreview(a.href, hit.title, fallbackContent)
      }
      a.addEventListener("mouseenter", previewHandler)
      a.addEventListener("focus", previewHandler)
      resultsList.appendChild(a)
    }
    results.hidden = false
    const first = resultsList.querySelector<HTMLAnchorElement>(".home-landing-hero-result-item")
    if (first) {
      const firstHit = found[0]
      const fallbackContent = firstHit ? (data[firstHit.slug]?.content ?? "") : ""
      void showPreview(first.href, firstHit?.title ?? first.textContent ?? "", fallbackContent)
    }
  }

  const onInput = () => {
    void renderResults(heroInput.value)
  }

  const onButtonClick = async (evt: Event) => {
    evt.preventDefault()
    await renderResults(heroInput.value)
    const first = resultsList.querySelector<HTMLAnchorElement>(".home-landing-hero-result-item")
    first?.focus()
  }

  const onKeydown = async (evt: KeyboardEvent) => {
    if (evt.key !== "Enter") return
    evt.preventDefault()
    await renderResults(heroInput.value)
    const first = resultsList.querySelector<HTMLAnchorElement>(".home-landing-hero-result-item")
    if (first) location.assign(first.href)
  }

  const onRootClick = (evt: MouseEvent) => {
    const target = evt.target as Element | null
    if (!target) return
    if (!target.closest(".home-landing-hero-searchbox") && !target.closest(".home-landing-hero-results")) {
      results.hidden = true
    }
  }

  heroInput.addEventListener("input", onInput)
  heroInput.addEventListener("keydown", onKeydown)
  heroButton.addEventListener("click", onButtonClick)
  document.addEventListener("click", onRootClick)

  ;(window as any).addCleanup?.(() => {
    heroInput.removeEventListener("input", onInput)
    heroInput.removeEventListener("keydown", onKeydown)
    heroButton.removeEventListener("click", onButtonClick)
    document.removeEventListener("click", onRootClick)
  })
}

document.addEventListener("nav", wireHeroSearch)
