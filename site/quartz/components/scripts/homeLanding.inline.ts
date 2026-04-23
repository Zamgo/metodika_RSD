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

function getContentIndex(): Promise<ContentIndex> {
  if (!indexPromise) {
    indexPromise = fetch("/static/contentIndex.json")
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

function cleanupPreviewDom(container: HTMLElement) {
  container
    .querySelectorAll(
      ".page-header, .content-meta, .metadata-panel, .page-footer, hr, nav, .breadcrumb-container",
    )
    .forEach((el) => el.remove())
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
  const node = doc.querySelector(".popover-hint .article-surface, .popover-hint")
  if (!node) return renderTextFallback(title, fallbackContent)
  const wrapper = document.createElement("div")
  wrapper.className = "home-wizard-result-preview-inner"
  wrapper.innerHTML = node.innerHTML
  cleanupPreviewDom(wrapper)
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
  const haystack = [...activity.rRoles, ...activity.aRoles].map(normalizeLower)
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
  roleKey: string | null,
  phaseKey: string | null,
): WizardActivity[] {
  if (!roleKey || !phaseKey) return []
  const role = data.roles.find((r) => r.key === roleKey)
  const phase = data.phases.find((p) => p.key === phaseKey)
  if (!role || !phase) return []
  return data.activities.filter(
    (a) => activityMatchesRole(a, role) && activityMatchesPhase(a, phase),
  )
}

/* ═══════════ Wizard main ═══════════ */
function wireWizard() {
  const root = document.querySelector<HTMLElement>(".home-landing")
  if (!root) return

  const data = parseWizardData()
  if (!data) return

  const state: { roleKey: string | null; phaseKey: string | null } = {
    roleKey: null,
    phaseKey: null,
  }

  const step2 = root.querySelector<HTMLElement>('[data-wizard-step="2"]')
  const step3 = root.querySelector<HTMLElement>('[data-wizard-step="3"]')
  const roleCards = Array.from(root.querySelectorAll<HTMLButtonElement>(".home-wizard-role-card"))
  const phaseCards = Array.from(root.querySelectorAll<HTMLButtonElement>(".home-wizard-phase-card"))
  const listEl = root.querySelector<HTMLElement>("[data-wizard-list]")
  const previewEl = root.querySelector<HTMLElement>("[data-wizard-preview]")
  const summaryEl = root.querySelector<HTMLElement>("[data-wizard-summary]")

  if (!step2 || !step3 || !listEl || !previewEl || !summaryEl) return

  const previewEmptyHtml = `<p class="home-wizard-result-preview-empty">Vyberte činnost v levém seznamu pro náhled.</p>`
  const listEmptyHtml = `<li class="home-wizard-result-empty">Pro zvolenou kombinaci jsme nenašli žádné činnosti.</li>`

  function setActiveRole(key: string) {
    state.roleKey = key
    for (const card of roleCards) {
      const isActive = card.dataset.roleKey === key
      card.classList.toggle("selected", isActive)
      card.setAttribute("aria-pressed", isActive ? "true" : "false")
    }
    step2!.hidden = false
    // Při změně role pokud je zvolená fáze, přerenderuj výsledek
    if (state.phaseKey) renderResult()
    // Plynule scrollnout na step 2, aby uživatel viděl co má dál vybrat
    requestAnimationFrame(() => {
      step2!.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function setActivePhase(key: string) {
    state.phaseKey = key
    for (const card of phaseCards) {
      const isActive = card.dataset.phaseKey === key
      card.classList.toggle("selected", isActive)
      card.setAttribute("aria-pressed", isActive ? "true" : "false")
    }
    step3!.hidden = false
    renderResult()
    requestAnimationFrame(() => {
      step3!.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function renderResult() {
    if (!state.roleKey || !state.phaseKey) return

    const role = data!.roles.find((r) => r.key === state.roleKey)
    const phase = data!.phases.find((p) => p.key === state.phaseKey)
    const filtered = filterActivities(data!, state.roleKey, state.phaseKey)

    // Summary
    if (role && phase) {
      summaryEl!.innerHTML = `
        <span class="home-wizard-result-tag">${escapeHtml(role.title)}</span>
        ·
        <span class="home-wizard-result-tag">${escapeHtml(phase.label)}</span>
        — ${filtered.length} ${pluralCinnosti(filtered.length)}
      `
    }

    // List
    listEl!.innerHTML = ""
    if (filtered.length === 0) {
      listEl!.innerHTML = listEmptyHtml
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

      // Označení role na aktivitě — R vs A
      const rMatch = role && isRoleIn(role, act.rRoles)
      const aMatch = role && isRoleIn(role, act.aRoles)
      const tagsHtml: string[] = []
      if (rMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag">R</span>`)
      if (aMatch) tagsHtml.push(`<span class="home-wizard-result-item-tag">A</span>`)

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
      ${html}
      <a class="home-wizard-result-preview-open" href="${activity.href}">Otevřít celou stránku →</a>
    `
  }

  /* Připojení kliků */
  for (const card of roleCards) {
    card.addEventListener("click", () => {
      const key = card.dataset.roleKey
      if (key) setActiveRole(key)
    })
  }
  for (const card of phaseCards) {
    card.addEventListener("click", () => {
      const key = card.dataset.phaseKey
      if (key) setActivePhase(key)
    })
  }
}

function isRoleIn(role: WizardRole, list: string[]): boolean {
  const names = new Set<string>([role.title, ...role.aliases].map((s) => s.trim().toLowerCase()))
  return list.some((r) => names.has(r.trim().toLowerCase()))
}

function pluralCinnosti(n: number): string {
  if (n === 1) return "činnost"
  if (n >= 2 && n <= 4) return "činnosti"
  return "činností"
}

document.addEventListener("nav", wireWizard)
