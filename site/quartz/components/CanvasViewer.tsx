import type { QuartzComponent, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/canvasViewer.inline"
import { joinSegments, pathToRoot } from "../util/path"
import type { FullSlug } from "../util/path"

interface CanvasFileData {
  slug?: FullSlug
  canvasPage?: boolean
}

export default ((): QuartzComponent => {
  const CanvasViewer: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const data = fileData as CanvasFileData
    if (!data?.canvasPage || !data.slug) return null
    const canvasUrl = joinSegments(pathToRoot(data.slug), data.slug + ".canvas")
    return (
      <div
        class="quartz-canvas-viewer"
        data-canvas-url={canvasUrl}
        style={{ width: "100%", minHeight: "60vh" }}
      />
    )
  }
  CanvasViewer.afterDOMLoaded = script
  return CanvasViewer
})()
