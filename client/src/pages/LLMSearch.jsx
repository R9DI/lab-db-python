import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SearchResult from "../components/SearchResult";

/* ─── LLM 설정 패널 ─── */
function ConfigPanel({ config, onConfigChange }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ baseUrl: "", apiKey: "", model: "" });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const startEdit = () => {
    setForm({
      baseUrl: config?.baseUrl || "",
      apiKey: "",
      model: config?.model || "",
    });
    setTestResult(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.baseUrl || !form.model) return;
    try {
      const res = await axios.post("/api/llm-search/config", form);
      onConfigChange(res.data);
      setEditing(false);
      setTestResult(null);
    } catch (err) {
      setTestResult({ success: false, error: err.response?.data?.error || err.message });
    }
  };

  const handleTest = async () => {
    if (!form.baseUrl || !form.model) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await axios.post("/api/llm-search/config/test", form);
      setTestResult(res.data);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    }
    setTesting(false);
  };

  const handleDelete = async () => {
    await axios.delete("/api/llm-search/config");
    onConfigChange({ configured: false });
    setEditing(false);
  };

  // 미등록 상태
  if (!config?.configured && !editing) {
    return (
      <div className="px-4 mb-3">
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🤖</span>
            <span className="text-sm text-gray-500">LLM 모델 미등록 - 연결하면 자연어로 실험 데이터를 분석할 수 있습니다.</span>
          </div>
          <button
            onClick={startEdit}
            className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium transition shrink-0"
          >
            모델 등록
          </button>
        </div>
      </div>
    );
  }

  // 등록 완료 상태 (편집 아닐 때)
  if (config?.configured && !editing) {
    return (
      <div className="px-4 mb-3">
        <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold text-violet-700">AI</span>
            <span className="font-semibold text-violet-800">{config.model}</span>
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">연결됨</span>
            <span className="text-xs text-violet-400">{config.baseUrl}</span>
          </div>
          <button
            onClick={startEdit}
            className="text-xs text-violet-600 hover:text-violet-800 px-3 py-1 rounded-lg border border-violet-200 hover:bg-violet-100 transition font-medium"
          >
            설정 변경
          </button>
        </div>
      </div>
    );
  }

  // 편집 모드
  return (
    <div className="mx-4 bg-white border-2 border-violet-200 rounded-xl p-5 mb-3 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800">LLM 모델 설정</h3>
        <button
          onClick={() => setEditing(false)}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          &times;
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Base URL <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.baseUrl}
            onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            placeholder="https://api.example.com/v1"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Model Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="gpt-120b"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            API Key <span className="text-gray-400">(선택)</span>
          </label>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            placeholder={config?.apiKeyHint || "sk-..."}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          />
        </div>
      </div>

      {/* 테스트 결과 */}
      {testResult && (
        <div
          className={`mb-3 px-3 py-2 rounded-lg text-xs font-medium ${
            testResult.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {testResult.success
            ? `연결 성공 - 응답: "${testResult.response}"`
            : `연결 실패 - ${testResult.error}`}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={handleTest}
            disabled={!form.baseUrl || !form.model || testing}
            className="px-4 py-1.5 text-xs border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-50 transition font-medium disabled:opacity-40"
          >
            {testing ? "테스트 중..." : "연결 테스트"}
          </button>
          {config?.configured && (
            <button
              onClick={handleDelete}
              className="px-4 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
            >
              설정 삭제
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!form.baseUrl || !form.model}
            className="px-5 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition font-medium disabled:opacity-40"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 메인 페이지 ─── */
function LLMSearch() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "안녕하세요! AI 실험 탐색 도우미입니다.\n찾고 싶은 실험을 자유롭게 말씀해주세요. 후보 실험들의 차이점을 설명하고 대화를 통해 원하는 실험을 함께 찾아드립니다.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [llmConfig, setLlmConfig] = useState(null);
  const [candidateIds, setCandidateIds] = useState(null);
  const [candidateCount, setCandidateCount] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  useEffect(() => {
    axios.get("/api/experiments").then((res) => {
      const exps = res.data;
      if (exps.length === 0) return;
      // 랜덤하게 최대 3개 샘플링
      const shuffled = [...exps].sort(() => Math.random() - 0.5).slice(0, 3);
      const examples = shuffled.map((e) => {
        if (e.eval_process) return `"${e.eval_process}" 공정 관련 실험 찾아줘`;
        if (e.eval_item) return `"${e.eval_item}" 관련 실험 있어?`;
        return `"${e.iacpj_nm}" 과제에서 진행한 실험 알려줘`;
      });
      const exampleText = examples.map((ex) => `• ${ex}`).join("\n");
      setMessages([{
        role: "assistant",
        text: `안녕하세요! AI 실험 탐색 도우미입니다.\n찾고 싶은 실험을 자유롭게 말씀해주세요. 후보 실험들의 차이점을 설명하고 대화를 통해 원하는 실험을 함께 찾아드립니다.\n\n예시:\n${exampleText}`,
      }]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    axios
      .get("/api/llm-search/config")
      .then((res) => setLlmConfig(res.data))
      .catch(() => {});
  }, []);

  const getConversationHistory = () => {
    return messages
      .filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }))
      .slice(-10);
  };

  const doSearch = async (query) => {
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/api/llm-search", {
        query,
        conversationHistory: getConversationHistory(),
        candidateIds,
      });
      const data = res.data;

      // 응답 결과로 후보 IDs 업데이트
      const newIds = data.results?.map((r) => r.experiment.id) ?? [];
      if (newIds.length > 0) {
        setCandidateIds(newIds);
        setCandidateCount(newIds.length);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          results: data.results,
          llmError: data.llmError,
        },
      ]);
    } catch (err) {
      const serverData = err.response?.data;
      if (serverData?.answer) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: serverData.answer,
            results: serverData.results,
            llmError: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.\n(${err.message})`,
            llmError: true,
          },
        ]);
      }
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch(input);
  };

  const handleReset = () => {
    setMessages([messages[0]]);
    setCandidateIds(null);
    setCandidateCount(null);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* LLM 설정 패널 */}
      <ConfigPanel config={llmConfig} onConfigChange={setLlmConfig} />

      {/* 대화 영역 */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            message={msg}
            onCreateFromExperiment={(result) => {
              navigate("/new-experiment", { state: { sourceResult: result } });
            }}
          />
        ))}

        {loading && (
          <div className="flex gap-3 px-4">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 text-sm font-bold text-violet-700">
              AI
            </div>
            <div className="bg-white rounded-lg border p-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>{candidateIds ? "후보 실험 분석 중..." : "실험 데이터 검색 중..."}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t bg-white p-4">
        {/* 후보 현황 배지 */}
        {candidateCount !== null && (
          <div className="flex justify-center mb-2">
            {candidateCount === 1 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                후보 1건 — 실험을 찾았습니다!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full border border-violet-200">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                현재 후보 {candidateCount}건 — 계속 답변하여 좁혀가세요
              </span>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 transition shrink-0"
            title="대화 초기화"
          >
            초기화
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={candidateIds ? "후보를 더 좁혀줄 조건을 말씀해주세요..." : "찾고 싶은 실험을 자유롭게 말씀해주세요..."}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            autoFocus
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
          >
            질문
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatBubble({ message, onCreateFromExperiment }) {
  const isSingle = message.results?.length === 1;
  const [showResults, setShowResults] = useState(isSingle);
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end px-4">
        <div className="bg-violet-600 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-lg text-sm">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4">
      <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 text-xs font-bold mt-1">
        AI
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div
          className={`rounded-2xl rounded-tl-sm border shadow-sm p-4 text-sm whitespace-pre-wrap ${
            message.llmError
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-white text-gray-700"
          }`}
        >
          {message.text}
        </div>

        {message.results && message.results.length > 0 && (
          <div>
            {isSingle ? (
              /* 1건 수렴 — 항상 펼침 + 신규 실험 구성 버튼 */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-700">최종 후보 실험</span>
                  <button
                    onClick={() => onCreateFromExperiment(message.results[0])}
                    className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
                  >
                    이 실험 기반으로 신규 실험 구성 →
                  </button>
                </div>
                <SearchResult result={message.results[0]} rank={1} />
              </div>
            ) : (
              /* 다수 후보 — 토글 */
              <div>
                <button
                  onClick={() => setShowResults(!showResults)}
                  className="text-sm text-violet-600 hover:text-violet-800 font-medium mb-2 flex items-center gap-1"
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${showResults ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  후보 실험 ({message.results.length}건)
                </button>
                {showResults && (
                  <div className="space-y-3">
                    {message.results.map((r, i) => (
                      <SearchResult key={i} result={r} rank={i + 1} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LLMSearch;
