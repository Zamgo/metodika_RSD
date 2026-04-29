from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
TARGET_DIRS = [
    ROOT / "03_Katalog všech činností",
    ROOT / "00_Podklady",
]

RACI_KEYS = (
    "R - Odpovědnost za provádění činnosti",
    "A - Právní odpovědnost za dokončení činnosti",
    "C - Konzultace v průběhu činnosti",
    "I - Informování po dokončení činnosti",
)


def iter_markdown_files() -> Iterable[Path]:
    for target_dir in TARGET_DIRS:
        if not target_dir.exists():
            continue
        for file_path in target_dir.rglob("*.md"):
            yield file_path


def split_frontmatter(text: str) -> tuple[str | None, str]:
    if not text.startswith("---\n"):
        return None, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return None, text
    frontmatter = text[4:end]
    body = text[end + 5 :]
    return frontmatter, body


def _field_indent(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def remove_list_block(lines: list[str], index: int) -> int:
    base_indent = _field_indent(lines[index])
    i = index + 1
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if not stripped:
            i += 1
            continue
        indent = _field_indent(line)
        if indent <= base_indent and ":" in line:
            break
        i += 1
    return i


def normalize_frontmatter(frontmatter: str) -> tuple[str, bool]:
    lines = frontmatter.splitlines()
    changed = False
    new_lines: list[str] = []

    typ_value = ""
    for line in lines:
        if line.startswith("typ:"):
            typ_value = line.split(":", 1)[1].strip()
            break

    if typ_value == "procesni_oblast":
        typ_value = "oblast"
    elif typ_value == "dilci_cinnost":
        typ_value = "ukol"

    i = 0
    while i < len(lines):
        line = lines[i]

        if line.startswith("typ:"):
            current = line.split(":", 1)[1].strip()
            if current == "procesni_oblast":
                new_lines.append("typ: oblast")
                changed = True
            elif current == "dilci_cinnost":
                new_lines.append("typ: ukol")
                changed = True
            else:
                new_lines.append(line)
            i += 1
            continue

        if line.startswith("procesni_oblast:"):
            new_lines.append(line.replace("procesni_oblast:", "oblast:", 1))
            changed = True
            i += 1
            continue

        if typ_value in ("oblast", "cinnost"):
            if any(line.startswith(f"{key}:") for key in RACI_KEYS):
                i = remove_list_block(lines, i)
                changed = True
                continue

        new_lines.append(line)
        i += 1

    if typ_value == "cinnost":
        has_garant = any(line.startswith("garant:") for line in new_lines)
        if not has_garant:
            insert_idx = -1
            for idx, line in enumerate(new_lines):
                if line.startswith("popis:"):
                    insert_idx = idx + 1
                    break
            if insert_idx == -1:
                for idx, line in enumerate(new_lines):
                    if line.startswith("oznaceni:"):
                        insert_idx = idx + 1
                        break
            if insert_idx == -1:
                insert_idx = len(new_lines)
            new_lines.insert(insert_idx, "garant: \"\"")
            changed = True

    normalized = "\n".join(new_lines).rstrip("\n") + "\n"
    return normalized, changed


def process_file(file_path: Path, apply: bool) -> bool:
    original = file_path.read_text(encoding="utf-8")
    frontmatter, body = split_frontmatter(original)
    if frontmatter is None:
        return False

    updated_frontmatter, changed = normalize_frontmatter(frontmatter)
    if not changed:
        return False

    updated = f"---\n{updated_frontmatter}---\n{body}"
    if apply:
        file_path.write_text(updated, encoding="utf-8", newline="\n")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Refactor metadata typ/field names.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply changes. Without this flag, only list touched files.",
    )
    args = parser.parse_args()

    touched: list[Path] = []
    for file_path in iter_markdown_files():
        if process_file(file_path, apply=args.apply):
            touched.append(file_path)

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"{mode}: touched {len(touched)} files")
    for path in touched:
        print(path.relative_to(ROOT).as_posix())

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
