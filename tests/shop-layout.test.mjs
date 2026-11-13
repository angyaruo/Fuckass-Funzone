import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
test('shop alone is height-bounded and reward catalog is independently scrollable',()=>{
 const css=read('src/style.css');
 assert.match(css,/\.bb-float\[data-shop-open="true"\]\s*\{[^}]*max-height:min\(605px,calc\(100dvh - 20px\)\)/s);
 assert.match(css,/\.bb-float\[data-shop-open="true"\] \.bb-shop\s*\{[^}]*flex-direction:column;[^}]*min-height:0;overflow:hidden/s);
 assert.match(css,/\.bb-shop-scroll\s*\{[^}]*flex:1 1 auto;min-height:0;[^}]*overflow-y:auto;overflow-x:hidden/s);
 assert.match(css,/\.bb-shop-scroll[^}]*touch-action:pan-y/s,'mobile touch scrolling is supported');
 assert.match(css,/\.bb-shop-scroll:focus-visible/);
 assert.doesNotMatch(css,/\.bb-phone\s*\{[^}]*height:\s*(?:[6-9]\d\d|100vh)px/s,'not globally forcing other games into shop geometry');
});
test('shop DOM owns its catalog and preserves primary controls outside the scroller',()=>{
 const ui=read('src/frontend.js');
 assert.match(ui,/rootEl\.dataset\.shopOpen=String\(shopOpen\)/);
 assert.match(ui,/shopScroll=create\('div','bb-shop-scroll'\)/);
 assert.match(ui,/shopScroll\.append\(prizeGrid,create\('p','bb-shop-fineprint'/);
 assert.match(ui,/shopEl\.append\(shopScroll\)/);
 assert.match(ui,/shopEl\.append\(shopNotice\)/);
 assert.match(ui,/if\(shopScroll\)shopScroll\.scrollTop=0/);
});
