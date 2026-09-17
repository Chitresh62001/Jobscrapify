import os
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from pydantic import BaseModel
import subprocess

# Hardcoded credentials — override with env vars in production
APP_USERNAME = os.environ.get("APP_USERNAME", "user")
APP_PASSWORD = os.environ.get("APP_PASSWORD", "pass@123")

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

class LoginRequest(BaseModel):
    username: str
    password: str

class ScrapeRequest(BaseModel):
    search_term: str = "data engineer"
    location: str = "Remote"
    results_wanted: int = 5

class StatusUpdateRequest(BaseModel):
    status: str  # 'APPLIED' or 'NOT_APPLIED'

@app.post("/api/login")
def login(request: LoginRequest):
    if request.username == APP_USERNAME and request.password == APP_PASSWORD:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid username or password")

@app.get("/api/jobs")
def get_jobs():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, job_id, job_title, company, job_url, 
                       required_experience, candidate_experience, experience_gap, 
                       missing_skills, match_score, apply_recommendation, status, overall_gap_summary, created_at 
                FROM job_gap_analysis 
                ORDER BY created_at DESC;
            """))
            rows = result.mappings().all()
            return {"jobs": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/jobs/{job_id}/status")
def update_job_status(job_id: str, request: StatusUpdateRequest):
    if request.status not in ["APPLIED", "NOT_APPLIED"]:
        raise HTTPException(status_code=400, detail="Status must be APPLIED or NOT_APPLIED")
    
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("UPDATE job_gap_analysis SET status = :status WHERE job_id = :job_id"),
                {"status": request.status, "job_id": job_id}
            )
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Job not found")
            return {"message": "Job status updated successfully", "job_id": job_id, "status": request.status}
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


if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)