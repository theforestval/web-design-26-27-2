import { UIComponent } from './UIComponent.js';

const OPEN_LIBRARY_SEARCH = 'https://openlibrary.org/search.json';

export class BookSearchWidget extends UIComponent {
  #abortController = null;
  #state = 'idle';   

  constructor(config = {}) {
    super({ title: config.title ?? '🔍 Поиск книг', ...config });
  }

  _buildContent() {
    const wrap = document.createElement('div');
    wrap.className = 'book-search';

    wrap.innerHTML = `
      <form class="book-search__form">
        <input
          class="book-search__input"
          type="search"
          placeholder="Название или автор…"
          aria-label="Поисковый запрос"
          required
        />
        <button class="book-search__submit" type="submit">Найти</button>
      </form>
      <div class="book-search__status" role="status" aria-live="polite"></div>
      <ul class="book-search__results" role="list"></ul>
    `;

    const form = wrap.querySelector('.book-search__form');
    const input = wrap.querySelector('.book-search__input');
    const status = wrap.querySelector('.book-search__status');
    const results = wrap.querySelector('.book-search__results');

    this._form = form;
    this._input = input;
    this._status = status;
    this._results = results;

    this._bind(form, form, 'submit', (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (query) this.#search(query);
    });

    return wrap;
  }

  async #search(query) {
   
    this.#abortController?.abort();
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    this.#setState('loading');
    this._results.innerHTML = '';

    const url = `${OPEN_LIBRARY_SEARCH}?q=${encodeURIComponent(query)}&limit=10`;

    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const docs = Array.isArray(data.docs) ? data.docs : [];

      if (docs.length === 0) {
        this.#setState('empty');
        return;
      }

      this.#renderResults(docs);
      this.#setState('success', `Найдено: ${data.numFound ?? docs.length}`);
    } catch (err) {
      if (err.name === 'AbortError') return;   
      console.error('[BookSearchWidget]', err);
      this.#setState('error', 'Не удалось загрузить данные. Проверьте соединение.');
    }
  }

  #renderResults(docs) {
    this._results.innerHTML = '';
    for (const doc of docs) {
      const li = document.createElement('li');
      li.className = 'book-search__item';

      const cover = document.createElement('img');
      cover.className = 'book-search__cover';
      cover.alt = '';
      cover.loading = 'lazy';
      if (doc.cover_i) {
        cover.src = `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`;
      } else {
        cover.classList.add('book-search__cover--placeholder');
      }

      const info = document.createElement('div');
      info.className = 'book-search__info';

      const title = document.createElement('p');
      title.className = 'book-search__title';
      title.textContent = doc.title ?? 'Без названия';   

      const author = document.createElement('p');
      author.className = 'book-search__author';
      author.textContent = doc.author_name?.slice(0, 2).join(', ') ?? 'Автор неизвестен';

      const year = document.createElement('p');
      year.className = 'book-search__year';
      year.textContent = doc.first_publish_year ? `Первая публикация: ${doc.first_publish_year}` : '';

      info.append(title, author, year);
      li.append(cover, info);
      this._results.appendChild(li);
    }
  }

  #setState(state, message = '') {
    this.#state = state;
    this.element?.setAttribute('data-state', state);

    const messages = {
      loading: 'Загрузка…',
      empty: 'Ничего не найдено. Попробуйте другой запрос.',
      error: message || 'Произошла ошибка.',
      success: message || '',
      idle: '',
    };
    if (this._status) this._status.textContent = messages[state] ?? '';
  }

  destroy() {
    this.#abortController?.abort();  
    super.destroy();
  }
}