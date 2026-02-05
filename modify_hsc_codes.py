import pandas as pd
import os

def modify_hsc_excel(file_path):
    print(f"Loading {file_path}...")
    df = pd.read_excel(file_path)
    
    # Identify rows where citation starts with HSC
    # Use na=False to ensure we get a clean boolean mask
    mask = df['citation'].astype(str).str.startswith('HSC', na=False)
    
    print(f"Found {mask.sum()} rows starting with 'HSC'.")
    
    # 1. Set statute to 'HSC' for matches
    df.loc[mask, 'statute'] = 'HSC'
    
    # 2. Remove 'HSC' from the beginning of 'citation'
    # We strip 'HSC' and any leading space
    df.loc[mask, 'citation'] = df.loc[mask, 'citation'].astype(str).str.replace(r'^HSC\s*', '', regex=True)
    
    print(f"Saving changes to {file_path}...")
    df.to_excel(file_path, index=False)
    print("Modification complete!")

if __name__ == "__main__":
    excel_file = r'c:\Users\pgarr\Desktop\OFFENSE_CODES\offense_codes.xlsx'
    
    if os.path.exists(excel_file):
        modify_hsc_excel(excel_file)
    else:
        print(f"Error: {excel_file} does not exist.")
