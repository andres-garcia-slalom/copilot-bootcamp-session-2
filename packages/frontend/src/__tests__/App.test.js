import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const tasks = [
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
];

const server = setupServer(
  rest.get('/api/tasks', (req, res, ctx) => res(ctx.status(200), ctx.json(tasks))),
  rest.post('/api/tasks', (req, res, ctx) => {
    const body = req.body;

    if (!body.title || !body.title.trim()) {
      return res(ctx.status(400), ctx.json({ error: 'Task title is required' }));
    }

    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        title: body.title,
        description: body.description || '',
        dueDate: body.dueDate || null,
        completed: false,
        overdue: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    );
  }),
  rest.put('/api/tasks/:id', (req, res, ctx) => {
    const body = req.body;
    const id = Number(req.params.id);

    return res(
      ctx.status(200),
      ctx.json({
        id,
        title: body.title,
        description: body.description || '',
        dueDate: body.dueDate || null,
        completed: Boolean(body.completed),
        overdue: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      })
    );
  }),
  rest.delete('/api/tasks/:id', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ message: 'Task deleted successfully', id: Number(req.params.id) }))
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Task app', () => {
  it('loads tasks and separates incomplete/completed tasks', async () => {
    render(<App />);

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Pay rent')).toBeInTheDocument();
      expect(screen.getByText('File taxes')).toBeInTheDocument();
    });
    expect(screen.getByText(/Overdue/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Incomplete' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Completed' })).toBeInTheDocument();
  });

  it('shows inline validation when title is empty', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.queryByText('Loading data...')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(screen.getByText('Task title is required')).toBeInTheDocument();
  });

  it('creates a task', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.queryByText('Loading data...')).not.toBeInTheDocument());

    await user.type(screen.getByLabelText('Title'), 'Book travel');
    await user.type(screen.getByLabelText('Description'), 'Book flights');
    await user.type(screen.getByLabelText('Due date'), '2099-08-01');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    await waitFor(() => {
      expect(screen.getByText('Book travel')).toBeInTheDocument();
      expect(screen.getByText('Task created successfully')).toBeInTheDocument();
    });
  });

  it('edits and toggles a task completion state', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByText('Pay rent')).toBeInTheDocument());

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Pay rent updated');
    await user.click(screen.getByRole('button', { name: 'Save task' }));

    await waitFor(() => {
      expect(screen.getByText('Pay rent updated')).toBeInTheDocument();
      expect(screen.getByText('Task updated successfully')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: 'Mark complete' })[0]);
    await waitFor(() => expect(screen.getByText('Task marked complete')).toBeInTheDocument());
  });

  it('deletes a task', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByText('Pay rent')).toBeInTheDocument());

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    await waitFor(() => {
      expect(screen.queryByText('Pay rent')).not.toBeInTheDocument();
      expect(screen.getByText('Task deleted successfully')).toBeInTheDocument();
    });
  });
});
