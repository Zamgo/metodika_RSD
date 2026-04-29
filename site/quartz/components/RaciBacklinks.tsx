import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative, simplifySlug } from "../util/path"
import { classNames } from "../util/lang"
import style from "./styles/raciBacklinks.scss"
// @ts-ignore - inline script vyžaduje bundler
import script from "./scripts/raciBacklinks.inline"

type Letter = "R" | "A" | "C" | "I"

const RACI_KEYS: ReadonlyArray<{
  key: string
  letter: Letter
  label: string
  colorClass: string
}> = [
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
]

/** Plochý seznam hodnot — zvládá stringy, pole a wikilinky `[[cíl|alias]]`. */
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

/** Odstraní duplicitní prefix `oznaceni` z titulu, pokud titul začíná na
 *  např. „1.1.1 - …" nebo „1.1.1 – …". Zachovává originál, když neodpovídá. */
function stripOznaceniPrefix(title: string, oznaceni: string | undefined): string {
  if (!oznaceni) return title
  const esc = oznaceni.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(`^${esc}\\s*[–-]\\s*`)
  return title.replace(re, "").trim() || title
}

function formatCinnostLabel(title: string, oznaceni?: string): string {
  const cleanTitle = stripOznaceniPrefix(title, oznaceni)
  return oznaceni ? `${oznaceni} – ${cleanTitle}` : cleanTitle
}

/** Text z wikilinku → samotný cíl / alias (první hodnota). */
function plainFromWiki(raw: unknown): string {
  const arr = extractNames(raw)
  return arr[0] ?? (typeof raw === "string" ? raw.trim() : "")
}

/** Cíl wikilinku bez alias-u a bez nadpisu (#). */
function wikiTarget(raw: unknown): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  const m = s.match(/^\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]$/)
  if (!m) return null
  return m[1].trim()
}

type DilciMatch = {
  slug: FullSlug
  title: string
  oznaceni?: string
  /** Primární nadřazená činnost pro zoskupení (parsováno z frontmatter `cinnost`). */
  cinnostTarget: string | null
  fazeList: string[]
}

type CinnostGroup = {
  id: string
  oznaceni: string
  title: string
  slug: FullSlug | null
  faze: string[]
  items: DilciMatch[]
}

type LetterBucket = {
  letter: Letter
  label: string
  colorClass: string
  totalCount: number
  groups: CinnostGroup[]
}

interface RaciBacklinksOptions {
  hideWhenEmpty: boolean
}

const defaultOptions: RaciBacklinksOptions = {
  hideWhenEmpty: true,
}

function fazeFromFrontmatter(fm: Record<string, unknown>): string[] {
  const raw = fm.faze
  if (raw == null) return []
  const items = Array.isArray(raw) ? raw : [raw]
  const out: string[] = []
  for (const item of items) {
    const label = plainFromWiki(item)
    if (label) out.push(label)
  }
  return out
}

/**
 * Heuristika pro dohledání slugu pro zobrazení. V tomto komponentu se používá jen
 * pro nalezení slugu hlavní stránky „Seznam všech činností" — pokud existuje. Jinak
 * vrací null.
 */
function findSeznamCinnostiSlug(allFiles: QuartzComponentProps["allFiles"]): FullSlug | null {
  for (const f of allFiles) {
    const slug = (f.slug ?? "").toLowerCase()
    const title = String(f.frontmatter?.title ?? "").toLowerCase()
    const permalink = String(f.frontmatter?.permalink ?? "")
      .replace(/^\/+|\/+$/g, "")
      .toLowerCase()
    if (
      permalink === "cinnosti" ||
      title === "seznam všech činností" ||
      slug === "seznam-cinnosti" ||
      slug.endsWith("/seznam-cinnosti") ||
      slug === "seznam-činností" ||
      slug.endsWith("/seznam-činností") ||
      slug === "02---seznam-činností" ||
      slug.endsWith("/02---seznam-činností")
    ) {
      return f.slug as FullSlug
    }
  }
  return null
}

/** Zda je jmenný celek `name` shodný/obsaženo s některým z search termů (role + aliasy). */
function nameMatchesTerms(name: string, terms: Set<string>): boolean {
  const n = normalize(name)
  if (!n) return false
  if (terms.has(n)) return true
  for (const t of terms) {
    if (!t) continue
    if (n === t || n.includes(t) || t.includes(n)) return true
  }
  return false
}

