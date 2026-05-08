const express = require("express");

const app = express();

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("WORKING");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "WORKING HEALTH",
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on ${PORT}`);
});
