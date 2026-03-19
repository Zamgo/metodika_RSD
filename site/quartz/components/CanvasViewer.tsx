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
}
`

export default ((): QuartzComponent => {
  const CanvasViewer: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const data = fileData as CanvasFileData
    if (!data?.canvasPage || !data.slug) return null
    const canvasUrl = joinSegments(pathToRoot(data.slug), data.slug + ".canvas")
    return (
      <div
        class="quartz-canvas-viewer"
        data-canvas-url={canvasUrl}
      />
    )
  }
  CanvasViewer.css = style
  CanvasViewer.afterDOMLoaded = script
  return CanvasViewer
})()
