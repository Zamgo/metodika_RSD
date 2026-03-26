from pathlib import Path
import re

root = Path(r"C:/Users/samuel.augustin/Liftrock/BIM Services - General/01_Zakázky/ZAK_2023_060 ŘSD Plzeň CDE koordinátor/knowledge_base")
raci = root / "07_RACI_cinnosti"

areas = set()
for p in raci.rglob('*.md'):
    t = p.read_text(encoding='utf-8')
    if not t.startswith('---\n'):
        continue
    e = t.find('\n---\n', 4)
    if e == -1:
        continue
    fm = t[4:e]
    d = {}
    for line in fm.splitlines():
        if ': ' in line:
            k,v = line.split(': ',1)
            d[k]=v.strip().strip('"')
    po = d.get('procesni_oblast','')
    if re.fullmatch(r'\d+', po):
        areas.add(po)

for a in sorted(areas, key=int):
    path = raci / f"{a} - Procesni oblast {a}.md"
    if path.exists():
        continue
    text = f'''---
title: "Procesní oblast {a}"
typ: "procesni_oblast"
procesni_oblast: "{a}"
pracovni_balicek: ""
faze: []
workflow: []
stav: draft
---

## Přehled procesní oblasti

Tato stránka slouží jako rozcestník pro procesní oblast metodiky ŘSD. Shrnuje pracovní balíčky a navazující konkrétní činnosti, které je potřeba v oblasti koordinovat. Je relevantní zejména při plánování, řízení předávání informací a kontrole plnění požadavků v průběhu projektu.

## Pracovní balíčky v oblasti

```query
typ: "pracovni_balicek" procesni_oblast: "{a}" path:"07_RACI_cinnosti"
```

## Konkrétní činnosti v oblasti

```query
typ: "cinnost" procesni_oblast: "{a}" path:"07_RACI_cinnosti"
```

## Související stránky

- [[03_CDE_workflow/Seznam-cinnosti|Seznam činností]]
- [[03_CDE_workflow/Cinnosti.base|Cinnosti.base]]
'''
    path.write_text(text, encoding='utf-8')

print('CREATED_AREAS', len(areas))
