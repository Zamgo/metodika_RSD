---
title: Pravidla metadat
typ: catalog
faze: []
workflow: []
stav: draft
permalink: /sprava-obsahu/pravidla-metadat
---

## Účel

Tato stránka definuje jednotná pravidla pro frontmatter ve všech stránkách vaultu. Cílem je konzistence v Obsidianu a připravenost pro pozdější publikaci přes Quartz.

## Povinné klíče frontmatteru (všechny stránky)

| Klíč | Popis | Typ |
|------|-------|-----|
| `title` | Název stránky | text |
| `typ` | Typ stránky (viz níže) | text |
| `faze` | Fáze projektu, ve kterých je obsah relevantní | seznam |
| `workflow` | Související workflow (u stránek s `typ: workflow` se **neuvádí** — je nadbytečné) | seznam |
| `stav` | Redakční stav | text |
| `permalink` | Stabilní URL pro Quartz | text |
| `tags` | Volné štítky pro vyhledávání | seznam |

## Volitelné klíče

| Klíč | Popis |
|------|-------|
| `aliases` | Alternativní názvy/zkratky (pro vyhledávání) |
| `description` | Popis stránky (pro SEO/meta tagy) |
| `zdroj` | Odkaz na zdroj požadavku (text, např. `ČSN EN ISO 19650-2; 5.1.1`) |

## Klíče specifické pro typ `procesni_oblast`, `cinnost`, `dilci_cinnost`

| Klíč | Popis | Typ | Platí pro |
|------|-------|-----|-----------|
| `oznaceni` | Hierarchické ID činnosti z RACI matice (např. `1.1.1`) | text | všechny |
| `popis` | Popis činnosti | text | všechny |
| `R - Odpovědnost za provádění činnosti` | Seznam rolí s odpovědností R | seznam | všechny |
| `A - Právní odpovědnost za dokončení činnosti` | Seznam rolí s odpovědností A | seznam | všechny |
| `C - Konzultace v průběhu činnosti` | Seznam rolí pro konzultaci C | seznam | všechny |
| `I - Informování po dokončení činnosti` | Seznam rolí pro informování I | seznam | všechny |
| `procesni_oblast` | Wikilink na nadřazenou procesní oblast | wikilink | všechny |
| `cinnost` | Wikilink na nadřazenou činnost | wikilink | `cinnost`, `dilci_cinnost` |
| `vstupy` | Wikilinky na vstupní dokumenty/artefakty | seznam wikilinků | všechny |
| `vystupy` | Wikilinky na výstupní artefakty | seznam wikilinků | všechny |
| `navazane_workflow` | Wikilinky na workflow stránky v `03_CDE_workflow/` | seznam wikilinků | všechny |
| `predchozi_cinnost` | Wikilink na předchozí dílčí činnost v sekvenci | wikilink | `dilci_cinnost` |
| `nasledujici_cinnost` | Wikilink na následující dílčí činnost v sekvenci | wikilink | `dilci_cinnost` |
| `nastroj` | CDE nástroje relevantní pro činnost (`controlis`, `aspehub`, ...) | seznam | `dilci_cinnost` |
| `frekvence` | Jak často se činnost provádí (`jednorazove`, `prubezne`, `mesicne`) | text | `dilci_cinnost` |

## Klíče specifické pro typ `workflow`

| Klíč | Popis | Typ |
|------|-------|-----|
| `navazane_cinnosti` | Zpětné wikilinky na činnosti, které workflow využívají | seznam wikilinků |

Klíč `workflow` z obecné sady se u těchto stránek nepoužívá (identita workflow je daná souborem a `permalink`).

## Povolené hodnoty `typ`

`typ` může být pouze jedna z těchto hodnot:

- `index`
- `process`
- `procesni_oblast`
- `cinnost`
- `dilci_cinnost`
- `workflow`
- `term`
- `reference`
- `appendix`
- `catalog`

## Zápis seznamů

Následující pole se vždy zapisují jako seznamy (i když obsahují jen jednu hodnotu):

- `faze`
- `role`
- `workflow`
- `tags`
- `vstupy`
- `vystupy`
- `navazane_workflow`
- `navazane_cinnosti`
- `nastroj`

## Vazba na číselníky

Hodnoty pro `faze`, `workflow` a R/A/C/I klíče se berou **výhradně** z číselníků:

- [[Ciselnik fazi]]
- [[Ciselnik workflow]]
- [[Ciselnik_RACI_hodnot]]

Pokud je potřeba nová hodnota:

1. Nejprve ji doplnit do příslušného číselníku.
2. Až poté ji použít ve stránkách.

## Pravidla pro `permalink` (Quartz)

- `permalink` má být **stabilní a jednoduchý**.
- Používat malá písmena bez diakritiky a s pomlčkami.
- Doporučené prefixy:
  - procesy: `/proces/<faze>/<slug>`
  - workflow: `/workflow/<workflow>`
  - pojmy: `/pojem/<slug>`
  - správa obsahu: `/sprava-obsahu/<slug>`
  - reference: `/reference/<slug>`
  - přílohy: `/priloha/<slug>`

## Pravidla pro `stav`

Používané hodnoty (v prvním průchodu):

- `draft`
- `ready`

## Příklad frontmatteru

### Workflow stránka

```yaml
---
title: ZBV
typ: workflow
faze: [realizace]
workflow: [zbv]
stav: draft
permalink: /workflow/zbv
---
```

### Dílčí činnost (se skeleton poli pro vstupy/výstupy/návaznosti)

```yaml
---
title: "4.5.1 - Sloučení TIDP do MIDP"
typ: dilci_cinnost
oznaceni: "4.5.1"
popis: ""
zdroj: "ČSN EN ISO 19650-2; 5.4.5"
faze: [priprava]
R - Odpovědnost za provádění činnosti: []
A - Právní odpovědnost za dokončení činnosti: []
C - Konzultace v průběhu činnosti: []
I - Informování po dokončení činnosti: []
workflow: []
stav: draft
procesni_oblast: "[[4 - Proces managementu informací – Pověření]]"
cinnost: "[[4.5 - Stanovení hlavního plánu předávání informací (MIDP)]]"
vstupy: []
vystupy: []
navazane_workflow: []
predchozi_cinnost: ""
nasledujici_cinnost: "[[4.5.2 - Zakotveni vystupu a dat v MIDP]]"
nastroj: []
frekvence: ""
---
```
