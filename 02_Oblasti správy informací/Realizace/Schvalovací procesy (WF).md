---
title: Schvalovací procesy (WF) - Pavlína + příloha
typ: process
faze: [realizace]
role: [spravce cde, spravce stavby, zhotovitel]
workflow: []
stav: draft
permalink: /proces/realizace/schvalovaci-procesy-pavlina-priloha
tags: [proces, cde, dokumentace]
zdroj: "Interní metodika ŘSD"
zdroj_typ: interni_metodika
---

## Účel

Účelem nastavení [[Workflow|workflow]] v rámci [[Společné datové prostředí (CDE)|CDE]] je vytvořit jednotný, řízený a transparentní proces sdílení, připomínkování, schvalování a publikace projektové dokumentace a digitálního modelu stavby. [[Workflow]] představuje základní mechanismus zajišťující kontrolu kvality informací před jejich uvolněním k dalšímu použití.

## Kdy se používá

**Editorske doplneni:** V podkladu není explicitní sekce; doplnit podle kontextu projektu.

## Vstupy

Pro nastavení a provoz schvalovacích procesů v rámci CDE musí být k dispozici zejména:
  - smluvní dokumentace projektu,
  - požadavky objednatele na výměnu informací ([[Požadavky objednatele na výměnu informací (EIR)|EIR]]),
  - plán realizace BIM ([[BIM Execution Plan (BEP)|BEP]]), pokud je zpracován,
  - definice rolí a odpovědností jednotlivých účastníků projektu,
  - struktura projektového CDE,
  - pravidla názvosloví a verzování dokumentů.
Správce stavby ověřuje, že tyto podklady jsou při nastavení workflow zohledněny a že schvalovací proces odpovídá organizační struktuře projektu.

## Postup

  - Definovat kroky [[Workflow|workflow]] (např. vložení – kontrola – připomínky – schválení – publikace).(Příloha šablony WF)
  - Přiřadit odpovědné osoby.
  - Nastavit lhůty.
  - Otestovat průchod dokumentu celým procesem.
- Zahájení schvalovacího procesu
  - Dokument je vložen do příslušného stavu.
  - Je přiřazeno workflow.
  - Jsou notifikovány odpovědné osoby.
Správce stavby kontroluje správnost zahájení.
### Evidence a vypořádání připomínek

- Každá připomínka musí být:
  - jednoznačně formulována,
  - přiřazena odpovědné osobě,
  - opatřena termínem.
- Odpovědná strana provede úpravu.
- Aktualizovaná verze je znovu předložena ke kontrole.
- Připomínka je uzavřena až po ověření nápravy.

### Uvolnění dokumentace

Dokument může být uvolněn do stavu „Schváleno“ pouze pokud:
  - byly vypořádány všechny připomínky,
  - je správně označen,
  - odpovídá aktuálnímu rozsahu projektu.

### Uzavření [[Workflow|workflow]] a archivace předchozí verze

- Po schválení je dokument převeden do příslušného stavu.
- Předchozí verze zůstává archivována.
- [[Auditní stopa|Auditní stopa]] musí zůstat zachována.
- Správce stavby ověřuje:
  - správné označení verze,
  - správné přiřazení stavu,
  - nemožnost zpětné editace schválené verze.


## Role a odpovědnosti

- Zhotovitel:
    - předkládá dokumentaci a modelové výstupy ke kontrole prostřednictvím [[Společné datové prostředí (CDE)|CDE]],
    - reaguje na připomínky v rámci schvalovacího procesu,
    - předkládá upravené verze dokumentace k opětovnému posouzení.
- Správce stavby:
    - kontroluje správné zahájení schvalovacích procesů,
    - sleduje průběh [[Workflow|workflow]] v nástroji [[Společné datové prostředí (CDE)|CDE]],
    - eviduje připomínky a jejich vypořádání,
    - ověřuje splnění podmínek pro uvolnění dokumentace do stavu „schváleno“.
- ŘSD:
    - provádí finální schválení dokumentace v případech stanovených smlouvou nebo interními postupy,
    - rozhoduje o řešení zásadních připomínek nebo sporů mezi účastníky projektu.

## Výstupy

Výstupem schvalovacích procesů v rámci CDE je:
  - schválená projektová dokumentace nebo modelový výstup uložený ve stavu „Schváleno“,
  - evidence připomínek a jejich vypořádání v rámci [[Společné datové prostředí (CDE)|CDE]],
  - zachovaná [[Auditní stopa|auditní stopa]] celého schvalovacího procesu,
  - archivované předchozí verze dokumentů.
Tyto výstupy slouží jako podklad pro další fáze realizace stavby a pro kontrolu plnění projektových požadavků.

## Kontrolní body pro správce stavby

**Editorske doplneni:** V podkladu není explicitní sekce; doplnit pokud je uvedeno jinde.

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
