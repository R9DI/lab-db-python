const express = require("express");
const { db } = require("../db");
const router = express.Router();

// 라인에 있는 자재 목록 (available만, 예상 도달 시점 순 정렬)
router.get("/", (req, res) => {
  const lots = db
    .prepare(
      "SELECT * FROM line_lots WHERE status = 'available' ORDER BY estimated_arrival ASC",
    )
    .all();
  res.json(lots);
});

// 전체 자재 목록 (상태 무관)
router.get("/all", (req, res) => {
  const lots = db.prepare("SELECT * FROM line_lots ORDER BY lot_id").all();
  res.json(lots);
});

module.exports = router;
