import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import style from "./styles/homeLanding.scss"
// @ts-ignore
import script from "./scripts/homeLanding.inline"

type FrontmatterLike = Record<string, unknown>

type PersonaCard = {
  slug: FullSlug
  title: string
  aliases: string[]
  description: string
  badgeLabel: string
  icon?: string
  order: number
}

type QuickLink = {
  label: string
  slug?: FullSlug
}

const ROLE_TYPES = new Set(["role", "smluvni_strana"])

function coerceString(value: unknown): string {
  if (value == null) return ""
  if (Array.isArray(value)) return value.map(coerceString).filter(Boolean).join(", ")
  return String(value).trim()
}

function coerceArray(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) return value.map(coerceString).filter(Boolean)
  const raw = coerceString(value)
  return raw ? [raw] : []
}

function coerceBool(value: unknown): boolean {
  if (value === true) return true
  if (typeof value === "string") {
    return value.toLowerCase() === "true"
  }
  return false
}

function coerceOrder(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  const num = Number(coerceString(value))
  return Number.isFinite(num) ? num : 999
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

function pickPersonaCards(allFiles: QuartzPluginData[]): PersonaCard[] {
  const cards: PersonaCard[] = []
  for (const file of allFiles) {
    const fm = (file.frontmatter ?? {}) as FrontmatterLike
    const typ = coerceString(fm.typ)
    if (!ROLE_TYPES.has(typ)) continue
    if (!coerceBool(fm.show_na_rozcestniku)) continue

    const title = coerceString(fm.title) || "Bez názvu"
    const aliases = coerceArray(fm.aliases)
    const popisKarta = coerceString(fm.popis_karta) || coerceString(fm.description)
    const order = coerceOrder(fm.order)
    const badgeLabel = typ === "role" ? "Role" : "Smluvní strana"

    cards.push({
      slug: file.slug!,
      title,
      aliases,
      description: popisKarta,
      badgeLabel,
      icon: coerceString(fm.ikona) || undefined,
      order,
    })
  }

  cards.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.title.localeCompare(b.title, "cs")
  })

  return cards
}

function findSlugByTitleOrAlias(
  allFiles: QuartzPluginData[],
  candidates: string[],
): FullSlug | undefined {
  const normalized = candidates.map((c) => c.trim().toLowerCase()).filter(Boolean)
  if (normalized.length === 0) return undefined

  for (const file of allFiles) {
    const fm = (file.frontmatter ?? {}) as FrontmatterLike
    const title = coerceString(fm.title).toLowerCase()
    const aliases = coerceArray(fm.aliases).map((a) => a.toLowerCase())
    if (normalized.includes(title) || normalized.some((n) => aliases.includes(n))) {
      return file.slug
    }
  }
  return undefined
}

const QUICK_LINK_DEFS: { label: string; match: string[] }[] = [
  { label: "CDE", match: ["Společné datové prostředí (CDE)", "CDE"] },
  { label: "BEP", match: ["BIM Execution Plan (BEP)", "BEP"] },
  { label: "DiMS", match: ["DiMS"] },
  { label: "ZBV", match: ["ZBV"] },
  { label: "RDS", match: ["RDS"] },
  { label: "EIR", match: ["Požadavky objednatele na výměnu informací (EIR)", "EIR"] },
]

const NEXT_LINK_DEFS: { label: string; match: string[] }[] = [
  { label: "Seznam činností", match: ["Seznam činností"] },
  { label: "CDE workflow", match: ["CDE workflow"] },
  { label: "Slovník pojmů", match: ["05_Definice pojmů", "Definice pojmů"] },
  { label: "Úvod do metodiky", match: ["Úvod do metodiky ŘSD Plzeň"] },
]

const HomeLanding: QuartzComponent = ({
  fileData,
  allFiles,
  displayClass,
}: QuartzComponentProps) => {
  const currentSlug = fileData.slug as FullSlug
  const personaCards = pickPersonaCards(allFiles)

  const quickLinks: QuickLink[] = QUICK_LINK_DEFS.map((def) => ({
    label: def.label,
    slug: findSlugByTitleOrAlias(allFiles, def.match),
  })).filter((q) => q.slug)

  const nextLinks = NEXT_LINK_DEFS.map((def) => ({
    label: def.label,
    slug: findSlugByTitleOrAlias(allFiles, def.match),
  })).filter((q) => q.slug)

  return (
    <div class={`home-landing ${displayClass ?? ""}`.trim()}>
      <section class="home-landing-hero" aria-labelledby="home-landing-hero-title">
        <h1 id="home-landing-hero-title" class="home-landing-hero-title">
          Metodika ŘSD Plzeň
        </h1>
        <p class="home-landing-hero-subtitle">
          Znalostní databáze pro správu informací o stavbě. Najděte rychle pojem, činnost
          nebo roli — nebo začněte podle toho, kdo jste.
        </p>
        <div class="home-landing-hero-searchbox" role="search">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            class="home-landing-hero-input"
            placeholder="Hledat pojem, činnost, roli…"
            aria-label="Hledat v metodice"
          />
          <button type="button" class="home-landing-hero-button">
            Hledat
          </button>
        </div>
        {quickLinks.length > 0 && (
          <div class="home-landing-hero-chips" aria-label="Rychlé odkazy">
            {quickLinks.map((q) => (
              <a class="home-landing-chip" href={resolveRelative(currentSlug, q.slug!)}>
                {q.label}
              </a>
            ))}
          </div>
        )}
      </section>

      <h2 class="home-landing-section-title">Kdo jste?</h2>
      <p class="home-landing-section-hint">
        Vyberte svou roli nebo smluvní pozici — ukážeme vám vaše činnosti podle fáze projektu.
      </p>
      {personaCards.length === 0 ? (
        <p>
          <em>
            Žádná karta zatím není označena k zobrazení. Doplňte ve frontmatteru role nebo
            smluvní strany pole <code>show_na_rozcestniku: true</code>.
          </em>
        </p>
      ) : (
        <div class="home-landing-persona-grid">
          {personaCards.map((card) => (
            <a
              class="home-landing-persona-card"
              href={resolveRelative(currentSlug, card.slug)}
            >
              <div class="home-landing-card-head">
                <span class="home-landing-card-icon">
                  {buildIconLabel(card.title, card.icon)}
                </span>
                <div>
                  <p class="home-landing-card-title">{card.title}</p>
                  {card.aliases.length > 0 && (
                    <p class="home-landing-card-aliases">
                      {card.aliases.slice(0, 2).join(" · ")}
                    </p>
                  )}
                </div>
              </div>
              <span class="home-landing-card-badge">{card.badgeLabel}</span>
              {card.description && (
                <p class="home-landing-card-desc">{card.description}</p>
              )}
            </a>
          ))}
        </div>
      )}

      {nextLinks.length > 0 && (
        <div class="home-landing-next" aria-label="Kam dál">
          <strong>Kam dál</strong>
          <ul>
            {nextLinks.map((n) => (
              <li>
                <a href={resolveRelative(currentSlug, n.slug!)}>{n.label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

HomeLanding.css = style
HomeLanding.afterDOMLoaded = script

export default (() => HomeLanding) satisfies QuartzComponentConstructor
