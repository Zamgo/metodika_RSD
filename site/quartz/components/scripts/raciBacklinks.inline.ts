type Letter = "R" | "A" | "C" | "I"

/** Stav filtrování jednoho RaciBacklinks widgetu. Chipy jsou OR v rámci
 *  kategorie, AND mezi kategoriemi. Prázdný set = "bez filtru". */
interface BacklinksState {
  root: HTMLElement
  letters: Set<Letter>
  faze: Set<string>
  /** `open` stav R/A/C/I bloků, který byl aktivní před prvním zapnutím filtru
   *  — při resetu filtru se do něj vrátíme. */
  savedLetterOpen: Map<HTMLDetailsElement, boolean>
  savedCinnostOpen: Map<HTMLDetailsElement, boolean>
}

const LETTERS: readonly Letter[] = ["R", "A", "C", "I"]

function parseFazeList(attr: string | null): string[] {
  if (!attr) return []
  return attr
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
}

function itemMatchesFilter(
  itemLetter: string,
  itemFaze: string[],
  selectedLetters: Set<Letter>,
  selectedFaze: Set<string>,
): boolean {
  if (selectedLetters.size > 0 && !selectedLetters.has(itemLetter as Letter)) return false
  if (selectedFaze.size > 0) {
    if (itemFaze.length === 0) return false
    if (!itemFaze.some((fz) => selectedFaze.has(fz))) return false
  }
  return true
}

/** Aplikuje aktuální filter state na jeden widget: skrývá položky, přepočítává
 *  countery a manipuluje open-stavem blok. */
function applyFilter(state: BacklinksState): void {
  const { root, letters, faze } = state
  const filterActive = letters.size > 0 || faze.size > 0
  root.dataset.filterActive = filterActive ? "true" : "false"

  // Reset tlačítko.
  const resetBtn = root.querySelector<HTMLButtonElement>("[data-filter-reset]")
  if (resetBtn) {
    if (filterActive) resetBtn.removeAttribute("hidden")
    else resetBtn.setAttribute("hidden", "")
  }

  const letterBlocks = root.querySelectorAll<HTMLDetailsElement>(
    ".raci-group[data-letter]",
  )
  letterBlocks.forEach((letterEl) => {
    const letter = (letterEl.dataset.letter ?? "") as Letter
    let letterVisibleCount = 0

    const cinnostGroups = letterEl.querySelectorAll<HTMLDetailsElement>(
      ".raci-cinnost-group",
    )
    cinnostGroups.forEach((cg) => {
      const items = cg.querySelectorAll<HTMLElement>(".raci-item")
      let groupVisibleCount = 0
      items.forEach((item) => {
        const itemFaze = parseFazeList(item.dataset.fazeList ?? null)
        const match = itemMatchesFilter(letter, itemFaze, letters, faze)
        if (match) {
          item.removeAttribute("hidden")
          groupVisibleCount++
        } else {
          item.setAttribute("hidden", "")
        }
      })

      const countSpan = cg.querySelector<HTMLElement>(".raci-cinnost-count-value")
      if (countSpan) countSpan.textContent = String(groupVisibleCount)

      if (groupVisibleCount === 0) {
        cg.setAttribute("hidden", "")
        cg.classList.add("raci-cinnost-group-empty")
      } else {
        cg.removeAttribute("hidden")
        cg.classList.remove("raci-cinnost-group-empty")
      }

      letterVisibleCount += groupVisibleCount
    })

    const letterCountSpan = letterEl.querySelector<HTMLElement>(".raci-group-count")
    if (letterCountSpan) letterCountSpan.textContent = String(letterVisibleCount)

    if (letterVisibleCount === 0) {
      letterEl.classList.add("raci-group-empty")
      // Prázdný blok se nedá otevřít.
      letterEl.removeAttribute("open")
    } else {
      letterEl.classList.remove("raci-group-empty")
    }
  })

  // Auto-open / close na základě filtru.
  if (filterActive) {
    // Při prvním zapnutí filtru si uložíme aktuální open stavy, ať je při
    // resetu obnovíme.
    if (state.savedLetterOpen.size === 0 && state.savedCinnostOpen.size === 0) {
      letterBlocks.forEach((letterEl) => {
        state.savedLetterOpen.set(letterEl, letterEl.open)
      })
      root
        .querySelectorAll<HTMLDetailsElement>(".raci-cinnost-group")
        .forEach((cg) => state.savedCinnostOpen.set(cg, cg.open))
    }

    letterBlocks.forEach((letterEl) => {
      const hasVisible = !letterEl.classList.contains("raci-group-empty")
      letterEl.open = hasVisible
      const cinnostGroups = letterEl.querySelectorAll<HTMLDetailsElement>(
        ".raci-cinnost-group",
      )
      cinnostGroups.forEach((cg) => {
        if (cg.hasAttribute("hidden")) {
          cg.open = false
          return
        }
        cg.open = true
      })
    })
  } else {
    // Reset: obnovíme pamatovaný stav (nebo zavřeme, pokud nebyl zapamatovaný).
    letterBlocks.forEach((letterEl) => {
      const saved = state.savedLetterOpen.get(letterEl)
      letterEl.open = saved ?? false
    })
    root
      .querySelectorAll<HTMLDetailsElement>(".raci-cinnost-group")
      .forEach((cg) => {
        const saved = state.savedCinnostOpen.get(cg)
        cg.open = saved ?? false
      })
    state.savedLetterOpen.clear()
    state.savedCinnostOpen.clear()
  }
}

