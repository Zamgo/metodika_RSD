import type { QuartzComponent, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/canvasViewer.inline"
import { joinSegments, pathToRoot } from "../util/path"
import type { FullSlug } from "../util/path"

interface CanvasFileData {
  slug?: FullSlug
  canvasPage?: boolean
}

const style = `
.quartz-canvas-viewer {
  position: relative;
  width: 100%;
  height: 70vh;
  min-height: 400px;
  overflow: hidden;
  border: 1px solid var(--lightgray);
  border-radius: 5px;
  background: var(--light);
  user-select: none;
  -webkit-user-select: none;
}
.canvas-file-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  text-decoration: none;
  color: var(--darkgray);
  font-family: var(--bodyFont);
  gap: 10px;
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 8px;
}
.canvas-file-link:hover {
  background: var(--lightgray);
}
.canvas-file-link .canvas-file-icon {
  opacity: 0.5;
  flex-shrink: 0;
}
.canvas-file-link .canvas-file-title {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  word-break: break-word;
  line-height: 1.3;
}
.canvas-file-link .canvas-file-hint {
  font-size: 11px;
  opacity: 0.5;
  font-weight: 400;
}
`

export default ((): QuartzComponent => {
  const CanvasViewer: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const data = fileData as CanvasFileData
    if (!data?.canvasPage || !data.slug) return null
    const base = pathToRoot(data.slug)
    const canvasUrl = joinSegments(base, data.slug + ".canvas")
    return (
      <div
        class="quartz-canvas-viewer"
        data-canvas-url={canvasUrl}
        data-base-url={base}
      />
    )
  }
  CanvasViewer.css = style
  CanvasViewer.afterDOMLoaded = script
  return CanvasViewer
})()
