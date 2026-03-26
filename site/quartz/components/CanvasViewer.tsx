import type { QuartzComponent, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/canvasViewer.inline"
import { pathToRoot } from "../util/path"
import type { FullSlug } from "../util/path"

interface CanvasFileData {
  slug?: FullSlug
  canvasPage?: boolean
  canvasEmbeddedData?: string
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
}
.canvas-node-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: var(--bodyFont);
}
.canvas-node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(128,128,128,0.08);
  border-bottom: 1px solid rgba(128,128,128,0.15);
  font-weight: 600;
  font-size: 13px;
  color: var(--darkgray);
  text-decoration: none !important;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.canvas-node-header:hover {
  background: rgba(128,128,128,0.15);
  color: var(--dark);
}
.canvas-header-icon {
  flex-shrink: 0;
  opacity: 0.4;
  display: flex;
  align-items: center;
}
.canvas-header-text {
  overflow: hidden;
  text-overflow: ellipsis;
}
.canvas-node-body {
  flex: 1;
  overflow: hidden;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--darkgray);
  font-family: var(--bodyFont);
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.canvas-text-node {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 600;
  padding: 0;
  line-height: 1.3;
}
.canvas-node-body h1,
.canvas-node-body h2,
.canvas-node-body h3,
.canvas-node-body h4,
.canvas-node-body h5,
.canvas-node-body h6 {
  margin: 0;
  color: var(--dark);
  line-height: 1.3;
}
.canvas-node-body h1 { font-size: 1.3em; }
.canvas-node-body h2 { font-size: 1.15em; }
.canvas-node-body h3 { font-size: 1.05em; }
.canvas-node-body h4,
.canvas-node-body h5,
.canvas-node-body h6 { font-size: 1em; }
.canvas-node-body p {
  margin: 0.4em 0;
}
.canvas-node-body ul,
.canvas-node-body ol {
  margin: 0.3em 0;
  padding-left: 1.4em;
}
.canvas-node-body li {
  margin: 0.15em 0;
}
.canvas-node-body img {
  max-width: 100%;
  border-radius: 4px;
  margin: 0.3em 0;
}
.canvas-node-body a {
  color: var(--secondary);
  text-decoration: none;
  cursor: pointer;
}
.canvas-node-body a:hover {
  text-decoration: underline;
}
.canvas-node-body .anchor {
  display: none;
}
.canvas-node-body table {
  border-collapse: collapse;
  font-size: 0.9em;
  width: 100%;
}
.canvas-node-body th,
.canvas-node-body td {
  border: 1px solid var(--lightgray);
  padding: 4px 8px;
  text-align: left;
}
.canvas-node-body code {
  background: rgba(128,128,128,0.1);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}
`

export default ((): QuartzComponent => {
  const CanvasViewer: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const data = fileData as CanvasFileData
    if (!data?.canvasPage || !data.slug) return null
    const base = pathToRoot(data.slug)

    return (
      <>
        <div class="quartz-canvas-viewer" data-base-url={base} />
        {data.canvasEmbeddedData && (
          <script
            type="application/json"
            class="canvas-embedded-data"
            dangerouslySetInnerHTML={{ __html: data.canvasEmbeddedData }}
          />
        )}
      </>
    )
  }
  CanvasViewer.css = style
  CanvasViewer.afterDOMLoaded = script
  return CanvasViewer
})()
