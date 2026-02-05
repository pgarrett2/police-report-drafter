import json
import pandas as pd
import os

def update_tc_cjis_codes():
    excel_file = 'offense_codes_updated.xlsx'
    json_file = 'cjis_codes.json'
    ts_file = 'cjis_codes.ts'

    print(f"Loading {excel_file} (TC sheet)...")
    df = pd.read_excel(excel_file, sheet_name='TC')
    
    # Create lookup by literal
    # Column A: literal, B: citation, E: elements, F: statuteText
    excel_data = {}
    for _, row in df.iterrows():
        literal = str(row.get('literal', '')).strip()
        if literal:
            excel_data[literal] = {
                'citation': str(row.get('citation', '')) if pd.notna(row.get('citation')) else '',
                'elements': str(row.get('elements', '')) if pd.notna(row.get('elements')) else '',
                'statuteText': str(row.get('statuteText', '')) if pd.notna(row.get('statuteText')) else ''
            }
    
    print(f"Loaded {len(excel_data)} TC records from Excel.")
    
    # Load the existing cjis_codes.json
    print(f"Loading {json_file}...")
    with open(json_file, 'r', encoding='utf-8') as f:
        cjis_codes = json.load(f)
    
    print(f"Loaded {len(cjis_codes)} total codes from JSON.")
    
    # Update TC entries
    updated_count = 0
    not_found = 0
    
    for code in cjis_codes:
        # Only focus on TC statutes
        if code.get('statute') == 'TC':
            literal = code.get('literal', '').strip()
            if literal in excel_data:
                excel_entry = excel_data[literal]
                
                # Update fields as requested
                if excel_entry['citation']:
                    code['citation'] = excel_entry['citation']
                
                # Always update elements and statuteText if they exist in Excel
                # (even if they are empty strings, though we checked pd.notna)
                if excel_entry['elements']:
                    code['elements'] = excel_entry['elements']
                
                if excel_entry['statuteText']:
                    code['statuteText'] = excel_entry['statuteText']
                
                updated_count += 1
            else:
                not_found += 1
    
    print(f"Updated {updated_count} TC codes.")
    if not_found > 0:
        print(f"Note: {not_found} TC codes in JSON were not found matching by literal in Excel.")
    
    # Save the updated JSON
    print(f"Saving updated {json_file}...")
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(cjis_codes, f, indent=2, ensure_ascii=False)
    
    # Generate the TypeScript file
    print(f"Generating {ts_file}...")
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
    
    with open(ts_file, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    print("Done! Synchronization complete.")

if __name__ == "__main__":
    update_tc_cjis_codes()
