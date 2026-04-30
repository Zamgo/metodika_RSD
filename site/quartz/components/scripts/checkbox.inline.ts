import { getFullSlug } from "../../util/path"

const checkboxId = (index: number) => `${getFullSlug(window)}-checkbox-${index}`

function initCheckboxPersistence() {
  const checkboxes = document.querySelectorAll(
    ".article-surface input[type='checkbox']",
  ) as NodeListOf<HTMLInputElement>
  checkboxes.forEach((el, index) => {
    const elId = checkboxId(index)
    // Some markdown pipelines keep boolean `disabled` present ("disabled=false"),
    // which still disables the input in browser. Force-enable for interactive demo.
    el.disabled = false
    el.removeAttribute("disabled")

    const switchState = (e: Event) => {
      const newCheckboxState = (e.target as HTMLInputElement)?.checked ? "true" : "false"
      localStorage.setItem(elId, newCheckboxState)
    }

    const forceToggle = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      el.checked = !el.checked
      localStorage.setItem(elId, el.checked ? "true" : "false")
    }

    if (!el.dataset.checkboxPersistenceBound) {
      el.addEventListener("click", forceToggle)
      el.addEventListener("change", switchState)
      window.addCleanup(() => el.removeEventListener("click", forceToggle))
      window.addCleanup(() => el.removeEventListener("change", switchState))
      el.dataset.checkboxPersistenceBound = "true"
    }

    const taskItem = el.closest("li")
    if (taskItem && !taskItem.dataset.checkboxRowToggleBound) {
      const onRowClick = (event: Event) => {
        const target = event.target as HTMLElement | null
        if (!target) return
        if (target.closest("a, button")) return
        el.checked = !el.checked
        localStorage.setItem(elId, el.checked ? "true" : "false")
      }
      taskItem.addEventListener("click", onRowClick)
      window.addCleanup(() => taskItem.removeEventListener("click", onRowClick))
      taskItem.dataset.checkboxRowToggleBound = "true"
    }
    if (localStorage.getItem(elId) === "true") {
      el.checked = true
    }
  })
}

document.addEventListener("nav", initCheckboxPersistence)
// Fallback for cases where `nav` did not fire yet.
document.addEventListener("DOMContentLoaded", initCheckboxPersistence)
initCheckboxPersistence()
