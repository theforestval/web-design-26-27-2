import { UIComponent } from './UIComponent.js';

export class ToDoWidget extends UIComponent {
  #tasks = [];              

  constructor(config = {}) {
    super({ title: config.title ?? '📖 К прочтению', ...config });
  }

  _buildContent() {
    const wrap = document.createElement('div');
    wrap.className = 'todo';

    wrap.innerHTML = `
      <form class="todo__form">
        <input class="todo__input" type="text" placeholder="Название книги…" aria-label="Новая книга" />
        <button class="todo__add" type="submit">Добавить</button>
      </form>
      <ul class="todo__list" role="list"></ul>
    `;

    const form = wrap.querySelector('.todo__form');
    const input = wrap.querySelector('.todo__input');
    const list = wrap.querySelector('.todo__list');

    this._bind(form, form, 'submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      this.#addTask(text);
      input.value = '';
      input.focus();
    });

    this._bind(list, list, 'click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      const taskId = li.dataset.taskId;

      if (e.target.matches('[data-action="toggle"]')) this.#toggleTask(taskId);
      if (e.target.matches('[data-action="remove"]')) this.#removeTask(taskId);
    });

    this._listRef = list;
    this.#renderTasks();
    return wrap;
  }

  #addTask(text) {
    this.#tasks.push({ id: crypto.randomUUID(), text, done: false });
    this.#renderTasks();
  }

  #removeTask(id) {
    this.#tasks = this.#tasks.filter((t) => t.id !== id);
    this.#renderTasks();
  }

  #toggleTask(id) {
    const task = this.#tasks.find((t) => t.id === id);
    if (task) task.done = !task.done;
    this.#renderTasks();
  }

  #renderTasks() {
    if (!this._listRef) return;
    if (this.#tasks.length === 0) {
      this._listRef.innerHTML = '<li class="todo__empty">Список пуст. Добавьте первую книгу.</li>';
      return;
    }
    this._listRef.innerHTML = '';
    for (const task of this.#tasks) {
      const li = document.createElement('li');
      li.className = `todo__item${task.done ? ' todo__item--done' : ''}`;
      li.dataset.taskId = task.id;

      const label = document.createElement('span');
      label.className = 'todo__text';
      label.textContent = task.text;   

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.dataset.action = 'toggle';
      toggle.className = 'todo__toggle';
      toggle.textContent = task.done ? '↺' : '✓';
      toggle.setAttribute('aria-label', task.done ? 'Вернуть в работу' : 'Отметить прочитанной');

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.dataset.action = 'remove';
      remove.className = 'todo__remove';
      remove.textContent = '🗑';
      remove.setAttribute('aria-label', 'Удалить');

      li.append(toggle, label, remove);
      this._listRef.appendChild(li);
    }
  }
}