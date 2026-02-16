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
      plan_id TEXT,
      assign_wf TEXT,
      status TEXT DEFAULT 'Assign 전',
      split_completed INTEGER DEFAULT 0,
      summary_completed INTEGER DEFAULT 0,
      FOREIGN KEY (project_name) REFERENCES projects(project_name)
    );

    CREATE TABLE IF NOT EXISTS line_lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lot_id TEXT NOT NULL,
      current_step TEXT,
      fac_id TEXT DEFAULT 'r3',
      status TEXT DEFAULT 'available',
      estimated_arrival TEXT
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

  // 기존 테이블에 새 컬럼 추가 (이미 있으면 무시)
  const migrations = [
    "ALTER TABLE experiments ADD COLUMN status TEXT DEFAULT 'Assign 전'",
    "ALTER TABLE experiments ADD COLUMN split_completed INTEGER DEFAULT 0",
    "ALTER TABLE experiments ADD COLUMN summary_completed INTEGER DEFAULT 0",
    "ALTER TABLE experiments ADD COLUMN fab_status TEXT",
  ];
  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch (_) {
      // 컬럼이 이미 존재하면 무시
    }
  }

  // plan_id NOT NULL → NULL 허용 마이그레이션 (SQLite는 ALTER로 제약 변경 불가 → 테이블 재생성)
  try {
    const info = db.prepare("PRAGMA table_info(experiments)").all();
    const planIdCol = info.find((c) => c.name === "plan_id");
    if (planIdCol && planIdCol.notnull === 1) {
      db.exec(`
        CREATE TABLE experiments_new (
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
          plan_id TEXT,
          assign_wf TEXT,
          status TEXT DEFAULT 'Assign 전',
          split_completed INTEGER DEFAULT 0,
          summary_completed INTEGER DEFAULT 0,
          fab_status TEXT,
          FOREIGN KEY (project_name) REFERENCES projects(project_name)
        );
        INSERT INTO experiments_new SELECT * FROM experiments;
        DROP TABLE experiments;
        ALTER TABLE experiments_new RENAME TO experiments;
        CREATE INDEX IF NOT EXISTS idx_experiments_project ON experiments(project_name);
        CREATE INDEX IF NOT EXISTS idx_experiments_plan ON experiments(plan_id);
      `);
      console.log("Migration: plan_id NOT NULL → NULL 허용 완료");
    }
  } catch (err) {
    console.error("plan_id migration error:", err.message);
  }
}

/**
 * ✅ 샘플/초기 데이터 주입 제거
 * - "DB 없으면 아무것도 안 나오는" 상태를 원하면 seedData는 no-op으로 둔다.
 */
function seedData() {
  // line_lots 샘플 데이터 (라인에 있는 자재 목록)
  const existingLots = db
    .prepare("SELECT COUNT(*) as cnt FROM line_lots")
    .get();
  if (existingLots.cnt === 0) {
    // 현재 시점 기준으로 가짜 예상 도달 시점 생성 (±3일 범위)
    const now = Date.now();
    const h = 3600000; // 1시간 (ms)
    const sampleLots = [
      {
        lot_id: "RAXA123",
        current_step: "p301200b (esl_etch)",
        fac_id: "r3",
        eta: new Date(now + 2 * h).toISOString(),
      },
      {
        lot_id: "RAXA456",
        current_step: "p802300c (via_open)",
        fac_id: "r3",
        eta: new Date(now + 8 * h).toISOString(),
      },
      {
        lot_id: "RAXA789",
        current_step: "r206100a (blc_mask)",
        fac_id: "r3",
        eta: new Date(now + 14 * h).toISOString(),
      },
      {
        lot_id: "RSAB101",
        current_step: "p951100a (m0c_mask)",
        fac_id: "r3",
        eta: new Date(now + 24 * h).toISOString(),
      },
      {
        lot_id: "RSAB202",
        current_step: "r405500d (metal_dep)",
        fac_id: "r3",
        eta: new Date(now + 5 * h).toISOString(),
      },
      {
        lot_id: "RSAB303",
        current_step: "p610400e (cmp_polish)",
        fac_id: "r3",
        eta: new Date(now + 36 * h).toISOString(),
      },
      {
        lot_id: "RDLA404",
        current_step: "r507600f (ion_implant)",
        fac_id: "r3",
        eta: new Date(now + 48 * h).toISOString(),
      },
      {
        lot_id: "RDLA505",
        current_step: "p301200b (esl_etch)",
        fac_id: "r3",
        eta: new Date(now + 1 * h).toISOString(),
      },
      {
        lot_id: "RDLA606",
        current_step: "p802300c (via_open)",
        fac_id: "r3",
        eta: new Date(now + 18 * h).toISOString(),
      },
      {
        lot_id: "RAXB707",
        current_step: "r206100a (blc_mask)",
        fac_id: "r3",
        eta: new Date(now + 30 * h).toISOString(),
      },
      {
        lot_id: "RAXB808",
        current_step: "p951100a (m0c_mask)",
        fac_id: "r3",
        eta: new Date(now + 6 * h).toISOString(),
      },
      {
        lot_id: "RSRB909",
        current_step: "r405500d (metal_dep)",
        fac_id: "r3",
        eta: new Date(now + 42 * h).toISOString(),
      },
    ];
    const stmt = db.prepare(
      "INSERT INTO line_lots (lot_id, current_step, fac_id, estimated_arrival) VALUES (?, ?, ?, ?)",
    );
    for (const lot of sampleLots) {
      stmt.run(lot.lot_id, lot.current_step, lot.fac_id, lot.eta);
    }
  }
}

module.exports = { db, initDB, seedData };
