import pandas as pd
import os

def modify_excel_file(file_path):
    print(f"Loading {file_path}...")
    df = pd.read_excel(file_path)
    
    # Identify rows where citation starts with TRC
    # Use na=False to ensure we get a clean boolean mask
    mask = df['citation'].astype(str).str.startswith('TRC', na=False)
    
    print(f"Found {mask.sum()} rows starting with 'TRC'.")
    
    # 1. Set statute to 'TC' for matches
    df.loc[mask, 'statute'] = 'TC'
    
    # 2. If 'level' is blank, make it 'MC' for matches
    # A 'blank' level can be NaN or an empty string
    level_mask = df['level'].isna() | (df['level'].astype(str).str.strip() == '')
    df.loc[mask & level_mask, 'level'] = 'MC'
    
    # 3. Remove 'TRC' from the beginning of 'citation'
    # We strip 'TRC' and any leading space
    df.loc[mask, 'citation'] = df.loc[mask, 'citation'].astype(str).str.replace(r'^TRC\s*', '', regex=True)
    
    print(f"Saving changes to {file_path}...")
    df.to_excel(file_path, index=False)
    print("Modification complete!")

if __name__ == "__main__":
    excel_file = r'c:\Users\pgarr\Desktop\OFFENSE_CODES\offense_codes.xlsx'
    
    if os.path.exists(excel_file):
        modify_excel_file(excel_file)
    else:
        print(f"Error: {excel_file} does not exist.")
