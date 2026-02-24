import { useState, useEffect, useRef } from "react";
import { Splitter } from "antd";

/* ─── 데모 예시 데이터 ─── */
const DEMO_PROJECT_NAME = "ESL CMP 신뢰성 향상";

const DEMO_PAST = [
  {
    id: "A", label: "CMP 균일도 개선",
    summary:
      "📋 CMP 균일도 개선 (2024-03)\n\n" +
      "• 목표: WIW 균일도 5% → 2% 이하\n" +
      "• 평가항목: CMP 균일도, 제거율\n" +
      "• 조건: Slurry SS-25, 압력 3 psi, 패드 A타입, 87 rpm\n" +
      "• 결과: WIW 1.8% 달성 ✅",
    fill: { evalItem: "CMP 균일도, 제거율", evalProcess: "CMP", lotCode: "RSAB2401" },
  },
  {
    id: "B", label: "Post-CMP 세정 최적화",
    summary:
      "📋 Post-CMP 세정 최적화 (2024-07)\n\n" +
      "• 목표: 세정 후 Particle 30% 감소\n" +
      "• 평가항목: Particle count, 표면 오염도\n" +
      "• 조건: NH₄OH 0.5%, 세정 45 s, 메가소닉 ON\n" +
      "• 결과: Particle 35% 감소 ✅",
    fill: { evalItem: "Particle count, 표면 오염도", evalProcess: "Post-CMP 세정", lotCode: "RSCD2407" },
  },
  {
    id: "C", label: "Slurry 공급사 교체 검증",
    summary:
      "📋 Slurry A사→B사 교체 검증 (2024-10)\n\n" +
      "• 목표: 공급사 변경 후 동등성 확인\n" +
      "• 평가항목: 제거율, 표면 거칠기(Ra), 스크래치\n" +
      "• 조건: B사 SF-30, 기존 공정 조건 유지\n" +
      "• 결과: Ra 0.8 nm, 제거율 동등 확인 ✅",
    fill: { evalItem: "제거율, 표면 거칠기(Ra), 스크래치", evalProcess: "CMP", lotCode: "RSEF2410" },
  },
  {
    id: "D", label: "속도-균일도 트레이드오프 탐색",
    summary:
      "📋 CMP 속도-균일도 트레이드오프 (2025-01)\n\n" +
      "• 목표: 처리량↑ vs 균일도 균형점 탐색\n" +
      "• 평가항목: WIW 균일도, 제거율, 처리시간\n" +
      "• 조건: 70 / 80 / 93 / 100 rpm 4-Split\n" +
      "• 결과: 93 rpm 최적 ✅",
    fill: { evalItem: "WIW 균일도, 제거율, 처리시간", evalProcess: "CMP", lotCode: "RSAB2501" },
  },
];

const EMPTY_SPLITS = [
  { split: "base", cond: "", eqp: "", recipe: "", note: "", wafers: [] },
  { split: "S1",   cond: "", eqp: "", recipe: "", note: "", wafers: [] },
  { split: "S2",   cond: "", eqp: "", recipe: "", note: "", wafers: [] },
  { split: "S3",   cond: "", eqp: "", recipe: "", note: "", wafers: [] },
];

