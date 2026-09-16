import os
import json
import time
import pandas as pd
from pypdf import PdfReader
from jobspy import scrape_jobs
from google import genai
from sqlalchemy import create_engine, text

# --- Database Setup ---
DB_URL = "postgresql://postgres:postgres@localhost:5432/job_db"
engine = create_engine(DB_URL)

# 1. Extract Resume Text
def read_resume(pdf_path):
    reader = PdfReader(pdf_path)
    return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])

# 2. AI Analysis with Exponential Backoff Retry logic
def analyze_experience_and_skill_gap(resume_text, job_title, company, description, max_retries=3):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        return None

    client = genai.Client(api_key=api_key)

    prompt = f"""
Compare the candidate's resume against the target job description.

CANDIDATE RESUME:
{resume_text}

JOB TITLE: {job_title}
COMPANY: {company}

JOB DESCRIPTION:
{description}

Respond ONLY with valid JSON with the following exact keys:
{{
    "required_experience": "<Required years of experience/tech stack experience stated in job post>",
    "candidate_experience": "<Candidate's relevant years of experience/level from resume>",
    "experience_gap": "<Analysis of experience gap e.g., 'Requires 5+ yrs in PySpark, candidate has 2 yrs'>",
    "missing_skills": "<List/summary of missing technical skills or tools>",
    "overall_gap_summary": "<Brief 2-3 sentence overview of gaps and recommendation>"
}}
"""

    for attempt in range(1, max_retries + 1):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            error_str = str(e)
            if ("503" in error_str or "UNAVAILABLE" in error_str or "429" in error_str) and attempt < max_retries:
                wait_time = attempt * 5  # Exponential backoff: 5s, 10s, 15s
                print(f"Warning: API experiencing high demand (503/429). Retrying attempt {attempt}/{max_retries} in {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"Error during AI analysis after {attempt} attempt(s): {e}")
                return None

# 3. Scrape Jobs
print("Scraping jobs from LinkedIn...")
jobs_df = scrape_jobs(
    site_name=["linkedin"],
    search_term="data engineer",
    location="Remote",
    results_wanted=5,
    is_remote=True,
    easy_apply=True,
    linkedin_fetch_description=True
)

resume_text = read_resume("Chitresh-Chopkar-Resume.pdf")

# 4. Analyze & Ingest Minimal Essential Data
insert_sql = text("""
    INSERT INTO job_gap_analysis (
        job_id, job_title, company, job_url, 
        required_experience, candidate_experience, experience_gap, 
        missing_skills, overall_gap_summary
    ) VALUES (
        :job_id, :job_title, :company, :job_url,
        :required_experience, :candidate_experience, :experience_gap,
        :missing_skills, :overall_gap_summary
    ) ON CONFLICT (job_id) DO UPDATE SET
        required_experience = EXCLUDED.required_experience,
        candidate_experience = EXCLUDED.candidate_experience,
        experience_gap = EXCLUDED.experience_gap,
        missing_skills = EXCLUDED.missing_skills,
        overall_gap_summary = EXCLUDED.overall_gap_summary;
""")

print("Processing jobs and running gap analysis...")
with engine.begin() as conn:
    for idx, job in jobs_df.iterrows():
        job_id = str(job.get("id"))
        title = job.get("title")
        company = job.get("company")
        url = job.get("job_url")
        description = job.get("description")

        if not description or pd.isna(description):
            continue

        print(f"\nAnalyzing: {title} at {company}...")
        gap_data = analyze_experience_and_skill_gap(resume_text, title, company, description)

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
                "overall_gap_summary": gap_data.get("overall_gap_summary", "")
            })
            print(f"Saved to DB: {title}")

print("\nDone! Database successfully updated with essential job details and gap analysis.")
