import { UIComponent } from './UIComponent.js';

export class QuoteWidget extends UIComponent {
  #quotes = [
    { text: 'Книга — это сон, который вы держите в руках.', author: 'Нил Гейман' },
    { text: 'Чтение — это беседа со всеми мудрецами.', author: 'Рене Декарт' },
    { text: 'Комната без книг подобна телу без души.', author: 'Цицерон' },
    { text: 'Книги — корабли мысли, странствующие по волнам времени.', author: 'Фрэнсис Бэкон' },
  ];
  #currentIndex = 0;

  constructor(config = {}) {
    super({ title: config.title ?? '💬 Цитата о книгах', ...config });
  }

  _buildContent() {
    const wrap = document.createElement('div');
    wrap.className = 'quote';

    const blockquote = document.createElement('blockquote');
    blockquote.className = 'quote__text';

    const authorEl = document.createElement('cite');
    authorEl.className = 'quote__author';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quote__refresh';
    btn.textContent = 'Обновить';

    wrap.append(blockquote, authorEl, btn);

    const render = () => {
      const q = this.#quotes[this.#currentIndex];
      blockquote.textContent = q.text;
      authorEl.textContent = `— ${q.author}`;
    };

    this._bind(btn, btn, 'click', () => {
      this.#currentIndex = (this.#currentIndex + 1) % this.#quotes.length;
      render();
    });

    render();
    return wrap;
  }
}