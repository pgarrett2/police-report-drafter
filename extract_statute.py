import pypdfium2 as pdfium
import sys
import re

def extract_statute_sections(pdf_path, statute_numbers):
    pdf = pdfium.PdfDocument(pdf_path)
    n_pages = len(pdf)
    
    results = {}
    for num in statute_numbers:
        results[num] = None

    for i in range(n_pages):
        page = pdf.get_page(i)
        textpage = page.get_textpage()
        text = textpage.get_text_range()
        
        for num in statute_numbers:
            if results[num] is not None:
                continue
                
            # Look for "Sec. [num]."
            pattern = rf"Sec\. {re.escape(num)}\."
            if re.search(pattern, text):
                # Found the start. Now we need the full section.
                # Sections usually end when another "Sec." starts or at end of page.
                # For simplicity, we'll take the text from the start of the match
                # until the next "Sec." or end of text.
                start_match = re.search(pattern, text)
                start_idx = start_match.start()
                
                # Look for the NEXT section start
                next_sec = re.search(r"Sec\.", text[start_idx + 1:])
                if next_sec:
                    end_idx = start_idx + 1 + next_sec.start()
                    results[num] = text[start_idx:end_idx].strip()
                else:
                    # Might span pages. For now just take rest of page.
                    results[num] = text[start_idx:].strip()
            
    return results

if __name__ == "__main__":
    pdf_file = "TRANSPORTATION CODE.pdf"
    nums = sys.argv[1:]
    res = extract_statute_sections(pdf_file, nums)
    for num, text in res.items():
        print(f"=== STATUTE {num} ===")
        print(text)
        print("=====================")
