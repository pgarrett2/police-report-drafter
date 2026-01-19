import json

with open("cjis_codes.json", "r") as f:
    data = json.load(f)

# Sort by literal
data.sort(key=lambda x: x['literal'])

content = "import { Offense } from './types';\n\n"
content += "export const CJIS_CODES: Offense[] = "
content += json.dumps(data, indent=2)
content += ";\n"

with open("cjis_codes.ts", "w") as f:
    f.write(content)

print("Generated cjis_codes.ts with all records.")
