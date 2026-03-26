---
title: 5 - Proces managementu informací – Mobilizace
typ: procesni_oblast
oznaceni: "5"
popis: ""
zdroj: n/a
faze:
  - priprava
R - Odpovědnost za provádění činnosti: ""
A - Právní odpovědnost za dokončení činnosti: ""
C - Konzultace v průběhu činnosti: ""
I - Informování po dokončení činnosti: ""
workflow: []
stav: draft
tags:
  - raci
  - iso_19650
procesni_oblast: "[[5 - Proces managementu informací – Mobilizace|5 - Proces managementu informací – Mobilizace]]"
pracovni_balicek: ""
---

## Popis

ČSN EN ISO 19650-2; 5.5

## Pracovn? bal??ky v oblasti

```dataview
TABLE WITHOUT ID file.link AS "Pracovn? bal??ek", pracovni_balicek AS "Ozna?en?"
FROM "07_RACI_cinnosti"
WHERE typ = "pracovni_balicek" AND procesni_oblast = this.procesni_oblast
SORT pracovni_balicek ASC, file.name ASC
```

## Konkr?tn? ?innosti v oblasti

```dataview
TABLE WITHOUT ID file.link AS "?innost", oznaceni AS "Ozna?en?", pracovni_balicek AS "Pracovn? bal??ek"
FROM "07_RACI_cinnosti"
WHERE typ = "cinnost" AND procesni_oblast = this.procesni_oblast
SORT pracovni_balicek ASC, oznaceni ASC, file.name ASC
```

## Zdroj

n/a
