import io
import re

import pdfplumber
from docx import Document


# Using Regex-based PII removal and will be replaced with a more advanced approach later.
_PII_PATTERNS: list[tuple[re.Pattern, str]] = [
    # Email addresses
    (re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"), "[EMAIL]"),
    # Phone numbers: +1 (555) 555-5555, 555-555-5555, (555) 555-5555, 555.555.5555, etc.
    (
        re.compile(
            r"(\+?\d{1,3}[\s\-.])?(\(?\d{3}\)?[\s\-.])\d{3}[\s\-\.]\d{4}"
        ),
        "[PHONE]",
    ),
    # LinkedIn profile URLs
    (re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[^\s,|]+", re.IGNORECASE), "[LINKEDIN]"),
    # GitHub profile URLs
    (re.compile(r"(?:https?://)?(?:www\.)?github\.com/[^\s,|]+", re.IGNORECASE), "[GITHUB]"),
]


def _remove_pii(text: str) -> str:
    for pattern, replacement in _PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def extract_text(file_bytes: bytes, ext: str) -> str:
    if ext == ".pdf":
        return _remove_pii(_extract_pdf(file_bytes))
    if ext == ".docx":
        return _remove_pii(_extract_docx(file_bytes))
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
