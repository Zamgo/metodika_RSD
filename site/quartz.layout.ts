import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { FileTrieNode } from "./quartz/util/fileTrie"

/** Řazení podle číselného prefixu (01_, 02_, …) ve složkách a souborech. */
function sortByNumericPrefix(a: FileTrieNode, b: FileTrieNode): number {
  if (!a.isFolder && b.isFolder) return 1
  if (a.isFolder && !b.isFolder) return -1
  const numA = parseInt(a.displayName.match(/^(\d+)/)?.[1] ?? "999999", 10)
  const numB = parseInt(b.displayName.match(/^(\d+)/)?.[1] ?? "999999", 10)
  if (numA !== numB) return numA - numB
  return a.displayName.localeCompare(b.displayName, undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [Component.Backlinks()],
  footer: Component.Footer({
    links: {
      "ŘSD.cz": "https://www.rsd.cz",
      Dokumenty: "https://www.rsd.cz/cs/dokumenty",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.SiteBranding(),
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({
    sortFn: sortByNumericPrefix,
  }),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.SiteBranding(),
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({
    sortFn: sortByNumericPrefix,
  }),
  ],
  right: [],
}
