type WizardRole = {
  key: string
  title: string
  aliases: string[]
}

type WizardActivity = {
  slug: string
  href: string
  title: string
  oznaceni: string
  faze: string[]
  rRoles: string[]
  aRoles: string[]
  cRoles: string[]
  iRoles: string[]
  popis: string
}

type WizardPhase = {
  key: string
  label: string
  match: string[]
}

type WizardData = {
  roles: WizardRole[]
  activities: WizardActivity[]
  phases: WizardPhase[]
}

type IndexItem = {
  title?: string
  content?: string
  tags?: string[]
}

type ContentIndex = Record<string, IndexItem>

let indexPromise: Promise<ContentIndex> | null = null
const pagePreviewCache = new Map<string, string>()
const RACI_ORDER = ["R", "A", "C", "I"] as const
const popoverParser = new DOMParser()
let activePreviewPopoverLink: HTMLAnchorElement | null = null

function getContentIndex(): Promise<ContentIndex> {
  if (!indexPromise) {
    indexPromise = fetch(new URL("../static/contentIndex.json", window.location.href).toString())
      .then((res) => {
        if (!res.ok) throw new Error("Nepodarilo se nacist index vyhledavani")
        return res.json() as Promise<ContentIndex>
      })
      .catch(() => ({} as ContentIndex))
  }
  return indexPromise
}

function parseWizardData(): WizardData | null {
  const dataEl = document.getElementById("home-wizard-data")
  if (!dataEl) return null
  try {
    return JSON.parse(dataEl.textContent || "{}") as WizardData
  } catch {
    return null
  }
}

/* ═══════════ Preview helpery ═══════════ */
function absolutizeRelativeUrls(container: HTMLElement, pageUrl: string) {
  for (const el of container.querySelectorAll<HTMLElement>("[href], [src]")) {
    const href = el.getAttribute("href")
    if (href) {
      try {
        el.setAttribute("href", new URL(href, pageUrl).toString())
      } catch {
        /* ignore */
      }
    }
    const src = el.getAttribute("src")
    if (src) {
      try {
        el.setAttribute("src", new URL(src, pageUrl).toString())
      } catch {
        /* ignore */
      }
    }
  }
}

function makeExcerpt(text: string, maxLen = 520): string {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLen) return normalized
  return `${normalized.slice(0, maxLen).trimEnd()}…`
}

