import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SHOP_CATALOG,SHOP_SLOTS,restoreShop,purchaseReward,equipReward} from '../src/shop.js';

test('prize catalog is unique, has safe prices and genuine visual equip slots',()=>{
 assert.equal(SHOP_CATALOG.length,29);
 const ids=new Set(SHOP_CATALOG.map(i=>i.id));assert.equal(ids.size,SHOP_CATALOG.length);
 assert.deepEqual(SHOP_SLOTS,['cabinet','snake','plinko','merge']);
 for(const item of SHOP_CATALOG){
  assert.ok(item.name&&item.description&&item.asset&&item.color);
  assert.ok(Number.isSafeInteger(item.price)&&item.price>0&&item.price<=150);
  assert.ok(SHOP_SLOTS.includes(item.slot));
 }
});
test('shop restores old saves, removes unknown unlocks and rejects forged equipped IDs',()=>{
 assert.deepEqual(restoreShop(undefined),{owned:[],equipped:{cabinet:'default',snake:'default',plinko:'default',merge:'default'}});
 const restored=restoreShop({owned:['cabinet_mint','cabinet_mint','unknown',{},'snake_mint'],equipped:{cabinet:'snake_mint',snake:'snake_mint',merge:'merge_mint',plinko:'oops'}});
 assert.deepEqual(restored.owned,['cabinet_mint','snake_mint']);
 assert.equal(restored.equipped.cabinet,'default');assert.equal(restored.equipped.snake,'snake_mint');
 assert.equal(restored.equipped.merge,'default');assert.equal(restored.equipped.plinko,'default');
});
test('buy consumes fictional tickets exactly once, equips, and survives serialization',()=>{
 const prior=restoreShop(null);
 const purchased=purchaseReward(prior,'cabinet_mint',100);
 assert.equal(purchased.ok,true);assert.equal(purchased.tickets,65);
 assert.deepEqual(prior.owned,[],'purchase is immutable');
 assert.equal(purchased.shop.equipped.cabinet,'cabinet_mint');
 const replay=purchaseReward(purchased.shop,'cabinet_mint',purchased.tickets);
 assert.equal(replay.ok,false);assert.equal(replay.reason,'owned');assert.equal(replay.tickets,65);
 const persisted=JSON.parse(JSON.stringify(purchased.shop));
 const restored=restoreShop(persisted);
 assert.deepEqual(restored,purchased.shop);
 const reverted=equipReward(restored,'cabinet','default');
 assert.equal(reverted.shop.equipped.cabinet,'default');
 assert.ok(reverted.shop.owned.includes('cabinet_mint'),'unequip never deletes ownership');
 assert.equal(equipReward(reverted.shop,'cabinet','cabinet_mint').shop.equipped.cabinet,'cabinet_mint');
});
test('shop rejects insufficient, invalid and cross-slot equips without charging',()=>{
 const empty=restoreShop(null);
 for(const amount of [-1,0,NaN,Infinity,1.5]){
  const attempt=purchaseReward(empty,'cabinet_royal',amount);
  assert.equal(attempt.ok,false);assert.equal(attempt.shop.owned.length,0);
 }
 assert.equal(purchaseReward(empty,'not-sold',200).reason,'unknown');
 assert.equal(equipReward(empty,'snake','cabinet_mint').ok,false);
 const got=purchaseReward(empty,'cabinet_mint',200);
 assert.equal(equipReward(got.shop,'snake','cabinet_mint').ok,false,'cannot equip cabinet as snake');
 assert.equal(equipReward(got.shop,'nonexistent','default').ok,false);
 assert.equal(purchaseReward(got.shop,'cabinet_cherry',0).reason,'funds');
});
test('purchased cosmetics are implemented in actual renderer and HUD source, not store-only labels',()=>{
 const root=new URL('../src/',import.meta.url);
 const css=fs.readFileSync(new URL('style.css',root),'utf8');
 const ui=fs.readFileSync(new URL('frontend.js',root),'utf8');
 const snake=fs.readFileSync(new URL('puzzle-render.js',root),'utf8');
 const plinko=fs.readFileSync(new URL('plinko-render.js',root),'utf8');
 assert.match(ui,/shopState\.equipped\.snake/);assert.match(ui,/shopState\.equipped\.merge/);
 assert.match(ui,/shopState\.equipped\.plinko/);assert.match(ui,/rootEl\.dataset\.cabinet=shopState\.equipped\.cabinet/);
 assert.match(snake,/skin==='snake_mint'/);assert.match(snake,/skin==='merge_mint'/);
 assert.match(plinko,/trailSkin==='plinko_aqua'/);
 for(const id of ['cabinet_mint','cabinet_cherry','cabinet_royal','cabinet_cyber','cabinet_amethyst','cabinet_sunset','cabinet_crimson','cabinet_monochrome'])assert.ok(css.includes(`data-cabinet="${id}"`));
 assert.match(ui,/phoneEl\.append\(shopEl\)/);
 assert.doesNotMatch(ui,/real-money purchase|checkout|payment processor/i);
});

