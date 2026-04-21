import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { createSlugResolverFromAllFiles } from "../util/metadataWikilinks"
import style from "./styles/rolePortal.scss"
// @ts-ignore
import script from "./scripts/rolePortal.inline"

type FrontmatterLike = Record<string, unknown>

type PhaseKey = "priprava" | "realizace" | "provoz" | "all"

const RACI_R_KEY = "R - Odpovědnost za provádění činnosti"
const RACI_A_KEY = "A - Právní odpovědnost za dokončení činnosti"

const PHASE_TABS: { key: PhaseKey; label: string }[] = [
  { key: "all", label: "Vše" },
  { key: "priprava", label: "Příprava" },
  { key: "realizace", label: "Realizace" },
  { key: "provoz", label: "Provoz" },
]

type TaskCard = {
  slug: FullSlug
  title: string
  description: string
  oznaceni: string
  phases: string[]
  typ: string
  raciLetter: string
}

function coerceString(value: unknown): string {
  if (value == null) return ""
  if (Array.isArray(value)) return value.map(coerceString).filter(Boolean).join(", ")
  return String(value).trim()
}

function coerceArray(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) return value.map(coerceString).filter(Boolean)
  const raw = coerceString(value)
  if (!raw) return []
  return raw.split(",").map((s) => s.trim()).filter(Boolean)
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
}

function extractRaciNames(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value.flatMap((v) => extractRaciNames(v))
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

function normalizePhase(raw: string): string {
  let v = raw.toLowerCase().trim()
  const wikiMatch = v.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/)
  if (wikiMatch) {
    v = (wikiMatch[2] ?? wikiMatch[1]).trim()
  }
  if (v.startsWith("přípr") || v.startsWith("pripr") || v === "priprava") return "priprava"
  if (v.startsWith("real") || v === "realizace") return "realizace"
  if (v.startsWith("prov") || v === "provoz") return "provoz"
  return v
}

function buildIconLabel(title: string, explicit?: string): string {
  if (explicit) {
    const trimmed = explicit.trim()
    if (trimmed) return trimmed
  }
  const words = title.split(/\s+/).filter(Boolean)
  const initials = words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("")
  return initials || title.slice(0, 2).toUpperCase()
}

function collectTaskCards(
  allFiles: QuartzPluginData[],
  currentSlug: FullSlug,
  searchTerms: string[],
): TaskCard[] {
  const cards: TaskCard[] = []
  const seen = new Set<string>()

  for (const file of allFiles) {
    if (file.slug === currentSlug) continue
    const fm = (file.frontmatter ?? {}) as FrontmatterLike
    const typ = coerceString(fm.typ)
    if (typ !== "cinnost" && typ !== "dilci_cinnost" && typ !== "workflow") continue

    const rValues = extractRaciNames(fm[RACI_R_KEY]).map(normalize)
    const aValues = extractRaciNames(fm[RACI_A_KEY]).map(normalize)
    const hasR = searchTerms.some((t) =>
      rValues.some((name) => name === t || name.includes(t) || t.includes(name)),
    )
    const hasA = searchTerms.some((t) =>
      aValues.some((name) => name === t || name.includes(t) || t.includes(name)),
    )

    if (!hasR && !hasA) continue

    const key = String(file.slug)
    if (seen.has(key)) continue
    seen.add(key)

    const title = coerceString(fm.title) || "(bez názvu)"
    const oznaceni = coerceString(fm.oznaceni)
    const description = coerceString(fm.popis) || coerceString(fm.description)
    const phases = coerceArray(fm.faze).map(normalizePhase)

    cards.push({
      slug: file.slug!,
      title,
      description,
      oznaceni,
      phases,
      typ,
      raciLetter: hasR ? "R" : "A",
    })
  }

  cards.sort((a, b) => {
    if (a.oznaceni && b.oznaceni) {
      return a.oznaceni.localeCompare(b.oznaceni, undefined, { numeric: true })
    }
    return a.title.localeCompare(b.title, "cs")
  })

  return cards
}

function getTypBadgeLabel(typ: string): string {
  if (typ === "workflow") return "Workflow"
  if (typ === "cinnost") return "Činnost"
  if (typ === "dilci_cinnost") return "Dílčí činnost"
  return typ
}

function getPhaseLabel(phaseKey: string): string {
  if (phaseKey === "priprava") return "Příprava"
  if (phaseKey === "realizace") return "Realizace"
  if (phaseKey === "provoz") return "Provoz"
  return phaseKey
}

function resolveKlicovePojmy(
  raw: unknown,
  resolver: (path: string) => FullSlug | null,
  currentSlug: FullSlug,
): { href: string; label: string }[] {
  const out: { href: string; label: string }[] = []
  const entries = Array.isArray(raw) ? raw.map(coerceString) : [coerceString(raw)]
  for (const entry of entries) {
    if (!entry) continue
    const match = entry.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/)
    if (!match) {
      out.push({ href: "#", label: entry })
      continue
    }
    const target = match[1].trim()
    const label = (match[2] || target).trim()
    const slug = resolver(target)
    if (slug) {
      out.push({ href: resolveRelative(currentSlug, slug), label })
    } else {
      out.push({ href: "#", label })
    }
  }
  return out
}

