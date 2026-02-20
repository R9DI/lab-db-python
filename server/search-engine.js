class TfIdfSearchEngine {
  constructor() {
    this.documents = [];
    this.idfCache = {};
    this.tfidfCache = [];
  }

  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      // 영문과 한글 경계에 공백 삽입 (예: "dishing을" → "dishing 을")
      .replace(/([a-z])([가-힣])/g, '$1 $2')
      .replace(/([가-힣])([a-z])/g, '$1 $2')
      // 영문과 숫자 경계에 공백 삽입 (예: "test123" → "test 123")
      .replace(/([a-z])([0-9])/g, '$1 $2')
      .replace(/([0-9])([a-z])/g, '$1 $2')
      // 한글과 숫자 경계에 공백 삽입
      .replace(/([가-힣])([0-9])/g, '$1 $2')
      .replace(/([0-9])([가-힣])/g, '$1 $2')
      // 특수문자 제거
      .replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0);
  }

  buildIndex(documents) {
    this.documents = documents;
    this.idfCache = {};
    this.tfidfCache = [];

    const N = documents.length;
    const allTokenSets = documents.map(doc => {
      const text = this._docToText(doc);
      return new Set(this.tokenize(text));
    });

    // Compute IDF
    this.dfMap = {};
    for (const tokenSet of allTokenSets) {
      for (const token of tokenSet) {
        this.dfMap[token] = (this.dfMap[token] || 0) + 1;
      }
    }
    for (const [token, df] of Object.entries(this.dfMap)) {
      this.idfCache[token] = Math.log(N / (1 + df)) + 1;
    }
    this.docCount = N;

    // Compute TF-IDF vectors
    this.tfidfCache = documents.map(doc => {
      const text = this._docToText(doc);
      const tokens = this.tokenize(text);
      const tf = {};
      for (const t of tokens) {
        tf[t] = (tf[t] || 0) + 1;
      }
      const maxTf = Math.max(...Object.values(tf), 1);
      const vec = {};
      for (const [t, count] of Object.entries(tf)) {
        vec[t] = (count / maxTf) * (this.idfCache[t] || 0);
      }
      return vec;
    });
  }

  search(query, topK = 10) {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const queryTf = {};
    for (const t of queryTokens) {
      queryTf[t] = (queryTf[t] || 0) + 1;
    }
    const maxTf = Math.max(...Object.values(queryTf), 1);
    const queryVec = {};
    for (const [t, count] of Object.entries(queryTf)) {
      queryVec[t] = (count / maxTf) * (this.idfCache[t] || 1);
    }

    const results = this.tfidfCache.map((docVec, idx) => {
      const score = this._cosineSimilarity(queryVec, docVec);
      return { index: idx, score, document: this.documents[idx] };
    });

    return results
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  _docToText(doc) {
    return [
      // 실험 필드
      doc.iacpj_nm,
      doc.module,
      doc.eval_item,
      doc.eval_process,
      doc.eval_category,
      doc.requester,
      doc.lot_code,
      doc.plan_id,
      // 과제 필드 (중요도 높은 필드는 반복하여 가중치 부여)
      doc.project_purpose,
      doc.project_purpose,
      doc.iacpj_ta_goa,
      doc.iacpj_ta_goa,
      doc.iacpj_ta_goa,
      doc.iacpj_cur_stt,
      doc.iacpj_cur_stt,
      doc.iacpj_tech_n,
      doc.project_module,
      doc.iacpj_tgt_n,
      doc.iacpj_ch_n,
      doc.ia_ta_grd_n,
      doc.iacpj_level,
      doc.iacpj_nud_n,
    ].filter(Boolean).join(' ');
  }

  _cosineSimilarity(vecA, vecB) {
    let dot = 0, magA = 0, magB = 0;
    const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    for (const key of allKeys) {
      const a = vecA[key] || 0;
      const b = vecB[key] || 0;
      dot += a * b;
      magA += a * a;
      magB += b * b;
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}

module.exports = TfIdfSearchEngine;