test('Snake and 2048 visibly use purchased skin palettes at rendering time',async()=>{
 const {SnakeGame,Merge2048}=await import('../src/puzzles.js');
 const {drawSnake,drawMerge}=await import('../src/puzzle-render.js');
 const colors=[];
 const ctx={font:'',textAlign:'left',createLinearGradient(){return{addColorStop(){}}},setTransform(){},
  fillRect(){},strokeRect(){},beginPath(){},roundRect(){},fill(){colors.push(this.fillStyle)},stroke(){colors.push(this.strokeStyle)},
  moveTo(){},lineTo(){},arc(){},save(){},restore(){},translate(){},rotate(){},drawImage(){},fillText(){}
 };
 const canvas={width:720,height:904,getContext:()=>ctx};
 const snake=new SnakeGame({});drawSnake(canvas,snake,{}, {skin:'snake_mint'});
 assert.ok(colors.includes('#70e5be'),'mint body palette reaches canvas strokes');
 colors.length=0;drawSnake(canvas,snake,{}, {skin:'snake_sunset'});
 assert.ok(colors.includes('#ff967a'),'sunset body palette reaches canvas strokes');
 colors.length=0;drawSnake(canvas,snake,{}, {skin:'snake_cyber'});
 assert.ok(colors.includes('#39ff14'),'cyber body palette reaches canvas strokes');
 colors.length=0;const merge=new Merge2048({});drawMerge(canvas,merge,{skin:'merge_mint'});
 assert.ok(colors.some(c=>['#c8f6e8','#a9e9db'].includes(c)),'sea-glass tiles reach canvas');
 colors.length=0;drawMerge(canvas,merge,{skin:'merge_candy'});
 assert.ok(colors.some(c=>['#ffe7da','#ffcfbf'].includes(c)),'candy tiles reach canvas');
 colors.length=0;drawMerge(canvas,merge,{skin:'merge_cyber'});
 assert.ok(colors.some(c=>['#0f291e','#134e3f'].includes(c)),'cyber matrix tiles reach canvas');
});
test('Plinko chip trail cosmetic changes visuals without changing payouts',async()=>{
 const {PlinkoGame}=await import('../src/plinko.js');
 const {drawPlinko}=await import('../src/plinko-render.js');
 const colors=[];
 const ctx={font:'',textAlign:'left',createLinearGradient(){return{addColorStop(){}}},setTransform(){},setLineDash(){},
  fillRect(){},strokeRect(){},beginPath(){},roundRect(){},fill(){colors.push(this.fillStyle)},stroke(){},
  moveTo(){},lineTo(){},arc(){},save(){},restore(){},drawImage(){},fillText(){}
 };
 const canvas={width:720,height:904,getContext:()=>ctx};
 const game=new PlinkoGame({});game.ball={x:160,y:160,vx:0,vy:10,age:1,stake:1};game.trail=[{x:159,y:159}];
 drawPlinko(canvas,game,{}, {trailSkin:'plinko_aqua'});assert.ok(colors.includes('#80f6f5'));
 colors.length=0;drawPlinko(canvas,game,{}, {trailSkin:'plinko_gold'});assert.ok(colors.includes('#ffe59a'));
 colors.length=0;drawPlinko(canvas,game,{}, {trailSkin:'plinko_neon'});assert.ok(colors.includes('#ff2a8d'));
 colors.length=0;drawPlinko(canvas,game,{}, {trailSkin:'plinko_emerald'});assert.ok(colors.includes('#10b981'));
 assert.equal(game.ball.stake,1,'renderer does not change active wager');assert.equal(game.drops,0,'renderer does not settle a ball');
});
