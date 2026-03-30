import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import type { Code, Html, Root } from "mdast"

interface DvColumn {
  field: string
  alias: string
}

interface DvSort {
  field: string
  dir: "ASC" | "DESC"
}

interface DvConfig {
  columns: DvColumn[]
  filterTyp: string
  linkField: string
  sort: DvSort[]
}

function splitByCommasOutsideQuotes(s: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuote = false
  for (const ch of s) {
    if (ch === '"') {
      inQuote = !inQuote
      current += ch
    } else if (ch === "," && !inQuote) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  if (current.trim()) result.push(current.trim())
  return result
}

/**
 * Parse a Dataview TABLE query into a structured config object.
 * Handles the subset of DQL used in this vault:
 *   TABLE WITHOUT ID <col> AS "Label", ...
 *   FROM "folder"
 *   WHERE typ = "value" AND linkField = this.file.link
 *   SORT field ASC, field2 DESC
 */
function parseDQL(body: string): DvConfig | null {
  const normalized = body.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n")
  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  const tableLine = lines.find((l) => /^TABLE\s/i.test(l))
  if (!tableLine) return null

  const colPart = tableLine.replace(/^TABLE\s+(WITHOUT\s+ID\s+)?/i, "").trim()
  const columns: DvColumn[] = []
  for (const cp of splitByCommasOutsideQuotes(colPart)) {
    const m = cp.match(/^(.+?)\s+AS\s+"([^"]+)"$/i)
    if (m) {
      columns.push({ field: m[1].trim(), alias: m[2] })
    } else {
      columns.push({ field: cp.trim(), alias: cp.trim() })
    }
  }

  const whereLine = lines.find((l) => /^WHERE\s/i.test(l))
  let filterTyp = ""
  let linkField = ""
  if (whereLine) {
    const typMatch = whereLine.match(/typ\s*=\s*"([^"]+)"/i)
    if (typMatch) filterTyp = typMatch[1]
    const linkMatch = whereLine.match(/(\w+)\s*=\s*this\.file\.link/i)
    if (linkMatch) linkField = linkMatch[1]
  }

  const sortLine = lines.find((l) => /^SORT\s/i.test(l))
  const sort: DvSort[] = []
  if (sortLine) {
    const sortBody = sortLine.replace(/^SORT\s+/i, "")
    for (const sp of sortBody.split(",")) {
      const sm = sp.trim().match(/^(\S+)\s+(ASC|DESC)$/i)
      if (sm) {
        sort.push({ field: sm[1], dir: sm[2].toUpperCase() as "ASC" | "DESC" })
      } else if (sp.trim()) {
        sort.push({ field: sp.trim(), dir: "ASC" })
      }
    }
  }

  if (columns.length === 0) return null
  return { columns, filterTyp, linkField, sort }
}

export const ProcesniOblastDataview: QuartzTransformerPlugin = () => ({
  name: "ProcesniOblastDataview",
  markdownPlugins() {
    return [
      () => {
        return (tree: Root, file) => {
          const typ = file.data.frontmatter?.typ
          if (typ !== "procesni_oblast") return
          visit(tree, "code", (node: Code, index, parent) => {
            if (node.lang !== "dataview" || parent == null || index == null) return
            const config = parseDQL(node.value ?? "")
            if (!config) return
            const configJson = JSON.stringify(config)
              .replace(/&/g, "&amp;")
              .replace(/"/g, "&quot;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
            const html: Html = {
              type: "html",
              value: `<div class="quartz-oblast-dv" data-dv-config="${configJson}"></div>`,
            }
            parent.children[index] = html
          })
        }
      },
    ]
  },
})
