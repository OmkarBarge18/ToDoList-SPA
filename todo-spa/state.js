/**
 * state.js
 * ─────────────────────────────────────────────────────
 * All application state and pure state-mutation functions.
 * No DOM access here. Every function either reads or mutates
 * the todos array and activeFilter, then saves to localStorage.
 *
 * Exported via window.State for use by render.js and events.js.
 */

const STORAGE_KEY = 'todos-spa-v1';

// ─── Application state ──────────────────────────────────────────────
let todos = [];          // Array of todo objects
let activeFilter = 'all'; // 'all' | 'active' | 'completed'

// ─── Todo shape ─────────────────────────────────────────────────────
// {
//   id:        string  — unique ID (timestamp-based)
//   text:      string  — the todo text
//   completed: boolean — whether it's done
//   createdAt: number  — Unix ms timestamp
// }

// ─── Persistence ────────────────────────────────────────────────────

/**
 * Save current todos array to localStorage.
 * Silently fails if storage is unavailable (private browsing, full quota).
 */
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    console.warn('localStorage unavailable — changes will not persist.', e);
  }
}

/**
 * Load todos from localStorage on startup.
 * Falls back to empty array if data is missing or corrupted.
 */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { todos = []; return; }
    const parsed = JSON.parse(raw);
    // Validate: must be an array of objects with the right shape
    if (!Array.isArray(parsed)) { todos = []; return; }
    todos = parsed.filter(item =>
      item &&
      typeof item.id === 'string' &&
      typeof item.text === 'string' &&
      typeof item.completed === 'boolean'
    );
  } catch (e) {
    // JSON.parse failed — storage was corrupted
    console.warn('Corrupted todo data in localStorage, resetting.', e);
    todos = [];
  }
}

// ─── CRUD operations ────────────────────────────────────────────────

/**
 * Add a new todo.
 * @param {string} text — raw input value
 * @returns {boolean} — true if added, false if text was empty
 */
function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;

  todos.push({
    id: Date.now().toString(),
    text: trimmed,
    completed: false,
    createdAt: Date.now(),
  });

  save();
  return true;
}

/**
 * Toggle the completed state of a todo by id.
 * Does nothing if the id doesn't exist.
 */
function toggleTodo(id) {
  todos = todos.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  save();
}

/**
 * Delete a todo by id.
 */
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  save();
}

/**
 * Update the text of a todo by id.
 * @param {string} id
 * @param {string} newText — will be trimmed
 * @returns {boolean} — false if newText is empty (deletion prevented)
 */
function editTodo(id, newText) {
  const trimmed = newText.trim();
  if (!trimmed) return false;

  todos = todos.map(t =>
    t.id === id ? { ...t, text: trimmed } : t
  );
  save();
  return true;
}

/**
 * Toggle all todos to completed or all to active.
 * If every item is completed, marks all active.
 * Otherwise marks all completed.
 */
function toggleAll() {
  const allDone = todos.every(t => t.completed);
  todos = todos.map(t => ({ ...t, completed: !allDone }));
  save();
}

/**
 * Remove all completed todos.
 */
function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  save();
}

/**
 * Reorder todos — used by drag-and-drop.
 * Moves the todo at fromIndex to toIndex.
 */
function reorder(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  const updated = [...todos];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  todos = updated;
  save();
}

// ─── Filter ─────────────────────────────────────────────────────────

function setFilter(f) {
  activeFilter = f;
  // Note: filter is NOT persisted — resets to 'all' on reload (intentional)
}

function getFilter() {
  return activeFilter;
}

/**
 * Return the subset of todos matching the current filter.
 */
function getFiltered() {
  switch (activeFilter) {
    case 'active':    return todos.filter(t => !t.completed);
    case 'completed': return todos.filter(t =>  t.completed);
    default:          return [...todos];
  }
}

// ─── Derived state helpers ───────────────────────────────────────────

function getTodos()      { return todos; }
function getTotal()      { return todos.length; }
function getActiveCount(){ return todos.filter(t => !t.completed).length; }
function getDoneCount()  { return todos.filter(t =>  t.completed).length; }
function allDone()       { return todos.length > 0 && todos.every(t => t.completed); }

// ─── Export ─────────────────────────────────────────────────────────
window.State = {
  load,
  save,
  addTodo,
  toggleTodo,
  deleteTodo,
  editTodo,
  toggleAll,
  clearCompleted,
  reorder,
  setFilter,
  getFilter,
  getFiltered,
  getTodos,
  getTotal,
  getActiveCount,
  getDoneCount,
  allDone,
};