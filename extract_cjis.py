import pdfplumber
import json

data = []
with pdfplumber.open("Texas CJIS code v20.pdf") as pdf:
    for page in pdf.pages:
        table = page.extract_table()
        if table:
            headers = table[0]
            # Check if this page has the same headers or if it's just data
            start_row = 1 if headers == ['Code', 'Literal', 'Citation', 'Statute', 'L/D'] else 0
            for row in table[start_row:]:
                if len(row) == 5:
                    # Map to the fields requested: Literal, Citation, Statute, L/D
                    # row format: [Code, Literal, Citation, Statute, L/D]
                    entry = {
                        "literal": row[1],
                        "citation": row[2],
                        "statute": row[3],
                        "level": row[4]
                    }
                    # Basic validation to avoid empty rows
                    if any(entry.values()):
                        data.append(entry)

# Save to json
with open("cjis_codes.json", "w") as f:
    json.dump(data, f, indent=2)

print(f"Extracted {len(data)} records.")