const DOE_OPTIONS = [
  {
    id: "A", label: "균등 배분 (4-4-4-3)", dist: [4, 4, 4, 3],
    desc: "DOE 기본 원칙: 각 조건에 동일한 웨이퍼 수 배정",
    rows: [
      { split: "base", cond: "Standard 기준 조건 (87 rpm)", eqp: "CMP-01", recipe: "STI_CMP_STD", note: "DOE 기준점", wafers: [1,2,3,4] },
      { split: "S1",   cond: "Pressure +10%",               eqp: "CMP-01", recipe: "STI_CMP_P10", note: "압력 증가 조건", wafers: [5,6,7,8] },
      { split: "S2",   cond: "Slurry flow -15%",            eqp: "CMP-02", recipe: "STI_CMP_SF85", note: "슬러리 감소 조건", wafers: [9,10,11,12] },
      { split: "S3",   cond: "RPM +15% (100 rpm)",          eqp: "CMP-02", recipe: "STI_CMP_R100", note: "속도 증가 조건", wafers: [13,14,15] },
    ],
  },
  {
    id: "B", label: "기준 강화 (6-3-3-3)", dist: [6, 3, 3, 3],
    desc: "기준 조건에 더 많은 데이터 포인트 확보 — 변동 조건 동등 배분",
    rows: [
      { split: "base", cond: "Standard 기준 조건 (87 rpm)", eqp: "CMP-01", recipe: "STI_CMP_STD", note: "DOE 기준점 (강화)", wafers: [1,2,3,4,5,6] },
      { split: "S1",   cond: "Pressure +10%",               eqp: "CMP-01", recipe: "STI_CMP_P10", note: "압력 증가 조건", wafers: [7,8,9] },
      { split: "S2",   cond: "Slurry flow -15%",            eqp: "CMP-02", recipe: "STI_CMP_SF85", note: "슬러리 감소 조건", wafers: [10,11,12] },
      { split: "S3",   cond: "RPM +15% (100 rpm)",          eqp: "CMP-02", recipe: "STI_CMP_R100", note: "속도 증가 조건", wafers: [13,14,15] },
    ],
  },
  {
    id: "C", label: "탐색 중심 (3-4-4-4)", dist: [3, 4, 4, 4],
    desc: "실험 조건 탐색에 더 많은 웨이퍼 — 변동 조건 각 4장",
    rows: [
      { split: "base", cond: "Standard 기준 조건 (87 rpm)", eqp: "CMP-01", recipe: "STI_CMP_STD", note: "DOE 기준점", wafers: [1,2,3] },
      { split: "S1",   cond: "Pressure +10%",               eqp: "CMP-01", recipe: "STI_CMP_P10", note: "압력 증가 조건", wafers: [4,5,6,7] },
      { split: "S2",   cond: "Slurry flow -15%",            eqp: "CMP-02", recipe: "STI_CMP_SF85", note: "슬러리 감소 조건", wafers: [8,9,10,11] },
      { split: "S3",   cond: "RPM +15% (100 rpm)",          eqp: "CMP-02", recipe: "STI_CMP_R100", note: "속도 증가 조건", wafers: [12,13,14,15] },
    ],
  },
  {
    id: "D", label: "과거 최적 중심 (4-3-5-3)", dist: [4, 3, 5, 3],
    desc: "과거 실험 D의 93 rpm 최적 조건에 더 많은 웨이퍼 배정",
    rows: [
      { split: "base", cond: "87 rpm (과거 기준)",          eqp: "CMP-01", recipe: "STI_CMP_R87", note: "과거 기준점", wafers: [1,2,3,4] },
      { split: "S1",   cond: "80 rpm",                      eqp: "CMP-01", recipe: "STI_CMP_R80", note: "속도 감소 조건", wafers: [5,6,7] },
      { split: "S2",   cond: "93 rpm (과거 최적 ✅)",        eqp: "CMP-01", recipe: "STI_CMP_R93", note: "과거 최적 조건 중심 배치", wafers: [8,9,10,11,12] },
      { split: "S3",   cond: "100 rpm",                     eqp: "CMP-01", recipe: "STI_CMP_R100", note: "속도 증가 조건", wafers: [13,14,15] },
    ],
  },
];

const SPLIT_STYLE = {
  base: { bg: "bg-indigo-500", light: "bg-indigo-50", border: "border-indigo-200", label: "bg-indigo-100 text-indigo-700", text: "text-indigo-700" },
  S1:   { bg: "bg-blue-500",   light: "bg-blue-50",   border: "border-blue-200",   label: "bg-blue-100 text-blue-700",   text: "text-blue-700"   },
  S2:   { bg: "bg-emerald-500",light: "bg-emerald-50",border: "border-emerald-200",label: "bg-emerald-100 text-emerald-700",text:"text-emerald-700"},
  S3:   { bg: "bg-amber-500",  light: "bg-amber-50",  border: "border-amber-200",  label: "bg-amber-100 text-amber-700", text: "text-amber-700"  },
};

