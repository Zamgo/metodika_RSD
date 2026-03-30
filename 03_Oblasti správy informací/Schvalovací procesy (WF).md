---
title: Schvalovací procesy (workflow) v CDE
typ: dilci_cinnost
oznaceni: "6.4+"
popis: "Nastavení a provoz schvalovacích workflow v CDE – řízený proces sdílení, připomínkování, schvalování a publikace dokumentace."
faze:
  - realizace
workflow: []
stav: draft
zdroj: "ČSN EN ISO 19650-2; 5.6.4 / Interní metodika ŘSD"
procesni_oblast: "[[6 - Proces managementu informací – Společné vytváření informací|6 - Proces managementu informací – Společné vytváření informací]]"
cinnost: "[[6.4 - Přezkoumávání informací a schvalování|6.4 - Přezkoumávání informací a schvalování]]"
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

Účelem nastavení [[Workflow|workflow]] v [[Společné datové prostředí (CDE)|CDE]] je vytvořit jednotný, řízený a transparentní proces sdílení, připomínkování, schvalování a publikace dokumentace a digitálního modelu stavby. Workflow je základní mechanismus zajišťující kontrolu kvality informací před jejich uvolněním k dalšímu použití.

Tato činnost navazuje na požadavky ISO 19650-2, čl. 5.6.4, kde se stanovuje, že každý [[Úkolový tým|úkolový tým]] musí provést přezkoumání informací před jejich sdílením v CDE a přiřadit jim vhodnost z hlediska dalšího použití.

# Vstupy
- Smluvní dokumentace projektu
- Požadavky [[Objednatel|Objednatele]] na výměnu informací ([[Požadavky objednatele na výměnu informací (EIR)|EIR]])
- Plán realizace BIM ([[BIM Execution Plan (BEP)|BEP]])
- Definice rolí a odpovědností
- Struktura projektového CDE
- Pravidla názvosloví a verzování dokumentů

# Postup
1. **Definice kroků workflow** (vložení -- kontrola -- připomínky -- schválení -- publikace)
2. **Přiřazení odpovědných osob** ke každému kroku
3. **Nastavení lhůt** pro jednotlivé kroky
4. **Testování** průchodu dokumentu celým procesem
5. **Zahájení schvalovacího procesu** -- dokument vložen do příslušného stavu, přiřazeno workflow, notifikovány odpovědné osoby
6. **Evidence a vypořádání připomínek**:
   - Každá připomínka jednoznačně formulována, přiřazena odpovědné osobě, opatřena termínem
   - Odpovědná strana provede úpravu, aktualizovaná verze znovu předložena
   - Připomínka uzavřena až po ověření nápravy
7. **Uvolnění dokumentace** do stavu „Schváleno" -- pouze po vypořádání všech připomínek
8. **Archivace** předchozí verze, zachování [[Auditní stopa|auditní stopy]]

# Role a odpovědnosti
- **[[Zhotovitel|Zhotovitel]]** ([[Vedoucí pověřená strana|vedoucí pověřená strana]]): předkládá dokumentaci ke kontrole, reaguje na připomínky, předkládá upravené verze
- **[[Správce stavby|Správce stavby]]** (Engineer dle FIDIC): kontroluje zahájení workflow, sleduje průběh, eviduje připomínky, ověřuje podmínky pro uvolnění
- **Objednatel** ([[Pověřující strana|pověřující strana]] / ŘSD): provádí finální schválení dle smlouvy, rozhoduje o zásadních připomínkách

# Výstupy
- Schválená dokumentace nebo modelový výstup ve stavu „Schváleno"
- Evidence připomínek a jejich vypořádání
- Zachovaná auditní stopa schvalovacího procesu
- Archivované předchozí verze

# Kontrolní body pro správce stavby
- Ověřit správné nastavení workflow v CDE (kroky, osoby, lhůty)
- Sledovat průběžné dodržování schvalovacích procesů
- Zkontrolovat, že schválené dokumenty nelze zpětně editovat
- Ověřit zachování auditní stopy
