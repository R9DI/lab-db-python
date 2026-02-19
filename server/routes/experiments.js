const express = require("express");
const { db } = require("../db");
const { invalidateIndex } = require("./search");
const router = express.Router();

router.get("/", (req, res) => {
  const { project_name } = req.query;
  const query = `
    SELECT e.*, COALESCE(s.split_count, 0) AS split_count
    FROM experiments e
    LEFT JOIN (
      SELECT plan_id, COUNT(*) AS split_count
      FROM split_tables
      GROUP BY plan_id
    ) s ON e.plan_id = s.plan_id
  `;
  if (project_name) {
    const experiments = db
      .prepare(query + " WHERE e.project_name = ?")
      .all(project_name);
    return res.json(experiments);
  }
  const experiments = db.prepare(query).all();
  res.json(experiments);
});

// 실험 추가 (JSON 직접)
router.post("/", (req, res) => {
  const { project_name } = req.body;
  if (!project_name || !project_name.trim()) {
    return res.status(400).json({ error: "project_name은 필수입니다." });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO experiments (
        plan_id, project_name, team, requester, lot_code, module,
        wf_direction, eval_process, prev_eval, cross_experiment,
        eval_category, eval_item, lot_request, reference, volume_split, assign_wf
      ) VALUES (
        @plan_id, @project_name, @team, @requester, @lot_code, @module,
        @wf_direction, @eval_process, @prev_eval, @cross_experiment,
        @eval_category, @eval_item, @lot_request, @reference, @volume_split, @assign_wf
      )
    `);

    const params = {
      plan_id: req.body.plan_id?.trim() || null,
      project_name: req.body.project_name?.trim(),
      team: req.body.team || null,
      requester: req.body.requester || null,
      lot_code: req.body.lot_code || null,
      module: req.body.module || null,
      wf_direction: req.body.wf_direction || null,
      eval_process: req.body.eval_process || null,
      prev_eval: req.body.prev_eval || null,
      cross_experiment: req.body.cross_experiment || null,
      eval_category: req.body.eval_category || null,
      eval_item: req.body.eval_item || null,
      lot_request: req.body.lot_request || null,
      reference: req.body.reference || null,
      volume_split: req.body.volume_split || null,
      assign_wf: req.body.assign_wf || null,
    };

    const result = stmt.run(params);
    const created = db
      .prepare("SELECT * FROM experiments WHERE id = ?")
      .get(result.lastInsertRowid);
    invalidateIndex();
    res.status(201).json(created);
  } catch (err) {
    console.error("Error creating experiment:", err);
    if (err.message.includes("FOREIGN KEY")) {
      return res.status(400).json({
        error: `과제 '${project_name}'이(가) 존재하지 않습니다. 과제를 먼저 등록해주세요.`,
      });
    }
    res
      .status(500)
      .json({ error: "실험 생성 중 오류 발생", details: err.message });
  }
});

// 스플릿 추가 (JSON 직접)
router.post("/:planId/splits", (req, res) => {
  const { planId } = req.params;
  const { splits } = req.body;

  if (!splits || !Array.isArray(splits) || splits.length === 0) {
    return res.status(400).json({ error: "splits 배열이 필요합니다." });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO split_tables (
        plan_id, fac_id, oper_id, oper_nm, eps_lot_gbn_cd, work_cond_desc,
        eqp_id, recipe_id, user_def_val_1, user_def_val_2, user_def_val_3,
        user_def_val_4, user_def_val_5, user_def_val_6, user_def_val_7,
        user_def_val_8, user_def_val_9, user_def_val_10, user_def_val_11,
        user_def_val_12, user_def_val_13, user_def_val_14, user_def_val_15, note
      ) VALUES (
        @plan_id, @fac_id, @oper_id, @oper_nm, @eps_lot_gbn_cd, @work_cond_desc,
        @eqp_id, @recipe_id, @user_def_val_1, @user_def_val_2, @user_def_val_3,
        @user_def_val_4, @user_def_val_5, @user_def_val_6, @user_def_val_7,
        @user_def_val_8, @user_def_val_9, @user_def_val_10, @user_def_val_11,
        @user_def_val_12, @user_def_val_13, @user_def_val_14, @user_def_val_15, @note
      )
    `);

    let count = 0;
    db.exec("BEGIN");
    try {
      for (const row of splits) {
        const params = {
          plan_id: planId,
          fac_id: row.fac_id || null,
          oper_id: row.oper_id || null,
          oper_nm: row.oper_nm || null,
          eps_lot_gbn_cd: row.eps_lot_gbn_cd || null,
          work_cond_desc: row.work_cond_desc || null,
          eqp_id: row.eqp_id || null,
          recipe_id: row.recipe_id || null,
          user_def_val_1: row.user_def_val_1 || null,
          user_def_val_2: row.user_def_val_2 || null,
          user_def_val_3: row.user_def_val_3 || null,
          user_def_val_4: row.user_def_val_4 || null,
          user_def_val_5: row.user_def_val_5 || null,
          user_def_val_6: row.user_def_val_6 || null,
          user_def_val_7: row.user_def_val_7 || null,
          user_def_val_8: row.user_def_val_8 || null,
          user_def_val_9: row.user_def_val_9 || null,
          user_def_val_10: row.user_def_val_10 || null,
          user_def_val_11: row.user_def_val_11 || null,
          user_def_val_12: row.user_def_val_12 || null,
          user_def_val_13: row.user_def_val_13 || null,
          user_def_val_14: row.user_def_val_14 || null,
          user_def_val_15: row.user_def_val_15 || null,
          note: row.note || null,
        };
        stmt.run(params);
        count++;
      }
      db.exec("COMMIT");
    } catch (txErr) {
      db.exec("ROLLBACK");
      throw txErr;
    }
    res
      .status(201)
      .json({ message: `${count}건의 스플릿이 저장되었습니다.`, count });
  } catch (err) {
    console.error("Error creating splits:", err);
    res
      .status(500)
      .json({ error: "스플릿 저장 중 오류 발생", details: err.message });
  }
});

