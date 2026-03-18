---
title: Ověřování alfanumerických informací v rámci DiMS – Sam
typ: process
faze: [realizace]
role: [spravce cde, spravce stavby, zhotovitel]
cinnosti: []
workflow: []
temata: [cde, dokumentace]
stav: draft
vlastnik: rsd
souvisi: []
priloha: []
permalink: /proces/realizace/overovani-alfanumerickych-informaci-v-ramci-dims-sam
aliases: []
tags: [proces]
---

## Účel

Cílem ověřování alfanumerických informací je zajistit, aby alfanumerické informace v [[Digitální informační model stavby (DiMS)|DiMS]] (identifikátory, parametry, klasifikace a vazby) byla úplná, správná, konzistentní, a aby odpovídala požadavkům stanovených v rámci datového standardu stavby (DSS).
- Ověřování alfanumerických informací v rámci [[Digitální informační model stavby (DiMS)|DiMS]] slouží zejména k:
    - zajištění jednoznačné identifikace prvků v rámci jednotlyvých dílčích DiMS podle požadavků DSS,
    - zajištění jednoznačné struktury zápisu informací (atributů, vlastností, vztahů…) v rámci DiMS podle požadavků DSS.

## Kdy se používá

**Editorske doplneni:** V podkladu není explicitní sekce; doplnit podle kontextu projektu.

## Vstupy

Pro provedení ověřování alfanumerických informací musí být k dispozici:
- aktuální [[Digitální informační model stavby (DiMS)|DiMS]] (dílčí DiMS) ve stupni, podorobnosti a formátu požadovaném projektem (např. IFC),
- definice požadavků na data podle varianty projektu:
    - strojově čitelný a standardizovaný datový standard stavby ve formátu IDS (pokud existuje), nebo
    - datový standard stavby v tabulkové formě (např. XLSX).
Správce stavby ověřuje, že pracuje s aktuálními verzemi [[Informační kontejner|informačních kontejnerů]] uloženými v [[Společné datové prostředí (CDE)|CDE]] a že jsou k nim dostupné požadavky na informace.

## Postup

  - Příprava kontroly
  - Určení varianty kontrolního rámce (IDS / XLSX).
  - Stanovení rozsahu kontroly (které SO/PS/IS, které profese, které milníky).
  - Zajištění aktuálních požadavků na informace.
  - Kontrola verze a [[Auditní stopa|auditní stopy]] v [[Společné datové prostředí (CDE)|CDE]]
  - Ověření, že kontrolovaný výstup má jednoznačnou revizi a správný stav v [[Společné datové prostředí (CDE)|CDE]].
  - Ověření dohledatelnosti změn oproti předchozí revizi (co se změnilo a proč).
  - Varianty kontroly podle úrovně digitalizace
    - Varianta s IDS – automatizované provádění v závislosti od užitého nástroje.
    - Varianta bez IDS, Datový standard pouze v rámci XLSX – kombinace automatizovaných kontrol pomocí vhodných nástrojů a manuální interpretace požadavků
        - Evidence neshod a náprava
    - Každé zjištění musí být:
      - jednoznačně označeno,
      - přiřazeno k revizi a k dotčenému prvku v rámci DiMS,
      - popsáno věcně (co chybí / co je špatně / jaký je dopad),
      - přiřazeno odpovědné straně (typicky zhotovitel),
      - opatřeno termínem nápravy.
    - Evidence probíhá v rámci nástroje [[Společné datové prostředí (CDE)|CDE]] tak, aby byla auditovatelná.
    - Neshoda je uzavřena až po:
      - dodání opravené revize,
      - opakované kontrole,
      - uložení výsledků do v rámci [[Společné datové prostředí (CDE)|CDE]].

## Role a odpovědnosti

- Zhotovitel:
    - dodává alfanumerické informace v požadované struktuře,
    - provádí pravidelnou [[Verifikace|verifikaci]] alfanumerických informací podle [[BIM Execution Plan (BEP)|BEP]] (jestli to vyplývá z jeho kompetencí na daném projektu)
    - odstraňuje neshody a promítá změny do [[Digitální informační model stavby (DiMS)|DiMS]].
- Správce stavby:
    - provádí pravidelnou [[Verifikace|verifikaci]] alfanumerických informací podle [[BIM Execution Plan (BEP)|BEP]] (jestli to vyplývá z jeho kompetencí na daném projektu)
    - vede evidenci neshod a sleduje jejich uzavírání,
    - ověřuje promítnutí změn a dopady do rozpočtu/[[ZBV]].
- ŘSD:
    - stanoví požadavky v rámci požadavků na výměnu informací ([[Požadavky objednatele na výměnu informací (EIR)|EIR]]) včetně DSS,
    - rozhoduje o akceptaci výstupů a o postupu u zásadních neshod,

## Výstupy

Výstupem ověřování alfanumerických informací je:
- protokol o kontrole (včetně rozsahu a použitého rámce) nebo autoamtizovaný záznam v rámci nástroje [[Společné datové prostředí (CDE)|CDE]],
- seznam otevřených a uzavřených neshod,
- potvrzení akceptované revize v [[Společné datové prostředí (CDE)|CDE]] ([[Auditní stopa|auditní stopa]]),
- podklady pro změnové řízení (vazby na [[ZBV]]),

## Kontrolní body pro správce stavby

Správce stavby pravidelně ověřuje:
- zda jsou kontrolované výstupy aktuální a správně verzované v [[Společné datové prostředí (CDE)|CDE]],
- zda jsou povinné parametry vyplněny v požadovaném rozsahu,
- zda jsou jednotky a datové typy konzistentní,
- zda jsou neshody evidovány, řešeny a uzavírány,
- zda je zajištěna použitelnost informací pro předání do provozu a případný export do navazujících systémů.

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
