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
    refdata, refdata_url
  ) VALUES (
    @plan_id, @iacpj_nm, @team, @requester, @lot_code, @module,
    @wf_direction, @eval_process, @prev_eval, @cross_experiment,
    @eval_category, @eval_item, @lot_request, @reference, @volume_split, @assign_wf,
    @refdata, @refdata_url
  )
`);

const insertSplit = db.prepare(`
  INSERT OR IGNORE INTO split_tables (
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
            if (type === "project") {
              if (!row.iacpj_nm) continue;
              const res = insertProject.run(row);
              if (res.changes > 0) projectCount++;
            } else if (type === "experiment") {
              if (!row.plan_id || !row.iacpj_nm) continue;
              const res = insertExperiment.run(row);
              if (res.changes > 0) experimentCount++;
            } else if (type === "split") {
              if (!row.plan_id) continue;
              const res = insertSplit.run(row);
              if (res.changes > 0) splitCount++;
            }
            // 'all' case
            else if (type === "all") {
              if (row.iacpj_nm) {
                if (insertProject.run(row).changes > 0) projectCount++;
              }
              if (row.plan_id && row.iacpj_nm) {
                if (insertExperiment.run(row).changes > 0) experimentCount++;
              }
              if (row.plan_id) {
                if (insertSplit.run(row).changes > 0) splitCount++;
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

module.exports = router;
