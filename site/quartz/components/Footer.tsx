import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"

export default (() => {
  const Footer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <footer class={`site-footer ${displayClass ?? ""}`}>
        <div class="site-footer__content">
          <p>Vytvořeno pro ŘSD Správa Plzeň.</p>
          <p>Controlis Solutions, s.r.o., Pujmanové 1753/10a 140 00, Praha 4 - Nusle</p>
          <p>
            <a href="https://www.controlis.cz">www.controlis.cz</a>
          </p>
          <p>
            <a href="mailto:marketing@controlis.cz">marketing@controlis.cz</a>
          </p>
          <p>© 2026</p>
        </div>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
