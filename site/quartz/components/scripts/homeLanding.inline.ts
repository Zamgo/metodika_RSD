function openSiteSearch() {
  const trigger = document.querySelector<HTMLButtonElement>(
    "[data-search-trigger], .sidebar .search-button",
  )
  if (trigger) {
    trigger.click()
    return
  }
  const fallback = document.querySelector<HTMLButtonElement>(".search-button")
  fallback?.click()
}

function wireHeroSearch() {
  const root = document.querySelector<HTMLElement>(".home-landing")
  if (!root) return

  const heroInput = root.querySelector<HTMLInputElement>(".home-landing-hero-input")
  const heroButton = root.querySelector<HTMLButtonElement>(".home-landing-hero-button")

  const handler = (evt: Event) => {
    evt.preventDefault()
    openSiteSearch()
  }

  heroInput?.addEventListener("focus", handler)
  heroInput?.addEventListener("click", handler)
  heroInput?.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter" || evt.key === " ") {
      handler(evt)
    }
  })
  heroButton?.addEventListener("click", handler)
}

document.addEventListener("nav", wireHeroSearch)
