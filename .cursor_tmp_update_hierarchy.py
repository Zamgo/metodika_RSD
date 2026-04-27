import re
from pathlib import Path

root = Path(r"C:/Users/samuel.augustin/Liftrock/BIM Services - General/01_Zakázky/ZAK_2023_060 ŘSD Plzeň CDE koordinátor/knowledge_base")
folders = [root / "07_RACI_cinnosti", root / "02_Oblasti správy informací"]

processed = []
areas = []
packages = []
activities = []
unassigned = []

fm_key_re = re.compile(r'^(?P<k>[^:\n]+):\s*(?P<v>.*)$')

for folder in folders:
    for p in sorted(folder.rglob('*.md')):
        text = p.read_text(encoding='utf-8')
        if not text.startswith('---\n'):
            continue
        end = text.find('\n---\n', 4)
        if end == -1:
            continue
        fm_text = text[4:end]
        body = text[end+5:]
        lines = fm_text.splitlines()

        fm = {}
        order = []
        for line in lines:
            m = fm_key_re.match(line)
            if m:
                k = m.group('k').strip()
                v = m.group('v')
                fm[k] = v
                order.append(k)

        ozn = fm.get('oznaceni', '').strip().strip('"').strip("'")

        typ = '"cinnost"'
        po = '""'
        pb = '""'

        m1 = re.fullmatch(r'(\d+)', ozn)
        m2 = re.fullmatch(r'(\d+)\.(\d+)', ozn)
        m3 = re.fullmatch(r'(\d+)\.(\d+)\.(\d+)', ozn)

        if m1:
            val = m1.group(1)
            typ = '"procesni_oblast"'
            po = f'"{val}"'
            pb = '""'
            areas.append(p)
        elif m2:
            val = f"{m2.group(1)}.{m2.group(2)}"
            typ = '"pracovni_balicek"'
            po = f'"{m2.group(1)}"'
            pb = f'"{val}"'
            packages.append(p)
        elif m3:
            typ = '"cinnost"'
            po = f'"{m3.group(1)}"'
            pb = f'"{m3.group(1)}.{m3.group(2)}"'
            activities.append(p)
        else:
            typ = '"cinnost"'
            po = '""'
            pb = '""'
            activities.append(p)
            if ozn:
                unassigned.append((p, f'nepodporovane oznaceni: {ozn}'))
            else:
                unassigned.append((p, 'bez oznaceni'))

        fm['typ'] = typ
        fm['procesni_oblast'] = po
        fm['pracovni_balicek'] = pb

        keys = list(order)
        for k in ['typ', 'procesni_oblast', 'pracovni_balicek']:
            if k not in keys:
                keys.append(k)

        out_fm_lines = []
        for k in keys:
            if k in fm:
                out_fm_lines.append(f"{k}: {fm[k]}")

        if typ == '"procesni_oblast"':
            code = po.strip('"')
            body = (
                "## Přehled procesní oblasti\n\n"
                "Tato stránka slouží jako rozcestník pro procesní oblast metodiky ŘSD. "
                "Shrnuje pracovní balíčky a navazující konkrétní činnosti, které je potřeba v oblasti koordinovat. "
                "Je relevantní zejména při plánování, řízení předávání informací a kontrole plnění požadavků v průběhu projektu.\n\n"
                "## Pracovní balíčky v oblasti\n\n"
                "```query\n"
                f"typ: \"pracovni_balicek\" procesni_oblast: \"{code}\" path:\"07_RACI_cinnosti\"\n"
                "```\n\n"
                "## Konkrétní činnosti v oblasti\n\n"
                "```query\n"
                f"typ: \"cinnost\" procesni_oblast: \"{code}\" path:\"07_RACI_cinnosti\"\n"
                "```\n\n"
                "## Související stránky\n\n"
                "- [[03_CDE_workflow/Seznam-cinnosti|Seznam všech činností]]\n"
                "- [[03_CDE_workflow/Cinnosti.base|Cinnosti.base]]\n"
            )
        elif typ == '"pracovni_balicek"':
            pcode = pb.strip('"')
            body = (
                "## Přehled pracovního balíčku\n\n"
                "Tato stránka slouží jako stručný rozcestník pro pracovní balíček v metodice ŘSD. "
                "Vymezuje téma balíčku, jeho cíl a návaznost na konkrétní činnosti, které je potřeba v balíčku zajistit.\n\n"
                "## Konkrétní činnosti v balíčku\n\n"
                "```query\n"
                f"typ: \"cinnost\" pracovni_balicek: \"{pcode}\" path:\"07_RACI_cinnosti\"\n"
                "```\n\n"
                "## Související stránky\n\n"
                "- [[03_CDE_workflow/Seznam-cinnosti|Seznam všech činností]]\n"
                "- [[03_CDE_workflow/Cinnosti.base|Cinnosti.base]]\n"
            )

        new_text = '---\n' + '\n'.join(out_fm_lines) + '\n---\n\n' + body.lstrip('\n')
        if new_text != text:
            p.write_text(new_text, encoding='utf-8')
            processed.append(p)

