class TodoPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  async createTask({ title, description, dueDate }) {
    await this.page.getByLabel('Title').fill(title);
    if (description) {
      await this.page.getByLabel('Description').fill(description);
    }
    if (dueDate) {
      await this.page.getByLabel('Due date').fill(dueDate);
    }
    await this.page.getByRole('button', { name: 'Add task' }).click();
  }

  async startEditFirstTask() {
    await this.page.getByRole('button', { name: 'Edit' }).first().click();
  }

  async saveEdit({ title }) {
    await this.page.getByLabel('Title').fill(title);
    await this.page.getByRole('button', { name: 'Save task' }).click();
  }

  async toggleFirstIncompleteTask() {
    await this.page.getByRole('button', { name: 'Mark complete' }).first().click();
  }

  async deleteTask(title) {
    const taskCard = this.page.locator('.task-card').filter({ hasText: title }).first();
    await taskCard.getByRole('button', { name: 'Delete' }).click();
  }
}

module.exports = { TodoPage };
