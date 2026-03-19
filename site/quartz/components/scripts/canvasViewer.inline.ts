/**
 * After DOM load: find all [data-canvas-url] elements, fetch the JSON Canvas
 * and mount json-canvas-viewer on each.
 */
function canvasViewerInit() {
  const roots = document.querySelectorAll("[data-canvas-url]")
  roots.forEach((el: Element) => {
    const url = (el as HTMLElement).getAttribute("data-canvas-url")
    if (!url) return
    const href = new URL(url, window.location.href).href
    fetch(href)
      .then((r) => {
        if (!r.ok) throw new Error("Canvas fetch failed: " + r.status)
        return r.json()
      })
      .then((canvas: { nodes?: unknown }) => {
        if (!canvas || (Array.isArray(canvas.nodes) === false && !canvas.nodes)) {
          console.warn("[quartz canvas] Invalid JSON Canvas data")
          return
        }
        return import("json-canvas-viewer").then(({ JSONCanvasViewer }) => {
          new JSONCanvasViewer({ container: el as HTMLElement, canvas })
        })
      })
      .catch((err: unknown) => {
        console.warn("[quartz canvas] Failed to load canvas:", err)
      })
  })
}
canvasViewerInit()
