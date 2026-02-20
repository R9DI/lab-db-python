const express = require("express");
const fs = require("fs");
const path = require("path");
const { db } = require("../db");
const TfIdfSearchEngine = require("../search-engine");
const router = express.Router();

const engine = new TfIdfSearchEngine();
let indexed = false;

// ─── LLM 설정 파일 관리 ───
const CONFIG_PATH = path.join(__dirname, "..", "llm-config.json");

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("LLM config load error:", e.message);
  }
  return null;
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

function getConfig() {
  const saved = loadConfig();
  if (saved) return saved;
  // 환경변수 폴백
  if (process.env.LLM_BASE_URL) {
    return {
      baseUrl: process.env.LLM_BASE_URL,
      apiKey: process.env.LLM_API_KEY || "",
      model: process.env.LLM_MODEL || "gpt-120b",
    };
  }
  return null;
}

function ensureIndex() {
  const experiments = db
    .prepare(
      `
    SELECT e.*,
      p.project_purpose, p.iacpj_ta_goa, p.iacpj_cur_stt,
      p.iacpj_tech_n, p.iacpj_mod_n as project_module,
      p.iacpj_tgt_n, p.iacpj_level,
      p.ia_tgt_htr_n, p.iacpj_nud_n,
      p.iacpj_itf_uno, p.iacpj_bgn_dy, p.iacpj_ch_n, p.ia_ta_grd_n
    FROM experiments e
    LEFT JOIN projects p ON e.iacpj_nm = p.iacpj_nm
  `,
    )
    .all();
  engine.buildIndex(experiments);
  indexed = true;
}

// 실험 데이터를 LLM 컨텍스트용 텍스트로 변환
function experimentToContext(result, idx) {
  const exp = result.experiment;
  const proj = result.project;
  const splits = result.splits || [];

  let text = `[실험 ${idx + 1}] ${exp.eval_item || "N/A"}
  - 과제: ${exp.iacpj_nm || "N/A"}
  - 모듈: ${exp.module || "N/A"}
  - Plan ID: ${exp.plan_id || "미배정"}
  - 평가공정: ${exp.eval_process || "N/A"}
  - 평가분류: ${exp.eval_category || "N/A"}
  - 요청자: ${exp.requester || "N/A"} / 팀: ${exp.team || "N/A"}
  - LOT: ${exp.lot_code || "N/A"}
  - 상태: ${exp.status || "N/A"}`;

  if (proj) {
    text += `
  - 과제 목적: ${proj.project_purpose || "N/A"}
  - 과제 목표: ${proj.iacpj_ta_goa || "N/A"}
  - 현재 상태: ${proj.iacpj_cur_stt || "N/A"}
  - 대상 기술: ${proj.iacpj_tech_n || "N/A"}
  - 분류: ${proj.iacpj_tgt_n || "N/A"}`;
  }

  if (splits.length > 0) {
    text += `\n  - Split 조건 (${splits.length}건):`;
    for (const s of splits.slice(0, 5)) {
      text += `\n    * ${s.oper_nm || s.oper_id || "공정"}: ${s.eps_lot_gbn_cd || "base"} | ${s.work_cond_desc || "-"} | 장비: ${s.eqp_id || "-"}`;
    }
    if (splits.length > 5) text += `\n    ... 외 ${splits.length - 5}건`;
  }

  return text;
}

// LLM API 호출 (OpenAI 호환)
async function callLLM(config, systemPrompt, userMessage, conversationHistory = []) {
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.3,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "응답을 생성하지 못했습니다.";
}

const SYSTEM_PROMPT = `당신은 반도체 실험 데이터베이스 검색 도우미입니다.
사용자가 실험을 찾거나 분석을 요청하면, 제공된 실험 데이터를 기반으로 정확하고 간결하게 답변합니다.

규칙:
1. 제공된 실험 데이터만을 근거로 답변하세요. 데이터에 없는 내용을 추측하지 마세요.
2. 실험 간 비교, 유사 실험 추천, 조건 분석 등을 수행할 수 있습니다.
3. 답변은 한국어로 작성하세요.
4. 구조화된 형태(번호, 불렛)로 요약해주세요.
5. 사용자가 특정 실험에 대해 질문하면 해당 실험의 상세 정보를 안내하세요.`;

// ─── 설정 조회 ───
router.get("/config", (req, res) => {
  const config = getConfig();
  if (!config) {
    return res.json({ configured: false });
  }
  res.json({
    configured: true,
    baseUrl: config.baseUrl,
    model: config.model,
    // apiKey는 마스킹해서 전달
    apiKeyHint: config.apiKey
      ? config.apiKey.slice(0, 4) + "****" + config.apiKey.slice(-4)
      : "",
  });
});

