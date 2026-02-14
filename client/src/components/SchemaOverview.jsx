import { useState, useRef, useEffect } from "react";

// ─── 테이블 카드 색상 설정 ───
const TABLE_COLORS = {
  projects: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    header: "bg-indigo-600",
    dot: "bg-indigo-500",
    accent: "text-indigo-600",
    glow: "shadow-indigo-100",
  },
  experiments: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    header: "bg-emerald-600",
    dot: "bg-emerald-500",
    accent: "text-emerald-600",
    glow: "shadow-emerald-100",
  },
  splits: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    header: "bg-amber-600",
    dot: "bg-amber-500",
    accent: "text-amber-600",
    glow: "shadow-amber-100",
  },
};

// ─── 테이블 정의 ───
const TABLES = [
  {
    key: "projects",
    name: "Projects",
    label: "과제",
    icon: "📁",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "project_name", type: "TEXT", unique: true, highlight: true },
      { name: "module", type: "TEXT" },
      { name: "pm", type: "TEXT" },
      { name: "project_code", type: "TEXT" },
      { name: "dev_type", type: "TEXT" },
      { name: "project_purpose", type: "TEXT" },
      { name: "...", type: "", note: "외 5개 필드" },
    ],
  },
  {
    key: "experiments",
    name: "Experiments",
    label: "실험",
    icon: "🧪",
    fields: [
      { name: "id", type: "PK", pk: true },
      {
        name: "project_name",
        type: "FK → Projects",
        fk: true,
        highlight: true,
      },
      {
        name: "plan_id",
        type: "Lot ID",
        highlight: true,
        nullable: true,
        note: "Lot 배정 시 채워짐",
      },
      { name: "eval_item", type: "TEXT" },
      { name: "eval_process", type: "TEXT" },
      { name: "status", type: "TEXT" },
      { name: "team / requester", type: "TEXT" },
      { name: "...", type: "", note: "외 8개 필드" },
    ],
  },
  {
    key: "splits",
    name: "Split Tables",
    label: "Split Table",
    icon: "📊",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "plan_id", type: "FK → Experiments", fk: true, highlight: true },
      { name: "oper_id / oper_nm", type: "TEXT" },
      { name: "eqp_id / recipe_id", type: "TEXT" },
      { name: "work_cond_desc", type: "TEXT" },
      { name: "user_def_val_1~15", type: "TEXT", note: "WF 배정" },
      { name: "note", type: "TEXT" },
    ],
  },
];

// ─── 관계 정의 ───
const RELATIONS = [
  {
    from: "projects",
    to: "experiments",
    label: "1 : N",
    desc: "하나의 과제에\n여러 실험 소속",
    viaField: "project_name",
  },
  {
    from: "experiments",
    to: "splits",
    label: "1 : N",
    desc: "Lot 배정 후\nplan_id로 연결",
    viaField: "plan_id",
  },
];

