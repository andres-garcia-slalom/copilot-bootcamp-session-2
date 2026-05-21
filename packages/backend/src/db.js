const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'tasks.db');

function ensureDirectoryForDatabase(dbPath) {
  if (dbPath === ':memory:') {
    return;
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

function createDatabase(dbPath = process.env.DB_PATH || DEFAULT_DB_PATH) {
  ensureDirectoryForDatabase(dbPath);

  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

function toIsoDate(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function isTaskOverdue(row) {
  if (!row.due_date || row.completed) {
    return false;
  }

  const now = new Date();
  const dueDate = new Date(`${row.due_date}T23:59:59.999`);
  return dueDate < now;
}

function mapTaskRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    completed: Boolean(row.completed),
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    overdue: isTaskOverdue(row),
  };
}

module.exports = {
  createDatabase,
  mapTaskRow,
  toIsoDate,
};
