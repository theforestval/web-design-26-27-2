import { UIComponent } from './UIComponent.js';
const SUBJECTS = ['science_fiction', 'fantasy', 'classics', 'mystery_and_detective_stories'];
const SUBJECTS_URL = (subject) =>
  `https://openlibrary.org/subjects/${subject}.json?limit=50`;

export class BookOfDayWidget extends UIComponent {
  #abortController = null;
  #state = 'idle';

  constructor(config = {}) {
    super({ title: config.title ?? '🎲 Книга дня', ...config });
  }

  _buildContent() {
    const wrap = document.createElement('div');
    wrap.className = 'book-of-day';

    wrap.innerHTML = `
      <div class="book-of-day__status" role="status" aria-live="polite"></div>
      <article class="book-of-day__card" hidden>
        <img class="book-of-day__cover" alt="" />
        <h3 class="book-of-day__title"></h3>
        <p class="book-of-day__authors"></p>
        <p class="book-of-day__meta"></p>
      </article>
      <button class="book-of-day__refresh" type="button">Другая книга</button>
    `;

    const refresh = wrap.querySelector('.book-of-day__refresh');
    this._bind(refresh, refresh, 'click', () => this.#load());

    this._card = wrap.querySelector('.book-of-day__card');
    this._cover = wrap.querySelector('.book-of-day__cover');
    this._titleEl = wrap.querySelector('.book-of-day__title');
    this._authorsEl = wrap.querySelector('.book-of-day__authors');
    this._metaEl = wrap.querySelector('.book-of-day__meta');
    this._statusEl = wrap.querySelector('.book-of-day__status');

    queueMicrotask(() => this.#load());

    return wrap;
  }

  async #load() {
    this.#abortController?.abort();
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    this.#setState('loading');
    this._card.hidden = true;

    const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];

    try {
      const res = await fetch(SUBJECTS_URL(subject), { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const works = Array.isArray(data.works) ? data.works : [];
      if (works.length === 0) {
        this.#setState('empty', 'Пустая подборка. Попробуйте ещё раз.');
        return;
      }

      const work = works[Math.floor(Math.random() * works.length)];
      this.#renderBook(work, subject);
      this.#setState('success');
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[BookOfDayWidget]', err);
      this.#setState('error', 'Не удалось загрузить книгу.');
    }
  }

  #renderBook(work, subject) {
    this._titleEl.textContent = work.title ?? 'Без названия';       
    this._authorsEl.textContent = (work.authors ?? [])
      .map((a) => a.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ') || 'Автор неизвестен';
    this._metaEl.textContent = `Жанр: ${subject.replace(/_/g, ' ')}`;

    if (work.cover_id) {
      this._cover.src = `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`;
      this._cover.hidden = false;
    } else {
      this._cover.removeAttribute('src');
      this._cover.hidden = true;
    }
    this._card.hidden = false;
  }

  #setState(state, message = '') {
    this.#state = state;
    this.element?.setAttribute('data-state', state);

    const map = {
      loading: 'Загрузка…',
      empty: message || 'Ничего не найдено.',
      error: message || 'Ошибка загрузки.',
      success: '',
      idle: '',
    };
    if (this._statusEl) this._statusEl.textContent = map[state] ?? '';
  }

  destroy() {
    this.#abortController?.abort();
    super.destroy();
  }
}