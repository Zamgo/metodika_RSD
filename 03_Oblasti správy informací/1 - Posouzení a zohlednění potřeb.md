---
title: 1 - Posouzení a zohlednění potřeb
typ: procesni_oblast
oznaceni: "1"
popis: ""
zdroj: ČSN EN ISO 19650-2; 5.1.1
faze:
  - priprava
R - Odpovědnost za provádění činnosti:
  - "[[Pověřující strana]]"
A - Právní odpovědnost za dokončení činnosti:
  - "[[Pověřující strana]]"
C - Konzultace v průběhu činnosti: []
I - Informování po dokončení činnosti: []
workflow: []
stav: draft
tags:
  - raci
  - iso_19650
procesni_oblast: "[[1 - Posouzení a zohlednění potřeb|1 - Posouzení a zohlednění potřeb]]"
pracovni_balicek: ""
---





## Pracovní balíčky jednotlivých činností v dané oblasti
```dataview
TABLE WITHOUT ID file.link AS "Pracovní balíček"
FROM "03_Oblasti správy informací"
WHERE typ = "pracovni_balicek" AND procesni_oblast = this.file.link
SORT pracovni_balicek ASC, file.name ASC
```

