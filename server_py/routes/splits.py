"""
/api/splits — exact port of server/routes/splits.js
"""
import sqlite3
from fastapi import APIRouter, Depends, HTTPException, Query
from ..database import get_db, dict_rows

router = APIRouter(prefix="/api/splits", tags=["splits"])

# Will be set from main.py
_invalidate_index = None

def set_invalidate_index(fn):
    global _invalidate_index
    _invalidate_index = fn

SPLIT_COLS = [
    "sno", "plan_id", "fac_id", "oper_id", "oper_nm", "eps_lot_gbn_cd", "work_cond_desc",
    "eqp_id", "recipe_id",
    *[f"user_def_val_{i}" for i in range(1, 26)],
    "note",
]


@router.get("/")
def list_splits(
    plan_id: str | None = Query(None),
    conn: sqlite3.Connection = Depends(get_db),
):
    if plan_id:
        rows = conn.execute(
            "SELECT * FROM split_tables WHERE plan_id = ?", (plan_id,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM split_tables").fetchall()
    return dict_rows(rows)


@router.put("/{plan_id}")
def replace_splits(plan_id: str, body: dict, conn: sqlite3.Connection = Depends(get_db)):
    splits = body.get("splits")
    if not splits or not isinstance(splits, list):
        raise HTTPException(status_code=400, detail="splits array required")

    col_names = ", ".join(SPLIT_COLS)
    placeholders = ", ".join(f":{c}" for c in SPLIT_COLS)

    try:
        conn.execute("DELETE FROM split_tables WHERE plan_id = ?", (plan_id,))
        for row in splits:
            params = {c: row.get(c) or None for c in SPLIT_COLS}
            params["plan_id"] = plan_id
            conn.execute(
                f"INSERT INTO split_tables ({col_names}) VALUES ({placeholders})", params
            )
        conn.commit()

        if _invalidate_index:
            _invalidate_index()

        return {"count": len(splits)}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Split 저장 중 오류 발생: {e}")
