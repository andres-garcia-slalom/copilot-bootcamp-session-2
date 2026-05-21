import React, { useState, useEffect } from 'react';
import './App.css';

function formatDueDate(dueDate) {
  if (!dueDate) {
    return 'No due date';
  }

  const parsed = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dueDate;
  }

  return parsed.toLocaleDateString();
}

function sortTasksByDueDate(taskList) {
  return [...taskList].sort((first, second) => {
    if (!first.dueDate && !second.dueDate) return 0;
    if (!first.dueDate) return 1;
    if (!second.dueDate) return -1;
    return first.dueDate.localeCompare(second.dueDate);
  });
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [titleError, setTitleError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setTasks(sortTasksByDueDate(result));
      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setEditingTaskId(null);
    setTitleError('');
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate || '');
    setTitleError('');
    setFeedback('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Task title is required');
      return;
    }

    try {
      const endpoint = editingTaskId ? `/api/tasks/${editingTaskId}` : '/api/tasks';
      const method = editingTaskId ? 'PUT' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim(),
          dueDate: dueDate || null,
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to save task');
      }

      const result = await response.json();
      if (editingTaskId) {
        setTasks(sortTasksByDueDate(tasks.map((task) => (task.id === result.id ? result : task))));
        setFeedback('Task updated successfully');
      } else {
        setTasks(sortTasksByDueDate([...tasks, result]));
        setFeedback('Task created successfully');
      }
      setError(null);
      resetForm();
    } catch (err) {
      setError('Error saving task: ' + err.message);
      console.error('Error saving task:', err);
    }
  };

  const handleToggleCompleted = async (task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          completed: !task.completed,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      setTasks(sortTasksByDueDate(tasks.map((currentTask) => (currentTask.id === task.id ? updatedTask : currentTask))));
      setFeedback(updatedTask.completed ? 'Task marked complete' : 'Task marked incomplete');
      setError(null);
    } catch (err) {
      setError('Error updating task: ' + err.message);
      console.error('Error updating task:', err);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(sortTasksByDueDate(tasks.filter((task) => task.id !== taskId)));
      if (editingTaskId === taskId) {
        resetForm();
      }
      setFeedback('Task deleted successfully');
      setError(null);
    } catch (err) {
      setError('Error deleting task: ' + err.message);
      console.error('Error deleting task:', err);
    }
  };

  const incompleteTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Task Tracker</h1>
        <p>Keep track of your tasks</p>
      </header>

      <main>
        <section className="task-form-section">
          <h2>{editingTaskId ? 'Edit task' : 'Create task'}</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) {
                  setTitleError('');
                }
              }}
              placeholder="Enter task title"
              aria-invalid={Boolean(titleError)}
            />
            {titleError && <p className="error">{titleError}</p>}

            <label htmlFor="task-description">Description</label>
            <input
              id="task-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />

            <label htmlFor="task-due-date">Due date</label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {editingTaskId ? 'Save task' : 'Add task'}
              </button>
              {editingTaskId && (
                <button type="button" className="secondary-btn" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="tasks-section">
          <h2>Tasks</h2>
          {loading && <p>Loading data...</p>}
          {error && <p className="error">{error}</p>}
          {feedback && !error && <p className="feedback">{feedback}</p>}
          {!loading && !error && (
            <>
              <div className="task-group">
                <h3>Incomplete</h3>
                {incompleteTasks.length === 0 ? (
                  <p>No incomplete tasks.</p>
                ) : (
                  <ul>
                    {incompleteTasks.map((task) => (
                      <li key={task.id} className={`task-card ${task.overdue ? 'task-overdue' : ''}`}>
                        <div className="task-content">
                          <p className="task-title">{task.title}</p>
                          {task.description && <p className="task-description">{task.description}</p>}
                          <p className="task-meta">
                            Due: <span>{formatDueDate(task.dueDate)}</span>
                            {task.overdue && <strong> · Overdue</strong>}
                          </p>
                        </div>
                        <div className="task-actions">
                          <button type="button" onClick={() => handleToggleCompleted(task)}>
                            Mark complete
                          </button>
                          <button type="button" className="secondary-btn" onClick={() => startEditing(task)}>
                            Edit
                          </button>
                          <button type="button" className="delete-btn" onClick={() => handleDelete(task.id)}>
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="task-group">
                <h3>Completed</h3>
                {completedTasks.length === 0 ? (
                  <p>No completed tasks yet.</p>
                ) : (
                  <ul>
                    {completedTasks.map((task) => (
                      <li key={task.id} className="task-card task-completed">
                        <div className="task-content">
                          <p className="task-title">{task.title}</p>
                          {task.description && <p className="task-description">{task.description}</p>}
                          <p className="task-meta">Due: <span>{formatDueDate(task.dueDate)}</span></p>
                        </div>
                        <div className="task-actions">
                          <button type="button" onClick={() => handleToggleCompleted(task)}>
                            Mark incomplete
                          </button>
                          <button type="button" className="delete-btn" onClick={() => handleDelete(task.id)}>
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
