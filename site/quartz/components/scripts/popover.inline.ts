import { computePosition, flip, inline, shift } from "@floating-ui/dom"
import { normalizeRelativeURLs } from "../../util/path"
import { fetchCanonical } from "./util"

const p = new DOMParser()
let activeAnchor: HTMLAnchorElement | null = null

async function mouseEnterHandler(
  this: HTMLAnchorElement,
  { clientX, clientY }: { clientX: number; clientY: number },
) {
  const link = (activeAnchor = this)
  if (link.dataset.noPopover === "true") {
    return
  }

  async function setPosition(popoverElement: HTMLElement) {
    const { x, y } = await computePosition(link, popoverElement, {
      strategy: "fixed",
      middleware: [inline({ x: clientX, y: clientY }), shift(), flip()],
    })
    Object.assign(popoverElement.style, {
      transform: `translate(${x.toFixed()}px, ${y.toFixed()}px)`,
    })
  }

  function showPopover(popoverElement: HTMLElement) {
    clearActivePopover()
    popoverElement.classList.add("active-popover")
    setPosition(popoverElement as HTMLElement)

    if (hash !== "") {
      const inner = popoverElement.querySelector(".popover-inner") as HTMLElement | null
      if (inner) {
        const targetAnchor = `#popover-internal-${hash.slice(1)}`
        const heading = inner.querySelector(targetAnchor) as HTMLElement | null
        if (heading) {
          inner.scroll({ top: heading.offsetTop - 12, behavior: "instant" })
        }
      }
    }
  }

  const targetUrl = new URL(link.href)
  const hash = decodeURIComponent(targetUrl.hash)
  targetUrl.hash = ""
  targetUrl.search = ""
  const popoverId = `popover-${link.pathname}`
  const prevPopoverElement = document.getElementById(popoverId)

  // dont refetch if there's already a popover
  if (!!document.getElementById(popoverId)) {
    showPopover(prevPopoverElement as HTMLElement)
    return
  }

  const response = await fetchCanonical(targetUrl).catch((err) => {
    console.error(err)
  })

  if (!response || !response.ok) return
  const [contentType] = response.headers.get("Content-Type")!.split(";")
  const [contentTypeCategory, typeInfo] = contentType.split("/")

  const popoverElement = document.createElement("div")
  popoverElement.id = popoverId
  popoverElement.classList.add("popover")
  const popoverInner = document.createElement("div")
  popoverInner.classList.add("popover-inner")
  popoverInner.dataset.contentType = contentType ?? undefined
  popoverElement.appendChild(popoverInner)

  switch (contentTypeCategory) {
    case "image":
      const img = document.createElement("img")
      img.src = targetUrl.toString()
      img.alt = targetUrl.pathname

      popoverInner.appendChild(img)
      break
    case "application":
      switch (typeInfo) {
        case "pdf":
          const pdf = document.createElement("iframe")
          pdf.src = targetUrl.toString()
          popoverInner.appendChild(pdf)
          break
        default:
          break
      }
      break
    default:
      const contents = await response.text()
      const html = p.parseFromString(contents, "text/html")
      const hasCanvasViewer = !!html.querySelector(".quartz-canvas-viewer")

      if (hasCanvasViewer) {
        popoverInner.dataset.contentType = "text/canvas-preview"
        const iframe = document.createElement("iframe")
        iframe.src = targetUrl.toString()
        iframe.title = `Náhled: ${targetUrl.pathname}`
        iframe.loading = "lazy"
        iframe.referrerPolicy = "no-referrer-when-downgrade"
        iframe.addEventListener("load", () => {
          try {
            const doc = iframe.contentDocument
            if (!doc) return
            const title = doc.querySelector(".article-title")
            const viewer = doc.querySelector(".quartz-canvas-viewer")
            if (!viewer) return

            const shell = doc.createElement("div")
            shell.className = "canvas-popover-shell"

            if (title?.textContent?.trim()) {
              const heading = doc.createElement("h1")
              heading.className = "canvas-popover-title"
              heading.textContent = title.textContent.trim()
              shell.appendChild(heading)
            }

            shell.appendChild(viewer)
            doc.body.innerHTML = ""
            doc.body.appendChild(shell)

            const style = doc.createElement("style")
            style.textContent = `
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: var(--light) !important;
              }

              .canvas-popover-shell {
                box-sizing: border-box;
                width: 100%;
                height: 100vh;
                padding: 0.75rem;
                display: grid;
                grid-template-rows: auto minmax(0, 1fr);
                gap: 0.5rem;
              }

              .canvas-popover-title {
                margin: 0;
                font-size: 1.25rem;
                line-height: 1.25;
                color: var(--dark);
              }

              .quartz-canvas-viewer {
                height: 100% !important;
                min-height: 0 !important;
              }
            `
            doc.head.appendChild(style)
          } catch {
            // Ignore cross-document access issues and fall back to full-page preview.
          }
        })
        popoverInner.appendChild(iframe)
        break
      }

      normalizeRelativeURLs(html, targetUrl)
      // prepend all IDs inside popovers to prevent duplicates
      html.querySelectorAll("[id]").forEach((el) => {
        const targetID = `popover-internal-${el.id}`
        el.id = targetID
      })
      const elts = [...html.getElementsByClassName("popover-hint")]
      if (elts.length === 0) return

      elts.forEach((elt) => popoverInner.appendChild(elt))
  }

  if (!!document.getElementById(popoverId)) {
    return
  }

  document.body.appendChild(popoverElement)
  if (activeAnchor !== this) {
    return
  }

  showPopover(popoverElement)
}

function clearActivePopover() {
  activeAnchor = null
  const allPopoverElements = document.querySelectorAll(".popover")
  allPopoverElements.forEach((popoverElement) => popoverElement.classList.remove("active-popover"))
}

document.addEventListener("nav", () => {
  const links = [...document.querySelectorAll("a.internal")] as HTMLAnchorElement[]
  for (const link of links) {
    link.addEventListener("mouseenter", mouseEnterHandler)
    link.addEventListener("mouseleave", clearActivePopover)
    window.addCleanup(() => {
      link.removeEventListener("mouseenter", mouseEnterHandler)
      link.removeEventListener("mouseleave", clearActivePopover)
    })
  }
})
