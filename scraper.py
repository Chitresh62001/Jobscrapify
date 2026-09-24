import os
import json
import time
import pandas as pd
from pypdf import PdfReader
from jobspy import scrape_jobs
import requests
from sqlalchemy import create_engine, text

# --- Database Setup ---
DB_URL = "postgresql://postgres:postgres@127.0.0.1:5432/job_db"
engine = create_engine(DB_URL)

# Ollama local endpoint & default model
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434/api/generate")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.5:9b")

# 1. Extract Resume Text
def read_resume(pdf_path):
    reader = PdfReader(pdf_path)
    return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])

# 2. Local AI Analysis via Ollama (100% Offline)
def analyze_experience_and_skill_gap_local(
    resume_text,
    job_title,
    company,
    description,
    max_retries=2
                ):
    prompt = f"""
    You are an expert HR and resume reviewer.

    Compare the candidate's resume against the target job description.

    CANDIDATE RESUME:
    {resume_text}

    JOB TITLE:
    {job_title}

    COMPANY:
    {company}

    JOB DESCRIPTION:
    {description}

    Respond ONLY with a valid JSON object.
    Do not use markdown.
    Do not use ```json.
    Do not include explanations before or after the JSON.

    Use exactly these keys:

    {{
        "required_experience": "Required years of experience/technology stack stated in job",
        "candidate_experience": "2+ years",
        "experience_gap": "Analysis of experience gap",
        "missing_skills": "List/summary of missing technical skills",
        "match_score": 50,
        "apply_recommendation": "MAYBE",
        "overall_gap_summary": "Brief 2-3 sentence overview of gaps and recommendation"
    }}

    Rules:
    - match_score must be an integer from 0 to 100.
    - apply_recommendation must be exactly one of:
    HIGHLY_RECOMMENDED
    RECOMMENDED
    MAYBE
    NOT_RECOMMENDED
    """

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "think": False,
        "options": {
            "temperature": 0,
            "seed": 42
        }
    }

    for attempt in range(1, max_retries + 1):
        try:
            res = requests.post(
                OLLAMA_URL,
                json=payload,
                timeout=180
            )

            print(f"Ollama HTTP status: {res.status_code}")

            if res.status_code != 200:
                print(f"Ollama error: {res.text}")
                continue

            # Debug: see exactly what Ollama returned
            response_data = res.json()

            print("Ollama response keys:", response_data.keys())

            raw_response = response_data.get("response", "")

            if not raw_response:
                print("ERROR: Ollama returned an empty 'response'")
                print("Full Ollama response:")
                print(json.dumps(response_data, indent=2))
                continue

            print("Raw AI response:")
            print(raw_response)

            # Parse JSON
            try:
                return json.loads(raw_response)

            except json.JSONDecodeError as json_error:
                print(f"Invalid JSON returned by model: {json_error}")
                print("Raw response:")
                print(repr(raw_response))

                # Try extracting JSON if model accidentally returned extra text
                start = raw_response.find("{")
                end = raw_response.rfind("}")

                if start != -1 and end != -1 and end > start:
                    json_part = raw_response[start:end + 1]

                    try:
                        return json.loads(json_part)
                    except json.JSONDecodeError:
                        pass

        except requests.exceptions.Timeout:
            print(
                f"Attempt {attempt}/{max_retries}: "
                "Ollama request timed out."
            )

        except requests.exceptions.ConnectionError as e:
            print(
                f"Attempt {attempt}/{max_retries}: "
                f"Could not connect to Ollama: {e}"
            )

        except Exception as e:
            print(
                f"Attempt {attempt}/{max_retries} - "
                f"Local AI analysis failed: {e}"
            )

        if attempt < max_retries:
            time.sleep(3)

    return None

# 3. Scrape Jobs
print("Scraping jobs...")
jobs_df = scrape_jobs(
    site_name=["indeed","linkedin"],
    search_term="data engineer",
    results_wanted=15,
    is_remote=True,
    linkedin_fetch_description=True
)

resume_text = read_resume("Chitresh-Chopkar-Resume.pdf")

# 4. Fetch existing job IDs from database to skip AI processing & duplicates
with engine.connect() as conn:
    existing_records = conn.execute(text("SELECT job_id, LOWER(job_title), LOWER(company) FROM job_gap_analysis")).fetchall()
    existing_ids = set(r[0] for r in existing_records if r[0])
    existing_title_company = set((r[1], r[2]) for r in existing_records if r[1] and r[2])

# 5. Ingest Analyzed Data into PostgreSQL
insert_sql = text("""
    INSERT INTO job_gap_analysis (
        job_id, job_title, company, job_url, 
        required_experience, candidate_experience, experience_gap, 
        missing_skills, match_score, apply_recommendation, overall_gap_summary
    ) VALUES (
        :job_id, :job_title, :company, :job_url,
        :required_experience, :candidate_experience, :experience_gap,
        :missing_skills, :match_score, :apply_recommendation, :overall_gap_summary
    ) ON CONFLICT (job_id) DO NOTHING;
""")

print(f"Processing jobs using local model ({OLLAMA_MODEL})...")
with engine.begin() as conn:
    for idx, job in jobs_df.iterrows():
        job_id = str(job.get("id"))
        title = str(job.get("title") or "")
        company = str(job.get("company") or "")
        url = job.get("job_url")
        description = job.get("description")

        if not description or pd.isna(description):
            continue

        # Check duplicate by ID or Title + Company combo
        if job_id in existing_ids or (title.lower(), company.lower()) in existing_title_company:
            print(f"Skipping duplicate job: {title} at {company} (ID: {job_id})")
            continue

        print(f"\nAnalyzing locally: {title} at {company}...")
        gap_data = analyze_experience_and_skill_gap_local(resume_text, title, company, description)

        if gap_data:
            conn.execute(insert_sql, {
                "job_id": job_id,
                "job_title": title,
                "company": company,
                "job_url": url,
                "required_experience": gap_data.get("required_experience", ""),
                "candidate_experience": gap_data.get("candidate_experience", ""),
                "experience_gap": gap_data.get("experience_gap", ""),
                "missing_skills": gap_data.get("missing_skills", ""),
                "match_score": int(gap_data.get("match_score", 50)),
                "apply_recommendation": gap_data.get("apply_recommendation", "MAYBE"),
                "overall_gap_summary": gap_data.get("overall_gap_summary", "")
            })
        else:
            conn.execute(insert_sql, {
                "job_id": job_id,
                "job_title": title,
                "company": company,
                "job_url": url,
                "required_experience": '',
                "candidate_experience":'2+',
                "experience_gap": '',
                "missing_skills": '',
                "match_score": int(1),
                "apply_recommendation": '',
                "overall_gap_summary": description
            })
            existing_ids.add(job_id)
            existing_title_company.add((title.lower(), company.lower()))
            print(f"Saved to DB: {title}")

print("\nDone! Database successfully updated. Duplicate jobs were skipped.")
