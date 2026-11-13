import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const ui=fs.readFileSync(new URL('../src/frontend.js',import.meta.url),'utf8');
const style=fs.readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
test('no emoji or text glyphs masquerade as controls in new HUD',()=>{
 assert.ok(ui.includes('function svgIcon('));assert.ok(ui.includes('function setImageLabel('));
 assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(ui));
 assert.ok(!/[▶↻Ⅱ♪✦♡🐤]/u.test(ui));
 assert.ok(!/content\s*:\s*['"][^'"]*[▶↻Ⅱ♪✦♡🐤]/u.test(style));
});
