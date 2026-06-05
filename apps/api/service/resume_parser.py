import io

import pdfplumber
from docx import Document


def extract_text(file_bytes: bytes, ext: str) -> str:
    if ext == ".pdf":
        return _extract_pdf(file_bytes)
    if ext == ".docx":
        return _extract_docx(file_bytes)
    if ext == ".doc":
        raise ValueError(".doc format is not supported; please upload a .pdf or .docx file")
    raise ValueError(f"Unsupported file extension: {ext}")


def _extract_pdf(data: bytes) -> str:
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]
    return "\n".join(pages).strip()


def _extract_docx(data: bytes) -> str:
    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text).strip()
