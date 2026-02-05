import re
import os

def extract_debug():
    html_dir = 'PE.htm'
    section_anchor_pattern = re.compile(r'<a name="(\d+\.\d+)">', re.IGNORECASE)
    
    with open(os.path.join(html_dir, 'pe.39.htm'), 'r', encoding='utf-8') as f:
        content = f.read()
    
    matches = list(section_anchor_pattern.finditer(content))
    print(f"DEBUG: Found {len(matches)} statute anchors in pe.39.htm")
    
    for i, m in enumerate(matches):
        section_num = m.group(1)
        if section_num == "39.02":
            # Match start
            start = m.start()
            # Find next DIFFERENT statute anchor
            end = -1
            for j in range(i + 1, len(matches)):
                if matches[j].group(1) != "39.02":
                    end = matches[j].start()
                    break
            
            if end == -1:
                end = content.find('</pre>', start)
            
            raw = content[start:end]
            print(f"DEBUG: 39.02 raw length: {len(raw)}")
            print(f"DEBUG: 39.02 raw snippet: {raw[:200]}")
            
            # check what BeautifulSoup sees
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(raw, 'html.parser')
            text = soup.get_text()
            print(f"DEBUG: 39.02 text length: {len(text.strip())}")
            print(f"DEBUG: 39.02 text snippet: {text.strip()[:100]}")

extract_debug()
