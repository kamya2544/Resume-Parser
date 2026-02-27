# Resume Parser — PDF to JSON

> Upload a PDF resume → get structured JSON fields + chat with it.  


**Stack:** React + Vite · FastAPI · Groq LLaMA-3 · HuggingFace sentence-transformers · FAISS · Poetry

---
## Screenshots
1. The first view of React App, showing hardcoded templates for json format
<img width="1919" height="906" alt="image" src="https://github.com/user-attachments/assets/dc3d2a7f-57f4-485b-8b5a-42b85ef5711d" />

2. The first view (scrolled down) of the app, showing the Custom Fields option where user can add the column names he/she wants to extract from the resume.
<img width="1919" height="916" alt="image" src="https://github.com/user-attachments/assets/e61a526e-a12d-4e23-bbbd-12018e00ea09" />

3. The second view for dropping in the Resume to be parsed as JSON.
<img width="1919" height="911" alt="image" src="https://github.com/user-attachments/assets/f8c58f38-c913-45b7-890a-99f562334136" />

4. The third view with the interactive chatbot and the parsed details. The display is user friendly with textboxes, the JSON structure can be copied or downloaded as per the user's preference. Otherwise, the JSON file gets stored locally as well. 
<img width="1918" height="972" alt="image" src="https://github.com/user-attachments/assets/21c69f75-5176-4362-9b6d-a8dcf29828b2" />




---


## How It Works

| Step | What happens |
|------|-------------|
| **1 — Pick a Template** | Choose Basic, Technical, Academic, Creative, or define your own Custom fields |
| **2 — Upload Resume** | Drop in your PDF — text is extracted, a RAG index is built, and the LLM parses it |
| **3 — See Results** | View every extracted field, copy or download the JSON, and chat with your resume |

---

## Project Structure

```
React-RAG-PDFjsonToPdf/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── routers/resume.py        # API endpoints (/parse-resume, /chat, /schema-options)
│   ├── services/
│   │   ├── resume_parser.py     # Groq LLM extraction logic
│   │   ├── pdf_extractor.py     # PyMuPDF text & chunk extraction
│   │   └── rag.py               # FAISS index build + RAG Q&A
│   ├── models/schemas.py        # Pydantic request/response models
│   ├── results/                 # Auto-saved JSON output for every parse
│   ├── pyproject.toml           # Poetry dependency config
│   └── .env                     # API keys (not committed)
└── frontend/
    ├── src/
    │   ├── App.jsx              # Root — step routing
    │   ├── views/
    │   │   ├── View1_SchemaSelector.jsx   # Template picker + custom fields
    │   │   ├── View2_PDFUpload.jsx        # PDF drop zone + upload
    │   │   └── View3_Results.jsx          # Results display + chatbot
    │   └── components/StepIndicator.jsx   # Progress bar
    └── index.html
```

---

## Setup

### Backend (Poetry)

```bash
cd backend
poetry install
```

Copy `.env.example` → `.env` and add your Groq API key:
```
GROQ_API_KEY=gsk_...
```

Get a free key at [console.groq.com](https://console.groq.com)

Start the server:
```bash
poetry run uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Features

- **5 schema templates** — Basic, Technical, Academic, Creative, or fully Custom
- **Custom Fields** — type your own field names; the LLM extracts exactly those
- **Auto-saved results** — every parse is saved to `backend/results/<schema>_<timestamp>.json`
- **Download JSON** — one-click download of the extracted data
- **RAG Chatbot** — ask anything about the resume using FAISS + HuggingFace embeddings
- **Auto-grow fields** — long text values expand naturally in the results view

---

## Notes

- HuggingFace model (`all-MiniLM-L6-v2`) downloads automatically on first run (~90 MB)
- FAISS index is stored in-memory per session — resets on server restart
- Groq free tier + HuggingFace local inference — **no paid APIs required**
- Parsed JSONs in `backend/results/` are gitignored to protect personal data
