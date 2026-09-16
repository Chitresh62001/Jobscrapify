import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from pydantic import BaseModel
import subprocess

app = FastAPI(title="Job Scraper & Resume Gap API")

# Enable CORS for Netlify / localhost / Ngrok
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_URL = "postgresql://postgres:postgres@127.0.0.1:5432/job_db"
engine = create_engine(DB_URL)

class ScrapeRequest(BaseModel):
    search_term: str = "data engineer"
    location: str = "Remote"
    results_wanted: int = 5

@app.get("/api/jobs")
def get_jobs():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, job_id, job_title, company, job_url, 
                       required_experience, candidate_experience, experience_gap, 
                       missing_skills, overall_gap_summary, created_at 
                FROM job_gap_analysis 
                ORDER BY created_at DESC;
            """))
            rows = result.mappings().all()
            return {"jobs": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scrape")
def trigger_scrape(request: ScrapeRequest, background_tasks: BackgroundTasks):
    def run_script():
        subprocess.run(["python3", "scraper.py"])

    background_tasks.add_task(run_script)
    return {"message": "Scraping and AI Gap Analysis triggered in background!"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
