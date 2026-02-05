import re
import os

with open('PE.htm/pe.39.htm', 'r', encoding='utf-8') as f:
    content = f.read()

# Try a very loose regex for anchors
pattern = re.compile(r'<a name="(\d+\.\d+)">', re.IGNORECASE)
matches = list(pattern.finditer(content))
print(f"DEBUG: Found {len(matches)} matches with loose regex.")

if matches:
    for m in matches[:5]:
        print(f"Match: {m.group(0)} at {m.start()}")
    
    # Check 39.02 specifically
    match3902 = [m for m in matches if m.group(1) == "39.02"]
    if match3902:
        m = match3902[0]
        # Find next anchor
        next_m = content.find('<a name="', m.end())
        print(f"39.02 raw start (100 chars): {content[m.start():m.start()+100]}")
        print(f"39.02 raw slice (first 200 chars after m.start()): {content[m.start():m.start()+200]}")
else:
    # Try even looser
    print("DEBUG: Trying search for just '39.02'")
    pos = content.find('39.02')
    if pos != -1:
        print(f"Found '39.02' at {pos}: {content[pos-20:pos+50]}")
