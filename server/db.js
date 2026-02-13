const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'lab.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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

function seedData() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM projects').get();
  if (count.cnt > 0) return;

  const insertProject = db.prepare(`
    INSERT INTO projects (dev_type, dev_category, verification_lv, preceding_type, target_device,
      first_target_tech, second_target_tech, htrs_link, htrs_color, nudd, module,
      project_name, project_code, start_date, pm, project_grade, project_purpose, project_goal, current_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertExperiment = db.prepare(`
    INSERT INTO experiments (team, requester, lot_code, project_name, module, wf_direction,
      eval_process, prev_eval, cross_experiment, eval_category, eval_item, lot_request,
      reference, volume_split, plan_id, assign_wf)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSplit = db.prepare(`
    INSERT INTO split_tables (fac_id, plan_id, oper_id, oper_nm, eps_lot_gbn_cd, work_cond_desc,
      eqp_id, recipe_id, user_def_val_1, user_def_val_2, user_def_val_3, user_def_val_4,
      user_def_val_5, user_def_val_6, user_def_val_7, user_def_val_8, user_def_val_9,
      user_def_val_10, user_def_val_11, user_def_val_12, user_def_val_13, user_def_val_14,
      user_def_val_15, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    // 과제 데이터
    const projects = [
      ['Advanced', '소자 요소 기술', 'LV.4B', '차세대 Memory', 'DRAM', 'Pollux', '-', '', 'Red', 'N(New)', 'SN(DRAM)',
        'PX 향 SN Cryo ESL(ETCH STOP LAYER)', '2025-003184', '2025.10.1', '강동구', 'EMD 과제',
        'PX 향 SN Cryo ESL(ETCH STOP LAYER)',
        'Tech Scaling에 따라, N+3 Tech CAP 기술 한계를 극복하기 위해 도입된 극저온 ETCH에서 Stop Layer 조건 확보',
        'PX Base로 채택된 Cryo 요소기술 예상 Risk 항목인 SN-SC2 Bridge를 극복하기 위한 OL Margin 확보 기술 필요'],
      ['Advanced', '소자 요소 기술', 'LV.5A', '차세대 Memory', 'DRAM', 'Extending', '-', 'H3', 'White', 'U(Unique)', 'MLM',
        'VG향 Hybrid Bonding Pitch 200nm 요소기술 개발', 'ACN20248029', '2024.11.1', '최용훈', 'EMD 과제',
        '고성능/고용량 DRAM 및 3D DRAM을 위한 Wafer Hybrid Bonding 기술 개발',
        'Global/Local Flatness 확보 : Pattern design과 공정 최적 조건 도출을 통해 Erosion/Dishing을 최소화하여 Daisy chain 연결성 최대화\nBonding OL 개선: Pad size 별 Bonding OL Spec 도출 및 최적화된 Pad Shape 도출',
        'VG/3D DRAM 준비 요소 기술 개발 : Pitch 200nm 수준 요구됨'],
      ['Advanced', '소자 요소 기술', 'LV.5A', '차세대 Memory', 'DRAM', 'Kapella', '-', 'H3', 'Red', 'N(New)', 'SAC(CBL-SNC)',
        'KP향 BL, SNC COntaft Low Thermal 최적화', 'ACN20248002', '2025.6.1', '박민', 'EMD 과제',
        'KP향 BL, SNC COntaft Low Thermal 최적화',
        '기존 VG 평가판 활용 시 BL 형성 후 PERI M0C를 형성하여 BL Low Temp Activation 평가 불가능하여 PERI 먼저 형성 후 BL 형성하는 BL Low Thermal 전용 Process setup하여 Activation 평가에 활용',
        'VG POC Cap 1st scheme에선 BL단 이후 공정에서 430C 이상 Thermal 시 Cap LKG 열화되어 Low Thermal 조건내 Junction 형성 방안 필요'],
      ['Advanced', '소자 요소 기술', 'LV.5A', '차세대 Memory', 'DRAM', 'Pollux', '-', 'H3', 'Red', 'N(New)', 'GT(Cell)',
        'HKMG2.1 기반 PX 파생향 개발 과제', 'ACN20248438', '2025.10.22', '이재훈', '팀/CoE과제',
        'PX 파생향 HKMG 2.1 기반 High Speed Peri. Transistor 특성 확보',
        'Tinv scaling(~1A)+GT Lg scaling(40->35nm)\nSSL 평가, Shallow Junction 형성(IMP 최적화), Graded cSiGe 최적화 등',
        'PX Tech 파생 제품은 LP6/DDR6등으로 예정되어 있으며, HKMG2.0p 대비 ROD 개선이 필요한 2D 극한의 Platform 개발 필요'],
    ];

    for (const p of projects) {
      insertProject.run(...p);
    }

    // 실험 데이터
    const experiments = [
      ['Advanced', '김근영', 'RSAB', 'PX 향 SN Cryo ESL(ETCH STOP LAYER)', 'SN', '100', 'LOT 신규 투입(RSAB705 상신 완료)', 'X', 'X', 'Inline', 'SN CRYO ESL 자재 SC2 형성 모듈랏', '', '-', 'Split', 'RSAB705', '#1-10'],
      ['Advanced', '김근영', 'RSAB', 'PX 향 SN Cryo ESL(ETCH STOP LAYER)', 'SN', '100', 'LOT 신규 투입(RSAB705 상신 완료)', 'X', 'X', 'Inline', 'SN CRYO ESL ETCH T/G 확보', '', '-', 'Split', 'RSAB704', '#1-10'],
      ['Advanced', '류경주', 'RSAB', 'PX 향 SN Cryo ESL(ETCH STOP LAYER)', 'SN', '100', 'LOT 신규 투입(RSAB705 상신 완료)', 'X', 'X', 'Inline', 'SN CRYO ESL 자재 ZRO2 EB후 PERI부 잔존 검증', '', '-', 'Split', 'RSAB701', '#1-15'],
      ['Advanced', '박성민(2075488)', 'RDLA', 'VG향 Hybrid Bonding Pitch 200nm 요소기술 개발', 'MLM2', '', 'TBD CU DEP', 'X', 'X', 'Inline, EPM', 'RPC Split 조건 추가 반영', 'O', '-', 'Split', 'RDLA220', '#1-15'],
      ['Advanced', '박성민(2075488)', 'RDLA', 'VG향 Hybrid Bonding Pitch 200nm 요소기술 개발', 'MLM2', '', 'TBD MASK', 'X', 'X', 'Inline, EPM', 'Bonding 수율 개선 Item', 'O', '-', 'Split', 'RDLA218', '#1-15'],
      ['Advanced', '박성민(2075488)', 'RDLA', 'VG향 Hybrid Bonding Pitch 200nm 요소기술 개발', 'MLM2', '', 'TIM CU CMP', 'X', 'X', 'Inline, EPM', 'TIM Bridge 개선, PS4 Bonding 개선 평가', 'O', '-', 'Split', 'RDLA207', '#1-15'],
      ['Advanced', '박성민(2075488)', 'RDLA', 'VG향 Hybrid Bonding Pitch 200nm 요소기술 개발', 'MLM2', '', 'TIM CU CMP 후 PWI', 'X', 'X', 'Inline, EPM', 'TIM CU CMP 후 bridge성 불량 확인 목적 PWI', 'O', '-', 'Split', 'RDLA206', '#1-15'],
      ['Advanced', '서은지(2076064)', 'RAXA', 'KP향 BL, SNC COntaft Low Thermal 최적화', 'SAC', '100', 'LOT 신규투입(RAXA_BASE copy)', 'X', 'X', 'Inline, EPM', 'VG Low Thermal BM 최적화 - CBL Profile 개선', 'O', '-', 'Split', 'RAXA258', '#1-10'],
      ['Advanced', '한승수', 'RAXA', 'KP향 BL, SNC COntaft Low Thermal 최적화', 'SAC', '100', 'LOT 신규투입(RAXA_BASE copy)', 'X', 'X', 'Inline, EPM', 'VG향 BL Low Thermal 과제', 'O', '-', 'Split', 'RAXA245', '#1-10'],
      ['Advanced', '김현우', 'RAXA', 'KP향 BL, SNC COntaft Low Thermal 최적화', 'SAC', '100', 'LOT 신규투입(RAXA_BASE copy)', 'X', 'X', 'Inline, EPM', 'VG향 BL Low Thermal 과제', 'O', '-', 'Split', 'RAXA248', '#1-10'],
      ['Advanced', '강연주', 'RAXA', 'KP향 BL, SNC COntaft Low Thermal 최적화', 'SAC', '100', 'RAXABM Copy', 'X', 'X', 'Inline, EPM', 'VG Low Thermal BM 최적화 평가 : MLA Split', 'O', '-', 'Split', 'RAXA243', '#1-15'],
      ['Advanced', '이재훈', 'RSRB', 'HKMG2.1 기반 PX 파생향 개발 과제', 'GT', '', '신규투입(RSRB_BASE COPY)', 'X', 'X', 'Inline, EPM', 'HKMG 2.1 Tinv/Lg Scaling 평가', 'O', '-', 'Split', 'RSRB700', '#1-15'],
      ['Advanced', '이재훈', 'RSRB', 'HKMG2.1 기반 PX 파생향 개발 과제', 'GT', '', '신규투입(RSRB_BASE COPY)', 'X', 'X', 'Inline, EPM', 'HKMG2.1 SSL/DSL 재현성 평가 및 추가 Stress 확인', 'O', '-', 'Split', 'RSRB701', '#1-15'],
      ['Advanced', '이재훈', 'RSRB', 'HKMG2.1 기반 PX 파생향 개발 과제', 'GT', '', '신규투입(RSRB_BASE COPY)', 'X', 'X', 'Inline, EPM', 'HKMG2.1 Shallow Junction Tune', 'O', '-', 'Split', 'RSRB703', '#1-15'],
      ['Advanced', '이재훈', 'RSRB', 'HKMG2.1 기반 PX 파생향 개발 과제', 'GT', '', '신규투입(RSRB_BASE COPY)', 'X', 'X', 'Inline, EPM', 'HK2.1 SSL Topo 평가', 'O', '-', 'Split', 'RSRB704', '#1-15'],
    ];

    for (const e of experiments) {
      insertExperiment.run(...e);
    }

    // Split Table 데이터
    const splits = [
      ['r3', 'RSAB705', 'r206100a', 'blc_mask', 'base', null, 'm111', 'sp-in-blc-rnd', 'O', 'O', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '백업 장비 테스트'],
      ['r3', 'RSAB705', 'r206100a', 'blc_mask', 's1', null, 'm112', 'sp-in-blc-rnd', '', '', '', '', '', '', 'O', 'O', 'O', '', '', '', '', '', '', '백업 장비 테스트'],
      ['r3', 'RSAB705', 'p951100a', 'm0c mask', 'base', 'base', 'ins38', 'T1', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Protection Diode 제거'],
      ['r3', 'RSAB705', 'p951100a', 'm0c mask', 's1', 'pd 제거 적용', 'ins38', 'T2', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Protection Diode 제거'],
      ['r3', 'RSAB704', 'r206100a', 'blc_mask', 'base', null, 'm111', 'sp-in-blc-rnd', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '', '', 'ESL ETCH 조건 평가'],
      ['r3', 'RSAB704', 'r206100a', 'blc_mask', 's1', 'etch time 변경', 'm111', 'sp-in-blc-v2', '', '', '', '', '', 'O', 'O', 'O', 'O', '', '', '', '', '', '', 'ESL ETCH 조건 평가'],
      ['r3', 'RDLA220', 'c401100a', 'cu_dep', 'base', null, 'ecd01', 'cu-std-200', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '', '', 'RPC 조건 추가'],
      ['r3', 'RDLA220', 'c401100a', 'cu_dep', 's1', 'RPC 추가', 'ecd01', 'cu-rpc-200', '', '', '', '', '', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', 'RPC 조건 추가'],
      ['r3', 'RDLA218', 'c301100a', 'bonding_mask', 'base', null, 'lth01', 'bond-p200-v1', 'O', 'O', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', '', 'Bonding 수율 개선'],
      ['r3', 'RDLA207', 'c501100a', 'cu_cmp', 'base', null, 'cmp01', 'tim-cu-std', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '', '', 'TIM Bridge 개선'],
      ['r3', 'RDLA207', 'c501100a', 'cu_cmp', 's1', 'slurry 변경', 'cmp01', 'tim-cu-v2', '', '', '', '', '', 'O', 'O', 'O', 'O', '', '', '', '', '', '', 'TIM Bridge 개선'],
      ['r3', 'RAXA258', 's201100a', 'cbl_etch', 'base', null, 'dry01', 'cbl-std', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '', '', 'CBL Profile 개선'],
      ['r3', 'RAXA258', 's201100a', 'cbl_etch', 's1', 'gas ratio 변경', 'dry01', 'cbl-v2', '', '', '', '', '', 'O', 'O', 'O', 'O', '', '', '', '', '', '', 'CBL Profile 개선'],
      ['r3', 'RAXA245', 'b101100a', 'bl_form', 'base', null, 'cvd01', 'bl-low-t1', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '', '', 'BL Low Thermal'],
      ['r3', 'RAXA245', 'b101100a', 'bl_form', 's1', 'temp 350C', 'cvd01', 'bl-low-t2', '', '', '', '', '', 'O', 'O', 'O', 'O', '', '', '', '', '', '', 'BL Low Thermal'],
      ['r3', 'RAXA243', 'b101100a', 'bl_form', 'base', null, 'mla01', 'mla-std', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', 'MLA Split 평가'],
      ['r3', 'RAXA243', 'b101100a', 'bl_form', 's1', 'MLA energy 변경', 'mla01', 'mla-v2', '', '', '', '', '', '', '', '', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'MLA Split 평가'],
      ['r3', 'RSRB700', 'g201100a', 'hkmg_dep', 'base', null, 'ald01', 'hk21-std', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '', '', 'HKMG 2.1 Tinv Scaling'],
      ['r3', 'RSRB700', 'g201100a', 'hkmg_dep', 's1', 'Tinv target 변경', 'ald01', 'hk21-v2', '', '', '', '', '', 'O', 'O', 'O', 'O', '', '', '', '', '', '', 'HKMG 2.1 Tinv Scaling'],
      ['r3', 'RSRB701', 'g201100a', 'hkmg_dep', 'base', null, 'ald01', 'hk21-ssl-std', 'O', 'O', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', '', 'SSL/DSL 재현성'],
      ['r3', 'RSRB703', 'g301100a', 'imp', 'base', null, 'imp01', 'sj-std', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '', '', 'Shallow Junction'],
      ['r3', 'RSRB703', 'g301100a', 'imp', 's1', 'dose 조정', 'imp01', 'sj-v2', '', '', '', '', '', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', 'Shallow Junction'],
      ['r3', 'RSRB704', 'g201100a', 'hkmg_dep', 'base', null, 'ald01', 'ssl-topo-v1', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', 'SSL Topo 평가'],
    ];

    for (const s of splits) {
      insertSplit.run(...s);
    }
  });

  seedTransaction();
  console.log('Database seeded successfully');
}

module.exports = { db, initDB, seedData };
