---
title: Prostorová koordinace v rámci DiMS
typ: dilci_cinnost
oznaceni: "6.2+"
popis: "Zajištění prostorové bezkoliznosti stavby pomocí koordinace dílčích DiMS – detekce kolizí, evidence a řešení."
faze:
  - realizace
workflow: []
stav: draft
zdroj: "ČSN EN ISO 19650-2; 5.6.2 d) / Interní metodika ŘSD"
procesni_oblast: "[[6 - Proces managementu informací – Společné vytváření informací|6 - Proces managementu informací – Společné vytváření informací]]"
cinnost: "[[6.2 - Tvorba informací|6.2 - Tvorba informací]]"
vstupy: []
vystupy: []
navazane_workflow: []
predchozi_cinnost: ""
nasledujici_cinnost: ""
nastroj: []
frekvence: ""
R - Odpovědnost za provádění činnosti: []
A - Právní odpovědnost za dokončení činnosti: []
C - Konzultace v průběhu činnosti: []
I - Informování po dokončení činnosti: []
---
# Popis

Cílem prostorové koordinace je zajistit, aby jednotlivé části stavby (stavební objekty, technologie, inženýrské sítě) byly navrženy a realizovány bez vzájemných prostorových kolizí a v souladu se schválenou dokumentací.

Dle ISO 19650-2, čl. 5.6.2 d), musí každý [[Úkolový tým|úkolový tým]] prostorově koordinovat geometrické modely s dalšími modely sdílenými v projektovém [[Společné datové prostředí (CDE)|CDE]]. Prostorová koordinace v rámci [[Digitální model stavby (DiMS)|DiMS]] slouží k:
- identifikaci kolizí mezi profesemi,
- předcházení vícenákladům a zdržení stavby,
- zajištění souladu mezi modelem, dokumentací a skutečným provedením.

# Vstupy
- Dílčí DiMS jednotlivých profesí/částí (ve shodném souřadnicovém systému)
- Další výstupy projektové dokumentace
- Aktuální verze dokumentů a modelů uložené v CDE

# Postup
1. **Federace dílčích DiMS** -- zobrazení koordinovaných modelů v nástroji CDE
2. **Kontrola umístění** -- ověření správného souřadnicového systému a aktuální revize
3. **Identifikace kolizí**
   - Automatická detekce kolizí (pokud nástroj umožňuje) dle požadavků [[Požadavky objednatele na výměnu informací (EIR)|EIR]]
   - Vizuální kontrola kritických míst (prostupy, napojení, křížení sítí)
   - Identifikace nesouladů mezi modelem a výkresovou dokumentací
4. **Evidence kolizí** -- každá kolize musí být jednoznačně označena, lokalizována, popsána, přiřazena odpovědné profesi a opatřena termínem pro vyřešení
5. **Řešení kolizí** -- odpovědná strana navrhne řešení, posoudí se dopad, po schválení se aktualizuje DiMS, dokumentace i evidence změn
6. Kolize je uzavřena až po zapracování změny do všech relevantních výstupů

# Role a odpovědnosti
- **[[Zhotovitel|Zhotovitel]]** ([[Vedoucí pověřená strana|vedoucí pověřená strana]]): provádí prostorovou koordinaci dle [[BIM Execution Plan (BEP)|BEP]], aktualizuje DiMS, řeší kolize
- **[[Správce stavby|Správce stavby]]** (Engineer dle FIDIC): kontroluje provádění koordinace, sleduje otevřené kolize, ověřuje zapracování změn, posuzuje dopady na [[ZBV]]
- **[[Objednatel|Objednatel]]** ([[Pověřující strana|pověřující strana]] / ŘSD): rozhoduje při zásadních konfliktech, schvaluje změny s dopadem na rozsah nebo cenu

# Výstupy
- Aktuální DiMS bez otevřených zásadních kolizí
- Seznam otevřených a uzavřených kolizí
- Podklady pro změnové řízení
- Podklady pro dokumentaci skutečného provedení

# Kontrolní body pro správce stavby
- Ověřit aktuálnost dílčích DiMS
- Zkontrolovat evidenci a řešení kolizí
- Ověřit zapracování schválených změn
- Sledovat soulad mezi modelem, dokumentací a realizací
