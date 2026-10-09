import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadRoomRoom() {
  const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const context = {
    console,
    setTimeout,
    clearTimeout,
    TextEncoder,
    Uint8Array,
    Blob,
    URL,
    crypto: { randomUUID: () => 'test-id' },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    location: { hash: '' },
    history: { replaceState() {}, pushState() {} },
    document: { body: { className: '', title: '' }, getElementById() { return null; }, querySelectorAll() { return []; }, addEventListener() {} },
    window: { addEventListener() {} }
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'app.js' });
  return context.window.RoomRoom;
}

const RoomRoom = loadRoomRoom();
assert.equal(typeof RoomRoom.escapeHtml, 'function');
assert.equal(typeof RoomRoom.escapeInlineJson, 'function');
const payload = '</script><script>alert(1)</script>';
const html = RoomRoom.escapeHtml(payload);
assert.equal(html.includes('<'), false);
assert.equal(html.includes('>'), false);
const inline = RoomRoom.escapeInlineJson(JSON.stringify({ payload }));
assert.equal(inline.toLowerCase().includes('</script'), false);
assert.equal(inline.includes('<'), false);
console.log('export security: ok');
