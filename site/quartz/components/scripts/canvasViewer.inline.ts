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

const FILE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>`

const LINK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`

function slugifyPath(fp: string): string {
  return fp
    .replace(/\.md$/, "")
    .split("/")
    .map((seg) =>
      seg
        .replace(/\s/g, "-")
        .replace(/&/g, "-and-")
        .replace(/%/g, "-percent")
        .replace(/\?/g, "")
        .replace(/#/g, ""),
    )
    .join("/")
    .replace(/\/$/, "")
}

function isImageFile(fp: string): boolean {
  return /\.(png|jpg|jpeg|gif|svg|webp|avif|bmp|ico)$/i.test(fp)
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

function buildFileNodeContent(
  node: CanvasNode,
  baseUrl: string,
): HTMLElement {
  const filePath = node.file!

  if (isImageFile(filePath)) {
    const wrapper = document.createElement("div")
    Object.assign(wrapper.style, {
      width: "100%",
      height: "100%",
      overflow: "hidden",
      borderRadius: "8px",
    })
    const img = document.createElement("img")
    img.src = baseUrl + "/" + filePath
    Object.assign(img.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    })
    img.loading = "lazy"
    wrapper.appendChild(img)
    return wrapper
  }

  const slug = slugifyPath(filePath)
  const href = baseUrl + "/" + slug
  const label = getNodeLabel(node)

  const a = document.createElement("a")
  a.href = href
  a.className = "internal canvas-file-link"

  const iconDiv = document.createElement("div")
  iconDiv.className = "canvas-file-icon"
  iconDiv.innerHTML = FILE_ICON
  a.appendChild(iconDiv)

  const title = document.createElement("span")
  title.className = "canvas-file-title"
  title.textContent = label
  a.appendChild(title)

  const hint = document.createElement("span")
  hint.className = "canvas-file-hint"
  hint.textContent = "Klikni pro otevření →"
  a.appendChild(hint)

  return a
}

function buildLinkNodeContent(node: CanvasNode): HTMLElement {
  const wrapper = document.createElement("a")
  wrapper.href = node.url || "#"
  wrapper.target = "_blank"
  wrapper.rel = "noopener"
  wrapper.className = "canvas-file-link"

  const iconDiv = document.createElement("div")
  iconDiv.className = "canvas-file-icon"
  iconDiv.innerHTML = LINK_ICON
  wrapper.appendChild(iconDiv)

  const title = document.createElement("span")
  title.className = "canvas-file-title"
  try {
    title.textContent = new URL(node.url || "").hostname
  } catch {
    title.textContent = node.url || "Link"
  }
  wrapper.appendChild(title)

  return wrapper
}

function buildTextNodeContent(node: CanvasNode): HTMLElement {
  const div = document.createElement("div")
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
    lineHeight: "1.4",
  })

  const text = node.text || ""
  div.innerHTML = text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>")

  return div
}

function renderCanvas(container: HTMLElement, data: CanvasData, baseUrl: string) {
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

  // Defs
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

  // Dot background
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

    const fo = svgEl("foreignObject", {
      x: String(node.x),
      y: String(node.y),
      width: String(node.width),
      height: String(node.height),
    })

    let content: HTMLElement
    if (node.type === "file" && node.file) {
      content = buildFileNodeContent(node, baseUrl)
    } else if (node.type === "link" && node.url) {
      content = buildLinkNodeContent(node)
    } else {
      content = buildTextNodeContent(node)
    }

    fo.appendChild(content)
    g.appendChild(fo)
    svg.appendChild(g)
  }

  container.appendChild(svg)

  // Pan & zoom
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
    if ((e.target as HTMLElement).closest("a")) return
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
    const baseUrl = root.getAttribute("data-base-url") || ".."
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
        renderCanvas(root, canvas, baseUrl)
      })
      .catch((err) => {
        console.warn("[quartz canvas]", err)
      })
  }
})
