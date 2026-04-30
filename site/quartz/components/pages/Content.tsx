import { ComponentChildren } from "preact"
import { htmlToJsx } from "../../util/jsx"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
// @ts-ignore
import checkboxScript from "../scripts/checkbox.inline"

const Content: QuartzComponent = ({ fileData, tree }: QuartzComponentProps) => {
  const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
  const classes: string[] = fileData.frontmatter?.cssclasses ?? []
  const classString = ["popover-hint", ...classes].join(" ")
  return (
    <article class={classString}>
      <div class="article-surface">{content}</div>
    </article>
  )
}

Content.afterDOMLoaded = checkboxScript

export default (() => Content) satisfies QuartzComponentConstructor
