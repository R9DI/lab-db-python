import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import SplitTable from "../components/SplitTable";

ModuleRegistry.registerModules([AllCommunityModule]);

const TABS = [
  { key: "experiments", label: "실험 정보" },
  { key: "checklist", label: "과제 Checklist" },
  { key: "info", label: "과제 정보" },
];

/* ─── 과제 정보 탭 ─── */
function ProjectInfoTab({ project }) {
  if (!project) return null;

  const fields = [
    { label: "과제명", value: project.iacpj_nm },
    { label: "모듈", value: project.iacpj_mod_n },
    { label: "PM", value: project.iacpj_ch_n },
    { label: "과제 코드", value: project.iacpj_itf_uno },
    { label: "개발 분류", value: project.iacpj_tgt_n },
    { label: "검증 수준", value: project.iacpj_level },
    { label: "1차 대상 기술", value: project.iacpj_tech_n },
    { label: "과제 등급", value: project.ia_ta_grd_n },
    { label: "HTRS", value: project.ia_tgt_htr_n },
    { label: "NUDD", value: project.iacpj_nud_n },
    { label: "시작일", value: project.iacpj_bgn_dy },
    { label: "종료일", value: project.iacpj_end_dy },
    { label: "현재 상태", value: project.iacpj_cur_stt },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fields.map(
          ({ label, value }) =>
            value && (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <span className="text-[11px] text-gray-500 block mb-0.5">
                  {label}
                </span>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ),
        )}
      </div>
      {project.project_purpose && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-[11px] text-gray-500 block mb-0.5">
            과제 목적
          </span>
          <p className="text-sm text-gray-700">{project.project_purpose}</p>
        </div>
      )}
      {project.iacpj_ta_goa && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-[11px] text-gray-500 block mb-0.5">
            과제 목표
          </span>
          <p className="text-sm text-gray-700">{project.iacpj_ta_goa}</p>
        </div>
      )}
    </div>
  );
}

