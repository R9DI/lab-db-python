const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "lab.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dev_type TEXT,
      dev_category TEXT,
      verification_lv TEXT,
      preceding_type TEXT,
      target_device TEXT,
      first_target_tech TEXT,
      second_target_tech TEXT,
      htrs_link TEXT,
      htrs_color TEXT,
      nudd TEXT,
      module TEXT,
      project_name TEXT UNIQUE NOT NULL,
      project_code TEXT,
      start_date TEXT,
      pm TEXT,
      project_grade TEXT,
      project_purpose TEXT,
      project_goal TEXT,
      current_status TEXT
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team TEXT,
      requester TEXT,
      lot_code TEXT,
      project_name TEXT NOT NULL,
      module TEXT,
      wf_direction TEXT,
      eval_process TEXT,
      prev_eval TEXT,
      cross_experiment TEXT,
      eval_category TEXT,
      eval_item TEXT,
      lot_request TEXT,
      reference TEXT,
      volume_split TEXT,
      plan_id TEXT NOT NULL,
      assign_wf TEXT,
      FOREIGN KEY (project_name) REFERENCES projects(project_name)
    );

    CREATE TABLE IF NOT EXISTS split_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fac_id TEXT,
      plan_id TEXT NOT NULL,
      oper_id TEXT,
      oper_nm TEXT,
      eps_lot_gbn_cd TEXT,
      work_cond_desc TEXT,
      eqp_id TEXT,
      recipe_id TEXT,
      user_def_val_1 TEXT,
      user_def_val_2 TEXT,
      user_def_val_3 TEXT,
      user_def_val_4 TEXT,
      user_def_val_5 TEXT,
      user_def_val_6 TEXT,
      user_def_val_7 TEXT,
      user_def_val_8 TEXT,
      user_def_val_9 TEXT,
      user_def_val_10 TEXT,
      user_def_val_11 TEXT,
      user_def_val_12 TEXT,
      user_def_val_13 TEXT,
      user_def_val_14 TEXT,
      user_def_val_15 TEXT,
      note TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_experiments_project ON experiments(project_name);
    CREATE INDEX IF NOT EXISTS idx_experiments_plan ON experiments(plan_id);
    CREATE INDEX IF NOT EXISTS idx_splits_plan ON split_tables(plan_id);
  `);
}

/**
 * ✅ 샘플/초기 데이터 주입 제거
 * - "DB 없으면 아무것도 안 나오는" 상태를 원하면 seedData는 no-op으로 둔다.
 */
function seedData() {
  // intentionally empty
  return;
}

module.exports = { db, initDB, seedData };
