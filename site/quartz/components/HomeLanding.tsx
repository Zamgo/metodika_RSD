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
  order: number
  typ: string
}

type ActivityEntry = {
  slug: string
  href: string
  title: string
  oznaceni: string
  faze: string[]
  rRoles: string[]
  aRoles: string[]
  cRoles: string[]
  iRoles: string[]
  popis: string
}

const ROLE_TYPES = new Set(["role", "smluvni_strana"])

const PHASE_DEFS: { key: string; label: string; match: string[]; color: string }[] = [
  {
    key: "priprava",
    label: "Příprava",
    match: ["příprava"],
    color: "blue",
  },
  {
    key: "realizace",
    label: "Realizace",
    match: ["realizace"],
    color: "orange",
  },
  {
    key: "provoz",
    label: "Provoz a údržba",
    match: ["provoz a údržba", "provoz"],
    color: "green",
  },
]

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

/** Vyextrahuje z řetězce `[[Link|Alias]]` nebo `[[Link]]` čistý název bez wiki markeru. */
function stripWikiLink(raw: string): string {
  const m = raw.match(/^\s*\[\[(.*?)\]\]\s*$/)
  if (!m) return raw.trim()
  const inner = m[1]
  const pipe = inner.indexOf("|")
  return (pipe >= 0 ? inner.slice(0, pipe) : inner).trim()
}

function coerceLinkArray(value: unknown): string[] {
  return coerceArray(value).map(stripWikiLink).filter(Boolean)
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
      order,
      typ,
    })
  }

  cards.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.title.localeCompare(b.title, "cs")
  })

  return cards
}

/** Procházka `allFiles` a vypreparování všech dílčích činností s daty
 *  potřebnými pro klientský wizard (filtrace dle role + fáze). */
function pickActivities(currentSlug: FullSlug, allFiles: QuartzPluginData[]): ActivityEntry[] {
  const out: ActivityEntry[] = []
  for (const file of allFiles) {
    const fm = (file.frontmatter ?? {}) as FrontmatterLike
    const typ = coerceString(fm.typ)
    if (typ !== "dilci_cinnost") continue

    const title = coerceString(fm.title) || "Bez názvu"
    const oznaceni = coerceString(fm.oznaceni)
    const popis = coerceString(fm.popis)
    const faze = coerceLinkArray(fm.faze)

    // Frontmatter klíče obsahují mezery a pomlčky — proto vybíráme dynamicky.
    let rRoles: string[] = []
    let aRoles: string[] = []
    let cRoles: string[] = []
    let iRoles: string[] = []
    for (const [k, v] of Object.entries(fm)) {
      const keyLower = k.toLowerCase()
      if (keyLower.startsWith("r -") || keyLower.startsWith("r-")) {
        rRoles = coerceLinkArray(v)
      } else if (keyLower.startsWith("a -") || keyLower.startsWith("a-")) {
        aRoles = coerceLinkArray(v)
      } else if (keyLower.startsWith("c -") || keyLower.startsWith("c-")) {
        cRoles = coerceLinkArray(v)
      } else if (keyLower.startsWith("i -") || keyLower.startsWith("i-")) {
        iRoles = coerceLinkArray(v)
      }
    }

    out.push({
      slug: file.slug!,
      href: resolveRelative(currentSlug, file.slug!),
      title,
      oznaceni,
      faze,
      rRoles,
      aRoles,
      cRoles,
      iRoles,
      popis,
    })
  }

  out.sort((a, b) => {
    const ao = a.oznaceni
    const bo = b.oznaceni
    if (ao && bo) return ao.localeCompare(bo, "cs", { numeric: true })
    return a.title.localeCompare(b.title, "cs")
  })

  return out
}

