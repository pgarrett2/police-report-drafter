import pandas as pd
import json
import os

def convert_json_to_excel(json_path, excel_path):
    print(f"Reading {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("Converting to DataFrame...")
    # Fields to extract: literal, citation, statute, level, elements, statuteText
    df = pd.DataFrame(data)
    
    # Ensure only requested columns are present (if there are others)
    requested_columns = ['literal', 'citation', 'statute', 'level', 'elements', 'statuteText']
    df = df[requested_columns]
    
    print(f"Exporting to {excel_path}...")
    df.to_excel(excel_path, index=False)
    print("Conversion complete!")

if __name__ == "__main__":
    json_file = r'c:\Users\pgarr\Desktop\OFFENSE_CODES\cjis_codes.json'
    excel_file = r'c:\Users\pgarr\Desktop\OFFENSE_CODES\offense_codes.xlsx'
    
    if os.path.exists(json_file):
        convert_json_to_excel(json_file, excel_file)
    else:
        print(f"Error: {json_file} does not exist.")
