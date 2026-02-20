const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const db = new DatabaseSync(path.join(__dirname, "lab.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

function initDB() {
  // 스키마 초기화 (기존 테이블 제거 후 재생성)
  db.exec("DROP TABLE IF EXISTS split_tables");
  db.exec("DROP TABLE IF EXISTS experiments");
  db.exec("DROP TABLE IF EXISTS projects");
  db.exec("DROP TABLE IF EXISTS line_lots");

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      iacpj_nm TEXT UNIQUE NOT NULL,
      iacpj_tgt_n TEXT,
      iacpj_level TEXT,
      iacpj_tech_n TEXT,
      ia_tgt_htr_n TEXT,
      iacpj_nud_n TEXT,
      iacpj_mod_n TEXT,
      iacpj_itf_uno TEXT,
      iacpj_bgn_dy TEXT,
      iacpj_ch_n TEXT,
      ia_ta_grd_n TEXT,
      project_purpose TEXT,
      iacpj_ta_goa TEXT,
      iacpj_cur_stt TEXT,
      iacpj_ch_i TEXT,
      ia_ch_or_i TEXT,
      ia_ch_or_n TEXT,
      ia_ch_or_path TEXT,
      iacpj_core_tec TEXT,
      iacpj_end_dy TEXT,
      iacpj_reg_dy TEXT
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team TEXT,
      requester TEXT,
      lot_code TEXT,
      iacpj_nm TEXT NOT NULL,
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
      refdata TEXT,
      refdata_url TEXT,
      request_date TEXT,
      status TEXT DEFAULT 'Assign 전',
      split_completed INTEGER DEFAULT 0,
      summary_completed INTEGER DEFAULT 0,
      fab_status TEXT,
      FOREIGN KEY (iacpj_nm) REFERENCES projects(iacpj_nm)
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
      sno INTEGER,
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
      user_def_val_16 TEXT,
      user_def_val_17 TEXT,
      user_def_val_18 TEXT,
      user_def_val_19 TEXT,
      user_def_val_20 TEXT,
      user_def_val_21 TEXT,
      user_def_val_22 TEXT,
      user_def_val_23 TEXT,
      user_def_val_24 TEXT,
      user_def_val_25 TEXT,
      note TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_experiments_project ON experiments(iacpj_nm);
    CREATE INDEX IF NOT EXISTS idx_experiments_plan ON experiments(plan_id);
    CREATE INDEX IF NOT EXISTS idx_splits_plan ON split_tables(plan_id);
  `);
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
