#!/usr/bin/env python3
"""
Convert old-format Blurbs HTML files to Jekyll front matter format using _layouts/items.html.

Patterns handled:
  1. Recipe items (e.g. ReptronSalve, BarkbruteArmour) - has ingredients + AP cost
  2. Source items (e.g. BloodMiteEye, VoodooCauldron) - has src (creature/plant source)
  3. Ingredient-for items (e.g. PurpleLotusLeaf) - has make (used to craft other items)
  4. Simple items (e.g. AncientSilverSpike) - just blurb text

Usage:
  python convert_blurbs.py <file1.html> [file2.html ...]
  python convert_blurbs.py --file list.txt    # Convert files listed in a text file (one per line)
  python convert_blurbs.py --dry-run <file>   # Preview without writing
  python convert_blurbs.py --file list.txt --dry-run  # Preview files from list

The script will:
  - Skip files that already have Jekyll front matter (---)
  - Extract item_name from <title> or <h1>
  - Extract item_id from the "No" column
  - Parse recipe ingredients from the From/Make column
  - Parse source (src) from the From/Make column
  - Parse ingredient-for (make) links from the Type/Notes columns
  - Extract blurb text from <div class="blurbs">
  - Write converted file in Jekyll front matter format
"""

import sys
import os
import re

import argparse
from html.parser import HTMLParser
from html import unescape


def read_file_safe(filepath):
    """Read a file with encoding fallback (UTF-8 -> latin-1)."""
    for enc in ('utf-8', 'latin-1'):
        try:
            with open(filepath, 'r', encoding=enc) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError(f"Could not decode {filepath} with any supported encoding")


def is_already_converted(filepath):
    """Check if a file already has Jekyll front matter."""
    content = read_file_safe(filepath)
    first_line = content.split('\n', 1)[0].strip()
    return first_line == '---'


def skip_file(filename):
    """Files that should not be converted (index pages, etc.)."""
    skip_list = [
        'AllBlurbs.html',
    ]
    return os.path.basename(filename) in skip_list


def parse_html(filepath):
    """Parse the old HTML file and extract structured data."""
    content = read_file_safe(filepath)

    result = {
        'item_name': None,
        'item_id': None,
        'src': [],      # source creature/plant
        'make': [],     # ingredient for
        'recipe': [],   # recipe ingredients
        'ap': None,     # action points for recipe
        'blurb': None,  # blurb text
    }

    # Extract item_name from <title>
    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
    if title_match:
        result['item_name'] = unescape(title_match.group(1).strip())

    # Extract blurb text from <div class="blurbs">
    blurb_match = re.search(r'<div class="blurbs">(.*?)</div>', content, re.DOTALL)
    if blurb_match:
        blurb_text = blurb_match.group(1).strip()
        # Normalize whitespace (collapse newlines/tabs to single spaces)
        blurb_text = re.sub(r'\s+', ' ', blurb_text)
        result['blurb'] = blurb_text

    # Find the data row - the row containing item_id in the No column
    # This is the <tr> after the header row containing <th>No</th>
    # Look for the data row pattern: <tr><th>&nbsp;</th><th>NUMBER</th>...
    # or <tr>\n\t<th>NUMBER</th>... (AncientSilverSpike pattern)

    # Pattern 1: <tr><th>&nbsp;</th><th>ID</th>... (most files)
    data_row_match = re.search(
        r'<tr>\s*<th>\s*(?:&nbsp;|)\s*</th>\s*<th>(\d+)</th>(.*?)</tr>',
        content, re.DOTALL
    )

    # Pattern 2: <tr>\n\t<th>ID</th>... (AncientSilverSpike-style, no Ver column)
    if not data_row_match:
        data_row_match = re.search(
            r'<tr>\s*<th>(\d+)</th>(.*?)</tr>',
            content, re.DOTALL
        )

    if not data_row_match:
        print(f"  WARNING: Could not find data row in {filepath}")
        return result

    result['item_id'] = int(data_row_match.group(1))
    row_rest = data_row_match.group(2)

    # Parse cells from the rest of the data row
    # After 'No', the columns should be:
    # 0: Name, 1: Carry, 2: Sell, 3: From/Make, 4: Treasure, 5: Used, 6: Class, 7: Type, 8: Notes
    cells = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row_rest, re.DOTALL)

    if len(cells) > 3:
        # Parse From/Make column (Index 3) for recipe or source info
        _parse_from_make(cells[3], result)

    if len(cells) > 7:
        # Parse Type column (Index 7) for "make" (ingredient-for) links
        _parse_make_links(cells[7], result)

    return result





