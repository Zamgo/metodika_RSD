import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { FilePath, FullSlug, joinSegments, slugifyFilePath } from "../../util/path"
import { sharedPageComponents } from "../../../quartz.layout"
import CanvasViewer from "../../components/CanvasViewer"
import { defaultProcessedContent } from "../vfile"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import path from "path"
import fs from "fs"
import { glob } from "../../util/glob"

function isJsonCanvas(data: unknown): data is { nodes?: unknown[]; edges?: unknown[] } {
  if (!data || typeof data !== "object") return false
  const o = data as Record<string, unknown>
  return Array.isArray(o.nodes) || Array.isArray(o.edges)
}

function titleFromPath(fp: string): string {
  const base = path.basename(fp, ".canvas")
  return base.replace(/-/g, " ").trim() || "Canvas"
}

export const CanvasPage: QuartzEmitterPlugin = () => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    pageBody: CanvasViewer,
    beforeBody: [],
    left: [],
    right: [],
  }

  const { head: Head, pageBody, footer: Footer } = opts
  const Body = BodyConstructor()

  return {
    name: "CanvasPage",
    getQuartzComponents() {
      return [Head, Body, pageBody, Footer]
    },
    async *emit(ctx, _content, resources) {
      const { argv, cfg } = ctx
      const ignorePatterns = cfg.configuration.ignorePatterns
      const canvasFiles = await glob("**/*.canvas", argv.directory, ignorePatterns)

      for (const fp of canvasFiles) {
        const fullPath = joinSegments(argv.directory, fp) as FilePath
        let raw: string
        try {
          raw = await fs.promises.readFile(fullPath, "utf-8")
        } catch {
          continue
        }
        let data: unknown
        try {
          data = JSON.parse(raw)
        } catch {
          continue
        }
        if (!isJsonCanvas(data)) continue

        const slug = slugifyFilePath(fp as FilePath, true) as FullSlug
        const title = titleFromPath(fp)
        const [tree, vfile] = defaultProcessedContent({
          slug,
          text: "",
          description: title,
          frontmatter: { title, tags: [] },
          canvasPage: true,
        })

        const externalResources = pageResources(slug, resources)
        const componentData: QuartzComponentProps = {
          ctx,
          fileData: vfile.data,
          externalResources,
          cfg: cfg.configuration,
          children: [],
          tree,
          allFiles: [],
        }

        yield write({
          ctx,
          content: renderPage(cfg.configuration, slug, componentData, opts, externalResources),
          slug,
          ext: ".html",
        })
      }
    },
    async *partialEmit(ctx, _content, resources, changeEvents) {
      const { argv, cfg } = ctx
      const ignorePatterns = cfg.configuration.ignorePatterns

      for (const ev of changeEvents) {
        const ext = path.extname(ev.path)
        if (ext !== ".canvas") continue

        if (ev.type === "delete") {
          const slug = slugifyFilePath(ev.path as FilePath, true) as FullSlug
          const outPath = path.join(argv.output, ...slug.split("/")) + ".html"
          try {
            await fs.promises.unlink(outPath)
          } catch {
            // ignore
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
          let data: unknown
          try {
            data = JSON.parse(raw)
          } catch {
            continue
          }
          if (!isJsonCanvas(data)) continue

          const slug = slugifyFilePath(ev.path as FilePath, true) as FullSlug
          const title = titleFromPath(ev.path)
          const [tree, vfile] = defaultProcessedContent({
            slug,
            text: "",
            description: title,
            frontmatter: { title, tags: [] },
            canvasPage: true,
          })

          const externalResources = pageResources(slug, resources)
          const componentData: QuartzComponentProps = {
            ctx,
            fileData: vfile.data,
            externalResources,
            cfg: cfg.configuration,
            children: [],
            tree,
            allFiles: [],
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
