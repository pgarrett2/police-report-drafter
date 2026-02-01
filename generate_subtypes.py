import pandas as pd
import json

def clean_subtype(call_type, subtype):
    # This is for the UI display, we probably just want the raw string here
    # The deduplication logic happens in the narrative generation
    return subtype

try:
    df = pd.read_excel('Subtype.xlsx')
    
    # Structure: We want a map of Call Type -> List of Subtypes
    # Assuming columns are 'Call Type' and 'Subtype' based on previous read
    
    # Normalize column names just in case
    df.columns = [c.strip() for c in df.columns]
    
    # If columns are just 'Subtype' and it contains "CALL TYPE-SUBTYPE", we need to split it
    # Based on previous output: [{"Subtype":"ABANDONED VEHICLE-ABANDONED VEHICLE"}, ...]
    # It seems 'Subtype' column contains the full string "CALL TYPE-SUBTYPE"
    
    subtype_map = {}
    
    for index, row in df.iterrows():
        full_string = row['Subtype']
        if pd.isna(full_string):
            continue
            
        full_string = str(full_string).strip()
        
        # Split by first hyphen? Or is there a separate 'Call Type' column?
        # The previous tool output showed just "Subtype" column.
        # Let's assume the first part before the first hyphen is the Call Type, 
        # BUT we must match it against the existing CALL_TYPES in constants.ts (which are Title Case)
        # The Excel shows uppercase "ABANDONED VEHICLE-ABANDONED VEHICLE"
        
        # Strategy:
        # 1. Split by first hyphen to try and separate Call Type and Specific Subtype
        # 2. Store the FULL string as the value in the list, because the user wants to select "missing-missing juvenile"
        #    Wait, the user said: 'if I select "missing" call type and "missing-missing juvenile" sub-type'
        #    So the dropdown option should probably be the full string or just the second part?
        #    Re-reading: "add the subtype list... When the user makes a subtype selection..."
        #    Usually dropdowns show the full text.
        #    Also: "remove repeatative words if the subtype has a word that matches the call type"
        
        parts = full_string.split('-', 1)
        if len(parts) >= 2:
            call_type_key = parts[0].strip().upper() # Store as Upper for matching, or normalized
            # We need to map this UPPER case key to the Title Case key in constants.ts
            # We'll generate a map where keys are UPPERCASE call types (for easy matching) 
            # and values are lists of subtype strings.
            
            if call_type_key not in subtype_map:
                subtype_map[call_type_key] = []
            
            subtype_map[call_type_key].append(full_string)
        else:
            # Maybe some don't have hyphens?
            pass

    # Generates TypeScript code
    ts_content = "export const SUBTYPES: Record<string, string[]> = {\n"
    
    sorted_keys = sorted(subtype_map.keys())
    
    for key in sorted_keys:
        subtypes = sorted(list(set(subtype_map[key]))) # Dedupe and sort
        # keys in constants.ts are Title Case (e.g. "Abandoned Vehicle"). 
        # The Excel has "ABANDONED VEHICLE".
        # We will use the Upper Case key here, and in App.tsx we will UPPERCASE the selected Call Type to lookup.
        
        ts_content += f'  "{key}": [\n'
        for st in subtypes:
            cleaned_st = st.replace('"', '\\"')
            ts_content += f'    "{cleaned_st}",\n'
        ts_content += "  ],\n"
    
    ts_content += "};\n"
    
    with open('subtypes.ts', 'w') as f:
        f.write(ts_content)
        
    print("Successfully generated subtypes.ts")

except Exception as e:
    print(f"Error: {e}")
