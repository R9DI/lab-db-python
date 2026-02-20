const express = require("express");
const { db } = require("../db");
const router = express.Router();

router.get("/", (req, res) => {
  const projects = db.prepare("SELECT * FROM projects").all();
  res.json(projects);
});

router.get("/:id", (req, res) => {
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const experiments = db
    .prepare("SELECT * FROM experiments WHERE iacpj_nm = ?")
    .all(project.iacpj_nm);
  res.json({ ...project, experiments });
});

// 과제 추가
router.post("/", (req, res) => {
  const { iacpj_nm } = req.body;
  if (!iacpj_nm || !iacpj_nm.trim()) {
    return res.status(400).json({ error: "iacpj_nm은 필수입니다." });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO projects (
        iacpj_nm, iacpj_tgt_n, iacpj_level, iacpj_tech_n,
        ia_tgt_htr_n, iacpj_nud_n, iacpj_mod_n, iacpj_itf_uno, iacpj_bgn_dy,
        iacpj_ch_n, ia_ta_grd_n, project_purpose, iacpj_ta_goa, iacpj_cur_stt,
        iacpj_ch_i, ia_ch_or_i, ia_ch_or_n, ia_ch_or_path, iacpj_core_tec,
        iacpj_end_dy, iacpj_reg_dy
      ) VALUES (
        @iacpj_nm, @iacpj_tgt_n, @iacpj_level, @iacpj_tech_n,
        @ia_tgt_htr_n, @iacpj_nud_n, @iacpj_mod_n, @iacpj_itf_uno, @iacpj_bgn_dy,
        @iacpj_ch_n, @ia_ta_grd_n, @project_purpose, @iacpj_ta_goa, @iacpj_cur_stt,
        @iacpj_ch_i, @ia_ch_or_i, @ia_ch_or_n, @ia_ch_or_path, @iacpj_core_tec,
        @iacpj_end_dy, @iacpj_reg_dy
      )
    `);

    const params = {
      iacpj_nm: req.body.iacpj_nm?.trim(),
      iacpj_tgt_n: req.body.iacpj_tgt_n || null,
      iacpj_level: req.body.iacpj_level || null,
      iacpj_tech_n: req.body.iacpj_tech_n || null,
      ia_tgt_htr_n: req.body.ia_tgt_htr_n || null,
      iacpj_nud_n: req.body.iacpj_nud_n || null,
      iacpj_mod_n: req.body.iacpj_mod_n || null,
      iacpj_itf_uno: req.body.iacpj_itf_uno || null,
      iacpj_bgn_dy: req.body.iacpj_bgn_dy || null,
      iacpj_ch_n: req.body.iacpj_ch_n || null,
      ia_ta_grd_n: req.body.ia_ta_grd_n || null,
      project_purpose: req.body.project_purpose || null,
      iacpj_ta_goa: req.body.iacpj_ta_goa || null,
      iacpj_cur_stt: req.body.iacpj_cur_stt || null,
      iacpj_ch_i: req.body.iacpj_ch_i || null,
      ia_ch_or_i: req.body.ia_ch_or_i || null,
      ia_ch_or_n: req.body.ia_ch_or_n || null,
      ia_ch_or_path: req.body.ia_ch_or_path || null,
      iacpj_core_tec: req.body.iacpj_core_tec || null,
      iacpj_end_dy: req.body.iacpj_end_dy || null,
      iacpj_reg_dy: req.body.iacpj_reg_dy || null,
    };

    const result = stmt.run(params);
    const created = db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res
        .status(409)
        .json({ error: "이미 동일한 과제명이 존재합니다." });
    }
    console.error("Error creating project:", err);
    res.status(500).json({ error: "과제 생성 중 오류 발생" });
  }
});

// 과제 삭제 (관련 실험, 스플릿도 함께 삭제)
router.delete("/:id", (req, res) => {
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  try {
    let counts;
    db.exec("BEGIN");
    try {
      const experiments = db
        .prepare("SELECT plan_id FROM experiments WHERE iacpj_nm = ?")
        .all(project.iacpj_nm);
      for (const exp of experiments) {
        db.prepare("DELETE FROM split_tables WHERE plan_id = ?").run(
          exp.plan_id,
        );
      }
      const expResult = db
        .prepare("DELETE FROM experiments WHERE iacpj_nm = ?")
        .run(project.iacpj_nm);
      db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
      counts = { experiments: expResult.changes, splits: experiments.length };
      db.exec("COMMIT");
    } catch (txErr) {
      db.exec("ROLLBACK");
      throw txErr;
    }
    res.json({
      message: "과제 삭제 완료",
      deleted: { project: project.iacpj_nm, ...counts },
    });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "과제 삭제 중 오류 발생" });
  }
});

module.exports = router;