def _parse_from_make(col_content, result):
    """Parse the From/Make column to extract recipe or source info."""
    has_make_icon = 'Make.png' in col_content

    # Check for recipe pattern: Make icon + Vessel + (AP) + ingredients
    # e.g., "Vessel Pond or Waterhole (12) 7 Purple Lotus Leaf..."
    # or: "Jungle Knife (18) 2 Barkbrute Skin..."
    vessel_match = re.search(r'Vessel.*?\((\d+)\)', col_content)
    jungle_match = re.search(r'Jungle.*?\((\d+)\)', col_content)
    plain_ap_match = re.search(r'\((\d+)\)', col_content) if has_make_icon else None

    if has_make_icon and (vessel_match or jungle_match or plain_ap_match):
        # This is a recipe
        ap_match = vessel_match or jungle_match or plain_ap_match
        if ap_match:
            result['ap'] = int(ap_match.group(1))

        # Extract ingredient links: pattern is "QTY <a href="...">Name (#ID)</a>"
        ingredient_pattern = re.findall(
            r'(\d+)\s*<a\s+href="([^"]+)">\s*(.*?)\s*</a>',
            col_content
        )
        for qty, url, name in ingredient_pattern:
            # Clean up name - remove item number like (#16)
            clean_name = re.sub(r'\s*\(#\d+\)', '', name).strip()
            if clean_name and url.startswith('../Blurbs/'):
                result['recipe'].append({
                    'name': clean_name,
                    'url': url,
                    'qty': int(qty),
                })

        # Also look for non-qty creature ingredients (qty=1 implied)
        # e.g., <a href="../Blurbs/ReptronBird.html">Reptron Bird (#122)</a>
        all_links = re.findall(
            r'<a\s+href="(../Blurbs/[^"]+)">\s*(.*?)\s*</a>',
            col_content
        )
        for url, name in all_links:
            clean_name = re.sub(r'\s*\(#\d+\)', '', name).strip()
            # Skip if already added as ingredient
            existing_urls = [r['url'] for r in result['recipe']]
            if url not in existing_urls and clean_name:
                result['recipe'].append({
                    'name': clean_name,
                    'url': url,
                    'qty': 1,
                })
    else:
        # This is a source (creature/plant)
        src_links = re.findall(
            r'<a\s+href="(../Blurbs/[^"]+)">\s*(.*?)\s*</a>',
            col_content
        )
        if not src_links:
            # Try Items links as source
            src_links = re.findall(
                r'<a\s+href="(../Items/[^"]+)">\s*(.*?)\s*</a>',
                col_content
            )
        for url, name in src_links:
            clean_name = re.sub(r'\s*\(#\d+\)', '', name).strip()
            if clean_name and 'Make.png' not in name and 'img' not in name.lower():
                result['src'].append({
                    'name': clean_name,
                    'url': url,
                })


def _parse_make_links(cell_content, result):
    """Parse cell for 'ingredient for' (make) links."""
    # Extract links to other items this is an ingredient for
    # Usually marked with Make.png, but we just extract links from the Type column
    make_links = re.findall(
        r'<a\s+href="(../Blurbs/[^"]+)">\s*(.*?)\s*</a>',
        cell_content
    )
    for url, name in make_links:
        clean_name = re.sub(r'\s*\(#\d+\)', '', name).strip()
        if clean_name:
            result['make'].append({
                'name': clean_name,
                'url': url,
            })


