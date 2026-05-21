const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/todo-page');

test.describe('TODO critical workflows', () => {
  test('user can create, edit, complete, and delete a task', async ({ page }) => {
    const todoPage = new TodoPage(page);

    await todoPage.goto();
    await expect(page.getByRole('heading', { name: 'Task Tracker' })).toBeVisible();

    await todoPage.createTask({
      title: 'E2E Task',
      description: 'Created by Playwright',
      dueDate: '2099-01-01',
    });

    await expect(page.getByText('E2E Task')).toBeVisible();
    await expect(page.getByText('Task created successfully')).toBeVisible();

    await todoPage.startEditFirstTask();
    await todoPage.saveEdit({ title: 'E2E Task Updated' });
    await expect(page.getByText('E2E Task Updated')).toBeVisible();

    await todoPage.toggleFirstIncompleteTask();
    await expect(page.getByText('Task marked complete')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Completed' })).toBeVisible();

    await todoPage.deleteTask('E2E Task Updated');
    await expect(page.getByText('Task deleted successfully')).toBeVisible();
  });
});
