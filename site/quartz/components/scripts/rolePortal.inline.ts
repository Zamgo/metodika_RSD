function wireRolePortalTabs() {
  const portals = document.querySelectorAll<HTMLElement>(".role-portal")
  portals.forEach((portal) => {
    const tabs = portal.querySelectorAll<HTMLButtonElement>("[data-phase-tab]")
    const tasks = portal.querySelectorAll<HTMLElement>(".role-portal-task")
    if (tabs.length === 0 || tasks.length === 0) return

    const apply = (phase: string) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.phaseTab === phase
        tab.classList.toggle("is-active", active)
        tab.setAttribute("aria-selected", active ? "true" : "false")
      })
      tasks.forEach((task) => {
        const phases = (task.dataset.phases ?? "all").split(/\s+/).filter(Boolean)
        const show = phase === "all" || phases.includes(phase) || phases.includes("all")
        task.style.display = show ? "" : "none"
      })
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", (evt) => {
        evt.preventDefault()
        apply(tab.dataset.phaseTab ?? "all")
      })
    })

    apply("all")
  })
}

document.addEventListener("nav", wireRolePortalTabs)
