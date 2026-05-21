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

  getTaskGroup(groupName) {
    return this.page
      .locator('.task-group')
      .filter({ has: this.page.getByRole('heading', { name: groupName }) })
      .first();
  }

  getTaskCard(groupName, title) {
    return this.getTaskGroup(groupName).locator('.task-card').filter({ hasText: title }).first();
  }

  async toggleTaskComplete(title) {
    await this.getTaskCard('Incomplete', title).getByRole('button', { name: 'Mark complete' }).click();
  }

  async clickAddTask() {
    await this.page.getByRole('button', { name: 'Add task' }).click();
  }

  async deleteTask(title) {
    const taskCard = this.page.locator('.task-card').filter({ hasText: title }).first();
    await taskCard.getByRole('button', { name: 'Delete' }).click();
  }
}

module.exports = { TodoPage };
