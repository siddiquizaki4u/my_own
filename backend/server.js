

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

// Middleware: app initialize hone ke baad
app.use(cors({
  origin: "http://localhost:8080"
}));

app.use(express.json());

// PostgreSQL connection
const db = new Pool({
  host: process.env.DB_HOST || "todo-db",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "todo_db",
  user: process.env.DB_USER || "Zaki_user",
  password: process.env.DB_PASSWORD
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error("Database connection error:", error.message);
    res.status(503).json({
      error: "Database unavailable"
    });
  }
});

// Get all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM tasks ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not fetch tasks" });
  }
});

// Create a task
app.post("/api/tasks", async (req, res) => {
  const title = String(req.body.title || "").trim();

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const result = await db.query(
      "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create task" });
  }
});

// Update task completion status
app.patch("/api/tasks/:id", async (req, res) => {
  if (typeof req.body.completed !== "boolean") {
    return res.status(400).json({
      error: "completed must be true or false"
    });
  }

  try {
    const result = await db.query(
      `UPDATE tasks
       SET completed = $1
       WHERE id = $2
       RETURNING *`,
      [req.body.completed, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not update task" });
  }
});

// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({
      deleted: true,
      id: result.rows[0].id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not delete task" });
  }
});

// Start server
const port = Number(process.env.PORT || 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Todo API listening on port ${port}`);
});

