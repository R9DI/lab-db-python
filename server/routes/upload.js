const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { db } = require('../db');
const router = express.Router();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir });

// Prepare statements once
const insertProject = db.prepare(`
  INSERT OR IGNORE INTO projects (
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

const insertExperiment = db.prepare(`
  INSERT OR IGNORE INTO experiments (
    plan_id, project_name, team, requester, lot_code, module,
    wf_direction, eval_process, prev_eval, cross_experiment,
    eval_category, eval_item, lot_request, reference, volume_split, assign_wf
  ) VALUES (
    @plan_id, @project_name, @team, @requester, @lot_code, @module,
    @wf_direction, @eval_process, @prev_eval, @cross_experiment,
    @eval_category, @eval_item, @lot_request, @reference, @volume_split, @assign_wf
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

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const type = req.body.type || 'all'; 
  const results = [];

  const stream = fs.createReadStream(req.file.path);
  
  stream.pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Clean up uploaded file
      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch(e) { console.error('Error deleting file:', e); }

      try {
        const transaction = db.transaction((rows) => {
          let projectCount = 0;
          let experimentCount = 0;
          let splitCount = 0;

          for (const row of rows) {
            if (type === 'project') {
              if (!row.project_name) continue;
              const res = insertProject.run(row);
              if (res.changes > 0) projectCount++;
            } 
            else if (type === 'experiment') {
              if (!row.plan_id || !row.project_name) continue;
              const res = insertExperiment.run(row);
              if (res.changes > 0) experimentCount++;
            }
            else if (type === 'split') {
              if (!row.plan_id) continue;
              const res = insertSplit.run(row);
              if (res.changes > 0) splitCount++;
            }
            // 'all' case
            else if (type === 'all') {
               if (row.project_name) {
                 if (insertProject.run(row).changes > 0) projectCount++;
               }
               if (row.plan_id && row.project_name) {
                 if (insertExperiment.run(row).changes > 0) experimentCount++;
               }
               if (row.plan_id) {
                 if (insertSplit.run(row).changes > 0) splitCount++;
               }
            }
          }
          return { projectCount, experimentCount, splitCount };
        });

        const counts = transaction(results);
        res.json({ 
          message: 'Process completed', 
          details: counts,
          totalRows: results.length
        });
        
      } catch (err) {
        console.error('Database Error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Database error during insertion.', details: err.message });
        }
      }
    });

  // Handle CSV errors
  stream.on('error', (err) => {
      console.error('CSV Reading Error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read CSV file.' });
      }
      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch(e) {}
  });
});

module.exports = router;
