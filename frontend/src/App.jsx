import React, { useState, useEffect } from "react";
import {
  Briefcase,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Sparkles,
  Search,
  Building,
  Check,
  XCircle,
  LogOut,
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowLeft
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("jsa_auth", "true");
        onLogin();
      } else {
        setError(data.detail || "Invalid credentials");
      }
    } catch (err) {
      setError("Could not connect to the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-2/3 left-1/3 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl mb-3 sm:mb-4">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent px-2">
            Job Scraper & Resume Gap AI
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Sign in to access your dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-2xl backdrop-blur">
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {/* Username */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-400 text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const data = await res.json();
      const fetchedJobs = data.jobs || [];
      setJobs(fetchedJobs);
      if (fetchedJobs.length > 0) {
        setSelectedJob((prev) => {
          if (!prev) return fetchedJobs[0];
          const updated = fetchedJobs.find((j) => j.job_id === prev.job_id);
          return updated || fetchedJobs[0];
        });
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

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setShowMobileDetail(true);
  };

  const toggleStatus = async (job) => {
    const newStatus = job.status === "APPLIED" ? "NOT_APPLIED" : "APPLIED";
    try {
      const res = await fetch(`${API_URL}/api/jobs/${job.job_id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.job_id === job.job_id ? { ...j, status: newStatus } : j))
        );
        if (selectedJob?.job_id === job.job_id) {
          setSelectedJob((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      alert("Failed to update job status");
    }
  };

  const triggerScrape = async () => {
    setScraping(true);
    try {
      await fetch(`${API_URL}/api/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ search_term: "data engineer", location: "Remote", results_wanted: 5 }),
      });
      alert("Scraping and AI Gap Analysis started! Refreshing in 15 seconds...");
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

  const getRecBadge = (rec) => {
    switch (rec) {
      case "HIGHLY_RECOMMENDED":
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] sm:text-xs font-semibold">🔥 Highly Recommended</span>;
      case "RECOMMENDED":
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[11px] sm:text-xs font-semibold">👍 Recommended</span>;
      case "NOT_RECOMMENDED":
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] sm:text-xs font-semibold">⚠️ Low Match</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] sm:text-xs font-semibold">🤔 Maybe</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent truncate">
                Job Scraper & Resume Gap AI
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">Match Chitresh's Resume with Live Job Descriptions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={triggerScrape}
              disabled={scraping}
              className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-medium text-xs sm:text-sm rounded-lg transition shadow-lg shadow-indigo-600/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${scraping ? "animate-spin" : ""}`} />
              <span className="hidden xs:inline">{scraping ? "Scraping..." : "Trigger Scraper"}</span>
              <span className="xs:hidden">{scraping ? "..." : "Scrape"}</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm transition"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

        {/* Left Column: Job List (Hidden on mobile if detail view is active) */}
        <div className={`lg:col-span-5 flex-col space-y-3 sm:space-y-4 ${showMobileDetail ? "hidden lg:flex" : "flex"}`}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search job title or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 sm:space-y-3 max-h-[calc(100vh-160px)] lg:max-h-[calc(100vh-200px)] pr-0.5">
            {loading ? (
              <div className="flex justify-center items-center py-12 text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading jobs...
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 text-sm">
                No jobs found. Click "Trigger Scraper" to fetch jobs!
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = selectedJob?.job_id === job.job_id;
                const isApplied = job.status === "APPLIED";
                return (
                  <div
                    key={job.job_id || job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/50 shadow-md"
                        : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className="mb-1">
                      <h3 className="font-semibold text-sm text-slate-100 line-clamp-1">{job.job_title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center mb-2.5">
                      <Building className="w-3 h-3 mr-1 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{job.company}</span>
                    </p>
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 text-[11px]">
                          {job.match_score || 0}% Match
                        </span>
                        {isApplied ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30 text-[11px]">Applied</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">Not Applied</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(job); }}
                        className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium transition flex-shrink-0 ${
                          isApplied
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
                        }`}
                      >
                        {isApplied ? "Unapply" : "Mark Applied"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Job Gap Analysis Detail (Shown full-screen on mobile when item tapped) */}
        <div className={`lg:col-span-7 ${!showMobileDetail ? "hidden lg:block" : "block"}`}>
          {selectedJob ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5">
              
              {/* Back to list button for mobile view */}
              <div className="lg:hidden mb-2">
                <button
                  onClick={() => setShowMobileDetail(false)}
                  className="flex items-center space-x-1.5 text-xs text-indigo-400 font-medium hover:text-indigo-300 transition px-2.5 py-1 bg-indigo-950/40 border border-indigo-500/30 rounded-lg"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Job List</span>
                </button>
              </div>

              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800 pb-4 gap-3">
                <div className="w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-100">{selectedJob.job_title}</h2>
                    {getRecBadge(selectedJob.apply_recommendation)}
                  </div>
                  <p className="text-xs sm:text-sm text-indigo-400 font-medium">{selectedJob.company}</p>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => toggleStatus(selectedJob)}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      selectedJob.status === "APPLIED"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {selectedJob.status === "APPLIED" ? (
                      <><Check className="w-3.5 h-3.5" /><span>Applied</span></>
                    ) : (
                      <><XCircle className="w-3.5 h-3.5" /><span>Not Applied</span></>
                    )}
                  </button>
                  {selectedJob.job_url && (
                    <a
                      href={selectedJob.job_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg border border-indigo-500 transition"
                    >
                      <span>View Job</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Score Bar */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Match Compatibility Score</span>
                  <span className="text-base sm:text-lg font-bold text-indigo-400">{selectedJob.match_score || 0}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
                    style={{ width: `${selectedJob.match_score || 0}%` }}
                  />
                </div>
              </div>

              {/* Experience Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center mb-1.5">
                    <Briefcase className="w-3.5 h-3.5 mr-1 text-amber-400 flex-shrink-0" /> Required Experience
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200">{selectedJob.required_experience || "Not explicitly specified"}</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center mb-1.5">
                    <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-400 flex-shrink-0" /> Chitresh's Resume
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200">{selectedJob.candidate_experience || "Analyzed from resume"}</p>
                </div>
              </div>

              {/* Gap */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/10 border border-amber-500/20">
                <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 flex-shrink-0" /> Experience Gap
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{selectedJob.experience_gap || "No major gap detected."}</p>
              </div>

              {/* Missing Skills */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-rose-950/10 border border-rose-500/20">
                <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 flex-shrink-0" /> Missing Tech Stack / Skills
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{selectedJob.missing_skills || "Skills match closely."}</p>
              </div>

              {/* Summary */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 flex-shrink-0" /> AI Recommendation & Verdict
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{selectedJob.overall_gap_summary || "Good match."}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 sm:py-24 bg-slate-900/30 rounded-xl border border-slate-800 text-slate-500 text-xs sm:text-sm">
              <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-slate-600" />
              <p>Select a job from the list to view gap analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("jsa_auth") === "true");

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => {
    localStorage.removeItem("jsa_auth");
    setIsLoggedIn(false);
  };

  return isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <LoginScreen onLogin={handleLogin} />;
}
