import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const SidebarToggle: QuartzComponent = (_props: QuartzComponentProps) => {
  return (
    <button
      type="button"
      class="sidebar-toggle"
      aria-label="Toggle sidebar"
      title="Skrýt / zobrazit panel"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  )
}

SidebarToggle.afterDOMLoaded = `
  const LS_SIDEBAR_KEY = "sidebar-collapsed";

  function initSidebarToggle() {
    const btn = document.querySelector(".sidebar-toggle");
    if (!btn) return;

    if (localStorage.getItem(LS_SIDEBAR_KEY) === "true") {
      document.body.dataset.sidebarCollapsed = "";
    }

    function onClick() {
      const isCollapsed = "sidebarCollapsed" in document.body.dataset;
      if (isCollapsed) {
        delete document.body.dataset.sidebarCollapsed;
        localStorage.setItem(LS_SIDEBAR_KEY, "false");
      } else {
        document.body.dataset.sidebarCollapsed = "";
        localStorage.setItem(LS_SIDEBAR_KEY, "true");
      }
    }

    btn.addEventListener("click", onClick);
    window.addCleanup(() => btn.removeEventListener("click", onClick));
  }

  document.addEventListener("nav", () => initSidebarToggle());
`

export default (() => SidebarToggle) satisfies QuartzComponentConstructor
