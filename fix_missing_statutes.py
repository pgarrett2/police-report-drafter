import pandas as pd
import os
import re

def fix_missing_statutes(file_path):
    print(f"Loading {file_path} (ALL_OFFENSES sheet)...")
    df = pd.read_excel(file_path, sheet_name='ALL_OFFENSES')
    
    # 1. Get unique existing statutes to use as a dictionary
    # Filter out NaN/invalid values
    statutes = sorted([str(s) for s in df['statute'].dropna().unique() if len(str(s)) > 1], key=len, reverse=True)
    
    # 2. Identify rows with missing statute
    # We clean statute column first
    df['statute'] = df['statute'].replace('', pd.NA)
    mask = df['statute'].isna()
    
    print(f"Checking {mask.sum()} rows with missing statute...")
    
    updates_count = 0
    for idx in df[mask].index:
        citation = str(df.at[idx, 'citation']).strip()
        for s in statutes:
            if citation.startswith(s):
                # Update statute
                df.at[idx, 'statute'] = s
                # Remove prefix from citation
                # Pattern: start of string, the statute code, followed by optional whitespace
                new_citation = re.sub(f'^{re.escape(s)}\\s*', '', citation)
                df.at[idx, 'citation'] = new_citation
                updates_count += 1
                break
                
    print(f"Updated {updates_count} rows with extracted statutes.")
    
    # 3. Reorganize sheets
    print("Reorganizing sheets based on updated data...")
    
    # Treat NaN as 'BLANK' for sheet sorting logic
    counts = df['statute'].fillna('BLANK').value_counts()
    sorted_statutes = counts.index.tolist()
    
    # Reorder to place 'BLANK' after 'ORD'
    if 'ORD' in sorted_statutes and 'BLANK' in sorted_statutes:
        sorted_statutes.remove('BLANK')
        ord_idx = sorted_statutes.index('ORD')
        sorted_statutes.insert(ord_idx + 1, 'BLANK')
    
    # Write updated workbook
    with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
        # Master sheet
        df.to_excel(writer, sheet_name='ALL_OFFENSES', index=False)
        
        # Statute sheets
        for statute in sorted_statutes:
            if statute == 'BLANK':
                sheet_df = df[df['statute'].isna()]
            else:
                sheet_df = df[df['statute'] == statute]
            
            sheet_name = str(statute)[:31]
            sheet_df.to_excel(writer, sheet_name=sheet_name, index=False)
            
    print(f"Success! {file_path} updated.")

if __name__ == "__main__":
    excel_file = r'c:\Users\pgarr\Desktop\OFFENSE_CODES\offense_codes.xlsx'
    
    if os.path.exists(excel_file):
        fix_missing_statutes(excel_file)
    else:
        print(f"Error: {excel_file} does not exist.")