function TableCard({ table, color, isHovered, onHover, onLeave }) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        relative rounded-xl border-2 ${color.border} ${color.bg}
        transition-all duration-300 overflow-hidden
        ${isHovered ? `scale-[1.02] shadow-xl ${color.glow}` : "shadow-md"}
      `}
      style={{ width: 220 }}
    >
      {/* 헤더 */}
      <div className={`${color.header} px-4 py-2.5 flex items-center gap-2`}>
        <span className="text-lg">{table.icon}</span>
        <div>
          <div className="text-white font-bold text-sm">{table.name}</div>
          <div className="text-white/70 text-[10px]">{table.label}</div>
        </div>
      </div>

      {/* 필드 목록 */}
      <div className="px-3 py-2 space-y-0.5">
        {table.fields.map((field, i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-1 px-2 rounded text-xs
              ${field.highlight ? `${color.bg} border border-dashed ${color.border}` : ""}
              ${field.pk ? "font-bold" : ""}
            `}
          >
            <div className="flex items-center gap-1.5">
              {field.pk && (
                <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1 rounded font-bold">
                  PK
                </span>
              )}
              {field.fk && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded font-bold">
                  FK
                </span>
              )}
              {field.nullable && (
                <span className="text-[10px] bg-orange-100 text-orange-600 px-1 rounded font-bold">
                  NULL
                </span>
              )}
              <span
                className={`${field.highlight ? color.accent + " font-semibold" : "text-gray-700"}`}
              >
                {field.name}
              </span>
            </div>
            <span className="text-gray-400 text-[10px] ml-2 truncate max-w-[80px]">
              {field.note || field.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectionArrow({ relation, index }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ width: 100 }}
    >
      {/* 관계 레이블 */}
      <div className="bg-white border-2 border-gray-200 rounded-full px-3 py-1 shadow-sm mb-2">
        <span className="text-xs font-bold text-gray-700">
          {relation.label}
        </span>
      </div>
      {/* 화살표 SVG */}
      <svg
        width="100"
        height="40"
        viewBox="0 0 100 40"
        className="overflow-visible"
      >
        <defs>
          <marker
            id={`arrowhead-${index}`}
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#6366F1" />
          </marker>
        </defs>
        {/* 연결선 */}
        <line
          x1="5"
          y1="20"
          x2="90"
          y2="20"
          stroke="#6366F1"
          strokeWidth="2"
          strokeDasharray="6 3"
          markerEnd={`url(#arrowhead-${index})`}
        >
          <animate
            attributeName="stroke-dashoffset"
            from="18"
            to="0"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </line>
      </svg>
      {/* 설명 텍스트 */}
      <div className="text-center mt-1">
        <div className="text-[10px] text-gray-500 leading-tight whitespace-pre-line">
          {relation.desc}
        </div>
        <div className="text-[10px] text-indigo-500 font-mono mt-0.5">
          via {relation.viaField}
        </div>
      </div>
    </div>
  );
}

export default function SchemaOverview() {
  const [expanded, setExpanded] = useState(true);
  const [hoveredTable, setHoveredTable] = useState(null);

  return (
    <div className="mb-6">
      {/* 헤더 (클릭 시 접기/펼기) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2 group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
          <h2 className="text-sm font-semibold text-gray-500">
            📐 데이터 구조 (ER Diagram)
          </h2>
          <span className="text-[11px] text-gray-300">
            3개 테이블 · 2개 관계
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 다이어그램 본체 */}
      {expanded && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
          {/* 메인 다이어그램 */}
          <div className="flex items-start justify-center gap-0 min-w-[720px]">
            {TABLES.map((table, idx) => (
              <div key={table.key} className="flex items-start">
                <TableCard
                  table={table}
                  color={TABLE_COLORS[table.key]}
                  isHovered={hoveredTable === table.key}
                  onHover={() => setHoveredTable(table.key)}
                  onLeave={() => setHoveredTable(null)}
                />
                {idx < RELATIONS.length && (
                  <div className="flex items-center pt-16">
                    <ConnectionArrow relation={RELATIONS[idx]} index={idx} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 하단 범례 */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-6 text-[11px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 bg-indigo-400 border-dashed" />
              <span>Foreign Key 관계</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1 rounded font-bold">
                PK
              </span>
              <span>Primary Key</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded font-bold">
                FK
              </span>
              <span>Foreign Key</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-orange-100 text-orange-600 px-1 rounded font-bold">
                NULL
              </span>
              <span>Nullable (생성 시 비어있음)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
              과제
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-1" />
              실험
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block ml-1" />
              Split Table
            </div>
          </div>

          <div className="mt-3 bg-gray-50 rounded-lg px-4 py-3 text-[11px] text-gray-500 leading-relaxed">
            <strong className="text-gray-600">💡 데이터 흐름:</strong>{" "}
            <span className="text-indigo-600 font-medium">과제(Project)</span>를
            먼저 생성하고, 해당 과제 아래에{" "}
            <span className="text-emerald-600 font-medium">
              실험(Experiment)
            </span>
            을 신청합니다.
            <span className="text-orange-500 font-medium">
              {" "}
              이때 plan_id는 비어있는 상태(NULL)
            </span>
            이며, Lot Assign에서 자재를 배정하면 plan_id에 Lot ID가 채워집니다.
            이후 <span className="text-amber-600 font-medium">Split Table</span>
            이 plan_id로 연결되어 WF별 실험 조건을 관리합니다.
          </div>
        </div>
      )}
    </div>
  );
}
