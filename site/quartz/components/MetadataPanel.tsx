import { Fragment } from "preact"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { FullSlug } from "../util/path"
import {
  createSlugResolverFromAllFiles,
  wikiStringToMetadataHtml,
} from "../util/metadataWikilinks"

type FrontmatterLike = Record<string, unknown>

type FieldDef = {
  key: string
  label: string
}

/** Pořadí polí jako ve frontmatteru dílčí činnosti (např. 1.1.3) */
const FIELDS: FieldDef[] = [
  { key: "oznaceni", label: "Označení" },
  { key: "popis", label: "Popis" },
  { key: "zdroj", label: "Zdroj" },
  { key: "faze", label: "Fáze" },
  {
    key: "R - Odpovědnost za provádění činnosti",
    label: "R - Odpovědnost za provádění činnosti",
  },
  {
    key: "A - Právní odpovědnost za dokončení činnosti",
    label: "A - Právní odpovědnost za dokončení činnosti",
  },
  {
    key: "C - Konzultace v průběhu činnosti",
    label: "C - Konzultace v průběhu činnosti",
  },
  {
    key: "I - Informování po dokončení činnosti",
    label: "I - Informování po dokončení činnosti",
  },
  { key: "workflow", label: "Workflow" },
  { key: "stav", label: "Stav" },
  { key: "oblast", label: "Metadata oblasti" },
  { key: "cinnost", label: "Činnost" },
  { key: "vstupy", label: "Vstupy" },
  { key: "vystupy", label: "Výstupy" },
  { key: "navazane_workflow", label: "Navázané workflow" },
  { key: "predchozi_cinnost", label: "Předchozí činnost" },
  { key: "nasledujici_cinnost", label: "Následující činnost" },
  { key: "nastroj", label: "Nástroj" },
  { key: "frekvence", label: "Frekvence" },
]

/** Metadata panel pro typy role / smluvní strana — zobrazuje strukturovaná data
 *  z frontmatteru, která dříve renderoval RolePortal. */
const ROLE_FIELDS: FieldDef[] = [
  { key: "aliases", label: "Další názvy" },
  { key: "nadrizena_role", label: "Nadřízená role" },
  { key: "ekvivalent", label: "Ekvivalent" },
  { key: "ramec", label: "Rámec" },
  { key: "stav", label: "Stav" },
]

const ACTIVITY_TYPES = new Set(["cinnost", "ukol"])
const ROLE_TYPES = new Set(["role", "smluvni_strana"])

function normalizeValue(v: unknown): string[] {
  if (v == null) return []
  if (Array.isArray(v)) {
    return v
      .flatMap((item) => normalizeValue(item))
      .map((item) => item.trim())
      .filter(Boolean)
  }
  const raw = String(v).trim()
  if (!raw) return []
  return [raw]
}

const MetadataPanel: QuartzComponent = ({ fileData, displayClass, allFiles }: QuartzComponentProps) => {
  const fm = (fileData.frontmatter ?? {}) as FrontmatterLike
  const typ = String(fm.typ ?? "")
  const isRole = ROLE_TYPES.has(typ)
  const showAllFields = ACTIVITY_TYPES.has(typ)
  const pageSlug = fileData.slug as FullSlug | undefined
  const resolveNote = createSlugResolverFromAllFiles(allFiles)

  const activeFields = isRole ? ROLE_FIELDS : FIELDS
  const rows = activeFields.map(({ key, label }) => {
    const values = normalizeValue(fm[key])
    return { key, label, values }
  })

  const displayRows = showAllFields ? rows : rows.filter((row) => row.values.length > 0)

  if (displayRows.length === 0) return null

  return (
    <section
      class={classNames(displayClass, "metadata-panel")}
      data-metadata-panel
      data-metadata-expanded="false"
    >
      <div class="metadata-panel-header">
        <h2>Metadata</h2>
        <button
          type="button"
          class="metadata-panel-toggle"
          aria-expanded="false"
          aria-controls="metadata-panel-fields"
        >
          Zobrazit metadata této stránky
        </button>
      </div>
      <dl class="metadata-panel-body" id="metadata-panel-fields" hidden>
        {displayRows.map((row) => (
          <Fragment key={row.key}>
            <dt>{row.label}</dt>
            <dd>
              {row.values.length === 0 ? (
                "—"
              ) : (
                row.values.map((v, i) => (
                  <Fragment key={i}>
                    {i > 0 ? ", " : null}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: wikiStringToMetadataHtml(pageSlug, resolveNote, v),
                      }}
                    />
                  </Fragment>
                ))
              )}
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  )
}

MetadataPanel.css = `
.metadata-panel {
  margin: 0.7rem 0 0.9rem;
  display: flex;
  justify-content: flex-start;
}

.metadata-panel-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.35rem;
  margin-bottom: 0;
}

.metadata-panel h2 {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.metadata-panel-toggle {
  flex-shrink: 0;
  font-size: 0.72rem;
  padding: 0.14rem 0.4rem;
  border: 1px solid color-mix(in srgb, var(--lightgray) 70%, transparent);
  border-radius: 999px;
  background: transparent;
  color: var(--gray);
  cursor: pointer;
}

.metadata-panel-toggle:hover {
  color: var(--dark);
  border-color: var(--lightgray);
}

.metadata-panel[data-metadata-expanded="true"] {
  display: block;
  margin-top: 0.75rem;
  padding: 0;
  border: 0;
  background: transparent;
}

.metadata-panel[data-metadata-expanded="true"] .metadata-panel-header {
  justify-content: flex-start;
  gap: 0.35rem;
  margin-bottom: 0;
}

.metadata-panel-body[hidden] {
  display: none;
}

.metadata-panel[data-metadata-expanded="true"] .metadata-panel-body:not([hidden]) {
  margin-top: 0.45rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  background: var(--light);
}

.metadata-panel dl {
  margin: 0;
  display: grid;
  grid-template-columns: minmax(0, min(100%, 26rem)) 1fr;
  gap: 0.35rem 0.75rem;
  align-items: start;
}

.metadata-panel dt {
  font-weight: 600;
  color: var(--darkgray);
  padding-right: 0.25rem;
  word-break: break-word;
}

.metadata-panel dd {
  margin: 0;
  color: var(--dark);
  word-break: break-word;
}

.metadata-panel dd a.internal {
  font-weight: inherit;
}

/* beforeBody is inside .popover-hint; previews clone that node into .popover */
.popover .metadata-panel {
  display: none;
}
`

MetadataPanel.afterDOMLoaded = `
  function initMetadataPanels() {
    document.querySelectorAll("[data-metadata-panel]").forEach((panel) => {
      const btn = panel.querySelector(".metadata-panel-toggle");
      const body = panel.querySelector(".metadata-panel-body");
      if (!btn || !body || !(btn instanceof HTMLButtonElement)) return;

      function onClick() {
        const nextHidden = !body.hidden;
        body.hidden = nextHidden;
        panel.setAttribute("data-metadata-expanded", String(!nextHidden));
        btn.setAttribute("aria-expanded", String(!nextHidden));
        btn.textContent = nextHidden
          ? "Zobrazit metadata této stránky"
          : "Skrýt metadata této stránky";
      }

      btn.addEventListener("click", onClick);
      window.addCleanup(() => btn.removeEventListener("click", onClick));
    });
  }

  document.addEventListener("nav", initMetadataPanels);
`

export default (() => MetadataPanel) satisfies QuartzComponentConstructor
