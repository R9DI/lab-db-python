/**
 * Split Table 샘플 데이터 재생성 스크립트
 *
 * 규칙:
 * - 하나의 oper_nm에 대해 base + s1 (또는 s1,s2) 가 한 세트
 * - base와 split은 같은 oper_id/oper_nm/note를 공유
 * - WF 배정은 보완적: base가 WF1~5면 s1은 WF6~9
 * - 장비나 recipe가 달라지는 게 split 조건
 * - 각 plan_id당 약 10줄 (= 4~5 세트)
 */
const { db } = require("./server/db.js");

// 공정 세트 정의: 각 세트는 base+split 조합
const operSets = [
  {
    oper_id: "r206100a",
    oper_nm: "blc_mask",
    base_eqp: "m111",
    split_eqp: "m112",
    base_recipe: "sp-in-blc-rnd",
    split_recipe: "sp-in-blc-v2",
    split_cond: "etch time 변경",
    note: "ESL ETCH 조건 평가",
  },
  {
    oper_id: "p951100a",
    oper_nm: "m0c_mask",
    base_eqp: "ins38",
    split_eqp: "ins38",
    base_recipe: "T1",
    split_recipe: "T2",
    split_cond: "pd 제거 적용",
    note: "Protection Diode 제거",
  },
  {
    oper_id: "r301200b",
    oper_nm: "esl_etch",
    base_eqp: "m201",
    split_eqp: "m202",
    base_recipe: "rx-etch-std",
    split_recipe: "rx-etch-v2",
    split_cond: "gas flow 변경",
    note: "ESL Selectivity 향상",
  },
  {
    oper_id: "p802300c",
    oper_nm: "via_open",
    base_eqp: "eqp01",
    split_eqp: "eqp02",
    base_recipe: "via-std-01",
    split_recipe: "via-opt-01",
    split_cond: "power 증가",
    note: "Via Profile 개선",
  },
  {
    oper_id: "r405500d",
    oper_nm: "metal_dep",
    base_eqp: "m113",
    split_eqp: "m113",
    base_recipe: "dep-base-01",
    split_recipe: "dep-thick-v2",
    split_cond: "thickness 변경",
    note: "Metal 두께 최적화",
  },
  {
    oper_id: "p610400e",
    oper_nm: "cmp_polish",
    base_eqp: "cmp01",
    split_eqp: "cmp02",
    base_recipe: "cmp-std-01",
    split_recipe: "cmp-low-p",
    split_cond: "pressure 감소",
    note: "CMP Uniformity 개선",
  },
  {
    oper_id: "r507600f",
    oper_nm: "ion_implant",
    base_eqp: "imp01",
    split_eqp: "imp01",
    base_recipe: "ion-low-e",
    split_recipe: "ion-high-e",
    split_cond: "dose 변경",
    note: "Implant Dose 최적화",
  },
  {
    oper_id: "p708700g",
    oper_nm: "ox_growth",
    base_eqp: "fur01",
    split_eqp: "fur02",
    base_recipe: "ox-wet-std",
    split_recipe: "ox-dry-v1",
    split_cond: "temp 증가",
    note: "Oxide 두께 균일성",
  },
  {
    oper_id: "r109800h",
    oper_nm: "photo_align",
    base_eqp: "sca01",
    split_eqp: "sca01",
    base_recipe: "photo-kr-01",
    split_recipe: "photo-kr-02",
    split_cond: "align offset 조정",
    note: "Overlay 개선 평가",
  },
  {
    oper_id: "p210900i",
    oper_nm: "dry_etch",
    base_eqp: "etc01",
    split_eqp: "etc02",
    base_recipe: "de-std-01",
    split_recipe: "de-hiar-01",
    split_cond: "etch time 증가",
    note: "CD 균일성 개선",
  },
  {
    oper_id: "b101100a",
    oper_nm: "bl_form",
    base_eqp: "mla01",
    split_eqp: "mla01",
    base_recipe: "mla-std",
    split_recipe: "mla-v2",
    split_cond: "MLA energy 변경",
    note: "MLA Split 평가",
  },
  {
    oper_id: "r312200j",
    oper_nm: "nitride_dep",
    base_eqp: "cvd01",
    split_eqp: "cvd02",
    base_recipe: "nit-std-01",
    split_recipe: "nit-lp-01",
    split_cond: "deposition rate 변경",
    note: "Nitride Stress 조절",
  },
];

// WF 배정 패턴: [base WF 끝 인덱스 (0-based)] → base는 WF1~(cut+1), s1은 WF(cut+2)~9
const wfPatterns = [
  { baseTo: 6, splitFrom: 7 }, // base: WF1-7, s1: WF8-9
  { baseTo: 4, splitFrom: 5 }, // base: WF1-5, s1: WF6-9
  { baseTo: 5, splitFrom: 6 }, // base: WF1-6, s1: WF7-9
  { baseTo: 3, splitFrom: 4 }, // base: WF1-4, s1: WF5-9
  { baseTo: 7, splitFrom: 8 }, // base: WF1-8, s1: WF9
];

