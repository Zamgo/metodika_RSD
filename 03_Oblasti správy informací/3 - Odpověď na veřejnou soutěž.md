---
title: 3 - Proces managementu informací – Odpověď na veřejnou soutěž
typ: procesni_oblast
oznaceni: "3"
popis: Uchazeč (budoucí vedoucí pověřená strana) připraví odpověď -- nominuje osoby, vypracuje Pre-BEP, posoudí způsobilost, připraví plán mobilizace a registr rizik.
zdroj: ČSN EN ISO 19650-2; 5.3
faze:
  - priprava
R - Odpovědnost za provádění činnosti: []
A - Právní odpovědnost za dokončení činnosti: []
C - Konzultace v průběhu činnosti: []
I - Informování po dokončení činnosti: []
workflow: []
stav: draft
procesni_oblast: "[[3 - Odpověď na veřejnou soutěž|3 - Proces managementu informací – Odpověď na veřejnou soutěž]]"
cinnost: ""
vstupy: []
vystupy: []
navazane_workflow: []
---
# Obecný popis

Fáze odpovědi na veřejnou soutěž probíhá na straně uchazeče (budoucího vedoucího pověřeného, [[Zhotovitel|Zhotovitele]]). Uchazeč na základě [[Požadavky objednatele na výměnu informací (EIR)|EIR]] a dalších dokumentů z výzvy připraví svou odpověď prokazující schopnost splnit informační požadavky projektu.

Klíčové činnosti:

- **Nominování osob** pro management informací -- kdo bude řídit informační procesy, jaké má kompetence.
- **Předběžný plán realizace BIM (Pre-[[BIM Execution Plan (BEP)|BEP]])** -- jak uchazeč plánuje řídit informace, organizovat tým, předávat výstupy.
- **Posouzení způsobilosti a kapacity** -- [[Úkolový tým|úkolové týmy]] i [[Realizační tým|realizační tým]] jako celek prokazují schopnost splnit požadavky.
- **Plán mobilizace** -- jak se tým připraví na realizaci (IT, školení, testování).
- **Registr rizik** -- identifikace rizik spojených s předáváním informací a strategie jejich řízení.

[[Správce stavby|Správce stavby]] hodnotí nabídky z pohledu managementu informací dle stanovených kritérií.

---
# Činnosti v dané oblasti
```dataview
TABLE WITHOUT ID file.link AS "Činnost"
FROM "03_Oblasti správy informací"
WHERE typ = "cinnost" AND procesni_oblast = this.file.link
SORT oznaceni ASC
```
---
