const SVG_NS = "http://www.w3.org/2000/svg"

interface CanvasNode {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  file?: string
  text?: string
  url?: string
  color?: string
  label?: string
}

interface CanvasEdge {
  id: string
  fromNode: string
  toNode: string
  fromSide: string
  toSide: string
  color?: string
  label?: string
}

interface CanvasData {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

interface Point {
  x: number
  y: number
}

const NODE_FILLS: Record<string, string> = {
  "1": "rgba(229, 57, 53, 0.12)",
  "2": "rgba(255, 152, 0, 0.12)",
  "3": "rgba(253, 216, 53, 0.12)",
  "4": "rgba(67, 160, 71, 0.12)",
  "5": "rgba(30, 136, 229, 0.12)",
  "6": "rgba(142, 36, 170, 0.12)",
}

const NODE_STROKES: Record<string, string> = {
  "1": "rgba(229, 57, 53, 0.6)",
  "2": "rgba(255, 152, 0, 0.6)",
  "3": "rgba(253, 216, 53, 0.6)",
  "4": "rgba(67, 160, 71, 0.6)",
  "5": "rgba(30, 136, 229, 0.6)",
  "6": "rgba(142, 36, 170, 0.6)",
}

function getNodeLabel(node: CanvasNode): string {
  if (node.type === "file" && node.file)
    return node.file.split("/").pop()?.replace(/\.md$/, "") ?? ""
  if (node.type === "text" && node.text)
    return node.text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1")
  if (node.type === "group" && node.label) return node.label
  return ""
}

function getAnchor(node: CanvasNode, side: string): Point {
  const cx = node.x + node.width / 2
  const cy = node.y + node.height / 2
  switch (side) {
    case "top":
      return { x: cx, y: node.y }
    case "bottom":
      return { x: cx, y: node.y + node.height }
    case "left":
      return { x: node.x, y: cy }
    case "right":
      return { x: node.x + node.width, y: cy }
    default:
      return { x: cx, y: cy }
  }
}

function ctrlPt(pt: Point, side: string, dist: number): Point {
  switch (side) {
    case "top":
      return { x: pt.x, y: pt.y - dist }
    case "bottom":
      return { x: pt.x, y: pt.y + dist }
    case "left":
      return { x: pt.x - dist, y: pt.y }
    case "right":
      return { x: pt.x + dist, y: pt.y }
    default:
      return pt
  }
}

function svgEl(tag: string, attrs: Record<string, string> = {}): SVGElement {
  const e = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  return e
}

function renderCanvas(container: HTMLElement, data: CanvasData) {
  container.innerHTML = ""
  if (!data.nodes?.length) return

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const n of data.nodes) {
    minX = Math.min(minX, n.x)
    minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x + n.width)
    maxY = Math.max(maxY, n.y + n.height)
  }

  const pad = 80
  const vb = {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + pad * 2,
    h: maxY - minY + pad * 2,
  }

  const svg = svgEl("svg", {
    viewBox: `${vb.x} ${vb.y} ${vb.w} ${vb.h}`,
    width: "100%",
    height: "100%",
  }) as SVGSVGElement

  const defs = svgEl("defs")

  const marker = svgEl("marker", {
    id: "canvas-arrow",
    markerWidth: "10",
    markerHeight: "7",
    refX: "9",
    refY: "3.5",
    orient: "auto",
  })
  marker.appendChild(svgEl("polygon", { points: "0 0.5, 10 3.5, 0 6.5", fill: "var(--gray)" }))
  defs.appendChild(marker)

  const pattern = svgEl("pattern", {
    id: "canvas-dots",
    x: "0",
    y: "0",
    width: "20",
    height: "20",
    patternUnits: "userSpaceOnUse",
  })
  pattern.appendChild(svgEl("circle", { cx: "10", cy: "10", r: "1", fill: "var(--lightgray)" }))
  defs.appendChild(pattern)

  svg.appendChild(defs)

  // Dot-pattern background
  svg.appendChild(
    svgEl("rect", {
      x: String(vb.x - 2000),
      y: String(vb.y - 2000),
      width: String(vb.w + 4000),
      height: String(vb.h + 4000),
      fill: "url(#canvas-dots)",
    }),
  )

  const nodeMap = new Map(data.nodes.map((n) => [n.id, n]))

  // Edges
  for (const edge of data.edges ?? []) {
    const from = nodeMap.get(edge.fromNode)
    const to = nodeMap.get(edge.toNode)
    if (!from || !to) continue

    const start = getAnchor(from, edge.fromSide)
    const end = getAnchor(to, edge.toSide)
    const dist = Math.max(50, Math.hypot(end.x - start.x, end.y - start.y) * 0.35)
    const cp1 = ctrlPt(start, edge.fromSide, dist)
    const cp2 = ctrlPt(end, edge.toSide, dist)

    svg.appendChild(
      svgEl("path", {
        d: `M${start.x},${start.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`,
        fill: "none",
        stroke: "var(--gray)",
        "stroke-width": "2",
        "marker-end": "url(#canvas-arrow)",
      }),
    )

    if (edge.label) {
      const mx = 0.125 * start.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * end.x
      const my = 0.125 * start.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * end.y
      const txt = svgEl("text", {
        x: String(mx),
        y: String(my - 6),
        "text-anchor": "middle",
        fill: "var(--darkgray)",
        "font-size": "13",
        "font-family": "var(--bodyFont)",
      })
      txt.textContent = edge.label
      svg.appendChild(txt)
    }
  }

  // Nodes
  for (const node of data.nodes) {
    const g = svgEl("g")
    const fill = (node.color && NODE_FILLS[node.color]) || "var(--light)"
    const stroke = (node.color && NODE_STROKES[node.color]) || "var(--lightgray)"

    g.appendChild(
      svgEl("rect", {
        x: String(node.x),
        y: String(node.y),
        width: String(node.width),
        height: String(node.height),
        rx: "8",
        fill,
        stroke,
        "stroke-width": "2",
      }),
    )

    const label = getNodeLabel(node)
    if (label) {
      const fo = svgEl("foreignObject", {
        x: String(node.x),
        y: String(node.y),
        width: String(node.width),
        height: String(node.height),
      })
      const div = document.createElement("div")
      div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml")
      Object.assign(div.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "12px",
        boxSizing: "border-box",
        fontSize: "14px",
        color: "var(--darkgray)",
        textAlign: "center",
        wordBreak: "break-word",
        fontFamily: "var(--bodyFont)",
        fontWeight: "600",
      })
      div.textContent = label
      fo.appendChild(div)
      g.appendChild(fo)
    }

    svg.appendChild(g)
  }

  container.appendChild(svg)

  // Pan & zoom via viewBox manipulation
  let isPanning = false
  let panStart: Point = { x: 0, y: 0 }

  function toSvg(cx: number, cy: number): Point {
    const r = svg.getBoundingClientRect()
    return {
      x: vb.x + ((cx - r.left) / r.width) * vb.w,
      y: vb.y + ((cy - r.top) / r.height) * vb.h,
    }
  }

  function applyVB() {
    svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`)
  }

  const onDown = (e: MouseEvent) => {
    isPanning = true
    panStart = toSvg(e.clientX, e.clientY)
    svg.style.cursor = "grabbing"
  }

  const onMove = (e: MouseEvent) => {
    if (!isPanning) return
    const pt = toSvg(e.clientX, e.clientY)
    vb.x -= pt.x - panStart.x
    vb.y -= pt.y - panStart.y
    applyVB()
    panStart = toSvg(e.clientX, e.clientY)
  }

  const onUp = () => {
    isPanning = false
    svg.style.cursor = "grab"
  }

  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const pt = toSvg(e.clientX, e.clientY)
    const factor = e.deltaY > 0 ? 1.1 : 1 / 1.1
    vb.w *= factor
    vb.h *= factor
    vb.x = pt.x - (pt.x - vb.x) * factor
    vb.y = pt.y - (pt.y - vb.y) * factor
    applyVB()
  }

  svg.addEventListener("mousedown", onDown)
  svg.addEventListener("mousemove", onMove)
  window.addEventListener("mouseup", onUp)
  svg.addEventListener("wheel", onWheel, { passive: false })
  svg.style.cursor = "grab"

  // Cleanup for SPA navigation
  ;(window as any).addCleanup?.(() => {
    svg.removeEventListener("mousedown", onDown)
    svg.removeEventListener("mousemove", onMove)
    window.removeEventListener("mouseup", onUp)
    svg.removeEventListener("wheel", onWheel)
  })
}

document.addEventListener("nav", () => {
  const roots = document.querySelectorAll<HTMLElement>("[data-canvas-url]")
  for (const root of roots) {
    const url = root.getAttribute("data-canvas-url")
    if (!url) continue

    root.innerHTML = ""

    const href = new URL(url, window.location.href).href
    fetch(href)
      .then((r) => {
        if (!r.ok) throw new Error("Canvas fetch failed: " + r.status)
        return r.json()
      })
      .then((canvas: CanvasData) => {
        if (!canvas?.nodes) return
        renderCanvas(root, canvas)
      })
      .catch((err) => {
        console.warn("[quartz canvas]", err)
      })
  }
})