function renderTextFallback(title: string, rawContent: string): string {
  const excerpt = makeExcerpt(rawContent || "Tato stránka zatím neobsahuje delší text.")
  return `
    <div class="home-wizard-result-preview-inner home-wizard-result-preview-fallback">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(excerpt)}</p>
    </div>
  `
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function formatRaciKeys(keys: Set<string>): string {
  return RACI_ORDER.filter((key) => keys.has(key)).join(", ")
}

function cleanupPreviewDom(container: HTMLElement) {
  container
    .querySelectorAll(
      ".page-header, .content-meta, .metadata-panel, .page-footer, hr, nav, .breadcrumb-container",
    )
    .forEach((el) => el.remove())
}

async function fetchCanonical(url: URL): Promise<Response> {
  const canonicalPath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`
  const canonicalUrl = new URL(`${canonicalPath}${url.hash}`, url)
  try {
    const res = await fetch(canonicalUrl.toString())
    if (res.ok) return res
  } catch {
    // fall back to non-canonical path below
  }
  return fetch(url.toString())
}

async function positionPopover(anchor: HTMLElement, popover: HTMLElement, x: number, y: number) {
  const { computePosition, inline, shift, flip } = await import("@floating-ui/dom")
  const position = await computePosition(anchor, popover, {
    strategy: "fixed",
    middleware: [inline({ x, y }), shift(), flip()],
  })
  popover.style.transform = `translate(${position.x.toFixed()}px, ${position.y.toFixed()}px)`
}

function clearPreviewPopovers() {
  activePreviewPopoverLink = null
  document.querySelectorAll(".popover.active-popover").forEach((el) => {
    el.classList.remove("active-popover")
  })
}

function normalizeRelativeUrlsToAbsolute(container: HTMLElement, base: URL) {
  container.querySelectorAll<HTMLElement>("[href], [src]").forEach((el) => {
    const href = el.getAttribute("href")
    if (href) {
      try {
        el.setAttribute("href", new URL(href, base).toString())
      } catch {}
    }
    const src = el.getAttribute("src")
    if (src) {
      try {
        el.setAttribute("src", new URL(src, base).toString())
      } catch {}
    }
  })
}

async function showPreviewPopover(link: HTMLAnchorElement, event: MouseEvent) {
  if (link.dataset.noPopover === "true") return
  activePreviewPopoverLink = link

  const targetUrl = new URL(link.href)
  const hash = decodeURIComponent(targetUrl.hash)
  targetUrl.hash = ""
  targetUrl.search = ""
  const popoverId = `popover-${link.pathname}`

  const renderExisting = (el: HTMLElement) => {
    clearPreviewPopovers()
    activePreviewPopoverLink = link
    el.classList.add("active-popover")
    void positionPopover(link, el, event.clientX, event.clientY)
    if (!hash) return
    const inner = el.querySelector(".popover-inner") as HTMLElement | null
    const heading = inner?.querySelector(`#popover-internal-${hash.slice(1)}`) as HTMLElement | null
    if (inner && heading) inner.scroll({ top: heading.offsetTop - 12, behavior: "instant" })
  }

  const existing = document.getElementById(popoverId)
  if (existing) {
    renderExisting(existing as HTMLElement)
    return
  }

  const response = await fetchCanonical(targetUrl).catch(() => null)
  if (!response?.ok || activePreviewPopoverLink !== link) return

  const [contentType] = (response.headers.get("Content-Type") ?? "").split(";")
  const [category, typeInfo] = contentType.split("/")
  const popoverEl = document.createElement("div")
  popoverEl.id = popoverId
  popoverEl.classList.add("popover")
  const inner = document.createElement("div")
  inner.classList.add("popover-inner")
  inner.dataset.contentType = contentType
  popoverEl.appendChild(inner)

  if (category === "image") {
    const img = document.createElement("img")
    img.src = targetUrl.toString()
    inner.appendChild(img)
  } else if (category === "application" && typeInfo === "pdf") {
    const pdf = document.createElement("iframe")
    pdf.src = targetUrl.toString()
    inner.appendChild(pdf)
  } else {
    const html = await response.text()
    const doc = popoverParser.parseFromString(html, "text/html")
    const hints = Array.from(doc.getElementsByClassName("popover-hint")) as HTMLElement[]
    if (hints.length === 0) return
    hints.forEach((hint) => {
      hint.querySelectorAll("[id]").forEach((el) => {
        ;(el as HTMLElement).id = `popover-internal-${(el as HTMLElement).id}`
      })
      normalizeRelativeUrlsToAbsolute(hint, targetUrl)
      inner.appendChild(hint)
    })
  }

  if (document.getElementById(popoverId) || activePreviewPopoverLink !== link) return
  document.body.appendChild(popoverEl)
  renderExisting(popoverEl)
}

function attachPreviewPopovers(scope: HTMLElement) {
  const links = scope.querySelectorAll("a.internal") as NodeListOf<HTMLAnchorElement>
  links.forEach((link) => {
    if ((link as HTMLAnchorElement & { __previewPopoverBound?: boolean }).__previewPopoverBound) return
    ;(link as HTMLAnchorElement & { __previewPopoverBound?: boolean }).__previewPopoverBound = true
    link.addEventListener("mouseenter", (e) => void showPreviewPopover(link, e))
    link.addEventListener("mouseleave", clearPreviewPopovers)
  })
}

async function loadPreviewHtml(
  href: string,
  title: string,
  fallbackContent: string,
): Promise<string> {
  if (pagePreviewCache.has(href)) return pagePreviewCache.get(href)!
  const html = await fetch(href)
    .then((res) => (res.ok ? res.text() : ""))
    .catch(() => "")
  if (!html) return renderTextFallback(title, fallbackContent)
  const doc = new DOMParser().parseFromString(html, "text/html")
  const hints = Array.from(doc.getElementsByClassName("popover-hint")) as HTMLElement[]
  if (hints.length === 0) return renderTextFallback(title, fallbackContent)
  const wrapper = document.createElement("div")
  wrapper.className = "home-wizard-result-preview-inner"
  wrapper.innerHTML = hints.map((hint) => hint.outerHTML).join("")
  absolutizeRelativeUrls(wrapper, href)
  const textLen = wrapper.textContent?.trim().length ?? 0
  const output = textLen < 40 ? renderTextFallback(title, fallbackContent) : wrapper.outerHTML
  pagePreviewCache.set(href, output)
  return output
}

