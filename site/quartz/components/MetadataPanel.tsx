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
  { key: "procesni_oblast", label: "Metadata procesní oblasti" },
  { key: "cinnost", label: "Činnost" },
  { key: "vstupy", label: "Vstupy" },
  { key: "vystupy", label: "Výstupy" },
  { key: "navazane_workflow", label: "Navázané workflow" },
  { key: "predchozi_cinnost", label: "Předchozí činnost" },
  { key: "nasledujici_cinnost", label: "Následující činnost" },
  { key: "nastroj", label: "Nástroj" },
  { key: "frekvence", label: "Frekvence" },
]

const ACTIVITY_TYPES = new Set(["cinnost", "dilci_cinnost"])

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
  const showAllFields = ACTIVITY_TYPES.has(typ)
  const pageSlug = fileData.slug as FullSlug | undefined
  const resolveNote = createSlugResolverFromAllFiles(allFiles)

  const rows = FIELDS.map(({ key, label }) => {
    const values = normalizeValue(fm[key])
    return { key, label, values }
  })

  const displayRows = showAllFields ? rows : rows.filter((row) => row.values.length > 0)

  if (displayRows.length === 0) return null

  return (
    <section class={classNames(displayClass, "metadata-panel")} data-metadata-panel>
      <div class="metadata-panel-header">
        <h2>Metadata</h2>
        <button
          type="button"
          class="metadata-panel-toggle"
          aria-expanded="true"
          aria-controls="metadata-panel-fields"
        >
          Skrýt
        </button>
      </div>
      <dl class="metadata-panel-body" id="metadata-panel-fields">
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
  margin: 0.75rem 0 1rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  background: var(--light);
}

.metadata-panel-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.metadata-panel h2 {
  font-size: 0.95rem;
  margin: 0;
}

.metadata-panel-toggle {
  flex-shrink: 0;
  font-size: 0.8rem;
  padding: 0.25rem 0.55rem;
  border: 1px solid var(--lightgray);
  border-radius: 6px;
  background: var(--light);
  color: var(--dark);
  cursor: pointer;
}

.metadata-panel-toggle:hover {
  background: var(--lightgray);
}

.metadata-panel-body[hidden] {
  display: none;
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
        btn.setAttribute("aria-expanded", String(!nextHidden));
        btn.textContent = nextHidden ? "Zobrazit" : "Skrýt";
      }

      btn.addEventListener("click", onClick);
      window.addCleanup(() => btn.removeEventListener("click", onClick));
    });
  }

  document.addEventListener("nav", initMetadataPanels);
`

export default (() => MetadataPanel) satisfies QuartzComponentConstructor
