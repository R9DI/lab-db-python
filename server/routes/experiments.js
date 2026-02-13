const express = require('express');
const { db } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const { project_name } = req.query;
  if (project_name) {
    const experiments = db.prepare('SELECT * FROM experiments WHERE project_name = ?').all(project_name);
    return res.json(experiments);
  }
  const experiments = db.prepare('SELECT * FROM experiments').all();
  res.json(experiments);
});

router.get('/:id', (req, res) => {
  const experiment = db.prepare('SELECT * FROM experiments WHERE id = ?').get(req.params.id);
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });

  const splits = db.prepare('SELECT * FROM split_tables WHERE plan_id = ?').all(experiment.plan_id);
  const project = db.prepare('SELECT * FROM projects WHERE project_name = ?').get(experiment.project_name);
  res.json({ ...experiment, splits, project });
});

module.exports = router;
