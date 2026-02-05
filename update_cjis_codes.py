import json
import pandas as pd
import re

def update_cjis_files():
    # Load the Excel data from the PC sheet
    print("Loading offense_codes_updated.xlsx...")
    df = pd.read_excel('offense_codes_updated.xlsx', sheet_name='PC')
    
    # Create lookup by literal
    excel_data = {}
    for _, row in df.iterrows():
        literal = str(row.get('literal', '')).strip()
        if literal:
            excel_data[literal] = {
                'citation': str(row.get('citation', '')) if pd.notna(row.get('citation')) else '',
                'statute': str(row.get('statute', '')) if pd.notna(row.get('statute')) else '',
                'level': str(row.get('level', '')) if pd.notna(row.get('level')) else '',
                'statuteText': str(row.get('statuteText', '')) if pd.notna(row.get('statuteText')) else ''
            }
    
    print(f"Loaded {len(excel_data)} offense records from Excel.")
    
    # Load the existing cjis_codes.json
    print("Loading cjis_codes.json...")
    with open('cjis_codes.json', 'r', encoding='utf-8') as f:
        cjis_codes = json.load(f)
    
    print(f"Loaded {len(cjis_codes)} codes from cjis_codes.json.")
    
    # Update matching entries
    updated_count = 0
    not_found = 0
    
    for code in cjis_codes:
        literal = code.get('literal', '').strip()
        if literal in excel_data:
            excel_entry = excel_data[literal]
            # Only update if the source has data
            if excel_entry['citation']:
                code['citation'] = excel_entry['citation']
            if excel_entry['statute']:
                code['statute'] = excel_entry['statute']
            if excel_entry['level']:
                code['level'] = excel_entry['level']
            if excel_entry['statuteText']:
                code['statuteText'] = excel_entry['statuteText']
            updated_count += 1
        else:
            not_found += 1
    
    print(f"Updated {updated_count} codes, {not_found} codes not found in Excel.")
    
    # Save the updated JSON
    print("Saving updated cjis_codes.json...")
    with open('cjis_codes.json', 'w', encoding='utf-8') as f:
        json.dump(cjis_codes, f, indent=2, ensure_ascii=False)
    
    # Generate the TypeScript file
    print("Generating cjis_codes.ts...")
    ts_content = "export interface CJISCode {\n"
    ts_content += "  literal: string;\n"
    ts_content += "  citation: string;\n"
    ts_content += "  statute: string;\n"
    ts_content += "  level: string;\n"
    ts_content += "  elements: string;\n"
    ts_content += "  statuteText: string;\n"
    ts_content += "}\n\n"
    ts_content += "export const cjisCodes: CJISCode[] = "
    ts_content += json.dumps(cjis_codes, indent=2, ensure_ascii=False)
    ts_content += ";\n"
    
    with open('cjis_codes.ts', 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    print("Done! Updated cjis_codes.json and cjis_codes.ts")

if __name__ == "__main__":
    update_cjis_files()
