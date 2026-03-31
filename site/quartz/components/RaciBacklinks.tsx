import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative, simplifySlug } from "../util/path"
import { classNames } from "../util/lang"
import style from "./styles/raciBacklinks.scss"

const RACI_KEYS = [
  {
    key: "R - Odpovědnost za provádění činnosti",
    letter: "R",
    label: "Odpovědná osoba",
    colorClass: "raci-r",
  },
  {
    key: "A - Právní odpovědnost za dokončení činnosti",
    letter: "A",
    label: "Schvalovatel",
    colorClass: "raci-a",
  },
  {
    key: "C - Konzultace v průběhu činnosti",
    letter: "C",
    label: "Konzultována",
    colorClass: "raci-c",
  },
  {
    key: "I - Informování po dokončení činnosti",
    letter: "I",
    label: "Informována",
    colorClass: "raci-i",
  },
] as const

function extractNames(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value.flatMap((v) => extractNames(v))
  }
  const raw = String(value).trim()
  if (!raw) return []

  return raw.split(",").flatMap((part) => {
    const trimmed = part.trim()
    if (!trimmed) return []
    const wikiMatch = trimmed.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/)
    if (wikiMatch) {
      const target = wikiMatch[1].split("/").pop()?.trim() ?? wikiMatch[1].trim()
      const alias = wikiMatch[2]?.trim()
      return alias ? [alias, target] : [target]
    }
    return [trimmed]
  })
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
}

interface RaciBacklinksOptions {
  hideWhenEmpty: boolean
}

const defaultOptions: RaciBacklinksOptions = {
  hideWhenEmpty: true,
}

type RaciMatch = {
  slug: FullSlug
  title: string
  oznaceni?: string
}

export default ((opts?: Partial<RaciBacklinksOptions>) => {
  const options: RaciBacklinksOptions = { ...defaultOptions, ...opts }

  const RaciBacklinks: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const pageTitle = fileData.frontmatter?.title ?? ""
    const aliases: string[] = (fileData.frontmatter as Record<string, unknown>)?.aliases as string[] ?? []

    const searchTerms = [pageTitle, ...aliases].map(normalize).filter(Boolean)
    if (searchTerms.length === 0) return null

    const groups: Record<string, RaciMatch[]> = {}
    for (const rk of RACI_KEYS) {
      groups[rk.letter] = []
    }

    for (const file of allFiles) {
      if (file.slug === fileData.slug) continue
      const fm = (file.frontmatter ?? {}) as Record<string, unknown>

      for (const rk of RACI_KEYS) {
        const rawValue = fm[rk.key]
        const names = extractNames(rawValue).map(normalize)
        const matched = searchTerms.some((term) =>
          names.some((name) => name === term || name.includes(term) || term.includes(name)),
        )
        if (matched) {
          groups[rk.letter].push({
            slug: file.slug!,
            title: file.frontmatter?.title ?? simplifySlug(file.slug!),
            oznaceni: fm["oznaceni"] as string | undefined,
          })
        }
      }
    }

    const totalMatches = Object.values(groups).reduce((sum, arr) => sum + arr.length, 0)
    if (options.hideWhenEmpty && totalMatches === 0) return null

    const sortEntries = (entries: RaciMatch[]) =>
      [...entries].sort((a, b) => {
        if (a.oznaceni && b.oznaceni) return a.oznaceni.localeCompare(b.oznaceni, undefined, { numeric: true })
        return a.title.localeCompare(b.title, "cs")
      })

    return (
      <div class={classNames(displayClass, "raci-backlinks")}>
        <h3>Propojení v RACI matici</h3>
        <p class="raci-backlinks-desc">
          Činnosti a procesy, kde tato stránka figuruje v matici odpovědností:
        </p>
        <div class="raci-groups">
          {RACI_KEYS.map((rk) => {
            const entries = sortEntries(groups[rk.letter])
            if (entries.length === 0) return null
            return (
              <details class={`raci-group ${rk.colorClass}`}>
                <summary class="raci-group-header">
                  <span class={`raci-badge ${rk.colorClass}`}>{rk.letter}</span>
                  <span class="raci-group-label">
                    {rk.label} ({entries.length})
                  </span>
                </summary>
                <ul>
                  {entries.map((entry) => (
                    <li>
                      <a href={resolveRelative(fileData.slug!, entry.slug)} class="internal">
                        {entry.oznaceni ? `${entry.oznaceni} – ` : ""}
                        {entry.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )
          })}
        </div>
      </div>
    )
  }

  RaciBacklinks.css = style

  return RaciBacklinks
}) satisfies QuartzComponentConstructor
