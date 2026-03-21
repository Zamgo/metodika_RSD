---
title: Pravidla metadat
typ: catalog
faze: []
role: []
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
| `role` | Role, pro které je obsah relevantní | seznam |
| `workflow` | Související workflow | seznam |
| `stav` | Redakční stav | text |
| `permalink` | Stabilní URL pro Quartz | text |
| `tags` | Volné štítky pro vyhledávání | seznam |

## Volitelné klíče

| Klíč | Popis |
|------|-------|
| `aliases` | Alternativní názvy/zkratky (pro vyhledávání) |
| `description` | Popis stránky (pro SEO/meta tagy) |

## Povolené hodnoty `typ`

`typ` může být pouze jedna z těchto hodnot:

- `index`
- `process`
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

## Vazba na číselníky

Hodnoty pro `faze`, `role` a `workflow` se berou **výhradně** z číselníků:

- [[Ciselnik fazi]]
- [[Ciselnik roli]]
- [[Ciselnik workflow]]

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

```yaml
---
title: ZBV
typ: workflow
faze: [realizace]
role: [spravce stavby, technicky dozor, zhotovitel]
workflow: [zbv]
stav: draft
permalink: /workflow/zbv
tags: [workflow, cde]
---
```