// Lot 배정 (Assign 모달에서 lot 선택 시)
router.patch("/:id/assign-lot", (req, res) => {
  const { lot_id } = req.body;
  if (!lot_id || !lot_id.trim()) {
    return res.status(400).json({ error: "lot_id는 필수입니다." });
  }
  try {
    const result = db
      .prepare(
        "UPDATE experiments SET plan_id = ?, status = '실험 진행 중' WHERE id = ?",
      )
      .run(lot_id.trim(), req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "실험을 찾을 수 없습니다." });
    }
    // line_lots에서 해당 lot을 assigned로 변경
    db.prepare("UPDATE line_lots SET status = 'assigned' WHERE lot_id = ?").run(
      lot_id.trim(),
    );
    const updated = db
      .prepare("SELECT * FROM experiments WHERE id = ?")
      .get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error("Lot 배정 오류:", err);
    res.status(500).json({ error: "Lot 배정 중 오류 발생" });
  }
});

// 상태 변경
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  const validStatuses = [
    "Assign 전",
    "실험 진행 중",
    "실험 종료(결과 등록 전)",
    "실험 종료(결과 완료)",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "유효하지 않은 상태입니다." });
  }
  const result = db
    .prepare("UPDATE experiments SET status = ? WHERE id = ?")
    .run(status, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "실험을 찾을 수 없습니다." });
  }
  res.json({ message: "상태가 변경되었습니다.", status });
});

// 완료 토글 (split_completed / summary_completed) + Status 재계산
router.patch("/:id/complete", (req, res) => {
  const { field, value } = req.body;
  if (!["split_completed", "summary_completed"].includes(field)) {
    return res.status(400).json({ error: "유효하지 않은 필드입니다." });
  }
  const result = db
    .prepare(`UPDATE experiments SET ${field} = ? WHERE id = ?`)
    .run(value ? 1 : 0, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "실험을 찾을 수 없습니다." });
  }

  // Fab이 In Fab이 아닐 때 Status 자동 재계산
  const experiment = db
    .prepare("SELECT * FROM experiments WHERE id = ?")
    .get(req.params.id);
  if (
    experiment &&
    experiment.fab_status &&
    experiment.fab_status !== "In Fab"
  ) {
    const splitDone =
      field === "split_completed"
        ? value
          ? 1
          : 0
        : experiment.split_completed;
    const summaryDone =
      field === "summary_completed"
        ? value
          ? 1
          : 0
        : experiment.summary_completed;
    const newStatus =
      splitDone && summaryDone
        ? "실험 종료(결과 완료)"
        : "실험 종료(결과 등록 전)";
    db.prepare("UPDATE experiments SET status = ? WHERE id = ?").run(
      newStatus,
      req.params.id,
    );
  }

  res.json({ message: "업데이트 완료", [field]: value ? 1 : 0 });
});

// Fab 상태 변경 + Status 자동 계산
router.patch("/:id/fab-status", (req, res) => {
  const { fab_status } = req.body;
  const validFabStatuses = ["In Fab", "Fab Out", "EPM", "WT"];
  if (fab_status && !validFabStatuses.includes(fab_status)) {
    return res.status(400).json({ error: "유효하지 않은 Fab 상태입니다." });
  }

  // 현재 실험 정보 조회
  const experiment = db
    .prepare("SELECT * FROM experiments WHERE id = ?")
    .get(req.params.id);
  if (!experiment) {
    return res.status(404).json({ error: "실험을 찾을 수 없습니다." });
  }

  // Status 자동 계산
  let newStatus;
  if (fab_status === "In Fab") {
    newStatus = "실험 진행 중";
  } else {
    // In Fab이 아닌 다른 값 (Fab Out, EPM, WT)
    if (experiment.split_completed && experiment.summary_completed) {
      newStatus = "실험 종료(결과 완료)";
    } else {
      newStatus = "실험 종료(결과 등록 전)";
    }
  }

  db.prepare(
    "UPDATE experiments SET fab_status = ?, status = ? WHERE id = ?",
  ).run(fab_status, newStatus, req.params.id);

  res.json({
    message: "Fab 상태가 변경되었습니다.",
    fab_status,
    status: newStatus,
  });
});

router.get("/:id", (req, res) => {
  const experiment = db
    .prepare("SELECT * FROM experiments WHERE id = ?")
    .get(req.params.id);
  if (!experiment)
    return res.status(404).json({ error: "Experiment not found" });

  const splits = db
    .prepare("SELECT * FROM split_tables WHERE plan_id = ?")
    .all(experiment.plan_id);
  const project = db
    .prepare("SELECT * FROM projects WHERE project_name = ?")
    .get(experiment.project_name);
  res.json({ ...experiment, splits, project });
});

module.exports = router;
