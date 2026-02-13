const express = require('express');
const { db } = require('../db');
const TfIdfSearchEngine = require('../search-engine');
const router = express.Router();

const engine = new TfIdfSearchEngine();
let indexed = false;

function ensureIndex() {
  const experiments = db.prepare(`
    SELECT e.*,
      p.project_purpose, p.project_goal, p.current_status,
      p.first_target_tech, p.second_target_tech, p.module as project_module,
      p.dev_type, p.dev_category, p.verification_lv, p.preceding_type,
      p.target_device, p.htrs_link, p.htrs_color, p.nudd,
      p.project_code, p.start_date, p.pm, p.project_grade
    FROM experiments e
    LEFT JOIN projects p ON e.project_name = p.project_name
  `).all();
  engine.buildIndex(experiments);
  indexed = true;
}

// 검색 결과에서 추천 키워드 추출
// 핵심: 모든 결과에 공통인 키워드는 제외, 일부 결과만 구분하는 키워드만 추천
function extractSuggestions(results, originalQuery) {
  if (!results.length) return [];

  const N = results.length;
  const queryTokens = new Set(engine.tokenize(originalQuery));

  const stopWords = new Set([
    'advanced', 'inline', 'epm', 'split', 'x', 'o', 'base', 'dram',
    '향', '및', '위한', '통해', '기반', '위해', '후', '시', '내',
    '의', '을', '를', '이', '가', '에', '는', '은', '로', '으로', '과', '와',
    '개발', '과제', '평가', '확보', '기술', '필요', '적용', '최적화',
    '형성', '공정', '조건', '목적', '결과', '수준', '방안', '진행',
    '대비', '예정', '구현', '검증', '요소', '항목', '추가', '변경',
  ]);

  // 1단계: 각 키워드가 어떤 결과(인덱스)에 포함되는지 추적
  const keywordMap = {}; // token → { resultIndices: Set, fields: Set }

  results.forEach((r, idx) => {
    const exp = r.experiment || r.document;
    const proj = r.project;
    const fieldTexts = [
      { field: '평가아이템', text: exp.eval_item },
      { field: '모듈', text: exp.module },
      { field: '평가공정', text: exp.eval_process },
      { field: '과제', text: exp.project_name },
      { field: 'Tech', text: proj?.first_target_tech || exp.first_target_tech },
      { field: '목표', text: proj?.project_goal || exp.project_goal },
      { field: '현황', text: proj?.current_status || exp.current_status },
      { field: '요청자', text: exp.requester },
    ];

    for (const { field, text } of fieldTexts) {
      if (!text) continue;
      const tokens = engine.tokenize(text);
      for (const token of tokens) {
        if (queryTokens.has(token)) continue;
        if (stopWords.has(token)) continue;
        if (token.length < 2) continue;
        // 순수 숫자는 제외
        if (/^\d+$/.test(token)) continue;

        if (!keywordMap[token]) {
          keywordMap[token] = { resultIndices: new Set(), fields: new Set() };
        }
        keywordMap[token].resultIndices.add(idx);
        keywordMap[token].fields.add(field);
      }
    }
  });

  // 2단계: 구분력 점수 계산
  // - 모든 결과에 있는 키워드 → 제외 (좁혀지지 않음)
  // - 결과의 일부에만 있는 키워드 → 좋음 (선택하면 좁혀짐)
  // - 1개 결과에만 있는 키워드 → 너무 좁음 (결과가 2건 이하일 때만 허용)
  const candidates = [];

  for (const [token, info] of Object.entries(keywordMap)) {
    const hitCount = info.resultIndices.size;

    // 모든 결과에 공통이면 제외
    if (hitCount >= N) continue;

    // 결과가 3건 이상인데 1건에만 있으면 너무 세부적 → 제외
    if (N >= 3 && hitCount <= 1) continue;

    // 구분력 점수: 결과를 의미있게 나눌 수 있는 정도
    // 이상적: 전체의 30~70%에 포함되는 키워드
    const ratio = hitCount / N;
    const discriminationScore = 1 - Math.abs(ratio - 0.5) * 2; // 50%일 때 최대

    candidates.push({
      keyword: token,
      hitCount,
      totalResults: N,
      fields: [...info.fields],
      discriminationScore,
      resultIndices: info.resultIndices,
    });
  }

  // 3단계: 중복 제거 - 같은 결과 집합을 가리키는 키워드끼리 그룹화
  const seen = new Set();
  const grouped = [];

  // 구분력 점수로 정렬
  candidates.sort((a, b) => b.discriminationScore - a.discriminationScore);

  for (const c of candidates) {
    // 이 키워드가 가리키는 결과 집합의 시그니처
    const sig = [...c.resultIndices].sort().join(',');
    if (seen.has(sig)) continue;
    seen.add(sig);
    grouped.push(c);
  }

  // 4단계: 상위 6개, 다양한 필드에서 고르게 선택
  const finalSuggestions = [];
  const usedFieldCombos = new Set();

  for (const c of grouped) {
    if (finalSuggestions.length >= 6) break;

    const fieldKey = c.fields.sort().join('+');
    // 같은 필드 조합에서 너무 많이 뽑지 않음 (최대 2개)
    const fieldCount = [...usedFieldCombos].filter(f => f === fieldKey).length;
    if (fieldCount >= 2) continue;

    usedFieldCombos.add(fieldKey);
    finalSuggestions.push({
      keyword: c.keyword,
      context: `${c.hitCount}/${c.totalResults}건 매칭 · ${c.fields.slice(0, 2).join(', ')}`,
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
    const pName = r.project?.project_name || r.experiment?.project_name;
    if (!projectGroups[pName]) {
      projectGroups[pName] = { project: r.project, experiments: [], topScore: r.score };
    }
    projectGroups[pName].experiments.push(r);
  }

  const groupCount = Object.keys(projectGroups).length;
  const lines = [`"${query}" 검색 결과, ${groupCount}개 과제에서 총 ${results.length}건의 실험을 찾았습니다.`];

  for (const [name, group] of Object.entries(projectGroups)) {
    const module = group.project?.module || group.experiments[0]?.experiment?.module || '';
    lines.push(`\n[${module}] ${name} - ${group.experiments.length}건`);
    for (const exp of group.experiments.slice(0, 3)) {
      lines.push(`  - ${exp.experiment.eval_item} (${exp.experiment.plan_id})`);
    }
    if (group.experiments.length > 3) {
      lines.push(`  ... 외 ${group.experiments.length - 3}건`);
    }
  }

  return lines.join('\n');
}

router.post('/', (req, res) => {
  const { query, topK = 10 } = req.body;
  if (!query) return res.status(400).json({ error: 'query is required' });

  if (!indexed) ensureIndex();

  const results = engine.search(query, topK);

  const enriched = results.map(r => {
    const splits = db.prepare('SELECT * FROM split_tables WHERE plan_id = ?').all(r.document.plan_id);
    const project = db.prepare('SELECT * FROM projects WHERE project_name = ?').get(r.document.project_name);
    return {
      score: Math.round(r.score * 1000) / 1000,
      experiment: r.document,
      project,
      splits,
    };
  });

  // 각 검색어 토큰이 최소 하나는 매칭되는 결과만 유지 (AND 필터링)
  const queryTokens = engine.tokenize(query);
  const filtered = enriched.filter(r => {
    const docText = engine._docToText(r.experiment).toLowerCase();
    // 모든 검색 키워드가 문서에 포함되어야 함
    return queryTokens.every(token => docText.includes(token));
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

router.post('/reindex', (req, res) => {
  indexed = false;
  ensureIndex();
  res.json({ message: 'Reindexed', documentCount: engine.documents.length });
});

module.exports = router;
