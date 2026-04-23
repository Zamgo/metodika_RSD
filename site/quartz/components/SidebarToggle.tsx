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
  const LS_SIDEBAR_WIDTH_KEY = "sidebar-width";
  const SIDEBAR_MIN_WIDTH = 220;
  const SIDEBAR_MAX_WIDTH = 520;
  const SIDEBAR_DEFAULT_WIDTH = 280;

  function clampSidebarWidth(value) {
    return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));
  }

  function applySidebarWidth(width) {
    const safeWidth = clampSidebarWidth(width);
    document.documentElement.style.setProperty("--left-sidebar-width", safeWidth + "px");
  }

  function readSavedSidebarWidth() {
    const raw = localStorage.getItem(LS_SIDEBAR_WIDTH_KEY);
    if (!raw) return SIDEBAR_DEFAULT_WIDTH;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return SIDEBAR_DEFAULT_WIDTH;
    return clampSidebarWidth(parsed);
  }

  function initSidebarToggle() {
    const btn = document.querySelector(".sidebar-toggle");
    const resizer = document.querySelector(".sidebar-resizer");
    if (!btn) return;

    let sidebarWidth = readSavedSidebarWidth();
    applySidebarWidth(sidebarWidth);

    if (localStorage.getItem(LS_SIDEBAR_KEY) === "true") {
      document.body.dataset.sidebarCollapsed = "";
    }

    function onClick() {
      const isCollapsed = "sidebarCollapsed" in document.body.dataset;
      if (isCollapsed) {
        delete document.body.dataset.sidebarCollapsed;
        applySidebarWidth(sidebarWidth);
        localStorage.setItem(LS_SIDEBAR_KEY, "false");
      } else {
        document.body.dataset.sidebarCollapsed = "";
        localStorage.setItem(LS_SIDEBAR_KEY, "true");
      }
    }

    btn.addEventListener("click", onClick);
    const cleanups = [() => btn.removeEventListener("click", onClick)];

    if (resizer instanceof HTMLElement) {
      const onPointerDown = (event) => {
        if ("sidebarCollapsed" in document.body.dataset) return;

        event.preventDefault();
        const pointerId = event.pointerId;
        resizer.setPointerCapture(pointerId);
        document.body.classList.add("sidebar-resizing");

        const onPointerMove = (moveEvent) => {
          const nextWidth = clampSidebarWidth(moveEvent.clientX);
          sidebarWidth = nextWidth;
          applySidebarWidth(nextWidth);
        };

        const stopResize = () => {
          document.body.classList.remove("sidebar-resizing");
          localStorage.setItem(LS_SIDEBAR_WIDTH_KEY, String(sidebarWidth));
          resizer.removeEventListener("pointermove", onPointerMove);
          resizer.removeEventListener("pointerup", onPointerUp);
          resizer.removeEventListener("pointercancel", onPointerUp);
        };

        const onPointerUp = () => {
          stopResize();
        };

        resizer.addEventListener("pointermove", onPointerMove);
        resizer.addEventListener("pointerup", onPointerUp);
        resizer.addEventListener("pointercancel", onPointerUp);
      };

      resizer.addEventListener("pointerdown", onPointerDown);
      cleanups.push(() => {
        document.body.classList.remove("sidebar-resizing");
        resizer.removeEventListener("pointerdown", onPointerDown);
      });
    }

    window.addCleanup(() => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    });
  }

  document.addEventListener("nav", () => initSidebarToggle());
`

export default (() => SidebarToggle) satisfies QuartzComponentConstructor
