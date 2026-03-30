---
title: 5 - Proces managementu informací – Mobilizace
typ: procesni_oblast
oznaceni: "5"
popis: ""
zdroj: n/a
faze:
  - priprava
R - Odpovědnost za provádění činnosti: []
A - Právní odpovědnost za dokončení činnosti: []
C - Konzultace v průběhu činnosti: []
I - Informování po dokončení činnosti: []
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

## Pracovní balíčky v oblasti

```dataview
TABLE WITHOUT ID file.link AS "Pracovní balíček", pracovni_balicek AS "Označení"
FROM "03_Oblasti správy informací"
WHERE typ = "pracovni_balicek" AND procesni_oblast = this.file.link
SORT pracovni_balicek ASC, file.name ASC
```

## Konkrétní činnosti v oblasti

```dataview
TABLE WITHOUT ID file.link AS "Činnost", oznaceni AS "Označení", pracovni_balicek AS "Pracovní balíček"
FROM "03_Oblasti správy informací"
WHERE typ = "cinnost" AND procesni_oblast = this.file.link
SORT pracovni_balicek ASC, oznaceni ASC, file.name ASC
```

## Zdroj

n/a
