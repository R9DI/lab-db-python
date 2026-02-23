import { useState, useEffect } from "react";
import axios from "axios";

// 이슈 섹션 컴포넌트
function IssueSection({ title, description, count, severity, children }) {
  const [open, setOpen] = useState(true);

  const severityStyle = {
    critical: "border-red-300 bg-red-50",
    warning: "border-amber-300 bg-amber-50",
    info: "border-blue-300 bg-blue-50",
  }[severity];

  const badgeStyle = {
    critical: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
  }[severity];

  const dotStyle = {
    critical: "bg-red-500",
    warning: "bg-amber-400",
    info: "bg-blue-400",
  }[severity];

  return (
    <div className={`border rounded-lg overflow-hidden ${count === 0 ? "border-gray-200 bg-white" : severityStyle}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full shrink-0 ${count === 0 ? "bg-emerald-400" : dotStyle}`} />
          <div>
            <span className="font-semibold text-gray-800 text-sm">{title}</span>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {count === 0 ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">이상 없음</span>
          ) : (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeStyle}`}>{count}건</span>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && count > 0 && (
        <div className="border-t border-gray-200 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// 과제별 그룹핑 헬퍼
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || "(과제명 없음)";
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

function GroupedTable({ data, groupKey, columns }) {
  const groups = groupBy(data, groupKey);
  return (
    <div className="divide-y divide-gray-100">
      {Object.entries(groups).map(([groupName, rows]) => (
        <div key={groupName} className="px-5 py-3">
          <p className="text-xs font-semibold text-indigo-700 mb-2">{groupName} ({rows.length}건)</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                {columns.map((col) => (
                  <th key={col.key} className="text-left font-medium pb-1 pr-4">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row, i) => (
                <tr key={i} className="text-gray-700">
                  {columns.map((col) => (
                    <td key={col.key} className="py-1 pr-4 max-w-[240px] truncate" title={col.render ? undefined : row[col.key]}>
                      {col.render ? col.render(row) : (row[col.key] || <span className="text-gray-300">-</span>)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default function DBAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("/api/analysis")
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => { setError("데이터를 불러오지 못했습니다."); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">분석 중...</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-400">{error}</div>;

  const { summary, issues } = data;
  const { splitPoor, dupEvalItem, noteMissing, condMissing, fieldMissing, lotMissing } = issues;

  const splitCoverage = summary.total_experiments > 0
    ? Math.round((summary.experiments_with_split / summary.total_experiments) * 100)
    : 0;

  // 전체 이슈 건수
  const totalIssues = splitPoor.length + dupEvalItem.length + noteMissing.length + condMissing.length + fieldMissing.length + lotMissing.length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">실험 통합 DB 분석</h1>
          <p className="text-sm text-gray-500 mt-0.5">실험 및 Split Table 데이터 품질 모니터링</p>
        </div>
        {totalIssues > 0 ? (
          <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold">총 {totalIssues}건 이슈</span>
        ) : (
          <span className="text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">이슈 없음</span>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "등록 과제", value: summary.total_projects, unit: "개", color: "text-indigo-600" },
          { label: "등록 실험", value: summary.total_experiments, unit: "건", color: "text-indigo-600" },
          { label: "Split Table 보유 실험", value: summary.experiments_with_split, unit: "건", color: "text-emerald-600" },
          { label: "Split Table 커버리지", value: splitCoverage, unit: "%", color: splitCoverage >= 80 ? "text-emerald-600" : splitCoverage >= 50 ? "text-amber-500" : "text-red-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}<span className="text-sm font-normal text-gray-400 ml-0.5">{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 이슈 섹션들 */}
      <div className="space-y-3">

        {/* 1. Split Table 불량 */}
        <IssueSection
          title="Split Table 작성 불량"
          description="실험은 등록됐으나 Split Table이 0~1행인 경우"
          count={splitPoor.length}
          severity="critical"
        >
          <GroupedTable
            data={splitPoor}
            groupKey="iacpj_nm"
            columns={[
              { key: "plan_id", label: "Plan ID" },
              { key: "eval_item", label: "평가아이템" },
              { key: "eval_process", label: "평가공정" },
              { key: "lot_code", label: "LOT" },
              { key: "split_row_count", label: "Split행수", render: (row) => (
                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-semibold">{row.split_row_count}행</span>
              )},
            ]}
          />
        </IssueSection>

        {/* 2. 평가아이템 중복 */}
        <IssueSection
          title="평가아이템 중복 (실험 구분 불량)"
          description="같은 과제 내에 동일한 평가아이템이 여러 실험에 반복 사용되어 LOT으로만 구분 가능한 경우"
          count={dupEvalItem.length}
          severity="warning"
        >
          <div className="divide-y divide-gray-100">
            {Object.entries(groupBy(dupEvalItem, "iacpj_nm")).map(([proj, rows]) => (
              <div key={proj} className="px-5 py-3">
                <p className="text-xs font-semibold text-indigo-700 mb-2">{proj}</p>
                {rows.map((row, i) => (
                  <div key={i} className="mb-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold shrink-0">{row.dup_count}개 실험</span>
                      <div>
                        <p className="text-gray-800 font-medium">{row.eval_item}</p>
                        <p className="text-gray-400">공정: {row.eval_process || "-"}</p>
                        <p className="text-gray-400">Plan ID: {row.plan_ids}</p>
                        <p className="text-gray-400">LOT: {row.lot_codes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </IssueSection>

        {/* 3. Note 누락 */}
        <IssueSection
          title="Split Table Note 누락"
          description="OPER_ID가 입력된 Split 행인데 Note가 비어있는 경우"
          count={noteMissing.length}
          severity="warning"
        >
          <GroupedTable
            data={noteMissing}
            groupKey="iacpj_nm"
            columns={[
              { key: "plan_id", label: "Plan ID" },
              { key: "eval_item", label: "평가아이템" },
              { key: "oper_id", label: "OPER_ID" },
              { key: "oper_nm", label: "공정명" },
              { key: "note", label: "Note", render: () => <span className="text-red-400">미입력</span> },
            ]}
          />
        </IssueSection>

        {/* 4. 조건 누락 */}
        <IssueSection
          title="Split Table 조건 누락"
          description="OPER_ID가 입력된 Split 행인데 작업조건(work_cond_desc)이 비어있는 경우"
          count={condMissing.length}
          severity="warning"
        >
          <GroupedTable
            data={condMissing}
            groupKey="iacpj_nm"
            columns={[
              { key: "plan_id", label: "Plan ID" },
              { key: "eval_item", label: "평가아이템" },
              { key: "oper_id", label: "OPER_ID" },
              { key: "oper_nm", label: "공정명" },
              { key: "work_cond_desc", label: "조건", render: () => <span className="text-red-400">미입력</span> },
            ]}
          />
        </IssueSection>

        {/* 5. 핵심 필드 누락 */}
        <IssueSection
          title="실험 핵심 필드 누락"
          description="평가아이템 또는 평가공정이 미입력된 실험"
          count={fieldMissing.length}
          severity="warning"
        >
          <GroupedTable
            data={fieldMissing}
            groupKey="iacpj_nm"
            columns={[
              { key: "plan_id", label: "Plan ID" },
              { key: "lot_code", label: "LOT" },
              { key: "missing_fields", label: "누락 필드", render: (row) => (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{row.missing_fields}</span>
              )},
            ]}
          />
        </IssueSection>

        {/* 6. LOT 누락 */}
        <IssueSection
          title="LOT 코드 누락"
          description="lot_code가 미입력된 실험"
          count={lotMissing.length}
          severity="info"
        >
          <GroupedTable
            data={lotMissing}
            groupKey="iacpj_nm"
            columns={[
              { key: "plan_id", label: "Plan ID" },
              { key: "eval_item", label: "평가아이템" },
              { key: "eval_process", label: "평가공정" },
            ]}
          />
        </IssueSection>

      </div>
    </div>
  );
}
