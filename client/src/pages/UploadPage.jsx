import { useState } from "react";
import axios from "axios";

/* ─── 컬럼 정의 ─── */
const SECTIONS = [
  {
    key: "project",
    title: "과제 (Projects)",
    icon: "📁",
    color: "indigo",
    desc: "과제 기본 정보를 등록합니다. project_name이 기준 키이므로 정확히 입력해야 합니다.",
    columns: [
      {
        name: "project_name",
        label: "과제명",
        required: true,
        format: "텍스트 (UNIQUE)",
        example: "DRAM 3세대 고속 개발",
      },
      {
        name: "dev_type",
        label: "개발 유형",
        required: false,
        format: "텍스트",
        example: "신규개발",
      },
      {
        name: "dev_category",
        label: "개발 분류",
        required: false,
        format: "텍스트",
        example: "DRAM",
      },
      {
        name: "verification_lv",
        label: "검증 레벨",
        required: false,
        format: "텍스트",
        example: "Lv2",
      },
      {
        name: "preceding_type",
        label: "선행 유형",
        required: false,
        format: "텍스트",
        example: "양산선행",
      },
      {
        name: "target_device",
        label: "대상 디바이스",
        required: false,
        format: "텍스트",
        example: "D1a",
      },
      {
        name: "first_target_tech",
        label: "1차 대상 기술",
        required: false,
        format: "텍스트",
        example: "1a DRAM",
      },
      {
        name: "second_target_tech",
        label: "2차 대상 기술",
        required: false,
        format: "텍스트",
        example: "1b DRAM",
      },
      {
        name: "htrs_link",
        label: "HTRS 링크",
        required: false,
        format: "URL",
        example: "https://htrs.example.com/123",
      },
      {
        name: "htrs_color",
        label: "HTRS 색상",
        required: false,
        format: "텍스트",
        example: "Green",
      },
      {
        name: "nudd",
        label: "NUDD",
        required: false,
        format: "텍스트",
        example: "N",
      },
      {
        name: "module",
        label: "모듈",
        required: false,
        format: "텍스트",
        example: "Cell",
      },
      {
        name: "project_code",
        label: "과제 코드",
        required: false,
        format: "텍스트",
        example: "PRJ-2025-001",
      },
      {
        name: "start_date",
        label: "시작일",
        required: false,
        format: "YYYY-MM-DD",
        example: "2025-01-15",
      },
      {
        name: "pm",
        label: "PM",
        required: false,
        format: "텍스트 (이름)",
        example: "김철수",
      },
      {
        name: "project_grade",
        label: "과제 등급",
        required: false,
        format: "텍스트",
        example: "S",
      },
      {
        name: "project_purpose",
        label: "과제 목적",
        required: false,
        format: "자유 텍스트",
        example: "고속 DRAM 셀 구조 개발",
      },
      {
        name: "project_goal",
        label: "과제 목표",
        required: false,
        format: "자유 텍스트",
        example: "tRCD 10ns 이하 달성",
      },
      {
        name: "current_status",
        label: "현재 상태",
        required: false,
        format: "텍스트",
        example: "진행중",
      },
    ],
  },
  {
    key: "experiment",
    title: "실험 조건 (Experiments)",
    icon: "🧪",
    color: "emerald",
    desc: "실험 계획 정보를 등록합니다. plan_id와 project_name이 필수이며, project_name은 과제 테이블에 먼저 등록되어야 합니다.",
    columns: [
      {
        name: "plan_id",
        label: "Plan ID",
        required: true,
        format: "텍스트 (고유)",
        example: "RSAB705",
      },
      {
        name: "project_name",
        label: "과제명",
        required: true,
        format: "텍스트 (과제 테이블에 존재해야 함)",
        example: "DRAM 3세대 고속 개발",
      },
      {
        name: "team",
        label: "팀",
        required: false,
        format: "텍스트",
        example: "소자개발팀",
      },
      {
        name: "requester",
        label: "요청자",
        required: false,
        format: "텍스트 (이름)",
        example: "이영희",
      },
      {
        name: "lot_code",
        label: "LOT 코드",
        required: false,
        format: "텍스트",
        example: "LOT-A001",
      },
      {
        name: "module",
        label: "모듈",
        required: false,
        format: "텍스트",
        example: "Cell",
      },
      {
        name: "wf_direction",
        label: "WF 방향",
        required: false,
        format: "텍스트",
        example: "FWD",
      },
      {
        name: "eval_process",
        label: "평가공정",
        required: false,
        format: "텍스트",
        example: "BLC Mask",
      },
      {
        name: "prev_eval",
        label: "이전 평가",
        required: false,
        format: "텍스트",
        example: "",
      },
      {
        name: "cross_experiment",
        label: "교차 실험",
        required: false,
        format: "텍스트",
        example: "",
      },
      {
        name: "eval_category",
        label: "평가 항목 카테고리",
        required: false,
        format: "텍스트",
        example: "Electrical",
      },
      {
        name: "eval_item",
        label: "평가 항목",
        required: false,
        format: "텍스트",
        example: "ESL Etch 조건 평가",
      },
      {
        name: "lot_request",
        label: "LOT 요청",
        required: false,
        format: "텍스트",
        example: "2 lot",
      },
      {
        name: "reference",
        label: "참고",
        required: false,
        format: "자유 텍스트",
        example: "",
      },
      {
        name: "volume_split",
        label: "Volume Split",
        required: false,
        format: "텍스트",
        example: "9WF",
      },
      {
        name: "assign_wf",
        label: "배정 WF",
        required: false,
        format: "숫자",
        example: "9",
      },
    ],
  },
  {
    key: "split",
    title: "Split Table (실험 조건표)",
    icon: "📋",
    color: "amber",
    desc: "실험별 세부 스플릿 조건을 등록합니다. plan_id가 필수이며, 같은 공정(oper_nm)에 대해 base + split 세트로 구성합니다.",
    columns: [
      {
        name: "plan_id",
        label: "Plan ID",
        required: true,
        format: "텍스트 (실험의 plan_id)",
        example: "RSAB705",
      },
      {
        name: "fac_id",
        label: "FAC",
        required: false,
        format: "텍스트",
        example: "r3",
      },
      {
        name: "oper_id",
        label: "OPER ID",
        required: false,
        format: "텍스트",
        example: "r206100a",
      },
      {
        name: "oper_nm",
        label: "공정명",
        required: false,
        format: "텍스트",
        example: "blc_mask",
      },
      {
        name: "eps_lot_gbn_cd",
        label: "Split 구분",
        required: false,
        format: "base / s1 / s2 ...",
        example: "base",
      },
      {
        name: "work_cond_desc",
        label: "조건 설명",
        required: false,
        format: "자유 텍스트",
        example: "- (base) 또는 etch time 변경",
      },
      {
        name: "eqp_id",
        label: "장비 ID",
        required: false,
        format: "텍스트",
        example: "m111",
      },
      {
        name: "recipe_id",
        label: "Recipe",
        required: false,
        format: "텍스트",
        example: "sp-in-blc-rnd",
      },
      {
        name: "user_def_val_1",
        label: "WF1",
        required: false,
        format: "O 또는 빈칸",
        example: "O",
      },
      {
        name: "user_def_val_2",
        label: "WF2",
        required: false,
        format: "O 또는 빈칸",
        example: "O",
      },
      {
        name: "user_def_val_3",
        label: "WF3",
        required: false,
        format: "O 또는 빈칸",
        example: "O",
      },
      {
        name: "user_def_val_4",
        label: "WF4",
        required: false,
        format: "O 또는 빈칸",
        example: "O",
      },
      {
        name: "user_def_val_5",
        label: "WF5",
        required: false,
        format: "O 또는 빈칸",
        example: "O",
      },
      {
        name: "user_def_val_6",
        label: "WF6",
        required: false,
        format: "O 또는 빈칸",
        example: "",
      },
      {
        name: "user_def_val_7",
        label: "WF7",
        required: false,
        format: "O 또는 빈칸",
        example: "",
      },
      {
        name: "user_def_val_8",
        label: "WF8",
        required: false,
        format: "O 또는 빈칸",
        example: "",
      },
      {
        name: "user_def_val_9",
        label: "WF9",
        required: false,
        format: "O 또는 빈칸",
        example: "",
      },
      {
        name: "user_def_val_10",
        label: "WF10",
        required: false,
        format: "O 또는 빈칸",
        example: "",
      },
      {
        name: "user_def_val_11",
        label: "WF11",
        required: false,
        format: "O 또는 빈칸",
        example: "",
      },
      {
        name: "user_def_val_12",
        label: "WF12",
        required: false,
        format: "O 또는 빈칸",
        example: "",
      },
      {
        name: "user_def_val_13",
        label: "WF13",
        required: false,
        format: "O 또는 빈칸",
        example: "",
      },
      {
        name: "user_def_val_14",
        label: "WF14",
        required: false,
        format: "O 또는 빈칸",
        example: "",
      },
      {
        name: "user_def_val_15",
        label: "WF15",
        required: false,
        format: "O 또는 빈칸",
        example: "",
      },
      {
        name: "note",
        label: "비고",
        required: false,
        format: "자유 텍스트",
        example: "ESL ETCH 조건 평가",
      },
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
  },
  emerald: {
    border: "border-emerald-200",
    headerBg: "bg-emerald-50",
    headerText: "text-emerald-800",
    badge: "bg-emerald-100 text-emerald-700",
    btnBg: "bg-emerald-600 hover:bg-emerald-700",
    dlBtn:
      "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  amber: {
    border: "border-amber-200",
    headerBg: "bg-amber-50",
    headerText: "text-amber-800",
    badge: "bg-amber-100 text-amber-700",
    btnBg: "bg-amber-600 hover:bg-amber-700",
    dlBtn: "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200",
  },
};

/* ─── 개별 업로드 섹션 컴포넌트 ─── */
function UploadSection({ section }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message, count }
  const [showColumns, setShowColumns] = useState(false);
  const c = colorMap[section.color];

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", section.key);

    setStatus({ type: "loading", message: "업로드 중..." });
    try {
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const d = res.data.details;
      const count = d.projectCount || d.experimentCount || d.splitCount || 0;
      setStatus({ type: "success", message: `${count}건 업로드 완료!`, count });
      setFile(null);
    } catch (err) {
      const msg = err.response?.data?.error || "서버 오류 발생";
      setStatus({ type: "error", message: msg });
    }
  };

  const downloadTemplate = () => {
    // Generate CSV template with BOM for Korean support
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
    <section className={`border rounded-xl overflow-hidden ${c.border}`}>
      {/* Header */}
      <div
        className={`px-6 py-4 ${c.headerBg} flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{section.icon}</span>
          <div>
            <h2 className={`text-lg font-bold ${c.headerText}`}>
              {section.title}
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">{section.desc}</p>
          </div>
        </div>
        <button
          onClick={() => setShowColumns(!showColumns)}
          className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${c.dlBtn}`}
        >
          {showColumns ? "컬럼 정보 닫기 ▲" : "컬럼 정보 보기 ▼"}
        </button>
      </div>

      {/* Column Info (collapsible) */}
      {showColumns && (
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-2 pr-4 font-semibold text-gray-700 whitespace-nowrap">
                    컬럼명 (CSV Header)
                  </th>
                  <th className="pb-2 pr-4 font-semibold text-gray-700">
                    설명
                  </th>
                  <th className="pb-2 pr-4 font-semibold text-gray-700">
                    필수
                  </th>
                  <th className="pb-2 pr-4 font-semibold text-gray-700">
                    양식
                  </th>
                  <th className="pb-2 font-semibold text-gray-700">예시</th>
                </tr>
              </thead>
              <tbody>
                {section.columns.map((col) => (
                  <tr
                    key={col.name}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-1.5 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-mono">
                        {col.name}
                      </code>
                    </td>
                    <td className="py-1.5 pr-4 text-gray-700">{col.label}</td>
                    <td className="py-1.5 pr-4">
                      {col.required ? (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${c.badge}`}
                        >
                          필수
                        </span>
                      ) : (
                        <span className="text-gray-400">선택</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-4 text-gray-500">{col.format}</td>
                    <td className="py-1.5 text-gray-600 font-mono text-[11px]">
                      {col.example || <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={downloadTemplate}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition whitespace-nowrap ${c.dlBtn}`}
          >
            📥 템플릿 다운로드
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
            {status.type === "success"
              ? "✅ "
              : status.type === "error"
                ? "❌ "
                : "⏳ "}
            {status.message}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── 메인 페이지 ─── */
function UploadPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">데이터 업로드</h1>
          <p className="text-sm text-gray-500 mt-1">
            CSV 파일로 과제, 실험, Split Table 데이터를 개별 업로드합니다
          </p>
        </div>
      </div>

      {/* 도움말 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <h3 className="font-bold mb-1">💡 업로드 순서 안내</h3>
        <ul className="list-disc ml-4 space-y-0.5">
          <li>
            <strong>① 과제 → ② 실험 조건 → ③ Split Table</strong> 순서로
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

      {/* 3 Upload Sections */}
      {SECTIONS.map((section) => (
        <UploadSection key={section.key} section={section} />
      ))}
    </div>
  );
}

export default UploadPage;
