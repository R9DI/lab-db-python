import { useState, useEffect } from "react";
import axios from "axios";

const ISSUE_COLS = [
  { key: "split_poor",    label: "Split 불량",      severity: "critical" },
  { key: "dup_eval",      label: "평가아이템 중복",  severity: "warning"  },
  { key: "note_missing",  label: "Note 누락",        severity: "warning"  },
  { key: "cond_missing",  label: "조건 누락",        severity: "warning"  },
  { key: "field_missing", label: "핵심필드 누락",    severity: "warning"  },
  { key: "lot_missing",   label: "LOT 누락",         severity: "info"     },
];

const SEVERITY_CELL = {
  critical: "bg-red-100 text-red-700 font-semibold",
  warning:  "bg-amber-100 text-amber-700 font-semibold",
  info:     "bg-blue-100 text-blue-700 font-semibold",
};

function Badge({ count, severity }) {
  if (count === 0) return <span className="text-gray-300">—</span>;
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${SEVERITY_CELL[severity]}`}>{count}</span>
  );
}

// 상세: Split 불량
function DetailSplitPoor({ rows }) {
  return (
    <table className="w-full text-xs">
      <thead><tr className="text-gray-400 text-left">
        <th className="pb-1 pr-3 font-medium">Plan ID</th>
        <th className="pb-1 pr-3 font-medium">평가아이템</th>
        <th className="pb-1 pr-3 font-medium">평가공정</th>
        <th className="pb-1 pr-3 font-medium">LOT</th>
        <th className="pb-1 font-medium">Split 행수</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((r, i) => (
          <tr key={i} className="text-gray-700">
            <td className="py-1 pr-3">{r.plan_id}</td>
            <td className="py-1 pr-3 max-w-[200px] truncate" title={r.eval_item}>{r.eval_item || <span className="text-gray-300">-</span>}</td>
            <td className="py-1 pr-3">{r.eval_process || <span className="text-gray-300">-</span>}</td>
            <td className="py-1 pr-3">{r.lot_code || <span className="text-gray-300">-</span>}</td>
            <td className="py-1"><span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-semibold">{r.split_row_count}행</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 상세: 평가아이템 중복
function DetailDupEval({ rows }) {
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="text-xs border border-amber-200 rounded p-2 bg-amber-50">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 font-semibold">{r.dup_count}개 실험</span>
            <span className="font-medium text-gray-800">{r.eval_item}</span>
          </div>
          <p className="text-gray-500">공정: {r.eval_process || "-"}</p>
          <p className="text-gray-500">Plan IDs: {r.plan_ids}</p>
          <p className="text-gray-500">LOT: {r.lot_codes}</p>
        </div>
      ))}
    </div>
  );
}

// 상세: Note/조건 누락 (공통)
function DetailSplitMissing({ rows, missingLabel }) {
  return (
    <table className="w-full text-xs">
      <thead><tr className="text-gray-400 text-left">
        <th className="pb-1 pr-3 font-medium">Plan ID</th>
        <th className="pb-1 pr-3 font-medium">평가아이템</th>
        <th className="pb-1 pr-3 font-medium">LOT</th>
        <th className="pb-1 pr-3 font-medium">OPER_ID</th>
        <th className="pb-1 pr-3 font-medium">공정명</th>
        <th className="pb-1 font-medium">{missingLabel}</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((r, i) => (
          <tr key={i} className="text-gray-700">
            <td className="py-1 pr-3">{r.plan_id}</td>
            <td className="py-1 pr-3 max-w-[160px] truncate" title={r.eval_item}>{r.eval_item || <span className="text-gray-300">-</span>}</td>
            <td className="py-1 pr-3">{r.lot_code || <span className="text-gray-300">-</span>}</td>
            <td className="py-1 pr-3">{r.oper_id}</td>
            <td className="py-1 pr-3">{r.oper_nm || <span className="text-gray-300">-</span>}</td>
            <td className="py-1"><span className="text-red-400">미입력</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 상세: 핵심필드 누락
function DetailFieldMissing({ rows }) {
  return (
    <table className="w-full text-xs">
      <thead><tr className="text-gray-400 text-left">
        <th className="pb-1 pr-3 font-medium">Plan ID</th>
        <th className="pb-1 pr-3 font-medium">LOT</th>
        <th className="pb-1 font-medium">누락 필드</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((r, i) => (
          <tr key={i} className="text-gray-700">
            <td className="py-1 pr-3">{r.plan_id}</td>
            <td className="py-1 pr-3">{r.lot_code || <span className="text-gray-300">-</span>}</td>
            <td className="py-1"><span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{r.missing_fields}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 상세: LOT 누락
function DetailLotMissing({ rows }) {
  return (
    <table className="w-full text-xs">
      <thead><tr className="text-gray-400 text-left">
        <th className="pb-1 pr-3 font-medium">Plan ID</th>
        <th className="pb-1 pr-3 font-medium">평가아이템</th>
        <th className="pb-1 font-medium">평가공정</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((r, i) => (
          <tr key={i} className="text-gray-700">
            <td className="py-1 pr-3">{r.plan_id}</td>
            <td className="py-1 pr-3 max-w-[200px] truncate" title={r.eval_item}>{r.eval_item || <span className="text-gray-300">-</span>}</td>
            <td className="py-1">{r.eval_process || <span className="text-gray-300">-</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 프로젝트 상세 패널
function ProjectDetail({ project, issues }) {
  const proj = project.iacpj_nm;
  const splitPoor    = issues.splitPoor.filter((r) => r.iacpj_nm === proj);
  const dupEval      = issues.dupEvalItem.filter((r) => r.iacpj_nm === proj);
  const noteMissing  = issues.noteMissing.filter((r) => r.iacpj_nm === proj);
  const condMissing  = issues.condMissing.filter((r) => r.iacpj_nm === proj);
  const fieldMissing = issues.fieldMissing.filter((r) => r.iacpj_nm === proj);
  const lotMissing   = issues.lotMissing.filter((r) => r.iacpj_nm === proj);

  const sections = [
    { label: "Split Table 불량 (0~1행)", severity: "critical", count: splitPoor.length,    content: <DetailSplitPoor rows={splitPoor} /> },
    { label: "평가아이템 중복",          severity: "warning",  count: dupEval.length,      content: <DetailDupEval rows={dupEval} /> },
    { label: "Note 누락",               severity: "warning",  count: noteMissing.length,  content: <DetailSplitMissing rows={noteMissing} missingLabel="Note" /> },
    { label: "조건 누락",               severity: "warning",  count: condMissing.length,  content: <DetailSplitMissing rows={condMissing} missingLabel="작업조건" /> },
    { label: "핵심필드 누락",            severity: "warning",  count: fieldMissing.length, content: <DetailFieldMissing rows={fieldMissing} /> },
    { label: "LOT 코드 누락",           severity: "info",     count: lotMissing.length,   content: <DetailLotMissing rows={lotMissing} /> },
  ].filter((s) => s.count > 0);

  if (sections.length === 0) {
    return <p className="text-xs text-emerald-600 py-2">이슈 없음</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <div key={s.label}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${SEVERITY_CELL[s.severity]}`}>{s.count}건</span>
            <span className="text-xs font-semibold text-gray-700">{s.label}</span>
          </div>
          {s.content}
        </div>
      ))}
    </div>
  );
}

