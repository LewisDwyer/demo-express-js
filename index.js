const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const port = process.env.PORT || 3000;
const app = express();

app.use(express.static('static'));
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize the items table on startup
pool.query(`
  CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).then(() => console.log("Items table ready"))
  .catch(err => console.error("DB init error:", err.message));

// List items
app.get("/api/items", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM items ORDER BY id");
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add an item
app.post("/api/items", async (req, res) => {
  try {
    const { title } = req.body;
    const result = await pool.query(
      "INSERT INTO items (title) VALUES ($1) RETURNING *",
      [title]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/data", (req, res) => {
  res.status(200).json({
    data: [
      { id: 1, title: "Some data" },
      { id: 2, title: "Some other data" },
    ],
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get("/index", (req, res) => {
  res.redirect("/");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(port, () => console.log(`Listening on ${port}`));
