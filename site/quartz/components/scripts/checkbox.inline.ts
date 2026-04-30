import { getFullSlug } from "../../util/path"

const checkboxId = (index: number) => `${getFullSlug(window)}-checkbox-${index}`

document.addEventListener("nav", () => {
  const checkboxes = document.querySelectorAll(
    "input.checkbox-toggle",
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

    el.addEventListener("change", switchState)
    window.addCleanup(() => el.removeEventListener("change", switchState))
    if (localStorage.getItem(elId) === "true") {
      el.checked = true
    }
  })
})
