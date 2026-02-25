"""
/api/line-lots — exact port of server/routes/lineLots.js
"""
import sqlite3
from fastapi import APIRouter, Depends
from ..database import get_db, dict_rows

router = APIRouter(prefix="/api/line-lots", tags=["line-lots"])


@router.get("/")
def available_lots(conn: sqlite3.Connection = Depends(get_db)):
    rows = conn.execute(
        "SELECT * FROM line_lots WHERE status = 'available' ORDER BY estimated_arrival ASC"
    ).fetchall()
    return dict_rows(rows)


@router.get("/all")
def all_lots(conn: sqlite3.Connection = Depends(get_db)):
    rows = conn.execute("SELECT * FROM line_lots ORDER BY lot_id").fetchall()
    return dict_rows(rows)
