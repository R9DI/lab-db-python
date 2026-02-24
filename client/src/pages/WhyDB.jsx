const PROBLEMS = [
  {
    num: "01",
    icon: "🗂️",
    color: "red",
    title: "Data 저장 비효율",
    subtitle: "분산 저장 → 관리 불가",
    desc: "과제·실험·Split Table·실험 결과가 각기 다른 시스템·엑셀·문서에 저장됩니다. 동일한 실험 정보가 여러 곳에 중복 기입되고, 버전이 엇갈리며, 담당자 교체 시 어느 파일이 최신인지 알 수 없습니다.",
    items: [
      "과제 정보 — 그룹웨어 문서",
      "실험 조건 — 담당자 개인 엑셀",
      "Split 조건 — 별도 공정 관리 파일",
      "측정 결과 — MES / 분석 보고서",
    ],
    pain: "같은 실험 하나를 파악하려면 4곳을 뒤져야 한다",
  },
  {
    num: "02",
    icon: "🔗",
    color: "orange",
    title: "맥락 부재",
    subtitle: "분리 저장 → 하나의 실험도 맥락이 없음",
    desc: "데이터가 분리되어 있기 때문에, 동일한 실험임에도 불구하고 '이 Split 조건이 어떤 과제의 어떤 목표를 위해 설계된 것인지' 파악할 수 없습니다. 결과만 있고 배경이 없거나, 조건만 있고 결과가 없는 상태가 반복됩니다.",
    items: [
      "\"이 LOT, 어떤 조건으로 진행됐지?\" → 담당자 문의",
      "\"이 결과, 어떤 목표를 검증하려 했지?\" → 문서 탐색",
      "조건·결과·목표가 각각 단절된 섬",
      "담당자 퇴사 시 배경 지식 완전 소실",
    ],
    pain: "결과 숫자는 있지만 왜 그 조건인지 아무도 모른다",
  },
  {
    num: "03",
    icon: "🔍",
    color: "amber",
    title: "연속적 검색 불가",
    subtitle: "맥락 없음 → 이어서 탐색 불가능",
    desc: "맥락이 없으면 검색도 단편적으로 끊깁니다. '이 공정 조건으로 진행한 LOT의 결과는?' 같은 한 줄짜리 질문도 여러 시스템을 수동으로 오가며 대조해야 합니다. 검색이 깊어질수록 시간은 기하급수적으로 늘어납니다.",
    items: [
      "과제명으로 실험 찾기 → 수동 엑셀 필터",
      "실험 조건으로 결과 추적 → 시스템 간 수동 대조",
      "유사 실험 탐색 → 기억 또는 전체 파일 탐색",
      "이력 추적 → 담당자 구두 확인 필요",
    ],
    pain: "한 번 검색에 수 시간, 그래도 빠뜨리는 케이스 발생",
  },
  {
    num: "04",
    icon: "🤖",
    color: "violet",
    title: "AI 활용 불가",
    subtitle: "맥락 없음 → AI도 답을 모른다",
    desc: "AI는 구조화된 맥락이 있어야 추론할 수 있습니다. 데이터가 분절되어 있으면 AI에게 \"이 과제에 최적 조건이 뭔지 추천해줘\"라고 물어도, AI가 참조할 수 있는 연결된 정보가 없기 때문에 의미 있는 답변을 줄 수 없습니다.",
    items: [
      "과거 성공 조건 기반 추천 → 불가 (데이터 단절)",
      "유사 실험 자동 제안 → 불가 (맥락 없음)",
      "조건 변경 시 영향 예측 → 불가 (결과 연결 없음)",
      "신규 실험 설계 보조 → 불가 (배경 지식 없음)",
    ],
    pain: "데이터는 쌓이는데, AI는 그걸 활용할 수 없다",
  },
];

const COLOR = {
  red:    { hdr: "bg-red-500",    bg: "bg-red-50",    border: "border-red-200",   badge: "bg-red-100 text-red-700",    dot: "text-red-400",    pain: "bg-red-100 text-red-700",    num: "text-red-200"    },
  orange: { hdr: "bg-orange-500", bg: "bg-orange-50", border: "border-orange-200",badge: "bg-orange-100 text-orange-700",dot:"text-orange-400", pain: "bg-orange-100 text-orange-700",num:"text-orange-200" },
  amber:  { hdr: "bg-amber-500",  bg: "bg-amber-50",  border: "border-amber-200", badge: "bg-amber-100 text-amber-700",  dot: "text-amber-400",  pain: "bg-amber-100 text-amber-700",  num: "text-amber-200"  },
  violet: { hdr: "bg-violet-600", bg: "bg-violet-50", border: "border-violet-200",badge: "bg-violet-100 text-violet-700",dot:"text-violet-400", pain: "bg-violet-100 text-violet-700",num:"text-violet-200" },
};

