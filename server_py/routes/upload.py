"""
/api/upload — CSV upload + DB stats + DB clear.
"""
import csv
import io
import sqlite3
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from ..database import get_db

router = APIRouter(prefix="/api/upload", tags=["upload"])

_invalidate_search = None
_invalidate_llm = None

def set_invalidate_fns(search_fn, llm_fn):
    global _invalidate_search, _invalidate_llm
    _invalidate_search = search_fn
    _invalidate_llm = llm_fn

PROJECT_COLS = [
    "iacpj_nm","iacpj_tgt_n","iacpj_level","iacpj_tech_n",
    "ia_tgt_htr_n","iacpj_nud_n","iacpj_mod_n","iacpj_itf_uno","iacpj_bgn_dy",
    "iacpj_ch_n","ia_ta_grd_n","project_purpose","iacpj_ta_goa","iacpj_cur_stt",
    "iacpj_ch_i","ia_ch_or_i","ia_ch_or_n","ia_ch_or_path","iacpj_core_tec",
    "iacpj_end_dy","iacpj_reg_dy",
]
EXPERIMENT_COLS = [
    "plan_id","iacpj_nm","team","requester","lot_code","module",
    "wf_direction","eval_process","prev_eval","cross_experiment",
    "eval_category","eval_item","lot_request","reference","volume_split",
    "assign_wf","refdata","refdata_url","request_date",
]
SPLIT_COLS = [
    "sno","plan_id","fac_id","oper_id","oper_nm","eps_lot_gbn_cd","work_cond_desc",
    "eqp_id","recipe_id",
    *[f"user_def_val_{i}" for i in range(1, 26)],
    "note",
]

def _mk(row, cols):
    return {c: row.get(c) or None for c in cols}

def _sql_insert(table, cols, ignore=False):
    ig = " OR IGNORE" if ignore else ""
    cn = ", ".join(cols)
    ph = ", ".join(f":{c}" for c in cols)
    return f"INSERT{ig} INTO {table} ({cn}) VALUES ({ph})"

@router.post("/")
async def upload_csv(
    file: UploadFile = File(...),
    type: str = Form("all"),
    conn: sqlite3.Connection = Depends(get_db),
):
    if not file:
        raise HTTPException(400, "No file uploaded")
    content = await file.read()

    # 인코딩 자동 감지 (UTF-8 → EUC-KR → CP949)
    text = None
    for encoding in ("utf-8-sig", "utf-8", "euc-kr", "cp949"):
        try:
            text = content.decode(encoding)
            break
        except (UnicodeDecodeError, ValueError):
            continue
    if text is None:
        raise HTTPException(400, "파일 인코딩을 인식할 수 없습니다. UTF-8로 저장 후 다시 시도해주세요.")

    reader = csv.DictReader(io.StringIO(text))
    results = [{k.lower().strip(): v for k, v in row.items()} for row in reader]

    pc = ec = sc = 0
    sql_p = _sql_insert("projects", PROJECT_COLS, True)
    sql_e = _sql_insert("experiments", EXPERIMENT_COLS, False)
    sql_s = _sql_insert("split_tables", SPLIT_COLS, True)

    try:
        for row in results:
            if type == "project":
                if not row.get("iacpj_nm"): continue
                if conn.execute(sql_p, _mk(row, PROJECT_COLS)).rowcount > 0: pc += 1
            elif type == "experiment":
                if not row.get("plan_id") or not row.get("iacpj_nm"): continue
                if conn.execute(sql_e, _mk(row, EXPERIMENT_COLS)).rowcount > 0: ec += 1
            elif type == "split":
                if not row.get("plan_id"): continue
                if conn.execute(sql_s, _mk(row, SPLIT_COLS)).rowcount > 0: sc += 1
            elif type == "all":
                if row.get("iacpj_nm"):
                    if conn.execute(sql_p, _mk(row, PROJECT_COLS)).rowcount > 0: pc += 1
                if row.get("plan_id") and row.get("iacpj_nm"):
                    if conn.execute(sql_e, _mk(row, EXPERIMENT_COLS)).rowcount > 0: ec += 1
                if row.get("plan_id"):
                    if conn.execute(sql_s, _mk(row, SPLIT_COLS)).rowcount > 0: sc += 1
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, f"Database error: {e}")

    if _invalidate_search: _invalidate_search()
    if _invalidate_llm: _invalidate_llm()

    return {"message":"Process completed","details":{"projectCount":pc,"experimentCount":ec,"splitCount":sc},"totalRows":len(results)}

@router.get("/stats")
def get_stats(conn: sqlite3.Connection = Depends(get_db)):
    pc = conn.execute("SELECT COUNT(*) AS cnt FROM projects").fetchone()["cnt"]
    ec = conn.execute("SELECT COUNT(*) AS cnt FROM experiments").fetchone()["cnt"]
    sc = conn.execute("SELECT COUNT(*) AS cnt FROM split_tables").fetchone()["cnt"]
    return {"projectCount": pc, "experimentCount": ec, "splitCount": sc}

@router.post("/clear")
def clear_db(conn: sqlite3.Connection = Depends(get_db)):
    try:
        for t in ("split_tables","experiments","projects","line_lots"):
            conn.execute(f"DELETE FROM {t}")
        conn.commit()
        return {"message": "DB 초기화 완료"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, str(e))