/* ─── AI 봇 캐릭터 ─── */
function TigerCharacter({ onClick, speechText }) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); schedule(); }, 180);
      }, 2800 + Math.random() * 2200);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative shrink-0">
      {speechText && (
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 pointer-events-none z-50 w-max" style={{ maxWidth: 300 }}>
          <div className="bg-white border border-indigo-100 rounded-2xl px-3 py-2 text-xs text-gray-700 shadow-lg leading-relaxed whitespace-pre-line">
            {speechText}
          </div>
          <div className="absolute top-1/2 -right-[7px] -translate-y-1/2 w-3.5 h-3.5 bg-white border-r border-t border-indigo-100 rotate-45" />
        </div>
      )}
      <button onClick={onClick} className="hover:scale-110 active:scale-95 transition-transform cursor-pointer">
        <svg viewBox="0 0 90 64" width="64" height="46">
          <rect x="2" y="2" width="86" height="60" rx="16" fill="#4338CA"/>
          <ellipse cx="29" cy="32" rx="9" ry={blink ? 1.5 : 13} fill="white"
            style={{ transition: blink ? "ry 0.06s ease-in" : "ry 0.12s ease-out" }}/>
          <ellipse cx="61" cy="32" rx="9" ry={blink ? 1.5 : 13} fill="white"
            style={{ transition: blink ? "ry 0.06s ease-in" : "ry 0.12s ease-out" }}/>
        </svg>
      </button>
    </div>
  );
}

