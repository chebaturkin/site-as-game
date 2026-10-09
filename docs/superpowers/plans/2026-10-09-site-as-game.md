# Site as Game — reliability and editorial editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current static Site as Game MVP into a reliable, polished local editor and autonomous play runtime with validated projects, stable progress, safe export, and a focused editorial design system.

**Architecture:** Keep the vanilla static app and split responsibilities inside the existing files: `app.js` owns schema, storage, validation, editor state, play state, and export; `index.html` owns semantic controls and accessible structure; `styles.css` owns one consolidated token layer and responsive presentation. Project JSON v2 is the single source of truth for editor, preview, and exported runtime. Export embeds the project payload so the ZIP works from `file://` without fetch or backend.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, browser FileReader/Canvas/localStorage/Blob APIs, inline SVG, Playwright smoke scripts.

---

### Task 1: Establish v2 project and storage invariants

**Files:**
- Modify: `app.js` (state, seeds, normalize/load/save helpers)
- Modify: `index.html` (project controls and status placeholders)
- Test: `/tmp/site-as-game-model.test.mjs`

- [ ] Add `project.id`, `project.startRoomId`, `updatedAt`, and `version: 2`; migrate v1 `start` booleans into `startRoomId`.
- [ ] Replace random IDs with `crypto.randomUUID()` fallback and regenerate duplicate IDs during normalization.
- [ ] Normalize image objects, positions, transitions, flag references, room titles, and the exact 3–7 room range without throwing on corrupted JSON.
- [ ] Add `storageGet/storageSet/storageRemove` wrappers that catch SecurityError/QuotaExceededError and surface a toast; debounce project saves by 150 ms and expose save state in the header.
- [ ] Use `project.id` in progress keys so renaming a title does not lose progress.
- [ ] Run `node --check app.js` and a small model test that loads malformed data, preserves one start room, and keeps progress after title rename.

### Task 2: Add project-level validation and safe editing actions

**Files:**
- Modify: `index.html` (new/open/save JSON, project status, start-room action)
- Modify: `app.js` (validator, undo/redo snapshots, import/export JSON, room actions)

- [ ] Add a compact project toolbar with `новый`, `открыть JSON`, `сохранить JSON`, undo/redo, and a hidden file input; keep actions secondary to the mode switch and ZIP export.
- [ ] Implement `validateProject(project)` returning errors/warnings with room/transition targets; detect empty labels/titles, invalid targets, duplicate refs, no start, unreachable rooms, dead ends, and unused flags.
- [ ] Render project health above the inspector and make ZIP export unavailable when validation has errors; clicking an issue selects the affected room.
- [ ] Add snapshots before destructive changes; implement undo/redo with a bounded in-memory history and restore selection safely.
- [ ] Add explicit “сделать стартовой”, “дублировать комнату”, and “играть с этой комнаты” actions.
- [ ] Confirm only when a template switch or room deletion would remove authored data; preserve the current project when cancelled.
- [ ] Verify import/export JSON round-trip with a test fixture containing an image-less project and broken references.

### Task 3: Rebuild Play state and hash routing

**Files:**
- Modify: `index.html` (play status, completion state, accessible image semantics)
- Modify: `app.js` (progress normalization, route sync, runtime rendering)

- [ ] Normalize progress into `{projectId,currentRoomId,visited,flags,completed}`; mark the start room visited on entry and clamp visited to known rooms.
- [ ] Block invalid/locked transitions with actual `disabled` semantics and visible lock reasons; never allow an empty target to mutate state.
- [ ] Add completion detection when all reachable rooms are visited; render a small completion panel with restart and return-to-map actions.
- [ ] Support `#/play/:roomId`, `hashchange`, and browser back/forward; entering a room updates the hash without rewriting the entire editor state.
- [ ] Make the missing-image scene decorative (`aria-hidden`) and preserve alt text only when an image exists.
- [ ] Smoke-test lock/set/visit/reset/completion and direct hash entry.

### Task 4: Make ZIP export autonomous and DOM-safe

**Files:**
- Modify: `app.js` (export writer and generated runtime)
- Test: `/tmp/site-as-game-export.test.mjs`

