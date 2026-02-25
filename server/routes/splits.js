const express = require('express');
const { db } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const { plan_id } = req.query;
  if (plan_id) {
    const splits = db.prepare('SELECT * FROM split_tables WHERE plan_id = ?').all(plan_id);
    return res.json(splits);
  }
  const splits = db.prepare('SELECT * FROM split_tables').all();
  res.json(splits);
});

// plan_id의 전체 splits 교체 (PUT)
router.put('/:planId', (req, res) => {
  const { planId } = req.params;
  const { splits } = req.body;
  if (!splits || !Array.isArray(splits)) {
    return res.status(400).json({ error: 'splits array required' });
  }

  const stmt = db.prepare(`
    INSERT INTO split_tables (
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

  try {
    db.exec('BEGIN');
    db.prepare('DELETE FROM split_tables WHERE plan_id = ?').run(planId);
    for (const row of splits) {
      stmt.run({
        sno: row.sno || null,
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
      });
    }
    db.exec('COMMIT');

    try {
      const searchRouter = require('./search');
      if (searchRouter.invalidateIndex) searchRouter.invalidateIndex();
    } catch (_) {}

    res.json({ count: splits.length });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Split 저장 오류:', err);
    res.status(500).json({ error: 'Split 저장 중 오류 발생', details: err.message });
  }
});

module.exports = router;
