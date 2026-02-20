// 테스트용 샘플 데이터 시드 스크립트
// 실행: node server/seed.js

const { db, initDB } = require("./db");

initDB();

console.log("🌱 샘플 데이터 삽입 시작...");

// ─── 1. 과제 (Projects) ───
const projects = [
  {
    iacpj_nm: "1a DRAM CMP 공정 최적화",
    iacpj_tgt_n: "DRAM",
    iacpj_level: "Lv2",
    iacpj_tech_n: "1a DRAM",
    ia_tgt_htr_n: "Green",
    iacpj_nud_n: "N",
    iacpj_mod_n: "Cell",
    iacpj_itf_uno: "PRJ-2025-001",
    iacpj_bgn_dy: "2025-01-10",
    iacpj_ch_n: "김철수",
    ia_ta_grd_n: "A",
    project_purpose: "1a DRAM 양산 수율 향상을 위한 CMP 공정 마진 확보",
    iacpj_ta_goa: "Dishing < 5nm, Erosion < 10nm 달성 및 CMP 후 CD 균일도 1σ < 0.5nm",
    iacpj_cur_stt: "조건 최적화 실험 진행 중",
  },
  {
    iacpj_nm: "1b NAND ESL Etch 공정 개발",
    iacpj_tgt_n: "NAND",
    iacpj_level: "Lv1",
    iacpj_tech_n: "1b NAND",
    ia_tgt_htr_n: "Red",
    iacpj_nud_n: "Y",
    iacpj_mod_n: "Cell",
    iacpj_itf_uno: "PRJ-2025-002",
    iacpj_bgn_dy: "2025-02-01",
    iacpj_ch_n: "이영희",
    ia_ta_grd_n: "S",
    project_purpose: "차세대 NAND ESL 에칭 공정 개발로 CD 정밀도 향상",
    iacpj_ta_goa: "ESL CD 균일도 3σ < 1nm, Etch rate 균일도 < 2%",
    iacpj_cur_stt: "1차 DOE 완료, 2차 최적화 진행",
  },
  {
    iacpj_nm: "HBM Hybrid Bonding 신뢰성 평가",
    iacpj_tgt_n: "DRAM",
    iacpj_level: "Lv3",
    iacpj_tech_n: "HBM3E",
    ia_tgt_htr_n: "Green",
    iacpj_nud_n: "N",
    iacpj_mod_n: "Peri",
    iacpj_itf_uno: "PRJ-2025-003",
    iacpj_bgn_dy: "2025-01-20",
    iacpj_ch_n: "박민준",
    ia_ta_grd_n: "S",
    project_purpose: "HBM3E Hybrid Bonding 공정 신뢰성 확보 및 수율 개선",
    iacpj_ta_goa: "Bonding 강도 > 200 MPa, TC 1000사이클 후 저항 변화 < 5%",
    iacpj_cur_stt: "온도 조건 실험 진행, Split 구성 확정",
  },
];

const insertProject = db.prepare(`
  INSERT OR IGNORE INTO projects (
    iacpj_nm, iacpj_tgt_n, iacpj_level, iacpj_tech_n, ia_tgt_htr_n,
    iacpj_nud_n, iacpj_mod_n, iacpj_itf_uno, iacpj_bgn_dy, iacpj_ch_n,
    ia_ta_grd_n, project_purpose, iacpj_ta_goa, iacpj_cur_stt
  ) VALUES (
    @iacpj_nm, @iacpj_tgt_n, @iacpj_level, @iacpj_tech_n, @ia_tgt_htr_n,
    @iacpj_nud_n, @iacpj_mod_n, @iacpj_itf_uno, @iacpj_bgn_dy, @iacpj_ch_n,
    @ia_ta_grd_n, @project_purpose, @iacpj_ta_goa, @iacpj_cur_stt
  )
`);
for (const p of projects) insertProject.run(p);
console.log(`  ✅ 과제 ${projects.length}건 삽입`);

