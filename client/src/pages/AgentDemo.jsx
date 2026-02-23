import { useState, useEffect, useRef } from "react";
import { Splitter } from "antd";

/* ─── 데모 예시 데이터 ─── */
const DEMO_PROJECT_NAME = "ESL CMP 신뢰성 향상";

const DEMO_PAST = [
  {
    id: "A",
    label: "CMP 균일도 개선",
    summary:
      "📋 CMP 균일도 개선 (2024-03)\n\n" +
      "• 목표: WIW 균일도 5% → 2% 이하\n" +
      "• 평가항목: CMP 균일도, 제거율\n" +
      "• 조건: Slurry SS-25, 압력 3 psi, 패드 A타입, 87 rpm\n" +
      "• 결과: WIW 1.8% 달성 ✅",
    fill: {
      evalItem: "CMP 균일도, 제거율",
      evalProcess: "CMP",
      lotCode: "RSAB2401",
    },
  },
  {
    id: "B",
    label: "Post-CMP 세정 최적화",
    summary:
      "📋 Post-CMP 세정 최적화 (2024-07)\n\n" +
      "• 목표: 세정 후 Particle 30% 감소\n" +
      "• 평가항목: Particle count, 표면 오염도\n" +
      "• 조건: NH₄OH 0.5%, 세정 45 s, 메가소닉 ON\n" +
      "• 결과: Particle 35% 감소 ✅",
    fill: {
      evalItem: "Particle count, 표면 오염도",
      evalProcess: "Post-CMP 세정",
      lotCode: "RSCD2407",
    },
  },
  {
    id: "C",
    label: "Slurry 공급사 교체 검증",
    summary:
      "📋 Slurry A사→B사 교체 검증 (2024-10)\n\n" +
      "• 목표: 공급사 변경 후 동등성 확인\n" +
      "• 평가항목: 제거율, 표면 거칠기(Ra), 스크래치\n" +
      "• 조건: B사 SF-30, 기존 공정 조건 유지\n" +
      "• 결과: Ra 0.8 nm, 제거율 동등 확인 ✅",
    fill: {
      evalItem: "제거율, 표면 거칠기(Ra), 스크래치",
      evalProcess: "CMP",
      lotCode: "RSEF2410",
    },
  },
  {
    id: "D",
    label: "속도-균일도 트레이드오프 탐색",
    summary:
      "📋 CMP 속도-균일도 트레이드오프 (2025-01)\n\n" +
      "• 목표: 처리량↑ vs 균일도 균형점 탐색\n" +
      "• 평가항목: WIW 균일도, 제거율, 처리시간\n" +
      "• 조건: 70 / 80 / 93 / 100 rpm 4-Split\n" +
      "• 결과: 93 rpm 최적 ✅",
    fill: {
      evalItem: "WIW 균일도, 제거율, 처리시간",
      evalProcess: "CMP",
      lotCode: "RSAB2501",
    },
  },
];

