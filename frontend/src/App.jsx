import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  Sparkles,
  Search,
  Building
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      const data = await res.json();
      setJobs(data.jobs || []);
      if (data.jobs && data.jobs.length > 0 && !selectedJob) {
        setSelectedJob(data.jobs[0]);
      }
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const triggerScrape = async () => {
    setScraping(true);
    try {
      await fetch(`${API_URL}/api/scrape`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true" 
        },
        body: JSON.stringify({ search_term: "data engineer", location: "Remote", results_wanted: 5 })
      });
      alert("Scraping and AI Gap Analysis started in the background! Refreshing in 15 seconds...");
      setTimeout(() => {
        fetchJobs();
        setScraping(false);
      }, 15000);
    } catch (err) {
      alert("Failed to start scraper");
      setScraping(false);
    }
  };

  const filteredJobs = jobs.filter(
    (j) =>
      j.job_title?.toLowerCase().includes(search.toLowerCase()) ||
      j.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Job Scraper & Resume Gap AI
              </h1>
              <p className="text-xs text-slate-400">Match Chitresh's Resume with Live Job Descriptions</p>
            </div>
          </div>
          <button
            onClick={triggerScrape}
            disabled={scraping}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className={`w-4 h-4 ${scraping ? "animate-spin" : ""}`} />
            <span>{scraping ? "Scraping & Analyzing..." : "Trigger Scraper"}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Job List */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search job title or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[calc(100vh-200px)] pr-1">
            {loading ? (
              <div className="flex justify-center items-center py-12 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading stored jobs...
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800">
                No jobs found. Click "Trigger Scraper" to fetch jobs!
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/50 shadow-md"
                        : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-sm text-slate-100 line-clamp-1">{job.job_title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center mb-3">
                      <Building className="w-3 h-3 mr-1 text-slate-500" /> {job.company}
                    </p>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50 flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-indigo-400" /> Gap Analysis Ready
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Job Gap Analysis Detail */}
        <div className="lg:col-span-7">
          {selectedJob ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-1">{selectedJob.job_title}</h2>
                  <p className="text-sm text-indigo-400 font-medium">{selectedJob.company}</p>
                </div>
                {selectedJob.job_url && (
                  <a
                    href={selectedJob.job_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                  >
                    <span>View Job</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Experience Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center mb-1">
                    <Briefcase className="w-3.5 h-3.5 mr-1 text-amber-400" /> Required Experience
                  </span>
                  <p className="text-sm font-medium text-slate-200 mt-2">
                    {selectedJob.required_experience || "Not explicitly specified"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center mb-1">
                    <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Chitresh's Resume
                  </span>
                  <p className="text-sm font-medium text-slate-200 mt-2">
                    {selectedJob.candidate_experience || "Analyzed from Chitresh-Chopkar-Resume.pdf"}
                  </p>
                </div>
              </div>

              {/* Experience Gap */}
              <div className="p-4 rounded-xl bg-amber-950/10 border border-amber-500/20">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center mb-2">
                  <AlertTriangle className="w-4 h-4 mr-1.5" /> Experience Gap Analysis
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedJob.experience_gap || "No major experience gap detected."}
                </p>
              </div>

              {/* Missing Skills */}
              <div className="p-4 rounded-xl bg-rose-950/10 border border-rose-500/20">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center mb-2">
                  <AlertTriangle className="w-4 h-4 mr-1.5" /> Missing Tech Stack / Skills
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedJob.missing_skills || "Skills match closely."}
                </p>
              </div>

              {/* Overall Summary */}
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center mb-2">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> AI Recommendation & Verdict
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedJob.overall_gap_summary || "Good match."}
                </p>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-24 bg-slate-900/30 rounded-xl border border-slate-800 text-slate-500">
              <Briefcase className="w-12 h-12 mb-3 text-slate-600" />
              <p>Select a job from the list to view experience and skill gap analysis</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