/* ═══════════ Filtrace činností ═══════════ */
function normalizeLower(s: string): string {
  return s.trim().toLowerCase()
}

function activityMatchesRole(activity: WizardActivity, role: WizardRole): boolean {
  const roleNames = new Set<string>([role.title, ...role.aliases].map(normalizeLower))
  const haystack = [...activity.rRoles, ...activity.aRoles, ...activity.cRoles, ...activity.iRoles].map(
    normalizeLower,
  )
  for (const h of haystack) {
    if (roleNames.has(h)) return true
  }
  return false
}

function activityMatchesPhase(activity: WizardActivity, phase: WizardPhase): boolean {
  const needles = phase.match.map(normalizeLower)
  for (const f of activity.faze) {
    const fl = normalizeLower(f)
    if (needles.some((n) => fl === n || fl.includes(n))) return true
  }
  return false
}

function filterActivities(
  data: WizardData,
  roleKeys: Set<string>,
  phaseKeys: Set<string>,
  raciKeys: Set<string>,
): WizardActivity[] {
  if (roleKeys.size === 0 || phaseKeys.size === 0) return []
  if (raciKeys.size === 0) return []
  const selectedRoles = data.roles.filter((r) => roleKeys.has(r.key))
  const selectedPhases = data.phases.filter((p) => phaseKeys.has(p.key))
  if (selectedRoles.length === 0 || selectedPhases.length === 0) return []
  return data.activities.filter(
    (a) =>
      selectedRoles.some((role) => activityMatchesRole(a, role)) &&
      selectedPhases.some((phase) => activityMatchesPhase(a, phase)) &&
      activityMatchesAnySelectedRoleRaci(a, selectedRoles, raciKeys),
  )
}

function activityMatchesRaci(activity: WizardActivity, role: WizardRole, raciKeys: Set<string>): boolean {
  if (raciKeys.has("R") && isRoleIn(role, activity.rRoles)) return true
  if (raciKeys.has("A") && isRoleIn(role, activity.aRoles)) return true
  if (raciKeys.has("C") && isRoleIn(role, activity.cRoles ?? [])) return true
  if (raciKeys.has("I") && isRoleIn(role, activity.iRoles ?? [])) return true
  return false
}

function activityMatchesAnySelectedRoleRaci(
  activity: WizardActivity,
  roles: WizardRole[],
  raciKeys: Set<string>,
): boolean {
  return roles.some((role) => activityMatchesRaci(activity, role, raciKeys))
}

