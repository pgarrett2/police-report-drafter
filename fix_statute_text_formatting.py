#!/usr/bin/env python3
"""
Fix the spacing for each "statuteText" field in cjis_codes.json and cjis_codes.ts
by adding newlines between sections and removing the "Acts" portions.
"""

import json
import re

def fix_statute_text(text):
    """
    Fix the formatting of statute text by:
    1. Removing the "Acts" portions at the end
    2. Adding newlines between major sections
    """
    if not text or not text.strip():
        return text
    
    # Remove the "Acts" portions - these typically start with patterns like:
    # - "\nActs 1973, 63rd Leg..."
    # - "\nAdded by Acts..."
    # - "\nAmended by Acts..."
    # - "Acts 1973, 63rd Leg..." (at the start of a line or after newline)
    
    # First, remove anything starting with "\nActs" or "\nAdded by" or "\nAmended by"
    text = re.sub(r'\n(?:Added by |Amended by: |)Acts \d{4}.*$', '', text, flags=re.DOTALL)
    
    # Also remove if it starts directly with "Acts" after subsection ends
    text = re.sub(r'(?<=\.) ?(?:Added by |Amended by: |)Acts \d{4}.*$', '', text, flags=re.DOTALL)
    
    # Add newlines before major section markers like (a), (b), (c), etc.
    # But only when they appear after a period or closing parenthesis
    text = re.sub(r'(\.) (\([a-z]\))', r'\1\n\2', text)
    
    # Add newlines before subsection markers like (1), (2), (3), etc. that follow a colon or period
    text = re.sub(r'(:) (\(\d+\))', r'\1\n\2', text)
    
    # Add newlines before definition markers like (A), (B), (C), etc. that follow certain patterns
    text = re.sub(r'([:;]) (\([A-Z]\))', r'\1\n\2', text)
    
    # Also handle lowercase markers (i), (ii), (iii), etc.
    text = re.sub(r'([:;]) (\([ivx]+\))', r'\1\n\2', text)
    
    # Clean up any trailing whitespace
    text = text.strip()
    
    return text

def main():
    # Load the JSON file
    with open('cjis_codes.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Count how many were updated
    updated_count = 0
    
    # Process each entry
    for entry in data:
        if 'statuteText' in entry and entry['statuteText']:
            original = entry['statuteText']
            fixed = fix_statute_text(original)
            if fixed != original:
                entry['statuteText'] = fixed
                updated_count += 1
    
    # Save the updated JSON file
    with open('cjis_codes.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {updated_count} statuteText entries in cjis_codes.json")
    
    # Now update the TypeScript file
    # Read the TypeScript file
    with open('cjis_codes.ts', 'r', encoding='utf-8') as f:
        ts_content = f.read()
    
    # The TypeScript file has the same data, so we need to regenerate it
    # Extract any header content before the data
    header_match = re.match(r'^(.*?export\s+const\s+CJIS_CODES\s*=\s*)', ts_content, re.DOTALL)
    if header_match:
        header = header_match.group(1)
    else:
        header = 'export const CJIS_CODES = '
    
    # Generate the TypeScript content
    json_str = json.dumps(data, indent=2, ensure_ascii=False)
    ts_content = f"{header}{json_str};\n"
    
    with open('cjis_codes.ts', 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    print(f"Updated cjis_codes.ts with the same formatting changes")
    
    # Show a sample of the changes
    print("\n--- Sample of changes (first entry with non-empty statuteText) ---")
    for entry in data:
        if entry.get('statuteText'):
            print(f"Literal: {entry.get('literal', 'N/A')}")
            print(f"StatuteText (first 500 chars):\n{entry['statuteText'][:500]}...")
            break

if __name__ == '__main__':
    main()
