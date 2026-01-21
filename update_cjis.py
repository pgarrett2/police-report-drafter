import json

new_offenses = [
    "CITY WARRANT",
    "CITY WARRANT (PR BOND)",
    "COUNTY WARRANT",
    "VIOLATION OF PROBATION WARRANT",
    "VIOLATION OF PAROLE WARRANT",
    "EMERGENCY DETENTION",
    "MENTAL HEALTH CRISIS",
    "INFORMATION ONLY",
    "CPS INTAKE",
    "APS INTAKE",
    "WELFARE CONCERN"
]

file_path = 'c:\\Users\\pgarr\\Desktop\\police-report-drafter\\cjis_codes.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Create new entries
new_entries = []
for title in new_offenses:
    new_entries.append({
        "literal": title,
        "citation": "",
        "statute": "",
        "level": ""
    })

# Add to data (avoid duplicates if I run it again)
existing_literals = {item['literal'] for item in data}
for entry in new_entries:
    if entry['literal'] not in existing_literals:
        data.append(entry)

# Sort by literal
data.sort(key=lambda x: x['literal'])

# Write back to JSON
with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

# Update TS file
ts_file_path = 'c:\\Users\\pgarr\\Desktop\\police-report-drafter\\cjis_codes.ts'
with open(ts_file_path, 'w', encoding='utf-8') as f:
    f.write('import { Offense } from "./types";\n\n')
    f.write('export const CJIS_CODES: Offense[] = ')
    json.dump(data, f, indent=2)
    f.write(';\n')

print("Successfully updated cjis_codes.json and cjis_codes.ts with ALL CAPS entries")
