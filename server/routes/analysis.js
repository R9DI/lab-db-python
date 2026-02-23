const express = require("express");
const { db } = require("../db");
const router = express.Router();

router.get("/", (req, res) => {
  // 1. Split Table 작성 불량 (0~1 row)
  const splitPoor = db.prepare(`
    SELECT e.iacpj_nm, e.plan_id, e.eval_item, e.eval_process, e.lot_code,
           COALESCE(s.cnt, 0) AS split_row_count
    FROM experiments e
    LEFT JOIN (
      SELECT plan_id, COUNT(*) AS cnt FROM split_tables GROUP BY plan_id
    ) s ON e.plan_id = s.plan_id
    WHERE COALESCE(s.cnt, 0) <= 1
    ORDER BY e.iacpj_nm, e.plan_id
  `).all();

  // 2. 평가아이템 중복 (같은 과제 내 eval_item 동일)
  const dupEvalItem = db.prepare(`
    SELECT iacpj_nm, eval_item, eval_process,
           COUNT(*) AS dup_count,
           GROUP_CONCAT(plan_id, ', ') AS plan_ids,
           GROUP_CONCAT(COALESCE(lot_code, '-'), ', ') AS lot_codes
    FROM experiments
    WHERE eval_item IS NOT NULL AND TRIM(eval_item) != ''
    GROUP BY iacpj_nm, eval_item
    HAVING COUNT(*) > 1
    ORDER BY iacpj_nm
  `).all();

  // 3. OPER_ID 있는데 Note 누락
  const noteMissing = db.prepare(`
    SELECT st.plan_id, st.oper_id, st.oper_nm, st.note,
           e.iacpj_nm, e.eval_item, e.lot_code
    FROM split_tables st
    JOIN experiments e ON st.plan_id = e.plan_id
    WHERE st.oper_id IS NOT NULL AND TRIM(st.oper_id) != ''
      AND (st.note IS NULL OR TRIM(st.note) = '')
    ORDER BY e.iacpj_nm, st.plan_id
  `).all();

  // 4. OPER_ID 있는데 조건(work_cond_desc) 누락
  const condMissing = db.prepare(`
    SELECT st.plan_id, st.oper_id, st.oper_nm, st.work_cond_desc,
           e.iacpj_nm, e.eval_item, e.lot_code
    FROM split_tables st
    JOIN experiments e ON st.plan_id = e.plan_id
    WHERE st.oper_id IS NOT NULL AND TRIM(st.oper_id) != ''
      AND (st.work_cond_desc IS NULL OR TRIM(st.work_cond_desc) = '')
    ORDER BY e.iacpj_nm, st.plan_id
  `).all();

  // 5. 핵심 필드 누락 실험 (eval_item 또는 eval_process 없음)
  const fieldMissing = db.prepare(`
    SELECT plan_id, iacpj_nm, lot_code,
           eval_item, eval_process,
           CASE
             WHEN (eval_item IS NULL OR TRIM(eval_item) = '') AND (eval_process IS NULL OR TRIM(eval_process) = '') THEN '평가아이템+평가공정'
             WHEN eval_item IS NULL OR TRIM(eval_item) = '' THEN '평가아이템'
             ELSE '평가공정'
           END AS missing_fields
    FROM experiments
    WHERE (eval_item IS NULL OR TRIM(eval_item) = '')
       OR (eval_process IS NULL OR TRIM(eval_process) = '')
    ORDER BY iacpj_nm
  `).all();

  // 6. lot_code 누락 실험
  const lotMissing = db.prepare(`
    SELECT plan_id, iacpj_nm, eval_item, eval_process
    FROM experiments
    WHERE lot_code IS NULL OR TRIM(lot_code) = ''
    ORDER BY iacpj_nm
  `).all();

  // 요약 통계
  const summary = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM projects) AS total_projects,
      (SELECT COUNT(*) FROM experiments) AS total_experiments,
      (SELECT COUNT(DISTINCT plan_id) FROM (
        SELECT plan_id FROM split_tables GROUP BY plan_id HAVING COUNT(*) >= 2
      )) AS experiments_with_split,
      (SELECT COUNT(*) FROM split_tables) AS total_split_rows
  `).get();

  // 과제별 집계 (이슈 배열을 JS에서 그룹핑)
  const allProjects = db.prepare(`
    SELECT p.iacpj_nm, COALESCE(e.cnt, 0) AS experiment_count
    FROM projects p
    LEFT JOIN (SELECT iacpj_nm, COUNT(*) AS cnt FROM experiments GROUP BY iacpj_nm) e
      ON p.iacpj_nm = e.iacpj_nm
    ORDER BY p.iacpj_nm
  `).all();

  // OPER_ID가 있는 split row 수 (과제별 분모용)
  const operRowCounts = db.prepare(`
    SELECT ex.iacpj_nm, COUNT(*) AS oper_row_count
    FROM split_tables st
    JOIN experiments ex ON st.plan_id = ex.plan_id
    WHERE st.oper_id IS NOT NULL AND TRIM(st.oper_id) != ''
    GROUP BY ex.iacpj_nm
  `).all();
  const operRowMap = Object.fromEntries(operRowCounts.map((r) => [r.iacpj_nm, r.oper_row_count]));

  function countBy(arr, key, projectName) {
    return arr.filter((r) => r[key] === projectName).length;
  }

  const projectSummary = allProjects.map((p) => ({
    iacpj_nm: p.iacpj_nm,
    experiment_count: p.experiment_count,
    oper_row_count: operRowMap[p.iacpj_nm] || 0,
    split_poor:    countBy(splitPoor,    "iacpj_nm", p.iacpj_nm),
    dup_eval:      countBy(dupEvalItem,  "iacpj_nm", p.iacpj_nm),
    note_missing:  countBy(noteMissing,  "iacpj_nm", p.iacpj_nm),
    cond_missing:  countBy(condMissing,  "iacpj_nm", p.iacpj_nm),
    field_missing: countBy(fieldMissing, "iacpj_nm", p.iacpj_nm),
    lot_missing:   countBy(lotMissing,   "iacpj_nm", p.iacpj_nm),
  }));

  res.json({
    summary,
    projectSummary,
    issues: {
      splitPoor,
      dupEvalItem,
      noteMissing,
      condMissing,
      fieldMissing,
      lotMissing,
    },
  });
});

module.exports = router;
