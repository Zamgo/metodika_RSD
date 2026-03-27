import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/procesniOblastTables.inline"
import style from "./styles/procesniOblastTables.scss"

/** Načte JS, který po navigaci vyplní `.quartz-oblast-dv` na stránkách procesní oblasti. */
const ProcesniOblastRuntime: QuartzComponent = (_props: QuartzComponentProps) => (
  <span class="procesni-oblast-runtime-hook" hidden aria-hidden="true" />
)

ProcesniOblastRuntime.afterDOMLoaded = script
ProcesniOblastRuntime.css = style

export default (() => ProcesniOblastRuntime) satisfies QuartzComponentConstructor
