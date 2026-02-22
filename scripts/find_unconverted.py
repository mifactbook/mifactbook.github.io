#!/usr/bin/env python3
"""
Find all unconverted HTML files in the Blurbs directory.
An unconverted file is defined as one that does not begin with Jekyll front matter ('---').
Outputs the list of unconverted files to 'unconverted_blurbs.txt' in the project root.
"""

import os
import glob

def get_first_line(filepath):
    """Read the first line of a file with encoding fallback (UTF-8 -> latin-1)."""
    for enc in ('utf-8', 'latin-1'):
        try:
            with open(filepath, 'r', encoding=enc) as f:
                return f.readline().strip()
        except UnicodeDecodeError:
            continue
    return ""

def main():
    # Resolve paths relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    blurbs_dir = os.path.join(project_root, 'Locations')
    output_file = os.path.join(project_root, 'unconverted_Loc.txt')

    if not os.path.exists(blurbs_dir):
        print(f"Error: Blurbs directory not found at {blurbs_dir}")
        return

    unconverted = []

    # Search for all HTML files in the Blurbs directory recursively
    search_pattern = os.path.join(blurbs_dir, '**', '*.html')
    html_files = glob.glob(search_pattern, recursive=True)

    for filepath in html_files:
        if not os.path.isfile(filepath):
            continue

        rel_path = os.path.relpath(filepath, blurbs_dir)

        # Skip the unused directory
        path_parts = rel_path.replace('\\', '/').split('/')
        if 'unused' in path_parts:
            continue

        first_line = get_first_line(filepath)

        # If it doesn't start with '---', it hasn't been converted to Jekyll format yet
        if first_line != '---':
            unconverted.append(rel_path)

    # Write the results to the output file
    with open(output_file, 'w', encoding='utf-8') as f:
        for item in sorted(unconverted):
            f.write(f"{item}\n")

    print(f"Found {len(unconverted)} unconverted HTML files in the Blurbs directory.")
    print(f"Output written to: {output_file}")

if __name__ == '__main__':
    main()
