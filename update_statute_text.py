import os
import re
import pandas as pd
from bs4 import BeautifulSoup

def clean_html_text(html_content):
    if not html_content: return ""
    soup = BeautifulSoup(html_content, 'html.parser')
    text = soup.get_text(separator=' ')
    lines = [line.strip() for line in text.split('\n')]
    cleaned = '\n'.join([line for line in lines if line])
    cleaned = re.sub(r' +', ' ', cleaned)
    return cleaned

def extract_sections_from_html(html_dir):
    sections = {}
    # Only match TRUE statute sections like 39.02, 22.041, etc.
    # NOT internal reference IDs like 62261.53562 (5+ digit prefix)
    # Statute format: 1-3 digit chapter, dot, 1-4 digit section (e.g., 39.02, 22.041)
    statute_pattern = re.compile(r'<a name="(\d{1,3}\.\d{1,4})">', re.IGNORECASE)

    files = [f for f in os.listdir(html_dir) if f.endswith('.htm')]
    print(f"Processing {len(files)} HTML files...")

    for filename in files:
        with open(os.path.join(html_dir, filename), 'r', encoding='utf-8') as f:
            content = f.read()
            
            matches = list(statute_pattern.finditer(content))
            
            for i, m in enumerate(matches):
                section_num = m.group(1)
                start_pos = m.start()
                
                # End at the next TRUE statute anchor with a DIFFERENT section number
                end_pos = -1
                for j in range(i + 1, len(matches)):
                    if matches[j].group(1) != section_num:
                        end_pos = matches[j].start()
                        break
                
                if end_pos == -1:
                    end_pos = content.find('</pre>', start_pos)
                    if end_pos == -1: end_pos = content.find('</body>', start_pos)
                    if end_pos == -1: end_pos = len(content)
                
                raw_section = content[start_pos:end_pos]
                cleaned = clean_html_text(raw_section)
                
                if section_num not in sections or len(cleaned) > len(sections[section_num]):
                    sections[section_num] = cleaned
                    
    return sections

def update_excel_statutes(excel_path, output_path, sections_data):
    print(f"Loading {excel_path}...")
    excel_file = pd.ExcelFile(excel_path)
    sheet_names = excel_file.sheet_names
    dfs = {name: excel_file.parse(name) for name in sheet_names}
    
    if 'PC' not in dfs:
        print("Error: 'PC' sheet not found.")
        return

    df_pc = dfs['PC']
    matches_found = 0
    missing_sections = set()

    def get_section_text(citation):
        nonlocal matches_found
        if pd.isna(citation): return ""
        match = re.search(r'(\d{1,3}\.\d{1,4})', str(citation).strip())
        if match:
            section_num = match.group(1)
            if section_num in sections_data:
                text = sections_data[section_num]
                if text:
                    matches_found += 1
                    return text
            else:
                missing_sections.add(section_num)
        return ""

    df_pc['statuteText'] = df_pc['citation'].apply(get_section_text)
    print(f"Update applied: {matches_found} rows updated.")
    if missing_sections:
        print(f"Missing sections: {sorted(list(missing_sections))[:10]}... (total: {len(missing_sections)})")
    
    print(f"Saving to {output_path}...")
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        for name, df in dfs.items():
            df.to_excel(writer, sheet_name=name, index=False)
    print(f"Successfully saved to {output_path}.")

if __name__ == "__main__":
    sections = extract_sections_from_html('PE.htm')
    print(f"Extracted {len(sections)} sections.")
    if "39.02" in sections:
        print(f"DEBUG: 39.02 found, length {len(sections['39.02'])}")
        print(f"DEBUG: Sample: {sections['39.02'][:150]}...")
    else:
        print("DEBUG: 39.02 NOT FOUND")
        
    update_excel_statutes('offense_codes.xlsx', 'offense_codes_updated.xlsx', sections)
