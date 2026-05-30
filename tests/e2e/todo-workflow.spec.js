const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/todo-page');

test.describe('TODO critical workflows', () => {
  test('user can create, edit, and move a task from Incomplete to Completed', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const taskTitle = `E2E Move ${Date.now()}`;
    const updatedTaskTitle = `${taskTitle} Updated`;

    await todoPage.goto();
    await expect(page.getByRole('heading', { name: 'Task Tracker' })).toBeVisible();

    await todoPage.createTask({
      title: taskTitle,
      description: 'Created by Playwright',
      dueDate: '2099-01-01',
    });

    await expect(todoPage.getTaskCard('Incomplete', taskTitle)).toBeVisible();
    await expect(page.getByText('Task created successfully')).toBeVisible();

    await todoPage.startEditFirstTask();
    await todoPage.saveEdit({ title: updatedTaskTitle });
    await expect(todoPage.getTaskCard('Incomplete', updatedTaskTitle)).toBeVisible();

    await todoPage.toggleTaskComplete(updatedTaskTitle);
    await expect(page.getByText('Task marked complete')).toBeVisible();
    await expect(todoPage.getTaskCard('Incomplete', updatedTaskTitle)).toHaveCount(0);
    await expect(todoPage.getTaskCard('Completed', updatedTaskTitle)).toBeVisible();

    await todoPage.deleteTask(updatedTaskTitle);
    await expect(page.getByText('Task deleted successfully')).toBeVisible();
  });

  test('deleting a task persists after page refresh', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const taskTitle = `E2E Delete Refresh ${Date.now()}`;

    await todoPage.goto();
    await todoPage.createTask({
      title: taskTitle,
      description: 'Will be deleted',
      dueDate: '2099-02-01',
    });
    await expect(todoPage.getTaskCard('Incomplete', taskTitle)).toBeVisible();

    await todoPage.deleteTask(taskTitle);
    await expect(page.getByText('Task deleted successfully')).toBeVisible();
    await expect(page.locator('.task-card').filter({ hasText: taskTitle })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Task Tracker' })).toBeVisible();
    await expect(page.locator('.task-card').filter({ hasText: taskTitle })).toHaveCount(0);
  });

  test('shows validation message when title is empty', async ({ page }) => {
    const todoPage = new TodoPage(page);

    await todoPage.goto();
    await expect(page.getByRole('heading', { name: 'Incomplete' })).toBeVisible();
    const initialTaskCount = await page.locator('.task-card').count();
    await todoPage.clickAddTask();

    await expect(page.getByText('Task title is required')).toBeVisible();
    await expect(page.locator('.task-card')).toHaveCount(initialTaskCount);
  });

  test('shows overdue status for a past-due task', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const taskTitle = `E2E Overdue ${Date.now()}`;

    await todoPage.goto();
    await todoPage.createTask({
      title: taskTitle,
      description: 'Past due task',
      dueDate: '2001-01-01',
    });

    const taskCard = todoPage.getTaskCard('Incomplete', taskTitle);
    await expect(taskCard).toBeVisible();
    await expect(taskCard.locator('strong').filter({ hasText: 'Overdue' })).toBeVisible();

    await todoPage.deleteTask(taskTitle);
    await expect(page.getByText('Task deleted successfully')).toBeVisible();
  });
});
