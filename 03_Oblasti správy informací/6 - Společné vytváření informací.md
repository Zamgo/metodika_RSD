---
title: 6 - Proces managementu informací – Společné vytváření informací
typ: procesni_oblast
oznaceni: "6"
popis: Realizační tým společně vytváří informace dle TIDP, provádí kontroly kvality, přezkoumává a schvaluje informační kontejnery a koordinuje prostorovou geometrii modelů.
zdroj: ČSN EN ISO 19650-2; 5.6
faze:
  - realizace
R - Odpovědnost za provádění činnosti: []
A - Právní odpovědnost za dokončení činnosti: []
C - Konzultace v průběhu činnosti: []
I - Informování po dokončení činnosti: []
workflow: []
stav: draft
procesni_oblast: "[[6 - Společné vytváření informací|6 - Proces managementu informací – Společné vytváření informací]]"
cinnost: ""
vstupy: []
vystupy: []
navazane_workflow: []
---
# Obecný popis

Fáze společného vytváření informací je jádrem celého procesu managementu informací. Zde [[Realizační tým|realizační tým]] skutečně produkuje informace -- dokumentaci, modely, výkresy, výpočty a další [[Informační kontejner|informační kontejnery]] -- v souladu s plány předávání ([[Úkolový plán předávání informací (TIDP)|TIDP]]/[[Hlavní plán předávání informací (MIDP)|MIDP]]) a projektovými metodami.

Proces zahrnuje pět hlavních činností:

- **Kontrola referenčních informací** -- ověření, že [[Úkolový tým|úkolové týmy]] mají přístup k potřebným referenčním informacím a sdíleným zdrojům v [[Společné datové prostředí (CDE)|CDE]].
- **Tvorba informací** -- samotná produkce informačních kontejnerů dle TIDP, koordinace mezi úkolovými týmy a prostorová koordinace geometrických modelů (detekce kolizí).
- **Kontrola prokazování kvality** -- interní kontrola kvality informačního kontejneru autorem/úkolovým týmem před předložením k přezkoumání.
- **Přezkoumání a schvalování** -- [[Vedoucí pověřená strana|vedoucí pověřená strana]] přezkoumá informace a rozhodne o jejich schválení pro sdílení nebo odmítnutí s pokyny k nápravě.
- **Přezkoumání informačního modelu** -- souhrnné přezkoumání realizačním týmem před předložením k formálnímu autorizování.

[[Správce stavby|Správce stavby]] aktivně sleduje plnění MIDP, koordinuje řešení zjištěných kolizí a problémů a dohlíží na kvalitu předkládaných výstupů.

---
# Činnosti v dané oblasti
```dataview
TABLE WITHOUT ID file.link AS "Činnost"
FROM "03_Oblasti správy informací"
WHERE typ = "cinnost" AND procesni_oblast = this.file.link
SORT oznaceni ASC
```
---
