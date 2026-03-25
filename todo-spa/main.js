/**
 * main.js
 * ─────────────────────────────────────────────────────
 * Entry point. Runs after all other scripts are loaded.
 *
 * Boot sequence:
 *   1. Load persisted todos from localStorage
 *   2. Set up all global event listeners
 *   3. Render the initial UI
 */

(function boot() {
  State.load();         // 1. hydrate todos array from localStorage
  Events.setupEvents(); // 2. wire up input, buttons, keyboard shortcuts
  Render.render();      // 3. paint the initial list

  // Focus the input on load (desktop only — avoids mobile keyboard pop-up)
  if (window.innerWidth >= 640) {
    document.getElementById('todo-input').focus();
  }

  console.log(
    '%c Todos SPA loaded ',
    'background:#5046e5;color:white;padding:2px 6px;border-radius:3px;font-size:11px',
    `— ${State.getTotal()} todo(s) restored from localStorage`
  );
})();