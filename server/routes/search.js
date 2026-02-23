const express = require("express");
const { db } = require("../db");
const TfIdfSearchEngine = require("../search-engine");
const router = express.Router();

const engine = new TfIdfSearchEngine();
let indexed = false;

function ensureIndex() {
  const experiments = db
    .prepare(
      `
    SELECT e.*,
      p.project_purpose, p.iacpj_ta_goa, p.iacpj_cur_stt,
      p.iacpj_tech_n, p.iacpj_mod_n as project_module,
      p.iacpj_tgt_n, p.iacpj_level,
      p.ia_tgt_htr_n, p.iacpj_nud_n,
      p.iacpj_itf_uno, p.iacpj_bgn_dy, p.iacpj_ch_n, p.ia_ta_grd_n,
      p.iacpj_core_tec, p.ia_ch_or_n
    FROM experiments e
    LEFT JOIN projects p ON e.iacpj_nm = p.iacpj_nm
  `,
    )
    .all();

  const getSplits = db.prepare("SELECT fac_id, oper_id, oper_nm, eps_lot_gbn_cd, work_cond_desc, eqp_id, recipe_id, note FROM split_tables WHERE plan_id = ?");
  const docs = experiments.map(exp => ({ ...exp, _splits: getSplits.all(exp.plan_id) }));

  engine.buildIndex(docs);
  indexed = true;
}

