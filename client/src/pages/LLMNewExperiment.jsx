import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { Splitter } from "antd";
import axios from "axios";

ModuleRegistry.registerModules([AllCommunityModule]);

const SPLIT_COLORS = {
  base: { row: "#EFF6FF", cell: "#DBEAFE", text: "#1E40AF" },
  s1:   { row: "#FFFBEB", cell: "#FEF3C7", text: "#92400E" },
  s2:   { row: "#F0FDF4", cell: "#D1FAE5", text: "#065F46" },
  s3:   { row: "#F5F3FF", cell: "#EDE9FE", text: "#5B21B6" },
  s4:   { row: "#FFF1F2", cell: "#FFE4E6", text: "#9F1239" },
};
const DEFAULT_SPLIT = { row: "#F9FAFB", cell: "#F3F4F6", text: "#374151" };
const getSplitColor = (val) => SPLIT_COLORS[val] || DEFAULT_SPLIT;

const emptyProject = {
  iacpj_nm: "", iacpj_mod_n: "", iacpj_ch_n: "", iacpj_itf_uno: "",
  iacpj_tgt_n: "", iacpj_level: "", iacpj_tech_n: "", ia_ta_grd_n: "",
  project_purpose: "", iacpj_ta_goa: "",
};

const emptyExperiment = {
  iacpj_nm: "", team: "", requester: "", lot_code: "", module: "",
  wf_direction: "", eval_process: "", prev_eval: "", cross_experiment: "",
  eval_category: "", eval_item: "", lot_request: "", reference: "",
  volume_split: "", assign_wf: "", request_date: "",
};

const emptySplit = {
  plan_id: "", fac_id: "", oper_id: "", oper_nm: "", eps_lot_gbn_cd: "base",
  work_cond_desc: "", eqp_id: "", recipe_id: "", note: "",
  ...Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`user_def_val_${i + 1}`, ""])),
};

const projectFields = [
  { key: "iacpj_nm", label: "과제명 *" }, { key: "iacpj_mod_n", label: "모듈" },
  { key: "iacpj_ch_n", label: "PM" }, { key: "iacpj_itf_uno", label: "과제 코드" },
  { key: "iacpj_tgt_n", label: "개발 분류" }, { key: "iacpj_level", label: "검증 레벨" },
  { key: "iacpj_tech_n", label: "1차 대상 기술" }, { key: "ia_ta_grd_n", label: "과제 등급" },
];


