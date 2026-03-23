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
| `zdroj` | Odkaz na zdroj požadavku (text, např. `ČSN EN ISO 19650-2; 5.1.1`) |
| `zdroj_typ` | Typ zdroje pro filtrování (viz povolené hodnoty níže) |

## Klíče specifické pro typ `raci_cinnost`

| Klíč | Popis | Typ |
|------|-------|-----|
| `oznaceni` | Hierarchické ID činnosti z RACI matice (např. `1.1.1`) | text |
| `sekce` | Nadřazená sekce (např. `1.1`) | text |
| `iso_faze` | Číslo ISO fáze (např. `5.1`) | text |
| `popis` | Popis činnosti | text |
| `raci_poverejici` | RACI hodnota pro Pověřující stranu (Objednatel) | text |
| `raci_vedouci_poverena` | RACI hodnota pro Vedoucí pověřenou stranu (Zhotovitel) | text |
| `raci_poverena` | RACI hodnota pro Pověřenou stranu (Podzhotovitel) | text |
| `raci_spravce_stavby` | RACI hodnota pro Správce stavby | text |
| `raci_bim_koordinator` | RACI hodnota pro BIM koordinátora | text |

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

Hodnoty pro `faze`, `role` a `workflow` se berou **výhradně** z číselníků:

- [[Ciselnik fazi]]
- [[Ciselnik roli]]
- [[Ciselnik workflow]]

Pokud je potřeba nová hodnota:

1. Nejprve ji doplnit do příslušného číselníku.
2. Až poté ji použít ve stránkách.

## Povolené hodnoty `zdroj_typ`

- `iso_19650` – ČSN EN ISO 19650-2
- `fidic` – FIDIC Červená kniha / P1b šablóna
- `interni_metodika` – interní metodika ŘSD
- `eir` – Požadavky objednatele na výměnu informací
- `smlouva` – smluvní dokumentace

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
role: [spravce stavby, technicky dozor, zhotovitel]
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
sekce: "1.1"
iso_faze: "5.1"
popis: "Stanovení osob pro jednotlivé role v rámci BIM."
zdroj: "ČSN EN ISO 19650-2; 5.1.1"
zdroj_typ: iso_19650
faze: [priprava]
role: [poverujici strana, spravce stavby]
raci_poverejici: "A/R"
raci_vedouci_poverena: ""
raci_poverena: ""
raci_spravce_stavby: "A/R"
raci_bim_koordinator: ""
workflow: []
stav: draft
tags: [raci, iso_19650]
---
```
