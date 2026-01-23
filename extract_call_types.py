import pandas as pd
import json

try:
    df = pd.read_excel("CALL_TYPES.xlsx")
    # Assuming call types are in the first column
    call_types = df.iloc[:, 0].dropna().unique().tolist()
    print(json.dumps(call_types))
except Exception as e:
    print(f"Error: {e}")
