import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers.resume import router

load_dotenv()

app = FastAPI(
    title="Resume Parser API",
    description="Parse resume PDFs into structured JSON using Groq LLM and chat with your resume via RAG.",
    version="1.0.0",
)

# Allow React dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root():
    return {"message": "Resume Parser API is running. Visit /docs for API documentation."}