const HomeLanding: QuartzComponent = ({
  fileData,
  allFiles,
  displayClass,
}: QuartzComponentProps) => {
  const currentSlug = fileData.slug as FullSlug
  const personaCards = pickPersonaCards(allFiles)
  const activities = pickActivities(currentSlug, allFiles)

  // Seznam činností pro přímý přístup — najdeme cestu na /cinnosti
  const cinnostiFile = allFiles.find((f) => {
    const fm = (f.frontmatter ?? {}) as FrontmatterLike
    const title = coerceString(fm.title).toLowerCase()
    return title === "seznam činností"
  })
  const cinnostiHref = cinnostiFile
    ? resolveRelative(currentSlug, cinnostiFile.slug!)
    : "../cinnosti"

  // Data pro klientský skript — zapouzdří role + činnosti
  const wizardData = {
    roles: personaCards.map((c) => ({
      key: c.slug,
      title: c.title,
      aliases: c.aliases,
    })),
    activities: activities.map((a) => ({
      slug: a.slug,
      href: a.href,
      title: a.title,
      oznaceni: a.oznaceni,
      faze: a.faze,
      rRoles: a.rRoles,
      aRoles: a.aRoles,
      cRoles: a.cRoles,
      iRoles: a.iRoles,
      popis: a.popis,
    })),
    phases: PHASE_DEFS.map((p) => ({
      key: p.key,
      label: p.label,
      match: p.match,
    })),
  }

  return (
    <div class={`home-landing ${displayClass ?? ""}`.trim()}>
      {/* Hero banner odstraněn — popis patří pod menu lištu (jako obsah index.md),
         ne do samostatného baneru. Wizard jde rovnou. */}

      {/* Wizard Step 1 — výběr role */}
      <section class="home-wizard-step" data-wizard-step="1" aria-labelledby="wizard-step1-title">
        <div class="home-wizard-step-head">
          <span class="home-wizard-step-num">1</span>
          <h2 id="wizard-step1-title" class="home-wizard-step-title">
            Kdo jste?
          </h2>
        </div>
        <p class="home-wizard-step-hint">
          Vyberte svou roli nebo smluvní pozici.
        </p>
        {personaCards.length === 0 ? (
          <p>
            <em>
              Žádná role zatím není označena k zobrazení. Doplňte ve
              frontmatteru <code>show_na_rozcestniku: true</code>.
            </em>
          </p>
        ) : (
          <div class="home-wizard-role-grid" role="list">
            {personaCards.map((card) => (
              <button
                type="button"
                class="home-wizard-role-card"
                data-role-key={card.slug}
                data-role-title={card.title}
                data-role-aliases={card.aliases.join("|")}
                data-role-href={resolveRelative(currentSlug, card.slug)}
                role="listitem"
                aria-pressed="false"
              >
                <span class="home-wizard-role-body">
                  <span class="home-wizard-role-title">{card.title}</span>
                  {card.aliases.length > 0 && (
                    <span class="home-wizard-role-aliases">
                      {card.aliases.slice(0, 2).join(" · ")}
                    </span>
                  )}
                  <span class="home-wizard-role-badge">{card.badgeLabel}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Wizard Step 2 — výběr fáze */}
      <section
        class="home-wizard-step"
        data-wizard-step="2"
        aria-labelledby="wizard-step2-title"
        hidden
      >
        <div class="home-wizard-step-head">
          <span class="home-wizard-step-num">2</span>
          <h2 id="wizard-step2-title" class="home-wizard-step-title">
            V jaké fázi projektu jste?
          </h2>
        </div>
        <p class="home-wizard-step-hint">
          Vyberte fázi — zobrazíme činnosti, které vás v ní čekají.
        </p>
        <div class="home-wizard-phase-grid" role="list">
          {PHASE_DEFS.map((phase) => (
            <button
              type="button"
              class={`home-wizard-phase-card home-wizard-phase-${phase.color}`}
              data-phase-key={phase.key}
              data-phase-label={phase.label}
              data-phase-match={phase.match.join("|")}
              role="listitem"
              aria-pressed="false"
            >
              <span class="home-wizard-phase-label">{phase.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Wizard Step 3 — výsledek (split pane) */}
      <section
        class="home-wizard-step home-wizard-result"
        data-wizard-step="3"
        aria-labelledby="wizard-step3-title"
        hidden
      >
        <div class="home-wizard-step-head">
          <span class="home-wizard-step-num">3</span>
          <h2 id="wizard-step3-title" class="home-wizard-step-title">
            Jaké činnosti se mě týkají?
          </h2>
          <div class="home-wizard-result-summary" data-wizard-summary>
            {/* doplní skript: "Správce stavby · Příprava — 12 činností" */}
          </div>
        </div>
        <p class="home-wizard-step-hint">
          Zaškrtněte, jakou máte roli v RACI tabulce.
        </p>
        <div class="home-wizard-raci-grid" role="group" aria-label="Role v RACI">
          <button
            type="button"
            class="home-wizard-raci-card raci-r"
            data-raci-key="R"
            aria-pressed="true"
          >
            <span class="home-wizard-raci-code raci-r">R</span>
            <span class="home-wizard-raci-text">Mám odpovědnost za provedení činnosti</span>
          </button>
          <button
            type="button"
            class="home-wizard-raci-card raci-a"
            data-raci-key="A"
            aria-pressed="true"
          >
            <span class="home-wizard-raci-code raci-a">A</span>
            <span class="home-wizard-raci-text">Mám odpovědnost za schválení činnosti</span>
          </button>
          <button
            type="button"
            class="home-wizard-raci-card raci-c"
            data-raci-key="C"
            aria-pressed="true"
          >
            <span class="home-wizard-raci-code raci-c">C</span>
            <span class="home-wizard-raci-text">Činnost má být se mnou konzultována</span>
          </button>
          <button
            type="button"
            class="home-wizard-raci-card raci-i"
            data-raci-key="I"
            aria-pressed="true"
          >
            <span class="home-wizard-raci-code raci-i">I</span>
            <span class="home-wizard-raci-text">O průběhu činnosti mám být informován</span>
          </button>
        </div>
        <div class="home-wizard-result-split">
          <div class="home-wizard-result-list-wrap">
            <ul class="home-wizard-result-list" data-wizard-list>
              <li class="home-wizard-result-empty">
                Zatím žádné činnosti nejsou vybrány.
              </li>
            </ul>
          </div>
          <div class="home-wizard-result-preview" data-wizard-preview>
            <p class="home-wizard-result-preview-empty">
              Vyberte činnost v levém seznamu pro náhled.
            </p>
          </div>
        </div>
        <div class="home-wizard-result-actions">
          <a class="home-wizard-link" href={cinnostiHref}>
            Zobrazit všechny činnosti v tabulce →
          </a>
        </div>
      </section>

      {/* Data pro klient */}
      <script
        type="application/json"
        id="home-wizard-data"
        // @ts-ignore
        dangerouslySetInnerHTML={{ __html: JSON.stringify(wizardData) }}
      />
    </div>
  )
}

HomeLanding.css = style
HomeLanding.afterDOMLoaded = script

export default (() => HomeLanding) satisfies QuartzComponentConstructor
