#!/usr/bin/env python3
"""
Converts creature blurb HTML files to use the Jekyll creatures.html layout.

Usage:
    python convert_creature_blurbs.py -file filelist.txt

Where filelist.txt contains one filename per line (relative to Blurbs/ or absolute paths).
"""

import argparse
import re
import os
import sys
from html.parser import HTMLParser


class BlurbHTMLParser(HTMLParser):
    """Extracts creature data from old-format blurb HTML files."""

    def __init__(self):
        super().__init__()
        self.title = ""
        self.mob_id = ""
        self.items = []       # list of dicts: {name, url} or {name}
        self.locations = []   # list of dicts: {name, url}
        self.blurb_html = ""

        # Internal state tracking
        self._in_title = False
        self._in_data_row = False
        self._in_blurb_div = False
        self._in_found_in = False
        self._in_found_in_table = False
        self._in_loc_icon_th = False
        self._data_row_col = 0
        self._current_item_html = ""
        self._blurb_depth = 0
        self._found_header_row = False
        self._found_in_row_index = 0

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == "title":
            self._in_title = True

        # Detect the header row with Ver, No, Name, etc.
        if tag == "tr" and self._found_header_row:
            self._in_data_row = True
            self._data_row_col = 0

        # Count columns in data row (both th and td)
        if self._in_data_row and tag in ("th", "td"):
            self._data_row_col += 1

        # Track item column HTML (column 9)
        if self._in_data_row and self._data_row_col == 9 and tag == "td":
            self._current_item_html = ""

        # Detect blurb div
        if tag == "div" and attrs_dict.get("class") == "blurbs":
            self._in_blurb_div = True
            self._blurb_depth = 0
            return

        if self._in_blurb_div:
            if tag == "div":
                self._blurb_depth += 1
            # Reconstruct inner HTML tags
            attr_str = ""
            for k, v in attrs:
                if v is not None:
                    attr_str += f' {k}="{v}"'
                else:
                    attr_str += f' {k}'
            self.blurb_html += f"<{tag}{attr_str}>"

        # Detect "Found In" section
        if tag == "h3":
            self._check_next_for_found_in = True

        if self._in_found_in and tag == "table":
            self._in_found_in_table = True
            self._found_in_row_index = 0

        if self._in_found_in_table and tag == "tr":
            self._found_in_row_index += 1

        # Location rows have <th class="icon"> with links
        if self._in_found_in_table and tag == "th" and attrs_dict.get("class") == "icon":
            self._in_loc_icon_th = True
            self._current_loc_url = ""
            self._current_loc_name = ""
            self._loc_link_count = 0

        if self._in_loc_icon_th and tag == "a":
            self._current_loc_url = attrs_dict.get("href", "")
            self._loc_link_count += 1

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

        if self._in_blurb_div:
            if tag == "div" and self._blurb_depth == 0:
                self._in_blurb_div = False
            else:
                if tag == "div":
                    self._blurb_depth -= 1
                self.blurb_html += f"</{tag}>"

        if self._in_data_row and tag == "tr":
            self._in_data_row = False
            self._found_header_row = False

        if self._in_loc_icon_th and tag == "th":
            self._in_loc_icon_th = False
            if self._current_loc_name and self._current_loc_url:
                self.locations.append({
                    "name": self._current_loc_name.strip(),
                    "url": self._current_loc_url
                })

        if self._in_found_in_table and tag == "table":
            self._in_found_in_table = False
            self._in_found_in = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data

        # Detect header row
        if data.strip() == "Ver":
            self._found_header_row = True

        # Extract mob_id from No column (column 2 in data row)
        if self._in_data_row and self._data_row_col == 2:
            stripped = data.strip()
            if stripped and stripped != "&nbsp;":
                self.mob_id = stripped

        # Collect item column raw HTML/text
        if self._in_data_row and self._data_row_col == 9:
            self._current_item_html += data

        if self._in_blurb_div:
            self.blurb_html += data

        # Check for "Found In" heading
        if hasattr(self, '_check_next_for_found_in') and self._check_next_for_found_in:
            if "Found In" in data:
                self._in_found_in = True
            self._check_next_for_found_in = False

        # Capture location name (second <a> text in icon <th>)
        if self._in_loc_icon_th and self._loc_link_count == 2:
            self._current_loc_name += data

    def handle_entityref(self, name):
        entity = f"&{name};"
        if self._in_blurb_div:
            self.blurb_html += entity
        if self._in_data_row and self._data_row_col == 9:
            self._current_item_html += entity

    def handle_charref(self, name):
        ref = f"&#{name};"
        if self._in_blurb_div:
            self.blurb_html += ref
        if self._in_data_row and self._data_row_col == 9:
            self._current_item_html += ref


