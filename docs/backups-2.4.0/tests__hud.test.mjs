import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
test('compact floating chrome has one launcher, no tab rail, and one contextual play/pause control',()=>{
 const ui=read('src/frontend.js'),css=read('src/style.css');
 assert.match(ui,/const wallet=create\('div','bb-wallet'\)/);
 assert.doesNotMatch(ui,/const ticker=create\('div','bb-ticker'\)/);
 assert.match(ui,/phoneEl=create\('section','bb-phone'\)/);
 assert.match(ui,/const picker=button\('bb-iconbutton bb-phone-button'/);
 assert.doesNotMatch(ui,/const tabs=create\('nav','bb-tabs'\)/);
 assert.match(ui,/current\.status==='playing'\?'pause':'play'/);
 assert.doesNotMatch(ui,/pauseButton=button\(/);
 assert.match(css,/\.bb-app-grid/);
 assert.doesNotMatch(css,/\.bb-ticker\s*\{/);
 assert.match(css,/\.bb-status::before/);
});
test('puzzle canvas does not duplicate host generation state and keeps scores legible',()=>{
 const render=read('src/puzzle-render.js');
 assert.doesNotMatch(render,/ctx\.fillText\('RESPONSE READY'/);
 assert.doesNotMatch(render,/text\(ctx,'RESPONSE READY'/);
 assert.match(render,/`SCORE \${score}`/);
 assert.match(render,/`BEST \${best}`/);
});
