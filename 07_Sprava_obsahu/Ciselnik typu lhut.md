---
title: Ciselnik typu lhut
typ: catalog
faze: []
stav: draft
permalink: /sprava-obsahu/ciselnik-typu-lhut
aliases: [Číselník typů lhůt]
---

## Použití

Tento číselník je jediný zdroj hodnot pro metadata `lhuta_typ`. Klasifikuje povahu lhůty — použije se pro filtrování typu „všechny činnosti se smluvní lhůtou“ nebo „kde mě tlačí zákon“.

Pole je single-select a **volitelné**. Vyplňuj jen tam, kde má pole `lhuta` smysluplnou hodnotu.

`lhuta` zůstává jako volný text (lidsky čitelná hodnota typu `"Do 28 kalendářních dnů od oznámení"`). `lhuta_typ` je strukturovaný klasifikátor pro filtr.

## Hodnoty (ID)

| ID | label | význam |
|---|---|---|
| `smluvni` | Smluvní | Lhůta vyplývá ze smlouvy o dílo nebo z FIDIC Red Book (např. SC 20.2.1 — 28 dní pro Notice of Claim) |
| `zakonna` | Zákonná | Lhůta vyplývá z právního předpisu (zákon, vyhláška, technický předpis) |
| `interni` | Interní | Lhůta z interní metodiky správce stavby / týmu |
| `projektova` | Projektová | Lhůta dohodnutá v rámci projektu (BEP, harmonogram, CDE workflow) |
| `bez_lhuty` | Bez lhůty | Činnost nemá určenou konkrétní lhůtu |

## Příklad použití

```yaml
casove_pravidlo: ve_lhute
lhuta: "Do 28 kalendářních dnů od vzniku claimové události"
lhuta_typ: smluvni
```

## Vazba na související klíče

- `lhuta` — volný text s konkrétní hodnotou.
- `casove_pravidlo: ve_lhute` — signál, že činnost je vázaná na lhůtu.
- `od_udalosti` — plánováno do druhého kola (struktura milníku).