// ─── 2. 실험 (Experiments) ───
const experiments = [
  // 과제 1
  {
    iacpj_nm: "1a DRAM CMP 공정 최적화",
    eval_item: "CMP Dishing 제어 실험",
    eval_process: "CMP",
    eval_category: "공정 최적화",
    requester: "김철수",
    team: "Cell공정팀",
    lot_code: "DR1A2501",
    module: "Cell",
    wf_direction: "Normal",
    plan_id: "PLN-2025-001",
    assign_wf: "25",
    status: "진행 중",
    request_date: "2025-01-15",
  },
  {
    iacpj_nm: "1a DRAM CMP 공정 최적화",
    eval_item: "CMP Erosion 최소화 실험",
    eval_process: "CMP",
    eval_category: "공정 최적화",
    requester: "김철수",
    team: "Cell공정팀",
    lot_code: "DR1A2502",
    module: "Cell",
    wf_direction: "Normal",
    plan_id: "PLN-2025-002",
    assign_wf: "15",
    status: "완료",
    request_date: "2025-02-03",
  },
  // 과제 2
  {
    iacpj_nm: "1b NAND ESL Etch 공정 개발",
    eval_item: "ESL Etch Rate 균일도 개선",
    eval_process: "Dry Etch",
    eval_category: "공정 개발",
    requester: "이영희",
    team: "Etch공정팀",
    lot_code: "ND1B2501",
    module: "Cell",
    wf_direction: "Reverse",
    plan_id: "PLN-2025-003",
    assign_wf: "20",
    status: "진행 중",
    request_date: "2025-02-10",
  },
  {
    iacpj_nm: "1b NAND ESL Etch 공정 개발",
    eval_item: "ESL CD 제어 정밀도 향상",
    eval_process: "Dry Etch",
    eval_category: "공정 개발",
    requester: "이영희",
    team: "Etch공정팀",
    lot_code: "ND1B2502",
    module: "Cell",
    wf_direction: "Normal",
    plan_id: "PLN-2025-004",
    assign_wf: "25",
    status: "Assign 전",
    request_date: "2025-02-20",
  },
  // 과제 3
  {
    iacpj_nm: "HBM Hybrid Bonding 신뢰성 평가",
    eval_item: "Bonding 온도 조건 최적화",
    eval_process: "Hybrid Bonding",
    eval_category: "신뢰성",
    requester: "박민준",
    team: "PKG공정팀",
    lot_code: "HBM3E2501",
    module: "Peri",
    wf_direction: "Normal",
    plan_id: "PLN-2025-005",
    assign_wf: "12",
    status: "진행 중",
    request_date: "2025-01-25",
  },
  {
    iacpj_nm: "HBM Hybrid Bonding 신뢰성 평가",
    eval_item: "TC Cycle 후 전기적 특성 평가",
    eval_process: "Reliability",
    eval_category: "신뢰성",
    requester: "박민준",
    team: "PKG공정팀",
    lot_code: "HBM3E2502",
    module: "Peri",
    wf_direction: "Normal",
    plan_id: "PLN-2025-006",
    assign_wf: "6",
    status: "완료",
    request_date: "2025-03-01",
  },
];

const insertExp = db.prepare(`
  INSERT OR IGNORE INTO experiments (
    iacpj_nm, eval_item, eval_process, eval_category, requester, team,
    lot_code, module, wf_direction, plan_id, assign_wf, status, request_date
  ) VALUES (
    @iacpj_nm, @eval_item, @eval_process, @eval_category, @requester, @team,
    @lot_code, @module, @wf_direction, @plan_id, @assign_wf, @status, @request_date
  )
`);
for (const e of experiments) insertExp.run(e);
console.log(`  ✅ 실험 ${experiments.length}건 삽입`);

