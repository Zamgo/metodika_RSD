---
title: "Procesní oblast 5"
typ: "procesni_oblast"
procesni_oblast: "[[07_RACI_cinnosti/5 - Procesni oblast 5.md|5 - Procesni oblast 5]]"
pracovni_balicek: ""
faze: []
workflow: []
stav: draft
---

## Přehled procesní oblasti

Tato stránka slouží jako rozcestník pro procesní oblast metodiky ŘSD. Shrnuje pracovní balíčky a navazující konkrétní činnosti, které je potřeba v oblasti koordinovat. Je relevantní zejména při plánování, řízení předávání informací a kontrole plnění požadavků v průběhu projektu.

## Pracovní balíčky v oblasti

```dataview
TABLE WITHOUT ID file.link AS "Pracovní balíček", pracovni_balicek AS "Označení"
FROM "07_RACI_cinnosti"
WHERE typ = "pracovni_balicek" AND procesni_oblast = this.procesni_oblast
SORT pracovni_balicek ASC, file.name ASC
```

## Konkrétní činnosti v oblasti

```dataview
TABLE WITHOUT ID file.link AS "Činnost", oznaceni AS "Označení", pracovni_balicek AS "Pracovní balíček"
FROM "07_RACI_cinnosti"
WHERE typ = "cinnost" AND procesni_oblast = this.procesni_oblast
SORT pracovni_balicek ASC, oznaceni ASC, file.name ASC
```

## Související stránky

- [[03_CDE_workflow/Seznam-cinnosti|Seznam činností]]
- [[03_CDE_workflow/Cinnosti.base|Cinnosti.base]]
