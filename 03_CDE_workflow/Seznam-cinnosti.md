---
title: Seznam činností
description: Interaktivní přehled procesů a RACI činností s filtry (jako Bases v Obsidianu).
typ: reference
faze: []
role: []
workflow: []
stav: draft
permalink: /cinnosti
tags: [cinnosti, raci, prehled, quartz]
zdroj: "Agregace z vaultu (02_Oblasti + 07_RACI_cinnosti)"
zdroj_typ: interni_metodika
---

## Účel

Tato stránka slouží jako **jednotný přehled činností** z oblasti správy informací a z matice RACI (ISO 19650). Na **webu** (Quartz) se pod článkem zobrazí interaktivní tabulka: můžete **filtrovat** podle typu stránky, typu zdroje, fáze a role, **vyhledávat v názvu** a **přejít** na detail kliknutím na řádek.

V aplikaci Obsidian používejte ve složce `03_CDE_workflow` soubor `Cinnosti.base` — chování je obdobné.

> **Web (Quartz):** soubor `Cinnosti.base` (Obsidian Bases) se do webu negeneruje. Nad standardním **Explorerem** je ale blok **Činnosti** — stejný výběr stránek jako v `.base` (složky `02_Oblasti…` a `07_RACI_cinnosti`), s rychlým filtrem a odkazem sem na **tabulku + filtry**.

## Jak to funguje na webu

Data se berou z `static/contentIndex.json` při sestavení stránky. Po načtení stránky skript vyfiltruje záznamy ze složek `02_Oblasti správy informací` a `07_RACI_cinnosti` a doplní rozhraní pro výběr hodnot.

---

_Níže následuje automaticky generovaná tabulka (komponenta Quartz)._
