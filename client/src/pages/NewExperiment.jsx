import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

/* ─── 기본 빈 양식 ─── */
const emptyProject = {
  iacpj_nm: "",
  iacpj_mod_n: "",
  iacpj_ch_n: "",
  iacpj_itf_uno: "",
  iacpj_tgt_n: "",
  iacpj_level: "",
  iacpj_tech_n: "",
  ia_ta_grd_n: "",
  project_purpose: "",
  iacpj_ta_goa: "",
};

const emptyExperiment = {
  project_name: "",
  team: "",
  requester: "",
  lot_code: "",
  module: "",
  wf_direction: "",
  eval_process: "",
  prev_eval: "",
  cross_experiment: "",
  eval_category: "",
  eval_item: "",
  lot_request: "",
  reference: "",
  volume_split: "",
  assign_wf: "",
};

const emptySplit = {
  plan_id: "",
  fac_id: "",
  oper_id: "",
  oper_nm: "",
  eps_lot_gbn_cd: "base",
  work_cond_desc: "",
  eqp_id: "",
  recipe_id: "",
  note: "",
  user_def_val_1: "",
  user_def_val_2: "",
  user_def_val_3: "",
  user_def_val_4: "",
  user_def_val_5: "",
  user_def_val_6: "",
  user_def_val_7: "",
  user_def_val_8: "",
  user_def_val_9: "",
  user_def_val_10: "",
  user_def_val_11: "",
  user_def_val_12: "",
  user_def_val_13: "",
  user_def_val_14: "",
  user_def_val_15: "",
};

/* ─── 필드 정의 ─── */
const projectFields = [
  { key: "iacpj_nm", label: "과제명 *" },
  { key: "iacpj_mod_n", label: "모듈" },
  { key: "iacpj_ch_n", label: "PM" },
  { key: "iacpj_itf_uno", label: "과제 코드" },
  { key: "iacpj_tgt_n", label: "개발 분류" },
  { key: "iacpj_level", label: "검증 레벨" },
  { key: "iacpj_tech_n", label: "1차 대상 기술" },
  { key: "ia_ta_grd_n", label: "과제 등급" },
];

const experimentFields = [
  { key: "eval_item", label: "평가 항목 *" },
  { key: "project_name", label: "과제명 *" },
  { key: "team", label: "팀" },
  { key: "requester", label: "요청자" },
  { key: "lot_code", label: "LOT 코드" },
  { key: "module", label: "모듈" },
  { key: "wf_direction", label: "WF 방향" },
  { key: "eval_process", label: "평가 공정" },
  { key: "eval_category", label: "평가 카테고리" },
  { key: "lot_request", label: "LOT 요청" },
  { key: "reference", label: "참고" },
  { key: "volume_split", label: "Volume Split" },
  { key: "assign_wf", label: "배정 WF" },
];