const planIds = [
  "RAXA243",
  "RAXA245",
  "RAXA258",
  "RDLA207",
  "RDLA218",
  "RDLA220",
  "RSAB704",
  "RSAB705",
  "RSRB700",
  "RSRB701",
  "RSRB703",
  "RSRB704",
];

function makeWFs(from, to) {
  const wfs = [];
  for (let i = 0; i < 9; i++) {
    wfs.push(i >= from && i <= to ? "O" : "");
  }
  return wfs;
}

const insert = db.prepare(`
  INSERT INTO split_tables (
    fac_id, plan_id, oper_id, oper_nm, eps_lot_gbn_cd,
    work_cond_desc, eqp_id, recipe_id,
    user_def_val_1, user_def_val_2, user_def_val_3,
    user_def_val_4, user_def_val_5, user_def_val_6,
    user_def_val_7, user_def_val_8, user_def_val_9,
    user_def_val_10, user_def_val_11, user_def_val_12,
    user_def_val_13, user_def_val_14, user_def_val_15,
    note
  ) VALUES (
    @fac_id, @plan_id, @oper_id, @oper_nm, @eps_lot_gbn_cd,
    @work_cond_desc, @eqp_id, @recipe_id,
    @v1, @v2, @v3, @v4, @v5, @v6, @v7, @v8, @v9,
    @v10, @v11, @v12, @v13, @v14, @v15,
    @note
  )
`);

const run = db.transaction(() => {
  // 1) 기존 데이터 전부 삭제
  db.prepare("DELETE FROM split_tables").run();
  console.log("🗑️  기존 split_tables 데이터 삭제 완료");

  let totalInserted = 0;

  for (const planId of planIds) {
    // 각 plan_id마다 5개 공정 세트를 선택 (= 10줄)
    // plan_id 기반으로 시작 인덱스 결정하여 다양한 조합
    const startIdx = planIds.indexOf(planId) * 2;

    for (let setIdx = 0; setIdx < 5; setIdx++) {
      const oper = operSets[(startIdx + setIdx) % operSets.length];
      const wfPat = wfPatterns[setIdx % wfPatterns.length];
      const fac = "r3";

      const baseWFs = makeWFs(0, wfPat.baseTo);
      const splitWFs = makeWFs(wfPat.splitFrom, 8);

      // base 행
      insert.run({
        fac_id: fac,
        plan_id: planId,
        oper_id: oper.oper_id,
        oper_nm: oper.oper_nm,
        eps_lot_gbn_cd: "base",
        work_cond_desc: "-",
        eqp_id: oper.base_eqp,
        recipe_id: oper.base_recipe,
        v1: baseWFs[0],
        v2: baseWFs[1],
        v3: baseWFs[2],
        v4: baseWFs[3],
        v5: baseWFs[4],
        v6: baseWFs[5],
        v7: baseWFs[6],
        v8: baseWFs[7],
        v9: baseWFs[8],
        v10: "",
        v11: "",
        v12: "",
        v13: "",
        v14: "",
        v15: "",
        note: oper.note,
      });

      // s1 행 (split 조건)
      insert.run({
        fac_id: fac,
        plan_id: planId,
        oper_id: oper.oper_id,
        oper_nm: oper.oper_nm,
        eps_lot_gbn_cd: "s1",
        work_cond_desc: oper.split_cond,
        eqp_id: oper.split_eqp,
        recipe_id: oper.split_recipe,
        v1: splitWFs[0],
        v2: splitWFs[1],
        v3: splitWFs[2],
        v4: splitWFs[3],
        v5: splitWFs[4],
        v6: splitWFs[5],
        v7: splitWFs[6],
        v8: splitWFs[7],
        v9: splitWFs[8],
        v10: "",
        v11: "",
        v12: "",
        v13: "",
        v14: "",
        v15: "",
        note: oper.note,
      });

      totalInserted += 2;
    }
  }
  return totalInserted;
});

const count = run();
console.log(
  `\n✅ ${count}개 split 행 삽입 완료! (${planIds.length} plan_id × 5세트 × 2줄)`,
);

// 검증
const verify = db
  .prepare("SELECT plan_id, COUNT(*) as cnt FROM split_tables GROUP BY plan_id")
  .all();
console.log("\n📊 plan_id별 행 수:");
verify.forEach((r) => console.log(`  ${r.plan_id}: ${r.cnt}행`));

// 샘플 출력
console.log("\n📋 RSAB705 샘플:");
const sample = db
  .prepare(
    "SELECT oper_nm, eps_lot_gbn_cd, work_cond_desc, eqp_id, recipe_id, user_def_val_1 as WF1, user_def_val_2 as WF2, user_def_val_3 as WF3, user_def_val_4 as WF4, user_def_val_5 as WF5, user_def_val_6 as WF6, user_def_val_7 as WF7, user_def_val_8 as WF8, user_def_val_9 as WF9, note FROM split_tables WHERE plan_id='RSAB705' ORDER BY oper_nm, eps_lot_gbn_cd",
  )
  .all();
console.table(sample);
