import { useState, useRef, useEffect } from 'react';
import SearchResult from '../components/SearchResult';

function Search() {
  const [input, setInput] = useState('');
  const [searchContext, setSearchContext] = useState([]); // 누적 검색어 히스토리
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      text: '안녕하세요! 실험 검색 도우미입니다.\n원하는 실험을 자연어로 검색해보세요. 키워드, 모듈명, 공정명, 과제 목표 등 무엇이든 입력할 수 있습니다.',
      suggestions: [
        { keyword: 'Cryo ESL', context: '시작 추천' },
        { keyword: 'Hybrid Bonding', context: '시작 추천' },
        { keyword: 'Low Thermal', context: '시작 추천' },
        { keyword: 'HKMG Scaling', context: '시작 추천' },
        { keyword: 'Dishing', context: '시작 추천' },
        { keyword: 'Junction', context: '시작 추천' },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // loading이 끝나면 입력창에 포커스
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  const doSearch = async (query, isAccumulate = false) => {
    if (!query.trim()) return;

    // 누적 검색어 구성
    const newContext = isAccumulate ? [...searchContext, query.trim()] : [query.trim()];
    const fullQuery = newContext.join(' ');
    setSearchContext(newContext);

    // 사용자 메시지 (추가 키워드인 경우 표시)
    const displayText = isAccumulate
      ? `+ ${query}  (전체: ${fullQuery})`
      : query;
    setMessages(prev => [...prev, { type: 'user', text: displayText }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullQuery, topK: 10 }),
      });
      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          type: 'assistant',
          text: data.summary,
          results: data.results,
          suggestions: data.suggestions,
          query: fullQuery,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { type: 'assistant', text: '검색 중 오류가 발생했습니다. 다시 시도해주세요.' },
      ]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 직접 입력은 새 검색 (컨텍스트가 있으면 누적)
    doSearch(input, searchContext.length > 0);
  };

  const handleSuggestionClick = (keyword) => {
    // 추천 키워드 클릭은 항상 누적
    doSearch(keyword, true);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setMessages([messages[0]]);
    setInput('');
    setSearchContext([]);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* 대화 영역 */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            message={msg}
            onSuggestionClick={handleSuggestionClick}
          />
        ))}

        {loading && (
          <div className="flex gap-3 px-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-sm">
              DB
            </div>
            <div className="bg-white rounded-lg border p-3 text-sm text-gray-500 animate-pulse">
              검색 중...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t bg-white p-4">
        {/* 현재 검색 컨텍스트 표시 */}
        {searchContext.length > 0 && (
          <div className="flex items-center gap-2 max-w-4xl mx-auto mb-2 text-xs">
            <span className="text-gray-400">검색 조건:</span>
            {searchContext.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                {kw}
              </span>
            ))}
            <button
              onClick={handleReset}
              className="text-gray-400 hover:text-red-500 ml-1"
              title="검색 조건 초기화"
            >
              전체 초기화
            </button>
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
            placeholder="검색어를 입력하세요..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            autoFocus
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            검색
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatMessage({ message, onSuggestionClick }) {
  const [expandedResults, setExpandedResults] = useState(false);
  const isUser = message.type === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end px-4">
        <div className="bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-md text-sm">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4">
      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-xs font-bold mt-1">
        DB
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        {/* 텍스트 메시지 */}
        <div className="bg-white rounded-2xl rounded-tl-sm border shadow-sm p-4 text-sm whitespace-pre-wrap text-gray-700">
          {message.text}
        </div>

        {/* 검색 결과 */}
        {message.results && message.results.length > 0 && (
          <div>
            <button
              onClick={() => setExpandedResults(!expandedResults)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-2"
            >
              {expandedResults
                ? '실험 상세 접기'
                : `실험 상세 보기 (${message.results.length}건)`}
            </button>
            {expandedResults && (
              <div className="space-y-3">
                {message.results.map((r, i) => (
                  <SearchResult key={i} result={r} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 추천 키워드 */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 border">
            <p className="text-xs text-gray-500 mb-2 font-medium">
              {message.results
                ? '이런 실험을 찾고 계신가요? 키워드를 선택해서 더 좁혀보세요:'
                : '추천 검색어:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionClick(s.keyword)}
                  className="group px-3 py-1.5 bg-white border rounded-full text-sm hover:bg-indigo-50 hover:border-indigo-300 transition flex items-center gap-1.5"
                >
                  <span className="text-gray-700 group-hover:text-indigo-700">{s.keyword}</span>
                  <span className="text-xs text-gray-400 group-hover:text-indigo-500">{s.context}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