/* ═══════════ Wizard main ═══════════ */
function wireWizard() {
  const root = document.querySelector<HTMLElement>(".home-landing")
  if (!root) return

  const data = parseWizardData()
  if (!data) return

  const state: { roleKeys: Set<string>; phaseKeys: Set<string>; raciKeys: Set<string> } = {
    roleKeys: new Set<string>(),
    phaseKeys: new Set<string>(),
    raciKeys: new Set<string>(["R", "A", "C", "I"]),
  }

  const step2 = root.querySelector<HTMLElement>('[data-wizard-step="2"]')
  const step3 = root.querySelector<HTMLElement>('[data-wizard-step="3"]')
  const roleCards = Array.from(root.querySelectorAll<HTMLButtonElement>(".home-wizard-role-card"))
  const phaseCards = Array.from(root.querySelectorAll<HTMLButtonElement>(".home-wizard-phase-card"))
  const raciCards = Array.from(root.querySelectorAll<HTMLButtonElement>(".home-wizard-raci-card"))
  const listEl = root.querySelector<HTMLElement>("[data-wizard-list]")
  const previewEl = root.querySelector<HTMLElement>("[data-wizard-preview]")
  const summaryEl = root.querySelector<HTMLElement>("[data-wizard-summary]")

  if (!step2 || !step3 || !listEl || !previewEl || !summaryEl) return

  const previewEmptyHtml = `<p class="home-wizard-result-preview-empty">Vyberte dílčí činnost v levém seznamu pro náhled.</p>`
  const listEmptyHtml = `<li class="home-wizard-result-empty">Pro zvolenou kombinaci jsme nenašli žádné dílčí činnosti.</li>`
  const listEmptyRaciHtml = `<li class="home-wizard-result-empty">Vyberte alespoň jednu roli v RACI (R, A, C nebo I) pro zobrazení dílčích činností.</li>`

  function syncRoleCards() {
    for (const card of roleCards) {
      const roleKey = card.dataset.roleKey || ""
      const isActive = state.roleKeys.has(roleKey)
      card.classList.toggle("selected", isActive)
      card.setAttribute("aria-pressed", isActive ? "true" : "false")
    }
  }

  function toggleRole(key: string) {
    if (state.roleKeys.has(key)) {
      state.roleKeys.delete(key)
    } else {
      state.roleKeys.add(key)
    }
    syncRoleCards()
    step2!.hidden = state.roleKeys.size === 0
    // Při změně role pokud je zvolená alespoň jedna fáze, přerenderuj výsledek
    if (state.phaseKeys.size > 0) renderResult()
    // Plynule scrollnout na step 2, aby uživatel viděl co má dál vybrat
    if (state.roleKeys.size > 0) {
      requestAnimationFrame(() => {
        step2!.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    } else {
      step3!.hidden = true
      listEl!.innerHTML = listEmptyHtml
      previewEl!.innerHTML = previewEmptyHtml
      summaryEl!.innerHTML = ""
    }
  }

  function syncPhaseCards() {
    for (const card of phaseCards) {
      const phaseKey = card.dataset.phaseKey || ""
      const isActive = state.phaseKeys.has(phaseKey)
      card.classList.toggle("selected", isActive)
      card.setAttribute("aria-pressed", isActive ? "true" : "false")
    }
  }

  function togglePhase(key: string) {
    if (state.phaseKeys.has(key)) {
      state.phaseKeys.delete(key)
    } else {
      state.phaseKeys.add(key)
    }
    syncPhaseCards()
    step3!.hidden = state.phaseKeys.size === 0
    if (state.phaseKeys.size > 0) {
      renderResult()
      requestAnimationFrame(() => {
        step3!.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    } else {
      listEl!.innerHTML = listEmptyHtml
      previewEl!.innerHTML = previewEmptyHtml
      summaryEl!.innerHTML = ""
    }
  }

  function syncRaciCards() {
    for (const card of raciCards) {
      const key = (card.dataset.raciKey || "").toUpperCase()
      const isSelected = state.raciKeys.has(key)
      card.classList.toggle("selected", isSelected)
      card.setAttribute("aria-pressed", isSelected ? "true" : "false")
    }
  }

  function toggleRaciKey(key: string) {
    if (state.raciKeys.has(key)) {
      state.raciKeys.delete(key)
    } else {
      state.raciKeys.add(key)
    }
    syncRaciCards()
    if (state.phaseKeys.size > 0) renderResult()
  }

  function renderResult() {
    if (state.roleKeys.size === 0 || state.phaseKeys.size === 0) return

    const selectedRoles = data!.roles.filter((r) => state.roleKeys.has(r.key))
    const selectedPhases = data!.phases.filter((p) => state.phaseKeys.has(p.key))
    const filtered = filterActivities(data!, state.roleKeys, state.phaseKeys, state.raciKeys)
    const roleLabels = selectedRoles.map((r) => r.title).join(", ")
    const phaseLabels = selectedPhases.map((p) => p.label).join(", ")

    // Summary
    if (selectedRoles.length > 0 && selectedPhases.length > 0) {
      summaryEl!.innerHTML = `
        <span class="home-wizard-result-tag">${escapeHtml(roleLabels)}</span>
        ·
        <span class="home-wizard-result-tag">${escapeHtml(phaseLabels)}</span>
        ·
        <span class="home-wizard-result-tag">${formatRaciKeys(state.raciKeys) || "—"}</span>
        — ${filtered.length} ${pluralCinnosti(filtered.length)}
      `
    }

    // List
    listEl!.innerHTML = ""
    if (filtered.length === 0) {
      listEl!.innerHTML = state.raciKeys.size === 0 ? listEmptyRaciHtml : listEmptyHtml
      previewEl!.innerHTML = previewEmptyHtml
      return
    }

    for (const act of filtered) {
      const li = document.createElement("li")
      li.className = "home-wizard-result-item"
      li.tabIndex = 0
      li.setAttribute("role", "button")
      li.dataset.href = act.href
      li.dataset.title = act.title
      li.dataset.fallback = act.popis ?? ""

      // Označení role na aktivitě dle vybraných rolí — R/A/C/I
      const rMatch = selectedRoles.some((role) => isRoleIn(role, act.rRoles))
      const aMatch = selectedRoles.some((role) => isRoleIn(role, act.aRoles))
      const cMatch = selectedRoles.some((role) => isRoleIn(role, act.cRoles ?? []))
      const iMatch = selectedRoles.some((role) => isRoleIn(role, act.iRoles ?? []))
      const tagsHtml: string[] = []
      if (rMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag raci-r">R</span>`)
      if (aMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag raci-a">A</span>`)
      if (cMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag raci-c">C</span>`)
      if (iMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag raci-i">I</span>`)

      li.innerHTML = `
        ${act.oznaceni ? `<span class="home-wizard-result-item-num">${escapeHtml(act.oznaceni)}</span>` : ""}
        <span class="home-wizard-result-item-body">
          <span class="home-wizard-result-item-title">${escapeHtml(act.title)}</span>
          ${tagsHtml.length > 0 ? `<span class="home-wizard-result-item-tags">${tagsHtml.join("")}</span>` : ""}
        </span>
      `

      const activate = () => void showPreview(li, act)
      li.addEventListener("click", activate)
      li.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          activate()
        }
      })
      li.addEventListener("mouseenter", () => void showPreview(li, act, /*silent*/ true))
      listEl!.appendChild(li)
    }

    // Automaticky vybrat první položku
    const first = listEl!.querySelector<HTMLElement>(".home-wizard-result-item")
    if (first) {
      void showPreview(first, filtered[0])
    } else {
      previewEl!.innerHTML = previewEmptyHtml
    }
  }

  function markActiveItem(target: HTMLElement) {
    for (const el of listEl!.querySelectorAll<HTMLElement>(".home-wizard-result-item")) {
      el.classList.toggle("active", el === target)
    }
  }

  async function showPreview(
    item: HTMLElement,
    activity: WizardActivity,
    silent = false,
  ): Promise<void> {
    if (!silent) markActiveItem(item)
    if (!silent) {
      previewEl!.innerHTML = `<p class="home-wizard-result-preview-loading">Načítám náhled…</p>`
    }
    const index = await getContentIndex()
    const fallbackContent = index[activity.slug]?.content ?? activity.popis ?? ""
    const html = await loadPreviewHtml(activity.href, activity.title, fallbackContent)
    // Pokud uživatel mezitím kliknul jinam, nepřepisuj preview
    const stillActive = listEl!.querySelector<HTMLElement>(".home-wizard-result-item.active")
    if (!silent && stillActive !== item) return
    if (silent && !stillActive) {
      markActiveItem(item)
    } else if (silent) {
      return
    }

    previewEl!.innerHTML = `
      <a class="home-wizard-result-preview-open" href="${activity.href}">Otevřít celou stránku →</a>
      ${html}
    `
    attachPreviewPopovers(previewEl!)
  }

  /* Připojení kliků */
  for (const card of roleCards) {
    card.addEventListener("click", () => {
      const key = card.dataset.roleKey
      if (key) toggleRole(key)
    })
  }
  for (const card of phaseCards) {
    card.addEventListener("click", () => {
      const key = card.dataset.phaseKey
      if (key) togglePhase(key)
    })
  }
  for (const card of raciCards) {
    card.addEventListener("click", () => {
      const key = (card.dataset.raciKey || "").toUpperCase()
      if (!key) return
      toggleRaciKey(key)
    })
  }
  syncRoleCards()
  syncPhaseCards()
  syncRaciCards()
}

function isRoleIn(role: WizardRole, list: string[]): boolean {
  const names = new Set<string>([role.title, ...role.aliases].map((s) => s.trim().toLowerCase()))
  return list.some((r) => names.has(r.trim().toLowerCase()))
}

function pluralCinnosti(n: number): string {
  if (n === 1) return "dílčí činnost"
  if (n >= 2 && n <= 4) return "dílčí činnosti"
  return "dílčích činností"
}

document.addEventListener("nav", wireWizard)
