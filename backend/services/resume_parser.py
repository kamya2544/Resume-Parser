import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

SCHEMA_TEMPLATES = {
    "basic": {
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "summary": "",
        "education": [{"institution": "", "degree": "", "year": ""}],
        "experience": [{"company": "", "role": "", "duration": "", "responsibilities": []}],
        "skills": []
    },
    "technical": {
        "name": "",
        "email": "",
        "phone": "",
        "github": "",
        "linkedin": "",
        "summary": "",
        "skills": {"languages": [], "frameworks": [], "tools": [], "databases": []},
        "projects": [{"name": "", "description": "", "tech_stack": [], "link": ""}],
        "experience": [{"company": "", "role": "", "duration": "", "responsibilities": []}],
        "education": [{"institution": "", "degree": "", "year": ""}],
        "certifications": []
    },
    "academic": {
        "name": "",
        "email": "",
        "phone": "",
        "institution": "",
        "department": "",
        "education": [{"degree": "", "institution": "", "year": "", "gpa": ""}],
        "research_interests": [],
        "publications": [{"title": "", "journal": "", "year": "", "authors": []}],
        "research_experience": [{"project": "", "supervisor": "", "duration": "", "description": ""}],
        "awards": [],
        "skills": [],
        "languages": []
    },
    "creative": {
        "name": "",
        "email": "",
        "phone": "",
        "portfolio_url": "",
        "linkedin": "",
        "summary": "",
        "skills": [],
        "tools": [],
        "projects": [{"name": "", "description": "", "role": "", "link": ""}],
        "experience": [{"company": "", "role": "", "duration": "", "highlights": []}],
        "education": [{"institution": "", "degree": "", "year": ""}]
    }
}


def parse_resume(pdf_text: str, schema_id: str, custom_fields: list = None) -> dict:
    if schema_id == 'custom' and custom_fields:
        template = {field: "" for field in custom_fields}
    else:
        template = SCHEMA_TEMPLATES.get(schema_id, SCHEMA_TEMPLATES["basic"])
    template_str = json.dumps(template, indent=2)

    prompt = f"""You are an expert resume parser. Extract information from the resume text below and return a JSON object that EXACTLY matches the structure of the provided template.

IMPORTANT RULES:
1. Return ONLY valid JSON, no markdown, no code blocks, no extra text.
2. Fill every field that you can find data for. Leave fields as empty string or empty array if not found.
3. The output must strictly follow the template structure.
4. Do not add or remove any keys from the template.

TEMPLATE:
{template_str}

RESUME TEXT:
{pdf_text[:8000]}

Return ONLY the JSON object:"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=4096,
    )

    raw = response.choices[0].message.content.strip()

    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse JSON from Groq response: {raw[:500]}")