sc = root / '03_CDE_workflow' / 'Seznam-cinnosti.md'
if sc.exists():
    t = sc.read_text(encoding='utf-8')
    block = (
        '## Databázové pohledy\n\n'
        '### Pohled A — Přehled procesních oblastí\n\n'
        '```query\n'
        'typ: "procesni_oblast" path:"07_RACI_cinnosti"\n'
        '```\n\n'
        '### Pohled D — Přehled všech konkrétních činností\n\n'
        '```query\n'
        'typ: "cinnost" path:"07_RACI_cinnosti"\n'
        '```\n\n'
        '> Detailní pohledy **B** (detail procesní oblasti) a **C** (detail pracovního balíčku) jsou přímo na stránkách oblastí a balíčků jako query bloky podle jejich metadata.\n\n'
    )
    idx = t.find('## Databázové pohledy')
    if idx >= 0:
        nidx = t.find('\n## ', idx + 1)
        t = t[:idx] + block + (t[nidx+1:] if nidx >= 0 else '')
    else:
        t = t.rstrip() + '\n\n---\n\n' + block
    sc.write_text(t, encoding='utf-8')

base = root / '03_CDE_workflow' / 'Cinnosti.base'
if base.exists():
    bt = base.read_text(encoding='utf-8')
    if 'name: Procesní oblasti' not in bt:
        bt = bt.rstrip() + "\n\n  - type: table\n    name: Procesní oblasti\n    order:\n      - oznaceni\n      - file.name\n      - typ\n      - procesni_oblast\n      - pracovni_balicek\n    filters:\n      and:\n        - typ == \"procesni_oblast\"\n    sort:\n      - property: procesni_oblast\n        direction: ASC\n\n  - type: table\n    name: Všechny konkrétní činnosti\n    order:\n      - oznaceni\n      - file.name\n      - popis\n      - procesni_oblast\n      - pracovni_balicek\n      - zdroj\n    filters:\n      and:\n        - typ == \"cinnost\"\n    sort:\n      - property: procesni_oblast\n        direction: ASC\n      - property: pracovni_balicek\n        direction: ASC\n      - property: oznaceni\n        direction: ASC\n"
        base.write_text(bt, encoding='utf-8')

report = root / '03_CDE_workflow' / '_report_hierarchie_cinnosti.txt'
with report.open('w', encoding='utf-8') as f:
    f.write(f"UPDATED_FILES={len(processed)}\\n")
    f.write(f"AREAS={len(areas)}\\n")
    f.write(f"PACKAGES={len(packages)}\\n")
    f.write(f"ACTIVITIES={len(activities)}\\n")
    f.write(f"UNASSIGNED={len(unassigned)}\\n")
    for p, reason in unassigned:
        rel = p.relative_to(root).as_posix()
        f.write(f"UNASSIGNED::{rel}::{reason}\\n")

print(f"UPDATED_FILES={len(processed)}")
print(f"AREAS={len(areas)} PACKAGES={len(packages)} ACTIVITIES={len(activities)} UNASSIGNED={len(unassigned)}")
