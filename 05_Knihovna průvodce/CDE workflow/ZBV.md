---
title: ZBV
typ: workflow
faze:
  - "[[Realizace]]"
stav: draft
permalink: workflow/zbv
navazane_cinnosti: []
---

## Účel workflow

Schválení ZBV

## Kdy se spouští

Workflow se spouští, když [[Zhotovitel|zhotovitel]] předkládá koncept změny během výstavby (ZBV) ke schválení. Dle hodnoty ZBV se použije odpovídající varianta workflow (viz [[ZBV do 20 mil]], [[ZBV do 50 mil]], [[ZBV nad 50 mil]]).

## Vstupy

- Koncept ZBV včetně potřebných dokumentů (předložený zhotovitelem)

## Role

- [[Správce stavby]]
- [[Zhotovitel]]
- [[Technický dozor]]

## Hlavní kroky

| Krok | Název kroku | Odpovědná strana | Deadline | Popis kroku |
|---:|---|---|---|---|
| 1 | Předložení konceptu ZBV | Zhotovitel |  | Odpovědná Role nahraje potřebné dokumenty k ZBV. |
| 2 | Sdělení souhrnných připomínek ke konceptu ZBV | TDS | 10 dní | Kontrola ze strany týmu Správce stavby a AD. Informované osoby s nutnou připomínkou jsou povinné přidat připomínku. Odpovědná Role následně zkonsoliduje připomínky a vloží do komentáře. |
| 3 | Zapracování připomínek a předložení opraveného konceptu ZBV | Zhotovitel | 10 dní | Zapracování připomínek a nahrání nové verze dokumentů. |
| 4 | Kontrola zapracování připomínek a sdělení souhrnných připomínek k opravenému konceptu ZBV | TDS | 5 dní | Kontrola ze strany týmu Správce stavby. Informované osoby s nutnou připomínkou jsou povinné přidat připomínku. Odpovědná Role následně zkonsoliduje připomínky a vloží do komentáře. |
| 5 | Zapracování připomínek k opravenému konceptu a předložení čistopisu ZBV | Zhotovitel | 5 dní | Zapracování připomínek a nahrání nové verze dokumentů. |
| 6 | Kontrola čistopisu ZBV, tvorba schvalovacího stanoviska TA + vložení schvalovacího stanoviska TA do ZBV | TDS | 5 dní | Kontrola ze strany týmu Správce stavby. Informované osoby s nutnou připomínkou jsou povinné přidat připomínku. Odpovědná Role následně vytvoří a vloží schvalovací stanovisko TA. |
| 7 | Vložení elektronického podpisu - Zhotovitel | Zhotovitel | 2 dny | Zajištění podpisů dle směrnice ŘSD. |
| 8 | Vložení elektronického podpisu - AD | AD | 1 den | Zajištění podpisů dle směrnice ŘSD. |
| 9 | Vložení elektronického podpisu - Správce stavby | SpSt | 1 den | Zajištění podpisů dle směrnice ŘSD. |
| 10 | Vložení elektronického podpisu - Objednatel | Objednatel | 1 den | Zajištění podpisů dle směrnice ŘSD. |
| 11 | Administrace + Nahrání skenu do Proconom + Upload DSS | Proconom | 5 dní | Pracovník společnosti Proconom nahraje podepsané ZBV do AspeHub |

## Výstupy

- Podepsané ZBV nahrané v AspeHub a uložené v [[Společné datové prostředí (CDE)|CDE]] ve stavu „Schváleno"

## Vazba na CDE

Workflow je realizováno prostřednictvím [[Společné datové prostředí (CDE)|CDE]] (schvalování, připomínkování, [[Auditní stopa|auditní stopa]]).

## Vazba na příslušnou přílohu nebo šablonu

- [[Šablony workflow (P1b)]]
- Ke stažení: [[00_Podklady/P1b_Šablony Workflow_Červený Fidic_prázdné.xlsx|P1b – Šablony workflow (Excel)]]
