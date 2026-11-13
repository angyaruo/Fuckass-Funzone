import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const frontend=fs.readFileSync(new URL('../src/frontend.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
test('sidebar uses a single Funzone OS launcher, separate arcade behavior, six radio-style game tabs, and one panel',()=>{
 assert.match(frontend,/button\('bb-drawer-os-button'/);
 assert.match(frontend,/create\('details','bb-drawer-behavior'\)/);
 assert.match(frontend,/create\('div','bb-drawer-game-tabs'\)/);
 assert.match(frontend,/setAttribute\('role','tablist'\)/);
 assert.match(frontend,/setAttribute\('role','tab'\)/);
 assert.match(frontend,/setAttribute\('role','tabpanel'\)/);
 assert.match(frontend,/drawerGamePanels\.get\(gameId\)\.hidden=!selected/);
 assert.match(frontend,/ArrowRight/);
 assert.match(frontend,/Home/);
 assert.doesNotMatch(frontend,/drawerSection\(/);
 assert.doesNotMatch(frontend,/create\('div','bb-launches bb-launches-grid'\)/);
 assert.doesNotMatch(frontend,/create\('img','bb-cover'\)/);
 for(const section of ['bird','gabi','snake','2048','match3','plinko'])assert.ok(frontend.includes("drawerGamePanel('"+section+"')"),section);
 assert.ok(frontend.includes("specialCard('match_vec_rocket'"));
 assert.ok(frontend.includes("specialCard('match_vec_bomb'"));
 assert.match(css,/\.bb-drawer-game-tab\[aria-selected="true"\]/);
 assert.match(css,/\.bb-drawer-game-page\[hidden\]\{display:none!important/);
 assert.match(css,/\.bb-drawer-behavior-head:focus-visible/);
 assert.match(css,/\.bb-special-guide/);
 assert.match(css,/\.bb-best-row/);
 assert.doesNotMatch(css,/transform\s*:\s*scale\(/);
});

test('Trinket Panic app uses the same SVG cat as the current Match-3 board',()=>{
 assert.match(frontend,/\['match3','Trinket Panic','match_vec_cat'\]/);
 assert.doesNotMatch(frontend,/\['match3','Trinket Panic','match_cat'\]/);
 const svg=fs.readFileSync(new URL('../assets/match3/vector/cat.svg',import.meta.url),'utf8');
 assert.match(svg,/fill="#1E2733"/);
 assert.match(svg,/fill="#68DCEB"/);
});
