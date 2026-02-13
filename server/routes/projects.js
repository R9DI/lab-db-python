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
    .prepare("SELECT * FROM experiments WHERE project_name = ?")
    .all(project.project_name);
  res.json({ ...project, experiments });
});

// 과제 추가
router.post("/", (req, res) => {
  const { project_name } = req.body;
  if (!project_name || !project_name.trim()) {
    return res.status(400).json({ error: "project_name은 필수입니다." });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO projects (
        project_name, dev_type, dev_category, verification_lv,
        preceding_type, target_device, first_target_tech, second_target_tech,
        htrs_link, htrs_color, nudd, module, project_code, start_date,
        pm, project_grade, project_purpose, project_goal, current_status
      ) VALUES (
        @project_name, @dev_type, @dev_category, @verification_lv,
        @preceding_type, @target_device, @first_target_tech, @second_target_tech,
        @htrs_link, @htrs_color, @nudd, @module, @project_code, @start_date,
        @pm, @project_grade, @project_purpose, @project_goal, @current_status
      )
    `);

    const params = {
      project_name: req.body.project_name?.trim(),
      dev_type: req.body.dev_type || null,
      dev_category: req.body.dev_category || null,
      verification_lv: req.body.verification_lv || null,
      preceding_type: req.body.preceding_type || null,
      target_device: req.body.target_device || null,
      first_target_tech: req.body.first_target_tech || null,
      second_target_tech: req.body.second_target_tech || null,
      htrs_link: req.body.htrs_link || null,
      htrs_color: req.body.htrs_color || null,
      nudd: req.body.nudd || null,
      module: req.body.module || null,
      project_code: req.body.project_code || null,
      start_date: req.body.start_date || null,
      pm: req.body.pm || null,
      project_grade: req.body.project_grade || null,
      project_purpose: req.body.project_purpose || null,
      project_goal: req.body.project_goal || null,
      current_status: req.body.current_status || null,
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
    const deleteAll = db.transaction(() => {
      // 해당 과제의 실험들의 plan_id로 split_tables 삭제
      const experiments = db
        .prepare("SELECT plan_id FROM experiments WHERE project_name = ?")
        .all(project.project_name);
      for (const exp of experiments) {
        db.prepare("DELETE FROM split_tables WHERE plan_id = ?").run(
          exp.plan_id,
        );
      }
      // 실험 삭제
      const expResult = db
        .prepare("DELETE FROM experiments WHERE project_name = ?")
        .run(project.project_name);
      // 과제 삭제
      db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
      return { experiments: expResult.changes, splits: experiments.length };
    });

    const counts = deleteAll();
    res.json({
      message: "과제 삭제 완료",
      deleted: { project: project.project_name, ...counts },
    });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "과제 삭제 중 오류 발생" });
  }
});

module.exports = router;