// ─── 설정 등록/수정 ───
router.post("/config", (req, res) => {
  const { baseUrl, apiKey, model } = req.body;
  if (!baseUrl || !model) {
    return res.status(400).json({ error: "baseUrl과 model은 필수입니다." });
  }
  const config = { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey: apiKey || "", model };
  saveConfig(config);
  res.json({
    message: "LLM 설정이 저장되었습니다.",
    configured: true,
    baseUrl: config.baseUrl,
    model: config.model,
    apiKeyHint: config.apiKey
      ? config.apiKey.slice(0, 4) + "****" + config.apiKey.slice(-4)
      : "",
  });
});

// ─── 설정 삭제 ───
router.delete("/config", (req, res) => {
  try {
    if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
  } catch (_) {}
  res.json({ message: "LLM 설정이 삭제되었습니다.", configured: false });
});

// ─── 연결 테스트 ───
router.post("/config/test", async (req, res) => {
  const { baseUrl, apiKey, model } = req.body;
  if (!baseUrl || !model) {
    return res.status(400).json({ error: "baseUrl과 model은 필수입니다." });
  }
  try {
    const testConfig = { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey: apiKey || "", model };
    const answer = await callLLM(testConfig, "You are a test assistant.", "Say 'OK' in Korean.", []);
    res.json({ success: true, response: answer });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ─── 메인 검색 엔드포인트 ───
router.post("/", async (req, res) => {
  const { query, conversationHistory = [] } = req.body;
  if (!query) return res.status(400).json({ error: "query is required" });

  if (!indexed) ensureIndex();

  // 후속 질문 시 대화 이력의 이전 사용자 쿼리를 합쳐 검색 범위 확장
  const prevUserQueries = conversationHistory
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content)
    .join(" ");
  const expandedQuery = prevUserQueries ? `${query} ${prevUserQueries}` : query;

  // TF-IDF 검색: 현재 쿼리 + 확장 쿼리 병합
  const primaryResults = engine.search(query, 15);
  const expandedResults = prevUserQueries ? engine.search(expandedQuery, 15) : [];

  // 중복 제거 후 병합 (현재 쿼리 결과 우선)
  const seenIds = new Set(primaryResults.map((r) => r.document.id));
  const mergedResults = [
    ...primaryResults,
    ...expandedResults.filter((r) => !seenIds.has(r.document.id)),
  ].slice(0, 15);

  const enriched = mergedResults.map((r) => {
    const splits = db
      .prepare("SELECT * FROM split_tables WHERE plan_id = ?")
      .all(r.document.plan_id);
    const project = db
      .prepare("SELECT * FROM projects WHERE iacpj_nm = ?")
      .get(r.document.iacpj_nm);
    return {
      score: Math.round(r.score * 1000) / 1000,
      experiment: r.document,
      project,
      splits,
    };
  });

  const queryTokens = engine.tokenize(query);
  const filtered = enriched.filter((r) => {
    const docText = engine._docToText(r.experiment).toLowerCase();
    return queryTokens.every((token) => docText.includes(token));
  });
  const finalResults = filtered.length > 0 ? filtered : enriched;

  // LLM 설정 확인
  const config = getConfig();
  if (!config) {
    return res.json({
      answer: `LLM이 설정되지 않았습니다. 상단에서 모델을 등록해주세요.\n\n키워드 검색 결과: "${query}"에 대해 ${finalResults.length}건의 실험이 검색되었습니다.`,
      results: finalResults,
      resultCount: finalResults.length,
      llmError: true,
    });
  }

  try {
    const contextText = finalResults.length > 0
      ? finalResults.map((r, i) => experimentToContext(r, i)).join("\n\n")
      : "관련 실험 데이터를 찾지 못했습니다.";

    const userMessage = `[검색된 실험 데이터]\n${contextText}\n\n[사용자 질문]\n${query}\n\n위 실험 데이터를 바탕으로 사용자의 질문에 답변해주세요.`;

    const llmResponse = await callLLM(config, SYSTEM_PROMPT, userMessage, conversationHistory);

    res.json({
      answer: llmResponse,
      results: finalResults,
      resultCount: finalResults.length,
    });
  } catch (err) {
    console.error("LLM Search Error:", err);
    res.json({
      answer: `LLM 호출에 실패하여 키워드 검색 결과만 표시합니다.\n(${err.message})\n\n검색어 "${query}"에 대해 ${finalResults.length}건의 실험이 검색되었습니다.`,
      results: finalResults,
      resultCount: finalResults.length,
      llmError: true,
    });
  }
});

function invalidateIndex() {
  indexed = false;
}

module.exports = router;
module.exports.invalidateIndex = invalidateIndex;
