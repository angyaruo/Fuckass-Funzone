import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { SnakeGame, SNAKE_FOOD_KINDS } from '../src/puzzles.js';
import { drawSnake } from '../src/puzzle-render.js';

const zero=()=>0;
const png=(kind)=>fs.readFileSync(new URL(`../assets/funzone/snake-food-${kind}.png`,import.meta.url));

test('all six snacks are distinct transparent PNG images embedded in production',()=>{
 assert.deepEqual(SNAKE_FOOD_KINDS,['apple','berry','star','fish','cookie','candy']);
 const bundle=fs.readFileSync(new URL('../dist/frontend.js',import.meta.url),'utf8');
 const signatures=new Set();
 for(const kind of SNAKE_FOOD_KINDS){
  const b=png(kind);
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.deepEqual([b.readUInt32BE(16),b.readUInt32BE(20)],[128,128]);
  assert.equal(b[25],6,'real PNG alpha channel');
  signatures.add(crypto.createHash('sha256').update(b).digest('hex'));
  assert.ok(bundle.includes(`"snake_food_${kind}":"data:image/png;base64,${b.toString('base64')}"`),`${kind} bundled exactly`);
 }
 assert.equal(signatures.size,6,'not recolored duplicates');
});

test('snack kinds rotate with seeded randomness and persist through reload',()=>{
 const g=new SnakeGame({random:zero});
 const types=[g.food.kind];
 for(let i=1;i<6;i++){g.food=g.placeFood();types.push(g.food.kind);}
 assert.deepEqual(types,SNAKE_FOOD_KINDS);
 const save=g.snapshot();
 const reloaded=new SnakeGame({random:zero,saved:save});
 assert.deepEqual(reloaded.food,g.food);
 assert.equal(reloaded.snackCount,6);
 assert.equal(reloaded.placeFood().kind,'apple');
});

test('older v2.0 Snake save restores without food.kind, invalid types are rejected atomically',()=>{
 const g=new SnakeGame({random:zero});
 const older=g.snapshot();delete older.snackCount;delete older.food.kind;
 const h=new SnakeGame({random:zero});
 assert.equal(h.restore(older),true);
 assert.equal(h.food.kind,'apple');
 const previous=h.snapshot();
 assert.equal(h.restore({...previous,food:{...previous.food,kind:'mystery-glyph'}}),false);
 assert.deepEqual(h.snapshot(),previous);
 assert.equal(h.restore({...previous,snackCount:-2}),false);
 assert.deepEqual(h.snapshot(),previous);
});

test('canvas draws a continuous ribbon, rotates the head on turns, and uses chosen PNG snack',()=>{
 const drawn=[],strokes=[],rotations=[];
 const ctx={
  setTransform(){},createLinearGradient(){return {addColorStop(){}}},fillRect(){},roundRect(){},
  beginPath(){},fill(){},stroke(){strokes.push({width:this.lineWidth,color:this.strokeStyle})},
  moveTo(){},lineTo(){},arc(){},translate(){},save(){},restore(){},rotate(a){rotations.push(a)},
  drawImage(img){drawn.push(img.name)},fillText(){},strokeRect(){}
 };
 const canvas={width:720,height:904,getContext:()=>ctx};
 const images=new Proxy({}, {get(_obj,k){return {name:k,complete:true,naturalWidth:128}}});
 const g=new SnakeGame({random:zero});g.status='playing';g.direction='up';g.food={x:8,y:8,kind:'cookie'};
 drawSnake(canvas,g,images);
 assert.ok(strokes.some(s=>s.width===20),'unbroken body outline is drawn');
 assert.ok(strokes.some(s=>s.width===10),'ribbon has layered shading');
 assert.deepEqual(rotations,[-Math.PI/2],'head faces direction of travel');
 assert.ok(drawn.includes('snake_head'));
 assert.ok(drawn.includes('snake_food_cookie'));
 assert.equal(drawn.filter(x=>x==='snake_head').length,1,'only one head, not a repeated tile head');
});
