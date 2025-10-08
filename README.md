# Flashcards

A lightweight, dependency-free JavaScript library for building animated flip-style flashcards. The library exposes a single `FlashcardApp` class that can be used from a `<script>` tag, CommonJS, or AMD environments. It includes a CSS file with sensible defaults and optional transitions.

## Features

- Simple API for adding flashcard pages programmatically
- Smooth flip animations with optional slide transitions between cards
- Directional slide animations (left/right/up/down) with optional overlay arrows
- Configurable dimensions, colours, and fonts globally or per card
- Keyboard navigation (arrow keys) and click-to-flip interaction
- Configurable dimensions, colours, and fonts globally or per card
- Keyboard navigation (left/right arrow keys) and click-to-flip interaction
- Works in modern browsers without any build tooling

## Getting started

1. Include the CSS and JavaScript files in your page.

   ```html
   <link rel="stylesheet" href="/path/to/flashcard.css">
   <script src="/path/to/flashcard.js"></script>
   ```

2. Create a container element for the app.

   ```html
   <div id="flashcardApp"></div>
   ```

3. Instantiate the library and add pages.

   ```html
   <script>
     const app = new FlashcardLib.FlashcardApp({
       width: '360px',
       height: '240px',
       frontColor: '#f8fafc',
       backColor: '#fee2e2',
       textColor: '#0f172a',
       font: "'Inter', 'Segoe UI', sans-serif"
     });

     app
       .addPage('What is the capital of Sweden?', 'Stockholm')
       .addPage('2 + 2 = ?', '4')
       .start('flashcardApp');
   </script>
   ```

4. (Optional) Provide per-card overrides by passing a configuration object to `addPage`.

   ```js
   app.addPage('Primary colour?', 'Blue', {
     frontColor: '#dbeafe',
     backColor: '#1e3a8a',
     textColor: '#0f172a'
   });
   ```

### API reference

#### `new FlashcardApp(options?)`

Creates a new flashcard application instance. All properties are optional.

| Option            | Type   | Default                                     | Description                                                                                |
|-------------------|--------|---------------------------------------------|--------------------------------------------------------------------------------------------|
| `width`           | string | `"300px"`                                  | Width of the flashcard.                                                                    |
| `height`          | string | `"200px"`                                  | Height of the flashcard.                                                                   |
| `font`            | string | `"'Inter', 'Segoe UI', Arial, sans-serif"` | Font family applied to both card faces.                                                    |
| `frontColor`      | string | `"#ffffff"`                                | Background colour of the card front.                                                       |
| `backColor`       | string | `"#ffebcd"`                                | Background colour of the card back.                                                        |
| `textColor`       | string | `"#333333"`                                | Text colour for both faces.                                                                |
| `navigationMode`  | string | `"buttons"`                                | Choose between `"buttons"`, `"side-arrows"`, or `"vertical-arrows"` for navigation controls. |
| `slideDirection`  | string | `"left"`                                   | Direction for forward navigation: `"left"`, `"right"`, `"up"`, or `"down"`. Previous uses the opposite direction. |
| Option        | Type   | Default                                 | Description                                   |
|---------------|--------|-----------------------------------------|-----------------------------------------------|
| `width`       | string | `"300px"`                              | Width of the flashcard.                       |
| `height`      | string | `"200px"`                              | Height of the flashcard.                      |
| `font`        | string | `"'Inter', 'Segoe UI', Arial, sans-serif"` | Font family applied to both card faces.       |
| `frontColor`  | string | `"#ffffff"`                            | Background colour of the card front.          |
| `backColor`   | string | `"#ffebcd"`                            | Background colour of the card back.           |
| `textColor`   | string | `"#333333"`                            | Text colour for both faces.                   |

#### `.addPage(frontText, backText, pageConfig?)`

Adds a flashcard page. Both text arguments must be strings. The optional `pageConfig` object accepts the same styling keys as the constructor and can additionally include a `backgroundColor` property for backwards compatibility (applies to both sides).

#### Navigation modes & keyboard support

- `navigationMode: "buttons"` renders the default previous/next buttons beneath the card.
- `navigationMode: "side-arrows"` hides the buttons and shows floating arrows on the left/right edges of the card.
- `navigationMode: "vertical-arrows"` hides the buttons and shows arrows above/below the card, ideal for vertical slides.

When `slideDirection` is set to `"up"` or `"down"`, the app listens to <kbd>ArrowUp</kbd>/<kbd>ArrowDown</kbd> in addition to the horizontal arrow keys.

#### `.clearPages()`

Removes all pages and resets the index.

#### `.start(containerOrId?)`

Renders the flashcards into the specified container (either the element itself or its `id`). Defaults to `"flashcardApp"`. Throws if no pages have been added or if the DOM is not available.

#### `.destroy()`

Removes global event listeners and clears cached DOM references. Call this before discarding an instance or reusing it elsewhere.

## Live examples

Open the HTML files in the [`test/`](test) directory in a browser to see the library in action. Each example keeps the markup minimal and uses the shared `flashcard.css` and `flashcard.js` files.

## Development

This repository intentionally avoids build tooling. To make changes, edit `flashcard.js` and `flashcard.css`, then open one of the test HTML files locally (e.g. using a static file server such as `npx serve`).

## Working with GitHub

If you plan to tweak the library or contribute upstream using GitHub, the recommended workflow is:

1. **Fork or clone the repository.** Use GitHub's *Fork* button if you do not have write access, or run `git clone <repo-url>` if you do.
2. **Create a feature branch.** Run `git checkout -b my-feature` so that your work stays isolated from `main`.
3. **Make your changes locally.** Update the JavaScript, CSS, and/or demo files as needed and open the HTML examples in `test/` to verify everything still works.
4. **Run quick smoke checks.** For CommonJS builds you can run `node -e "const lib = require('./flashcard.js'); console.log(Object.keys(lib));"` to ensure the bundle exports correctly.
5. **Commit with a clear message.** Stage your files (`git add ...`) and commit (`git commit -m "Describe your change"`).
6. **Push the branch to GitHub.** Use `git push origin my-feature`.
7. **Open a pull request.** From GitHub, compare your branch against the target branch (typically `main`), summarise the changes, list any manual testing you performed, and request a review.

Following these steps keeps the history tidy and makes it easier for reviewers to understand and merge your improvements.

### Troubleshooting GitHub permissions

If GitHub shows the message `Det här kodförrådet är inte berättigat att skapa grenar. Kontrollera dina GitHub-behörigheter.` ("This repository is not eligible to create branches. Check your GitHub permissions."), it means you do not have write access to the repository. You can resolve this by either:

- **Forking the repository.** Click **Fork** in the GitHub UI to create your own copy, then clone and push branches to your fork.
- **Requesting access.** Ask a maintainer to grant you the required permissions so you can create branches directly in the original repository.

After forking or receiving access, retry the `git checkout -b my-feature` and `git push origin my-feature` steps from the workflow above.

## License

MIT License. See [LICENSE](LICENSE).