/* ─── Split Table 목업 ─── */
function SplitTableMock({ rows }) {
  const waferMap = {};
  rows.forEach(row => row.wafers.forEach(wf => { waferMap[wf] = row.split; }));
  const isEmpty = rows.every(r => r.wafers.length === 0);
  const totalWafers = rows.reduce((s, r) => s + r.wafers.length, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">📋 Split Table</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            isEmpty ? "bg-gray-100 text-gray-400" : "bg-emerald-100 text-emerald-600"
          }`}>
            {isEmpty ? "미입력" : `${totalWafers}장 배정됨`}
          </span>
        </div>
        {/* WF 전체 미니맵 */}
        {!isEmpty && (
          <div className="flex gap-0.5">
            {Array.from({ length: totalWafers }, (_, i) => i + 1).map(wf => {
              const sp = waferMap[wf];
              const c = sp ? SPLIT_STYLE[sp] : null;
              return (
                <div key={wf} className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${
                  sp ? `${c.bg} text-white` : "border border-dashed border-gray-300 text-gray-300"
                }`}>{wf}</div>
              );
            })}
          </div>
        )}
      </div>

      {/* 테이블 헤더 */}
      <div className="grid grid-cols-[56px_1fr_80px_120px_1fr_120px] gap-x-2 px-3 py-1.5 border-b border-gray-100 bg-gray-50">
        {["Split", "공정 조건", "장비", "Recipe", "Note", "WF 배정"].map(h => (
          <span key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</span>
        ))}
      </div>

      {/* 행 */}
      <div className="divide-y divide-gray-50">
        {rows.map((row) => {
          const c = SPLIT_STYLE[row.split];
          const hasData = row.cond;
          return (
            <div key={row.split} className={`grid grid-cols-[56px_1fr_80px_120px_1fr_120px] gap-x-2 items-center px-3 py-2.5 ${hasData ? c.light : ""}`}>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md text-center ${c.label}`}>
                {row.split}
              </span>
              {hasData ? (
                <>
                  <span className={`text-xs font-medium ${c.text} truncate`}>{row.cond}</span>
                  <span className="text-[10px] text-gray-500 truncate">{row.eqp || "—"}</span>
                  <span className="text-[10px] text-gray-500 font-mono truncate">{row.recipe || "—"}</span>
                  <span className="text-[10px] text-gray-500 truncate">{row.note || "—"}</span>
                  <div className="flex flex-wrap gap-0.5">
                    {row.wafers.map(wf => (
                      <div key={wf} className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${c.bg} text-white`}>
                        {wf}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <span className="col-span-5 text-[11px] text-gray-300 italic">— 미입력</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── 채팅 패널 ─── */
function DemoChatPanel({ onHide, suggestionTrigger, onFillForm, fillDoneTrigger, onFillSplit, postModalTrigger, onFillMissing }) {
  const INITIAL = [
    { role: "assistant", content: `안녕하세요! AI 실험 도우미입니다.\n\n과제 "${DEMO_PROJECT_NAME}"의 실험 신청을 도와드릴게요.\n\n평가항목 필드를 클릭하면 과거 실험 내역을 제안해드려요 💡` },
  ];

  const [messages, setMessages] = useState(INITIAL);
  const [input, setInput] = useState("");
  const [awaitingChoice, setAwaitingChoice] = useState(false);
  const [awaitingFollowup, setAwaitingFollowup] = useState(null);
  const [awaitingDOE, setAwaitingDOE] = useState(false);
  const [awaitingWaferCount, setAwaitingWaferCount] = useState(false);
  const [awaitingDOEChoice, setAwaitingDOEChoice] = useState(false);
  const [awaitingFieldRec, setAwaitingFieldRec] = useState(false);
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);
  const prevTrigger = useRef(0);
  const prevFillTrigger = useRef(0);
  const prevPostModal = useRef(0);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  /* 평가항목 포커스 → 과거 실험 제안 */
  useEffect(() => {
    if (suggestionTrigger === prevTrigger.current) return;
    prevTrigger.current = suggestionTrigger;
    if (!suggestionTrigger) return;
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setAwaitingChoice(true);
      setMessages(prev => [...prev, {
        role: "assistant", type: "suggestion",
        content: `"${DEMO_PROJECT_NAME}" 과제에서 과거에 진행한 실험이에요.\n어떤 실험에 대해 알고 싶으신가요?`,
      }]);
    }, 900);
  }, [suggestionTrigger]);

  /* 폼 자동 채움 완료 → DOE 제안 */
  useEffect(() => {
    if (fillDoneTrigger === prevFillTrigger.current) return;
    prevFillTrigger.current = fillDoneTrigger;
    if (!fillDoneTrigger) return;
    setTimeout(() => {
      setThinking(true);
      setTimeout(() => {
        setThinking(false);
        setAwaitingDOE(true);
        setMessages(prev => [...prev, {
          role: "assistant", type: "doe-ask",
          content: "📊 Split Table DOE를 짜드릴까요?\n과거 실험 조건과 DOE 이론을 바탕으로 최적 배분을 제안해드릴게요.",
        }]);
      }, 800);
    }, 600);
  }, [fillDoneTrigger]);

  /* 팝업 닫힘 → 누락 필드 추천 제안 */
  useEffect(() => {
    if (postModalTrigger === prevPostModal.current) return;
    prevPostModal.current = postModalTrigger;
    if (!postModalTrigger) return;
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setAwaitingFieldRec(true);
      setMessages(prev => [...prev, {
        role: "assistant", type: "field-rec",
        content: "⚠️ Split 조건과 Note가 기재되지 않았네요.\n과거 실험을 참고하여 추천해드릴까요?",
      }]);
    }, 700);
  }, [postModalTrigger]);

  const handleChoice = (exp) => {
    setAwaitingChoice(false);
    setMessages(prev => [...prev, { role: "user", content: `${exp.id}) ${exp.label}` }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setAwaitingFollowup(exp);
      setMessages(prev => [...prev, {
        role: "assistant", type: "summary",
        content: exp.summary + "\n\n다음 실험도 이 실험과 유사하게 계획 중이신가요?",
        expId: exp.id,
      }]);
    }, 700);
  };

  const handleFollowupYes = (exp) => {
    setAwaitingFollowup(null);
    setMessages(prev => [...prev, { role: "user", content: "네, 유사하게 진행하려고 해요!" }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      const filled = {
        evalItem: `${exp.fill.evalItem} 유사실험`,
        evalProcess: exp.fill.evalProcess,
        lotCode: exp.fill.lotCode,
      };
      onFillForm(filled);
      setMessages(prev => [...prev, {
        role: "assistant",
        content:
          `✅ 과거 실험 기준으로 폼을 채워드렸어요!\n\n` +
          `• 평가항목: "${filled.evalItem}"\n` +
          `• 평가공정: ${filled.evalProcess}\n` +
          `• LOT 코드: ${filled.lotCode}\n\n` +
          `평가항목에 유사실험 표시를 해뒀어요. 필요에 맞게 수정하세요 ✏️`,
      }]);
    }, 600);
  };

  const handleFollowupNo = () => {
    setAwaitingFollowup(null);
    setMessages(prev => [...prev,
      { role: "user", content: "아니요, 참고만 할게요." },
      { role: "assistant", content: "알겠습니다! 궁금한 게 생기면 언제든지 물어보세요 😊" },
    ]);
  };

  const handleDOEYes = () => {
    setAwaitingDOE(false);
    setMessages(prev => [...prev, { role: "user", content: "네, DOE 짜주세요!" }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setAwaitingWaferCount(true);
      setMessages(prev => [...prev, {
        role: "assistant", type: "wafer-count",
        content: "몇 장으로 진행하실 예정인가요?",
      }]);
    }, 600);
  };

  const handleDOENo = () => {
    setAwaitingDOE(false);
    setMessages(prev => [...prev,
      { role: "user", content: "아니요, 직접 입력할게요." },
      { role: "assistant", content: "알겠습니다! Split Table은 직접 입력해주세요 ✏️" },
    ]);
  };

  const handleWaferCount = (n) => {
    setAwaitingWaferCount(false);
    setMessages(prev => [...prev, { role: "user", content: `${n}장이요.` }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setAwaitingDOEChoice(true);
      setMessages(prev => [...prev, {
        role: "assistant", type: "doe-options",
        waferCount: n,
        content: `${n}장 기준 4가지 DOE 배분 옵션입니다.\n과거 실험과 DOE 이론을 바탕으로 구성했어요. 어떤 방식이 좋으신가요?`,
      }]);
    }, 800);
  };

  const handleDOEChoice = (opt) => {
    setAwaitingDOEChoice(false);
    onFillSplit(opt.rows);
    setMessages(prev => [...prev,
      { role: "user", content: `${opt.id}) ${opt.label}` },
    ]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content:
          `✅ Split Table을 채워드렸어요!\n\n` +
          `• ${opt.rows.map(r => `${r.split}: WF ${r.wafers[0]}~${r.wafers[r.wafers.length-1]} (${r.wafers.length}장)`).join("\n• ")}\n\n` +
          `장비·Recipe는 과거 실험 기준 초안이에요. 필요에 맞게 수정하세요 ✏️`,
      }]);
    }, 700);
  };

  const handleFieldRecYes = () => {
    setAwaitingFieldRec(false);
    const defaultRows = DOE_OPTIONS[0].rows;
    onFillMissing(defaultRows);
    setMessages(prev => [...prev,
      { role: "user", content: "네, 추천해주세요." },
    ]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content:
          "✅ 균등 배분 기준으로 조건과 Note를 채워드렸어요!\n\n" +
          "base~S3까지 초안 조건이 입력됐습니다.\n" +
          "장비·Recipe·Note는 확인 후 수정해주세요 ✏️",
      }]);
    }, 700);
  };

  const handleFieldRecNo = () => {
    setAwaitingFieldRec(false);
    setMessages(prev => [...prev,
      { role: "user", content: "아니요, 직접 입력할게요." },
      { role: "assistant", content: "알겠습니다! Split Table을 직접 작성해주세요 ✏️" },
    ]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "현재 이 화면은 Agent 동작 데모입니다.\n실제 LLM 연동 시 여기서 검색·추천·조건 생성을 처리해요!",
      }]);
    }, 600);
  };

  const lastIdx = messages.length - 1;

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-indigo-700 text-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-sm">AI 실험 도우미</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500 rounded text-indigo-100">Agent 데모</span>
          </div>
          <button onClick={onHide} className="w-6 h-6 flex items-center justify-center rounded hover:bg-indigo-600 text-indigo-200 hover:text-white transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-indigo-200 mt-0.5">과거 실험 조회 · DOE 설계 · 조건 추천</p>
      </div>

      {/* 메시지 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">AI</div>
              )}
              <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "bg-white border border-gray-200 text-gray-700 rounded-tl-sm shadow-sm"
              }`}>{msg.content}</div>
            </div>

            {/* 과거 실험 선택 */}
            {msg.type === "suggestion" && awaitingChoice && i === lastIdx && (
              <div className="mt-2 ml-8 flex flex-col gap-1.5">
                {DEMO_PAST.map(exp => (
                  <button key={exp.id} onClick={() => handleChoice(exp)}
                    className="text-left px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 hover:bg-indigo-100 transition">
                    <span className="font-bold mr-1.5">{exp.id})</span>{exp.label}
                  </button>
                ))}
              </div>
            )}

            {/* 유사 실험 Yes/No */}
            {msg.type === "summary" && awaitingFollowup?.id === msg.expId && i === lastIdx && (
              <div className="mt-2 ml-8 flex gap-2">
                <button onClick={() => handleFollowupYes(awaitingFollowup)}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition">
                  네, 유사하게 진행할게요
                </button>
                <button onClick={handleFollowupNo}
                  className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition">
                  아니요, 참고만 할게요
                </button>
              </div>
            )}

            {/* DOE 제안 Yes/No */}
            {msg.type === "doe-ask" && awaitingDOE && i === lastIdx && (
              <div className="mt-2 ml-8 flex gap-2">
                <button onClick={handleDOEYes}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition">
                  네, DOE 짜주세요
                </button>
                <button onClick={handleDOENo}
                  className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition">
                  직접 입력할게요
                </button>
              </div>
            )}

            {/* 웨이퍼 수 선택 */}
            {msg.type === "wafer-count" && awaitingWaferCount && i === lastIdx && (
              <div className="mt-2 ml-8 flex gap-2">
                {[5, 10, 15].map(n => (
                  <button key={n} onClick={() => handleWaferCount(n)}
                    className="px-5 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 transition">
                    {n}장
                  </button>
                ))}
              </div>
            )}

            {/* DOE 옵션 4종 */}
            {msg.type === "doe-options" && awaitingDOEChoice && i === lastIdx && (
              <div className="mt-2 ml-8 flex flex-col gap-2">
                {DOE_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => handleDOEChoice(opt)}
                    className="text-left px-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs hover:bg-indigo-50 hover:border-indigo-400 transition">
                    <div className="font-bold text-indigo-700 mb-0.5">{opt.id}) {opt.label}</div>
                    <div className="text-[10px] text-gray-400 mb-1.5">{opt.desc}</div>
                    {/* 배분 시각화 바 */}
                    {opt.rows.map((row, ri) => {
                      const c = SPLIT_STYLE[row.split];
                      return (
                        <div key={row.split} className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] font-bold w-7 text-right ${c.text}`}>{row.split}</span>
                          <div className="flex gap-0.5">
                            {row.wafers.map(wf => (
                              <div key={wf} className={`w-3.5 h-3.5 rounded-sm ${c.bg} flex items-center justify-center text-[7px] text-white font-bold`}>{wf}</div>
                            ))}
                          </div>
                          <span className="text-[9px] text-gray-400">{row.wafers.length}장</span>
                        </div>
                      );
                    })}
                  </button>
                ))}
              </div>
            )}

            {/* 누락 필드 추천 */}
            {msg.type === "field-rec" && awaitingFieldRec && i === lastIdx && (
              <div className="mt-2 ml-8 flex gap-2">
                <button onClick={handleFieldRecYes}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition">
                  네, 추천해주세요
                </button>
                <button onClick={handleFieldRecNo}
                  className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition">
                  직접 입력할게요
                </button>
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">AI</div>
            <div className="px-3 py-2 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(n => (
                  <span key={n} className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce"
                    style={{ animationDelay: `${n * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* 입력창 */}
      <div className="px-3 py-3 border-t border-gray-200 bg-white shrink-0">
        <div className="flex gap-2 items-end">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={2} placeholder="질문을 입력하세요... (Enter로 전송)"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <button onClick={handleSend} disabled={!input.trim()}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition disabled:opacity-40 shrink-0">전송</button>
        </div>
      </div>
    </div>
  );
}

/* ─── 누락 필드 팝업 ─── */
function ValidationModal({ missing, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-80 p-6 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-800 text-base mb-1">Assign 요청 불가</p>
          <p className="text-sm text-gray-500">아래 필수 항목이 누락되어<br />요청을 진행할 수 없어요.</p>
        </div>
        <div className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-1.5">
          {missing.map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>{f} 누락</span>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition">
          확인
        </button>
      </div>
    </div>
  );
}

/* ─── 메인 페이지 ─── */
export default function AgentDemo() {
  const [evalItem, setEvalItem] = useState("");
  const [evalProcess, setEvalProcess] = useState("");
  const [lotCode, setLotCode] = useState("");
  const [splitRows, setSplitRows] = useState(EMPTY_SPLITS);
  const [chatVisible, setChatVisible] = useState(true);
  const [speechText, setSpeechText] = useState(null);
  const [suggestionTrigger, setSuggestionTrigger] = useState(0);
  const [fillDoneTrigger, setFillDoneTrigger] = useState(0);
  const [postModalTrigger, setPostModalTrigger] = useState(0);
  const [validationMissing, setValidationMissing] = useState(null);
  const [splitPendingModal, setSplitPendingModal] = useState(false);
  const suggestionFired = useRef(false);

  const handleEvalItemFocus = () => {
    setSpeechText("과거에 어떤 실험들이 있었는지\n찾아볼게요! 👀");
    if (!suggestionFired.current) {
      suggestionFired.current = true;
      if (!chatVisible) setChatVisible(true);
      setSuggestionTrigger(n => n + 1);
    }
  };

  const handleFillForm = ({ evalItem, evalProcess, lotCode }) => {
    setEvalItem(evalItem);
    setEvalProcess(evalProcess);
    setLotCode(lotCode);
    setFillDoneTrigger(n => n + 1);
  };

  const handleFillSplit = (rows) => setSplitRows(rows);

  const handleFillMissing = (rows) => setSplitRows(rows);

  const handleAssignRequest = () => {
    const missing = [];
    if (!evalItem.trim()) missing.push("평가항목");
    if (!evalProcess.trim()) missing.push("평가공정");
    if (!lotCode.trim()) missing.push("LOT 코드");

    const splitEmpty = splitRows.some(r => !r.cond.trim() || !r.note.trim());
    if (splitEmpty) missing.push("Split 조건 / Note");

    if (missing.length > 0) {
      setValidationMissing(missing);
      setSplitPendingModal(splitEmpty);
    } else {
      alert("✅ Assign 요청이 접수되었습니다! (데모)");
    }
  };

  const handleModalClose = () => {
    const hadSplit = splitPendingModal;
    setValidationMissing(null);
    setSplitPendingModal(false);
    if (hadSplit) {
      if (!chatVisible) setChatVisible(true);
      setTimeout(() => setPostModalTrigger(n => n + 1), 200);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <>
      {validationMissing && (
        <ValidationModal missing={validationMissing} onClose={handleModalClose} />
      )}
      <Splitter style={{ height: "calc(100vh - 112px)" }}>
        <Splitter.Panel defaultSize="60%" min="40%" style={{ paddingRight: chatVisible ? 10 : 0 }}>
          <div className="flex flex-col h-full gap-3">
            {/* 헤더 */}
            <div className="flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-800">신규 실험 신청 (AI)</h1>
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium border border-amber-200">Agent 데모</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">평가항목을 클릭해 AI Agent의 동작을 확인하세요</p>
              </div>
              {!chatVisible && (
                <TigerCharacter onClick={() => setChatVisible(true)} speechText={speechText} />
              )}
            </div>

            {/* 폼 + Split Table */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
              {/* 실험 조건 폼 */}
              <div className="bg-white rounded-xl border border-emerald-200 p-4">
                <h2 className="text-sm font-bold text-emerald-800 mb-3">🧪 실험 조건</h2>
                <div className="space-y-3">
                  {/* 과제명 */}
                  <div>
                    <label className={labelCls}>과제명 *</label>
                    <div className="flex items-center gap-2">
                      <input type="text" readOnly value={DEMO_PROJECT_NAME}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-default" />
                      <span className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-lg whitespace-nowrap">예시 과제</span>
                    </div>
                  </div>
                  {/* 평가항목 */}
                  <div>
                    <label className={labelCls}>
                      평가항목 *
                      <span className="ml-2 text-[10px] text-indigo-400 font-normal">← 클릭하면 AI가 과거 실험을 제안해요</span>
                      {evalItem && <span className="ml-2 text-[10px] text-emerald-500 font-medium">✦ AI 채워짐</span>}
                    </label>
                    <input type="text" value={evalItem} onChange={e => setEvalItem(e.target.value)}
                      onFocus={handleEvalItemFocus} onBlur={() => setSpeechText(null)}
                      placeholder="예: CMP 균일도, 제거율..."
                      className={`${inputCls} ${evalItem ? "border-emerald-300 bg-emerald-50" : "border-indigo-200 focus:ring-indigo-300"}`} />
                  </div>
                  {/* 평가공정 / LOT */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>
                        평가공정
                        {evalProcess && <span className="ml-2 text-[10px] text-emerald-500 font-medium">✦ AI 채워짐</span>}
                      </label>
                      <input type="text" value={evalProcess} onChange={e => setEvalProcess(e.target.value)}
                        placeholder="예: CMP, 세정..."
                        className={`${inputCls} ${evalProcess ? "border-emerald-300 bg-emerald-50" : ""}`} />
                    </div>
                    <div>
                      <label className={labelCls}>
                        LOT 코드
                        {lotCode && <span className="ml-2 text-[10px] text-emerald-500 font-medium">✦ AI 채워짐</span>}
                      </label>
                      <input type="text" value={lotCode} onChange={e => setLotCode(e.target.value)}
                        placeholder="예: RSAB2401"
                        className={`${inputCls} ${lotCode ? "border-emerald-300 bg-emerald-50" : ""}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Split Table */}
              <SplitTableMock rows={splitRows} />

              {/* 안내 */}
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-xs text-indigo-700 space-y-1">
                <p className="font-semibold text-indigo-800">🤖 Agent 동작 흐름 (데모)</p>
                <ol className="list-decimal ml-4 space-y-0.5 text-indigo-600">
                  <li>평가항목 클릭 → AI가 과거 실험 A/B/C/D 자동 제안</li>
                  <li>실험 선택 → 요약 표시 후 유사 진행 여부 확인</li>
                  <li>"네" 선택 → 폼 자동 채우기 후 DOE 설계 제안</li>
                  <li>장 수 선택 → 4가지 DOE 배분 옵션 제시</li>
                  <li>옵션 선택 → Split Table 자동 채우기</li>
                </ol>
              </div>
            </div>

            {/* 하단 바 */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between shrink-0">
              <div className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">과제</span>{" "}
                <b className="text-indigo-600">{DEMO_PROJECT_NAME}</b>
                {evalItem && <> | <span className="font-medium">평가항목</span> <b className="text-emerald-600 text-xs">{evalItem}</b></>}
              </div>
              <button onClick={handleAssignRequest}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg font-semibold text-sm transition">
                Assign 요청
              </button>
            </div>
          </div>
        </Splitter.Panel>

        {chatVisible && (
          <Splitter.Panel min="20%" max="55%" collapsible style={{ paddingLeft: 10 }}>
            <DemoChatPanel
              onHide={() => setChatVisible(false)}
              suggestionTrigger={suggestionTrigger}
              onFillForm={handleFillForm}
              fillDoneTrigger={fillDoneTrigger}
              onFillSplit={handleFillSplit}
              postModalTrigger={postModalTrigger}
              onFillMissing={handleFillMissing}
            />
          </Splitter.Panel>
        )}
      </Splitter>
    </>
  );
}
