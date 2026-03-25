/**
 * render.js
 * ─────────────────────────────────────────────────────
 * All DOM-writing functions.
 * Never mutates State directly — only reads from it.
 *
 * The single render() function is called after every state
 * mutation. It rebuilds the list, updates the footer, and
 * re-attaches event listeners.
 *
 * Key constraint: innerHTML wipes all event listeners, so
 * events must be re-bound after every render().
 */

// ─── Safety: escape HTML to prevent XSS ─────────────────────────────
// If a user types <script>alert(1)</script> as a todo text,
// without this it would execute when injected via innerHTML.
function escapeHTML(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, ch => map[ch]);
}

// ─── Build a single todo <li> as an HTML string ──────────────────────
function buildTodoItem(todo) {
  const completedClass = todo.completed ? ' completed' : '';
  const checkedAttr    = todo.completed ? ' checked' : '';

  return `
    <li
      class="todo-item${completedClass}"
      data-id="${escapeHTML(todo.id)}"
      draggable="true"
    >
      <div class="drag-handle" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>

      <input
        type="checkbox"
        class="todo-checkbox"
        aria-label="Mark complete"
        ${checkedAttr}
      />

      <span class="todo-text" title="Double-click to edit">
        ${escapeHTML(todo.text)}
      </span>

      <button
        class="delete-btn"
        aria-label="Delete todo"
        title="Delete"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </li>
  `.trim();
}

// ─── Attach events to a rendered list item ───────────────────────────
// Called after render() builds the list via innerHTML.
function attachItemEvents(li) {
  const id       = li.dataset.id;
  const checkbox = li.querySelector('.todo-checkbox');
  const textSpan = li.querySelector('.todo-text');
  const deleteBtn= li.querySelector('.delete-btn');

  // Toggle completed
  checkbox.addEventListener('change', () => {
    State.toggleTodo(id);
    render();
  });

  // Delete
  deleteBtn.addEventListener('click', () => {
    // Animate out before removing from state
    li.style.animation = 'slideOut 0.18s ease forwards';
    li.addEventListener('animationend', () => {
      State.deleteTodo(id);
      render();
    }, { once: true });
  });

  // Double-click to edit inline
  textSpan.addEventListener('dblclick', () => startInlineEdit(li, id, textSpan));

  // ── Drag-and-drop ────────────────────────────────────────────────
  li.addEventListener('dragstart', handleDragStart);
  li.addEventListener('dragover',  handleDragOver);
  li.addEventListener('dragleave', handleDragLeave);
  li.addEventListener('drop',      handleDrop);
  li.addEventListener('dragend',   handleDragEnd);
}

// ─── Inline edit ─────────────────────────────────────────────────────
function startInlineEdit(li, id, textSpan) {
  const currentText = State.getTodos().find(t => t.id === id)?.text ?? '';

  const input = document.createElement('input');
  input.type      = 'text';
  input.className = 'edit-input';
  input.value     = currentText;
  input.maxLength = 200;
  input.setAttribute('aria-label', 'Edit todo');

  // Replace the span with an input
  textSpan.replaceWith(input);
  input.focus();
  input.select();

  let committed = false;

  const commit = () => {
    if (committed) return; // prevent double-fire from blur + Enter
    committed = true;

    const saved = State.editTodo(id, input.value);
    if (!saved) {
      // Empty text — don't delete the todo, just revert
      input.replaceWith(textSpan);
      return;
    }
    render();
  };

  const cancel = () => {
    if (committed) return;
    committed = true;
    // Revert without saving
    input.replaceWith(textSpan);
  };

  input.addEventListener('blur',    commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { input.blur(); }       // triggers commit via blur
    if (e.key === 'Escape') { cancel(); } 
  });
}

// ─── Drag-and-drop state ─────────────────────────────────────────────
let dragSrcId = null; // id of the item being dragged

function handleDragStart(e) {
  dragSrcId = this.dataset.id;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcId);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (this.dataset.id !== dragSrcId) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave() {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');

  const targetId = this.dataset.id;
  if (!dragSrcId || dragSrcId === targetId) return;

  const todos    = State.getTodos();
  const fromIdx  = todos.findIndex(t => t.id === dragSrcId);
  const toIdx    = todos.findIndex(t => t.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return;

  State.reorder(fromIdx, toIdx);
  render();
}

function handleDragEnd() {
  this.classList.remove('dragging');
  // Clean up any lingering drag-over styles
  document.querySelectorAll('.todo-item').forEach(el =>
    el.classList.remove('drag-over')
  );
}

// ─── Render progress bar ─────────────────────────────────────────────
function renderProgressBar() {
  const total = State.getTotal();
  const done  = State.getDoneCount();
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  let bar = document.querySelector('.progress-bar-wrap');
  if (!bar) {
    // Inject progress bar before list card if not present
    const listCard = document.getElementById('list-card');
    bar = document.createElement('div');
    bar.className = 'progress-bar-wrap';
    bar.innerHTML = '<div class="progress-bar"></div>';
    listCard.prepend(bar);
  }
  bar.querySelector('.progress-bar').style.width = pct + '%';
  bar.style.display = total === 0 ? 'none' : 'block';
}

// ─── Render footer ───────────────────────────────────────────────────
function renderFooter() {
  const footer       = document.getElementById('footer');
  const count        = document.getElementById('count');
  const clearBtn     = document.getElementById('clear-completed');
  const toggleAllBtn = document.getElementById('toggle-all-btn');
  const total        = State.getTotal();
  const activeCount  = State.getActiveCount();
  const doneCount    = State.getDoneCount();
  const currentFilter= State.getFilter();

  // Show/hide footer
  footer.hidden = total === 0;

  // Item count label
  count.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;

  // Active filter button highlight
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === currentFilter);
  });

  // Show "Clear done" only when there are completed todos
  clearBtn.hidden = doneCount === 0;

  // Toggle-all button visual state
  toggleAllBtn.classList.toggle('all-done', State.allDone());
  toggleAllBtn.title = State.allDone() ? 'Mark all active' : 'Mark all complete';
}

// ─── Main render function ─────────────────────────────────────────────
// This is the single source of truth for the DOM.
// Called after every state mutation.
function render() {
  const list      = document.getElementById('todo-list');
  const emptyState= document.getElementById('empty-state');
  const emptyMsg  = document.getElementById('empty-message');
  const filtered  = State.getFiltered();
  const total     = State.getTotal();
  const filter    = State.getFilter();

  // Build list HTML
  list.innerHTML = filtered.map(buildTodoItem).join('');

  // Attach events to each rendered item
  list.querySelectorAll('.todo-item').forEach(attachItemEvents);

  // Empty state messaging
  if (total === 0) {
    emptyState.hidden = false;
    emptyMsg.textContent = 'Nothing to do — add something above';
  } else if (filtered.length === 0) {
    emptyState.hidden = false;
    emptyMsg.textContent =
      filter === 'active'    ? 'No active todos — nice work!' :
      filter === 'completed' ? 'No completed todos yet' :
                               'Nothing here';
  } else {
    emptyState.hidden = true;
  }

  renderFooter();
  renderProgressBar();
}

window.Render = { render };