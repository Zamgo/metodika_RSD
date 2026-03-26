---
title: Seznam činností
description: Interaktivní přehled procesů a RACI činností s filtry (jako Bases v Obsidianu).
typ: reference
faze: []
workflow: []
stav: draft
permalink: /cinnosti
tags: [cinnosti, raci, prehled, quartz]
zdroj: "Agregace z vaultu (02_Oblasti + 07_RACI_cinnosti)"
---

## Účel

Tato stránka slouží jako **jednotný přehled činností** z oblasti správy informací a z matice RACI (ISO 19650). Na **webu** (Quartz) se pod článkem zobrazí interaktivní tabulka: můžete **filtrovat** podle typu stránky, typu zdroje, fáze a role, **vyhledávat v názvu** a **přejít** na detail kliknutím na řádek.

V aplikaci Obsidian používejte ve složce `03_CDE_workflow` soubor `Cinnosti.base` — chování je obdobné.

> **Web (Quartz):** soubor `Cinnosti.base` (Obsidian Bases) se do webu negeneruje. Na webu používejte tuto normální stránku **Seznam činností** (v Exploreru pod `03_CDE_workflow`) s tabulkou a filtry.

## Jak to funguje na webu

Data se berou z `static/contentIndex.json` při sestavení stránky. Po načtení stránky skript vyfiltruje záznamy ze složek `02_Oblasti správy informací` a `07_RACI_cinnosti` a doplní rozhraní pro výběr hodnot.

---

_Níže následuje automaticky generovaná tabulka (komponenta Quartz)._

---

## Databázové pohledy

### Pohled A — Přehled procesních oblastí

```dataview
TABLE WITHOUT ID file.link AS "Procesní oblast", procesni_oblast AS "Označení"
FROM "07_RACI_cinnosti"
WHERE typ = "procesni_oblast"
SORT procesni_oblast ASC, file.name ASC
```

### Pohled D — Přehled všech konkrétních činností

```dataview
TABLE WITHOUT ID file.link AS "Činnost", procesni_oblast AS "Procesní oblast", pracovni_balicek AS "Pracovní balíček", oznaceni AS "Označení"
FROM "07_RACI_cinnosti"
WHERE typ = "cinnost"
SORT procesni_oblast ASC, pracovni_balicek ASC, oznaceni ASC, file.name ASC
```

> Detailní pohledy **B** (detail procesní oblasti) a **C** (detail pracovního balíčku) jsou přímo na stránkách oblastí a balíčků jako query bloky podle jejich metadata.

