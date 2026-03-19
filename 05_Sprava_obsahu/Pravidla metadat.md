---
title: Pravidla metadat
typ: catalog
faze: []
role: []
cinnosti: []
workflow: []
temata: [metadata]
stav: draft
vlastnik: rsd
souvisi: []
priloha: []
permalink: /sprava-obsahu/pravidla-metadat
aliases: []
tags: [sprava_obsahu, metadata, quartz]
---

## Účel

Tato stránka definuje jednotná pravidla pro frontmatter ve všech stránkách vaultu. Cílem je konzistence v Obsidianu a připravenost pro pozdější publikaci přes Quartz.

## Povinné klíče frontmatteru (všechny stránky)

- `title`
- `typ`
- `faze`
- `role`
- `cinnosti`
- `workflow`
- `temata`
- `stav`
- `vlastnik`
- `souvisi`
- `priloha`
- `permalink`
- `aliases`
- `tags`

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
- `cinnosti`
- `workflow`
- `temata`
- `souvisi`
- `aliases`
- `tags`

## Vazba na číselníky

Hodnoty pro `role`, `faze`, `workflow`, `cinnosti` a `temata` se berou **výhradně** z číselníků:

- [[Ciselnik roli]]
- [[Ciselnik fazi]]
- [[Ciselnik workflow]]
- [[Ciselnik cinnosti]]
- [[Ciselnik temat]]

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

**Editorske doplneni:** Pokud bude potřeba detailnější workflow publikace (např. `review`, `approved`), doplní se do pravidel a sjednotí v celém vaultu.

