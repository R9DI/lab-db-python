import { useState, useRef, useEffect } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import UploadPage from "./pages/UploadPage";
import NewExperiment from "./pages/NewExperiment";
import ExperimentProgress from "./pages/ExperimentProgress";
import ExperimentResults from "./pages/ExperimentResults";
import Summary from "./pages/Summary";

const dbSubPages = [
  { to: "/", label: "통합 DB Board", end: true },
  { to: "/upload", label: "데이터 업로드" },
];

const planSubPages = [
  { to: "/search", label: "실험 탐색" },
  { to: "/new-experiment", label: "신규 실험" },
];

const mainNavItems = [
  { key: "db", label: "실험 DB", sub: dbSubPages },
  { key: "plan", label: "실험 계획", sub: planSubPages },
  { key: "progress", to: "/progress", label: "실험 진행" },
  { key: "results", to: "/results", label: "실험 결과" },
  { key: "summary", to: "/summary", label: "Summary" },
];

function DropdownNav({ item, linkClass }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  const isActive = item.sub.some((s) =>
    s.end ? location.pathname === s.to : location.pathname.startsWith(s.to),
  );

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-1 rounded transition flex items-center gap-1 ${
          isActive ? "bg-indigo-500" : "hover:bg-indigo-600"
        }`}
      >
        {item.label}
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50">
          {item.sub.map((sub) => (
            <NavLink
              key={sub.to}
              to={sub.to}
              end={sub.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              {sub.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const linkClass = ({ isActive }) =>
    `px-3 py-1 rounded transition ${isActive ? "bg-indigo-500" : "hover:bg-indigo-600"}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-8">
          <h1 className="text-xl font-bold tracking-tight">실험 통합 관리</h1>
          <div className="flex gap-2">
            {mainNavItems.map((item) =>
              item.sub ? (
                <DropdownNav key={item.key} item={item} linkClass={linkClass} />
              ) : (
                <NavLink key={item.key} to={item.to} className={linkClass}>
                  {item.label}
                </NavLink>
              ),
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/new-experiment" element={<NewExperiment />} />
          <Route path="/progress" element={<ExperimentProgress />} />
          <Route path="/results" element={<ExperimentResults />} />
          <Route path="/summary" element={<Summary />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
