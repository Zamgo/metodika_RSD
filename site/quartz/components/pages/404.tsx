import { i18n } from "../../i18n"
import { sitePath } from "../../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const homeHref = sitePath(cfg.baseUrl)

  return (
    <article class="popover-hint">
      <div class="article-surface">
        <h1>404</h1>
        <p>{i18n(cfg.locale).pages.error.notFound}</p>
        <a href={homeHref}>{i18n(cfg.locale).pages.error.home}</a>
      </div>
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor
