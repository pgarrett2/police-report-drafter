import json
import os

def clear_misc_fields():
    json_file = 'cjis_codes.json'
    ts_file = 'cjis_codes.ts'

    if not os.path.exists(json_file):
        print(f"Error: {json_file} not found.")
        return

    # 1. Load existing JSON data
    print(f"Loading {json_file}...")
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 2. Iterate and clear fields where citation contains 'MISC'
    updated_count = 0
    for o in data:
        citation = str(o.get('citation', '')).upper()
        if 'MISC' in citation:
            o['citation'] = ""
            o['statute'] = ""
            o['level'] = ""
            updated_count += 1

    print(f"Cleared fields for {updated_count} offenses with 'MISC' in citation.")

    # 3. Save back to JSON
    print(f"Saving to {json_file}...")
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    # 4. Save back to TS
    print(f"Saving to {ts_file}...")
    with open(ts_file, 'w', encoding='utf-8') as f:
        f.write('import { Offense } from "./types";\n\n')
        f.write('export const CJIS_CODES: Offense[] = ')
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write(';\n')

    print("Update complete!")

if __name__ == "__main__":
    clear_misc_fields()