/* ─── LOT 상세 정보 영역 ─── */
function LotDetail({ experiment }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!experiment) return;
    setLoading(true);
    axios
      .get(`/api/experiments/${experiment.id}`)
      .then((res) => setDetail(res.data))
      .catch((err) => console.error("실험 상세 로드 실패:", err))
      .finally(() => setLoading(false));
  }, [experiment]);

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8">로딩 중...</div>
    );
  }

  if (!detail) return null;

  const sections = [
    { key: "issue", title: "Issue사항" },
    { key: "checklist", title: "Checklist" },
    { key: "Summary", title: "Summary" },
  ];

  return (
    <div className="mt-6 border-t border-gray-200 pt-6 space-y-6">
      <h3 className="text-lg font-bold text-gray-800">
        {detail.plan_id || "N/A"} LOT Total Information
      </h3>

      {/* Split Table */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-bold text-gray-700">Split Table</h4>
          <span className="text-xs text-gray-400">
            (plan_id: {detail.plan_id || "N/A"})
          </span>
        </div>
        {detail.splits && detail.splits.length > 0 ? (
          <SplitTable splits={detail.splits} />
        ) : (
          <p className="text-gray-400 text-sm py-4 text-center">
            등록된 Split 데이터가 없습니다.
          </p>
        )}
      </div>

      {/* Issue사항, Checklist, Summary - 플레이스홀더 */}
      {sections.map(({ key, title }) => (
        <div key={key}>
          <h4 className="text-sm font-bold text-gray-700 mb-2">{title}</h4>
          <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-gray-400 text-sm">
              준비 중인 기능입니다
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── 메인 컴포넌트 ─── */
function ExperimentProgress() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [experiments, setExperiments] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [activeTab, setActiveTab] = useState("experiments");
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // 과제 목록 로드
  useEffect(() => {
    axios
      .get("/api/projects")
      .then((res) => setProjects(res.data))
      .catch((err) => console.error("과제 목록 로드 실패:", err))
      .finally(() => setLoading(false));
  }, []);

  // 과제 선택 시 실험 목록 로드
  useEffect(() => {
    if (!selectedProject) {
      setExperiments([]);
      setSelectedExperiment(null);
      return;
    }
    axios
      .get(`/api/experiments?project_name=${encodeURIComponent(selectedProject.iacpj_nm)}`)
      .then((res) => setExperiments(res.data))
      .catch((err) => console.error("실험 목록 로드 실패:", err));
    setSelectedExperiment(null);
  }, [selectedProject]);

  // 필터된 과제 목록
  const filteredProjects = useMemo(() => {
    if (!searchText.trim()) return projects;
    const lower = searchText.toLowerCase();
    return projects.filter((p) =>
      p.iacpj_nm.toLowerCase().includes(lower),
    );
  }, [projects, searchText]);

  // 실험 List AG Grid 컬럼
  const expColDefs = useMemo(
    () => [
      {
        headerName: "평가 아이템",
        field: "eval_item",
        minWidth: 200,
        flex: 2,
        cellStyle: (params) => ({
          fontWeight: "600",
          color:
            selectedExperiment?.id === params.data.id ? "#4F46E5" : "#1F2937",
          cursor: "pointer",
        }),
      },
      {
        headerName: "Plan_id",
        field: "plan_id",
        width: 140,
        cellStyle: { color: "#6366F1", fontWeight: "500" },
      },
      {
        headerName: "현재 스텝",
        field: "fab_status",
        width: 130,
        cellRenderer: (params) => {
          const val = params.value || "-";
          const styles = {
            "In Fab": "bg-blue-100 text-blue-700",
            "Fab Out": "bg-purple-100 text-purple-700",
            EPM: "bg-teal-100 text-teal-700",
            WT: "bg-orange-100 text-orange-700",
          };
          if (!params.value) return <span className="text-gray-400">-</span>;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[val] || "bg-gray-100 text-gray-600"}`}
            >
              {val}
            </span>
          );
        },
        cellStyle: { display: "flex", alignItems: "center" },
      },
      {
        headerName: "다음 평가 공정",
        field: "eval_process",
        width: 150,
        cellStyle: { color: "#059669", fontWeight: "500" },
      },
      {
        headerName: "최종 평가항목",
        field: "eval_category",
        width: 150,
      },
    ],
    [selectedExperiment],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      suppressMovable: true,
    }),
    [],
  );

  const getRowStyle = useCallback(
    (params) => {
      if (selectedExperiment?.id === params.data.id) {
        return { backgroundColor: "#EEF2FF", borderLeft: "3px solid #6366F1" };
      }
      if (params.node.rowIndex % 2 === 0) {
        return { backgroundColor: "#FAFAFA" };
      }
      return {};
    },
    [selectedExperiment],
  );

  const onRowClicked = useCallback((params) => {
    setSelectedExperiment(params.data);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
        로딩 중...
      </div>
    );
  }

  // 과제 미선택 상태
  if (!selectedProject) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">실험 진행</h2>
          <p className="text-sm text-gray-500">
            과제를 선택하여 실험 진행 현황을 확인하세요.
          </p>
        </div>

        {/* 검색 */}
        <div className="relative">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="과제명 검색..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition"
          />
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* 과제 카드 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => {
                setSelectedProject(project);
                setActiveTab("experiments");
              }}
              className="text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition cursor-pointer"
            >
              <h3 className="font-bold text-gray-800 text-sm mb-1.5">
                {project.iacpj_nm}
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {project.iacpj_mod_n && <span>모듈: {project.iacpj_mod_n}</span>}
                {project.iacpj_ch_n && <span>PM: {project.iacpj_ch_n}</span>}
                {project.ia_ta_grd_n && (
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium">
                    {project.ia_ta_grd_n}
                  </span>
                )}
              </div>
            </button>
          ))}
          {filteredProjects.length === 0 && (
            <p className="text-gray-400 text-sm col-span-2 text-center py-8">
              {searchText ? "검색 결과가 없습니다." : "등록된 과제가 없습니다."}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 과제 선택됨 - 메인 뷰
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 과제 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedProject(null)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition"
          title="과제 목록으로"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {selectedProject.iacpj_nm}
          </h1>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            {selectedProject.iacpj_mod_n && (
              <span>모듈: {selectedProject.iacpj_mod_n}</span>
            )}
            {selectedProject.iacpj_ch_n && <span>PM: {selectedProject.iacpj_ch_n}</span>}
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 내용 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {/* 실험 정보 탭 */}
        {activeTab === "experiments" && (
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-gray-700">실험 List</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                실험 {experiments.length}건 — 평가 아이템을 클릭하면 상세 정보를
                확인할 수 있습니다.
              </p>
            </div>

            {experiments.length > 0 ? (
              <div
                style={{
                  width: "100%",
                  height: Math.max(experiments.length * 42 + 50, 150),
                  maxHeight: 300,
                }}
              >
                <AgGridReact
                  rowData={experiments}
                  columnDefs={expColDefs}
                  defaultColDef={defaultColDef}
                  getRowStyle={getRowStyle}
                  headerHeight={40}
                  rowHeight={42}
                  suppressCellFocus={true}
                  onRowClicked={onRowClicked}
                  animateRows={true}
                />
              </div>
            ) : (
              <p className="text-gray-400 text-center py-6 text-sm">
                이 과제에 등록된 실험이 없습니다.
              </p>
            )}

            {/* 선택된 실험의 LOT 상세 */}
            {selectedExperiment && (
              <LotDetail experiment={selectedExperiment} />
            )}
          </div>
        )}

        {/* 과제 Checklist 탭 */}
        {activeTab === "checklist" && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400 text-sm">준비 중인 기능입니다</p>
          </div>
        )}

        {/* 과제 정보 탭 */}
        {activeTab === "info" && (
          <ProjectInfoTab project={selectedProject} />
        )}
      </div>
    </div>
  );
}

export default ExperimentProgress;