def parse_items_from_html(item_cell_html):
    """
    Parse the raw Item column content to extract individual items.
    Returns a list of dicts with 'name' and optionally 'url'.
    Ignores 'Food' items.
    Ensures a space before '(' in item names.
    """
    if not item_cell_html or item_cell_html.strip() in ("", "&nbsp;"):
        return []

    # Use a sub-parser to extract <a> tags from the item cell
    class ItemCellParser(HTMLParser):
        def __init__(self):
            super().__init__()
            self.items_raw = []   # (url, name_text)
            self._in_a = False
            self._current_url = ""
            self._current_text = ""
            self.plain_text = ""
            self._a_positions = []  # (start, end) positions relative to plain_text

        def handle_starttag(self, tag, attrs):
            if tag == "a":
                self._in_a = True
                self._current_url = dict(attrs).get("href", "")
                self._current_text = ""

        def handle_endtag(self, tag):
            if tag == "a" and self._in_a:
                self._in_a = False
                self.items_raw.append((self._current_url, self._current_text))

        def handle_data(self, data):
            if self._in_a:
                self._current_text += data
            self.plain_text += data

        def handle_entityref(self, name):
            entity = f"&{name};"
            if self._in_a:
                self._current_text += entity
            self.plain_text += entity

    cell_parser = ItemCellParser()
    cell_parser.feed(item_cell_html)

    items = []

    if cell_parser.items_raw:
        # We have linked items
        for url, name in cell_parser.items_raw:
            name = name.strip()
            if not name:
                continue
            # Skip food items
            if "Food" in name:
                continue
            # Ensure space before '('
            name = re.sub(r'(\S)\(', r'\1 (', name)
            items.append({"name": name, "url": url})

    # Also check for non-linked items in plain text (e.g., "1 Food (#99)")
    # These are items that appear as plain text without <a> tags
    # We already handle linked items above, so we skip this for linked content.
    # For plain text items that aren't linked and aren't food:
    plain = cell_parser.plain_text.strip()
    if plain and not cell_parser.items_raw:
        # All items are plain text, split by common patterns
        # e.g., "0-3 Guano Plasm(#144) 1 Food (#99)"
        parts = re.split(r'\d+-?\d*\s+', plain)
        for part in parts:
            part = part.strip()
            if not part or "Food" in part:
                continue
            part = re.sub(r'(\S)\(', r'\1 (', part)
            items.append({"name": part})

    return items


def convert_file(filepath):
    """Convert a single HTML blurb file to Jekyll creatures template format."""
    if not os.path.exists(filepath):
        print(f"WARNING: File not found: {filepath}", file=sys.stderr)
        return False

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='latin-1') as f:
            content = f.read()

    # Skip files already converted (have Jekyll front matter)
    if content.strip().startswith("---"):
        print(f"SKIPPING (already converted): {filepath}")
        return False

    parser = BlurbHTMLParser()
    parser.feed(content)

    # Also extract item HTML from the data row for parsing
    # Re-parse just the item cell - we need to find it from raw HTML
    item_html = extract_item_cell_html(content)
    items = parse_items_from_html(item_html)

    title = parser.title.strip()
    mob_id = parser.mob_id.strip()
    blurb = parser.blurb_html.strip()
    locations = parser.locations

    if not title:
        print(f"WARNING: Could not extract title from {filepath}", file=sys.stderr)
        return False

    if not mob_id:
        print(f"WARNING: Could not extract mob_id from {filepath}", file=sys.stderr)
        return False

    # Build YAML front matter
    lines = []
    lines.append("---")
    lines.append("layout: creatures")
    lines.append(f"title: {title}")
    lines.append(f"mob_id: {mob_id}")

    if items:
        items.sort(key=lambda x: x["name"].lower())
        lines.append("item:")
        for item in items:
            lines.append(f'  - name: "{item["name"]}"')
            if "url" in item:
                lines.append(f'    url: "{item["url"]}"')

    if locations:
        locations.sort(key=lambda x: x["name"].lower())
        lines.append("loc:")
        for loc in locations:
            lines.append(f'  - name: "{loc["name"]}"')
            lines.append(f'    url: "{loc["url"]}"')

    lines.append("---")
    lines.append("")

    # Format blurb content as <p> with indented lines
    # Split blurb into sentences for wrapping
    blurb_lines = format_blurb(blurb)
    lines.append("<p>")
    for bl in blurb_lines:
        lines.append(f"\t{bl}")
    lines.append("</p>")
    lines.append("")

    output = "\n".join(lines)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(output)

    print(f"CONVERTED: {filepath}")
    return True


