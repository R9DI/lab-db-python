import { useState } from "react";
import axios from "axios";

/* ─── 컬럼 정의 ─── */
const SECTIONS = [
  {
    key: "project",
    title: "과제 (Projects)",
    icon: "📁",
    color: "indigo",
    step: 1,
    desc: "과제 기본 정보를 등록합니다. iacpj_nm이 기준 키이므로 정확히 입력해야 합니다.",
    columns: [
      { name: "iacpj_nm", label: "과제명", required: true, format: "텍스트 (UNIQUE)", example: "DRAM 3세대 고속 개발" },
      { name: "iacpj_tgt_n", label: "개발 분류", required: false, format: "텍스트", example: "DRAM" },
      { name: "iacpj_level", label: "검증 레벨", required: false, format: "텍스트", example: "Lv2" },
      { name: "iacpj_tech_n", label: "1차 대상 기술", required: false, format: "텍스트", example: "1a DRAM" },
      { name: "ia_tgt_htr_n", label: "HTRS 색상", required: false, format: "텍스트", example: "Green" },
      { name: "iacpj_nud_n", label: "NUDD", required: false, format: "텍스트", example: "N" },
      { name: "iacpj_mod_n", label: "모듈", required: false, format: "텍스트", example: "Cell" },
      { name: "iacpj_itf_uno", label: "과제 코드", required: false, format: "텍스트", example: "PRJ-2025-001" },
      { name: "iacpj_bgn_dy", label: "시작일", required: false, format: "YYYY-MM-DD", example: "2025-01-15" },
      { name: "iacpj_ch_n", label: "PM", required: false, format: "텍스트 (이름)", example: "김철수" },
      { name: "ia_ta_grd_n", label: "과제 등급", required: false, format: "텍스트", example: "S" },
      { name: "project_purpose", label: "과제 목적", required: false, format: "자유 텍스트", example: "고속 DRAM 셀 구조 개발" },
      { name: "iacpj_ta_goa", label: "과제 목표", required: false, format: "자유 텍스트", example: "tRCD 10ns 이하 달성" },
      { name: "iacpj_cur_stt", label: "현재 상태", required: false, format: "텍스트", example: "진행중" },
      { name: "iacpj_ch_i", label: "담당자ID", required: false, format: "텍스트", example: "" },
      { name: "ia_ch_or_i", label: "조직코드ID", required: false, format: "텍스트", example: "" },
      { name: "ia_ch_or_n", label: "조직명", required: false, format: "텍스트", example: "" },
      { name: "ia_ch_or_path", label: "조직경로", required: false, format: "텍스트", example: "" },
      { name: "iacpj_core_tec", label: "핵심기술", required: false, format: "텍스트", example: "" },
      { name: "iacpj_end_dy", label: "종료일", required: false, format: "YYYY-MM-DD", example: "" },
      { name: "iacpj_reg_dy", label: "등록일", required: false, format: "YYYY-MM-DD", example: "" },
    ],
  },
  {
    key: "experiment",
    title: "실험 조건 (Experiments)",
    icon: "🧪",
    color: "emerald",
    step: 2,
    desc: "실험 계획 정보를 등록합니다. plan_id와 iacpj_nm이 필수이며, iacpj_nm은 과제 테이블에 먼저 등록되어야 합니다.",
    columns: [
      { name: "plan_id", label: "Plan ID", required: true, format: "텍스트 (고유)", example: "RSAB705" },
      { name: "iacpj_nm", label: "과제명", required: true, format: "텍스트 (과제 테이블에 존재해야 함)", example: "DRAM 3세대 고속 개발" },
      { name: "team", label: "팀", required: false, format: "텍스트", example: "소자개발팀" },
      { name: "requester", label: "요청자", required: false, format: "텍스트 (이름)", example: "이영희" },
      { name: "lot_code", label: "LOT 코드", required: false, format: "텍스트", example: "LOT-A001" },
      { name: "module", label: "모듈", required: false, format: "텍스트", example: "Cell" },
      { name: "wf_direction", label: "WF 방향", required: false, format: "텍스트", example: "FWD" },
      { name: "eval_process", label: "평가공정", required: false, format: "텍스트", example: "BLC Mask" },
      { name: "prev_eval", label: "이전 평가", required: false, format: "텍스트", example: "" },
      { name: "cross_experiment", label: "교차 실험", required: false, format: "텍스트", example: "" },
      { name: "eval_category", label: "평가 항목 카테고리", required: false, format: "텍스트", example: "Electrical" },
      { name: "eval_item", label: "평가 항목", required: false, format: "텍스트", example: "ESL Etch 조건 평가" },
      { name: "lot_request", label: "LOT 요청", required: false, format: "텍스트", example: "2 lot" },
      { name: "reference", label: "참고", required: false, format: "자유 텍스트", example: "" },
      { name: "volume_split", label: "Volume Split", required: false, format: "텍스트", example: "9WF" },
      { name: "assign_wf", label: "배정 WF", required: false, format: "숫자", example: "9" },
      { name: "refdata", label: "참조 데이터", required: false, format: "자유 텍스트", example: "" },
      { name: "refdata_url", label: "참조 URL", required: false, format: "URL", example: "" },
      { name: "request_date", label: "요청일", required: false, format: "날짜 텍스트", example: "2025-01-15" },
    ],
  },
  {
    key: "split",
    title: "Split Table (실험 조건표)",
    icon: "📋",
    color: "amber",
    step: 3,
    desc: "실험별 세부 스플릿 조건을 등록합니다. plan_id가 필수이며, 같은 공정(oper_nm)에 대해 base + split 세트로 구성합니다.",
    columns: [
      { name: "sno", label: "행 순서", required: false, format: "정수", example: "1" },
      { name: "plan_id", label: "Plan ID", required: true, format: "텍스트 (실험의 plan_id)", example: "RSAB705" },
      { name: "fac_id", label: "FAC", required: false, format: "텍스트", example: "r3" },
      { name: "oper_id", label: "OPER ID", required: false, format: "텍스트", example: "r206100a" },
      { name: "oper_nm", label: "공정명", required: false, format: "텍스트", example: "blc_mask" },
      { name: "eps_lot_gbn_cd", label: "Split 구분", required: false, format: "base / s1 / s2 ...", example: "base" },
      { name: "note", label: "비고", required: false, format: "자유 텍스트", example: "ESL ETCH 조건 평가" },
      { name: "work_cond_desc", label: "조건 설명", required: false, format: "자유 텍스트", example: "- (base) 또는 etch time 변경" },
      { name: "eqp_id", label: "장비 ID", required: false, format: "텍스트", example: "m111" },
      { name: "recipe_id", label: "Recipe", required: false, format: "텍스트", example: "sp-in-blc-rnd" },
      { name: "user_def_val_1", label: "WF1", required: false, format: "O 또는 빈칸", example: "O" },
      { name: "user_def_val_2", label: "WF2", required: false, format: "O 또는 빈칸", example: "O" },
      { name: "user_def_val_3", label: "WF3", required: false, format: "O 또는 빈칸", example: "O" },
      { name: "user_def_val_4", label: "WF4", required: false, format: "O 또는 빈칸", example: "O" },
      { name: "user_def_val_5", label: "WF5", required: false, format: "O 또는 빈칸", example: "O" },
      { name: "user_def_val_6", label: "WF6", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_7", label: "WF7", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_8", label: "WF8", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_9", label: "WF9", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_10", label: "WF10", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_11", label: "WF11", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_12", label: "WF12", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_13", label: "WF13", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_14", label: "WF14", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_15", label: "WF15", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_16", label: "WF16", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_17", label: "WF17", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_18", label: "WF18", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_19", label: "WF19", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_20", label: "WF20", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_21", label: "WF21", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_22", label: "WF22", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_23", label: "WF23", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_24", label: "WF24", required: false, format: "O 또는 빈칸", example: "" },
      { name: "user_def_val_25", label: "WF25", required: false, format: "O 또는 빈칸", example: "" },
    ],
  },
];

