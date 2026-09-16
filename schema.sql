CREATE TABLE IF NOT EXISTS job_gap_analysis (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(255) UNIQUE,
    job_title VARCHAR(255),
    company VARCHAR(255),
    job_url TEXT,
    required_experience TEXT,
    candidate_experience TEXT,
    experience_gap TEXT,
    missing_skills TEXT,
    overall_gap_summary TEXT,
    match_score INT DEFAULT 0,
    apply_recommendation VARCHAR(50) DEFAULT 'MAYBE',
    status VARCHAR(50) DEFAULT 'NOT_APPLIED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
