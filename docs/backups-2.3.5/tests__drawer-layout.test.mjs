import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const frontend=fs.readFileSync(new URL('../src/frontend.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
test('drawer uses one Funzone OS action, game-specific accordions, and legible guides',()=>{
 assert.match(frontend,/button\('bb-drawer-os-button'/);
 assert.match(frontend,/create\('details','bb-drawer-details'\)/);
 assert.doesNotMatch(frontend,/create\('div','bb-launches bb-launches-grid'\)/);
 assert.doesNotMatch(frontend,/create\('img','bb-cover'\)/);
 for(const section of ['bird','gabi','snake','2048','match3','plinko'])
   assert.ok(frontend.includes("drawerSection('"+section+"'"),section);
 assert.ok(frontend.includes("specialCard('match_vec_rocket'"));
 assert.ok(frontend.includes("specialCard('match_vec_bomb'"));
 assert.match(css,/\.bb-drawer-summary:focus-visible/);
 assert.match(css,/\.bb-drawer-hero-art/);
 assert.match(css,/\.bb-special-guide/);
 assert.match(css,/\.bb-best-row/);
});
