---
title: 3 - Proces managementu informací – Odpověď na veřejnou soutěž
typ: procesni_oblast
oznaceni: "3"
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
procesni_oblast: "[[3 - Proces managementu informací – Odpověď na veřejnou soutěž|3 - Proces managementu informací – Odpověď na veřejnou soutěž]]"
cinnost: ""
---

## Popis

ČSN EN ISO 19650-2; 5.3

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

n/a


