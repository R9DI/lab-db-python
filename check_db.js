const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "server/lab_test1.db");
console.log("Checking DB at:", dbPath);
const db = new DatabaseSync(dbPath);

const projectCount = db.prepare("SELECT COUNT(*) as cnt FROM projects").get();
console.log("Projects count:", projectCount.cnt);

const experimentCount = db
  .prepare("SELECT COUNT(*) as cnt FROM experiments")
  .get();
console.log("Experiments count:", experimentCount.cnt);
