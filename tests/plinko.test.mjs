import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlinkoGame,PLINKO_SLOTS,PLINKO_PEGS} from '../src/plinko.js';
function run(game){for(let i=0;i<1500&&game.ball;i++)game.update(1/60);assert.equal(game.ball,null,'drop must settle');}
function seeded(n){return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
test('Plinko is a complete deterministic, responsive bouncing game and settles once',()=>{
 const seen=[];const g=new PlinkoGame({rng:seeded(19),onEvent:(e,d)=>seen.push([e,d])});
 assert.equal(PLINKO_PEGS.length,60);assert.equal(PLINKO_SLOTS.length,9);
 assert.equal(g.launch(180,5),true);assert.equal(g.launch(180,5),false,'cannot double-spend on in-flight ball');
 for(let i=0;i<25;i++)g.update(1/60);
 assert.ok(g.ball.y>98,'chip moves');assert.ok(g.trail.length>0);
 run(g);assert.equal(g.drops,1);assert.equal(g.status,'idle');
 const land=seen.filter(([e])=>e==='land');assert.equal(land.length,1);
 assert.ok(land[0][1].slot>=0&&land[0][1].slot<9);
 assert.equal(land[0][1].payout,land[0][1].stake*land[0][1].multiplier);
 assert.equal(g.won,land[0][1].payout);assert.equal(g.spent,5);
 g.update(100);assert.equal(seen.filter(([e])=>e==='land').length,1,'cannot pay twice');
});
test('practice is truly free even if the chip lands in the jackpot, and records no fictional winnings',()=>{
 for(const x of [0,180,360]){const g=new PlinkoGame({rng:seeded(28)});assert.equal(g.launch(x,0),true);run(g);
  assert.equal(g.lastResult.practice,true);assert.equal(g.lastResult.payout,0);assert.equal(g.won,0);assert.equal(g.spent,0);}
});
test('restart refunds only live wager once; saved midflight ball restores paused',()=>{
 const old=new PlinkoGame({rng:seeded(53)});old.launch(210,25);old.update(.2);const data=old.snapshot();
 const restored=new PlinkoGame({saved:data,rng:seeded(53)});assert.equal(restored.status,'paused');assert.equal(restored.ball.stake,25);
 const refunded=old.cancel();assert.equal(refunded,25);assert.equal(old.cancel(),0);
 restored.start();run(restored);assert.equal(restored.drops,1);assert.equal(restored.cancel(),0);
});
test('hardened save parsing rejects invalid balls, unsafe wallet values and toxic history',()=>{
 const g=new PlinkoGame({saved:{ball:{x:Infinity,y:140,vx:5,vy:2,age:1,stake:50},spent:-1,drops:'999',last:[{payout:-2,multiplier:8}]}});
 assert.equal(g.ball,null);assert.equal(g.status,'idle');assert.equal(g.spent,0);assert.equal(g.drops,0);assert.equal(g.last.length,0);
 assert.equal(g.launch(180,-5),false);assert.equal(g.launch(180,1.4),false);
});
test('economy has no guaranteed edge-slot farming, and distribution yields fewer tickets than it costs over seeded sample',()=>{
 let total=0;const rng=seeded(777);
 for(let i=0;i<250;i++){const g=new PlinkoGame({rng});g.launch([0,145,180,215,360][i%5],1);run(g);total+=g.won;}
 assert.ok(total<340,`expected-outcome guard: 250 stakes produced ${total}`);
});
test('all Plinko art is standalone transparent PNG embedded byte-identically in the production bundle',()=>{
 const bundle=fs.readFileSync(new URL('../dist/frontend.js',import.meta.url),'utf8');
 for(const [file,key] of [['gabu-monocle.png','gabu_magnate'],['gabu-peek.png','gabu_peek'],['cat-chip.png','plinko_chip'],['plinko-app.png','plinko_app']]){
  const b=fs.readFileSync(new URL('../assets/plinko/'+file,import.meta.url));
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b[25],6);
  assert.ok(bundle.includes(`"${key}":"data:image/png;base64,${b.toString('base64')}"`),key);
 }
});
test('Plinko renderer uses monochrome lettering, unique sprite assets and the gilded crest',()=>{
 const ui=fs.readFileSync(new URL('../src/frontend.js',import.meta.url),'utf8');
 const renderer=fs.readFileSync(new URL('../src/plinko-render.js',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(ui,/bb-phone-button/);assert.match(ui,/bb-app-grid/);assert.match(ui,/bb-plinko-bets/);
 assert.match(renderer,/images\.plinko_crest/);assert.doesNotMatch(renderer,/images\.gabu_magnate/);
 assert.match(ui,/image\('gabu_peek','bb-plinko-host-art'\)/);
 assert.match(renderer,/images\.plinko_chip/);assert.match(css,/\.bb-phone\[hidden\]/);
 assert.doesNotMatch(ui,/[\u{1F300}-\u{1FAFF}]/u);
});


test('payout feedback expires after landing even when no ball is active',()=>{
 const g=new PlinkoGame({rng:seeded(1)});g.launch(180,5);run(g);
 assert.equal(g.ball,null);assert.ok(g.flash>0,'landing activates highlight');
 g.update(.5);assert.ok(g.flash<1.2 && g.flash>0);
 for(let i=0;i<15;i++)g.update(.12);
 assert.equal(g.flash,0,'expired feedback cannot obscure another drop');
 assert.equal(g.drops,1,'idle updates cannot credit tickets twice');
});

test('payout uses winning-bin emphasis rather than center-blocking overlay',async()=>{
 const {drawPlinko}=await import('../src/plinko-render.js');
 const texts=[],rects=[];
 const ctx={font:'',textAlign:'left',fillStyle:'',shadowColor:'',shadowBlur:0,
   setTransform(){},fillRect(){},strokeRect(x,y,w,h){rects.push({x,y,w,h})},
   beginPath(){},roundRect(){},arc(){},fill(){},stroke(){},moveTo(){},lineTo(){},
   save(){},restore(){},drawImage(){},fillText(t,x,y){texts.push({t,x,y})},
   createLinearGradient(){return {addColorStop(){}}},
 };
 const g=new PlinkoGame({});g.lastResult={slot:8,multiplier:8,stake:5,payout:40,practice:false};g.flash=1.2;g.best=40;
 drawPlinko({width:720,height:904,getContext:()=>ctx},g,{});
 assert.ok(texts.some(v=>v.t==='x8 +40'&&v.y>340),'winning bin has its own attached result');
 assert.ok(rects.some(v=>v.x>300&&v.y>=PLINKO_SLOTS.length*0+396),'far-right winning slot gets highlighted');
 assert.ok(texts.every(v=>v.y!==213),'old center payout banner is removed');
});
