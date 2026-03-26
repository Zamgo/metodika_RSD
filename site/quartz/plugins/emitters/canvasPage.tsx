import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { FilePath, FullSlug, joinSegments, pathToRoot, slugifyFilePath } from "../../util/path"
import { defaultContentPageLayout, sharedPageComponents } from "../../../quartz.layout"
import CanvasViewer from "../../components/CanvasViewer"
import HeaderConstructor from "../../components/Header"
import { defaultProcessedContent } from "../vfile"
import { write } from "./helpers"
import path from "path"
import fs from "fs"
import { glob } from "../../util/glob"
import { toHtml } from "hast-util-to-html"
import { Root, Element } from "hast"

declare module "vfile" {
  interface DataMap {
    canvasPage: boolean
    canvasEmbeddedData: string
  }
}

interface CanvasNodeRaw {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  file?: string
  subpath?: string
  text?: string
  url?: string
  color?: string
  label?: string
}

interface CanvasEdgeRaw {
  id: string
  fromNode: string
  toNode: string
  fromSide: string
  toSide: string
  color?: string
  label?: string
}

interface CanvasRaw {
  nodes: CanvasNodeRaw[]
  edges: CanvasEdgeRaw[]
}

function normalizeLookupKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function isJsonCanvas(data: unknown): data is CanvasRaw {
  if (!data || typeof data !== "object") return false
  const o = data as Record<string, unknown>
  return Array.isArray(o.nodes) || Array.isArray(o.edges)
}

function titleFromPath(fp: string): string {
  const base = path.basename(fp, ".canvas")
  return base.replace(/-/g, " ").trim() || "Canvas"
}

function slugifyMdPath(fp: string): string {
  return fp
    .replace(/\.md$/, "")
    .split("/")
    .map((s) =>
      s
        .replace(/\s/g, "-")
        .replace(/&/g, "-and-")
        .replace(/%/g, "-percent")
        .replace(/\?/g, "")
        .replace(/#/g, ""),
    )
    .join("/")
    .replace(/\/$/, "")
}

function buildWikiLinkMap(markdownFiles: string[]): Record<string, string> {
  const linkMap: Record<string, string> = {}

  for (const fp of markdownFiles) {
    const noExt = fp.replace(/\.md$/i, "")
    const slashPath = noExt.replace(/\\/g, "/")
    const baseName = path.basename(slashPath)
    const slug = slugifyMdPath(slashPath)
    const variants = new Set<string>([
      noExt,
      slashPath,
      baseName,
      baseName.replace(/-/g, " "),
      normalizeLookupKey(noExt),
      normalizeLookupKey(slashPath),
      normalizeLookupKey(baseName),
      normalizeLookupKey(baseName.replace(/-/g, " ")),
    ])

    for (const key of variants) {
      if (!key) continue
      linkMap[key] = slug
    }
  }

  return linkMap
}

/**
 * Extract a section from a hast tree starting at the heading that matches
 * `headingText` (from subpath like `#Heading Name`), until the next heading
 * of the same or higher level. Returns the full tree if heading not found.
 */
function extractSection(tree: Root, headingText: string): Root {
  const children = tree.children as Element[]
  let startIdx = -1
  let headingDepth = 6

  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
      const text = getTextContent(node).trim()
      if (text === headingText) {
        startIdx = i
        headingDepth = parseInt(node.tagName[1])
        break
      }
    }
  }

  if (startIdx === -1) return tree

  let endIdx = children.length
  for (let i = startIdx + 1; i < children.length; i++) {
    const node = children[i]
    if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
      const depth = parseInt(node.tagName[1])
      if (depth <= headingDepth) {
        endIdx = i
        break
      }
    }
  }

  return { type: "root", children: children.slice(startIdx, endIdx) }
}

/** Escape `</` to prevent breaking out of a <script> tag */
function safeJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/<\//g, "<\\/")
}

function getTextContent(node: Element | Root): string {
  let text = ""
  for (const child of node.children ?? []) {
    if (child.type === "text") {
      text += child.value
    } else if ("children" in child) {
      text += getTextContent(child as Element)
    }
  }
  return text
}

/**
 * Pre-render HTML content for each file node in the canvas.
 * Returns a map of nodeId → rendered HTML string.
 */
