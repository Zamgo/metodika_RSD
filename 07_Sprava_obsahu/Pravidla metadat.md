---
title: Pravidla metadat
typ: catalog
faze: []
workflow: []
stav: draft
permalink: /sprava-obsahu/pravidla-metadat
tags: [sprava_obsahu, metadata, quartz]
---

## Účel

Tato stránka definuje jednotná pravidla pro frontmatter ve všech stránkách vaultu. Cílem je konzistence v Obsidianu a připravenost pro pozdější publikaci přes Quartz.

## Povinné klíče frontmatteru (všechny stránky)

| Klíč | Popis | Typ |
|------|-------|-----|
| `title` | Název stránky | text |
| `typ` | Typ stránky (viz níže) | text |
| `faze` | Fáze projektu, ve kterých je obsah relevantní | seznam |
| `workflow` | Související workflow | seznam |
| `stav` | Redakční stav | text |
| `permalink` | Stabilní URL pro Quartz | text |
| `tags` | Volné štítky pro vyhledávání | seznam |

## Volitelné klíče

| Klíč | Popis |
|------|-------|
| `aliases` | Alternativní názvy/zkratky (pro vyhledávání) |
| `description` | Popis stránky (pro SEO/meta tagy) |
| `zdroj` | Odkaz na zdroj požadavku (text, např. `ČSN EN ISO 19650-2; 5.1.1`) |

## Klíče specifické pro typ `raci_cinnost`

| Klíč | Popis | Typ |
|------|-------|-----|
| `oznaceni` | Hierarchické ID činnosti z RACI matice (např. `1.1.1`) | text |
| `popis` | Popis činnosti | text |
| `R - Odpovědnost za provádění činnosti` | Seznam rolí s odpovědností R | text |
| `A - Právní odpovědnost za dokončení činnosti` | Seznam rolí s odpovědností A | text |
| `C - Konzultace v průběhu činnosti` | Seznam rolí pro konzultaci C | text |
| `I - Informování po dokončení činnosti` | Seznam rolí pro informování I | text |

## Povolené hodnoty `typ`

`typ` může být pouze jedna z těchto hodnot:

- `index`
- `process`
- `workflow`
- `term`
- `reference`
- `appendix`
- `catalog`
- `raci_cinnost`

## Zápis seznamů

Následující pole se vždy zapisují jako seznamy (i když obsahují jen jednu hodnotu):

- `faze`
- `role`
- `workflow`
- `tags`

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
tags: [workflow, cde]
---
```

### RACI činnost (z matice informačního managementu)

```yaml
---
title: "Pověřit jednotlivce k plnění funkcí při managementu informací"
typ: raci_cinnost
oznaceni: "1.1.1"
popis: "Stanovení osob pro jednotlivé role v rámci BIM."
zdroj: "ČSN EN ISO 19650-2; 5.1.1"
faze: [priprava]
"R - Odpovědnost za provádění činnosti": "Pověřující strana, Správce stavby (ŘSD)"
"A - Právní odpovědnost za dokončení činnosti": "Pověřující strana, Správce stavby (ŘSD)"
"C - Konzultace v průběhu činnosti": ""
"I - Informování po dokončení činnosti": ""
workflow: []
stav: draft
tags: [raci, iso_19650]
---
```
