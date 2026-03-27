import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import type { Code, Html, Root } from "mdast"

/**
 * Na stránkách typu procesni_oblast / pracovni_balicek nahradí bloky
 * ```dataview…``` placeholdery, které na webu vyplní runtime z contentIndexu.
 * (Quartz Dataview nevykonává.)
 */
function detectDataviewVariant(
  pageTyp: unknown,
  body: string,
): "balicky" | "cinnosti" | "balicek-cinnosti" | null {
  const w = body.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n")
  if (pageTyp === "pracovni_balicek") return "balicek-cinnosti"
  if (/typ\s*=\s*["']pracovni_balicek["']/i.test(w)) return "balicky"
  if (/typ\s*=\s*["']pracovní_balíček["']/i.test(w)) return "balicky"
  if (/typ\s*=\s*["']cinnost["']/i.test(w)) return "cinnosti"
  if (/typ\s*=\s*["']činnost["']/i.test(w)) return "cinnosti"
  return null
}

export const ProcesniOblastDataview: QuartzTransformerPlugin = () => ({
  name: "ProcesniOblastDataview",
  markdownPlugins() {
    return [
      () => {
        return (tree: Root, file) => {
          const typ = file.data.frontmatter?.typ
          if (typ !== "procesni_oblast" && typ !== "pracovni_balicek") return
          visit(tree, "code", (node: Code, index, parent) => {
            if (node.lang !== "dataview" || parent == null || index == null) return
            const variant = detectDataviewVariant(typ, node.value ?? "")
            if (!variant) return
            const html: Html = {
              type: "html",
              value: `<div class="quartz-oblast-dv" data-oblast-dv="${variant}"></div>`,
            }
            parent.children[index] = html
          })
        }
      },
    ]
  },
})
