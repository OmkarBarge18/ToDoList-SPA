/**
 * events.js
 * ─────────────────────────────────────────────────────
 * Sets up all "global" event listeners — ones that live on
 * persistent elements (input, buttons, document) rather than
 * on dynamically-rendered list items.
 *
 * List-item events are attached inside render.js after each render.
 */

function setupEvents() {
  const input      = document.getElementById('todo-input');
  const addBtn     = document.getElementById('add-btn');
  const toggleAll  = document.getElementById('toggle-all-btn');
  const clearDone  = document.getElementById('clear-completed');
  const themeBtn   = document.getElementById('theme-toggle');
  const iconSun    = document.getElementById('icon-sun');
  const iconMoon   = document.getElementById('icon-moon');

  // ── Add todo on button click ────────────────────────────────────
  addBtn.addEventListener('click', () => {
    const added = State.addTodo(input.value);
    if (added) {
      input.value = '';
      Render.render();
      input.focus();
    } else {
      // Shake the input to signal empty submission
      shakeInput(input);
    }
  });

  // ── Add todo on Enter key ────────────────────────────────────────
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') addBtn.click();
  });

  // ── Trim whitespace on paste ─────────────────────────────────────
  // So pasted text with leading/trailing spaces isn't added as-is
  input.addEventListener('paste', e => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const trimmed = pasted.replace(/\s+/g, ' ').trim();
    // Insert at cursor position
    const start = input.selectionStart;
    const end   = input.selectionEnd;
    const before = input.value.slice(0, start);
    const after  = input.value.slice(end);
    input.value = before + trimmed + after;
    input.selectionStart = input.selectionEnd = start + trimmed.length;
  });

  // ── Toggle all ──────────────────────────────────────────────────
  toggleAll.addEventListener('click', () => {
    State.toggleAll();
    Render.render();
  });

  // ── Clear completed ─────────────────────────────────────────────
  clearDone.addEventListener('click', () => {
    State.clearCompleted();
    Render.render();
  });

  // ── Filter buttons ───────────────────────────────────────────────
  // Delegated to the footer — works even if footer is re-rendered
  document.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    State.setFilter(btn.dataset.filter);
    Render.render();
  });

  // ── Dark mode toggle ─────────────────────────────────────────────
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'light';
    const next    = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    iconSun.style.display  = theme === 'dark'  ? 'block' : 'none';
    iconMoon.style.display = theme === 'light' ? 'block' : 'none';
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    // Ctrl/Cmd + / to focus input from anywhere
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      input.focus();
      input.select();
    }

    // Escape to blur input / cancel edit
    if (e.key === 'Escape' && document.activeElement === input) {
      input.blur();
    }
  });
}

// ── Visual feedback: shake animation on empty submit ──────────────────
function shakeInput(input) {
  input.style.transition = 'transform 0.06s ease';
  let count = 0;
  const shake = () => {
    count++;
    input.style.transform = `translateX(${count % 2 === 0 ? -4 : 4}px)`;
    if (count < 6) setTimeout(shake, 60);
    else input.style.transform = '';
  };
  shake();
}

window.Events = { setupEvents };