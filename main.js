import { Dashboard } from './js/Dashboard.js';

const dashboard = new Dashboard('#dashboard-grid');

// управление
const buttonMap = {
  'btn-add-todo':       'todo',
  'btn-add-quote':      'quote',
  'btn-add-search':     'bookSearch',
  'btn-add-bookofday':  'bookOfDay',
};

for (const [btnId, type] of Object.entries(buttonMap)) {
  const btn = document.getElementById(btnId);
  btn?.addEventListener('click', () => dashboard.addWidget(type));
}