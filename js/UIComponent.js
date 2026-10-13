export class UIComponent {
  /**
   * @param {{ id?: string, title: string }} config
   */
  constructor({ id, title } = {}) {
    if (new.target === UIComponent) {
      throw new TypeError('UIComponent — абстрактный класс, нельзя создать напрямую');
    }
    this.id = id ?? `widget-${crypto.randomUUID()}`;
    this.title = title ?? 'Без названия';
    this.element = null;         
    this._listeners = [];         
    this._isMinimized = false;
  }

  render() {
    const root = document.createElement('section');
    root.className = 'widget';
    root.dataset.widgetId = this.id;

    root.innerHTML = `
      <header class="widget__header" draggable="true">
        <h2 class="widget__title">${this._escape(this.title)}</h2>
        <div class="widget__actions">
          <button class="widget__btn" data-action="up" aria-label="Переместить вверх">↑</button>
          <button class="widget__btn" data-action="down" aria-label="Переместить вниз">↓</button>
          <button class="widget__btn" data-action="minimize" aria-label="Свернуть">–</button>
          <button class="widget__btn" data-action="close" aria-label="Закрыть">×</button>
        </div>
      </header>
      <div class="widget__body"></div>
    `;

    const body = root.querySelector('.widget__body');
    body.appendChild(this._buildContent());

    this._bind(root, '[data-action="minimize"]', 'click', () => this.minimize());
    this._bind(root, '[data-action="close"]', 'click', () => this.close());
    this._bind(root, '[data-action="up"]', 'click', () => {
      this.element?.dispatchEvent(
        new CustomEvent('widget:move', {
          bubbles: true,
          detail: { id: this.id, direction: -1 },
        })
      );
    });

    this._bind(root, '[data-action="down"]', 'click', () => {
      this.element?.dispatchEvent(
        new CustomEvent('widget:move', {
          bubbles: true,
          detail: { id: this.id, direction: 1 },
        })
      );
    });

    this._setupDragEvents(root);

    this.element = root;
    return root;
  }

  _setupDragEvents(root) {
    const header = root.querySelector('.widget__header');
    if (!header) return;

    header.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', this.id);
      e.dataTransfer.effectAllowed = 'move';
      root.classList.add('widget--dragging');
    });

    header.addEventListener('dragend', () => {
      root.classList.remove('widget--dragging');
    });
  }

  _buildContent() {
    throw new Error('_buildContent() должен быть реализован в наследнике');
  }

  minimize() {
    this._isMinimized = !this._isMinimized;
    this.element?.classList.toggle('widget--minimized', this._isMinimized);
  }

  close() {
    this.element?.dispatchEvent(
      new CustomEvent('widget:close', { bubbles: true, detail: { id: this.id } })
    );
  }

  destroy() {
    this._listeners.forEach(({ target, type, handler }) =>
      target.removeEventListener(type, handler)
    );
    this._listeners = [];
    this.element?.remove();
    this.element = null;
  }

  _bind(target, selector, type, handler) {
    const el = typeof selector === 'string' ? target.querySelector(selector) : selector;
    if (!el) return;
    el.addEventListener(type, handler);
    this._listeners.push({ target: el, type, handler });
  }

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }
}