- [ ] Keep the store-only ZIP writer but avoid spreading large byte arrays into argument lists; concatenate typed arrays incrementally.
- [ ] Embed escaped JSON in `index.html` and have generated `play.js` read it from a script tag, so the archive runs from `file://`.
- [ ] Render author text through DOM `textContent`/attributes or a shared escape helper; do not interpolate untrusted title/body/labels into executable HTML.
- [ ] Include per-room coordinates, alt text, lock reasons, progress, reset, and completion in the exported runtime.
- [ ] Refuse export on validation errors and show the first actionable issue.
- [ ] Verify the ZIP contains `index.html`, `styles.css`, `play.js`, `project.json`, and decoded image assets; inspect generated runtime with an XSS fixture string.

### Task 5: Consolidate and finish the design system

**Files:**
- Modify: `styles.css`
- Modify: `index.html` (skip link, tabpanel semantics, focus hooks)

- [ ] Remove the duplicated first token/rule layer and keep one editorial token system for paper, ink, accent, serif, mono, and UI fonts.
- [ ] Add visible focus styles for SVG nodes, correct tab/tabpanel IDs and `aria-controls`, skip link, touch-safe controls, and `prefers-reduced-motion` behavior.
- [ ] Improve mobile map readability with a stable minimum height and a readable fallback route list; keep the desktop three-column desk intact.
- [ ] Add template-specific `theme-color` synchronization only if it improves browser chrome; do not add decorative metadata or copy.
- [ ] Verify 1440 px and 390 px layouts have no horizontal overflow and maintain readable controls.

### Task 6: End-to-end verification

**Files:**
- Create: `/tmp/site-as-game-smoke.py` (local-only Playwright script)

- [ ] Run `node --check app.js`.
- [ ] Run the Playwright smoke script against the existing local server: fresh load, template switch, title edit, add/delete room, start-room action, invalid transition blocking, play/reset, hash entry, JSON export/import, and ZIP download.
- [ ] Capture desktop and mobile screenshots and inspect console errors.
- [ ] Re-run the model and export checks after the final CSS/HTML changes and report exact command output.


### Task 7: rewrite product copy and prepare GitHub Pages

**Files:**
- Modify: `README.md`
- Modify: `index.html`
- Modify: `app.js` (rendered labels and messages)
- Create: `.github/workflows/pages.yml`
- Create: `.nojekyll`

- [ ] **Step 1: replace interface copy with lowercase authorial text**

Use direct action labels such as `открыть JSON`, `сохранить JSON`, `скачать ZIP`, `проверить отсюда`, `вернуться к карте` and `начать заново`. Keep proper case for `ROOM / ROOM`, `JSON`, `ZIP`, `GitHub Pages`, `HTML`, `WebP`, `JPG`, `PNG` and `localStorage`. Make errors actionable: `назовите маршрут`, `добавьте цель для перехода`, `нужен JPG, PNG или WebP до 8 мб`.

- [ ] **Step 2: write a real README**

Document what the editor does, how to open it locally, how browser-only storage works, how JSON/ZIP export works and how to enable GitHub Pages. Do not promise a backend, analytics, upload or automatic publishing.

- [ ] **Step 3: add static Pages deployment**

Create `.github/workflows/pages.yml` with `contents: read`, `pages: write`, `id-token: write`, `actions/configure-pages`, `actions/upload-pages-artifact` pointing at `.`, and `actions/deploy-pages` on pushes to `main` and manual dispatch. Add an empty `.nojekyll` marker.

### Task 8: browser smoke verification and final diff

**Files:**
- Create: `tests/browser_smoke.py`
- Modify: `tests/route_model_test.py`

- [ ] **Step 1: run static checks**

Run `node --check app.js`, `python -m py_compile tests/browser_smoke.py tests/route_model_test.py`, and `git diff --check`.

- [ ] **Step 2: run browser smoke checks**

Serve the project with `python3 -m http.server 4173`, then run the Playwright script against desktop and `390x844` mobile viewports. Cover initial load, template switch, title edit, room actions, invalid transition state, play/reset, hash entry, JSON download and ZIP download. Fail on page errors, horizontal overflow or missing accessible labels.

- [ ] **Step 3: inspect and commit**

Review `git diff`, stage the cohesive implementation, and commit with `polish: make room room clear safe and publishable` after verification output is fresh.
