import json

def find_misc_citations():
    try:
        with open('cjis_codes.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        results = [f"{o['literal']} (Citation: {o['citation']})" for o in data if 'MISC' in str(o.get('citation', '')).upper()]
        
        if results:
            print("\n".join(results))
        else:
            print("No offenses found with 'MISC' in citation.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_misc_citations()
