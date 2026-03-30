---
title: Ciselnik workflow
typ: catalog
faze: []
workflow: []
stav: draft
permalink: /sprava-obsahu/ciselnik-workflow
aliases: [Číselník workflow]
---

## Použití

Tento číselník je jediný zdroj hodnot pro metadata `workflow` a pro názvy workflow stránek ve `03_Workflow/`.

## Hodnoty (ID)

- `bep`
- `dims`
- `hmg`
- `rds`
- `tepr-kzp`
- `materialy-a-vyrobny`
- `subdodavky`
- `variace`
- `claim`
- `zbv`
- `fakturace`

## Odpovídající workflow stránky (Obsidian)

Poznámka: názvy workflow stránek odpovídají názvům listů v `P1b_Šablony Workflow...xlsx`.

- `bep` → [[BEP]]
- `dims` → [[DiMS]]
- `hmg` → [[HMG]]
- `rds` → [[RDS]]
- `tepr-kzp` → [[TePŘ + KZP]]
- `materialy-a-vyrobny` → [[Materiály a výrobny]]
- `subdodavky` → [[Subdodávky]]
- `variace` → [[Variace]]
- `claim` → [[Claim]]
- `zbv` → [[ZBV]]
- `fakturace` → [[Fakturace]]

**Editorske doplneni:** Excel obsahuje i listy `ZBV do 20 mil`, `ZBV do 50 mil`, `ZBV nad 50 mil`. V prvním průchodu je zařadíme jako varianty workflow `zbv` (samostatné stránky ve `03_Workflow/` s vazbou na `workflow: [zbv]`) a v metodice jasně označíme, že jde o odlišné schvalovací řetězce podle limitů.