const AFTER = [
  { icon: "🗄️", title: "단일 저장소", desc: "과제·실험·Split·결과가\n하나의 DB에 연결 저장" },
  { icon: "🔗", title: "완전한 맥락", desc: "실험 하나가 과제 목표부터\n결과까지 이어진 스토리" },
  { icon: "🔍", title: "연속 탐색", desc: "조건→결과, 과제→실험\n어느 방향으로도 즉시 탐색" },
  { icon: "🤖", title: "AI 추천 가능", desc: "맥락 기반 유사 실험 제안\n신규 실험 설계 보조" },
];

export default function WhyDB() {
  return (
    <div className="max-w-7xl mx-auto space-y-5 py-1">

      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">통합 DB 필요성</h1>
        <p className="text-sm text-gray-500 mt-1">
          데이터가 분산될 때 발생하는 4가지 문제의 연쇄 — 그리고 통합이 만드는 변화
        </p>
      </div>

      {/* DB 연결 구조 (컴팩트) */}
      <div className="bg-indigo-600 rounded-2xl px-6 py-4 flex items-center gap-4">
        <span className="text-2xl shrink-0">🗄️</span>
        <div className="flex-1">
          <div className="font-bold text-white text-sm">세 DB가 만드는 체인</div>
          <div className="text-indigo-200 text-xs mt-0.5">
            과제(Projects) → 실험조건(Experiments) → Split Table → 실험결과(Lot Summary)
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {["📁 Projects", "🧪 Experiments", "📋 Split", "📈 Lot Summary"].map((t, i) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="bg-white/15 text-white px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">{t}</span>
              {i < 3 && <span className="text-indigo-300">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* 4가지 문제 */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          분리 저장이 만드는 4가지 문제의 연쇄
        </p>

        <div className="grid grid-cols-4 gap-4">
          {PROBLEMS.map((p) => {
            const c = COLOR[p.color];
            return (
              <div key={p.num} className={`${c.bg} border ${c.border} rounded-2xl overflow-hidden flex flex-col`}>
                {/* 카드 헤더 */}
                <div className={`${c.hdr} px-4 py-3 flex items-start gap-3`}>
                  <span className={`text-5xl font-black ${c.num} leading-none mt-0.5 opacity-60`}>{p.num}</span>
                  <div>
                    <div className="text-white font-bold text-sm leading-tight">{p.title}</div>
                    <div className="text-white/70 text-[11px] mt-0.5 leading-snug">{p.subtitle}</div>
                  </div>
                </div>

                {/* 설명 */}
                <div className="px-4 pt-3 pb-2 flex-1">
                  <p className="text-xs text-gray-600 leading-relaxed">{p.desc}</p>
                  <ul className="mt-3 space-y-1.5">
                    {p.items.map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-[11px] text-gray-500">
                        <span className={`${c.dot} font-bold mt-px shrink-0`}>•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pain 포인트 */}
                <div className={`mx-3 mb-3 px-3 py-2 rounded-xl ${c.pain} text-[11px] font-semibold leading-snug`}>
                  💢 {p.pain}
                </div>
              </div>
            );
          })}
        </div>

        {/* 연쇄 화살표 표시 */}
        <div className="flex items-center gap-1 mt-2 px-2">
          {PROBLEMS.map((p, i) => (
            <span key={p.num} className="flex items-center gap-1 flex-1">
              <span className={`text-[10px] font-semibold ${COLOR[p.color].dot} flex-1 text-center`}>
                {p.title}
              </span>
              {i < PROBLEMS.length - 1 && (
                <span className="text-gray-300 text-sm shrink-0">→</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* 통합 후 */}
      <div className="bg-indigo-600 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">✅</span>
          <span className="font-bold text-white text-sm">통합 DB가 4가지 문제를 한번에 해결</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {AFTER.map((a, i) => (
            <div key={a.title} className="bg-white/10 rounded-xl px-4 py-3 flex gap-3 items-start">
              <span className="text-xl shrink-0">{a.icon}</span>
              <div>
                <div className="text-white font-semibold text-sm">{a.title}</div>
                <div className="text-indigo-200 text-[11px] mt-1 leading-relaxed whitespace-pre-line">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center text-indigo-200 text-xs leading-relaxed">
          과제 → 실험 조건 → Split → 결과로 이어지는 체인이 완성될 때,{" "}
          <span className="text-white font-semibold">
            AI가 맥락을 이해하고 새 실험을 설계하는 지식 기반
          </span>
          이 됩니다.
        </div>
      </div>

    </div>
  );
}
