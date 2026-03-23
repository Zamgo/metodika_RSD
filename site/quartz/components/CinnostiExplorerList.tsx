import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/cinnosti-explorer.scss"
// @ts-ignore
import script from "./scripts/cinnosti-explorer.inline"

/** Levý panel: seznam činností ve stejném rozsahu jako Obsidian `Cinnosti.base` (02 + 07). */
const CinnostiExplorerList: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const cs = cfg.locale.startsWith("cs")
  return (
    <div
      id="cinnosti-explorer"
      class="cinnosti-explorer"
      aria-label={cs ? "Přehled činností (jako Bases)" : "Activities (Bases scope)"}
      data-lbl-oblasti={cs ? "Oblasti správy informací" : "Information management areas"}
      data-lbl-raci={cs ? "RACI činnosti" : "RACI activities"}
    >
      <div class="cinnosti-explorer-head">
        <span class="cinnosti-explorer-title">{cs ? "Činnosti" : "Activities"}</span>
        <a class="cinnosti-explorer-seznam" href="#">
          {cs ? "Tabulka + filtry" : "Table + filters"}
        </a>
      </div>
      <p class="cinnosti-explorer-hint">
        {cs
          ? "Stejný výběr stránek jako soubor Cinnosti.base v Obsidianu."
          : "Same page set as the Cinnosti.base file in Obsidian."}
      </p>
      <input
        type="search"
        class="cinnosti-explorer-filter"
        placeholder={cs ? "Filtrovat názvy…" : "Filter titles…"}
        autocomplete="off"
        aria-label={cs ? "Filtrovat činnosti v postranním panelu" : "Filter sidebar activities"}
      />
      <div class="cinnosti-explorer-groups" />
    </div>
  )
}

CinnostiExplorerList.afterDOMLoaded = script
CinnostiExplorerList.css = style

export default (() => CinnostiExplorerList) satisfies QuartzComponentConstructor
