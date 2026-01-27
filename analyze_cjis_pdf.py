import pdfplumber

CJIS_PDF_PATH = r"c:\Users\pgarr\Desktop\police-report-drafter\Texas CJIS code v20.pdf"

def analyze():
    print("Extracting CJIS PDF...")
    with pdfplumber.open(CJIS_PDF_PATH) as pdf:
        page = pdf.pages[0]
        print("--- Page 0 ---")
        print(page.extract_text())
                    
if __name__ == "__main__":
    analyze()