def generate_front_matter(data):
    """Generate Jekyll front matter YAML from parsed data."""
    lines = [
        '---',
        'layout: items',
        f'item_name: {data["item_name"]}',
        f'item_id: {data["item_id"]}',
    ]

    if data['src']:
        lines.append('src:')
        for s in data['src']:
            lines.append(f'  - name: "{s["name"]}"')
            lines.append(f'    url: "{s["url"]}"')

    if data['make']:
        lines.append('make:')
        for m in sorted(data['make'], key=lambda x: x['name']):
            lines.append(f'  - name: "{m["name"]}"')
            lines.append(f'    url: "{m["url"]}"')

    if data['recipe']:
        lines.append('recipe:')
        for r in sorted(data['recipe'], key=lambda x: x['name']):
            lines.append(f'  - name: "{r["name"]}"')
            lines.append(f'    url: "{r["url"]}"')
            lines.append(f'    qty: {r["qty"]}')

    if data['ap']:
        lines.append(f'ap: {data["ap"]}')

    lines.append('---')
    return '\n'.join(lines)


def generate_output(data):
    """Generate the full converted file content."""
    front_matter = generate_front_matter(data)

    blurb = data.get('blurb', '')
    if blurb:
        body = f'\n<p>\n\t{blurb}\n</p>\n'
    else:
        body = '\n'

    return front_matter + body


def convert_file(filepath, dry_run=False):
    """Convert a single file. Returns True if converted, False if skipped."""
    basename = os.path.basename(filepath)

    if skip_file(filepath):
        print(f"SKIP (index page): {basename}")
        return False

    if is_already_converted(filepath):
        print(f"SKIP (already converted): {basename}")
        return False

    print(f"Converting: {basename}")
    data = parse_html(filepath)

    if not data['item_name']:
        print(f"  ERROR: Could not extract item_name from {basename}")
        return False

    if data['item_id'] is None:
        print(f"  ERROR: Could not extract item_id from {basename}")
        return False

    output = generate_output(data)

    # Report what was found
    parts = []
    if data['src']:
        parts.append(f"src: {', '.join(s['name'] for s in data['src'])}")
    if data['make']:
        parts.append(f"make: {', '.join(m['name'] for m in data['make'])}")
    if data['recipe']:
        parts.append(f"recipe: {', '.join(r['name'] for r in data['recipe'])}")
    if data['ap']:
        parts.append(f"ap: {data['ap']}")

    info = f"  id={data['item_id']}"
    if parts:
        info += f" | {' | '.join(parts)}"
    print(info)

    if dry_run:
        print("  --- DRY RUN OUTPUT ---")
        print(output)
        print("  --- END ---")
    else:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"  Written: {basename}")

    return True


def main():
    parser = argparse.ArgumentParser(description='Convert old Blurbs HTML to Jekyll front matter')
    parser.add_argument('files', nargs='*', help='HTML files to convert')
    parser.add_argument('--file', type=str, help='Text file containing list of HTML files to convert (one per line)')
    parser.add_argument('--dry-run', action='store_true', help='Preview output without writing')
    args = parser.parse_args()

    if args.file:
        # Reading filenames from a text file (e.g., python convert_blurbs.py --file list.txt)
        with open(args.file, 'r', encoding='utf-8') as flist:
            files = [line.strip() for line in flist if line.strip()]
    elif args.files:
        files = args.files
    else:
        parser.print_help()
        sys.exit(1)

    # Resolve the Blurbs directory relative to this script's location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    blurbs_dir = os.path.normpath(os.path.join(script_dir, '..', 'Blurbs'))

    # Resolve each filename relative to the Blurbs directory
    resolved_files = []
    for f in files:
        if os.path.isabs(f) or os.path.dirname(f):
            resolved_files.append(f)
        else:
            resolved_files.append(os.path.join(blurbs_dir, f))

    converted = 0
    skipped = 0
    errors = 0

    for f in resolved_files:
        if not os.path.isfile(f):
            print(f"ERROR: File not found: {f}")
            errors += 1
            continue
        try:
            if convert_file(f, dry_run=args.dry_run):
                converted += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"ERROR converting {f}: {e}")
            errors += 1

    print(f"\nDone. Converted: {converted}, Skipped: {skipped}, Errors: {errors}")


if __name__ == '__main__':
    main()
