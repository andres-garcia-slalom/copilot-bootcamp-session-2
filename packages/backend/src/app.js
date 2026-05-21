const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createDatabase, mapTaskRow, toIsoDate } = require('./db');

function parseTaskId(rawId) {
  const id = Number.parseInt(rawId, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateTitle(title) {
  return typeof title === 'string' && title.trim().length > 0;
}

function createApp(db, options = {}) {
  const app = express();
  const rateLimitConfig = options.rateLimit || {};

  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));
  app.use(
    '/api',
    rateLimit({
      windowMs: rateLimitConfig.windowMs || 15 * 60 * 1000,
      limit: rateLimitConfig.limit || 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend server is running' });
  });

  app.get('/api/tasks', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT * FROM tasks
        ORDER BY
          CASE WHEN due_date IS NULL THEN 1 ELSE 0 END ASC,
          due_date ASC,
          created_at DESC
      `).all();

      res.json(rows.map(mapTaskRow));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.post('/api/tasks', (req, res) => {
    try {
      const { title, description = '', dueDate } = req.body;

      if (!validateTitle(title)) {
        return res.status(400).json({ error: 'Task title is required' });
      }

      const normalizedDueDate = toIsoDate(dueDate);
      if (dueDate && !normalizedDueDate) {
        return res.status(400).json({ error: 'Due date must be a valid date' });
      }

      const result = db.prepare(`
        INSERT INTO tasks (title, description, due_date)
        VALUES (?, ?, ?)
      `).run(title.trim(), description || '', normalizedDueDate);

      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(mapTaskRow(task));
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  app.put('/api/tasks/:id', (req, res) => {
    try {
      const id = parseTaskId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Valid task ID is required' });
      }

      const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const {
        title = existingTask.title,
        description = existingTask.description || '',
        dueDate = existingTask.due_date,
        completed = Boolean(existingTask.completed),
      } = req.body;

      if (!validateTitle(title)) {
        return res.status(400).json({ error: 'Task title is required' });
      }

      const normalizedDueDate = toIsoDate(dueDate);
      if (dueDate && !normalizedDueDate) {
        return res.status(400).json({ error: 'Due date must be a valid date' });
      }

      db.prepare(`
        UPDATE tasks
        SET title = ?, description = ?, due_date = ?, completed = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title.trim(),
        description || '',
        normalizedDueDate,
        completed ? 1 : 0,
        id
      );

      const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      res.json(mapTaskRow(updatedTask));
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  app.delete('/api/tasks/:id', (req, res) => {
    try {
      const id = parseTaskId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Valid task ID is required' });
      }

      const existingTask = db.prepare('SELECT id FROM tasks WHERE id = ?').get(id);
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
      res.json({ message: 'Task deleted successfully', id });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  return app;
}

const db = createDatabase();
const app = createApp(db);

module.exports = { app, db, createApp };
