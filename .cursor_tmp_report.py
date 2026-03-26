from pathlib import Path
import re

root = Path(r"C:/Users/samuel.augustin/Liftrock/BIM Services - General/01_Zakázky/ZAK_2023_060 ŘSD Plzeň CDE koordinátor/knowledge_base")
files = list((root / "07_RACI_cinnosti").rglob("*.md")) + list((root / "02_Oblasti správy informací").rglob("*.md"))

areas, packs, acts, un = [], [], [], []

for p in files:
    t = p.read_text(encoding="utf-8")
    if not t.startswith("---\n"):
        continue
    e = t.find("\n---\n", 4)
    if e == -1:
        continue
    fm = t[4:e]
    d = {}
    for line in fm.splitlines():
        if ": " in line:
            k, v = line.split(": ", 1)
            d[k] = v.strip()

    typ = d.get("typ", "").strip().strip('"')
    if typ == "procesni_oblast":
        areas.append(p)
    elif typ == "pracovni_balicek":
        packs.append(p)
    elif typ == "cinnost":
        acts.append(p)

    if typ == "cinnost":
        po = d.get("procesni_oblast", '""')
        pb = d.get("pracovni_balicek", '""')
        ozn = d.get("oznaceni", "").strip().strip('"')
        if (po == '""' or pb == '""') and not re.fullmatch(r"\d+\.\d+\.\d+", ozn or ""):
            un.append((p, ozn if ozn else "bez oznaceni"))

print(f"COUNTS areas={len(areas)} packs={len(packs)} acts={len(acts)} unassigned={len(un)}")
print("PACKAGES_START")
for p in sorted(packs):
    print(p.relative_to(root).as_posix())
print("PACKAGES_END")
print("UNASSIGNED_START")
for p, r in sorted(un):
    print(f"{p.relative_to(root).as_posix()}::{r}")
print("UNASSIGNED_END")
