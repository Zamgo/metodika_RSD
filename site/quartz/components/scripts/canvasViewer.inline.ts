import { JSONCanvasViewer } from "json-canvas-viewer"

interface CanvasNode {
  id: string
  type: string
  file?: string
  text?: string
  url?: string
  x: number
  y: number
  width: number
  height: number
  [key: string]: unknown
}

interface CanvasData {
  nodes: CanvasNode[]
  edges: unknown[]
}

function rewriteFileNodes(canvas: CanvasData): CanvasData {
  const nodes = canvas.nodes.map((node) => {
    if (node.type !== "file" || !node.file) return node
    const filePath = node.file
    const name = filePath.split("/").pop()?.replace(/\.md$/, "") ?? filePath
    return {
      ...node,
      type: "text" as const,
      file: undefined,
      text: `**${name}**`,
    }
  })
  return { ...canvas, nodes }
}

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
      .then((canvas: CanvasData) => {
        if (!canvas || !Array.isArray(canvas.nodes)) {
          console.warn("[quartz canvas] Invalid JSON Canvas data")
          return
        }
        const processed = rewriteFileNodes(canvas)
        new JSONCanvasViewer({ container: el, canvas: processed })
      })
      .catch((err) => {
        console.warn("[quartz canvas] Failed to load canvas:", err)
      })
  }
})
