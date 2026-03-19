import { JSONCanvasViewer } from "json-canvas-viewer"

document.addEventListener("nav", () => {
  const roots = document.querySelectorAll<HTMLElement>("[data-canvas-url]")
  for (const el of roots) {
    const url = el.getAttribute("data-canvas-url")
    if (!url) return

    const href = new URL(url, window.location.href).href
    fetch(href)
      .then((r) => {
        if (!r.ok) throw new Error("Canvas fetch failed: " + r.status)
        return r.json()
      })
      .then((canvas) => {
        if (!canvas || !Array.isArray(canvas.nodes)) {
          console.warn("[quartz canvas] Invalid JSON Canvas data")
          return
        }
        new JSONCanvasViewer({ container: el, canvas })
      })
      .catch((err) => {
        console.warn("[quartz canvas] Failed to load canvas:", err)
      })
  }
})