def extract_item_cell_html(html_content):
    """
    Extract the raw HTML content of the Item column (9th column) from the data row.
    """
    # Find the data row - it's the <tr> after the header row containing Ver, No, Name...
    # The header row pattern
    header_pattern = r'<tr>\s*<th>Ver</th>'
    header_match = re.search(header_pattern, html_content, re.IGNORECASE)
    if not header_match:
        return ""

    # Find the next <tr> after the header
    after_header = html_content[header_match.end():]
    # Skip past end of header row
    header_end = after_header.find("</tr>")
    if header_end == -1:
        return ""

    remaining = after_header[header_end + 5:]
    # Find the data row
    data_row_match = re.search(r'<tr>(.*?)</tr>', remaining, re.DOTALL)
    if not data_row_match:
        return ""

    data_row = data_row_match.group(1)

    # Split into cells (both <th> and <td>)
    cells = re.findall(r'<(?:th|td)[^>]*>(.*?)</(?:th|td)>', data_row, re.DOTALL)

    # Item is the 9th column (index 8)
    if len(cells) >= 9:
        return cells[8]

    return ""


def format_blurb(blurb_html):
    """
    Format blurb HTML into multiple lines, roughly splitting by sentences.
    Returns a list of line strings.
    """
    # Clean up whitespace
    blurb_html = re.sub(r'\s+', ' ', blurb_html).strip()

    if not blurb_html:
        return [""]

    # Split on sentence boundaries (period followed by space and uppercase letter)
    # but keep the HTML tags intact
    sentences = re.split(r'(?<=\.)\s+(?=[A-Z])', blurb_html)

    # Group sentences into lines (roughly 1-2 sentences per line)
    lines = []
    current = ""
    for s in sentences:
        if current and len(current) + len(s) > 150:
            lines.append(current.strip())
            current = s
        else:
            if current:
                current += " " + s
            else:
                current = s

    if current:
        lines.append(current.strip())

    return lines if lines else [blurb_html]


def main():
    parser = argparse.ArgumentParser(
        description="Convert creature blurb HTML files to Jekyll creatures template."
    )
    parser.add_argument(
        "-file",
        required=True,
        help="Path to a text file containing one filename per line to convert."
    )
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"ERROR: File list not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    with open(args.file, 'r', encoding='utf-8') as f:
        file_list = [line.strip() for line in f if line.strip() and not line.startswith('#')]

    # Determine base directory (assume script is run from project root or Blurbs/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    blurbs_dir = os.path.join(project_root, "Blurbs")

    converted = 0
    skipped = 0
    errors = 0

    for filename in file_list:
        # Resolve the filepath
        if os.path.isabs(filename):
            filepath = filename
        elif os.path.exists(filename):
            filepath = filename
        elif os.path.exists(os.path.join(blurbs_dir, filename)):
            filepath = os.path.join(blurbs_dir, filename)
        else:
            print(f"WARNING: Cannot find file: {filename}", file=sys.stderr)
            errors += 1
            continue

        result = convert_file(filepath)
        if result:
            converted += 1
        else:
            skipped += 1

    print(f"\nDone. Converted: {converted}, Skipped: {skipped}, Errors: {errors}")


if __name__ == "__main__":
    main()
