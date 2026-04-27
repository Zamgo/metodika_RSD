---
title: Materiály, výrobny
typ: workflow
faze:
  - "[[Realizace]]"
stav: draft
permalink: workflow/materialy-vyrobny
navazane_cinnosti: []
---

## Účel workflow

Schvalování - Materiály a Výrobny

## Kdy se spouští

Workflow se spouští, když [[Zhotovitel|zhotovitel]] předkládá návrh materiálu nebo výrobny ke schválení před jejich použitím na stavbě.

## Vstupy

- Návrh materiálu nebo výrobny k odsouhlasení (předložený zhotovitelem)

## Role

- [[Správce stavby]]
- [[Zhotovitel]]
- [[Technický dozor]]

## Hlavní kroky

| Krok | Název kroku | Odpovědná strana | Deadline | Popis kroku |
|---:|---|---|---|---|
| 1 | Předložení návrhu k odsouhlasení | Zhotovitel |  | Zhotovitel předloží návrh k odsouhlasení. |
| 2 | Připomínky TDS | TDS | 10 dní | Odpovědná osoba vypracuje souhrn připomínek, které vloží do komentáře. |
| 3 | Zapracování připomínek | Zhotovitel | 5 dní | Zhotovitel zapracuje souhrnné připomínky a vloží čistopis do příslušné složky v DMS. |
| 4 | Kontrola zapracování připomínek | TDS | 5 dní | Kontrola zapracování připomínek. Pokud tým SpS dojde k názoru, že připomínky nebyly zohledněny, vrátí úkol zpět zhotoviteli. |
| 5 | Podpis zhotovitele | Zhotovitel | 3 dny | Zhotovitel digitálně podepíše přiložené dokumenty a schválí krok. |
| 6 | Schválení Asistentem správce stavby - Vedoucí TDS - podpis | TDS | 3 dny | Odpovědná osoba digitálně podepíše přiložené dokumenty a schválí krok |
| 7 | Podpis správce stavby | SpSt | 3 dny | Odpovědná osoba digitálně podepíše přiložené dokumenty a schválí krok |
| 8 | Podpis objednatele | Odpovědná osoba | 3 dny | odpovědná osoba objednatele digitálně podepíše přiložené dokumenty a schválí krok |
| 9 | Nahrání podepsaných dokumentů do AspeHub | Proconom | 3 dny | Pracovník společnosti Proconom nahraje podepsané dokumenty do AspeHub a předá info o nahrání. |

## Výstupy

- Podepsané schválení materiálu/výrobny nahrané v AspeHub a uložené v [[Společné datové prostředí (CDE)|CDE]] ve stavu „Schváleno"

## Vazba na CDE

Workflow je realizováno prostřednictvím CDE (schvalování, připomínkování, auditní stopa).

## Vazba na příslušnou přílohu nebo šablonu

- [[Šablony workflow (P1b)]]
- Ke stažení: [[00_Podklady/P1b_Šablony Workflow_Červený Fidic_prázdné.xlsx|P1b – Šablony workflow (Excel)]]
