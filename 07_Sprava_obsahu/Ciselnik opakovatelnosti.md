---
title: Ciselnik opakovatelnosti
typ: catalog
faze: []
workflow: []
stav: draft
permalink: /sprava-obsahu/ciselnik-opakovatelnosti
aliases: [Číselník opakovatelnosti]
---

## Použití

Tento číselník je jediný zdroj hodnot pro metadata `opakovatelnost`. Říká, jak často se činnost typicky provádí.

Pole je single-select.

## Vztah k poli `frekvence`

**Pole `opakovatelnost` nahrazuje původní pole `frekvence`** (deprecated). Nové činnosti vyplňují `opakovatelnost`. Staré soubory s `frekvence` se v MVP nemigrují — zůstávají platné, ale klíč už není v pravidlech doporučován.

## Hodnoty (ID)

| ID | label | význam | příklad |
|---|---|---|---|
| `jednorazove` | Jednorázově | Typicky jednou za projekt nebo jednou za hlavní rozhodnutí | schválit investiční záměr |
| `jednou_za_fazi` | Jednou za fázi | Jednou v každé relevantní fázi | fázová kontrola připravenosti |
| `pri_kazde_udalosti` | Při každém výskytu spouštěcí události | Pokaždé, když nastane daná událost | kontrola modelu při každém odevzdání |
| `pri_zmene` | Při změně | Když se změní požadavek, dokument, tým, stav nebo řešení | aktualizovat BEP |
| `periodicky` | Periodicky | V pravidelném intervalu | měsíční report |
| `prubezne` | Průběžně | Běží soustavně bez přesného počtu opakování | správa CDE, evidence připomínek |
| `podle_potreby` | Podle potřeby | Provádí se ad hoc | svolat koordinační jednání |

## Vazba na související číselníky

- [[Ciselnik rezimu cinnosti]] — typ chování činnosti v čase.
- [[Ciselnik spousteci udalost]] — co činnost aktivuje (pro `pri_kazde_udalosti`).
