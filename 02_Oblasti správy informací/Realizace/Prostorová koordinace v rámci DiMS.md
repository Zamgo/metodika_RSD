---
title: Prostorová koordinace v rámci DiMS – Sam
typ: process
faze: [realizace]
role: [spravce cde, spravce stavby, zhotovitel]
workflow: []
stav: draft
permalink: /proces/realizace/prostorova-koordinace-v-ramci-dims-sam
tags: [proces, cde, dokumentace]
---

## Účel

Cílem prostorové koordinace je zajistit, aby jednotlivé části stavby (stavební objekty, technologie, inženýrské sítě apod.) byly navrženy a realizovány bez vzájemných prostorových kolizí a v souladu se schválenou dokumentací.
Prostorová koordinace v rámci [[Digitální model stavby (DiMS)|DiMS]] slouží zejména k:
- identifikaci kolizí mezi profesemi,
- předcházení vícenákladům a zdržení stavby,
- zajištění souladu mezi modelem, dokumentací a skutečným provedením.

## Kdy se používá

**Editorske doplneni:** V podkladu není explicitní sekce; doplnit podle kontextu projektu.

## Vstupy

Pro provedení prostorové koordinace musí být k dispozici:
- dílčí [[Digitální model stavby (DiMS)|DiMS]] jednotlivých profesí/částí, které
    - odpovídají zadefinovanému souřadnicovému a výškovému systému projektu;
    - je možné současně zobrazit v rámci nástroje [[Společné datové prostředí (CDE)|CDE]] (případně jiného)
- další výstupy projektové dokumentace.
Správce stavby ověřuje, že pracuje s aktuálními verzemi dokumentů a modelů uloženými v nástroji [[Společné datové prostředí (CDE)|CDE]].

## Postup

- Federace dílčích [[Digitální model stavby (DiMS)|DiMS]] v rámci zvoleného nástroje
- Zobrazení koordinovaných dílčích [[Digitální model stavby (DiMS)|DiMS]] v rámci nástroje.
- Kontrola správného umístění modelů v souřadnicovém systému.
- Ověření, že všechny modely odpovídají aktuální revizi dokumentace.
  - Identifikace kolizí
  - Automatická detekce kolizí (pokud nástroj umožňuje) podle požadavků vyplývajících z [[Požadavky objednatele na výměnu informací (EIR)|EIR]].
  - Vizuální kontrola kritických míst (prostupy, napojení konstrukcí, křížení sítí).
  - Identifikace prostorových nesouladů mezi modelem a výkresovou dokumentací.
  - Evidence kolizí
- Každá zjištěná kolize musí být:
    - jednoznačně označena,
    - prostorově lokalizována,
    - popsána věcně a srozumitelně,
    - přiřazena odpovědné profesi,
    - opatřena termínem pro vyřešení.
- Evidence probíhá v rámci nástroje [[Společné datové prostředí (CDE)|CDE]].
### Řešení kolizí

- Odpovědná strana navrhne technické řešení.
- Řešení je posouzeno z hlediska dopadu na ostatní části stavby.
- Pokud má řešení dopad na cenu nebo rozsah díla, posoudí se jeho vazba na [[ZBV]].
- Po schválení řešení se aktualizuje:
    - dotčené dílčí [[Digitální model stavby (DiMS)|DiMS]],
    - dotčená dokumentace,
    - evidence změn.
- Kolize je uzavřena až po zapracování změny do všech relevantních výstupů.


## Role a odpovědnosti

- Zhotovitel:
    - provádí pravidelnou prostorovou koordinaci podle [[BIM Execution Plan (BEP)|BEP]] (jestli to vyplývá z jeho kompetencí na daném projektu),
    - aktualizuje dílčí [[Digitální model stavby (DiMS)|DiMS]],
    - řeší identifikované kolize.
- Správce stavby:
    - provádí pravidelnou prostorovou koordinaci podle [[BIM Execution Plan (BEP)|BEP]] (jestli to vyplývá z jeho kompetencí na daném projektu),
    - kontroluje provádění koordinace,
    - sleduje otevřené kolize,
    - ověřuje zapracování změn,
    - posuzuje dopady na [[ZBV]].
- ŘSD:
    - rozhoduje v případě zásadních technických konfliktů,
    - schvaluje změny s dopadem na rozsah nebo cenu díla.

## Výstupy

Výstupem prostorové koordinace je:
- aktuální [[Digitální model stavby (DiMS)|DiMS]] bez otevřených zásadních kolizí,
- seznam otevřených a uzavřených kolizí,
- podklady pro změnové řízení,
- podklady pro dokumentaci skutečného provedení.

## Kontrolní body pro správce stavby

Správce stavby pravidelně ověřuje:
- zda jsou dílčí [[Digitální model stavby (DiMS)|DiMS]] aktuální,
- zda jsou kolize evidovány a řešeny,
- zda jsou zapracovány schválené změny,
- zda nedochází k nesouladu mezi modelem, dokumentací a realizací.

## Související role

- [[Správce stavby]]
- [[Zhotovitel]]

## Související fáze

- [[Realizace]]

## Související workflow

- (bude doplněno při převodu workflow šablon)

## Související pojmy

- (bude doplněno po založení pojmových stránek)

## Související přílohy

- (bude doplněno při převodu příloh)
