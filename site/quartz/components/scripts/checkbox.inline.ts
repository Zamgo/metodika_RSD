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

    if (!el.dataset.checkboxPersistenceBound) {
      el.addEventListener("change", switchState)
      window.addCleanup(() => el.removeEventListener("change", switchState))
      el.dataset.checkboxPersistenceBound = "true"
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
