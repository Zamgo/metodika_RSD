---
title: Fakturace
typ: workflow
faze:
  - "[[Realizace]]"
stav: draft
permalink: /workflow/fakturace
navazane_cinnosti: []
---

## Účel workflow

Schválení Fakturace

## Kdy se spouští

Workflow se spouští měsíčně. [[Zhotovitel|Zhotovitel]] předkládá záznam o měření položek do 25. dne v měsíci.

## Vstupy

- Záznam o měření položek (ZMP) dle Metodiky měření
- Zjišťovací protokol (ZP) dle Metodiky měření

## Role

- [[Zhotovitel]]
- [[Technický dozor]]

## Hlavní kroky

| Krok | Název kroku | Odpovědná strana | Deadline | Popis kroku |
|---:|---|---|---|---|
| 1 | Předložení Záznamu o měření položek | Zhotovitel | Do 25. dne v měsíci | Zhotovitel nahraje Záznam o měření položek dle Metodiky měření. |
| 2 | Schválení TDS | TDS příslušného SO | 3 dny | TDS zkontroluje ZMP a opatří elektronickým podpisem. |
| 3 | Předložení Zjišťovacího protokolu | Zhotovitel | 2 dny | Zhotovitel nahraje Zjišťovací protokol dle Metodiky měření. |
| 4 | Schválení TDS | TDS příslušného SO | 2 dny | TDS zkontroluje ZP a opatří elektronickým podpisem. |
| 5 | Nahrání do DSS AspeHub | Proconom | 3 dny | Pracovník společnosti Proconom nahraje podepsané dokumenty do AspeHub a předá info o nahrání. |

## Výstupy

- Podepsané fakturační dokumenty (ZMP, ZP) nahrané v AspeHub a uložené v [[Společné datové prostředí (CDE)|CDE]] ve stavu „Schváleno"

## Vazba na CDE

Workflow je realizováno prostřednictvím CDE (schvalování, připomínkování, auditní stopa).

## Vazba na příslušnou přílohu nebo šablonu

- [[Šablony workflow (P1b)]]
- Ke stažení: [[00_Podklady/P1b_Šablony Workflow_Červený Fidic_prázdné.xlsx|P1b – Šablony workflow (Excel)]]

