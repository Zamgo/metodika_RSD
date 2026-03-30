---
title: 2 - Proces managementu informací – Výzva k veřejné soutěži
typ: procesni_oblast
oznaceni: "2"
popis: Objednatel připraví výzvu k veřejné soutěži -- stanoví EIR, shromáždí referenční informace, definuje požadavky na odpověď a sestaví kompletní zadání.
zdroj: ČSN EN ISO 19650-2; 5.2
faze:
  - priprava
R - Odpovědnost za provádění činnosti: []
A - Právní odpovědnost za dokončení činnosti: []
C - Konzultace v průběhu činnosti: []
I - Informování po dokončení činnosti: []
workflow: []
stav: draft
procesni_oblast: "[[2 - Výzva k veřejné soutěži|2 - Proces managementu informací – Výzva k veřejné soutěži]]"
cinnost: ""
vstupy: []
vystupy: []
navazane_workflow: []
---
# Obecný popis

Fáze výzvy k veřejné soutěži navazuje na posouzení potřeb (oblast 1). [[Objednatel|Objednatel]] ([[Pověřující strana|pověřující strana]], ŘSD) v této fázi sestaví kompletní zadání pro uchazeče, které zahrnuje všechny požadavky na management informací.

Klíčové činnosti:

- **Stanovení [[Požadavky objednatele na výměnu informací (EIR)|EIR]]** (požadavky na výměnu informací) -- konkrétní požadavky na informace, které Objednatel vyžaduje od [[Zhotovitel|zhotovitele]], včetně úrovně informačních potřeb ([[Úroveň informačních potřeb (LoIN)|LoIN]]), akceptačních kritérií a termínů.
- **Shromáždění referenčních informací** -- zpřístupnění existujících podkladů pro uchazeče.
- **Požadavky na odpověď a hodnoticí kritéria** -- definice, co musí nabídka obsahovat z pohledu managementu informací a jak bude hodnocena.
- **Sestavení kompletní výzvy** -- zahrnutí EIR, referenčních informací, standardu, metod, protokolu a milníků do zadání veřejné soutěže.

[[Správce stavby|Správce stavby]] se podílí na přípravě EIR a zajišťuje, že požadavky jsou reálné, měřitelné a kontrolovatelné.

---
# Činnosti v dané oblasti
```dataview
TABLE WITHOUT ID file.link AS "Činnost"
FROM "03_Oblasti správy informací"
WHERE typ = "cinnost" AND procesni_oblast = this.file.link
SORT oznaceni ASC
```
---
