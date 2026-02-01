import pandas as pd
import json

try:
    df = pd.read_excel('Subtype.xlsx')
    # Print the column names
    print("Columns:", df.columns.tolist())
    # Print first few rows to understand structure
    print(df.head(20).to_json(orient='records', indent=2))
    
    # Also print all unique call types if there's a column for it, to see mapping
    if 'Call Type' in df.columns:
        print("\nUnique Call Types:", df['Call Type'].unique().tolist())
except Exception as e:
    print(f"Error reading Excel: {e}")
