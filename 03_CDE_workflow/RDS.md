---
title: RDS
typ: workflow
faze:
  - "[[Realizace]]"
  - "[[Příprava]]"
stav: draft
permalink: /workflow/rds
navazane_cinnosti: []
---

## Účel workflow

Schválení RDS

## Kdy se spouští

Workflow se spouští, když [[Zhotovitel|zhotovitel]] předkládá realizační dokumentaci stavby (RDS) ke schválení. Zhotovitel nahraje předkoncept RDS do DMS a svolá výrobní výbor.

## Vstupy

- Předkoncept RDS nahraný v DMS v příslušné složce

## Role

- [[Správce stavby]]
- [[Zhotovitel]]
- [[Technický dozor]]

## Hlavní kroky

| Krok | Název kroku | Odpovědná strana | Deadline | Popis kroku |
|---:|---|---|---|---|
| 1 | Nahrání předkonceptu RDS | GP Zhotovitele |  | Zhotovitel nahraje do DMS do příslušné složky předkoncept RDS. Svolá výrobní výbor min. x dní před jeho konáním a seznámí objednatele se změnami dokumentace. |
| 2 | Výrobní výbor | Odpovědné strany |  | Proběhne jednání Výrobního výboru, kde budou vzneseny technické připomínky k zapracovní do konceptu. Odpovědná strana nahraje zápis z VV do DMS. |
| 4 | Zapracování připomínek ke konceptu RDS - vydání čistopisu | GP Zhotovitele | 10 dní | Tým přípravy zhotovitele zapracuje souhrnné připomínky, digitálně podepíše a vloží čistopis do příslušné složky v DMS. |
| 6 | El. Podpis | Zhotovitel | 1 den | Odpovědná osoba elektronicky podepíše dokument. |
| 7 | El. Podpis | Odpovědná osoba objednatele | 1 den | Odpovědná osoba elektronicky podepíše dokument. |
| 8 | Tisk x paré | GP zhotovitele | 7 dní | Odpovědná osoba vytiskne RDS v x paré. |
| 9 | Nahrání podepsané RDS do AspeHub | Proconom | 3 dny | Pracovník společnosti Proconom nahraje podespanou RDS do AspeHub a předá informaci o hotovém úkolu. |

## Výstupy

- Podepsaná RDS nahraná v AspeHub a uložená v [[Společné datové prostředí (CDE)|CDE]] ve stavu „Schváleno"

## Vazba na CDE

Workflow je realizováno prostřednictvím CDE (schvalování, připomínkování, auditní stopa).

## Vazba na příslušnou přílohu nebo šablonu

- [[Šablony workflow (P1b)]]
- Ke stažení: [[00_Podklady/P1b_Šablony Workflow_Červený Fidic_prázdné.xlsx|P1b – Šablony workflow (Excel)]]
- Adresářová struktura: [[00_Podklady/P1a_Adresářová struktura.xlsx|P1a – Adresářová struktura CDE (Excel)]]

## Související role

- [[Správce stavby]]
- [[Zhotovitel]]
- [[Technický dozor]]

## Související fáze

- [[Příprava]]
- [[Realizace]]
- [[Provoz a údržba]]

## Související pojmy

- [[Společné datové prostředí (CDE)]]
- [[Auditní stopa]]
- [[Informační kontejner]]