export default ((opts?: Partial<RaciBacklinksOptions>) => {
  const options: RaciBacklinksOptions = { ...defaultOptions, ...opts }

  const RaciBacklinks: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const pageTitle = String(fileData.frontmatter?.title ?? "")
    const aliasesRaw = (fileData.frontmatter as Record<string, unknown>)?.aliases
    const aliases = Array.isArray(aliasesRaw)
      ? (aliasesRaw as unknown[]).map((v) => String(v))
      : []

    const searchTerms = new Set(
      [pageTitle, ...aliases].map((s) => normalize(String(s))).filter(Boolean),
    )
    if (searchTerms.size === 0) return null

    // Index nadřazených činností pro dohledání labelu/slugu podle wikilink targetu.
    type CinnostIdx = { oznaceni: string; title: string; slug: FullSlug }
    const cinnostByTarget = new Map<string, CinnostIdx>()
    for (const f of allFiles) {
      if (f.frontmatter?.typ !== "cinnost") continue
      const title = String(f.frontmatter?.title ?? simplifySlug(f.slug!))
      const oznaceni = String(f.frontmatter?.oznaceni ?? "")
      const entry: CinnostIdx = {
        oznaceni,
        title,
        slug: f.slug as FullSlug,
      }
      cinnostByTarget.set(normalize(title), entry)
      // Ve frontmatteru se na činnost typicky odkazuje targetem `1.1 - …`
      // Basename souboru je v Quartz slugu, ale pro map klíč nám stačí titul.
      // Pro jistotu přidáme i variantu se značením na začátku.
      if (oznaceni) {
        cinnostByTarget.set(normalize(`${oznaceni} - ${title}`), entry)
      }
    }

    // 1) Sesbíráme všechny `ukol`, kde rola figuruje v některém z R/A/C/I.
    const buckets: Record<Letter, Map<string, CinnostGroup>> = {
      R: new Map(),
      A: new Map(),
      C: new Map(),
      I: new Map(),
    }
    const totalByLetter: Record<Letter, number> = { R: 0, A: 0, C: 0, I: 0 }
    const discoveredFaze: string[] = []
    const seenFaze = new Set<string>()

    for (const file of allFiles) {
      if (file.slug === fileData.slug) continue
      if (file.frontmatter?.typ !== "ukol") continue
      const fm = (file.frontmatter ?? {}) as Record<string, unknown>

      const fazeList = fazeFromFrontmatter(fm)
      for (const fz of fazeList) {
        if (!seenFaze.has(fz)) {
          seenFaze.add(fz)
          discoveredFaze.push(fz)
        }
      }

      const cinnostTarget = wikiTarget(fm.cinnost)
      const cinnostKey = cinnostTarget ? normalize(cinnostTarget) : ""
      const cinnostInfo = cinnostKey ? cinnostByTarget.get(cinnostKey) : undefined
      const fallbackTitle = cinnostTarget ?? "(bez nadřazené činnosti)"
      const fallbackOznaceni = cinnostTarget
        ? cinnostTarget.match(/^(\d+(?:\.\d+)*)/)?.[1] ?? ""
        : ""

      const groupId =
        cinnostInfo?.slug ?? cinnostKey ?? `__noop__${Math.random().toString(36).slice(2)}`

      for (const rk of RACI_KEYS) {
        const rawValue = fm[rk.key]
        const names = extractNames(rawValue)
        const matched = names.some((n) => nameMatchesTerms(n, searchTerms))
        if (!matched) continue

        const bucket = buckets[rk.letter]
        let group = bucket.get(groupId)
        if (!group) {
          group = {
            id: groupId,
            oznaceni: cinnostInfo?.oznaceni ?? fallbackOznaceni,
            title: cinnostInfo?.title ?? fallbackTitle,
            slug: cinnostInfo?.slug ?? null,
            faze: [],
            items: [],
          }
          bucket.set(groupId, group)
        }

        for (const fz of fazeList) {
          if (!group.faze.includes(fz)) group.faze.push(fz)
        }

        group.items.push({
          slug: file.slug as FullSlug,
          title: String(file.frontmatter?.title ?? simplifySlug(file.slug!)),
          oznaceni: fm.oznaceni as string | undefined,
          cinnostTarget,
          fazeList,
        })
        totalByLetter[rk.letter]++
      }
    }

    const totalMatches =
      totalByLetter.R + totalByLetter.A + totalByLetter.C + totalByLetter.I
    if (options.hideWhenEmpty && totalMatches === 0) return null

    // 2) Převedeme na pole letter-bucketů, každou skupinu činnosti seřadíme.
    const letterBuckets: LetterBucket[] = RACI_KEYS.map((rk) => {
      const groups = [...buckets[rk.letter].values()]
      groups.sort((a, b) =>
        (a.oznaceni || a.title).localeCompare(b.oznaceni || b.title, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      )
      for (const g of groups) {
        g.items.sort((a, b) => {
          if (a.oznaceni && b.oznaceni)
            return a.oznaceni.localeCompare(b.oznaceni, undefined, { numeric: true })
          return a.title.localeCompare(b.title, "cs", { numeric: true })
        })
      }
      return {
        letter: rk.letter,
        label: rk.label,
        colorClass: rk.colorClass,
        totalCount: totalByLetter[rk.letter],
        groups,
      }
    })

    // 3) Seznam fází pro chip filter: jen ty, které se skutečně objevily v matches
    //    (nikoliv všechny fáze ze všech úkolů v úložišti).
    const matchedFaze = new Set<string>()
    for (const lb of letterBuckets) {
      for (const g of lb.groups) {
        for (const fz of g.faze) matchedFaze.add(fz)
      }
    }
    const fazeChips = discoveredFaze.filter((fz) => matchedFaze.has(fz))

    // Link na kompletní seznam všech činností (pokud je v úložišti).
    const seznamSlug = findSeznamCinnostiSlug(allFiles)
    const seznamHref = seznamSlug ? resolveRelative(fileData.slug!, seznamSlug) : null

    return (
      <div
        class={classNames(displayClass, "raci-backlinks")}
        data-raci-backlinks
        data-filter-active="false"
      >
        <div class="raci-backlinks-header">
          <div>
            <h3>Propojení v RACI matici</h3>
            <p class="raci-backlinks-desc">Úkoly, kde tato role figuruje v matici odpovědností:</p>
          </div>
          {seznamHref ? (
            <a class="raci-backlinks-full-link" href={seznamHref}>
              Celý seznam všech činností →
            </a>
          ) : null}
        </div>

        <div class="raci-backlinks-filters" role="group" aria-label="Filtry">
          <div class="raci-filter-row" data-filter-group="letter">
            <span class="raci-filter-row-label">Role v RACI:</span>
            {RACI_KEYS.map((rk) => (
              <button
                type="button"
                class={`raci-chip raci-chip-letter ${rk.colorClass}`}
                data-letter={rk.letter}
                aria-pressed="false"
              >
                <span class={`raci-chip-dot ${rk.colorClass}`}></span>
                {rk.letter}
              </button>
            ))}
          </div>
          {fazeChips.length > 0 ? (
            <div class="raci-filter-row" data-filter-group="faze">
              <span class="raci-filter-row-label">Fáze:</span>
              {fazeChips.map((fz) => (
                <button
                  type="button"
                  class="raci-chip raci-chip-faze"
                  data-faze={fz}
                  aria-pressed="false"
                >
                  {fz}
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            class="raci-filter-reset"
            data-filter-reset
            hidden
            aria-label="Zrušit filtr"
          >
            Zrušit filtr
          </button>
        </div>

        <div class="raci-groups">
          {letterBuckets.map((lb) => (
            <details
              class={`raci-group ${lb.colorClass}`}
              data-letter={lb.letter}
              data-total={lb.totalCount}
            >
              <summary class="raci-group-header">
                <span class={`raci-badge ${lb.colorClass}`}>{lb.letter}</span>
                <span class="raci-group-label">{lb.label}</span>
              </summary>
              <div class="raci-group-content">
                {lb.groups.map((g) => {
                  const hrefGroup = g.slug ? resolveRelative(fileData.slug!, g.slug) : null
                  return (
                    <details
                      class="raci-cinnost-group"
                      data-cinnost-id={g.id}
                      data-count={g.items.length}
                      data-faze-list={g.faze.join("|")}
                    >
                      <summary class="raci-cinnost-header">
                        <span class="raci-cinnost-main-cell">
                          {hrefGroup ? (
                            <a
                              href={hrefGroup}
                              class="internal raci-cinnost-main-link"
                              onClick={(evt) => evt.stopPropagation()}
                            >
                              <span class="raci-cinnost-title">
                                {formatCinnostLabel(g.title, g.oznaceni)}
                              </span>
                            </a>
                          ) : (
                            <span class="raci-cinnost-title">
                              {formatCinnostLabel(g.title, g.oznaceni)}
                            </span>
                          )}
                        </span>
                        <span class="raci-cinnost-faze">
                          {g.faze.map((fz) => (
                            <span class="raci-faze-chip" data-faze={fz}>
                              {fz}
                            </span>
                          ))}
                        </span>
                      </summary>
                      <ul class="raci-cinnost-items">
                        {g.items.map((entry) => {
                          const itemFaze = entry.fazeList.join("|")
                          return (
                            <li
                              class="raci-item"
                              data-letter={lb.letter}
                              data-faze-list={itemFaze}
                            >
                              <a
                                href={resolveRelative(fileData.slug!, entry.slug)}
                                class="internal"
                              >
                                {formatCinnostLabel(entry.title, entry.oznaceni)}
                              </a>
                              {entry.fazeList.length > 0 ? (
                                <span class="raci-item-faze">
                                  {entry.fazeList.map((fz) => (
                                    <span class="raci-faze-chip" data-faze={fz}>
                                      {fz}
                                    </span>
                                  ))}
                                </span>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    </details>
                  )
                })}
              </div>
            </details>
          ))}
        </div>
      </div>
    )
  }

  RaciBacklinks.css = style
  RaciBacklinks.afterDOMLoaded = script

  return RaciBacklinks
}) satisfies QuartzComponentConstructor
