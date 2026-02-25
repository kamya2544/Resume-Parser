from pydantic import BaseModel
from typing import Any, Dict, List, Optional


class SchemaOption(BaseModel):
    id: str
    label: str
    description: str
    icon: str
    fields: List[str]


class SchemaOptionsResponse(BaseModel):
    schemas: List[SchemaOption]


class ParseResumeResponse(BaseModel):
    json_data: Dict[str, Any]
    session_id: str


class UploadSessionResponse(BaseModel):
    session_id: str
    message: str


class ChatRequest(BaseModel):
    message: str
    session_id: str


class ChatResponse(BaseModel):
    answer: str