function NewExperiment() {
  const location = useLocation();
  const navigate = useNavigate();
  const sourceResult = location.state?.sourceResult;

  // Source experiment reference info
  const [sourceInfo, setSourceInfo] = useState(null);

  // Editable forms
  const [project, setProject] = useState({ ...emptyProject });
  const [experiment, setExperiment] = useState({ ...emptyExperiment });
  const [splits, setSplits] = useState([{ ...emptySplit }]);

  // UI state
  const [activeSection, setActiveSection] = useState("experiment");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  // Pre-fill from source experiment if navigated from Search
  useEffect(() => {
    if (sourceResult) {
      const {
        experiment: srcExp,
        project: srcProj,
        splits: srcSplits,
      } = sourceResult;

      setSourceInfo({
        plan_id: srcExp.plan_id,
        eval_item: srcExp.eval_item,
        project_name: srcExp.project_name,
      });

      // Pre-fill project — user will probably reuse same project
      if (srcProj) {
        const filledProject = { ...emptyProject };
        for (const key of Object.keys(filledProject)) {
          if (srcProj[key]) filledProject[key] = srcProj[key];
        }
        setProject(filledProject);
      }

      // Pre-fill experiment — clear plan_id so user creates a new one
      if (srcExp) {
        const filledExp = { ...emptyExperiment };
        for (const key of Object.keys(filledExp)) {
          if (srcExp[key] != null) filledExp[key] = String(srcExp[key]);
        }
        filledExp.plan_id = ""; // 새 ID 필요
        setExperiment(filledExp);
      }

      // Pre-fill splits — clear plan_id
      if (srcSplits && srcSplits.length > 0) {
        const filledSplits = srcSplits.map((s) => {
          const row = { ...emptySplit };
          for (const key of Object.keys(row)) {
            if (s[key] != null) row[key] = String(s[key]);
          }
          row.plan_id = ""; // plan_id는 새 실험에 맞게 사용자가 입력
          return row;
        });
        setSplits(filledSplits);
      }
    }
  }, [sourceResult]);

  const updateProject = (key, val) => setProject({ ...project, [key]: val });
  const updateExperiment = (key, val) =>
    setExperiment({ ...experiment, [key]: val });
  const updateSplit = (idx, key, val) => {
    const copy = [...splits];
    copy[idx] = { ...copy[idx], [key]: val };
    setSplits(copy);
  };
  const addSplit = () =>
    setSplits([...splits, { ...emptySplit, plan_id: experiment.plan_id }]);
  const removeSplit = (idx) => {
    if (splits.length <= 1) return;
    setSplits(splits.filter((_, i) => i !== idx));
  };
  const duplicateSplit = (idx) => {
    const copy = { ...splits[idx] };
    setSplits([...splits.slice(0, idx + 1), copy, ...splits.slice(idx + 1)]);
  };

  // plan_id 동기화: 실험의 plan_id가 바뀌면 splits도 업데이트
  const syncPlanId = () => {
    if (experiment.plan_id) {
      setSplits(splits.map((s) => ({ ...s, plan_id: experiment.plan_id })));
    }
  };

  // AG Grid ref for split table
  const splitGridRef = useRef(null);

  // WF toggle cell renderer — 같은 oper_id+oper_nm 그룹 내 웨이퍼 중복 배정 방지
  const WfCellRenderer = useCallback((params) => {
    const isOn = params.value === "O";
    const field = params.colDef.field;
    const currentRow = params.data;
    const operId = currentRow.oper_id;
    const operNm = currentRow.oper_nm;

    // 같은 oper_id+oper_nm 그룹에서 이 웨이퍼가 이미 다른 행에 배정되었는지 확인
    let conflictSplit = null;
    if (!isOn && operId && operNm) {
      params.api.forEachNode((node) => {
        if (node === params.node) return;
        const d = node.data;
        if (d.oper_id === operId && d.oper_nm === operNm && d[field] === "O") {
          conflictSplit = d.eps_lot_gbn_cd || "다른 행";
        }
      });
    }

    const isBlocked = conflictSplit !== null;

    return (
      <button
        onClick={() => {
          if (isBlocked) {
            alert(
              `이 웨이퍼는 같은 공정(${operId} / ${operNm})의 "${conflictSplit}" 에 이미 배정되어 있습니다.`,
            );
            return;
          }
          const newVal = isOn ? "" : "O";
          params.node.setDataValue(field, newVal);
        }}
        title={
          isBlocked
            ? `${conflictSplit}에 배정됨`
            : isOn
              ? "클릭하여 해제"
              : "클릭하여 배정"
        }
        className={`w-6 h-6 rounded text-[10px] font-bold border transition ${
          isOn
            ? "bg-amber-400 text-white border-amber-500"
            : isBlocked
              ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-300 border-gray-200 hover:border-amber-300"
        }`}
      >
        {isOn ? "O" : isBlocked ? "—" : ""}
      </button>
    );
  }, []);

  const splitColumnDefs = useMemo(
    () => [
      { headerName: "FAC", field: "fac_id", width: 65 },
      { headerName: "OPER_ID", field: "oper_id", width: 110 },
      { headerName: "공정명", field: "oper_nm", width: 120 },
      {
        headerName: "Split",
        field: "eps_lot_gbn_cd",
        width: 80,
        cellStyle: (params) => {
          if (params.value === "base")
            return {
              backgroundColor: "#DBEAFE",
              color: "#1E40AF",
              fontWeight: "600",
            };
          return {
            backgroundColor: "#FEF3C7",
            color: "#92400E",
            fontWeight: "600",
          };
        },
      },
      { headerName: "조건", field: "work_cond_desc", minWidth: 180, flex: 1 },
      { headerName: "장비", field: "eqp_id", width: 90 },
      { headerName: "Recipe", field: "recipe_id", width: 140 },
      ...Array.from({ length: 15 }, (_, i) => ({
        headerName: `W${i + 1}`,
        field: `user_def_val_${i + 1}`,
        width: 48,
        editable: false,
        cellRenderer: WfCellRenderer,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0",
        },
      })),
      { headerName: "Note", field: "note", minWidth: 120, flex: 1 },
    ],
    [WfCellRenderer],
  );

  const splitDefaultColDef = useMemo(
    () => ({
      editable: true,
      resizable: true,
      suppressMovable: true,
    }),
    [],
  );

  const onSplitCellValueChanged = useCallback((event) => {
    const updatedData = [];
    event.api.forEachNode((node) => updatedData.push(node.data));
    setSplits(updatedData);
  }, []);

  const getSplitRowStyle = useCallback((params) => {
    if (params.data.eps_lot_gbn_cd === "base")
      return { backgroundColor: "#EFF6FF" };
    return { backgroundColor: "#FFFBEB" };
  }, []);

  const handleGridAddRow = () => {
    addSplit();
  };

  const handleGridDuplicateRow = () => {
    const selected = splitGridRef.current?.api?.getSelectedNodes();
    if (selected && selected.length > 0) {
      const idx = selected[0].rowIndex;
      duplicateSplit(idx);
    }
  };

  const handleGridDeleteRow = () => {
    const selected = splitGridRef.current?.api?.getSelectedNodes();
    if (selected && selected.length > 0 && splits.length > 1) {
      const idx = selected[0].rowIndex;
      removeSplit(idx);
    }
  };

  const handleSave = async () => {
    if (!experiment.eval_item?.trim()) {
      alert("평가 항목을 입력해주세요.");
      return;
    }
    if (!experiment.project_name.trim()) {
      alert("과제명을 입력해주세요.");
      return;
    }

    setSaving(true);
    setSaveResult(null);

    try {
      const results = {};

      // 실험 조건의 과제명으로 과제 정보도 동기화
      const syncedProject = {
        ...project,
        iacpj_nm: experiment.project_name,
      };

      // 1. 과제 저장 (이미 있으면 무시됨)
      try {
        await axios.post("/api/projects", syncedProject);
        results.project = "새로 생성";
      } catch (err) {
        if (err.response?.status === 409) {
          results.project = "기존 과제 사용";
        } else {
          throw err;
        }
      }

      // 2. 실험 저장 (JSON 직접 호출)
      const expRes = await axios.post("/api/experiments", experiment);
      results.experiment = expRes.data ? "1건 저장" : "저장 실패";

      // 3. 스플릿 저장 (plan_id가 없으므로 experiment id 기반으로 임시 저장)
      if (
        splits.length > 0 &&
        splits.some((s) => s.oper_nm || s.work_cond_desc)
      ) {
        // 실험 ID를 plan_id로 사용해서 split 저장 (나중에 lot 배정 시 업데이트)
        const tempPlanId = `EXP-${expRes.data.id}`;
        await axios.patch(`/api/experiments/${expRes.data.id}/status`, {
          status: "Assign 전",
        });
        const splitRes = await axios.post(
          `/api/experiments/${tempPlanId}/splits`,
          { splits },
        );
        results.splits = `${splitRes.data.count || splits.length}건 저장`;
      }

      setSaveResult({ type: "success", details: results });

      // 저장 성공 후 Lot Assign 페이지로 자동 이동
      setTimeout(() => {
        navigate("/lot-assign");
      }, 1500);
    } catch (err) {
      console.error("Save error:", err);
      setSaveResult({
        type: "error",
        message:
          err.response?.data?.error || err.message || "저장 중 오류 발생",
      });
    }
    setSaving(false);
  };

  const sectionBtns = [
    {
      key: "experiment",
      label: "🧪 실험 조건",
      active: "border-emerald-500 text-emerald-700 bg-emerald-50",
    },
    {
      key: "project",
      label: "📁 과제 정보",
      active: "border-indigo-500 text-indigo-700 bg-indigo-50",
    },
    {
      key: "splits",
      label: "📋 Split Table",
      active: "border-amber-500 text-amber-700 bg-amber-50",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">신규 실험 신청</h1>
          <p className="text-sm text-gray-500 mt-1">
            실험 계획의 초안을 작성하고 DB에 저장합니다
          </p>
        </div>
        <button
          onClick={() => navigate("/search")}
          className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition"
        >
          ← 실험 탐색으로
        </button>
      </div>

      {/* Source info banner */}
      {sourceInfo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm flex items-start gap-3">
          <span className="text-lg">📌</span>
          <div>
            <p className="font-semibold text-emerald-800">
              참조 실험 기반 초안
            </p>
            <p className="text-emerald-700 mt-0.5">
              <b>{sourceInfo.eval_item}</b> ({sourceInfo.plan_id}) —{" "}
              {sourceInfo.project_name}
            </p>
            <p className="text-emerald-600 text-xs mt-1">
              이 초안은 위 실험에서 가져왔습니다. 필요한 항목을 수정한 후
              저장하세요.
              <strong> Plan ID는 반드시 새로 지정</strong>해야 합니다.
            </p>
          </div>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-1">
        {sectionBtns.map(({ key, label, active }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition border-b-2 ${
              activeSection === key
                ? active
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── 실험 조건 ─── */}
      {activeSection === "experiment" && (
        <div className="bg-white rounded-xl border border-emerald-200 p-6">
          <h2 className="text-lg font-bold text-emerald-800 mb-4">
            🧪 실험 조건
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {experimentFields.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  value={experiment[key]}
                  onChange={(e) => updateExperiment(key, e.target.value)}
                  onBlur={key === "plan_id" ? syncPlanId : undefined}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 ${
                    key === "plan_id" && !experiment.plan_id
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder={
                    key === "plan_id" ? "새 Plan ID 입력 (필수)" : ""
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 과제 정보 ─── */}
      {activeSection === "project" && (
        <div className="bg-white rounded-xl border border-indigo-200 p-6">
          <h2 className="text-lg font-bold text-indigo-800 mb-1">
            📁 과제 정보
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            이미 DB에 과제가 있으면 자동으로 기존 과제를 사용합니다.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {projectFields.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  value={project[key]}
                  onChange={(e) => updateProject(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                과제 목적
              </label>
              <textarea
                value={project.project_purpose}
                onChange={(e) =>
                  updateProject("project_purpose", e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                과제 목표
              </label>
              <textarea
                value={project.iacpj_ta_goa}
                onChange={(e) => updateProject("iacpj_ta_goa", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Split Table (AG Grid Editable) ─── */}
      {activeSection === "splits" && (
        <div className="bg-white rounded-xl border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-amber-800">
                📋 Split Table
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                plan_id:{" "}
                <b className="text-amber-700">
                  {experiment.plan_id || "(실험 조건에서 먼저 입력)"}
                </b>{" "}
                — {splits.length}건 | 셀을 더블클릭하여 편집
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGridAddRow}
                className="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition font-medium"
              >
                + 행 추가
              </button>
              <button
                onClick={handleGridDuplicateRow}
                className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition font-medium"
              >
                📋 복제
              </button>
              <button
                onClick={handleGridDeleteRow}
                className="px-3 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition font-medium"
              >
                ✕ 삭제
              </button>
            </div>
          </div>
          <div
            style={{
              width: "100%",
              height: Math.max(splits.length * 42 + 50, 200),
            }}
          >
            <AgGridReact
              ref={splitGridRef}
              rowData={splits}
              columnDefs={splitColumnDefs}
              defaultColDef={splitDefaultColDef}
              getRowStyle={getSplitRowStyle}
              onCellValueChanged={onSplitCellValueChanged}
              headerHeight={36}
              rowHeight={36}
              rowSelection="single"
              stopEditingWhenCellsLoseFocus={true}
            />
          </div>
        </div>
      )}

      {/* ─── 하단 저장 영역 ─── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">요약</span>: 과제{" "}
          <b className="text-indigo-600">{project.iacpj_nm || "—"}</b> |
          실험 <b className="text-emerald-600">{experiment.plan_id || "—"}</b> |
          Split <b className="text-amber-600">{splits.length}건</b>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50"
        >
          {saving ? "저장 중..." : "Assign 요청"}
        </button>
      </div>

      {/* Save result */}
      {saveResult && (
        <div
          className={`rounded-xl p-4 text-sm ${
            saveResult.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {saveResult.type === "success" ? (
            <div>
              <p className="font-bold mb-1">✅ 저장 완료!</p>
              <ul className="list-disc ml-4 space-y-0.5">
                <li>과제: {saveResult.details.project}</li>
                <li>실험: {saveResult.details.experiment}</li>
                {saveResult.details.splits && (
                  <li>Split: {saveResult.details.splits}</li>
                )}
              </ul>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                >
                  통합 DB Board에서 확인 →
                </button>
                <button
                  onClick={() => {
                    setExperiment({ ...emptyExperiment });
                    setSplits([{ ...emptySplit }]);
                    setSourceInfo(null);
                    setSaveResult(null);
                    setActiveSection("experiment");
                  }}
                  className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
                >
                  새 실험 작성
                </button>
              </div>
            </div>
          ) : (
            <p>❌ {saveResult.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default NewExperiment;