const colorMap = {
  indigo: {
    border: "border-indigo-200",
    headerBg: "bg-indigo-50",
    headerText: "text-indigo-800",
    badge: "bg-indigo-100 text-indigo-700",
    btnBg: "bg-indigo-600 hover:bg-indigo-700",
    dlBtn: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200",
    stepActive: "bg-indigo-600",
    stepDone: "bg-indigo-500",
  },
  emerald: {
    border: "border-emerald-200",
    headerBg: "bg-emerald-50",
    headerText: "text-emerald-800",
    badge: "bg-emerald-100 text-emerald-700",
    btnBg: "bg-emerald-600 hover:bg-emerald-700",
    dlBtn: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200",
    stepActive: "bg-emerald-600",
    stepDone: "bg-emerald-500",
  },
  amber: {
    border: "border-amber-200",
    headerBg: "bg-amber-50",
    headerText: "text-amber-800",
    badge: "bg-amber-100 text-amber-700",
    btnBg: "bg-amber-600 hover:bg-amber-700",
    dlBtn: "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200",
    stepActive: "bg-amber-600",
    stepDone: "bg-amber-500",
  },
};

/* ─── 스텝 인디케이터 ─── */
function StepIndicator({ sections, completedSteps }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {sections.map((section, idx) => {
        const done = completedSteps.includes(section.key);
        const current = !done && (idx === 0 || completedSteps.includes(sections[idx - 1].key));
        const c = colorMap[section.color];

        return (
          <div key={section.key} className="flex items-center">
            {/* 스텝 원 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done
                    ? `${c.stepDone} text-white`
                    : current
                      ? `${c.stepActive} text-white ring-4 ring-opacity-30 ${section.color === "indigo" ? "ring-indigo-200" : section.color === "emerald" ? "ring-emerald-200" : "ring-amber-200"}`
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {done ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  section.step
                )}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${done || current ? "text-gray-700" : "text-gray-400"}`}>
                {section.title.split("(")[0].trim()}
              </span>
            </div>
            {/* 연결선 */}
            {idx < sections.length - 1 && (
              <div
                className={`w-20 h-0.5 mx-2 mb-5 transition-all ${
                  completedSteps.includes(section.key) ? "bg-gray-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── 개별 업로드 섹션 컴포넌트 ─── */
function UploadSection({ section, disabled, completed, uploadResult, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [showColumns, setShowColumns] = useState(false);
  const c = colorMap[section.color];

  const handleUpload = async () => {
    if (!file || disabled) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", section.key);

    setStatus({ type: "loading", message: "업로드 중..." });
    try {
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const d = res.data.details;
      const totalRows = res.data.totalRows || 0;
      const count = d.projectCount || d.experimentCount || d.splitCount || 0;
      setStatus({ type: "success", message: `${count}건 업로드 완료! (파일 전체 ${totalRows}행 인식)`, count });
      setFile(null);
      onUploadSuccess(section.key, { count, details: d });
    } catch (err) {
      const msg = err.response?.data?.details || err.response?.data?.error || "서버 오류 발생";
      setStatus({ type: "error", message: msg });
    }
  };

  const downloadTemplate = () => {
    const BOM = "\uFEFF";
    const headers = section.columns.map((col) => col.name).join(",");
    const exampleRow = section.columns
      .map((col) => {
        const val = col.example || "";
        return val.includes(",") ? `"${val}"` : val;
      })
      .join(",");
    const csvContent = BOM + headers + "\n" + exampleRow + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `template_${section.key}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className={`border rounded-xl overflow-hidden transition-all ${
        disabled ? "opacity-50 pointer-events-none" : ""
      } ${completed ? `${c.border} ring-1 ${c.border}` : c.border}`}
    >
      {/* Header */}
      <div className={`px-6 py-4 ${c.headerBg} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{section.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg font-bold ${c.headerText}`}>{section.title}</h2>
              {completed && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                  업로드 완료
                </span>
              )}
              {disabled && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  이전 단계를 먼저 완료하세요
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{section.desc}</p>
          </div>
        </div>
        <button
          onClick={() => setShowColumns(!showColumns)}
          className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${c.dlBtn}`}
        >
          {showColumns ? "컬럼 정보 닫기" : "컬럼 정보 보기"}
        </button>
      </div>

      {/* Column Info (collapsible) */}
      {showColumns && (
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-2 pr-4 font-semibold text-gray-700 whitespace-nowrap">컬럼명 (CSV Header)</th>
                  <th className="pb-2 pr-4 font-semibold text-gray-700">설명</th>
                  <th className="pb-2 pr-4 font-semibold text-gray-700">필수</th>
                  <th className="pb-2 pr-4 font-semibold text-gray-700">양식</th>
                  <th className="pb-2 font-semibold text-gray-700">예시</th>
                </tr>
              </thead>
              <tbody>
                {section.columns.map((col) => (
                  <tr key={col.name} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-1.5 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-mono">{col.name}</code>
                    </td>
                    <td className="py-1.5 pr-4 text-gray-700">{col.label}</td>
                    <td className="py-1.5 pr-4">
                      {col.required ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${c.badge}`}>필수</span>
                      ) : (
                        <span className="text-gray-400">선택</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-4 text-gray-500">{col.format}</td>
                    <td className="py-1.5 text-gray-600 font-mono text-[11px]">
                      {col.example || <span className="text-gray-300">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!completed ? (
        <div className="px-6 py-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={downloadTemplate}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition whitespace-nowrap ${c.dlBtn}`}
            >
              템플릿 다운로드
            </button>

            <div className="flex-1">
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={(e) => {
                  setFile(e.target.files[0]);
                  setStatus(null);
                }}
                className="block w-full text-sm text-gray-500
                  file:mr-3 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-gray-100 file:text-gray-700
                  hover:file:bg-gray-200 file:cursor-pointer file:transition"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!file}
              className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition whitespace-nowrap ${
                file ? c.btnBg : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              업로드
            </button>
          </div>

          {/* Status */}
          {status && (
            <div
              className={`mt-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                status.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : status.type === "error"
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {status.type === "success" ? "v " : status.type === "error" ? "x " : ""}
              {status.message}
            </div>
          )}
        </div>
      ) : (
        <div className="px-6 py-3 bg-green-50 border-t border-green-100 text-sm text-green-700 font-medium">
          {uploadResult?.count || 0}건 업로드 완료
        </div>
      )}
    </section>
  );
}

/* ─── 메인 페이지 ─── */
function UploadPage() {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [uploadResults, setUploadResults] = useState({});

  const handleUploadSuccess = (key, result) => {
    setCompletedSteps((prev) => [...prev, key]);
    setUploadResults((prev) => ({ ...prev, [key]: result }));
  };

  const allDone = completedSteps.length === 3;

  const handleReset = () => {
    setCompletedSteps([]);
    setUploadResults({});
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">데이터 업로드</h1>
          <p className="text-sm text-gray-500 mt-1">
            CSV 파일로 과제, 실험, Split Table 데이터를 순서대로 업로드합니다
          </p>
        </div>
        {completedSteps.length > 0 && !allDone && (
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition"
          >
            초기화
          </button>
        )}
      </div>

      {/* 스텝 인디케이터 */}
      <StepIndicator sections={SECTIONS} completedSteps={completedSteps} />

      {/* 도움말 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <h3 className="font-bold mb-1">업로드 순서 안내</h3>
        <ul className="list-disc ml-4 space-y-0.5">
          <li>
            <strong>1 과제 → 2 실험 조건 → 3 Split Table</strong> 순서로
            업로드해야 외래키 오류가 없습니다.
          </li>
          <li>
            CSV 파일은 <strong>UTF-8</strong> 인코딩이어야 합니다. 한글이 포함된
            경우 템플릿에 BOM이 포함되어 있습니다.
          </li>
          <li>
            동일 키가 이미 존재하면 <strong>무시(IGNORE)</strong>됩니다.
            업데이트가 필요하면 기존 데이터를 먼저 삭제하세요.
          </li>
        </ul>
      </div>

      {/* 3 Upload Sections (순차 활성화) */}
      {SECTIONS.map((section, idx) => {
        const isCompleted = completedSteps.includes(section.key);
        const isDisabled = !isCompleted && idx > 0 && !completedSteps.includes(SECTIONS[idx - 1].key);

        return (
          <UploadSection
            key={section.key}
            section={section}
            disabled={isDisabled}
            completed={isCompleted}
            uploadResult={uploadResults[section.key]}
            onUploadSuccess={handleUploadSuccess}
          />
        );
      })}

      {/* 전체 완료 시 요약 + 초기화 */}
      {allDone && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-green-800 mb-2">데이터 등록 완료</h3>
              <div className="flex gap-6 text-sm text-green-700">
                <span>과제: <strong>{uploadResults.project?.count || 0}건</strong></span>
                <span>실험: <strong>{uploadResults.experiment?.count || 0}건</strong></span>
                <span>Split Table: <strong>{uploadResults.split?.count || 0}건</strong></span>
              </div>
              <p className="text-xs text-green-600 mt-2">
                대시보드와 실험 탐색에 자동 반영됩니다.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
            >
              추가 업로드
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPage;
