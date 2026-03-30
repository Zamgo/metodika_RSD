---
title: 1 - Posouzení a zohlednění potřeb
typ: procesni_oblast
oznaceni: "1"
popis: "Pověřující strana (Objednatel) stanoví základní rámec managementu informací -- pověří osoby, definuje požadavky na informace, milníky, standard, metody, CDE a protokol."
zdroj: "ČSN EN ISO 19650-2; 5.1"
faze:
  - priprava
R - Odpovědnost za provádění činnosti: []
A - Právní odpovědnost za dokončení činnosti: []
C - Konzultace v průběhu činnosti: []
I - Informování po dokončení činnosti: []
workflow: []
stav: draft
procesni_oblast: "[[1 - Posouzení a zohlednění potřeb|1 - Posouzení a zohlednění potřeb]]"
cinnost: ""
vstupy: []
vystupy: []
navazane_workflow: []
---
# Obecný popis

Oblast „Posouzení a zohlednění potřeb" je úvodní fází celého procesu managementu informací dle ISO 19650-2. Probíhá na straně [[Pověřující strana|pověřující strany]] ([[Objednatel|Objednatele]], ŘSD) **před** vyhlášením veřejné soutěže a vytváří základní rámec, podle kterého bude management informací na projektu fungovat.

Objednatel v této fázi:

- **Pověří osoby** odpovědné za management informací -- určí, kdo bude řídit informační procesy, jaké má pravomoci a kompetence.
- **Stanoví projektové požadavky na informace (PIR)** -- definuje, jaké informace potřebuje pro klíčová rozhodnutí.
- **Určí milníky pro předání informací** -- kdy a v jakých bodech se budou informace předávat.
- **Připraví projektový informační standard** -- pravidla pro strukturování, klasifikaci a výměnu informací.
- **Definuje metody a postupy** -- jak se budou informace vytvářet, přezkoumávat a předávat.
- **Zajistí referenční informace a sdílené zdroje** -- existující podklady, šablony, knihovny.
- **Stanoví společné datové prostředí ([[Společné datové prostředí (CDE)|CDE]])** -- platformu pro sdílení a správu informací.
- **Připraví informační protokol** -- pravidla upravující práva a povinnosti stran.

Tato fáze je kritická, protože kvalita zadání přímo ovlivňuje kvalitu informačních výstupů v celém projektu.

---
# Činnosti v dané oblasti
```dataview
TABLE WITHOUT ID file.link AS "Činnost"
FROM "03_Oblasti správy informací"
WHERE typ = "cinnost" AND procesni_oblast = this.file.link
SORT oznaceni ASC
```
---
