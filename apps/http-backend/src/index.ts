import express from "express";
const app = express();
const PORT = Number(process.env.HTTP_PORT) || 3001;
app.get("/", (req, res) => {
  res.json({ msg: "Hello From HTTP Server" });
});
app.get("/signup", (req, res) => {});
app.get("/signin", (req, res) => {});
app.get("/createRoom", (req, res) => {});
app.listen(PORT, () =>
  console.log(`HTTP Server Runnning at http://localhost:${PORT}`)
);
