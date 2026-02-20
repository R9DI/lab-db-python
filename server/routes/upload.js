const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const { db } = require("../db");
const { invalidateIndex } = require("./search");
const { invalidateIndex: invalidateLLMIndex } = require("./llm-search");
const router = express.Router();

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir });

// Prepare statements once
const insertProject = db.prepare(`
  INSERT OR IGNORE INTO projects (
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

const insertExperiment = db.prepare(`
  INSERT INTO experiments (
    plan_id, iacpj_nm, team, requester, lot_code, module,
    wf_direction, eval_process, prev_eval, cross_experiment,
    eval_category, eval_item, lot_request, reference, volume_split, assign_wf,
    refdata, refdata_url, request_date
  ) VALUES (
    @plan_id, @iacpj_nm, @team, @requester, @lot_code, @module,
    @wf_direction, @eval_process, @prev_eval, @cross_experiment,
    @eval_category, @eval_item, @lot_request, @reference, @volume_split, @assign_wf,
    @refdata, @refdata_url, @request_date
  )
`);

const insertSplit = db.prepare(`
  INSERT OR IGNORE INTO split_tables (
    sno, plan_id, fac_id, oper_id, oper_nm, eps_lot_gbn_cd, work_cond_desc,
    eqp_id, recipe_id, user_def_val_1, user_def_val_2, user_def_val_3,
    user_def_val_4, user_def_val_5, user_def_val_6, user_def_val_7,
    user_def_val_8, user_def_val_9, user_def_val_10, user_def_val_11,
    user_def_val_12, user_def_val_13, user_def_val_14, user_def_val_15,
    user_def_val_16, user_def_val_17, user_def_val_18, user_def_val_19,
    user_def_val_20, user_def_val_21, user_def_val_22, user_def_val_23,
    user_def_val_24, user_def_val_25, note
  ) VALUES (
    @sno, @plan_id, @fac_id, @oper_id, @oper_nm, @eps_lot_gbn_cd, @work_cond_desc,
    @eqp_id, @recipe_id, @user_def_val_1, @user_def_val_2, @user_def_val_3,
    @user_def_val_4, @user_def_val_5, @user_def_val_6, @user_def_val_7,
    @user_def_val_8, @user_def_val_9, @user_def_val_10, @user_def_val_11,
    @user_def_val_12, @user_def_val_13, @user_def_val_14, @user_def_val_15,
    @user_def_val_16, @user_def_val_17, @user_def_val_18, @user_def_val_19,
    @user_def_val_20, @user_def_val_21, @user_def_val_22, @user_def_val_23,
    @user_def_val_24, @user_def_val_25, @note
  )
`);

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const type = req.body.type || "all";
  const results = [];

  const stream = fs.createReadStream(req.file.path, { encoding: "utf-8" });

  stream
    .pipe(csv({ bom: true }))
    .on("data", (data) => results.push(data))
    .on("end", () => {
      // Clean up uploaded file
      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Error deleting file:", e);
      }

      try {
        let projectCount = 0;
        let experimentCount = 0;
        let splitCount = 0;
        db.exec("BEGIN");
        try {
          for (const row of results) {
            const projectParams = {
              iacpj_nm: row.iacpj_nm || null,
              iacpj_tgt_n: row.iacpj_tgt_n || null,
              iacpj_level: row.iacpj_level || null,
              iacpj_tech_n: row.iacpj_tech_n || null,
              ia_tgt_htr_n: row.ia_tgt_htr_n || null,
              iacpj_nud_n: row.iacpj_nud_n || null,
              iacpj_mod_n: row.iacpj_mod_n || null,
              iacpj_itf_uno: row.iacpj_itf_uno || null,
              iacpj_bgn_dy: row.iacpj_bgn_dy || null,
              iacpj_ch_n: row.iacpj_ch_n || null,
              ia_ta_grd_n: row.ia_ta_grd_n || null,
              project_purpose: row.project_purpose || null,
              iacpj_ta_goa: row.iacpj_ta_goa || null,
              iacpj_cur_stt: row.iacpj_cur_stt || null,
              iacpj_ch_i: row.iacpj_ch_i || null,
              ia_ch_or_i: row.ia_ch_or_i || null,
              ia_ch_or_n: row.ia_ch_or_n || null,
              ia_ch_or_path: row.ia_ch_or_path || null,
              iacpj_core_tec: row.iacpj_core_tec || null,
              iacpj_end_dy: row.iacpj_end_dy || null,
              iacpj_reg_dy: row.iacpj_reg_dy || null,
            };
            const experimentParams = {
              plan_id: row.plan_id || null,
              iacpj_nm: row.iacpj_nm || null,
              team: row.team || null,
              requester: row.requester || null,
              lot_code: row.lot_code || null,
              module: row.module || null,
              wf_direction: row.wf_direction || null,
              eval_process: row.eval_process || null,
              prev_eval: row.prev_eval || null,
              cross_experiment: row.cross_experiment || null,
              eval_category: row.eval_category || null,
              eval_item: row.eval_item || null,
              lot_request: row.lot_request || null,
              reference: row.reference || null,
              volume_split: row.volume_split || null,
              assign_wf: row.assign_wf || null,
              refdata: row.refdata || null,
              refdata_url: row.refdata_url || null,
              request_date: row.request_date || null,
            };
            const splitParams = {
              sno: row.sno || null,
              plan_id: row.plan_id || null,
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
              user_def_val_16: row.user_def_val_16 || null,
              user_def_val_17: row.user_def_val_17 || null,
              user_def_val_18: row.user_def_val_18 || null,
              user_def_val_19: row.user_def_val_19 || null,
              user_def_val_20: row.user_def_val_20 || null,
              user_def_val_21: row.user_def_val_21 || null,
              user_def_val_22: row.user_def_val_22 || null,
              user_def_val_23: row.user_def_val_23 || null,
              user_def_val_24: row.user_def_val_24 || null,
              user_def_val_25: row.user_def_val_25 || null,
              note: row.note || null,
            };

            if (type === "project") {
              if (!row.iacpj_nm) continue;
              const res = insertProject.run(projectParams);
              if (res.changes > 0) projectCount++;
            } else if (type === "experiment") {
              if (!row.plan_id || !row.iacpj_nm) continue;
              const res = insertExperiment.run(experimentParams);
              if (res.changes > 0) experimentCount++;
            } else if (type === "split") {
              if (!row.plan_id) continue;
              const res = insertSplit.run(splitParams);
              if (res.changes > 0) splitCount++;
            }
            // 'all' case
            else if (type === "all") {
              if (row.iacpj_nm) {
                if (insertProject.run(projectParams).changes > 0) projectCount++;
              }
              if (row.plan_id && row.iacpj_nm) {
                if (insertExperiment.run(experimentParams).changes > 0) experimentCount++;
              }
              if (row.plan_id) {
                if (insertSplit.run(splitParams).changes > 0) splitCount++;
              }
            }
          }
          db.exec("COMMIT");
        } catch (txErr) {
          db.exec("ROLLBACK");
          throw txErr;
        }
        const counts = { projectCount, experimentCount, splitCount };
        invalidateIndex();
        invalidateLLMIndex();
        res.json({
          message: "Process completed",
          details: counts,
          totalRows: results.length,
        });
      } catch (err) {
        console.error("Database Error:", err);
        if (!res.headersSent) {
          res.status(500).json({
            error: "Database error during insertion.",
            details: err.message,
          });
        }
      }
    });

  // Handle CSV errors
  stream.on("error", (err) => {
    console.error("CSV Reading Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to read CSV file." });
    }
    try {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch (e) {}
  });
});

// ─── DB 현황 조회 ───
router.get("/stats", (req, res) => {
  const projectCount = db.prepare("SELECT COUNT(*) AS cnt FROM projects").get().cnt;
  const experimentCount = db.prepare("SELECT COUNT(*) AS cnt FROM experiments").get().cnt;
  const splitCount = db.prepare("SELECT COUNT(*) AS cnt FROM split_tables").get().cnt;
  res.json({ projectCount, experimentCount, splitCount });
});

// ─── DB 전체 초기화 ───
router.delete("/clear", (req, res) => {
  try {
    const clearAll = db.transaction(() => {
      db.prepare("DELETE FROM split_tables").run();
      db.prepare("DELETE FROM experiments").run();
      db.prepare("DELETE FROM projects").run();
      db.prepare("DELETE FROM line_lots").run();
    });
    clearAll();
    res.json({ message: "DB 초기화 완료" });
  } catch (err) {
    console.error("DB clear error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
