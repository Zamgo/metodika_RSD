import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { FileTrieNode } from "./quartz/util/fileTrie"

/** Řazení: 1) podle číselného prefixu (01_, 02_, …), 2) složky před soubory, 3) podle názvu. Používá slugSegment (segment cesty), ne displayName (může být z frontmatter). */
function sortByNumericPrefix(a: FileTrieNode, b: FileTrieNode): number {
  const segA = a.slugSegment ?? a.displayName ?? ""
  const segB = b.slugSegment ?? b.displayName ?? ""
  const numA = parseInt(segA.match(/^(\d+)/)?.[1] ?? "999999", 10)
  const numB = parseInt(segB.match(/^(\d+)/)?.[1] ?? "999999", 10)
  if (numA !== numB) return numA - numB
  if (!a.isFolder && b.isFolder) return 1
  if (a.isFolder && !b.isFolder) return -1
  return (segA || a.displayName).localeCompare(segB || b.displayName, undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

function explorerFilter(node: FileTrieNode): boolean {
  if (node.slugSegment === "tags") return false
  const normalizedSegment = (node.slugSegment ?? "").toLowerCase().replace(/^\d+_+/, "")
  if (normalizedSegment === "sprava_obsahu") return false
  if (normalizedSegment === "sorava_obsahu") return false
  if (normalizedSegment === "media") return false
  return true
}

function hideOrderingPrefix(node: FileTrieNode): void {
  node.displayName = node.displayName.replace(/^\d+_+/, "")
}

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [
    Component.ConditionalRender({
      component: Component.CinnostiTable(),
      condition: (page) => {
        const slug = (page.fileData.slug ?? "").toLowerCase()
        const permalink = String(page.fileData.frontmatter?.permalink ?? "")
          .replace(/^\/+|\/+$/g, "")
          .toLowerCase()
        const title = String(page.fileData.frontmatter?.title ?? "").toLowerCase()

        // Aktivuj tabulku činností podle permalinku i podle různých slug/title variant.
        return (
          permalink === "cinnosti" ||
          title === "seznam činností" ||
          slug === "seznam-cinnosti" ||
          slug.endsWith("/seznam-cinnosti") ||
          slug === "seznam-činností" ||
          slug.endsWith("/seznam-činností")
        )
      },
    }),
    Component.Backlinks(),
  ],
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
    Component.SidebarToggle(),
    Component.SiteBranding(),
    Component.Graph(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        { Component: Component.Search() },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({
      title: "",
      sortFn: sortByNumericPrefix,
      folderClickBehavior: "collapse",
      filterFn: explorerFilter,
      mapFn: hideOrderingPrefix,
    }),
  ],
  right: [],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.SidebarToggle(),
    Component.SiteBranding(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [{ Component: Component.Search() }, { Component: Component.Darkmode() }],
    }),
    Component.Explorer({
      title: "",
      sortFn: sortByNumericPrefix,
      folderClickBehavior: "collapse",
      filterFn: explorerFilter,
      mapFn: hideOrderingPrefix,
    }),
  ],
  right: [],
}
