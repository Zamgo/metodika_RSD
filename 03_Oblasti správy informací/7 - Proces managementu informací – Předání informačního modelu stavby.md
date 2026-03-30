---
title: 7 - Proces managementu informací – Předání informačního modelu stavby
typ: procesni_oblast
oznaceni: "7"
popis: ""
zdroj: A/R/I
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
procesni_oblast: "[[7 - Proces managementu informací – Předání informačního modelu stavby|7 - Proces managementu informací – Předání informačního modelu stavby]]"
cinnost: ""
---

## Popis

ČSN EN ISO 19650-2; 5.7

## Činnosti v oblasti

```dataview
TABLE WITHOUT ID file.link AS "Činnost", oznaceni AS "Označení"
FROM "03_Oblasti správy informací"
WHERE typ = "cinnost" AND procesni_oblast = this.file.link
SORT oznaceni ASC, file.name ASC
```

## Dílčí činnosti v oblasti

```dataview
TABLE WITHOUT ID file.link AS "Dílčí činnost", oznaceni AS "Označení", cinnost AS "Činnost"
FROM "03_Oblasti správy informací"
WHERE typ = "dilci_cinnost" AND procesni_oblast = this.file.link
SORT cinnost ASC, oznaceni ASC, file.name ASC
```

## Zdroj

A/R/I


