import { useState, useEffect } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const ISSUE_COLS = [
  { key: "split_poor",    label: "Split 불량",      severity: "critical", denomKey: "experiment_count" },
  { key: "dup_eval",      label: "평가아이템 중복",  severity: "warning",  denomKey: "experiment_count" },
  { key: "note_missing",  label: "Note 누락",        severity: "warning",  denomKey: "oper_row_count"   },
  { key: "cond_missing",  label: "조건 누락",        severity: "warning",  denomKey: "oper_row_count"   },
  { key: "field_missing", label: "핵심필드 누락",    severity: "warning",  denomKey: "experiment_count" },
  { key: "lot_missing",   label: "LOT 누락",         severity: "info",     denomKey: "experiment_count" },
];

const SEVERITY_CELL = {
  critical: "bg-red-100 text-red-700 font-semibold",
  warning:  "bg-amber-100 text-amber-700 font-semibold",
  info:     "bg-blue-100 text-blue-700 font-semibold",
};

const SEVERITY_BORDER = {
  critical: "border-red-200",
  warning:  "border-amber-200",
  info:     "border-blue-200",
};

function Badge({ count, denom, severity }) {
  if (count === 0) return <span className="text-gray-300 text-xs">{denom > 0 ? `0%` : "—"}</span>;
  const p = pct(count, denom);
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${SEVERITY_CELL[severity]}`}>
      {count}/{denom}건 ({p}%)
    </span>
  );
}

const pct = (num, den) => den > 0 ? Math.round((num / den) * 100) : 0;

function shortName(name) {
  if (!name) return "";
  return name.length > 12 ? name.slice(0, 12) + "…" : name;
}

function avgPct(data, valueKey, denomKey) {
  if (!data.length) return 0;
  const totalNum = data.reduce((s, p) => s + (p[valueKey] || 0), 0);
  const totalDen = data.reduce((s, p) => s + (p[denomKey] || 0), 0);
  return pct(totalNum, totalDen);
}

function makeBarOption({ data, valueKey, denomKey, color, colorFn, seriesLabel, tooltip, avg }) {
  const names = data.map((p) => shortName(p.iacpj_nm));
  return {
    tooltip: { trigger: "axis", formatter: tooltip },
    grid: { left: 44, right: 60, top: 24, bottom: 70 },
    xAxis: {
      type: "category",
      data: names,
      axisLabel: { rotate: 35, fontSize: 10, interval: 0, color: "#6b7280" },
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: "value", min: 0, max: 100,
      axisLabel: { formatter: "{value}%", color: "#9ca3af", fontSize: 10 },
      splitLine: { lineStyle: { color: "#f3f4f6" } },
    },
    series: [{
      name: seriesLabel,
      type: "bar",
      data: data.map((p) => ({
        value: denomKey ? pct(p[valueKey], p[denomKey]) : p[valueKey],
        itemStyle: { color: colorFn ? colorFn(p) : color, borderRadius: [3, 3, 0, 0] },
      })),
      label: {
        show: true, position: "top", fontSize: 10, color: "#374151",
        formatter: (v) => v.value > 0 ? `${v.value}%` : "",
      },
      barMaxWidth: 44,
      markLine: avg != null ? {
        silent: true,
        symbol: "none",
        lineStyle: { color: "#6366f1", type: "dashed", width: 1.5 },
        label: { formatter: `평균 ${avg}%`, position: "end", color: "#6366f1", fontSize: 10, fontWeight: "bold" },
        data: [{ yAxis: avg }],
      } : undefined,
    }],
  };
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

// Accordion 섹션
function AccordionSection({ label, severity, count, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-lg overflow-hidden ${SEVERITY_BORDER[severity]}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${SEVERITY_CELL[severity]}`}>{count}건</span>
          <span className="text-xs font-semibold text-gray-700">{label}</span>
        </div>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-3 py-3 border-t border-gray-100 bg-white">{children}</div>}
    </div>
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
    return <p className="text-xs text-emerald-600 py-1">이슈 없음</p>;
  }

  return (
    <div className="space-y-2">
      {sections.map((s) => (
        <AccordionSection key={s.label} label={s.label} severity={s.severity} count={s.count}>
          {s.content}
        </AccordionSection>
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

  // 차트 1: Split 미작성률 — % 높은 순
  const chart1Data = [...projectSummary]
    .filter((p) => p.experiment_count > 0)
    .sort((a, b) => pct(b.split_poor, b.experiment_count) - pct(a.split_poor, a.experiment_count));

  const chart1Option = makeBarOption({
    data: chart1Data,
    valueKey: "split_poor",
    denomKey: "experiment_count",
    color: null,
    colorFn: (p) => pct(p.split_poor, p.experiment_count) === 0 ? "#86efac" : "#f87171",
    seriesLabel: "Split 미작성률",
    avg: avgPct(chart1Data, "split_poor", "experiment_count"),
    tooltip: (params) => {
      const p = chart1Data[params[0].dataIndex];
      return `${p.iacpj_nm}<br/>전체 ${p.experiment_count}건 중 Split 불량 ${p.split_poor}건 (${params[0].value}%)`;
    },
  });

  // 차트 2a: Note 누락률 — OPER행 있는 과제 전체, % 높은 순
  const chart2aData = [...projectSummary]
    .filter((p) => p.oper_row_count > 0)
    .sort((a, b) => pct(b.note_missing, b.oper_row_count) - pct(a.note_missing, a.oper_row_count));

  const chart2aOption = makeBarOption({
    data: chart2aData,
    valueKey: "note_missing",
    denomKey: "oper_row_count",
    color: null,
    colorFn: (p) => pct(p.note_missing, p.oper_row_count) === 0 ? "#86efac" : "#fbbf24",
    seriesLabel: "Note 누락률",
    avg: avgPct(chart2aData, "note_missing", "oper_row_count"),
    tooltip: (params) => {
      const p = chart2aData[params[0].dataIndex];
      return `${p.iacpj_nm}<br/>OPER행 ${p.oper_row_count}건 중 Note 누락 ${p.note_missing}건 (${params[0].value}%)`;
    },
  });

  // 차트 2b: 조건 누락률 — OPER행 있는 과제 전체, % 높은 순
  const chart2bData = [...projectSummary]
    .filter((p) => p.oper_row_count > 0)
    .sort((a, b) => pct(b.cond_missing, b.oper_row_count) - pct(a.cond_missing, a.oper_row_count));

  const chart2bOption = makeBarOption({
    data: chart2bData,
    valueKey: "cond_missing",
    denomKey: "oper_row_count",
    color: null,
    colorFn: (p) => pct(p.cond_missing, p.oper_row_count) === 0 ? "#86efac" : "#f97316",
    seriesLabel: "조건 누락률",
    avg: avgPct(chart2bData, "cond_missing", "oper_row_count"),
    tooltip: (params) => {
      const p = chart2bData[params[0].dataIndex];
      return `${p.iacpj_nm}<br/>OPER행 ${p.oper_row_count}건 중 조건 누락 ${p.cond_missing}건 (${params[0].value}%)`;
    },
  });

  // 차트 3: 평가아이템 중복률 — 전체 실험 대비 %, % 높은 순
  const chart3Data = [...projectSummary]
    .filter((p) => p.experiment_count > 0)
    .sort((a, b) => pct(b.dup_eval, b.experiment_count) - pct(a.dup_eval, a.experiment_count));

  const chart3Option = makeBarOption({
    data: chart3Data,
    valueKey: "dup_eval",
    denomKey: "experiment_count",
    color: null,
    colorFn: (p) => pct(p.dup_eval, p.experiment_count) === 0 ? "#86efac" : "#a78bfa",
    seriesLabel: "중복률",
    avg: avgPct(chart3Data, "dup_eval", "experiment_count"),
    tooltip: (params) => {
      const p = chart3Data[params[0].dataIndex];
      return `${p.iacpj_nm}<br/>전체 ${p.experiment_count}건 중 평가아이템 중복 ${p.dup_eval}건 (${params[0].value}%)`;
    },
  });

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

      {/* 차트 — 각각 전체 폭 한 행 */}
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-600 mb-1">
            Split Table 미작성률
            <span className="font-normal text-gray-400 ml-1">(불량 실험 / 전체 실험, % 높은 순)</span>
          </p>
          <ReactECharts option={chart1Option} style={{ height: 220 }} />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-600 mb-1">
            Note 누락률
            <span className="font-normal text-gray-400 ml-1">(OPER_ID 있는 행 중 Note 누락 %, 높은 순)</span>
          </p>
          <ReactECharts option={chart2aOption} style={{ height: 220 }} />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-600 mb-1">
            조건 누락률
            <span className="font-normal text-gray-400 ml-1">(OPER_ID 있는 행 중 작업조건 누락 %, 높은 순)</span>
          </p>
          <ReactECharts option={chart2bOption} style={{ height: 220 }} />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-600 mb-1">
            평가아이템 중복률
            <span className="font-normal text-gray-400 ml-1">(중복 아이템 / 전체 실험, % 높은 순)</span>
          </p>
          <ReactECharts option={chart3Option} style={{ height: 220 }} />
        </div>
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
            {[...projectSummary]
              .filter((p) => p.experiment_count > 0)
              .sort((a, b) => b.experiment_count - a.experiment_count)
              .map((proj) => {
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
                          <Badge count={proj[col.key]} denom={proj[col.denomKey] || 0} severity={col.severity} />
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