// 검색 결과에서 추천 키워드 추출
// 핵심: 키워드를 선택했을 때 결과 건수가 확실히 줄어드는 것만 추천
function extractSuggestions(results, originalQuery) {
  if (!results.length) return [];

  const N = results.length;
  const queryTokens = new Set(engine.tokenize(originalQuery));

  // 동적 불용어: 전체 문서의 40% 이상에 등장하는 토큰 + 한글 조사/1글자
  const GRAMMAR_STOPS = new Set([
    "향", "및", "위한", "통해", "기반", "위해", "후", "시", "내",
    "의", "을", "를", "이", "가", "에", "는", "은", "로", "으로",
    "과", "와", "도", "에서", "까지", "부터", "대한", "된", "한", "할",
    "x", "o",
  ]);
  const stopWords = new Set(GRAMMAR_STOPS);
  if (engine.dfMap && engine.docCount > 0) {
    const threshold = engine.docCount * 0.4;
    for (const [token, df] of Object.entries(engine.dfMap)) {
      if (df >= threshold) stopWords.add(token);
    }
  }

  // 0단계: 각 결과의 전체 문서 텍스트를 미리 계산 (실제 검색 필터와 동일한 기준)
  const fullDocTexts = results.map((r) => {
    const exp = r.experiment || r.document;
    return engine._docToText(exp).toLowerCase();
  });

  // 1단계: 각 키워드가 어떤 결과(인덱스)에 포함되는지 추적 (표시 필드 기준)
  const keywordMap = {}; // token → { fields: Set }

  results.forEach((r, idx) => {
    const exp = r.experiment || r.document;
    const proj = r.project;
    const splits = r.splits || [];

    const fieldTexts = [
      { field: "평가아이템", text: exp.eval_item },
      { field: "모듈", text: exp.module },
      { field: "평가공정", text: exp.eval_process },
      { field: "평가분류", text: exp.eval_category },
      { field: "과제", text: exp.iacpj_nm },
      { field: "Plan ID", text: exp.plan_id },
      { field: "LOT", text: exp.lot_code },
      { field: "요청자", text: exp.requester },
      { field: "팀", text: exp.team },
      { field: "WF방향", text: exp.wf_direction },
      { field: "이전평가", text: exp.prev_eval },
      { field: "참고", text: exp.reference },
      { field: "Tech", text: proj?.iacpj_tech_n },
      { field: "목표", text: proj?.iacpj_ta_goa },
      { field: "현황", text: proj?.iacpj_cur_stt },
      { field: "목적", text: proj?.project_purpose },
      { field: "개발분류", text: proj?.iacpj_tgt_n },
      { field: "핵심기술", text: proj?.iacpj_core_tec },
      { field: "NUDD", text: proj?.iacpj_nud_n },
    ];

    // Split table에서 차별화 키워드 추출
    for (const s of splits) {
      if (s.fac_id) fieldTexts.push({ field: "FAB", text: s.fac_id });
      if (s.oper_id) fieldTexts.push({ field: "OPER_ID", text: s.oper_id });
      if (s.oper_nm) fieldTexts.push({ field: "공정", text: s.oper_nm });
      if (s.work_cond_desc) fieldTexts.push({ field: "조건", text: s.work_cond_desc });
      if (s.eqp_id) fieldTexts.push({ field: "장비", text: s.eqp_id });
      if (s.recipe_id) fieldTexts.push({ field: "Recipe", text: s.recipe_id });
      if (s.note) fieldTexts.push({ field: "Note", text: s.note });
    }

    for (const { field, text } of fieldTexts) {
      if (!text) continue;
      const tokens = engine.tokenize(text);
      for (const token of tokens) {
        if (queryTokens.has(token)) continue;
        if (stopWords.has(token)) continue;
        if (token.length < 2) continue;
        if (/^\d+$/.test(token)) continue;

        if (!keywordMap[token]) {
          keywordMap[token] = { fields: new Set() };
        }
        keywordMap[token].fields.add(field);
      }
    }
  });

  // 2단계: 각 키워드를 실제 검색 기준(전체 문서 텍스트)으로 검증
  // 키워드를 추가했을 때 AND 필터 기준으로 결과가 확실히 줄어야만 추천
  const candidates = [];

  for (const [token, info] of Object.entries(keywordMap)) {
    // 전체 문서 텍스트에서 이 토큰이 포함된 결과 수 계산
    // (실제 검색의 AND 필터와 동일한 기준)
    const actualHitCount = fullDocTexts.filter((text) =>
      text.includes(token),
    ).length;

    // 핵심: 이 키워드를 선택했을 때 결과가 줄어들지 않으면 제외
    if (actualHitCount >= N) continue;

    // 결과가 0이면 제외 (검색하면 아무것도 안 나옴)
    if (actualHitCount === 0) continue;

    // 결과가 6건 이상인데 1건에만 있으면 너무 세부적 → 제외
    if (N >= 6 && actualHitCount <= 1) continue;

    // 구분력 점수: 결과를 의미있게 나눌 수 있는 정도
    const ratio = actualHitCount / N;
    const discriminationScore = 1 - Math.abs(ratio - 0.5) * 2;

    // 소수 결과(2~5건)에서 1건 매칭이면 보너스 (개별 실험 식별용)
    const smallSetBonus = N <= 5 && actualHitCount === 1 ? 0.3 : 0;

    candidates.push({
      keyword: token,
      hitCount: actualHitCount,
      totalResults: N,
      fields: [...info.fields],
      discriminationScore: discriminationScore + smallSetBonus,
    });
  }

  // 3단계: 중복 제거 - 같은 hitCount를 가진 키워드는 대표 1개만
  const seen = new Set();
  const grouped = [];

  // 구분력 점수로 정렬
  candidates.sort((a, b) => b.discriminationScore - a.discriminationScore);

  for (const c of candidates) {
    // 같은 hitCount + 같은 필드 조합이면 중복으로 취급
    const sig = `${c.hitCount}:${c.fields.sort().join(",")}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    grouped.push(c);
  }

  // 4단계: 상위 6개, 다양한 필드에서 고르게 선택
  const finalSuggestions = [];
  const usedFieldCombos = new Set();

  for (const c of grouped) {
    if (finalSuggestions.length >= 6) break;

    const fieldKey = c.fields.sort().join("+");
    // 같은 필드 조합에서 너무 많이 뽑지 않음 (최대 2개)
    const fieldCount = [...usedFieldCombos].filter(
      (f) => f === fieldKey,
    ).length;
    if (fieldCount >= 2) continue;

    usedFieldCombos.add(fieldKey);
    finalSuggestions.push({
      keyword: c.keyword,
      context: `${c.hitCount}/${c.totalResults}건 매칭 · ${c.fields.slice(0, 2).join(", ")}`,
    });
  }

  return finalSuggestions;
}

// 검색 결과를 그룹화하여 요약 메시지 생성
function generateSummary(results, query) {
  if (!results.length) {
    return `"${query}"에 대한 검색 결과가 없습니다. 다른 키워드로 시도해보세요.`;
  }

  // 과제별로 그룹핑
  const projectGroups = {};
  for (const r of results) {
    const pName = r.project?.iacpj_nm || r.experiment?.iacpj_nm;
    if (!projectGroups[pName]) {
      projectGroups[pName] = {
        project: r.project,
        experiments: [],
        topScore: r.score,
      };
    }
    projectGroups[pName].experiments.push(r);
  }

  const groupCount = Object.keys(projectGroups).length;
  const lines = [
    `"${query}" 검색 결과, ${groupCount}개 과제에서 총 ${results.length}건의 실험을 찾았습니다.`,
  ];

  for (const [name, group] of Object.entries(projectGroups)) {
    const module =
      group.project?.iacpj_mod_n || group.experiments[0]?.experiment?.module || "";
    lines.push(`\n[${module}] ${name} - ${group.experiments.length}건`);
    for (const exp of group.experiments.slice(0, 3)) {
      lines.push(`  - ${exp.experiment.eval_item} (${exp.experiment.plan_id})`);
    }
    if (group.experiments.length > 3) {
      lines.push(`  ... 외 ${group.experiments.length - 3}건`);
    }
  }

  return lines.join("\n");
}

router.post("/", (req, res) => {
  const { query, topK = 10 } = req.body;
  if (!query) return res.status(400).json({ error: "query is required" });

  if (!indexed) ensureIndex();

  const results = engine.search(query, topK);

  const enriched = results.map((r) => {
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

  // 각 검색어 토큰이 최소 하나는 매칭되는 결과만 유지 (AND 필터링)
  const queryTokens = engine.tokenize(query);
  const filtered = enriched.filter((r) => {
    const docText = engine._docToText(r.experiment).toLowerCase();
    // 모든 검색 키워드가 문서에 포함되어야 함
    return queryTokens.every((token) => docText.includes(token));
  });

  // AND 필터 결과가 있으면 사용, 없으면 원래 결과 유지 (너무 엄격해지는 것 방지)
  const finalResults = filtered.length > 0 ? filtered : enriched;

  const summary = generateSummary(finalResults, query);
  const suggestions = extractSuggestions(finalResults, query);

  res.json({
    summary,
    suggestions,
    results: finalResults,
  });
});

router.post("/reindex", (req, res) => {
  indexed = false;
  ensureIndex();
  res.json({ message: "Reindexed", documentCount: engine.documents.length });
});

function invalidateIndex() {
  indexed = false;
}

module.exports = router;
module.exports.invalidateIndex = invalidateIndex;
