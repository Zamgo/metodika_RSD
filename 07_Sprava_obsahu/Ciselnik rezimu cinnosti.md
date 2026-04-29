---
title: Ciselnik rezimu cinnosti
typ: catalog
faze: []
workflow: []
stav: draft
permalink: /sprava-obsahu/ciselnik-rezimu-cinnosti
aliases: [Číselník režimu činnosti]
---

## Použití

Tento číselník je jediný zdroj hodnot pro metadata `rezim_cinnosti`. Popisuje, jak se činnost chová v čase.

Pole je single-select a **volitelné** (není povinný klíč). Pokud činnost nemá vyhraněný režim, klíč nevyplňuj.

## Hodnoty (ID)

| ID | label | význam | příklad |
|---|---|---|---|
| `fazova` | Fázová | Činnost se váže hlavně na určitou fázi projektu | zpracovat dokumentaci pro povolení záměru |
| `milnikova` | Milníková | Činnost se váže na významný rozhodovací nebo předávací bod | schválit investiční záměr, předat stavbu |
| `udalostni` | Událostní | Činnost se spustí konkrétní událostí | odevzdání modelu → kontrola modelu |
| `periodicka` | Periodická | Činnost se opakuje v pravidelném intervalu | měsíční report |
| `prubezna` | Průběžná | Činnost probíhá soustavně během určité části projektu | správa CDE, vedení issue registru |
| `podminena` | Podmíněná | Činnost se řeší pouze tehdy, když nastane určitá situace | claim, změna, vada, prodlení |
| `aktualizacni` | Aktualizační | Činnost se provádí při změně existujícího výstupu, požadavku nebo nastavení | aktualizovat BEP při změně požadavků |

## Vztah k ostatním klíčům časového chování

- `rezim_cinnosti` určuje obecný typ chování. `opakovatelnost` doupřesňuje, jak často se vrací. `casove_pravidlo` říká, kdy vůči `spousteci_udalost`.
- V praxi má 80 % činností režim `udalostni`, `periodicka` nebo `prubezna`.

## Poznámka k milníkům

V MVP se milník modeluje jako činnost s `rezim_cinnosti: milnikova`. Plný model milníku jako samostatné entity (`typ: milnik` se strukturovanými poli `lhuta_dni`, `od_udalosti`, `kriticky`, `dusledek_nesplneni`) přijde v dalším kole spolu s plnou FIDIC vrstvou.
