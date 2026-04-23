import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { joinSegments, pathToRoot } from "../util/path"

type NavLink = {
  label: string
  /** Relativní cesta od kořene webu (bez leadingslash) — nebo "" pro domovskou stránku. */
  path: string
}

const NAV_LINKS: NavLink[] = [
  { label: "Úvod", path: "" },
  { label: "Seznam činností", path: "cinnosti" },
  { label: "CDE workflow", path: "cde-workflow" },
  { label: "Definice pojmů", path: "05_Definice-pojm\u016f" },
]

const TopNav: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const baseDir = pathToRoot(fileData.slug!)
  const logoSrc = joinSegments(baseDir, "static/rsd-logo.svg")

  return (
    <div class="top-nav">
      <a href={baseDir} class="top-nav-logo" aria-label="Zpět na úvod">
        <img
          src={logoSrc}
          alt="Ředitelství silnic a dálnic"
          width="120"
          height="49"
          class="top-nav-logo-img"
        />
      </a>
      <nav class="top-nav-links" aria-label="Hlavní navigace">
        {NAV_LINKS.map((link) => (
          <a
            href={link.path ? joinSegments(baseDir, link.path) : baseDir}
            class="top-nav-link"
            data-top-nav-path={link.path}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  )
}

TopNav.css = `
.top-nav {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 1 1 auto;
  min-width: 0;
}

.top-nav-logo {
  flex: 0 0 auto;
  display: block;
  line-height: 0;
  background: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  text-decoration: none;
  transition: opacity 120ms ease;
}

.top-nav-logo:hover {
  opacity: 0.82;
}

.top-nav-logo-img {
  display: block;
  height: 34px;
  width: auto;
}

.top-nav-links {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  flex-wrap: nowrap;
  min-width: 0;
  overflow: hidden;
}

.top-nav-link {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--darkgray);
  text-decoration: none;
  white-space: nowrap;
  background: none;
  transition: background 120ms ease, color 120ms ease;
}

.top-nav-link:hover {
  background: color-mix(in srgb, var(--secondary) 10%, var(--light));
  color: var(--secondary);
}

.top-nav-link.active {
  color: var(--secondary);
  font-weight: 600;
  background: color-mix(in srgb, var(--secondary) 10%, var(--light));
}

@media all and (max-width: 800px) {
  .top-nav-links {
    display: none;
  }
  .top-nav-logo-img {
    height: 28px;
  }
}
`

TopNav.afterDOMLoaded = `
function markActiveTopNavLink() {
  const links = document.querySelectorAll(".top-nav-link");
  if (!links.length) return;
  const currentPath = window.location.pathname.replace(/\\/+$/, "") || "/";
  for (const link of links) {
    const resolved = new URL(link.href, window.location.href).pathname.replace(/\\/+$/, "") || "/";
    const isRoot = resolved === "/";
    const isActive = isRoot
      ? currentPath === "/"
      : currentPath === resolved || currentPath.startsWith(resolved + "/");
    link.classList.toggle("active", isActive);
  }
}
document.addEventListener("nav", markActiveTopNavLink);
`

export default (() => TopNav) satisfies QuartzComponentConstructor