/* ─── AI 봇 캐릭터 ─── */
function TigerCharacter({ onClick, chatVisible, speechText }) {
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

/* ─── 데모 채팅 패널 ─── */
function DemoChatPanel({ onHide, suggestionTrigger, onFillForm }) {
  const INITIAL = [
    { role: "assistant", content: `안녕하세요! AI 실험 도우미입니다.\n\n과제 "${DEMO_PROJECT_NAME}"의 실험 신청을 도와드릴게요.\n\n평가항목 필드를 클릭하면 과거 실험 내역을 제안해드려요 💡` },
  ];

  const [messages, setMessages] = useState(INITIAL);
  const [input, setInput] = useState("");
  const [awaitingChoice, setAwaitingChoice] = useState(false);
  // awaitingFollowup: 방금 요약을 보여준 실험 (Yes/No 대기 중)
  const [awaitingFollowup, setAwaitingFollowup] = useState(null);
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);
  const prevTrigger = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  /* 평가항목 포커스 → Agent 제안 */
  useEffect(() => {
    if (suggestionTrigger === prevTrigger.current) return;
    prevTrigger.current = suggestionTrigger;
    if (suggestionTrigger === 0) return;

    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setAwaitingChoice(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "suggestion",
          content: `"${DEMO_PROJECT_NAME}" 과제에서 과거에 진행한 실험이에요.\n어떤 실험에 대해 알고 싶으신가요?`,
        },
      ]);
    }, 900);
  }, [suggestionTrigger]);

  const handleChoice = (exp) => {
    setAwaitingChoice(false);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `${exp.id}) ${exp.label}` },
    ]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setAwaitingFollowup(exp);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "summary",
          content: exp.summary + "\n\n다음 실험도 이 실험과 유사하게 계획 중이신가요?",
          expId: exp.id,
        },
      ]);
    }, 700);
  };

  const handleFollowupYes = (exp) => {
    setAwaitingFollowup(null);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "네, 유사하게 진행하려고 해요!" },
    ]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      const filled = {
        evalItem: `${exp.fill.evalItem} 유사실험`,
        evalProcess: exp.fill.evalProcess,
        lotCode: exp.fill.lotCode,
      };
      onFillForm(filled);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            `✅ 과거 실험 기준으로 폼을 채워드렸어요!\n\n` +
            `• 평가항목: "${filled.evalItem}"\n` +
            `• 평가공정: ${filled.evalProcess}\n` +
            `• LOT 코드: ${filled.lotCode}\n\n` +
            `평가항목은 유사실험임을 표시해뒀어요. 필요에 맞게 수정하세요 ✏️`,
        },
      ]);
    }, 600);
  };

  const handleFollowupNo = () => {
    setAwaitingFollowup(null);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "아니요, 참고만 할게요." },
      { role: "assistant", content: "알겠습니다! 궁금한 게 생기면 언제든지 물어보세요 😊" },
    ]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
    ]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "현재 이 화면은 Agent 동작 데모입니다.\n실제 LLM 연동 시 여기서 검색·추천·조건 생성을 처리해요!" },
      ]);
    }, 600);
  };

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
        <p className="text-xs text-indigo-200 mt-0.5">과거 실험 조회 · 조건 요약 · Split 추천</p>
      </div>

      {/* 메시지 영역 */}
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
              }`}>
                {msg.content}
              </div>
            </div>

            {/* 실험 선택지 버튼 */}
            {msg.type === "suggestion" && awaitingChoice && i === messages.length - 1 && (
              <div className="mt-2 ml-8 flex flex-col gap-1.5">
                {DEMO_PAST.map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => handleChoice(exp)}
                    className="text-left px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    <span className="font-bold mr-1.5">{exp.id})</span>{exp.label}
                  </button>
                ))}
              </div>
            )}

            {/* Yes / No 버튼 (마지막 summary 메시지에만) */}
            {msg.type === "summary" && awaitingFollowup?.id === msg.expId && i === messages.length - 1 && (
              <div className="mt-2 ml-8 flex gap-2">
                <button
                  onClick={() => handleFollowupYes(awaitingFollowup)}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  네, 유사하게 진행할게요
                </button>
                <button
                  onClick={handleFollowupNo}
                  className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition"
                >
                  아니요, 참고만 할게요
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
                {[0, 1, 2].map((n) => (
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
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={2}
            placeholder="질문을 입력하세요... (Enter로 전송)"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition disabled:opacity-40 shrink-0"
          >전송</button>
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
          {missing.map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>{f} 누락</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition"
        >
          확인
        </button>
      </div>
    </div>
  );
}

/* ─── 메인 데모 페이지 ─── */
export default function AgentDemo() {
  const [evalItem, setEvalItem] = useState("");
  const [evalProcess, setEvalProcess] = useState("");
  const [lotCode, setLotCode] = useState("");
  const [chatVisible, setChatVisible] = useState(true);
  const [speechText, setSpeechText] = useState(null);
  const [suggestionTrigger, setSuggestionTrigger] = useState(0);
  const [validationMissing, setValidationMissing] = useState(null);
  const suggestionFired = useRef(false);

  const handleEvalItemFocus = () => {
    setSpeechText("과거에 어떤 실험들이 있었는지\n찾아볼게요! 👀");
    if (!suggestionFired.current) {
      suggestionFired.current = true;
      if (!chatVisible) setChatVisible(true);
      setSuggestionTrigger((n) => n + 1);
    }
  };

  const handleAssignRequest = () => {
    const missing = [];
    if (!evalItem.trim()) missing.push("평가항목");
    if (!evalProcess.trim()) missing.push("평가공정");
    if (!lotCode.trim()) missing.push("LOT 코드");
    if (missing.length > 0) {
      setValidationMissing(missing);
    } else {
      alert("✅ Assign 요청이 접수되었습니다! (데모)");
    }
  };

  /* AI가 폼 자동 채우기 */
  const handleFillForm = ({ evalItem, evalProcess, lotCode }) => {
    setEvalItem(evalItem);
    setEvalProcess(evalProcess);
    setLotCode(lotCode);
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <>
    {validationMissing && (
      <ValidationModal missing={validationMissing} onClose={() => setValidationMissing(null)} />
    )}
    <Splitter style={{ height: "calc(100vh - 112px)" }}>
      <Splitter.Panel defaultSize="62%" min="40%" style={{ paddingRight: chatVisible ? 10 : 0 }}>
        <div className="flex flex-col h-full gap-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">신규 실험 신청 (AI)</h1>
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium border border-amber-200">Agent 데모</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">평가항목을 클릭해 AI Agent의 동작을 확인하세요</p>
            </div>
            {!chatVisible && (
              <TigerCharacter onClick={() => setChatVisible(true)} chatVisible={chatVisible} speechText={speechText} />
            )}
          </div>

          {/* 폼 */}
          <div className="bg-white rounded-xl border border-emerald-200 p-5 overflow-y-auto flex-1 min-h-0">
            <h2 className="text-base font-bold text-emerald-800 mb-4">🧪 실험 조건</h2>
            <div className="space-y-4">

              {/* 과제명 — 예시로 고정 */}
              <div>
                <label className={labelCls}>과제명 *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={DEMO_PROJECT_NAME}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-default"
                  />
                  <span className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-lg whitespace-nowrap">예시 과제</span>
                </div>
              </div>

              {/* 평가항목 — 포커스 시 Agent 트리거 */}
              <div>
                <label className={labelCls}>
                  평가항목 *
                  <span className="ml-2 text-[10px] text-indigo-400 font-normal">← 클릭하면 AI가 과거 실험을 제안해요</span>
                  {evalItem && <span className="ml-2 text-[10px] text-emerald-500 font-medium">✦ AI 채워짐</span>}
                </label>
                <input
                  type="text"
                  value={evalItem}
                  onChange={(e) => setEvalItem(e.target.value)}
                  onFocus={handleEvalItemFocus}
                  onBlur={() => setSpeechText(null)}
                  placeholder="예: CMP 균일도, 제거율, 표면 거칠기..."
                  className={`${inputCls} ${evalItem ? "border-emerald-300 bg-emerald-50 focus:ring-emerald-300" : "border-indigo-200 focus:ring-indigo-300"}`}
                />
              </div>

              {/* 평가공정 / LOT 코드 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    평가공정
                    {evalProcess && <span className="ml-2 text-[10px] text-emerald-500 font-medium">✦ AI 채워짐</span>}
                  </label>
                  <input type="text" value={evalProcess} onChange={(e) => setEvalProcess(e.target.value)}
                    placeholder="예: CMP, 세정, 증착..."
                    className={`${inputCls} ${evalProcess ? "border-emerald-300 bg-emerald-50 focus:ring-emerald-300" : ""}`} />
                </div>
                <div>
                  <label className={labelCls}>
                    LOT 코드
                    {lotCode && <span className="ml-2 text-[10px] text-emerald-500 font-medium">✦ AI 채워짐</span>}
                  </label>
                  <input type="text" value={lotCode} onChange={(e) => setLotCode(e.target.value)}
                    placeholder="예: RSAB2401"
                    className={`${inputCls} ${lotCode ? "border-emerald-300 bg-emerald-50 focus:ring-emerald-300" : ""}`} />
                </div>
              </div>

              {/* 안내 박스 */}
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-xs text-indigo-700 space-y-1.5">
                <p className="font-semibold text-indigo-800">🤖 Agent 동작 흐름 (데모)</p>
                <ol className="list-decimal ml-4 space-y-1 text-indigo-600">
                  <li>사용자가 <b>평가항목</b> 필드 클릭</li>
                  <li>Agent가 과제명 인식 → 과거 실험 목록 A/B/C/D 자동 제안</li>
                  <li>사용자가 관심 실험 선택 → 실험 요약 응답</li>
                  <li><b>"네, 유사하게 진행할게요"</b> 클릭 → 폼 자동 채우기</li>
                  <li>평가항목에 <b>"유사실험"</b> 접미사 붙여 원본과 구분</li>
                </ol>
              </div>

            </div>
          </div>

          {/* 하단 바 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shrink-0">
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">과제</span>{" "}
              <b className="text-indigo-600">{DEMO_PROJECT_NAME}</b>
              {evalItem && <> | <span className="font-medium">평가항목</span> <b className="text-emerald-600">{evalItem}</b></>}
            </div>
            <button
              onClick={handleAssignRequest}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg font-semibold text-sm transition"
            >
              Assign 요청
            </button>
          </div>
        </div>
      </Splitter.Panel>

      {chatVisible && (
        <Splitter.Panel min="20%" max="55%" collapsible style={{ paddingLeft: 10 }}>
          <DemoChatPanel onHide={() => setChatVisible(false)} suggestionTrigger={suggestionTrigger} onFillForm={handleFillForm} />
        </Splitter.Panel>
      )}
    </Splitter>
    </>
  );
}
