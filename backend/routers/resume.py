import json
import traceback
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from models.schemas import (
    ChatRequest,
    ChatResponse,
    ParseResumeResponse,
    SchemaOption,
    SchemaOptionsResponse,
)
from services.pdf_extractor import extract_chunks_from_pdf, extract_text_from_pdf
from services.rag import answer_question, build_index, session_exists
from services.resume_parser import parse_resume

router = APIRouter(prefix="/api")

# Directory where parsed results are saved
RESULTS_DIR = Path(__file__).parent.parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

SCHEMA_OPTIONS = [
    SchemaOption(
        id="basic",
        label="Basic Resume",
        description="Perfect for general job applications. Covers the essentials.",
        icon="📄",
        fields=["name", "email", "phone", "location", "summary", "education", "experience", "skills"],
    ),
    SchemaOption(
        id="technical",
        label="Technical Resume",
        description="For software engineers & developers. Includes projects, GitHub & tech stack.",
        icon="💻",
        fields=["name", "email", "github", "linkedin", "skills", "projects", "experience", "education", "certifications"],
    ),
    SchemaOption(
        id="academic",
        label="Academic / Research",
        description="For researchers & academics. Includes publications & research experience.",
        icon="🎓",
        fields=["name", "email", "education", "publications", "research_experience", "awards", "skills"],
    ),
    SchemaOption(
        id="creative",
        label="Creative Portfolio",
        description="For designers, writers & artists. Highlights portfolio & creative projects.",
        icon="🎨",
        fields=["name", "email", "portfolio_url", "summary", "skills", "tools", "projects", "experience"],
    ),
]


@router.get("/schema-options", response_model=SchemaOptionsResponse)
async def get_schema_options():
    return SchemaOptionsResponse(schemas=SCHEMA_OPTIONS)


@router.post("/parse-resume", response_model=ParseResumeResponse)
async def parse_resume_endpoint(
    pdf: UploadFile = File(...),
    schema_id: str = Form(...),
    custom_fields: Optional[str] = Form(None),
):
    if not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        pdf_bytes = await pdf.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {e}")

    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        pdf_text = extract_text_from_pdf(pdf_bytes)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=422, detail=f"PDF text extraction failed: {e}")

    if not pdf_text or not pdf_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from the PDF. Is it a scanned image-only PDF?")

    session_id = str(uuid.uuid4())
    try:
        chunks = extract_chunks_from_pdf(pdf_bytes)
        build_index(session_id, chunks)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"RAG index build failed: {e}")

    try:
        fields_list = [f.strip() for f in custom_fields.split(',') if f.strip()] if custom_fields else None
        json_data = parse_resume(pdf_text, schema_id, custom_fields=fields_list)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"LLM parsing error: {e}")

    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{schema_id}_{timestamp}.json"
        filepath = RESULTS_DIR / filename
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump({
                "saved_at": datetime.now().isoformat(),
                "schema": schema_id,
                "session_id": session_id,
                "data": json_data,
            }, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[warn] Could not save result to file: {e}")

    return ParseResumeResponse(json_data=json_data, session_id=session_id)


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not session_exists(request.session_id):
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please upload and parse the PDF again.",
        )

    try:
        answer = answer_question(request.session_id, request.message)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating answer: {e}")

    return ChatResponse(answer=answer)
