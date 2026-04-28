import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

// Patičku zajišťuje hosting Monsta na úrovni šablony stránek
// (Vytvořeno pro ŘSD Správa Plzeň… + Nastavení cookies / Odhlásit se).
// Aby nedocházelo k duplicitnímu zobrazení, naše vlastní Quartz patička
// se nerendruje. Pokud bude potřeba ji v budoucnu obnovit (např. při změně
// hostingu), stačí vrátit původní obsah níže — viz git history.

export default (() => {
  const Footer: QuartzComponent = (_props: QuartzComponentProps) => null

  return Footer
}) satisfies QuartzComponentConstructor
