import pandas as pd
import os

def refine_excel_data(file_path):
    print(f"Loading {file_path}...")
    df = pd.read_excel(file_path)
    
    # Fill NaN to avoid issues with string operations
    df['citation'] = df['citation'].fillna('').astype(str)
    df['statute'] = df['statute'].fillna('').astype(str)
    
    # 1. If 'statute' (Column C) is "TRC", change it to "TC"
    trc_statute_mask = df['statute'] == 'TRC'
    df.loc[trc_statute_mask, 'statute'] = 'TC'
    print(f"Updated {trc_statute_mask.sum()} rows where statute was 'TRC' to 'TC'.")
    
    # 2. If 'statute' (Column C) is "CO", change it to "ORD"
    co_statute_mask = df['statute'] == 'CO'
    df.loc[co_statute_mask, 'statute'] = 'ORD'
    print(f"Updated {co_statute_mask.sum()} rows where statute was 'CO' to 'ORD'.")
    
    # 3. If 'citation' (Column B) starts with "ORD"
    ord_citation_mask = df['citation'].str.startswith('ORD', na=False)
    print(f"Found {ord_citation_mask.sum()} rows where citation starts with 'ORD'.")
    
    # Remove "ORD" from citation and set statute to "ORD"
    df.loc[ord_citation_mask, 'statute'] = 'ORD'
    df.loc[ord_citation_mask, 'citation'] = df.loc[ord_citation_mask, 'citation'].str.replace(r'^ORD\s*', '', regex=True)
    
    print(f"Saving changes to {file_path}...")
    df.to_excel(file_path, index=False)
    print("Refinement complete!")

if __name__ == "__main__":
    excel_file = r'c:\Users\pgarr\Desktop\OFFENSE_CODES\offense_codes.xlsx'
    
    if os.path.exists(excel_file):
        refine_excel_data(excel_file)
    else:
        print(f"Error: {excel_file} does not exist.")