/* ─── 채팅 패널 ─── */
function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "안녕하세요! 실험 계획 AI 도우미입니다.\n\n논문 검색, 과거 실험 비교, 조건 추천 등을 도와드릴 수 있습니다.\n\n(현재 개발 준비 중입니다)",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: input.trim() },
      { role: "assistant", content: "현재 Agent 기능 구현 중입니다. 곧 사용 가능합니다." },
    ]);
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-indigo-700 text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-sm">AI 실험 도우미</span>
        </div>
        <p className="text-xs text-indigo-200 mt-0.5">논문 · 과거 실험 · 조건 추천</p>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">
                AI
              </div>
            )}
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "bg-white border border-gray-200 text-gray-700 rounded-tl-sm shadow-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 예시 질문 칩 */}
      <div className="px-3 py-2 border-t border-gray-100 bg-white shrink-0">
        <p className="text-[10px] text-gray-400 mb-1.5">예시 질문</p>
        <div className="flex flex-wrap gap-1">
          {[
            "유사한 CMP 실험 찾아줘",
            "ESL Etch 관련 논문 요약",
            "Split 조건 추천해줘",
          ].map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 hover:bg-indigo-100 transition"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 입력창 */}
      <div className="px-3 py-3 border-t border-gray-200 bg-white shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={2}
            placeholder="질문을 입력하세요... (Enter로 전송)"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 메인 페이지 ─── */
function LLMNewExperiment() {
  const navigate = useNavigate();

  const [project, setProject] = useState({ ...emptyProject });
  const [experiment, setExperiment] = useState({ ...emptyExperiment });
  const [splits, setSplits] = useState([{ ...emptySplit }]);
  const [activeSection, setActiveSection] = useState("experiment");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  const updateProject = (key, val) => setProject((p) => ({ ...p, [key]: val }));
  const updateExperiment = (key, val) => setExperiment((e) => ({ ...e, [key]: val }));

  const syncPlanId = () => {
    if (experiment.plan_id) {
      setSplits((s) => s.map((row) => ({ ...row, plan_id: experiment.plan_id })));
    }
  };

  const addSplit = () => setSplits((s) => [...s, { ...emptySplit, plan_id: experiment.plan_id }]);
  const duplicateSplit = (idx) => setSplits((s) => [...s.slice(0, idx + 1), { ...s[idx] }, ...s.slice(idx + 1)]);
  const removeSplit = (idx) => { if (splits.length > 1) setSplits((s) => s.filter((_, i) => i !== idx)); };

  const splitGridRef = useRef(null);

  const WfCellRenderer = useCallback((params) => {
    const isOn = params.value === "O";
    const field = params.colDef.field;
    const { oper_id, oper_nm } = params.data;
    let conflictSplit = null;
    if (!isOn && oper_id && oper_nm) {
      params.api.forEachNode((node) => {
        if (node === params.node) return;
        const d = node.data;
        if (d.oper_id === oper_id && d.oper_nm === oper_nm && d[field] === "O") {
          conflictSplit = d.eps_lot_gbn_cd || "다른 행";
        }
      });
    }
    const isBlocked = conflictSplit !== null;
    return (
      <button
        onClick={() => {
          if (isBlocked) { alert(`이 웨이퍼는 "${conflictSplit}"에 이미 배정되어 있습니다.`); return; }
          params.node.setDataValue(field, isOn ? "" : "O");
        }}
        title={isBlocked ? `${conflictSplit}에 배정됨` : isOn ? "클릭하여 해제" : "클릭하여 배정"}
        className={`w-6 h-6 rounded text-xs font-bold border transition flex items-center justify-center ${
          isOn ? "bg-amber-400 text-white border-amber-500"
          : isBlocked ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
          : "bg-white text-gray-300 border-gray-200 hover:border-amber-300"
        }`}
      >
        {isOn ? "⬤" : isBlocked ? "—" : ""}
      </button>
    );
  }, []);

  const splitColumnDefs = useMemo(() => [
    { headerName: "FAC", field: "fac_id", width: 60 },
    { headerName: "OPER_ID", field: "oper_id", width: 100 },
    { headerName: "공정명", field: "oper_nm", width: 110 },
    {
      headerName: "Split", field: "eps_lot_gbn_cd", width: 75,
      cellStyle: (p) => { const c = getSplitColor(p.value); return { backgroundColor: c.cell, color: c.text, fontWeight: "600" }; },
    },
    { headerName: "조건", field: "work_cond_desc", minWidth: 150, flex: 1 },
    { headerName: "장비", field: "eqp_id", width: 80 },
    { headerName: "Recipe", field: "recipe_id", width: 120 },
    ...Array.from({ length: 25 }, (_, i) => ({
      headerName: `${i + 1}`,
      field: `user_def_val_${i + 1}`,
      width: 46,
      editable: false,
      cellRenderer: WfCellRenderer,
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center", padding: "0" },
    })),
    { headerName: "Note", field: "note", minWidth: 100, flex: 1 },
  ], [WfCellRenderer]);

  const splitDefaultColDef = useMemo(() => ({ editable: true, resizable: true, suppressMovable: true }), []);

  const onSplitCellValueChanged = useCallback((e) => {
    const rows = [];
    e.api.forEachNode((n) => rows.push(n.data));
    setSplits(rows);
  }, []);

  const getSplitRowStyle = useCallback((params) => {
    const prev = params.api.getDisplayedRowAtIndex(params.rowIndex - 1);
    const borderTop = prev && prev.data.oper_id !== params.data.oper_id ? "2px solid #64748B" : undefined;
    const c = getSplitColor(params.data.eps_lot_gbn_cd);
    return { backgroundColor: c.row, borderTop };
  }, []);

  const handleSave = async () => {
    if (!experiment.eval_item?.trim()) { alert("평가 항목을 입력해주세요."); return; }
    if (!experiment.iacpj_nm.trim()) { alert("과제명을 입력해주세요."); return; }
    setSaving(true); setSaveResult(null);
    try {
      const syncedProject = { ...project, iacpj_nm: experiment.iacpj_nm };
      const results = {};
      try {
        await axios.post("/api/projects", syncedProject);
        results.project = "새로 생성";
      } catch (err) {
        if (err.response?.status === 409) results.project = "기존 과제 사용";
        else throw err;
      }
      const today = new Date().toISOString().slice(0, 10);
      const expRes = await axios.post("/api/experiments", { ...experiment, request_date: today });
      results.experiment = "1건 저장";
      if (splits.some((s) => s.oper_nm || s.work_cond_desc)) {
        const tempPlanId = `EXP-${expRes.data.id}`;
        await axios.patch(`/api/experiments/${expRes.data.id}/status`, { status: "Assign 전" });
        const splitRes = await axios.post(`/api/experiments/${tempPlanId}/splits`, { splits });
        results.splits = `${splitRes.data.count || splits.length}건 저장`;
      }
      setSaveResult({ type: "success", details: results });
      setTimeout(() => navigate("/lot-assign"), 1500);
    } catch (err) {
      setSaveResult({ type: "error", message: err.response?.data?.error || err.message || "저장 오류" });
    }
    setSaving(false);
  };

  const sectionBtns = [
    { key: "experiment", label: "🧪 실험 조건", active: "border-emerald-500 text-emerald-700 bg-emerald-50" },
    { key: "project",    label: "📁 과제 정보", active: "border-indigo-500 text-indigo-700 bg-indigo-50" },
    { key: "splits",     label: "📋 Split Table", active: "border-amber-500 text-amber-700 bg-amber-50" },
  ];

  return (
    <Splitter style={{ height: "calc(100vh - 112px)" }}>
      <Splitter.Panel defaultSize="65%" min="40%" style={{ paddingRight: 10 }}>
      <div className="flex flex-col h-full gap-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">신규 실험 신청 (AI)</h1>
            <p className="text-sm text-gray-500 mt-1">AI 도우미와 함께 실험 계획을 작성합니다</p>
          </div>
          <button
            onClick={() => navigate("/new-experiment")}
            className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition"
          >
            일반 실험 신청으로
          </button>
        </div>

        {/* 섹션 탭 */}
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

        {/* 실험 조건 */}
        {activeSection === "experiment" && (
          <div className="bg-white rounded-xl border border-emerald-200 p-5 overflow-y-auto flex-1 min-h-0">
            <h2 className="text-base font-bold text-emerald-800 mb-4">🧪 실험 조건</h2>
            <div className="space-y-4">

              {/* 1. 과제명 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">과제명 *</label>
                <input type="text" value={experiment.iacpj_nm}
                  onChange={(e) => updateExperiment("iacpj_nm", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>

              {/* 2. 평가 항목 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">평가 항목 *</label>
                <input type="text" value={experiment.eval_item}
                  onChange={(e) => updateExperiment("eval_item", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>

              {/* 3. 팀 / 요청자 */}
              <div className="grid grid-cols-2 gap-3">
                {[{ key: "team", label: "팀" }, { key: "requester", label: "요청자" }].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type="text" value={experiment[key]}
                      onChange={(e) => updateExperiment(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  </div>
                ))}
              </div>

              {/* 4. LOT 코드 / 모듈 / 평가 공정 / 평가 카테고리 */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "lot_code", label: "LOT 코드" },
                  { key: "module", label: "모듈" },
                  { key: "eval_process", label: "평가 공정" },
                  { key: "eval_category", label: "평가 카테고리" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type="text" value={experiment[key]}
                      onChange={(e) => updateExperiment(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  </div>
                ))}
              </div>

              {/* 5. WF 방향 / Volume Split / 배정 WF */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "wf_direction", label: "WF 방향" },
                  { key: "volume_split", label: "Volume Split" },
                  { key: "assign_wf", label: "배정 WF" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type="text" value={experiment[key]}
                      onChange={(e) => updateExperiment(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  </div>
                ))}
              </div>

              {/* 6. 참고 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">참고</label>
                <input type="text" value={experiment.reference}
                  onChange={(e) => updateExperiment("reference", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>

            </div>
          </div>
        )}

        {/* 과제 정보 */}
        {activeSection === "project" && (
          <div className="bg-white rounded-xl border border-indigo-200 p-5 overflow-y-auto flex-1 min-h-0">
            <h2 className="text-base font-bold text-indigo-800 mb-1">📁 과제 정보</h2>
            <p className="text-xs text-gray-500 mb-4">이미 DB에 과제가 있으면 기존 과제를 사용합니다.</p>
            <div className="grid grid-cols-2 gap-3">
              {projectFields.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="text"
                    value={project[key]}
                    onChange={(e) => updateProject(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {["project_purpose", "iacpj_ta_goa"].map((key) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {key === "project_purpose" ? "과제 목적" : "과제 목표"}
                  </label>
                  <textarea
                    value={project[key]}
                    onChange={(e) => updateProject(key, e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Split Table */}
        {activeSection === "splits" && (
          <div className="bg-white rounded-xl border border-amber-200 p-5 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <h2 className="text-base font-bold text-amber-800">📋 Split Table</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  plan_id: <b className="text-amber-700">{experiment.plan_id || "(실험 조건에서 먼저 입력)"}</b> — {splits.length}건
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={addSplit} className="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition font-medium">+ 행 추가</button>
                <button
                  onClick={() => {
                    const sel = splitGridRef.current?.api?.getSelectedNodes();
                    if (sel?.length) duplicateSplit(sel[0].rowIndex);
                  }}
                  className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition font-medium"
                >복제</button>
                <button
                  onClick={() => {
                    const sel = splitGridRef.current?.api?.getSelectedNodes();
                    if (sel?.length && splits.length > 1) removeSplit(sel[0].rowIndex);
                  }}
                  className="px-3 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition font-medium"
                >✕ 삭제</button>
              </div>
            </div>
            <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
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

        {/* 저장 바 */}
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

        {saveResult && (
          <div className={`rounded-xl p-4 text-sm ${saveResult.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
            {saveResult.type === "success" ? (
              <div>
                <p className="font-bold mb-1">✅ 저장 완료!</p>
                <ul className="list-disc ml-4 space-y-0.5">
                  <li>과제: {saveResult.details.project}</li>
                  <li>실험: {saveResult.details.experiment}</li>
                  {saveResult.details.splits && <li>Split: {saveResult.details.splits}</li>}
                </ul>
              </div>
            ) : (
              <p>❌ {saveResult.message}</p>
            )}
          </div>
        )}
      </div>
      </Splitter.Panel>

      <Splitter.Panel min="20%" max="55%" style={{ paddingLeft: 10 }}>
        <ChatPanel />
      </Splitter.Panel>
    </Splitter>
  );
}

export default LLMNewExperiment;
