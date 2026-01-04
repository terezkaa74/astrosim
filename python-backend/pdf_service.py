import io
from PyPDF2 import PdfReader

class PDFService:
    def extract_text(self, pdf_bytes: bytes) -> str:
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            reader = PdfReader(pdf_file)

            text_parts = []

            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                if text.strip():
                    text_parts.append(f"--- Page {page_num + 1} ---\n{text}\n")

            full_text = "\n".join(text_parts)

            return full_text

        except Exception as e:
            raise Exception(f"Error extracting PDF text: {str(e)}")