function preRenderNodeContent(
  canvas: CanvasRaw,
  contentMap: Map<string, [Root, any]>,
): Map<string, string> {
  const rendered = new Map<string, string>()

  for (const node of canvas.nodes) {
    if (node.type !== "file" || !node.file) continue
    if (/\.(png|jpg|jpeg|gif|svg|webp|avif|bmp|ico)$/i.test(node.file)) continue

    const slug = slugifyMdPath(node.file)
    const entry = contentMap.get(slug)
    if (!entry) continue

    let [tree] = entry
    tree = JSON.parse(JSON.stringify(tree)) as Root

    if (node.subpath) {
      const headingText = node.subpath.replace(/^#/, "").trim()
      if (headingText) {
        tree = extractSection(tree, headingText)
      }
    }

    const html = toHtml(tree)
    rendered.set(node.id, html)
  }

  return rendered
}

export const CanvasPage: QuartzEmitterPlugin = () => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultContentPageLayout,
    pageBody: CanvasViewer,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "CanvasPage",
    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },
    async *emit(ctx, content, resources) {
      const { argv, cfg } = ctx
      const ignorePatterns = cfg.configuration.ignorePatterns
      const canvasFiles = await glob("**/*.canvas", argv.directory, ignorePatterns)
      const markdownFiles = await glob("**/*.md", argv.directory, ignorePatterns)
      const wikiLinkMap = buildWikiLinkMap(markdownFiles)

      // Build a slug → [tree, vfile] lookup from all processed content
      const contentMap = new Map<string, [Root, any]>()
      for (const [tree, file] of content) {
        const slug = file.data.slug as string
        if (slug) contentMap.set(slug, [tree as Root, file])
      }

      for (const fp of canvasFiles) {
        const fullPath = joinSegments(argv.directory, fp) as FilePath
        let raw: string
        try {
          raw = await fs.promises.readFile(fullPath, "utf-8")
        } catch {
          continue
        }
        let canvasData: CanvasRaw
        try {
          canvasData = JSON.parse(raw)
        } catch {
          continue
        }
        if (!isJsonCanvas(canvasData)) continue

        // Pre-render HTML for each file node
        const renderedContent = preRenderNodeContent(canvasData, contentMap)

        // Build the embedded data: canvas JSON + pre-rendered HTML per node
        const embeddedData = {
          ...canvasData,
          wikiLinkMap,
          nodes: canvasData.nodes.map((n) => ({
            ...n,
            renderedHtml: renderedContent.get(n.id) || undefined,
          })),
        }

        const slug = slugifyFilePath(fp as FilePath, true) as FullSlug
        const title = titleFromPath(fp)
        const [tree, vfile] = defaultProcessedContent({
          slug,
          text: "",
          description: title,
          frontmatter: { title, tags: [] },
          canvasPage: true,
          canvasEmbeddedData: safeJson(embeddedData),
        })

        const externalResources = pageResources(pathToRoot(slug), resources)
        const componentData: QuartzComponentProps = {
          ctx,
          fileData: vfile.data,
          externalResources,
          cfg: cfg.configuration,
          children: [],
          tree,
          allFiles: content.map((c) => c[1].data),
        }

        yield write({
          ctx,
          content: renderPage(cfg.configuration, slug, componentData, opts, externalResources),
          slug,
          ext: ".html",
        })
      }
    },
    async *partialEmit(ctx, content, resources, changeEvents) {
      const { argv, cfg } = ctx

      const contentMap = new Map<string, [Root, any]>()
      for (const [tree, file] of content) {
        const slug = file.data.slug as string
        if (slug) contentMap.set(slug, [tree as Root, file])
      }

      for (const ev of changeEvents) {
        const ext = path.extname(ev.path)
        if (ext !== ".canvas") continue

        if (ev.type === "delete") {
          const slug = slugifyFilePath(ev.path as FilePath, true) as FullSlug
          const outPath = path.join(argv.output, ...slug.split("/")) + ".html"
          try {
            await fs.promises.unlink(outPath)
          } catch {
            /* ignore */
          }
          continue
        }

        if (ev.type === "add" || ev.type === "change") {
          const fullPath = joinSegments(argv.directory, ev.path) as FilePath
          let raw: string
          try {
            raw = await fs.promises.readFile(fullPath, "utf-8")
          } catch {
            continue
          }
          let canvasData: CanvasRaw
          try {
            canvasData = JSON.parse(raw)
          } catch {
            continue
          }
          if (!isJsonCanvas(canvasData)) continue

          const markdownFiles = await glob(
            "**/*.md",
            argv.directory,
            cfg.configuration.ignorePatterns,
          )
          const wikiLinkMap = buildWikiLinkMap(markdownFiles)
          const renderedContent = preRenderNodeContent(canvasData, contentMap)
          const embeddedData = {
            ...canvasData,
            wikiLinkMap,
            nodes: canvasData.nodes.map((n) => ({
              ...n,
              renderedHtml: renderedContent.get(n.id) || undefined,
            })),
          }

          const slug = slugifyFilePath(ev.path as FilePath, true) as FullSlug
          const title = titleFromPath(ev.path)
          const [tree, vfile] = defaultProcessedContent({
            slug,
            text: "",
            description: title,
            frontmatter: { title, tags: [] },
            canvasPage: true,
            canvasEmbeddedData: safeJson(embeddedData),
          })

          const externalResources = pageResources(pathToRoot(slug), resources)
          const componentData: QuartzComponentProps = {
            ctx,
            fileData: vfile.data,
            externalResources,
            cfg: cfg.configuration,
            children: [],
            tree,
            allFiles: content.map((c) => c[1].data),
          }

          yield write({
            ctx,
            content: renderPage(cfg.configuration, slug, componentData, opts, externalResources),
            slug,
            ext: ".html",
          })
        }
      }
    },
  }
}