function setupWidget(root: HTMLElement): void {
  const state: BacklinksState = {
    root,
    letters: new Set<Letter>(),
    faze: new Set<string>(),
    savedLetterOpen: new Map(),
    savedCinnostOpen: new Map(),
  }

  const letterChips = root.querySelectorAll<HTMLButtonElement>(".raci-chip-letter")
  letterChips.forEach((chip) => {
    const letter = (chip.dataset.letter ?? "") as Letter
    if (!LETTERS.includes(letter)) return
    chip.addEventListener("click", () => {
      if (state.letters.has(letter)) {
        state.letters.delete(letter)
        chip.setAttribute("aria-pressed", "false")
        chip.classList.remove("is-active")
      } else {
        state.letters.add(letter)
        chip.setAttribute("aria-pressed", "true")
        chip.classList.add("is-active")
      }
      applyFilter(state)
    })
  })

  const fazeChips = root.querySelectorAll<HTMLButtonElement>(".raci-chip-faze")
  fazeChips.forEach((chip) => {
    const fz = chip.dataset.faze ?? ""
    if (!fz) return
    chip.addEventListener("click", () => {
      if (state.faze.has(fz)) {
        state.faze.delete(fz)
        chip.setAttribute("aria-pressed", "false")
        chip.classList.remove("is-active")
      } else {
        state.faze.add(fz)
        chip.setAttribute("aria-pressed", "true")
        chip.classList.add("is-active")
      }
      applyFilter(state)
    })
  })

  const resetBtn = root.querySelector<HTMLButtonElement>("[data-filter-reset]")
  resetBtn?.addEventListener("click", () => {
    state.letters.clear()
    state.faze.clear()
    letterChips.forEach((c) => {
      c.setAttribute("aria-pressed", "false")
      c.classList.remove("is-active")
    })
    fazeChips.forEach((c) => {
      c.setAttribute("aria-pressed", "false")
      c.classList.remove("is-active")
    })
    applyFilter(state)
  })

  // Zamezit otevření prázdného bloku při filtrech (grey-out).
  root
    .querySelectorAll<HTMLDetailsElement>(".raci-group[data-letter]")
    .forEach((el) => {
      el.addEventListener("click", (evt) => {
        if (el.classList.contains("raci-group-empty")) {
          evt.preventDefault()
          el.removeAttribute("open")
        }
      })
    })
}

function setupRaciBacklinks(): void {
  const roots = document.querySelectorAll<HTMLElement>("[data-raci-backlinks]")
  roots.forEach((root) => {
    if (root.dataset.raciBacklinksReady === "true") return
    root.dataset.raciBacklinksReady = "true"
    setupWidget(root)
  })
}

document.addEventListener("nav", setupRaciBacklinks)
