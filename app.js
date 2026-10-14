// Only owned interface strings are translated. Project data is always kept verbatim.
const i18n = globalThis.I18n;
const t = (key, values) => i18n.t(key, values);
/* room room: browser-only route editor and autonomous play runtime. */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const q = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const MAX_ROOMS = 7;
  const MIN_ROOMS = 3;
  const MAX_TRANSITIONS = 3;
  const MAX_FLAGS = 12;
  const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
  const MAX_IMPORT_BYTES = 64 * 1024 * 1024;
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const escapeInlineJson = (value = '') => String(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  const esc = escapeHtml;
  const escScript = escapeInlineJson;
  const slugify = (value = 'room-room') => String(value).toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40) || 'room-room';
  const uid = (prefix = 'id') => {
    try { if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`; } catch (_) { /* fallback below */ }
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();
  const defaults = { x: [77, 49, 20, 28, 65, 55, 34], y: [24, 50, 77, 18, 37, 70, 89] };

  const themes = i18n.live(() => ({
    night: { body: 'theme-night', title: t("m145"), subtitle: t("m155"), coords: ['x 24° · y 61°', 'x 31° · y 58°', 'x 44° · y 52°', 'x 50° · y 41°', 'x 65° · y 36°', 'x 71° · y 27°', 'x 83° · y 20°'] },
    museum: { body: 'theme-museum', title: t("m131"), subtitle: t("m154"), coords: [t("m153"), t("m152"), t("m151"), t("m150"), t("m149"), t("m148"), t("m147")] },
    notes: { body: 'theme-notes', title: t("m116"), subtitle: t("m146"), coords: ['№ 01 · 09:10', '№ 02 · 09:42', '№ 03 · 10:05', '№ 04 · 10:26', '№ 05 · 11:15', '№ 06 · 12:01', '№ 07 · 12:40'] }
  }));

  const seeds = i18n.live(() => ({
    night: {
      title: t("m145"), flags: [{ id: 'lamp', label: t("m144"), default: false }, { id: 'key', label: t("m143"), default: false }],
      rooms: [
        { id: 'n1', title: t("m142"), body: t("m141"), position: { x: 24, y: 28 }, start: true, transitions: [{ id: 't1', label: t("m140"), target: 'n2', requires: '', sets: 'lamp' }, { id: 't2', label: t("m139"), target: 'n3', requires: '', sets: '' }] },
        { id: 'n2', title: t("m138"), body: t("m137"), position: { x: 76, y: 28 }, transitions: [{ id: 't3', label: t("m014"), target: 'n3', requires: 'lamp', sets: '' }, { id: 't4', label: t("m136"), target: 'n1', requires: '', sets: '' }] },
        { id: 'n3', title: t("m135"), body: t("m134"), position: { x: 50, y: 76 }, transitions: [{ id: 't5', label: t("m133"), target: 'n1', requires: '', sets: 'key' }, { id: 't6', label: t("m132"), target: 'n2', requires: 'key', sets: '' }] }
      ]
    },
    museum: {
      title: t("m131"), flags: [{ id: 'ticket', label: t("m130"), default: false }, { id: 'case', label: t("m129"), default: false }],
      rooms: [
        { id: 'm1', title: t("m128"), body: t("m127"), position: { x: 24, y: 28 }, start: true, transitions: [{ id: 't1', label: t("m126"), target: 'm2', requires: '', sets: 'ticket' }, { id: 't2', label: t("m125"), target: 'm3', requires: '', sets: '' }] },
        { id: 'm2', title: t("m124"), body: t("m123"), position: { x: 76, y: 28 }, transitions: [{ id: 't3', label: t("m122"), target: 'm3', requires: 'ticket', sets: 'case' }, { id: 't4', label: t("m121"), target: 'm1', requires: '', sets: '' }] },
        { id: 'm3', title: t("m120"), body: t("m119"), position: { x: 50, y: 76 }, transitions: [{ id: 't5', label: t("m118"), target: 'm1', requires: 'case', sets: '' }, { id: 't6', label: t("m117"), target: 'm2', requires: '', sets: '' }] }
      ]
    },
    notes: {
      title: t("m116"), flags: [{ id: 'thread', label: t("m115"), default: false }, { id: 'answer', label: t("m114"), default: false }],
      rooms: [
        { id: 'q1', title: t("m113"), body: t("m112"), position: { x: 24, y: 28 }, start: true, transitions: [{ id: 't1', label: t("m111"), target: 'q2', requires: '', sets: 'thread' }, { id: 't2', label: t("m110"), target: 'q3', requires: '', sets: '' }] },
        { id: 'q2', title: t("m109"), body: t("m108"), position: { x: 76, y: 28 }, transitions: [{ id: 't3', label: t("m107"), target: 'q3', requires: 'thread', sets: 'answer' }, { id: 't4', label: t("m106"), target: 'q1', requires: '', sets: '' }] },
        { id: 'q3', title: t("m105"), body: t("m104"), position: { x: 50, y: 76 }, transitions: [{ id: 't5', label: t("m103"), target: 'q1', requires: 'answer', sets: '' }, { id: 't6', label: t("m102"), target: 'q2', requires: '', sets: '' }] }
      ]
    }
  }));

  const state = {
    project: null, selectedRoomId: null, mode: 'edit', play: null, saveTimer: null, lastSaved: 0,
    historyPast: [], historyFuture: [], maxHistory: 50, historyMute: false, titleHistoryCaptured: false, roomHistoryCapturedId: null, transitionHistoryCapturedId: null,
    flagHistoryCapturedId: null, mapDrag: null, mapDragSuppressClick: false
  };
  let pristineProject = null;
  function pristineSignature() { return JSON.stringify({ ...state.project, updatedAt: '' }); }
  function rememberPristine() { pristineProject = pristineSignature(); }
  function localizePristineTemplate() {
    if (!pristineProject || pristineProject !== pristineSignature()) return;
    state.project.title = i18n.owned(state.project.title);
    state.project.flags.forEach(flag => { flag.label = i18n.owned(flag.label); });
    state.project.rooms.forEach(room => {
      room.title = i18n.owned(room.title);
      room.body = i18n.owned(room.body);
      room.transitions.forEach(door => { door.label = i18n.owned(door.label); });
    });
    rememberPristine();
    scheduleSave();
  }
  const projectKey = () => 'room-room-project-v2';
  const legacyProjectKey = () => 'room-room-project-v1';
  const progressKey = () => `room-room-progress-v2-${state.project?.id || 'world'}`;

  function announce(message) {
    const toast = $('toast'); if (!toast) return;
    toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(announce.timer);
    announce.timer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }
  function storageGet(key) { try { return localStorage.getItem(key); } catch (_) { announce(t("m101")); return null; } }
  function storageSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (error) {
      announce(error?.name === 'QuotaExceededError' ? t("m100") : t("m099")); return false;
    }
  }
  function storageRemove(key) { try { localStorage.removeItem(key); } catch (_) { announce(t("m098")); } }
  function setSaveState(label) { const node = $('saveStatus'); if (node) node.textContent = label; }
  function scheduleSave() {
    setSaveState(t("m097")); clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => {
      state.project.version = 2; state.project.updatedAt = now();
      if (storageSet(projectKey(), JSON.stringify(state.project))) { state.lastSaved = Date.now(); setSaveState(t("m096")); }
    }, 150);
  }
  function saveProjectNow() { clearTimeout(state.saveTimer); state.project.version = 2; state.project.updatedAt = now(); if (storageSet(projectKey(), JSON.stringify(state.project))) { state.lastSaved = Date.now(); setSaveState(t("m096")); } }

  function normalizeImage(image) {
    if (!image || typeof image !== 'object') return { src: '', name: '', alt: '' };
    const src = typeof image.src === 'string' ? image.src : '';
    const dataMatch = src.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    const assetMatch = src.match(/^assets\/[A-Za-z0-9._/-]+$/) && !src.includes('..');
    const payload = dataMatch?.[2] || '';
    const decodedBytes = dataMatch ? Math.floor((payload.replace(/=+$/, '').length * 3) / 4) : 0;
    const safeSrc = (dataMatch && decodedBytes <= MAX_IMAGE_BYTES) || assetMatch ? src : '';
    return { src: safeSrc, name: typeof image.name === 'string' ? image.name.slice(0, 160) : '', alt: typeof image.alt === 'string' ? image.alt.slice(0, 240) : '' };
  }
  function normalizeProject(input) {
    const source = input && typeof input === 'object' ? clone(input) : {};
    const template = themes[source.template] ? source.template : 'night';
    let rooms = Array.isArray(source.rooms) ? source.rooms.slice(0, MAX_ROOMS) : [];
    if (!rooms.length) rooms = clone(seeds[template].rooms);
    while (rooms.length < 3) {
      const index = rooms.length;
      rooms.push({ id: uid('room'), title: t("m041", [String(index + 1).padStart(2, '0')]), body: '', position: { x: defaults.x[index] || 50, y: defaults.y[index] || 50 }, transitions: [] });
    }
    const usedRoomIds = new Set();
    rooms = rooms.map((room, index) => {
      const rawId = typeof room?.id === 'string' && room.id.trim() ? room.id.trim() : uid('room');
      let id = rawId; while (usedRoomIds.has(id)) id = uid('room'); usedRoomIds.add(id);
      const rawPosition = room?.position && typeof room.position === 'object' ? room.position : {};
      const transitions = Array.isArray(room?.transitions) ? room.transitions.slice(0, MAX_TRANSITIONS) : [];
      const usedTransitionIds = new Set();
      const normalizedTransitions = transitions.map((transition) => {
        const rawTransitionId = typeof transition?.id === 'string' && transition.id.trim() ? transition.id.trim() : uid('trans');
        let transitionId = rawTransitionId; while (usedTransitionIds.has(transitionId)) transitionId = uid('trans'); usedTransitionIds.add(transitionId);
        return {
          id: transitionId,
          label: typeof transition?.label === 'string' ? transition.label.slice(0, 160) : t("m014"),
          target: typeof transition?.target === 'string' ? transition.target : '',
          requires: typeof transition?.requires === 'string' ? transition.requires : '',
          sets: typeof transition?.sets === 'string' ? transition.sets : ''
        };
      });
      return {
        id,
        title: typeof room?.title === 'string' ? room.title.slice(0, 160) : t("m041", [String(index + 1).padStart(2, '0')]),
        body: typeof room?.body === 'string' ? room.body.slice(0, 10000) : '',
        image: normalizeImage(room?.image),
        position: { x: clamp(Number.isFinite(Number(rawPosition.x)) ? Number(rawPosition.x) : defaults.x[index] || 50, 4, 96), y: clamp(Number.isFinite(Number(rawPosition.y)) ? Number(rawPosition.y) : defaults.y[index] || 50, 8, 92) },
        transitions: normalizedTransitions,
        start: Boolean(room?.start)
      };
    });
    const ids = new Set(rooms.map((room) => room.id));
    const oldStart = typeof source.startRoomId === 'string' && ids.has(source.startRoomId) ? source.startRoomId : null;
    const markedStart = rooms.find((room) => room.start)?.id;
    const legacyStart = typeof source.start === 'string' && ids.has(source.start) ? source.start : null;
    const startRoomId = oldStart || legacyStart || markedStart || rooms[0].id;
    rooms.forEach((room) => {
      room.start = room.id === startRoomId;
      room.transitions.forEach((transition) => { if (transition.target && !ids.has(transition.target)) transition.target = ''; });
    });
    const usedFlagIds = new Set();
    const flags = (Array.isArray(source.flags) ? source.flags : clone(seeds[template].flags)).slice(0, MAX_FLAGS).map((flag) => {
      const rawId = typeof flag?.id === 'string' && flag.id.trim() ? flag.id.trim() : uid('flag');
      let id = rawId; while (usedFlagIds.has(id)) id = uid('flag'); usedFlagIds.add(id);
      return { id, label: typeof flag?.label === 'string' ? flag.label.slice(0, 100) : t("m018"), default: Boolean(flag?.default) };
    });
    const flagIds = new Set(flags.map((flag) => flag.id));
    rooms.forEach((room) => room.transitions.forEach((transition) => {
      if (transition.requires && !flagIds.has(transition.requires)) transition.requires = '';
      if (transition.sets && !flagIds.has(transition.sets)) transition.sets = '';
    }));
    return {
      version: 2,
      id: typeof source.id === 'string' && source.id.trim() ? source.id : uid('project'),
      template,
      title: typeof source.title === 'string' ? source.title.slice(0, 160) : themes[template].title,
      flags,
      rooms,
      startRoomId,
      updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : now()
    };
  }
  function seedProject(template = 'night') {
    const seed = clone(seeds[template] || seeds.night);
    return normalizeProject({ version: 2, id: uid('project'), template, title: seed.title, flags: seed.flags, rooms: seed.rooms, startRoomId: seed.rooms[0].id });
  }
  function loadProject() {
    const saved = storageGet(projectKey()) || storageGet(legacyProjectKey());
    if (saved) { try { return normalizeProject(JSON.parse(saved)); } catch (_) { announce(t("m095")); } }
    pristineProject = 'pending';
    return seedProject('night');
  }

  function currentRoom() { return state.project?.rooms.find((room) => room.id === state.selectedRoomId) || state.project?.rooms[0]; }
  function flagById(id) { return state.project?.flags.find((flag) => flag.id === id); }
  function flagLabel(id) { return flagById(id)?.label || t("m066"); }
  function capture() { return { project: clone(state.project), selectedRoomId: state.selectedRoomId }; }
  function restore(snapshot) {
    state.historyMute = true; state.project = normalizeProject(snapshot.project); state.selectedRoomId = state.project.rooms.some((room) => room.id === snapshot.selectedRoomId) ? snapshot.selectedRoomId : state.project.rooms[0].id; state.historyMute = false; scheduleSave(); renderEditor();
  }
  function recordHistory() {
    pristineProject = null;
    if (state.historyMute) return;
    state.historyPast.push(capture()); if (state.historyPast.length > state.maxHistory) state.historyPast.shift(); state.historyFuture = [];
    updateActionAvailability();
  }
  function undo() { if (!state.historyPast.length) return announce(t("m094")); const previous = state.historyPast.pop(); state.historyFuture.push(capture()); restore(previous); announce(t("m093")); }
  function redo() { if (!state.historyFuture.length) return announce(t("m092")); const next = state.historyFuture.pop(); state.historyPast.push(capture()); restore(next); announce(t("m091")); }
  function mutate(fn, message = '') { recordHistory(); fn(); state.project = normalizeProject(state.project); if (pristineProject === 'pending') rememberPristine(); scheduleSave(); renderEditor(); if (message) announce(message); }
  function hasAuthoredData() {
    const template = themes[state.project?.template] ? state.project.template : 'night';
    const base = seedProject(template); base.id = state.project.id;
    return JSON.stringify({ ...state.project, updatedAt: '' }) !== JSON.stringify({ ...base, updatedAt: '' });
  }
  function applyTheme() { const theme = themes[state.project.template] || themes.night; document.body.className = [theme.body, state.mode === 'play' ? 'is-play-mode' : ''].filter(Boolean).join(' '); document.title = `${state.project.title || theme.title} · room room`; }

  function validateProject(project = state.project) {
    const errors = [], warnings = []; if (!project || !Array.isArray(project.rooms)) return { errors: [{ code: 'rooms', message: t("m090") }], warnings: [] };
    const roomIds = new Set(); const flags = Array.isArray(project.flags) ? project.flags : []; const flagIds = new Set();
    if (project.rooms.length < 3 || project.rooms.length > 7) errors.push({ code: 'room-count', message: t("m089") });
    if (!String(project.title || '').trim()) errors.push({ code: 'project-title', message: t("m088") });
    flags.forEach((flag) => { if (!String(flag.label || '').trim()) errors.push({ code: 'flag-label', message: t("m087"), flagId: flag.id }); if (flagIds.has(flag.id)) errors.push({ code: 'duplicate-flag', message: t("m086"), flagId: flag.id }); flagIds.add(flag.id); });
    project.rooms.forEach((room) => {
      if (roomIds.has(room.id)) errors.push({ code: 'duplicate-room', message: t("m085"), roomId: room.id }); roomIds.add(room.id);
      if (!String(room.title || '').trim()) errors.push({ code: 'room-title', message: t("m084"), roomId: room.id });
      (Array.isArray(room.transitions) ? room.transitions : []).forEach((transition) => {
        if (!String(transition.label || '').trim()) errors.push({ code: 'transition-label', message: t("m083"), roomId: room.id, transitionId: transition.id });
        if (!transition.target) errors.push({ code: 'empty-target', message: t("m082"), roomId: room.id, transitionId: transition.id });
        else if (!roomIds.has(transition.target) && !project.rooms.some((candidate) => candidate.id === transition.target)) errors.push({ code: 'invalid-target', message: t("m081"), roomId: room.id, transitionId: transition.id });
        if (transition.requires && !flagIds.has(transition.requires)) errors.push({ code: 'invalid-requires', message: t("m080"), roomId: room.id, transitionId: transition.id });
        if (transition.sets && !flagIds.has(transition.sets)) errors.push({ code: 'invalid-sets', message: t("m079"), roomId: room.id, transitionId: transition.id });
      });
    });
    const start = project.rooms.find((room) => room.id === project.startRoomId);
    if (!start) errors.push({ code: 'start', message: t("m078") });
    const reachable = new Set(start ? [start.id] : []); const queue = start ? [start] : [];
    while (queue.length) { const room = queue.shift(); (Array.isArray(room.transitions) ? room.transitions : []).forEach((transition) => { const target = project.rooms.find((candidate) => candidate.id === transition.target); if (target && !reachable.has(target.id)) { reachable.add(target.id); queue.push(target); } }); }
    project.rooms.filter((room) => !reachable.has(room.id)).forEach((room) => warnings.push({ code: 'unreachable', message: t("m077", [room.title || t("m055")]), roomId: room.id }));
    project.rooms.filter((room) => !(Array.isArray(room.transitions) && room.transitions.length)).forEach((room) => warnings.push({ code: 'dead-end', message: t("m076", [room.title || t("m055")]), roomId: room.id }));
    const usedFlags = new Set(); project.rooms.forEach((room) => (Array.isArray(room.transitions) ? room.transitions : []).forEach((transition) => { if (transition.requires) usedFlags.add(transition.requires); if (transition.sets) usedFlags.add(transition.sets); }));
    flags.filter((flag) => !usedFlags.has(flag.id)).forEach((flag) => warnings.push({ code: 'unused-flag', message: t("m075", [flag.label || t("m055")]), flagId: flag.id }));
    return { errors, warnings, reachable };
  }

  function routeDiagnostics(project = state.project) {
    if (!project || !Array.isArray(project.rooms)) {
      return { reachableRooms: [], unreachableRooms: [], deadEnds: [], blockedTransitions: [], unusedFlags: [], transitionCount: 0 };
    }
    const roomsById = new Map(project.rooms.map((room) => [room.id, room]));
    const flagsById = new Map((project.flags || []).map((flag) => [flag.id, flag]));
    const defaults = defaultFlags(project);
    const reachable = new Set();
    const visitedStates = new Set();
    const queue = [];
    if (roomsById.has(project.startRoomId)) queue.push({ id: project.startRoomId, flags: defaults });

    while (queue.length) {
      const current = queue.shift();
      const stateKey = `${current.id}|${Object.keys(current.flags).sort().map((id) => `${id}:${current.flags[id] ? 1 : 0}`).join(',')}`;
      if (visitedStates.has(stateKey)) continue;
      visitedStates.add(stateKey);
      reachable.add(current.id);
      const room = roomsById.get(current.id);
      (room?.transitions || []).forEach((transition) => {
        const target = roomsById.get(transition.target);
        if (!target || (transition.requires && !current.flags[transition.requires])) return;
        const nextFlags = { ...current.flags };
        if (transition.sets && flagsById.has(transition.sets)) nextFlags[transition.sets] = true;
        queue.push({ id: target.id, flags: nextFlags });
      });
    }

    const settableFlags = new Set();
    const blockedTransitions = [];
    let transitionCount = 0;
    project.rooms.forEach((room) => room.transitions.forEach((transition) => {
      transitionCount += 1;
      if (reachable.has(room.id) && transition.sets && flagsById.has(transition.sets)) settableFlags.add(transition.sets);
    }));
    project.rooms.forEach((room) => room.transitions.forEach((transition) => {
      if (reachable.has(room.id) && transition.requires && flagsById.has(transition.requires) && !flagsById.get(transition.requires).default && !settableFlags.has(transition.requires)) {
        blockedTransitions.push({ roomId: room.id, transitionId: transition.id, message: t("m074", [transition.label || t("m055")]) });
      }
    }));

    const unusedFlags = (project.flags || []).filter((flag) => !project.rooms.some((room) => room.transitions.some((transition) => transition.requires === flag.id || transition.sets === flag.id))).map((flag) => flag.id);
    const deadEnds = project.rooms.filter((room) => !room.transitions.length).map((room) => room.id);
    const unreachableRooms = project.rooms.filter((room) => !reachable.has(room.id)).map((room) => room.id);
    return { reachableRooms: [...reachable], unreachableRooms, deadEnds, blockedTransitions, unusedFlags, transitionCount };
  }
  function renderValidation() {
    const node = $('projectHealth'); const summary = $('validationSummary'); const report = validateProject();
    const diagnostics = routeDiagnostics();
    if (node) {
      const issue = report.errors[0] || report.warnings[0] || diagnostics.blockedTransitions[0];
      const hasDiagnosticWarning = !report.errors.length && !report.warnings.length && diagnostics.blockedTransitions.length > 0;
      node.textContent = report.errors.length ? t("m073", [report.errors.length]) : report.warnings.length ? t("m072", [report.warnings.length]) : hasDiagnosticWarning ? t("m071", [diagnostics.blockedTransitions.length]) : t("m070");
      node.dataset.state = report.errors.length ? 'error' : (report.warnings.length || hasDiagnosticWarning) ? 'warning' : 'ok';
      node.dataset.roomId = issue?.roomId || '';
      node.title = [...report.errors, ...report.warnings, ...diagnostics.blockedTransitions].map((item) => item.message).join('\n');
      node.tabIndex = issue?.roomId ? 0 : -1;
      node.setAttribute('aria-label', issue ? issue.message : t("m070"));
      if (issue?.roomId) node.setAttribute('role', 'button'); else node.removeAttribute('role');
    }
    if (summary) { summary.textContent = report.errors.length ? report.errors[0].message : report.warnings.length ? report.warnings[0].message : diagnostics.blockedTransitions[0]?.message || ''; summary.classList.toggle('is-warning', !report.errors.length && (report.warnings.length > 0 || diagnostics.blockedTransitions.length > 0)); }
    const metrics = $('projectMetrics');
    if (metrics) {
      const roomCount = state.project?.rooms?.length || 0;
      const flagCount = state.project?.flags?.length || 0;
      metrics.textContent = `${roomCount} ${roomCount === 1 ? t("m022") : roomCount < 5 ? t("m060") : t("m059")} · ${diagnostics.transitionCount} ${diagnostics.transitionCount === 1 ? t("m069") : diagnostics.transitionCount < 5 ? t("m068") : t("m067")}${flagCount ? ` · ${flagCount} ${flagCount === 1 ? t("m066") : flagCount < 5 ? t("m065") : t("m064")}` : ''}`;
      metrics.title = diagnostics.unreachableRooms.length ? t("m063", [diagnostics.unreachableRooms.length]) : t("m062");
    }
    const exportButton = $('exportZip'); if (exportButton) { exportButton.disabled = report.errors.length > 0; exportButton.title = report.errors.length ? report.errors[0].message : t("m061"); }
    return report;
  }

  function renderRoomList() {
    const list = $('roomList'); if (!list) return;
    const count = state.project.rooms.length; if ($('roomCount')) $('roomCount').textContent = `${count} ${count === 1 ? t("m022") : count < 5 ? t("m060") : t("m059")}`;
    list.innerHTML = state.project.rooms.map((room, index) => `<li><button class="room-button ${room.id === state.selectedRoomId ? 'is-selected' : ''}" type="button" data-room-id="${esc(room.id)}" aria-current="${room.id === state.selectedRoomId ? 'true' : 'false'}"><span class="room-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${esc(room.title || t("m055"))}</strong><small>${room.id === state.project.startRoomId ? t("m058") : t("m056", [room.transitions.length, room.transitions.length === 1 ? '' : t("m057")])}</small></span></button></li>`).join('');
  }
  function getMapLayout(rooms, width = 800, height = 400) {
    const patterns = { 1: [[50, 50]], 2: [[24, 50], [76, 50]], 3: [[18, 24], [50, 76], [82, 24]], 4: [[19, 22], [81, 22], [81, 78], [19, 78]], 5: [[18, 23], [50, 17], [82, 23], [68, 78], [32, 78]], 6: [[18, 23], [50, 23], [82, 23], [18, 77], [50, 77], [82, 77]], 7: [[14, 22], [38, 15], [62, 15], [86, 22], [78, 80], [50, 86], [22, 80]] };
    const pattern = patterns[Math.min(7, Math.max(1, rooms.length))] || patterns[7];
    return new Map(rooms.map((room, index) => { const fallback = pattern[index] || [50, 50]; const x = Number.isFinite(room.position?.x) ? room.position.x : fallback[0]; const y = Number.isFinite(room.position?.y) ? room.position.y : fallback[1]; return [room.id, { x: clamp(x, 4, 96) / 100 * width, y: clamp(y, 8, 92) / 100 * height, index }]; }));
  }
  function svgRectEndpoint(from, to, halfWidth = 75, halfHeight = 38, padding = 5) { const dx = to.x - from.x; const dy = to.y - from.y; const length = Math.max(1, Math.hypot(dx, dy)); const ux = dx / length; const uy = dy / length; const boundary = Math.min(halfWidth / Math.max(Math.abs(ux), 0.0001), halfHeight / Math.max(Math.abs(uy), 0.0001)) + padding; return { x: from.x + ux * boundary, y: from.y + uy * boundary }; }
  function wrapSvgLabel(value, maxChars = 18, maxLines = 2) { const words = String(value || t("m055")).trim().split(/\s+/).filter(Boolean); const lines = []; let current = ''; words.forEach((word) => { if ((current + (current ? ' ' : '') + word).length <= maxChars || !current) current = `${current}${current ? ' ' : ''}${word}`; else { lines.push(current); current = word; } }); if (current) lines.push(current); const clipped = lines.slice(0, maxLines); if (lines.length > maxLines) clipped[maxLines - 1] = `${clipped[maxLines - 1].slice(0, Math.max(1, maxChars - 1))}…`; return clipped; }
  function shortEdgeLabel(value, maxChars = 17) { const compact = String(value || t("m014")).replace(/\s+/g, ' ').trim(); return compact.length > maxChars ? `${compact.slice(0, maxChars - 1)}…` : compact; }
  function mapPointFromClient(svg, clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return { x: clamp(((clientX - rect.left) / rect.width) * 100, 4, 96), y: clamp(((clientY - rect.top) / rect.height) * 100, 8, 92) };
  }
  function updateMapNodePosition(roomId, position) {
    const node = q('[data-map-room]').find((candidate) => candidate.dataset.mapRoom === roomId);
    if (!node) return;
    const x = (position.x / 100) * 800 - 85;
    const y = (position.y / 100) * 400 - 45;
    node.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
  }

  function renderMap() {
    const svg = $('mapSvg'); const edgeLayer = $('mapEdges'); const nodeLayer = $('mapNodes'); if (!svg || !edgeLayer || !nodeLayer) return;
    const width = 800; const height = 400; const nodeWidth = 170; const nodeHeight = 90; const coords = getMapLayout(state.project.rooms, width, height); svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const markerPath = svg.querySelector?.('#arrowhead path'); if (markerPath) markerPath.setAttribute('fill', 'var(--accent)'); const grid = $('mapGrid'); if (grid) grid.innerHTML = Array.from({ length: 21 }, (_, x) => Array.from({ length: 11 }, (_, y) => `<circle cx="${x * 40}" cy="${y * 40}" r="1"/>`).join('')).join(''); if ($('mapEmpty')) $('mapEmpty').hidden = state.project.rooms.length > 0;
    const edges = []; state.project.rooms.forEach((room) => room.transitions.forEach((transition) => { const a = coords.get(room.id); const b = coords.get(transition.target); if (a && b && room.id !== transition.target) edges.push({ a, b, room, transition }); }));
    const pairBuckets = new Map(); edges.forEach((edge) => { const key = [edge.room.id, edge.transition.target].sort().join('|'); if (!pairBuckets.has(key)) pairBuckets.set(key, []); pairBuckets.get(key).push(edge); });
    edgeLayer.innerHTML = edges.map((edge) => { const { a, b, transition, room } = edge; const dx = b.x - a.x; const dy = b.y - a.y; const length = Math.max(1, Math.hypot(dx, dy)); const nx = -dy / length; const ny = dx / length; const pair = pairBuckets.get([room.id, transition.target].sort().join('|')) || [edge]; const lane = pair.length > 1 ? pair.indexOf(edge) - (pair.length - 1) / 2 : 0; const direction = room.id < transition.target ? 1 : -1; const bend = lane * 44 * direction; const start = svgRectEndpoint(a, b, nodeWidth / 2, nodeHeight / 2); const end = svgRectEndpoint(b, a, nodeWidth / 2, nodeHeight / 2); const midX = (start.x + end.x) / 2 + nx * bend; const midY = (start.y + end.y) / 2 + ny * bend; const path = bend ? `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}` : `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`; const locked = Boolean(transition.requires); const fullLabel = `${transition.label || t("m014")}${locked ? t("m054", [flagLabel(transition.requires)]) : ''}`; const label = shortEdgeLabel(transition.label); const labelWidth = Math.max(30, label.length * 6 + 16); const pairLabelWidth = Math.max(...pair.map((item) => shortEdgeLabel(item.transition.label).length * 6 + 16)); const spacing = Math.min((pairLabelWidth / 2 + 8) / Math.max(Math.abs(nx), .001), 14 / Math.max(Math.abs(ny), .001)); const labelOffset = pair.length > 1 ? lane * 2 * spacing * direction : 14; const labelX = (start.x + end.x) / 2 + nx * labelOffset; const labelY = (start.y + end.y) / 2 + ny * labelOffset; return `<g class="edge-group" data-edge-from="${esc(room.id)}" data-edge-to="${esc(transition.target)}" aria-label="${esc(fullLabel)}"><path class="edge-line ${locked ? 'is-locked' : ''}" d="${path}" marker-end="url(#arrowhead)"><title>${esc(fullLabel)}</title></path><g class="edge-label" transform="translate(${labelX.toFixed(1)} ${labelY.toFixed(1)})" aria-hidden="true"><rect x="${(-labelWidth / 2).toFixed(1)}" y="-10" width="${labelWidth.toFixed(1)}" height="18" fill="var(--surface)" opacity=".92"></rect><text x="0" y="2" text-anchor="middle" fill="var(--muted)" font-family="var(--mono)" font-size="10">${esc(label)}</text></g></g>`; }).join('');
    nodeLayer.innerHTML = state.project.rooms.map((room, index) => { const c = coords.get(room.id); const selected = room.id === state.selectedRoomId; const x = c.x - nodeWidth / 2; const y = c.y - nodeHeight / 2; const titleMarkup = wrapSvgLabel(room.title).map((line, lineIndex) => `<tspan x="10" dy="${lineIndex ? 17 : 0}">${esc(line)}</tspan>`).join(''); const coord = (themes[state.project.template] || themes.night).coords[index] || `x ${index + 1}° · y ${index + 1}°`; return t("m053", [selected ? 'is-selected' : '', esc(room.id), index + 1, esc(room.title), x.toFixed(1), y.toFixed(1), esc(room.title), nodeWidth, nodeHeight, room.id === state.project.startRoomId ? `<circle class="start-ring" cx="${nodeWidth - 12}" cy="11" r="5"></circle>` : '', String(index + 1).padStart(2, '0'), titleMarkup, esc(coord)]); }).join('');
    const fallback = $('mapFallbackList'); if (fallback) fallback.innerHTML = state.project.rooms.map((room, index) => `<li class="${room.id === state.selectedRoomId ? 'is-current' : ''}"><button class="text-button" type="button" data-room-id="${esc(room.id)}">${String(index + 1).padStart(2, '0')} · ${esc(room.title)}</button></li>`).join('');
  }

  function renderInspector() {
    const room = currentRoom(); if (!room) return; const index = state.project.rooms.indexOf(room) + 1;
    if ($('inspectorRoomNo')) $('inspectorRoomNo').textContent = String(index).padStart(2, '0'); if ($('roomTitle')) $('roomTitle').value = room.title; if ($('roomBody')) $('roomBody').value = room.body; if ($('roomAlt')) $('roomAlt').value = room.image?.alt || ''; if ($('imageMeta')) $('imageMeta').hidden = !room.image?.src; if ($('imageName')) $('imageName').textContent = room.image?.name || t("m052");
    const flagList = $('flagList'); if (flagList) flagList.innerHTML = state.project.flags.length ? state.project.flags.map((flag) => t("m051", [esc(flag.label), esc(flag.id), flag.default ? 'checked' : '', esc(flag.id), esc(flag.id)])).join('') : t("m050");
    const transitionList = $('transitionList'); if (transitionList) transitionList.innerHTML = room.transitions.map((transition, transitionIndex) => { const options = t("m049", [state.project.rooms.filter((candidate) => candidate.id !== room.id).map((candidate) => `<option value="${esc(candidate.id)}" ${candidate.id === transition.target ? 'selected' : ''}>${esc(candidate.title)}</option>`).join('')]); const flags = t("m047", [state.project.flags.map((flag) => t("m048", [esc(flag.id), flag.id === transition.requires ? 'selected' : '', esc(flag.label)])).join('')]); const sets = t("m045", [state.project.flags.map((flag) => t("m046", [esc(flag.id), flag.id === transition.sets ? 'selected' : '', esc(flag.label)])).join('')]); return t("m044", [String(transitionIndex + 1).padStart(2, '0'), esc(transition.id), esc(transition.label), esc(transition.id), esc(transition.id), options, esc(transition.id), flags, esc(transition.id), sets]); }).join('');
    renderValidation();
  }
  function renderEditor() { applyTheme(); renderRoomList(); renderMap(); renderInspector(); renderPreview(); if ($('projectTitle')) $('projectTitle').value = state.project.title; q('.template-card').forEach((card) => { const selected = card.dataset.template === state.project.template; card.classList.toggle('is-selected', selected); card.setAttribute('aria-pressed', String(selected)); const check = card.querySelector('.template-check'); if (check) check.textContent = selected ? '✓' : '↗'; }); updateActionAvailability(); }
  function updateActionAvailability() { const room = currentRoom(); const report = validateProject(); const set = (id, disabled) => { const node = $(id); if (node) node.disabled = Boolean(disabled); }; set('undoAction', !state.historyPast.length); set('redoAction', !state.historyFuture.length); set('makeStart', !room || room.id === state.project.startRoomId); set('duplicateRoom', state.project.rooms.length >= 7); set('deleteRoom', state.project.rooms.length <= 3); set('playFromRoom', !room); set('exportZip', report.errors.length > 0); }

  function defaultFlags(project = state.project) { return Object.fromEntries(project.flags.map((flag) => [flag.id, Boolean(flag.default)])); }
  function reachableRooms(project = state.project) {
    const diagnostics = routeDiagnostics(project);
    return new Set(diagnostics.reachableRooms.length ? diagnostics.reachableRooms : (project?.startRoomId ? [project.startRoomId] : []));
  }
  function normalizeProgress(input, project = state.project) {
    const known = new Set(project.rooms.map((room) => room.id)); const start = known.has(project.startRoomId) ? project.startRoomId : project.rooms[0]?.id; const raw = input && typeof input === 'object' ? input : {}; const currentRoomId = known.has(raw.currentRoomId) ? raw.currentRoomId : start; const visited = Array.isArray(raw.visited) ? raw.visited.filter((id, index, arr) => known.has(id) && arr.indexOf(id) === index) : []; if (start && !visited.includes(start)) visited.unshift(start); const flags = defaultFlags(project); if (raw.flags && typeof raw.flags === 'object') project.flags.forEach((flag) => { if (Object.prototype.hasOwnProperty.call(raw.flags, flag.id)) flags[flag.id] = Boolean(raw.flags[flag.id]); }); const diagnostics = routeDiagnostics(project); const reachable = new Set(diagnostics.reachableRooms); const completed = Boolean(reachable.size) && diagnostics.unreachableRooms.length === 0 && [...reachable].every((id) => visited.includes(id)); return { projectId: project.id, currentRoomId, visited, flags, completed };
  }
  function loadProgress() { try { const stored = storageGet(progressKey()); return normalizeProgress(stored ? JSON.parse(stored) : null); } catch (_) { return normalizeProgress(null); } }
  function saveProgress() { if (state.play) storageSet(progressKey(), JSON.stringify(state.play)); }
  function renderRoomImage(container, room) {
    if (!container) return;
    container.replaceChildren();
    if (room.image?.src) {
      const img = document.createElement('img');
      img.src = room.image.src; img.alt = room.image.alt || '';
      container.append(img); container.removeAttribute('aria-hidden');
    } else {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 640 320');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', `#art-${state.project.template}`);
      svg.append(use); container.append(svg); container.setAttribute('aria-hidden', 'true');
    }
  }
  function renderPreview() {
    const room = currentRoom(); if (!room) return;
    if ($('previewTitle')) $('previewTitle').textContent = room.title || t("m043");
    if ($('previewBody')) $('previewBody').textContent = room.body || t("m042");
    renderRoomImage($('previewImage'), room);
  }
  function sceneImageUpdate(room) { renderRoomImage($('sceneImage'), room); }
  function renderCompletion() { const panel = $('completionPanel'); if (panel) panel.hidden = !state.play?.completed; }
  function renderPlay() {
    state.play = normalizeProgress(state.play); const play = state.play; const room = state.project.rooms.find((candidate) => candidate.id === play.currentRoomId) || state.project.rooms[0]; const index = state.project.rooms.indexOf(room); const theme = themes[state.project.template] || themes.night;
    if ($('playStatus')) $('playStatus').textContent = t("m041", [String(index + 1).padStart(2, '0')]); if ($('playProgress')) $('playProgress').textContent = t("m040", [String(play.visited.length).padStart(2, '0'), String(reachableRooms().size).padStart(2, '0')]); if ($('playProgressBar')) $('playProgressBar').style.width = `${Math.round((play.visited.length / Math.max(1, reachableRooms().size)) * 100)}%`; if ($('sceneRoomNo')) $('sceneRoomNo').textContent = String(index + 1).padStart(2, '0'); if ($('sceneCoords')) $('sceneCoords').textContent = theme.coords[index] || `x ${index + 1}° · y ${index + 1}°`; if ($('sceneTitle')) $('sceneTitle').textContent = room.title; if ($('sceneBody')) $('sceneBody').textContent = room.body; sceneImageUpdate(room);
    if ($('playRoomList')) $('playRoomList').innerHTML = state.project.rooms.map((candidate, i) => `<li class="${candidate.id === room.id ? 'is-current' : ''} ${play.visited.includes(candidate.id) ? 'is-visited' : ''}">${String(i + 1).padStart(2, '0')} · ${esc(candidate.title)}</li>`).join('');
    if ($('sceneActions')) $('sceneActions').innerHTML = room.transitions.map((transition) => { const target = state.project.rooms.find((candidate) => candidate.id === transition.target); const locked = Boolean(transition.requires && !play.flags[transition.requires]); const invalid = !target; const reason = locked ? t("m039", [flagLabel(transition.requires)]) : invalid ? t("m038") : `→ ${target.title}`; return `<button type="button" class="scene-action ${locked || invalid ? 'is-locked' : ''}" data-play-transition="${esc(transition.id)}" ${locked || invalid ? 'disabled' : ''} aria-disabled="${locked || invalid ? 'true' : 'false'}"><strong>${esc(transition.label || t("m014"))}</strong><small>${esc(reason)}</small></button>`; }).join('') || t("m037");
    if ($('sceneHint')) $('sceneHint').textContent = play.completed ? t("m036") : t("m035", [play.visited.length, reachableRooms().size]); renderCompletion(); saveProgress();
  }
  function setMode(mode, roomId = null, updateHash = true) {
    state.mode = mode;
    const playing = mode === 'play';
    document.body.classList.toggle('is-play-mode', playing);
    if ($('editorView')) $('editorView').hidden = playing;
    if ($('playView')) $('playView').hidden = !playing;
    if ($('projectTitle')) $('projectTitle').disabled = playing;
    if ($('exportZip')) $('exportZip').disabled = playing || validateProject().errors.length > 0;
    q('.mode-button').forEach((button) => { button.classList.toggle('is-active', button.dataset.mode === mode); button.setAttribute('aria-pressed', String(button.dataset.mode === mode)); });
    if (playing) {
      state.play = loadProgress();
      if (roomId && state.project.rooms.some((room) => room.id === roomId)) {
        state.play.currentRoomId = roomId;
        if (!state.play.visited.includes(roomId)) state.play.visited.push(roomId);
        state.play.completed = false;
      }
      renderPlay();
      if (updateHash) history.replaceState(null, '', `#/play/${encodeURIComponent(state.play.currentRoomId)}`);
      setTimeout(() => $('roomScene')?.focus(), 0);
    } else if (updateHash && location.hash.startsWith('#/play/')) {
      history.replaceState(null, '', '#/edit');
    }
  }
  function selectRoom(id) { if (!state.project.rooms.some((room) => room.id === id)) return; state.selectedRoomId = id; renderEditor(); }
  function updateTransition(event) { const id = event.target.dataset.transitionId; const field = event.target.dataset.transitionField; if (!id || !field) return; const transition = currentRoom().transitions.find((candidate) => candidate.id === id); if (!transition) return; if (event.type === 'input' && state.transitionHistoryCapturedId !== id) { recordHistory(); state.transitionHistoryCapturedId = id; setTimeout(() => { if (state.transitionHistoryCapturedId === id) state.transitionHistoryCapturedId = null; }, 400); } if (event.type === 'change' && event.target.tagName === 'SELECT' && state.transitionHistoryCapturedId !== id) recordHistory(); transition[field] = event.target.value; if (event.type === 'change') state.transitionHistoryCapturedId = null; scheduleSave(); if (field === 'label' || field === 'target' || field === 'requires' || field === 'sets') { renderMap(); renderValidation(); } }

  function bindEvents() {
    $('projectHealth')?.addEventListener('click', (event) => { const id = event.currentTarget.dataset.roomId; if (id) selectRoom(id); }); $('projectHealth')?.addEventListener('keydown', (event) => { if ((event.key === 'Enter' || event.key === ' ') && event.currentTarget.dataset.roomId) { event.preventDefault(); selectRoom(event.currentTarget.dataset.roomId); } });
    $('projectTitle')?.addEventListener('input', (event) => { if (!state.titleHistoryCaptured) { recordHistory(); state.titleHistoryCaptured = true; } state.project.title = event.target.value; scheduleSave(); applyTheme(); renderValidation(); setTimeout(() => { state.titleHistoryCaptured = false; }, 400); });
    $('templateGrid')?.addEventListener('click', (event) => { const button = event.target.closest('[data-template]'); if (!button) return; if (hasAuthoredData() && !window.confirm(t("m034"))) return; mutate(() => { state.project = seedProject(button.dataset.template); pristineProject = 'pending'; state.selectedRoomId = state.project.rooms[0].id; state.play = null; }, t("m033")); });
    $('roomList')?.addEventListener('click', (event) => { const button = event.target.closest('[data-room-id]'); if (button) selectRoom(button.dataset.roomId); }); $('mapFallbackList')?.addEventListener('click', (event) => { const button = event.target.closest('[data-room-id]'); if (button) selectRoom(button.dataset.roomId); });
    $('mapSvg')?.addEventListener('click', (event) => { const node = event.target.closest('[data-map-room]'); if (node && !state.mapDragSuppressClick) selectRoom(node.dataset.mapRoom); state.mapDragSuppressClick = false; });
    $('mapSvg')?.addEventListener('pointerdown', (event) => {
      const node = event.target.closest('[data-map-room]');
      if (!node || event.button !== 0) return;
      const room = state.project.rooms.find((candidate) => candidate.id === node.dataset.mapRoom);
      const point = mapPointFromClient($('mapSvg'), event.clientX, event.clientY);
      if (!room || !point) return;
      state.mapDrag = { roomId: room.id, start: point, moved: false };
      node.classList.add('is-dragging');
      node.setPointerCapture?.(event.pointerId);
    });
    $('mapSvg')?.addEventListener('pointermove', (event) => {
      if (!state.mapDrag) return;
      const point = mapPointFromClient($('mapSvg'), event.clientX, event.clientY);
      const room = state.project.rooms.find((candidate) => candidate.id === state.mapDrag.roomId);
      if (!point || !room) return;
      if (!state.mapDrag.moved && Math.hypot(point.x - state.mapDrag.start.x, point.y - state.mapDrag.start.y) > 1) { recordHistory(); state.mapDrag.moved = true; }
      if (!state.mapDrag.moved) return;
      room.position = point;
      updateMapNodePosition(room.id, point);
      $('mapSvg')?.classList.add('is-dragging');
    });
    const finishMapDrag = () => {
      if (!state.mapDrag) return;
      const room = state.project.rooms.find((candidate) => candidate.id === state.mapDrag.roomId);
      const moved = state.mapDrag.moved;
      state.mapDrag = null;
      $('mapSvg')?.classList.remove('is-dragging');
      q('[data-map-room].is-dragging').forEach((node) => node.classList.remove('is-dragging'));
      if (moved && room) {
        state.mapDragSuppressClick = true;
        state.project = normalizeProject(state.project);
        scheduleSave();
        renderMap();
        const movedNode = [...($('mapSvg')?.querySelectorAll('[data-map-room]') || [])].find((node) => node.dataset.mapRoom === room.id);
        movedNode?.focus();
        updateActionAvailability();
        announce(t("m032"));
      }
    };
    $('mapSvg')?.addEventListener('pointerup', finishMapDrag); $('mapSvg')?.addEventListener('pointercancel', finishMapDrag); $('mapSvg')?.addEventListener('lostpointercapture', finishMapDrag);
    $('mapSvg')?.addEventListener('keydown', (event) => {
      const node = event.target.closest('[data-map-room]');
      if (!node) return;
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectRoom(node.dataset.mapRoom); return; }
      const direction = { ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, -3], ArrowDown: [0, 3] }[event.key];
      if (!direction) return;
      event.preventDefault();
      const room = state.project.rooms.find((candidate) => candidate.id === node.dataset.mapRoom);
      if (!room) return;
      recordHistory(); room.position = { x: clamp((room.position?.x || 50) + direction[0], 4, 96), y: clamp((room.position?.y || 50) + direction[1], 8, 92) }; state.project = normalizeProject(state.project); scheduleSave(); renderMap(); updateActionAvailability(); const movedNode = [...($('mapSvg')?.querySelectorAll('[data-map-room]') || [])].find((candidate) => candidate.dataset.mapRoom === room.id); movedNode?.focus(); announce(t("m032"));
    });
    $('roomTitle')?.addEventListener('input', (event) => { if (state.roomHistoryCapturedId !== currentRoom().id) { recordHistory(); state.roomHistoryCapturedId = currentRoom().id; } currentRoom().title = event.target.value; scheduleSave(); renderRoomList(); renderMap(); renderPreview(); renderValidation(); }); $('roomTitle')?.addEventListener('blur', () => { state.roomHistoryCapturedId = null; });
    $('roomBody')?.addEventListener('input', (event) => { if (state.roomHistoryCapturedId !== currentRoom().id) { recordHistory(); state.roomHistoryCapturedId = currentRoom().id; } currentRoom().body = event.target.value; scheduleSave(); renderPreview(); }); $('roomBody')?.addEventListener('blur', () => { state.roomHistoryCapturedId = null; });
    $('roomAlt')?.addEventListener('input', (event) => { currentRoom().image.alt = event.target.value; scheduleSave(); renderPreview(); });
    $('roomImage')?.addEventListener('change', (event) => { const file = event.target.files?.[0]; if (!file) return; if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 8 * 1024 * 1024) { announce(t("m031")); event.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => { mutate(() => { currentRoom().image = { src: String(reader.result), name: file.name, alt: currentRoom().image?.alt || file.name }; }, t("m030")); }; reader.readAsDataURL(file); });
    $('removeImage')?.addEventListener('click', () => { mutate(() => { currentRoom().image = { src: '', name: '', alt: '' }; }, t("m029")); if ($('roomImage')) $('roomImage').value = ''; });
    $('addRoom')?.addEventListener('click', () => { if (state.project.rooms.length >= 7) return announce(t("m023")); mutate(() => { const index = state.project.rooms.length; const room = { id: uid('room'), title: t("m028", [String(index + 1).padStart(2, '0')]), body: '', image: { src: '', name: '', alt: '' }, position: { x: defaults.x[index] || 50, y: defaults.y[index] || 50 }, transitions: [], start: false }; state.project.rooms.push(room); state.selectedRoomId = room.id; }, t("m027")); });
    $('deleteRoom')?.addEventListener('click', () => { if (state.project.rooms.length <= 3) return announce(t("m026")); if (!window.confirm(t("m025"))) return; const removed = state.selectedRoomId; mutate(() => { state.project.rooms = state.project.rooms.filter((room) => room.id !== removed); state.project.rooms.forEach((room) => room.transitions.forEach((transition) => { if (transition.target === removed) transition.target = ''; })); if (state.project.startRoomId === removed) state.project.startRoomId = state.project.rooms[0].id; state.selectedRoomId = state.project.rooms[0].id; }, t("m024")); });
    $('duplicateRoom')?.addEventListener('click', () => { if (state.project.rooms.length >= 7) return announce(t("m023")); const room = currentRoom(); mutate(() => { const copy = clone(room); copy.id = uid('room'); copy.title = t("m021", [room.title || t("m022")]); copy.start = false; copy.position = { x: clamp((room.position?.x || 50) + 8, 4, 96), y: clamp((room.position?.y || 50) + 8, 8, 92) }; copy.transitions = copy.transitions.map((transition) => ({ ...transition, id: uid('trans') })); state.project.rooms.push(copy); state.selectedRoomId = copy.id; }, t("m020")); });
    $('makeStart')?.addEventListener('click', () => mutate(() => { state.project.startRoomId = state.selectedRoomId; }, t("m019")));
    $('playFromRoom')?.addEventListener('click', () => setMode('play', state.selectedRoomId));
    $('previewPlay')?.addEventListener('click', () => setMode('play', state.selectedRoomId));
    $('tryRoute')?.addEventListener('click', () => { resetProgress(); setMode('play', state.project.startRoomId); });
    $('addFlag')?.addEventListener('click', () => mutate(() => { state.project.flags.push({ id: uid('flag'), label: t("m018"), default: false }); }, t("m017")));
    $('flagList')?.addEventListener('input', (event) => { const id = event.target.dataset.flagLabel; if (!id) return; const flag = flagById(id); if (flag) { if (state.flagHistoryCapturedId !== id) { recordHistory(); state.flagHistoryCapturedId = id; } flag.label = event.target.value; scheduleSave(); renderMap(); renderValidation(); } }); $('flagList')?.addEventListener('change', (event) => { const id = event.target.dataset.flagDefault; if (!id) return; const flag = flagById(id); if (flag) { recordHistory(); flag.default = event.target.checked; state.flagHistoryCapturedId = null; scheduleSave(); renderValidation(); } }); $('flagList')?.addEventListener('blur', (event) => { if (event.target.dataset.flagLabel) state.flagHistoryCapturedId = null; }, true); $('flagList')?.addEventListener('click', (event) => { const button = event.target.closest('[data-remove-flag]'); if (!button) return; mutate(() => { const id = button.dataset.removeFlag; state.project.flags = state.project.flags.filter((flag) => flag.id !== id); state.project.rooms.forEach((room) => room.transitions.forEach((transition) => { if (transition.requires === id) transition.requires = ''; if (transition.sets === id) transition.sets = ''; })); }, t("m016")); renderInspector(); });
    $('addTransition')?.addEventListener('click', () => { const room = currentRoom(); if (room.transitions.length >= 3) return announce(t("m015")); mutate(() => room.transitions.push({ id: uid('trans'), label: t("m014"), target: '', requires: '', sets: '' }), t("m013")); });
    $('transitionList')?.addEventListener('input', updateTransition); $('transitionList')?.addEventListener('change', updateTransition); $('transitionList')?.addEventListener('click', (event) => { const button = event.target.closest('[data-remove-transition]'); if (!button) return; mutate(() => { currentRoom().transitions = currentRoom().transitions.filter((transition) => transition.id !== button.dataset.removeTransition); }, t("m012")); });
    q('.mode-button').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode))); $('backToMap')?.addEventListener('click', () => setMode('edit')); $('playReset')?.addEventListener('click', resetProgress); $('resetProgress')?.addEventListener('click', resetProgress); $('completionReset')?.addEventListener('click', resetProgress); $('completionMap')?.addEventListener('click', () => setMode('edit'));
    $('sceneActions')?.addEventListener('click', (event) => { const button = event.target.closest('[data-play-transition]'); if (!button || button.disabled) return; const room = state.project.rooms.find((candidate) => candidate.id === state.play.currentRoomId); const transition = room?.transitions.find((candidate) => candidate.id === button.dataset.playTransition); const target = transition && state.project.rooms.find((candidate) => candidate.id === transition.target); if (!transition || !target || (transition.requires && !state.play.flags[transition.requires])) return; if (transition.sets) state.play.flags[transition.sets] = true; if (!state.play.visited.includes(room.id)) state.play.visited.push(room.id); state.play.currentRoomId = target.id; if (!state.play.visited.includes(target.id)) state.play.visited.push(target.id); state.play.completed = [...reachableRooms()].every((id) => state.play.visited.includes(id)); saveProgress(); if (location.hash.startsWith('#/play/')) history.pushState(null, '', `#/play/${encodeURIComponent(target.id)}`); renderPlay(); $('roomScene')?.focus(); });
    q('.mobile-tab').forEach((tab) => tab.addEventListener('click', () => { q('.mobile-tab').forEach((item) => { item.classList.toggle('is-active', item === tab); item.setAttribute('aria-selected', item === tab ? 'true' : 'false'); }); q('.desk-panel').forEach((panel) => { const active = panel.dataset.panel === tab.dataset.panel; panel.classList.toggle('is-mobile-active', active); }); }));
    $('exportZip')?.addEventListener('click', exportZip); $('newProject')?.addEventListener('click', () => { if (hasAuthoredData() && !window.confirm(t("m011"))) return; mutate(() => { state.project = seedProject('night'); pristineProject = 'pending'; state.selectedRoomId = state.project.rooms[0].id; state.play = null; }, t("m010")); }); $('openProject')?.addEventListener('click', () => $('projectFile')?.click()); $('projectFile')?.addEventListener('change', importJson); $('saveJson')?.addEventListener('click', exportJson); $('undoAction')?.addEventListener('click', undo); $('redoAction')?.addEventListener('click', redo);
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && state.mode === 'play') setMode('edit'); if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveProjectNow(); announce(t("m009")); } if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); } });
  }
  function resetProgress() { storageRemove(progressKey()); state.play = normalizeProgress(null); if (state.mode === 'play') renderPlay(); announce(t("m008")); }
  function exportJson() { saveProjectNow(); const blob = new Blob([JSON.stringify(state.project, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${slugify(state.project.title)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); announce(t("m007")); }
  function importJson(event) { const file = event.target.files?.[0]; if (!file) return; if (file.size > MAX_IMPORT_BYTES) { announce(t("m006")); event.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => { try { const imported = normalizeProject(JSON.parse(String(reader.result))); recordHistory(); state.project = imported; state.selectedRoomId = imported.rooms[0].id; state.play = null; scheduleSave(); renderEditor(); announce(t("m005")); } catch (_) { announce(t("m004")); } event.target.value = ''; }; reader.readAsText(file); }

  const crcTable = (() => { const table = []; for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; } return table; })();
  function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0; }
  function u16(value) { return Uint8Array.from([value & 255, (value >>> 8) & 255]); } function u32(value) { return Uint8Array.from([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]); }
  function concatBytes(...parts) { const total = parts.reduce((sum, part) => sum + part.length, 0); const result = new Uint8Array(total); let offset = 0; parts.forEach((part) => { result.set(part, offset); offset += part.length; }); return result; }
  function zip(entries) { const encoder = new TextEncoder(); const localChunks = []; const centralChunks = []; let offset = 0; entries.forEach((entry) => { const name = encoder.encode(entry.name); const data = entry.bytes; const crc = crc32(data); const local = concatBytes(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data); const central = concatBytes(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name); localChunks.push(local); centralChunks.push(central); offset += local.length; }); const central = concatBytes(...centralChunks); const end = concatBytes(u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(central.length), u32(offset), u16(0)); return new Blob([concatBytes(...localChunks), central, end], { type: 'application/zip' }); }
  function dataBytes(dataUrl) { try { const match = String(dataUrl).match(/^data:[^;,]+(?:;[^,]*)?,(.*)$/s); if (!match) return null; const payload = match[1]; if (String(dataUrl).includes(';base64,')) { const binary = atob(payload); const bytes = new Uint8Array(binary.length); for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i); return bytes; } return new TextEncoder().encode(decodeURIComponent(payload)); } catch (_) { return null; } }
  function exportZip() {
    const report = validateProject(); if (report.errors.length) { announce(report.errors[0].message); renderValidation(); return; }
    saveProjectNow(); const project = clone(state.project); const entries = []; const encoder = new TextEncoder(); const exportedAssets = [];
    const illustration = $(`art-${project.template}`);
    if (illustration) {
      const path = 'assets/illustration.svg';
      const source = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320">${illustration.innerHTML}</svg>`;
      exportedAssets.push({ name: path, bytes: encoder.encode(source) });
      project.rooms.forEach((room) => { if (!room.image?.src) room.image = { src: path, alt: '', name: t("m003") }; });
    }
    project.rooms.forEach((room, index) => { if (room.image?.src?.startsWith('data:')) { const bytes = dataBytes(room.image.src); if (bytes) { const ext = (room.image.src.match(/^data:image\/(\w+)/)?.[1] || 'png').replace('jpeg', 'jpg'); const path = `assets/room-${String(index + 1).padStart(2, '0')}.${ext}`; room.image = { ...room.image, src: path }; exportedAssets.push({ name: path, bytes }); } } });
    const data = JSON.stringify(project, null, 2); const exportCoords = JSON.stringify((themes[project.template] || themes.night).coords); const exportIndex = `<!doctype html><html lang="${i18n.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(project.title)}</title><link rel="stylesheet" href="styles.css"></head><body><main id="app"><div id="route"></div></main><script id="project-data" type="application/json">${escScript(JSON.stringify(project))}</script><script src="play.js"></script></body></html>`;
    const exportPalette = {
      night: '--bg:#eeeee5;--paper:#faf9f3;--ink:#293c34;--muted:#677268;--accent:#345743;--soft:#dfeabe;--line:#bcc5b6',
      museum: '--bg:#f0eade;--paper:#fcf9f1;--ink:#443c32;--muted:#756857;--accent:#884e39;--soft:#eddbc1;--line:#cabba6',
      notes: '--bg:#e9eee3;--paper:#f8faf2;--ink:#293c34;--muted:#677268;--accent:#496144;--soft:#dae8cb;--line:#b6c6a8'
    }[project.template];
    const exportCss = `:root{${exportPalette}}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 'Avenir Next','Helvetica Neue',sans-serif}main{max-width:748px;margin:0 auto;padding:36px 24px}.paper{margin-top:20px;background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:24px;box-shadow:0 4px 18px #293c340a}.meta{display:flex;align-items:center;justify-content:space-between;gap:12px;font:10px monospace;color:var(--muted)}.image{display:block;width:100%;aspect-ratio:2;object-fit:cover;margin:22px 0 26px;border-radius:4px;background:var(--soft)}.paper h1{font:500 48px/1.05 'Iowan Old Style',Georgia,serif;letter-spacing:-.045em;margin:16px 0;overflow-wrap:anywhere}.paper p{font:17px/1.7 'Iowan Old Style',Georgia,serif;white-space:pre-line;overflow-wrap:anywhere}.actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:26px}.actions button{padding:16px;border:1px solid var(--line);border-radius:5px;background:var(--paper);color:var(--ink);text-align:left;font:13px 'Avenir Next',sans-serif;cursor:pointer}.actions button:hover{background:var(--soft);border-color:var(--accent)}.actions button:disabled{border-style:dashed;color:var(--muted);opacity:.55;cursor:not-allowed}.actions small{display:block;color:var(--muted);margin-top:5px;font:11px sans-serif}.completion{border-top:1px solid var(--line);margin-top:22px;padding-top:14px}.meta button{border:1px solid var(--line);border-radius:4px;background:var(--paper);color:var(--ink);padding:9px 12px;font:11px sans-serif;cursor:pointer}button:focus-visible{outline:2px solid var(--accent);outline-offset:4px}@media(max-width:600px){main{padding:20px 16px}.paper{padding:16px}.paper h1{font-size:36px}.image{aspect-ratio:1.7}.actions{grid-template-columns:1fr}}`;
    const exportJs = t("m002", [exportCoords]);
    entries.push({ name: 'index.html', bytes: encoder.encode(exportIndex) }, { name: 'styles.css', bytes: encoder.encode(exportCss) }, { name: 'play.js', bytes: encoder.encode(exportJs) }, { name: 'project.json', bytes: encoder.encode(data) }, ...exportedAssets); const blob = zip(entries); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${slugify(project.title)}-room-room.zip`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1200); announce(t("m001"));
  }

  function handleHash() { const match = location.hash.match(/^#\/play\/([^/]+)/); if (match) { try { const id = decodeURIComponent(match[1]); setMode('play', state.project.rooms.some((room) => room.id === id) ? id : null, false); } catch (_) { setMode('edit', null, false); } } else if (state.mode === 'play') setMode('edit', null, false); }
  function init() { const hadV2 = Boolean(storageGet(projectKey())); state.project = loadProject(); if (pristineProject === 'pending') rememberPristine(); state.selectedRoomId = state.project.rooms[0].id; if (!hadV2) saveProjectNow(); bindEvents(); renderEditor(); window.addEventListener('hashchange', handleHash); window.addEventListener('popstate', handleHash); handleHash(); }

  window.RoomRoom = { normalizeProject, validateProject, routeDiagnostics, normalizeProgress, seedProject, zip, dataBytes, escapeHtml, escapeInlineJson };
  i18n.subscribe(() => { localizePristineTemplate(); renderEditor(); if ($('saveStatus')) $('saveStatus').textContent = i18n.owned($('saveStatus').textContent); if ($('toast')) $('toast').textContent = i18n.owned($('toast').textContent); if (state.mode === 'play') renderPlay(); });
  init();
})();
