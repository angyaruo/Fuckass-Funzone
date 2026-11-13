import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=new URL('../',import.meta.url);
const names=[...['cat','heart','star','fish','cookie','gem','rocket','bomb'].map(x=>`match-${x}`),...['smug','annoyed','hype','panic','dizzy','sleepy','shock'].map(x=>`gabu-${x}`)];
test('15 independent match assets are valid small transparent PNGs included in production bytes',()=>{
 const bundle=fs.readFileSync(new URL('../dist/frontend.js',import.meta.url),'utf8');
 for(const name of names){
  const bytes=fs.readFileSync(new URL(`../assets/match3/${name}.png`,import.meta.url));
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(bytes[25],6,'assets must have RGBA transparency');
  assert.ok(bytes.readUInt32BE(16)<=200 && bytes.readUInt32BE(20)<=200,'not a whole sheet');
  const id=name.startsWith('match-')?`match_${name.slice(6)}`:`gabu_${name.slice(5)}`;
  assert.ok(bundle.includes(`"${id}":"data:image/png;base64,${bytes.toString('base64')}"`),id+' exact PNG must embed');
 }
});
test('all six selectable game modes are in shared launcher, with a dismissible PNG Gabu overlay',()=>{
 const source=fs.readFileSync(new URL('../src/frontend.js',import.meta.url),'utf8');
 assert.match(source,/\['match3','Trinket Panic','match_cat'\]/);
 assert.match(source,/\['plinko','Plinko','plinko_app'\]/);
 assert.match(source,/\.append\(reactionPicture,reactionText\)/);
 assert.match(source,/reactions\.emit\('match3',event,data\)/);
 const css=fs.readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(css,/\.bb-reaction\[hidden\]\{display:none/);
});
