import { UIComponent } from './UIComponent.js';
import { ToDoWidget } from './ToDoWidget.js';
import { QuoteWidget } from './QuoteWidget.js';
import { BookSearchWidget } from './BookSearchWidget.js';
import { BookOfDayWidget } from './BookOfDayWidget.js';
const WIDGET_REGISTRY = {
  todo:        (cfg) => new ToDoWidget(cfg),
  quote:       (cfg) => new QuoteWidget(cfg),
  bookSearch:  (cfg) => new BookSearchWidget(cfg),
  bookOfDay:   (cfg) => new BookOfDayWidget(cfg),
};

export class Dashboard {
  #widgets = [];          
  #container;

  constructor(containerSelector) {
    this.#container = document.querySelector(containerSelector);
    if (!this.#container) throw new Error('Контейнер Dashboard не найден');

    this.#container.addEventListener('widget:close', (e) => {
      this.removeWidget(e.detail.id);

        // Кнопочное перемещение (↑ / ↓)
    this.#container.addEventListener('widget:move', (e) => {
      this.moveWidget(e.detail.id, e.detail.direction);
    });

    // Drag-and-drop: drop на контейнере
    this.#container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const dragging = this.#container.querySelector('.widget--dragging');
      if (!dragging) return;

      const after = this.#getDragAfterElement(e.clientY);
      if (after == null) {
        this.#container.appendChild(dragging);
      } else {
        this.#container.insertBefore(dragging, after);
      }
    });

    this.#container.addEventListener('drop', (e) => {
      e.preventDefault();
      this.#syncOrderFromDom();
    });

    });
  }

  addWidget(type) {
    const factory = WIDGET_REGISTRY[type];
    if (!factory) {
      console.warn(`Неизвестный тип виджета: ${type}`);
      return null;
    }
    const widget = factory();
    this.#widgets.push(widget);
    this.#container.appendChild(widget.render());
    return widget;
  }

  removeWidget(widgetId) {
    const widget = this.#widgets.find((w) => w.id === widgetId);
    if (!widget) return;
    widget.destroy();
    this.#widgets = this.#widgets.filter((w) => w.id !== widgetId);
  }

  moveWidget(widgetId, direction) {
    const index = this.#widgets.findIndex((w) => w.id === widgetId);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.#widgets.length) return;

    const [widget] = this.#widgets.splice(index, 1);
    this.#widgets.splice(newIndex, 0, widget);

    this.#widgets.forEach((w) => this.#container.appendChild(w.element));
  }

  #getDragAfterElement(y) {
    const elements = [
      ...this.#container.querySelectorAll('.widget:not(.widget--dragging)'),
    ];
    return elements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        }
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null }
    ).element;
  }

  #syncOrderFromDom() {
    const domIds = [...this.#container.children].map((el) => el.dataset.widgetId);
    this.#widgets.sort((a, b) => domIds.indexOf(a.id) - domIds.indexOf(b.id));
  }
  
  clear() {
    this.#widgets.forEach((w) => w.destroy());
    this.#widgets = [];
  }

  get count() {
    return this.#widgets.length;
  }
}