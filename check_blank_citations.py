import pandas as pd

def check_blank_citations():
    file_path = r'c:\Users\pgarr\Desktop\OFFENSE_CODES\offense_codes.xlsx'
    print(f"Loading sheets from {file_path}...")
    
    # Load ALL_OFFENSES to get unique statutes
    df_all = pd.read_excel(file_path, sheet_name='ALL_OFFENSES')
    statutes = sorted([str(s) for s in df_all['statute'].dropna().unique() if len(str(s)) > 1], key=len, reverse=True)
    print(f"Statutes to check: {statutes}")
    
    # Load BLANK sheet
    df_blank = pd.read_excel(file_path, sheet_name='BLANK')
    print(f"Checking {len(df_blank)} rows in BLANK sheet...")
    
    matches = []
    for index, row in df_blank.iterrows():
        citation = str(row['citation']).strip()
        for s in statutes:
            if citation.startswith(s):
                matches.append({
                    'row_in_sheet': index + 2, # +1 for 0-index, +1 for header
                    'literal': row['literal'],
                    'citation': citation,
                    'matching_statute': s
                })
                break # Found the longest match
                
    if matches:
        print("\nMatches found in BLANK sheet:")
        for m in matches:
            print(f"Row {m['row_in_sheet']}: Citation '{m['citation']}' starts with statute '{m['matching_statute']}' (Literal: {m['literal']})")
        print(f"\nTotal matches: {len(matches)}")
    else:
        print("\nNo citations in the BLANK sheet start with known statute names.")

if __name__ == "__main__":
    check_blank_citations()