const RolePortal: QuartzComponent = ({
  fileData,
  allFiles,
  displayClass,
}: QuartzComponentProps) => {
  const fm = (fileData.frontmatter ?? {}) as FrontmatterLike
  const typ = coerceString(fm.typ)
  if (typ !== "role" && typ !== "smluvni_strana") return null

  const currentSlug = fileData.slug as FullSlug
  const title = coerceString(fm.title) || "(bez názvu)"
  const aliases = coerceArray(fm.aliases)
  const popisKarta = coerceString(fm.popis_karta) || coerceString(fm.description)
  const icon = coerceString(fm.ikona) || undefined
  const badgeLabel = typ === "role" ? "Role v týmu" : "Smluvní strana"

  const searchTerms = [title, ...aliases].map(normalize).filter(Boolean)
  const taskCards = collectTaskCards(allFiles, currentSlug, searchTerms)

  const availablePhases = new Set<string>()
  for (const c of taskCards) {
    for (const p of c.phases) availablePhases.add(p)
  }
  const visibleTabs = PHASE_TABS.filter(
    (t) => t.key === "all" || availablePhases.has(t.key),
  )

  const resolver = createSlugResolverFromAllFiles(allFiles)
  const klicovePojmy = resolveKlicovePojmy(fm.klicove_pojmy, resolver, currentSlug)
  const sablony = resolveKlicovePojmy(fm.sablony, resolver, currentSlug)
  const nadrizenaRole = fm.nadrizena_role
    ? resolveKlicovePojmy(fm.nadrizena_role, resolver, currentSlug)[0]
    : undefined
  const ekvivalent = fm.ekvivalent
    ? resolveKlicovePojmy(fm.ekvivalent, resolver, currentSlug)[0]
    : undefined
  const ramec = coerceString(fm.ramec)

  return (
    <div class={`role-portal ${displayClass ?? ""}`.trim()}>
      <section class="role-portal-header" aria-labelledby="role-portal-title">
        <div class="role-portal-header-main">
          <span class="role-portal-icon">{buildIconLabel(title, icon)}</span>
          <div class="role-portal-header-text">
            <span class="role-portal-badge">
              {badgeLabel}
              {ramec && <span class="role-portal-ramec"> · {ramec}</span>}
            </span>
            <h1 id="role-portal-title" class="role-portal-title">
              {title}
            </h1>
            {aliases.length > 0 && (
              <p class="role-portal-aliases">{aliases.join(" · ")}</p>
            )}
            {popisKarta && <p class="role-portal-desc">{popisKarta}</p>}
            <div class="role-portal-meta">
              {nadrizenaRole && (
                <span>
                  Nadřízená role:{" "}
                  <a href={nadrizenaRole.href} class="internal">
                    {nadrizenaRole.label}
                  </a>
                </span>
              )}
              {ekvivalent && (
                <span>
                  Ekvivalent:{" "}
                  <a href={ekvivalent.href} class="internal">
                    {ekvivalent.label}
                  </a>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {taskCards.length > 0 && (
        <section class="role-portal-tasks" aria-labelledby="role-portal-tasks-title">
          <h2 id="role-portal-tasks-title" class="role-portal-section-title">
            Vaše činnosti
          </h2>
          <p class="role-portal-section-hint">
            Činnosti a workflow, kde je tato role označena jako odpovědná (R) nebo
            schvalovatel (A). Filtrujte podle fáze projektu.
          </p>
          <div
            class="role-portal-tabs"
            role="tablist"
            aria-label="Filtr podle fáze"
          >
            {visibleTabs.map((tab, idx) => (
              <button
                type="button"
                class={`role-portal-tab${idx === 0 ? " is-active" : ""}`}
                role="tab"
                aria-selected={idx === 0 ? "true" : "false"}
                data-phase-tab={tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <ul class="role-portal-task-grid" role="list">
            {taskCards.map((card) => (
              <li
                class="role-portal-task"
                data-phases={card.phases.length > 0 ? card.phases.join(" ") : "all"}
              >
                <a
                  class="role-portal-task-link"
                  href={resolveRelative(currentSlug, card.slug)}
                >
                  <div class="role-portal-task-head">
                    <span class={`role-portal-raci raci-${card.raciLetter.toLowerCase()}`}>
                      {card.raciLetter}
                    </span>
                    <span class="role-portal-task-typ">{getTypBadgeLabel(card.typ)}</span>
                  </div>
                  <p class="role-portal-task-title">
                    {card.oznaceni ? `${card.oznaceni} – ` : ""}
                    {card.title}
                  </p>
                  {card.description && (
                    <p class="role-portal-task-desc">{card.description}</p>
                  )}
                  {card.phases.length > 0 && (
                    <div class="role-portal-task-phases">
                      {card.phases.map((p) => (
                        <span class={`role-portal-phase-chip phase-${p}`}>
                          {getPhaseLabel(p)}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {klicovePojmy.length > 0 && (
        <section class="role-portal-concepts">
          <h2 class="role-portal-section-title">Co byste měli znát</h2>
          <ul class="role-portal-concepts-list">
            {klicovePojmy.map((k) => (
              <li>
                <a class="internal" href={k.href}>
                  {k.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sablony.length > 0 && (
        <section class="role-portal-templates">
          <h2 class="role-portal-section-title">Šablony a podklady</h2>
          <ul class="role-portal-templates-list">
            {sablony.map((s) => (
              <li>
                <a class="internal" href={s.href}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

RolePortal.css = style
RolePortal.afterDOMLoaded = script

export default (() => RolePortal) satisfies QuartzComponentConstructor
