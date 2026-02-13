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

module.exports = router;