// ─── 3. Split Tables ───
const splits = [
  // PLN-2025-001: CMP Dishing (base/s1/s2 × 2 공정)
  { sno: 1, plan_id: "PLN-2025-001", fac_id: "R3", oper_id: "CMP0100", oper_nm: "STI CMP", eps_lot_gbn_cd: "base", work_cond_desc: "Standard 조건 (기준)", eqp_id: "CMP-01", recipe_id: "STI_CMP_STD", note: "기준 조건", user_def_val_1: "O", user_def_val_2: "O", user_def_val_3: "O", user_def_val_4: "O", user_def_val_5: "O" },
  { sno: 2, plan_id: "PLN-2025-001", fac_id: "R3", oper_id: "CMP0100", oper_nm: "STI CMP", eps_lot_gbn_cd: "s1",   work_cond_desc: "Pressure +10% 조건", eqp_id: "CMP-01", recipe_id: "STI_CMP_P10", note: "압력 증가", user_def_val_1: "O", user_def_val_2: "O", user_def_val_3: null, user_def_val_4: "O", user_def_val_5: null },
  { sno: 3, plan_id: "PLN-2025-001", fac_id: "R3", oper_id: "CMP0100", oper_nm: "STI CMP", eps_lot_gbn_cd: "s2",   work_cond_desc: "Slurry flow -15% 조건", eqp_id: "CMP-02", recipe_id: "STI_CMP_SF85", note: "슬러리 감소", user_def_val_1: null, user_def_val_2: "O", user_def_val_3: "O", user_def_val_4: null, user_def_val_5: "O" },
  { sno: 4, plan_id: "PLN-2025-001", fac_id: "R3", oper_id: "CMP0200", oper_nm: "ILD CMP", eps_lot_gbn_cd: "base", work_cond_desc: "Standard 조건", eqp_id: "CMP-01", recipe_id: "ILD_CMP_STD", note: null, user_def_val_1: "O", user_def_val_2: "O", user_def_val_3: "O", user_def_val_4: "O", user_def_val_5: "O" },
  { sno: 5, plan_id: "PLN-2025-001", fac_id: "R3", oper_id: "CMP0200", oper_nm: "ILD CMP", eps_lot_gbn_cd: "s1",   work_cond_desc: "RPM +50 조건", eqp_id: "CMP-01", recipe_id: "ILD_CMP_R50", note: null, user_def_val_1: "O", user_def_val_2: null, user_def_val_3: "O", user_def_val_4: "O", user_def_val_5: null },

  // PLN-2025-002: CMP Erosion
  { sno: 1, plan_id: "PLN-2025-002", fac_id: "R3", oper_id: "CMP0100", oper_nm: "STI CMP", eps_lot_gbn_cd: "base", work_cond_desc: "기준 조건", eqp_id: "CMP-03", recipe_id: "STI_CMP_STD", note: "기준", user_def_val_1: "O", user_def_val_2: "O", user_def_val_3: "O" },
  { sno: 2, plan_id: "PLN-2025-002", fac_id: "R3", oper_id: "CMP0100", oper_nm: "STI CMP", eps_lot_gbn_cd: "s1",   work_cond_desc: "Pad conditioner 교체 조건", eqp_id: "CMP-03", recipe_id: "STI_CMP_PC", note: null, user_def_val_1: null, user_def_val_2: "O", user_def_val_3: "O" },
  { sno: 3, plan_id: "PLN-2025-002", fac_id: "R3", oper_id: "CMP0100", oper_nm: "STI CMP", eps_lot_gbn_cd: "s2",   work_cond_desc: "Time -10s 조건", eqp_id: "CMP-03", recipe_id: "STI_CMP_T90", note: null, user_def_val_1: "O", user_def_val_2: null, user_def_val_3: "O" },

  // PLN-2025-003: ESL Etch Rate
  { sno: 1, plan_id: "PLN-2025-003", fac_id: "R3", oper_id: "ET0150", oper_nm: "ESL Dry Etch", eps_lot_gbn_cd: "base", work_cond_desc: "기준 RF Power / 압력", eqp_id: "ETCH-11", recipe_id: "ESL_ETCH_STD", note: "DOE 기준점", user_def_val_1: "O", user_def_val_2: "O", user_def_val_3: "O", user_def_val_4: "O" },
  { sno: 2, plan_id: "PLN-2025-003", fac_id: "R3", oper_id: "ET0150", oper_nm: "ESL Dry Etch", eps_lot_gbn_cd: "s1",   work_cond_desc: "RF Power +50W", eqp_id: "ETCH-11", recipe_id: "ESL_ETCH_P50", note: null, user_def_val_1: "O", user_def_val_2: null, user_def_val_3: "O", user_def_val_4: "O" },
  { sno: 3, plan_id: "PLN-2025-003", fac_id: "R3", oper_id: "ET0150", oper_nm: "ESL Dry Etch", eps_lot_gbn_cd: "s2",   work_cond_desc: "Pressure -5mT", eqp_id: "ETCH-12", recipe_id: "ESL_ETCH_PR5", note: null, user_def_val_1: null, user_def_val_2: "O", user_def_val_3: null, user_def_val_4: "O" },
  { sno: 4, plan_id: "PLN-2025-003", fac_id: "R3", oper_id: "ET0150", oper_nm: "ESL Dry Etch", eps_lot_gbn_cd: "s3",   work_cond_desc: "Gas ratio CF4/O2 변경", eqp_id: "ETCH-12", recipe_id: "ESL_ETCH_GR", note: null, user_def_val_1: "O", user_def_val_2: "O", user_def_val_3: null, user_def_val_4: null },

  // PLN-2025-005: Hybrid Bonding
  { sno: 1, plan_id: "PLN-2025-005", fac_id: "R3", oper_id: "BND0100", oper_nm: "Pre-bond Anneal", eps_lot_gbn_cd: "base", work_cond_desc: "200°C / 60min", eqp_id: "ANNL-01", recipe_id: "HB_ANNL_200", note: "기준 온도", user_def_val_1: "O", user_def_val_2: "O", user_def_val_3: "O", user_def_val_4: "O", user_def_val_5: "O", user_def_val_6: "O" },
  { sno: 2, plan_id: "PLN-2025-005", fac_id: "R3", oper_id: "BND0100", oper_nm: "Pre-bond Anneal", eps_lot_gbn_cd: "s1",   work_cond_desc: "220°C / 60min", eqp_id: "ANNL-01", recipe_id: "HB_ANNL_220", note: "온도 상향", user_def_val_1: "O", user_def_val_2: null, user_def_val_3: "O", user_def_val_4: null, user_def_val_5: "O", user_def_val_6: null },
  { sno: 3, plan_id: "PLN-2025-005", fac_id: "R3", oper_id: "BND0100", oper_nm: "Pre-bond Anneal", eps_lot_gbn_cd: "s2",   work_cond_desc: "200°C / 90min", eqp_id: "ANNL-02", recipe_id: "HB_ANNL_90M", note: "시간 연장", user_def_val_1: null, user_def_val_2: "O", user_def_val_3: null, user_def_val_4: "O", user_def_val_5: null, user_def_val_6: "O" },
  { sno: 4, plan_id: "PLN-2025-005", fac_id: "R3", oper_id: "BND0200", oper_nm: "Cu-Cu Bonding", eps_lot_gbn_cd: "base", work_cond_desc: "압력 3MPa / 300°C", eqp_id: "BOND-01", recipe_id: "CU_BOND_STD", note: null, user_def_val_1: "O", user_def_val_2: "O", user_def_val_3: "O", user_def_val_4: "O", user_def_val_5: "O", user_def_val_6: "O" },
  { sno: 5, plan_id: "PLN-2025-005", fac_id: "R3", oper_id: "BND0200", oper_nm: "Cu-Cu Bonding", eps_lot_gbn_cd: "s1",   work_cond_desc: "압력 4MPa / 300°C", eqp_id: "BOND-01", recipe_id: "CU_BOND_P4", note: null, user_def_val_1: "O", user_def_val_2: null, user_def_val_3: "O", user_def_val_4: "O", user_def_val_5: null, user_def_val_6: "O" },
  { sno: 6, plan_id: "PLN-2025-005", fac_id: "R3", oper_id: "BND0200", oper_nm: "Cu-Cu Bonding", eps_lot_gbn_cd: "s2",   work_cond_desc: "압력 3MPa / 320°C", eqp_id: "BOND-02", recipe_id: "CU_BOND_T320", note: null, user_def_val_1: null, user_def_val_2: "O", user_def_val_3: null, user_def_val_4: "O", user_def_val_5: "O", user_def_val_6: null },

  // PLN-2025-006: TC Cycle
  { sno: 1, plan_id: "PLN-2025-006", fac_id: "R3", oper_id: "REL0100", oper_nm: "TC Cycle Test", eps_lot_gbn_cd: "base", work_cond_desc: "-55°C~125°C / 500cycle", eqp_id: "TC-01", recipe_id: "TC_500C", note: "기준 신뢰성 조건", user_def_val_1: "O", user_def_val_2: "O", user_def_val_3: "O" },
  { sno: 2, plan_id: "PLN-2025-006", fac_id: "R3", oper_id: "REL0100", oper_nm: "TC Cycle Test", eps_lot_gbn_cd: "s1",   work_cond_desc: "-55°C~125°C / 1000cycle", eqp_id: "TC-01", recipe_id: "TC_1000C", note: "가속 조건", user_def_val_1: "O", user_def_val_2: null, user_def_val_3: "O" },
];

const insertSplit = db.prepare(`
  INSERT INTO split_tables (
    sno, plan_id, fac_id, oper_id, oper_nm, eps_lot_gbn_cd,
    work_cond_desc, eqp_id, recipe_id, note,
    user_def_val_1, user_def_val_2, user_def_val_3,
    user_def_val_4, user_def_val_5, user_def_val_6
  ) VALUES (
    @sno, @plan_id, @fac_id, @oper_id, @oper_nm, @eps_lot_gbn_cd,
    @work_cond_desc, @eqp_id, @recipe_id, @note,
    @user_def_val_1, @user_def_val_2, @user_def_val_3,
    @user_def_val_4, @user_def_val_5, @user_def_val_6
  )
`);

db.exec("BEGIN");
try {
  for (const s of splits) insertSplit.run(s);
  db.exec("COMMIT");
  console.log(`  ✅ Split 행 ${splits.length}건 삽입`);
} catch (err) {
  db.exec("ROLLBACK");
  console.error("Split 삽입 오류:", err.message);
}

console.log("\n✅ 시드 완료!");
console.log("   과제 3개 / 실험 6개 / Split 행 " + splits.length + "개");
