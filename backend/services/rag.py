import os
import uuid
from typing import Dict, List
import numpy as np
from groq import Groq
from sentence_transformers import SentenceTransformer
import faiss
from dotenv import load_dotenv

load_dotenv()

groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Load embedding model once at startup (runs locally, no API key needed)
_embedding_model = None


def get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _embedding_model


# In-memory session store: session_id -> {"index": faiss.Index, "chunks": List[str]}
_sessions: Dict[str, dict] = {}


def build_index(session_id: str, chunks: List[str]) -> None:
    """Build a FAISS index from text chunks and store it in memory."""
    model = get_embedding_model()
    embeddings = model.encode(chunks, convert_to_numpy=True, show_progress_bar=False)
    embeddings = embeddings.astype(np.float32)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    _sessions[session_id] = {"index": index, "chunks": chunks}


def retrieve_relevant_chunks(session_id: str, query: str, top_k: int = 5) -> List[str]:
    """Retrieve the top-k most relevant chunks for a query."""
    if session_id not in _sessions:
        raise ValueError(f"Session '{session_id}' not found. Please upload the PDF first.")

    session = _sessions[session_id]
    model = get_embedding_model()

    query_embedding = model.encode([query], convert_to_numpy=True).astype(np.float32)
    distances, indices = session["index"].search(query_embedding, top_k)

    chunks = session["chunks"]
    return [chunks[i] for i in indices[0] if i < len(chunks)]


def answer_question(session_id: str, question: str, chat_history: List[dict] = None) -> str:
    """
    Retrieve relevant context from the PDF and answer the question using Groq LLM.
    """
    context_chunks = retrieve_relevant_chunks(session_id, question)
    context = "\n\n---\n\n".join(context_chunks)

    system_prompt = (
        "You are a helpful assistant that answers questions about a resume/CV document. "
        "Use ONLY the provided context from the PDF to answer. "
        "If the answer is not in the context, say 'I could not find that information in the resume.' "
        "Be concise and professional."
    )

    messages = [{"role": "system", "content": system_prompt}]

    # Include recent chat history for context
    if chat_history:
        messages.extend(chat_history[-6:])  # last 3 exchanges

    messages.append({
        "role": "user",
        "content": f"Context from the resume:\n{context}\n\nQuestion: {question}"
    })

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.3,
        max_tokens=1024,
    )

    return response.choices[0].message.content.strip()


def session_exists(session_id: str) -> bool:
    return session_id in _sessions
