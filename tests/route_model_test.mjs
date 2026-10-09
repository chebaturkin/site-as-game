import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadRoomRoom() {
  const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const storage = new Map();
  const context = {
    console,
    setTimeout,
    clearTimeout,
    TextEncoder,
    Uint8Array,
    Blob,
    URL,
    crypto: { randomUUID: () => 'test-id' },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key)
    },
    location: { hash: '' },
    history: { replaceState() {}, pushState() {} },
    document: {
      body: { className: '', title: '' },
      getElementById() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {}
    },
    window: { addEventListener() {} }
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'app.js' });
  return context.window.RoomRoom;
}

const RoomRoom = loadRoomRoom();
assert.equal(typeof RoomRoom.normalizeProject, 'function');
assert.equal(typeof RoomRoom.routeDiagnostics, 'function');

const longBody = 'а'.repeat(12000);
const project = RoomRoom.normalizeProject({
  id: 'fixture',
  title: 'fixture',
  startRoomId: 'a',
  flags: [{ id: 'key', label: 'ключ', default: false }],
  rooms: [
    { id: 'a', title: 'старт', body: longBody, transitions: [{ id: 'ab', label: 'дальше', target: 'b', requires: 'key' }] },
    { id: 'b', title: 'запертая', transitions: [] },
    { id: 'c', title: 'отдельная', transitions: [], image: { src: 'data:image/svg+xml;base64,PHN2Zy8+', alt: 'bad' } },
    { id: 'd', title: 'недостижимая дверь', transitions: [{ id: 'da', label: 'назад', target: 'a', requires: 'key' }] }
  ]
});

assert.equal(project.rooms.length, 4);
assert.equal(project.rooms[0].body.length, 10000);
assert.equal(project.rooms.filter((room) => room.start).length, 1);
assert.equal(project.rooms[2].image.src, '');

const report = RoomRoom.routeDiagnostics(project);
assert.equal(report.unreachableRooms.length, 3);
assert.equal(report.blockedTransitions.length, 1);
assert.equal(report.deadEnds.length, 2);

const progress = RoomRoom.normalizeProgress({ currentRoomId: 'a', visited: ['a', 'unknown'], flags: { key: false, injected: true } }, project);
assert.deepEqual(progress.visited, ['a']);
assert.deepEqual(Object.keys(progress.flags), ['key']);
assert.equal(progress.completed, false);

console.log('route model: ok');
