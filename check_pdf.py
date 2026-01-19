import pdfplumber

with pdfplumber.open("Texas CJIS code v20.pdf") as pdf:
    first_page = pdf.pages[0]
    table = first_page.extract_table()
    if table:
        for row in table[:10]:
            print(row)
    else:
        print("No table found on first page. Extracting text instead:")
        print(first_page.extract_text()[:1000])
