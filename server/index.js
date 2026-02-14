const express = require("express");
const cors = require("cors");
const { initDB, seedData } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database
initDB();
seedData();

// Routes
app.use("/api/projects", require("./routes/projects"));
app.use("/api/experiments", require("./routes/experiments"));
app.use("/api/splits", require("./routes/splits"));
app.use("/api/search", require("./routes/search"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/line-lots", require("./routes/lineLots"));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
