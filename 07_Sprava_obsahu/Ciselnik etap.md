---
title: Ciselnik etap
typ: catalog
faze: []
workflow: []
stav: draft
permalink: /sprava-obsahu/ciselnik-etap
aliases: [Číselník etap]
---

## Použití

Tento číselník je jediný zdroj hodnot pro metadata `etapa` u činností a dílčích činností. Etapa je jemnější granularitou než `faze` — vychází z české stavební praxe (stupně PD, projektové fáze) a doplňuje ISO 19650 lifecycle.

Pole `etapa` je multi-select (zapisuje se vždy jako seznam, i u jedné hodnoty). Pole je doplňkové k `faze`, ne náhrada — obě pole zůstávají ve frontmatteru.

## Hodnoty (ID) a mapování na fáze

| etapa (ID)             | label                                               | patri_do_faze |
| ---------------------- | --------------------------------------------------- | ------------- |
| `strategicka_priprava` | Strategická příprava / Definice investičního záměru | `priprava`    |
| `priprava_projektu`    | Příprava projektu                                   | `priprava`    |
| `studie`               | Studie                                              | `navrh`       |
| `DPZ`                  | Dokumentace pro povolení záměru                     | `navrh`       |
| `DPS`                  | Dokumentace pro provádění stavby                    | `navrh`       |
| `soupis_praci`         | Soupis prací a dodávek                              | `navrh`       |
| `realizace_stavby`     | Realizace / Dozor projektanta                       | `realizace`   |
| `predani_stavby`       | Předání a uvedení do provozu                        | `realizace`   |
| `provoz_a_sprava`      | Provoz a správa aktiv                               | `provoz`      |

## Pravidlo pro vyplňování

- `etapa` a `faze` se vyplňují **souběžně**. Pokud má činnost `etapa: [predani_a_uvedeni]`, ve `faze` musí být `realizace`.
- Mapping je informativní pro kontrolu konzistence. Obsidian Bases nedělá auto-join mezi soubory, takže obě pole musí být ve frontmatteru ručně.
- Skript pro auto-derive `faze` z `etapa` není v MVP plánován — případně až ve druhém kole.

## Vazba na související číselníky

- [[Ciselnik fazi]] — hrubší 3-úrovňový lifecycle dle ISO 19650.
- [[Pravidla metadat]] — pravidla zápisu klíče `etapa` ve frontmatteru.
