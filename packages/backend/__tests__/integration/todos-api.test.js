const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../../src/app');
const { createDatabase } = require('../../src/db');

describe('Tasks API integration', () => {
  let db;
  let app;

  beforeEach(() => {
    db = createDatabase(':memory:');
    app = createApp(db);
  });

  afterEach(() => {
    db.close();
  });

  const createTask = async (overrides = {}) => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Test Task',
        description: 'Task description',
        dueDate: '2099-01-01',
        ...overrides,
      });

    return response;
  };

  it('creates a task with required and optional fields', async () => {
    const response = await createTask();

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: 'Test Task',
      description: 'Task description',
      completed: false,
      dueDate: '2099-01-01',
      overdue: false,
    });
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
  });

  it('rejects empty task title', async () => {
    const response = await createTask({ title: '   ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Task title is required' });
  });

  it('rejects invalid due dates when creating a task', async () => {
    const response = await createTask({ dueDate: 'not-a-real-date' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Due date must be a valid date' });
  });

  it('lists tasks sorted by due date with undated tasks last', async () => {
    await createTask({ title: 'No due date', dueDate: null });
    await createTask({ title: 'Later', dueDate: '2099-03-01' });
    await createTask({ title: 'Sooner', dueDate: '2099-02-01' });

    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(200);
    expect(response.body.map((task) => task.title)).toEqual([
      'Sooner',
      'Later',
      'No due date',
    ]);
  });

  it('updates task details and completion state', async () => {
    const createResponse = await createTask({ title: 'Original', completed: false });
    const taskId = createResponse.body.id;

    const updateResponse = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({
        title: 'Updated',
        description: 'Updated description',
        dueDate: '2099-04-20',
        completed: true,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toMatchObject({
      id: taskId,
      title: 'Updated',
      description: 'Updated description',
      dueDate: '2099-04-20',
      completed: true,
      overdue: false,
    });
  });

  it('rejects invalid due dates when updating a task', async () => {
    const createResponse = await createTask({ title: 'Needs update' });
    const taskId = createResponse.body.id;

    const updateResponse = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({
        dueDate: 'invalid-date',
      });

    expect(updateResponse.status).toBe(400);
    expect(updateResponse.body).toEqual({ error: 'Due date must be a valid date' });
  });

  it('supports marking tasks incomplete after completion', async () => {
    const createResponse = await createTask({ completed: true });
    const taskId = createResponse.body.id;

    await request(app).put(`/api/tasks/${taskId}`).send({ completed: true });
    const updateResponse = await request(app).put(`/api/tasks/${taskId}`).send({ completed: false });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.completed).toBe(false);
  });

  it('returns overdue true for incomplete tasks with past due date', async () => {
    const response = await createTask({ dueDate: '2001-01-01' });

    expect(response.status).toBe(201);
    expect(response.body.overdue).toBe(true);

    await request(app).put(`/api/tasks/${response.body.id}`).send({ completed: true });
    const listResponse = await request(app).get('/api/tasks');
    expect(listResponse.body[0].overdue).toBe(false);
  });

  it('deletes a task', async () => {
    const createResponse = await createTask();
    const taskId = createResponse.body.id;

    const deleteResponse = await request(app).delete(`/api/tasks/${taskId}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ message: 'Task deleted successfully', id: taskId });

    const secondDelete = await request(app).delete(`/api/tasks/${taskId}`);
    expect(secondDelete.status).toBe(404);
    expect(secondDelete.body).toEqual({ error: 'Task not found' });
  });

  it('returns 400 for invalid IDs and 404 for missing tasks', async () => {
    const invalidUpdate = await request(app).put('/api/tasks/nope').send({ title: 'Updated' });
    expect(invalidUpdate.status).toBe(400);
    expect(invalidUpdate.body).toEqual({ error: 'Valid task ID is required' });

    const missingUpdate = await request(app).put('/api/tasks/999').send({ title: 'Updated' });
    expect(missingUpdate.status).toBe(404);
    expect(missingUpdate.body).toEqual({ error: 'Task not found' });

    const invalidDelete = await request(app).delete('/api/tasks/nope');
    expect(invalidDelete.status).toBe(400);
    expect(invalidDelete.body).toEqual({ error: 'Valid task ID is required' });
  });

  it('enforces API rate limits', async () => {
    let lastResponse;
    for (let attempt = 0; attempt < 301; attempt += 1) {
      lastResponse = await request(app).get('/api/tasks');
    }

    expect(lastResponse.status).toBe(429);
  });

  it('persists task data when re-opening the same database file', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasks-db-'));
    const dbPath = path.join(tempDir, 'tasks.db');

    try {
      const firstDb = createDatabase(dbPath);
      const firstApp = createApp(firstDb);
      const createResponse = await request(firstApp)
        .post('/api/tasks')
        .send({ title: 'Persist me', dueDate: '2099-01-01' });
      firstDb.close();

      const secondDb = createDatabase(dbPath);
      const secondApp = createApp(secondDb);
      const listResponse = await request(secondApp).get('/api/tasks');
      secondDb.close();

      expect(createResponse.status).toBe(201);
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.some((task) => task.title === 'Persist me')).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
