import fitz  # PyMuPDF
from typing import List


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF given its bytes."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = []
    for page in doc:
        full_text.append(page.get_text())
    doc.close()
    return "\n".join(full_text).strip()


def extract_chunks_from_pdf(pdf_bytes: bytes, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    """
    Extract text from a PDF and split into overlapping chunks
    suitable for embedding and retrieval.
    """
    text = extract_text_from_pdf(pdf_bytes)
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk.strip())
        start += chunk_size - overlap
    return chunks
