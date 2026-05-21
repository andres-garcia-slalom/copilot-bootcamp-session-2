import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

function createInitialTasks() {
  return [
    {
      id: 1,
      title: 'Pay rent',
      description: 'Do this today',
      completed: false,
      dueDate: '2001-01-01',
      overdue: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      title: 'File taxes',
      description: '',
      completed: true,
      dueDate: '2099-12-01',
      overdue: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 3,
      title: 'Plan vacation',
      description: '',
      completed: false,
      dueDate: null,
      overdue: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];
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

function isOverdue(dueDate, completed) {
  if (!dueDate || completed) {
    return false;
  }

  const now = new Date();
  const due = new Date(`${dueDate}T23:59:59.999`);
  return due < now;
}

let mockTasks = [];
let nextId = 1;

const server = setupServer(
  rest.get('/api/tasks', (req, res, ctx) => res(ctx.status(200), ctx.json(mockTasks))),
  rest.post('/api/tasks', (req, res, ctx) => {
    const body = req.body;
    const normalizedDueDate = toIsoDate(body.dueDate);

    if (!body.title || !body.title.trim()) {
      return res(ctx.status(400), ctx.json({ error: 'Task title is required' }));
    }

    if (body.dueDate && !normalizedDueDate) {
      return res(ctx.status(400), ctx.json({ error: 'Due date must be a valid date' }));
    }

    const createdTask = {
      id: nextId++,
      title: body.title.trim(),
      description: body.description || '',
      dueDate: normalizedDueDate,
      completed: false,
      overdue: isOverdue(normalizedDueDate, false),
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };

    mockTasks = [...mockTasks, createdTask];
    return res(ctx.status(201), ctx.json(createdTask));
  }),
  rest.put('/api/tasks/:id', (req, res, ctx) => {
    const body = req.body;
    const id = Number(req.params.id);
    const taskIndex = mockTasks.findIndex((task) => task.id === id);
    if (taskIndex === -1) {
      return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    }

    const existingTask = mockTasks[taskIndex];
    const title = body.title ?? existingTask.title;
    if (!title || !title.trim()) {
      return res(ctx.status(400), ctx.json({ error: 'Task title is required' }));
    }

    const dueDateInput = body.dueDate === undefined ? existingTask.dueDate : body.dueDate;
    const normalizedDueDate = toIsoDate(dueDateInput);
    if (dueDateInput && !normalizedDueDate) {
      return res(ctx.status(400), ctx.json({ error: 'Due date must be a valid date' }));
    }

    const updatedTask = {
      ...existingTask,
      title: title.trim(),
      description: body.description ?? existingTask.description,
      dueDate: normalizedDueDate,
      completed: body.completed === undefined ? existingTask.completed : Boolean(body.completed),
      updatedAt: '2026-01-03T00:00:00.000Z',
    };
    updatedTask.overdue = isOverdue(updatedTask.dueDate, updatedTask.completed);

    mockTasks = mockTasks.map((task) => (task.id === id ? updatedTask : task));
    return res(ctx.status(200), ctx.json(updatedTask));
  }),
  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    const id = Number(req.params.id);
    const existingTask = mockTasks.find((task) => task.id === id);
    if (!existingTask) {
      return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    }

    mockTasks = mockTasks.filter((task) => task.id !== id);
    return res(ctx.status(200), ctx.json({ message: 'Task deleted successfully', id }));
  })
);

beforeAll(() => server.listen());
beforeEach(() => {
  mockTasks = createInitialTasks();
  nextId = 4;
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function getTaskGroup(groupName) {
  const groupHeading = screen.getByRole('heading', { name: groupName });
  return groupHeading.closest('.task-group');
}

describe('Task app', () => {
  it('renders tasks in the correct section with due date metadata', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByText('Pay rent')).toBeInTheDocument());

    const incompleteGroup = getTaskGroup('Incomplete');
    const completedGroup = getTaskGroup('Completed');

    expect(incompleteGroup).not.toBeNull();
    expect(completedGroup).not.toBeNull();

    expect(within(incompleteGroup).getByText('Pay rent')).toBeInTheDocument();
    expect(within(completedGroup).queryByText('Pay rent')).not.toBeInTheDocument();

    expect(within(completedGroup).getByText('File taxes')).toBeInTheDocument();
    expect(within(incompleteGroup).queryByText('File taxes')).not.toBeInTheDocument();

    expect(within(incompleteGroup).getByText('No due date')).toBeInTheDocument();

    const formattedDate = new Date('2099-12-01T00:00:00').toLocaleDateString();
    expect(within(completedGroup).getByText(formattedDate)).toBeInTheDocument();
    expect(within(incompleteGroup).getByText(/Overdue/i)).toBeInTheDocument();
  });

  it('shows an error when loading tasks fails', async () => {
    server.use(rest.get('/api/tasks', (req, res, ctx) => res(ctx.status(500))));
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch data: Network response was not ok')).toBeInTheDocument();
    });
  });

  it('shows inline validation when title is empty', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.queryByText('Loading data...')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(screen.getByText('Task title is required')).toBeInTheDocument();
  });

  it('shows an error when creating a task fails', async () => {
    const user = userEvent.setup();
    server.use(
      rest.post('/api/tasks', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'Failed to create task' }))
      )
    );
    render(<App />);

    await waitFor(() => expect(screen.queryByText('Loading data...')).not.toBeInTheDocument());

    await user.type(screen.getByLabelText('Title'), 'Book travel');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    await waitFor(() => {
      expect(screen.getByText('Error saving task: Failed to create task')).toBeInTheDocument();
      expect(screen.queryByText('Book travel')).not.toBeInTheDocument();
    });
  });

  it('shows an error when updating a task fails', async () => {
    const user = userEvent.setup();
    server.use(
      rest.put('/api/tasks/:id', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'Failed to update task' }))
      )
    );
    render(<App />);

    await waitFor(() => expect(screen.getByText('Pay rent')).toBeInTheDocument());

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Pay rent updated');
    await user.click(screen.getByRole('button', { name: 'Save task' }));

    await waitFor(() => {
      expect(screen.getByText('Error saving task: Failed to update task')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save task' })).toBeInTheDocument();
    });

    expect(mockTasks.find((task) => task.id === 1).title).toBe('Pay rent');
  });

  it('cancels edit and resets the form state', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByText('Pay rent')).toBeInTheDocument());

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Draft title');
    await user.type(screen.getByLabelText('Description'), 'Draft description');
    await user.click(screen.getByRole('button', { name: 'Cancel edit' }));

    expect(screen.getByRole('heading', { name: 'Create task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add task' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save task' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Description')).toHaveValue('');
    expect(screen.getByLabelText('Due date')).toHaveValue('');
  });

  it('shows an error when deleting a task fails', async () => {
    const user = userEvent.setup();
    server.use(
      rest.delete('/api/tasks/:id', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'Failed to delete task' }))
      )
    );
    render(<App />);

    await waitFor(() => expect(screen.getByText('Pay rent')).toBeInTheDocument());
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    await waitFor(() => {
      expect(screen.getByText('Error deleting task: Failed to delete task')).toBeInTheDocument();
    });

    expect(mockTasks.some((task) => task.title === 'Pay rent')).toBe(true);
  });
});
