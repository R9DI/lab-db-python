import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import SplitTable from "../components/SplitTable";

ModuleRegistry.registerModules([AllCommunityModule]);

/* ─── 상태 상수 ─── */
const STATUS = {
  BEFORE_ASSIGN: "Assign 전",
  IN_PROGRESS: "실험 진행 중",
  DONE_NO_RESULT: "실험 종료(결과 등록 전)",
  DONE_COMPLETE: "실험 종료(결과 완료)",
};

const FAB_OPTIONS = ["In Fab", "Fab Out", "EPM", "WT"];

const fabStyles = {
  "In Fab": { bg: "bg-blue-100", text: "text-blue-700" },
  "Fab Out": { bg: "bg-purple-100", text: "text-purple-700" },
  EPM: { bg: "bg-teal-100", text: "text-teal-700" },
  WT: { bg: "bg-orange-100", text: "text-orange-700" },
};

/* ─── 상태별 스타일 ─── */
const statusStyles = {
  [STATUS.BEFORE_ASSIGN]: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
  [STATUS.IN_PROGRESS]: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  [STATUS.DONE_NO_RESULT]: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  [STATUS.DONE_COMPLETE]: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
};

/* ─── 모달 컴포넌트 ─── */
function Modal({ title, onClose, children, footer }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="p-6 overflow-auto flex-1">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Summary 모달 내용 ─── */
function SummaryContent({ experiment, project }) {
  const expFields = [
    { label: "Plan ID", value: experiment?.plan_id },
    { label: "팀", value: experiment?.team },
    { label: "요청자", value: experiment?.requester },
    { label: "LOT 코드", value: experiment?.lot_code },
    { label: "모듈", value: experiment?.module },
    { label: "WF 방향", value: experiment?.wf_direction },
    { label: "평가 공정", value: experiment?.eval_process },
    { label: "평가 카테고리", value: experiment?.eval_category },
    { label: "평가 항목", value: experiment?.eval_item },
    { label: "LOT 요청", value: experiment?.lot_request },
    { label: "참고", value: experiment?.reference },
    { label: "Volume Split", value: experiment?.volume_split },
    { label: "배정 WF", value: experiment?.assign_wf },
  ];

  const projFields = [
    { label: "과제명", value: project?.iacpj_nm },
    { label: "모듈", value: project?.iacpj_mod_n },
    { label: "PM", value: project?.iacpj_ch_n },
    { label: "과제 코드", value: project?.iacpj_itf_uno },
    { label: "개발 분류", value: project?.iacpj_tgt_n },
    { label: "과제 등급", value: project?.ia_ta_grd_n },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-1">
          🧪 실험 조건
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {expFields.map(
            ({ label, value }) =>
              value && (
                <div key={label}>
                  <span className="text-[11px] text-gray-500">{label}</span>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              ),
          )}
        </div>
      </div>

      {project && (
        <div>
          <h4 className="text-sm font-bold text-indigo-700 mb-3 flex items-center gap-1">
            📁 과제 정보
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {projFields.map(
              ({ label, value }) =>
                value && (
                  <div key={label}>
                    <span className="text-[11px] text-gray-500">{label}</span>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                ),
            )}
          </div>
          {project.project_purpose && (
            <div className="mt-3">
              <span className="text-[11px] text-gray-500">과제 목적</span>
              <p className="text-sm text-gray-700 mt-0.5">
                {project.project_purpose}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── 메인 컴포넌트 ─── */
function LotAssign() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [splitModal, setSplitModal] = useState(null);
  const [summaryModal, setSummaryModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // { experimentId, evalItem }
  const [lineLots, setLineLots] = useState([]);

  // 데이터 로드
  const fetchExperiments = useCallback(async () => {
    try {
      const res = await axios.get("/api/experiments");
      setExperiments(res.data);
    } catch (err) {
      console.error("실험 목록 로드 실패:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  // 테이블 분리
  const pendingExperiments = useMemo(
    () =>
      experiments.filter(
        (e) => (e.status || STATUS.BEFORE_ASSIGN) === STATUS.BEFORE_ASSIGN,
      ),
    [experiments],
  );
  const activeExperiments = useMemo(
    () =>
      experiments.filter(
        (e) => (e.status || STATUS.BEFORE_ASSIGN) !== STATUS.BEFORE_ASSIGN,
      ),
    [experiments],
  );

  // Fab 상태 변경 핸들러 (Status 자동 계산)
  const handleFabChange = useCallback(
    async (id, fabStatus) => {
      try {
        await axios.patch(`/api/experiments/${id}/fab-status`, {
          fab_status: fabStatus,
        });
        fetchExperiments();
      } catch (err) {
        console.error("Fab 상태 변경 실패:", err);
      }
    },
    [fetchExperiments],
  );

  // Assign 모달 열기 (lot 목록 + 실험 Split Table 정보 로드)
  const openAssignModal = useCallback(async (experimentData) => {
    try {
      const [lotsRes, expRes] = await Promise.all([
        axios.get("/api/line-lots"),
        axios.get(`/api/experiments/${experimentData.id}`),
      ]);
      // Split Table의 첫 번째 oper_nm 추출
      const splits = expRes.data.splits || [];
      const targetStep = splits.length > 0 ? splits[0].oper_nm : null;
      setLineLots(lotsRes.data);
      setAssignModal({
        experimentId: experimentData.id,
        evalItem: experimentData.eval_item || "미입력",
        projectName: experimentData.iacpj_nm,
        targetStep,
      });
    } catch (err) {
      console.error("라인 자재 목록 로드 실패:", err);
    }
  }, []);

  // Lot 배정 처리
  const handleAssignLot = useCallback(
    async (lotId) => {
      if (!assignModal) return;
      try {
        await axios.patch(
          `/api/experiments/${assignModal.experimentId}/assign-lot`,
          { lot_id: lotId },
        );
        setAssignModal(null);
        fetchExperiments();
      } catch (err) {
        console.error("Lot 배정 실패:", err);
        alert("Lot 배정에 실패했습니다.");
      }
    },
    [assignModal, fetchExperiments],
  );

  // 완료 토글 핸들러
  const handleComplete = useCallback(async (id, field, value) => {
    try {
      await axios.patch(`/api/experiments/${id}/complete`, { field, value });
      // 로컬 상태 업데이트
      setExperiments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, [field]: value ? 1 : 0 } : e)),
      );
    } catch (err) {
      console.error("완료 처리 실패:", err);
    }
  }, []);

  // Split Table 모달 열기 (source: 'pending' | 'active')
  const openSplitModal = useCallback(async (data, source = "pending") => {
    try {
      const res = await axios.get(`/api/experiments/${data.id}`);
      setSplitModal({
        id: data.id,
        planId: data.plan_id,
        evalItem: data.eval_item || data.plan_id,
        splits: res.data.splits || [],
        splitCompleted: !!data.split_completed,
        source,
      });
    } catch (err) {
      console.error("Split 데이터 로드 실패:", err);
    }
  }, []);

  // Summary 모달 열기 (source: 'active' only)
  const openSummaryModal = useCallback(async (data, source = "active") => {
    try {
      const res = await axios.get(`/api/experiments/${data.id}`);
      setSummaryModal({
        id: data.id,
        experiment: res.data,
        project: res.data.project,
        summaryCompleted: !!data.summary_completed,
        source,
      });
    } catch (err) {
      console.error("실험 상세 로드 실패:", err);
    }
  }, []);

  // ─── Status 셀 렌더러 (자동 계산 - 읽기 전용) ───
  const StatusAutoRenderer = useCallback((params) => {
    const currentStatus = params.data.status || STATUS.BEFORE_ASSIGN;
    const style =
      statusStyles[currentStatus] || statusStyles[STATUS.BEFORE_ASSIGN];

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        {currentStatus}
      </span>
    );
  }, []);

  // ─── Fab 드롭다운 렌더러 ───
  const FabSelectRenderer = useCallback(
    (params) => {
      const currentFab = params.data.fab_status || "";
      const style = fabStyles[currentFab] || {
        bg: "bg-gray-100",
        text: "text-gray-500",
      };

      return (
        <select
          value={currentFab}
          onChange={(e) => handleFabChange(params.data.id, e.target.value)}
          className={`text-xs font-semibold rounded-lg px-2 py-1 border-0 outline-none cursor-pointer ${style.bg} ${style.text}`}
          style={{ appearance: "auto" }}
        >
          <option value="" disabled>
            선택
          </option>
          {FAB_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      );
    },
    [handleFabChange],
  );

  // ─── 보기 전용 아이콘 렌더러 (상단 테이블) ───
  const ViewButtonRenderer = useCallback(
    (params) => {
      return (
        <button
          onClick={() => openSplitModal(params.data, "pending")}
          className="w-6 h-6 rounded border-2 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 flex items-center justify-center transition cursor-pointer"
          title="Split Table 보기"
        >
          <svg
            className="w-3.5 h-3.5 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
      );
    },
    [openSplitModal],
  );

  // ─── 체크박스 셀 렌더러 (하단 - 완료 체크박스 + 모달) ───
  const CheckboxModalRenderer = useCallback(
    (params) => {
      const type = params.colDef.field;
      const isCompleted =
        type === "split_view"
          ? !!params.data.split_completed
          : !!params.data.summary_completed;

      return (
        <button
          onClick={() => {
            if (type === "split_view") {
              openSplitModal(params.data, "active");
            } else {
              openSummaryModal(params.data, "active");
            }
          }}
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition cursor-pointer ${
            isCompleted
              ? "border-emerald-500 bg-emerald-500"
              : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
          }`}
          title={type === "split_view" ? "Split Table" : "Summary"}
        >
          {isCompleted ? (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-3.5 h-3.5 text-indigo-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      );
    },
    [openSplitModal, openSummaryModal],
  );

  // ─── Assign 모달 용 Lot 목록 컨럼 정의 ───
  const lotColDefs = useMemo(
    () => [
      {
        headerName: "Lot ID",
        field: "lot_id",
        width: 110,
        cellStyle: { fontWeight: "600", color: "#6366F1" },
      },
      {
        headerName: "Current Step",
        field: "current_step",
        minWidth: 150,
        flex: 1,
      },
      {
        headerName: "Target Step",
        field: "target_step",
        width: 130,
        cellStyle: { color: "#059669", fontWeight: "500" },
        valueGetter: () => assignModal?.targetStep || "-",
      },
      {
        headerName: "예상 도달",
        field: "estimated_arrival",
        width: 135,
        sort: "asc",
        valueFormatter: (params) => {
          if (!params.value) return "-";
          const d = new Date(params.value);
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          const hh = String(d.getHours()).padStart(2, "0");
          const mi = String(d.getMinutes()).padStart(2, "0");
          return `${mm}/${dd} ${hh}:${mi}`;
        },
        cellStyle: (params) => {
          if (!params.value) return {};
          const diff = new Date(params.value) - Date.now();
          const hours = diff / 3600000;
          if (hours <= 3) return { color: "#DC2626", fontWeight: "600" };
          if (hours <= 12) return { color: "#D97706", fontWeight: "500" };
          return { color: "#6B7280" };
        },
      },
      {
        headerName: "FAC",
        field: "fac_id",
        width: 70,
      },
      {
        headerName: "",
        field: "action",
        width: 90,
        cellRenderer: (params) => (
          <button
            onClick={() => handleAssignLot(params.data.lot_id)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm cursor-pointer"
          >
            선택
          </button>
        ),
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        sortable: false,
        filter: false,
      },
    ],
    [handleAssignLot, assignModal],
  );

  // ─── 상단 테이블 (Assign 전) 컨럼 ───
  const pendingColDefs = useMemo(
    () => [
      {
        headerName: "평가 항목",
        field: "eval_item",
        minWidth: 180,
        flex: 2,
        cellStyle: { fontWeight: "600" },
      },
      {
        headerName: "과제명",
        field: "iacpj_nm",
        minWidth: 160,
        flex: 2,
      },
      {
        headerName: "Assign",
        field: "status",
        width: 130,
        cellRenderer: (params) => (
          <button
            onClick={() => openAssignModal(params.data)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm cursor-pointer"
          >
            📦 Assign
          </button>
        ),
        cellStyle: { display: "flex", alignItems: "center" },
        sortable: false,
        filter: false,
      },
      {
        headerName: "Split Table",
        field: "split_view",
        width: 100,
        cellRenderer: ViewButtonRenderer,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        sortable: false,
        filter: false,
      },
    ],
    [openAssignModal, ViewButtonRenderer],
  );

  // ─── 하단 테이블 (진행 중) 컬럼 ───
  const activeColDefs = useMemo(
    () => [
      {
        headerName: "평가 항목",
        field: "eval_item",
        minWidth: 180,
        flex: 2,
        cellStyle: { fontWeight: "600" },
      },
      {
        headerName: "과제명",
        field: "iacpj_nm",
        minWidth: 160,
        flex: 2,
      },
      {
        headerName: "Plan ID",
        field: "plan_id",
        width: 130,
        cellStyle: { color: "#6366F1", fontWeight: "500" },
      },
      {
        headerName: "Fab",
        field: "fab_status",
        width: 100,
        cellRenderer: FabSelectRenderer,
        cellStyle: { display: "flex", alignItems: "center" },
      },
      {
        headerName: "Status",
        field: "status",
        width: 190,
        cellRenderer: StatusAutoRenderer,
        cellStyle: { display: "flex", alignItems: "center" },
      },
      {
        headerName: "Split Table",
        field: "split_view",
        width: 100,
        cellRenderer: CheckboxModalRenderer,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        sortable: false,
        filter: false,
      },
      {
        headerName: "Summary",
        field: "summary_view",
        width: 100,
        cellRenderer: CheckboxModalRenderer,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        sortable: false,
        filter: false,
      },
    ],
    [FabSelectRenderer, StatusAutoRenderer, CheckboxModalRenderer],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      suppressMovable: true,
    }),
    [],
  );

  const getRowStyle = useCallback((params) => {
    if (params.node.rowIndex % 2 === 0) {
      return { backgroundColor: "#FAFAFA" };
    }
    return {};
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ─── 상단: Assign 전 ─── */}
      <div>
        <div className="mb-3">
          <h2 className="text-xl font-bold text-gray-800">실험 Lot Assign</h2>
          <p className="text-sm text-gray-500 mt-1">
            Lot 배정 대기 중인 실험 —{" "}
            <b className="text-gray-700">{pendingExperiments.length}건</b>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          {pendingExperiments.length > 0 ? (
            <div
              style={{
                width: "100%",
                height: Math.max(pendingExperiments.length * 42 + 50, 150),
                maxHeight: 400,
              }}
            >
              <AgGridReact
                rowData={pendingExperiments}
                columnDefs={pendingColDefs}
                defaultColDef={defaultColDef}
                getRowStyle={getRowStyle}
                headerHeight={40}
                rowHeight={42}
                suppressCellFocus={true}
                animateRows={true}
              />
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6">
              배정 대기 중인 실험이 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* ─── 하단: 진행 중 + 종료 ─── */}
      <div>
        <div className="mb-3">
          <h2 className="text-xl font-bold text-gray-800">실험 진행 현황</h2>
          <p className="text-sm text-gray-500 mt-1">
            자재가 배정되어 진행 중인 실험 —{" "}
            <b className="text-indigo-600">{activeExperiments.length}건</b>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          {activeExperiments.length > 0 ? (
            <div
              style={{
                width: "100%",
                height: Math.max(activeExperiments.length * 42 + 50, 150),
                maxHeight: 500,
              }}
            >
              <AgGridReact
                rowData={activeExperiments}
                columnDefs={activeColDefs}
                defaultColDef={defaultColDef}
                getRowStyle={getRowStyle}
                headerHeight={40}
                rowHeight={42}
                suppressCellFocus={true}
                animateRows={true}
              />
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6">
              진행 중인 실험이 없습니다. 상단에서 실험을 배정해주세요.
            </p>
          )}
        </div>
      </div>

      {/* ─── Split Table Modal ─── */}
      {splitModal && (
        <Modal
          title={`📋 Split Table — ${splitModal.evalItem} (${splitModal.planId})`}
          onClose={() => setSplitModal(null)}
          footer={
            splitModal.source === "active" ? (
              <button
                onClick={async () => {
                  const newVal = !splitModal.splitCompleted;
                  await handleComplete(
                    splitModal.id,
                    "split_completed",
                    newVal,
                  );
                  setSplitModal((prev) => ({
                    ...prev,
                    splitCompleted: newVal,
                  }));
                }}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  splitModal.splitCompleted
                    ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg"
                }`}
              >
                {splitModal.splitCompleted
                  ? "✅ Split Table 작성 완료됨"
                  : "Split Table 작성 완료"}
              </button>
            ) : null
          }
        >
          {splitModal.splits.length > 0 ? (
            <SplitTable splits={splitModal.splits} />
          ) : (
            <p className="text-gray-400 text-center py-8">
              등록된 Split 데이터가 없습니다.
            </p>
          )}
        </Modal>
      )}

      {/* ─── Summary Modal ─── */}
      {summaryModal && (
        <Modal
          title={`📝 실험 Summary — ${summaryModal.experiment.eval_item || summaryModal.experiment.plan_id}`}
          onClose={() => setSummaryModal(null)}
          footer={
            <button
              onClick={async () => {
                const newVal = !summaryModal.summaryCompleted;
                await handleComplete(
                  summaryModal.id,
                  "summary_completed",
                  newVal,
                );
                setSummaryModal((prev) => ({
                  ...prev,
                  summaryCompleted: newVal,
                }));
              }}
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                summaryModal.summaryCompleted
                  ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg"
              }`}
            >
              {summaryModal.summaryCompleted
                ? "✅ Summary 작성 완료됨"
                : "Summary 작성 완료"}
            </button>
          }
        >
          <SummaryContent
            experiment={summaryModal.experiment}
            project={summaryModal.project}
          />
        </Modal>
      )}
      {/* ─── Assign Modal (Lot 선택) ─── */}
      {assignModal && (
        <Modal
          title={`📦 Lot 배정 — ${assignModal.evalItem}`}
          onClose={() => setAssignModal(null)}
        >
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">
                {assignModal.evalItem}
              </span>{" "}
              실험에 배정할 Lot을 선택해주세요.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              과제: {assignModal.projectName} · 현재 라인에 있는 자재{" "}
              {lineLots.length}건
              {assignModal.targetStep && (
                <span className="ml-2">
                  · Target:
                  <span className="text-emerald-600 font-semibold ml-1">
                    {assignModal.targetStep}
                  </span>
                </span>
              )}
            </p>
            <p className="text-[11px] text-gray-300 mt-0.5">
              💡 예상 도달 시점이 가까운 순으로 정렬됩니다
            </p>
          </div>
          {lineLots.length > 0 ? (
            <div
              style={{
                width: "100%",
                height: Math.max(lineLots.length * 42 + 50, 150),
                maxHeight: 400,
              }}
            >
              <AgGridReact
                rowData={lineLots}
                columnDefs={lotColDefs}
                defaultColDef={defaultColDef}
                headerHeight={40}
                rowHeight={42}
                suppressCellFocus={true}
                animateRows={true}
              />
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              배정 가능한 자재가 없습니다.
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}

export default LotAssign;