export default function DBAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    axios.get("/api/analysis")
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">분석 중...</div>;
  if (!data) return <div className="flex items-center justify-center h-64 text-red-400">데이터를 불러오지 못했습니다.</div>;

  const { summary, projectSummary, issues } = data;

  const splitCoverage = summary.total_experiments > 0
    ? Math.round((summary.experiments_with_split / summary.total_experiments) * 100)
    : 0;

  const totalIssues = Object.values(issues).flat().length;

  const handleRowClick = (proj) => {
    setSelectedProject((prev) => prev?.iacpj_nm === proj.iacpj_nm ? null : proj);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">실험 통합 DB 분석</h1>
          <p className="text-sm text-gray-500 mt-0.5">실험 및 Split Table 데이터 품질 모니터링</p>
        </div>
        {totalIssues > 0
          ? <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold">총 {totalIssues}건 이슈</span>
          : <span className="text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">이슈 없음</span>
        }
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "등록 과제",             value: summary.total_projects,        unit: "개", color: "text-indigo-600" },
          { label: "등록 실험",             value: summary.total_experiments,      unit: "건", color: "text-indigo-600" },
          { label: "Split Table 보유 실험", value: summary.experiments_with_split, unit: "건", color: "text-emerald-600" },
          { label: "Split 커버리지",        value: splitCoverage,                 unit: "%",  color: splitCoverage >= 80 ? "text-emerald-600" : splitCoverage >= 50 ? "text-amber-500" : "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>
              {s.value}<span className="text-sm font-normal text-gray-400 ml-0.5">{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 과제별 이슈 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">과제명</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">실험수</th>
              {ISSUE_COLS.map((col) => (
                <th key={col.key} className="text-center px-3 py-3 text-xs font-semibold text-gray-500">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projectSummary.map((proj) => {
              const isSelected = selectedProject?.iacpj_nm === proj.iacpj_nm;
              const hasIssue = ISSUE_COLS.some((col) => proj[col.key] > 0);
              return (
                <>
                  <tr
                    key={proj.iacpj_nm}
                    onClick={() => handleRowClick(proj)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-indigo-50" : hasIssue ? "hover:bg-gray-50" : "hover:bg-gray-50 opacity-60"
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 max-w-[260px] truncate" title={proj.iacpj_nm}>
                      <span className="flex items-center gap-2">
                        {isSelected
                          ? <svg className="w-3 h-3 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          : <svg className="w-3 h-3 text-gray-300 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        }
                        {proj.iacpj_nm}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">{proj.experiment_count}</td>
                    {ISSUE_COLS.map((col) => (
                      <td key={col.key} className="px-3 py-3 text-center">
                        <Badge count={proj[col.key]} severity={col.severity} />
                      </td>
                    ))}
                  </tr>
                  {isSelected && (
                    <tr key={`${proj.iacpj_nm}-detail`}>
                      <td colSpan={2 + ISSUE_COLS.length} className="px-6 py-4 bg-indigo-50 border-t border-indigo-100">
                        <ProjectDetail project={proj} issues={issues} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
