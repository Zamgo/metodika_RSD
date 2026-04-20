"""
Fix truncated 'popis' frontmatter fields in 03_Oblasti správy informací/*.md.

Background:
  A previous migration truncated the 'popis:' value in frontmatter at ~120 chars,
  often cutting off mid-word. The full description still exists in the note body
  under the '# Popis' heading.

Strategy:
  1. Parse frontmatter and extract current 'popis:' value.
  2. Extract the first paragraph under the '# Popis' H1 heading in the body.
  3. Strip wikilinks: '[[Target|Display]]' -> 'Display', '[[Target]]' -> 'Target'.
  4. Replace frontmatter 'popis:' only if BOTH conditions hold:
       a) Current 'popis' is a strict prefix of the cleaned body paragraph
          (after normalizing whitespace).
       b) The cleaned body paragraph is strictly longer.
     This prevents overwriting intentionally different short descriptions.

Usage (run from vault root `knowledge_base/`):
  python fix_popis_truncation.py           # dry-run (default), prints diffs
  python fix_popis_truncation.py --apply   # actually writes changes
"""

import argparse
import os
import re

VAULT_ROOT = os.path.dirname(os.path.abspath(__file__))
OBLASTI_DIR = os.path.join(VAULT_ROOT, "03_Oblasti správy informací")


def parse_frontmatter(content: str):
    text = content.lstrip("\ufeff")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    if not text.startswith("---"):
        return [], text, False
    end_idx = text.find("\n---", 3)
    if end_idx == -1:
        return [], text, False
    fm_block = text[4:end_idx]
    fm_lines = fm_block.split("\n")
    body = text[end_idx + 4:]
    if body.startswith("\n"):
        body = body[1:]
    return fm_lines, body, True


def reassemble(fm_lines, body):
    return "---\n" + "\n".join(fm_lines) + "\n---\n" + body


def extract_popis_fm(fm_lines):
    """Return (index, raw_value, unquoted_value) or (-1, '', '')."""
    for i, line in enumerate(fm_lines):
        if line.startswith("popis:"):
            raw = line[len("popis:"):].strip()
            unquoted = raw
            if (unquoted.startswith('"') and unquoted.endswith('"')) or (
                unquoted.startswith("'") and unquoted.endswith("'")
            ):
                unquoted = unquoted[1:-1]
            return i, raw, unquoted
    return -1, "", ""


def extract_first_popis_paragraph(body: str) -> str:
    """Find '# Popis' heading and return its first non-empty paragraph."""
    m = re.search(r"(?m)^#\s+Popis\s*$", body)
    if not m:
        return ""
    after = body[m.end():]
    next_heading = re.search(r"(?m)^#\s+\S", after)
    section = after[: next_heading.start()] if next_heading else after

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", section) if p.strip()]
    return paragraphs[0] if paragraphs else ""


WIKILINK_PIPE_RE = re.compile(r"\[\[[^\[\]|]+\|([^\[\]]+)\]\]")
WIKILINK_SIMPLE_RE = re.compile(r"\[\[([^\[\]|]+)\]\]")


def strip_wikilinks(text: str) -> str:
    text = WIKILINK_PIPE_RE.sub(r"\1", text)
    text = WIKILINK_SIMPLE_RE.sub(r"\1", text)
    return text


def normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def escape_for_yaml_double_quoted(text: str) -> str:
    """Escape string for use inside YAML double-quoted scalar."""
    return text.replace("\\", "\\\\").replace('"', '\\"')


def process_file(fpath: str):
    """Return (changed_bool, old_popis, new_popis, new_content_or_None)."""
    with open(fpath, "r", encoding="utf-8-sig") as f:
        content = f.read()

    fm_lines, body, has_fm = parse_frontmatter(content)
    if not has_fm:
        return False, "", "", None

    idx, _, current_popis = extract_popis_fm(fm_lines)
    if idx == -1:
        return False, "", "", None

    body_para = extract_first_popis_paragraph(body)
    if not body_para:
        return False, current_popis, "", None

    cleaned = strip_wikilinks(body_para)
    cleaned_norm = normalize(cleaned)
    current_norm = normalize(current_popis)

    if not current_norm:
        return False, current_popis, "", None
    if current_norm == cleaned_norm:
        return False, current_popis, "", None
    if not cleaned_norm.startswith(current_norm):
        return False, current_popis, "", None
    if len(cleaned_norm) <= len(current_norm):
        return False, current_popis, "", None

    new_popis_value = cleaned_norm
    new_line = f'popis: "{escape_for_yaml_double_quoted(new_popis_value)}"'
    new_fm_lines = list(fm_lines)
    new_fm_lines[idx] = new_line
    new_content = reassemble(new_fm_lines, body)
    return True, current_popis, new_popis_value, new_content


def main():
    parser = argparse.ArgumentParser(description="Fix truncated 'popis' in frontmatter.")
    parser.add_argument("--apply", action="store_true", help="Write changes to disk.")
    args = parser.parse_args()
    dry_run = not args.apply

    if not os.path.isdir(OBLASTI_DIR):
        print(f"ERROR: Directory not found: {OBLASTI_DIR}")
        return

    print(f"=== {'DRY RUN' if dry_run else 'APPLYING'} ===")
    print(f"Directory: {OBLASTI_DIR}\n")

    total = 0
    changes = 0
    skipped_no_popis = 0
    skipped_not_prefix = 0

    for fname in sorted(os.listdir(OBLASTI_DIR)):
        if not fname.endswith(".md"):
            continue
        total += 1
        fpath = os.path.join(OBLASTI_DIR, fname)
        try:
            changed, old, new, new_content = process_file(fpath)
        except Exception as e:
            print(f"  ERROR processing {fname}: {e}")
            continue

        if changed:
            changes += 1
            print(f"[CHANGE] {fname}")
            print(f"  OLD ({len(old)}): {old}")
            print(f"  NEW ({len(new)}): {new}")
            print()
            if not dry_run and new_content is not None:
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(new_content)
        else:
            if not new:
                skipped_no_popis += 1
            else:
                skipped_not_prefix += 1

    print("=" * 60)
    print(f"Total .md files:              {total}")
    print(f"Changes {'(would apply)' if dry_run else '(applied)'}: {changes}")
    print(f"Skipped (no # Popis match):   {skipped_no_popis}")
    print(f"Skipped (not a prefix match): {skipped_not_prefix}")
    if dry_run:
        print("\n>>> Run with --apply to write changes to disk.")


if __name__ == "__main__":
    main()
