---
title: Pravidla nazvu souboru
typ: catalog
faze: []
role: []
workflow: []
stav: draft
permalink: /sprava-obsahu/pravidla-nazvu-souboru
aliases: [Pravidla názvu souboru]
tags: [sprava_obsahu, nazvy_souboru, quartz, dokumentace]
---

## Zásady

- Stránky jsou Markdown soubory (`.md`) ve struktuře složek definované v zadání.
- **Názvy souborů mohou být v češtině s diakritikou** podle názvu stránky.
- Metadata ve frontmatteru zapisovat česky **bez diakritiky** (klíče i hodnoty číselníků).

## Doporučené konvence názvů stránek

- Používat věcné názvy odpovídající nadpisům ve zdrojových podkladech (docx/xlsx).
- Pro workflow stránky používat krátký oficiální název (např. `BEP.md`, `DiMS.md`), který je zároveň snadno odkazovatelný.
- Pro pojmové stránky používat oficiální název pojmu; případně doplnit zkratku v závorce, pokud je běžná (např. `Společné datové prostředí (CDE).md`).

## `permalink` vs. název souboru

- Název souboru se může v čase změnit (např. upřesnění názvu), ale `permalink` má zůstat stabilní.
- `permalink` používat bez diakritiky, s pomlčkami.

## Konflikty a duplicity

- Pokud existují dva pojmy se stejným názvem, použít rozlišující doplnění v názvu stránky (např. v závorce) a přidat `aliases`.
- U workflow, rolí a fází se držet jednotného názvosloví podle číselníků.

