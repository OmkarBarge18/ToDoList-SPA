Vanilla JS Todo SPA
A lightweight, highly performant Single Page Application (SPA) built entirely with Vanilla JavaScript, HTML5, and CSS3. No frameworks, no build tools, no dependencies.

✨ Features
Complete CRUD: Create, read, update, and delete tasks.
Drag & Drop: Reorder your list intuitively using the native HTML5 Drag and Drop API.
Inline Editing: Double-click any task to edit it right in the list.
Persistence: State is automatically saved to localStorage so you never lose your data.
Theming: Built-in Light and Dark modes that remember your preference.
Filtering & Progress: Filter by All, Active, or Completed, and watch the progress bar fill up as you finish tasks.
Keyboard Navigation:
Enter to submit or save edits.
Escape to cancel an edit or unfocus the input.
Ctrl + / (or Cmd + /) to quickly focus the add-task input from anywhere.
📁 Architecture
The application uses a custom architecture that separates state management from DOM rendering, mimicking the data-flow of modern frameworks (like React or Vue) but using raw JavaScript.

index.html: The structural shell, containing semantic HTML and inline SVGs.
style.css: Uses CSS custom properties (variables) for easy theming and includes keyframe animations for smooth UI transitions.
main.js: The bootloader. It initializes the state, sets up global events, and triggers the first render.
state.js: The "store". It contains the raw data arrays and pure functions to mutate that data. It handles all localStorage reads and writes. No DOM manipulation happens here.
render.js: The "view". It takes data from state.js and paints it to the DOM. It also attaches event listeners to dynamic elements (like the individual todo items) after they are injected into the page.
events.js: The "controller" for static elements. It binds event listeners to things that always exist on the page (the main input, the filter buttons, the theme toggle).
🚀 How to Run
Because this project uses zero build steps or external dependencies, running it is as simple as opening a file.

Clone or download this repository.
Open index.html directly in any modern web browser.
Start organizing your life!
