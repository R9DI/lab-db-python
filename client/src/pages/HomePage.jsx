import { Fragment } from "react";
import { useNavigate } from "react-router-dom";

const DB_TABLES = [
  {
    icon: "📁",
    title: "과제 (Projects)",
    desc: "연구 과제 기본 정보\n목표 · 담당자 · 일정",
  },
  {
    icon: "🧪",
    title: "실험 조건 (Experiments)",
    desc: "실험 계획 및 조건\nPlan ID · 평가 항목",
  },
  {
    icon: "📋",
    title: "실험 조건 (Split Table)",
    desc: "공정별 실험 조건\n장비 · Recipe · 변수",
  },
  {
    icon: "📈",
    title: "실험 결과 (Lot Summary)",
    desc: "LOT 별 실험결과\nInline/Outline 분석",
  },
];

const FLOW_STEPS = [
  {
    num: 1,
    icon: "✏️",
    title: "실험 계획",
    headerBg: "bg-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    dot: "text-violet-500",
    items: ["과거 실험 탐색·참조", "신규 실험 신청", "AI 도우미 활용"],
    desc: "DB 데이터를 참조해 새 실험 조건을 기획하고 신청합니다.",
    link: "/new-experiment",
  },
  {
    num: 2,
    icon: "🔗",
    title: "Lot Assign",
    headerBg: "bg-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "text-blue-500",
    items: ["라인 진행 랏 조회", "실험 랏 배정", "Split 조건 매핑"],
    desc: "라인에서 진행 중인 랏을 실험에 배정합니다.",
    link: "/lot-assign",
  },
  {
    num: 3,
    icon: "⚙️",
    title: "FAB 진행",
    headerBg: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "text-amber-500",
    items: ["Split 조건 적용", "공정 실행 (In Fab)", "Fab Out → EPM / WT"],
    desc: "배정된 랏이 Split 조건에 따라 FAB에서 공정을 진행합니다.",
    link: null,
  },
  {
    num: 4,
    icon: "📊",
    title: "실험 관리",
    headerBg: "bg-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "text-emerald-500",
    items: ["Fab 상태 추적", "결과 데이터 등록", "Summary 완료 처리"],
    desc: "결과를 등록·관리합니다. 데이터는 DB에 축적되어 선순환합니다.",
    link: "/progress",
  },
];

const QUICK_LINKS = [
  { title: "통합 DB", desc: "전체 실험 데이터 조회", icon: "🗄️", link: "/", color: "text-indigo-600", border: "hover:border-indigo-300" },
  { title: "실험 탐색", desc: "과거 실험 검색·분석", icon: "🔍", link: "/search", color: "text-violet-600", border: "hover:border-violet-300" },
  { title: "Lot Assign", desc: "라인 랏 배정", icon: "🔗", link: "/lot-assign", color: "text-blue-600", border: "hover:border-blue-300" },
  { title: "실험 관리", desc: "진행 현황 관리", icon: "📊", link: "/progress", color: "text-emerald-600", border: "hover:border-emerald-300" },
];

function ArrowRight() {
  return (
    <div className="flex items-center justify-center shrink-0 w-6">
      <svg width="24" height="20" viewBox="0 0 24 20">
        <path d="M2 10 L18 10" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="3 2" />
        <polygon points="14,4 24,10 14,16" fill="#CBD5E1" />
      </svg>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto space-y-5 py-1">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">시스템 개요</h1>
        <p className="text-sm text-gray-500 mt-1">실험 통합 관리 시스템의 구성 및 데이터 흐름</p>
      </div>

      {/* 메인 다이어그램 카드 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">

        {/* ── DB Hub ── */}
        <div className="bg-indigo-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🗄️</span>
            <div>
              <h2 className="text-lg font-bold">실험 통합 DB</h2>
              <p className="text-indigo-200 text-xs mt-0.5">
                모든 실험 정보의 중심 허브 — 과거 데이터를 기반으로 새 실험을 설계합니다
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {DB_TABLES.map((t) => (
              <div key={t.title} className="bg-white/10 rounded-lg px-4 py-3">
                <div className="text-xl mb-1.5">{t.icon}</div>
                <div className="font-semibold text-sm">{t.title}</div>
                <div className="text-indigo-200 text-[11px] mt-1 whitespace-pre-line leading-relaxed">
                  {t.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DB ↔ 플로우 연결 화살표 ── */}
        <div className="flex items-start justify-between px-6">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-px h-5 bg-gray-300" />
            <svg width="10" height="7" viewBox="0 0 10 7">
              <polygon points="0,0 10,0 5,7" fill="#D1D5DB" />
            </svg>
            <span className="text-[10px] text-gray-400 mt-0.5">참조·활용</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-indigo-400 mb-0.5">결과 업데이트</span>
            <svg width="10" height="7" viewBox="0 0 10 7">
              <polygon points="0,7 10,7 5,0" fill="#A5B4FC" />
            </svg>
            <div className="w-px h-5 bg-indigo-300" />
          </div>
        </div>

        {/* ── 4단계 플로우 ── */}
        <div className="flex items-stretch gap-1.5">
          {FLOW_STEPS.map((step, i) => (
            <Fragment key={step.num}>
              <div
                className={`flex-1 border-2 ${step.border} ${step.bg} rounded-xl overflow-hidden ${
                  step.link ? "cursor-pointer hover:shadow-md transition-shadow" : ""
                }`}
                onClick={() => step.link && navigate(step.link)}
                title={step.link ? `${step.title} 페이지로 이동` : ""}
              >
                {/* 스텝 헤더 */}
                <div className={`${step.headerBg} text-white px-3 py-2 flex items-center gap-2`}>
                  <span className="text-base">{step.icon}</span>
                  <div>
                    <div className="text-[9px] text-white/60 uppercase tracking-wider">STEP {step.num}</div>
                    <div className="text-sm font-bold leading-tight">{step.title}</div>
                  </div>
                </div>
                {/* 내용 */}
                <div className="px-3 py-3 space-y-1.5">
                  {step.items.map((item) => (
                    <div key={item} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <span className={`${step.dot} font-bold mt-px shrink-0`}>•</span>
                      {item}
                    </div>
                  ))}
                  <p className="text-[10px] text-gray-400 mt-2 leading-relaxed border-t border-gray-200/70 pt-2">
                    {step.desc}
                  </p>
                </div>
              </div>
              {i < FLOW_STEPS.length - 1 && <ArrowRight />}
            </Fragment>
          ))}
        </div>

        {/* ── 선순환 ── */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 border-t-2 border-dashed border-indigo-200" />
          <div className="flex items-center gap-2 text-xs text-indigo-500 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 whitespace-nowrap">
            <span>🔄</span>
            <span>선순환: 실험 결과 DB 축적 → 다음 실험 설계에 활용</span>
          </div>
          <div className="flex-1 border-t-2 border-dashed border-indigo-200" />
        </div>
      </div>

      {/* 빠른 이동 */}
      <div>
        <p className="text-xs text-gray-400 mb-2 font-medium">바로 가기</p>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_LINKS.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.link)}
              className={`bg-white border border-gray-200 ${item.border} rounded-xl p-4 text-left hover:shadow-md transition group`}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className={`font-semibold text-sm ${item.color}`}>{item.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
