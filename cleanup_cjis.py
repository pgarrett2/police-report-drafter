import json

titles_to_remove = {
    "City Warrant",
    "City Warrant (PR Bond)",
    "County Warrant",
    "Violation of Probation Warrant",
    "Violation of Parole Warrant",
    "Emergency Detention",
    "Mental Health Crisis",
    "Information Only",
    "CPS Intake",
    "APS Intake",
    "Welfare Concern"
}

file_path = 'c:\\Users\\pgarr\\Desktop\\police-report-drafter\\cjis_codes.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Remove the Title Case entries
data = [item for item in data if item['literal'] not in titles_to_remove]

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

print("Successfully cleaned up Title Case entries from cjis_codes.json and cjis_codes.ts")
