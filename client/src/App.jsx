import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';

import UploadPage from './pages/UploadPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-8">
          <h1 className="text-xl font-bold tracking-tight">연구소 통합 실험 DB</h1>
          <div className="flex gap-4">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1 rounded transition ${isActive ? 'bg-indigo-500' : 'hover:bg-indigo-600'}`
              }
            >
              대시보드
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `px-3 py-1 rounded transition ${isActive ? 'bg-indigo-500' : 'hover:bg-indigo-600'}`
              }
            >
              실험 검색
            </NavLink>
            <NavLink
              to="/upload"
              className={({ isActive }) =>
                `px-3 py-1 rounded transition ${isActive ? 'bg-indigo-500' : 'hover:bg-indigo-600'}`
              }
            >
              데이터 업로드
            </NavLink>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
