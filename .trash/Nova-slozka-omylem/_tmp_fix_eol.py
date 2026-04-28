from pathlib import Path

root = Path('.')
exts = {'.md', '.base', '.gitattributes', '.txt', '.yml', '.yaml', '.json'}
changed = 0
for p in root.rglob('*'):
    if not p.is_file():
        continue
    if p.suffix.lower() not in exts and p.name != '.gitattributes':
        continue
    try:
        data = p.read_bytes()
    except Exception:
        continue
    if b'\x00' in data:
        continue
    if b'\r\n' in data:
        p.write_bytes(data.replace(b'\r\n', b'\n'))
        changed += 1
print(f'normalized_files={changed}')
