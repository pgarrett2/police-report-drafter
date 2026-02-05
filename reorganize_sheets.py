import pandas as pd
import os

def reorganize_excel_sheets(file_path):
    print(f"Loading {file_path}...")
    df = pd.read_excel(file_path)
    
    # Get all unique statutes
    # We treat NaN as 'BLANK'
    all_statutes = df['statute'].fillna('BLANK').unique()
    
    # Count frequencies (including blanks)
    counts = df['statute'].fillna('BLANK').value_counts()
    
    # Sort statutes by frequency descending
    sorted_statutes = counts.index.tolist()
    
    # Reorder to place 'BLANK' after 'ORD' if 'ORD' exists
    if 'ORD' in sorted_statutes and 'BLANK' in sorted_statutes:
        sorted_statutes.remove('BLANK')
        ord_idx = sorted_statutes.index('ORD')
        sorted_statutes.insert(ord_idx + 1, 'BLANK')
    
    print(f"Creating sheets in order: {sorted_statutes[:10]} ...")
    
    # Write to a new Excel file
    with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
        # First sheet: ALL OFFENSES
        df.to_excel(writer, sheet_name='ALL_OFFENSES', index=False)
        
        # Subsequent sheets: Filtered by statute
        for statute in sorted_statutes:
            if statute == 'BLANK':
                sheet_df = df[df['statute'].isna()]
            else:
                sheet_df = df[df['statute'] == statute]
            
            # Excel sheet names have a 31 char limit
            sheet_name = str(statute)[:31]
            sheet_df.to_excel(writer, sheet_name=sheet_name, index=False)
            
    print(f"Success! {file_path} reorganized with {len(sorted_statutes) + 1} sheets.")

if __name__ == "__main__":
    excel_file = r'c:\Users\pgarr\Desktop\OFFENSE_CODES\offense_codes.xlsx'
    
    if os.path.exists(excel_file):
        reorganize_excel_sheets(excel_file)
    else:
        print(f"Error: {excel_file} does not exist.")
