import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const kinds=['cat','heart','star','fish','cookie','gem','rocket','bomb'];
const root=new URL('../',import.meta.url);
const read=(p)=>fs.readFileSync(new URL(p,root),'utf8');
const brandColor={cat:'#1E2733',heart:'#F35E92',star:'#F8C850',fish:'#3DC8D1',cookie:'#D7A477',gem:'#8664DE'};
test('vector art is native, transparent, separate and has six distinct color lanes',()=>{
 const used=new Set();
 for(const kind of kinds){
  const svg=read(`assets/match3/vector/${kind}.svg`);
  assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/viewBox="0 0 64 64"/);
  assert.match(svg,/<path /,'hand-authored path art, not typographic glyphs');
  assert.doesNotMatch(svg,/<(?:script|foreignObject|image|text|use|style)\b|onload=|href=|url\(/i);
  assert.doesNotMatch(svg,/[\u{1F300}-\u{1FAFF}]/u,'no emoji or symbol-as-icon shortcuts');
  if(brandColor[kind]){assert.ok(svg.includes(brandColor[kind]));used.add(brandColor[kind]);}
 }
 assert.equal(used.size,6);
});
test('the production build embeds byte-identical vector art and PNG fallbacks',()=>{
 const bundle=read('dist/frontend.js');
 for(const kind of kinds){
  const svg=read(`assets/match3/vector/${kind}.svg`);
  assert.ok(bundle.includes(`"match_vec_${kind}":"data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"`),`SVG ${kind} should be self-contained`);
  const png=fs.readFileSync(new URL(`assets/match3/match-${kind}.png`,root));
  assert.ok(bundle.includes(`"match_${kind}":"data:image/png;base64,${png.toString('base64')}"`),`PNG fallback ${kind}`);
 }
});
test('Match-3 retains neutral graphite playfield in Funzone OS',()=>{
 const css=read('src/style.css'),ui=read('src/frontend.js');
 assert.match(css,/\.bb-canvas\[data-mode=match3\]\{background:#1c222b;border-color:#414954/);
 assert.match(css,/\.bb-canvas\[data-mode=plinko\]\{background:#131923/);
 assert.match(ui,/if\(canvas\)canvas\.dataset\.mode=activeMode;/);
 assert.match(ui,/b\.dataset\.game=id;/);
});
