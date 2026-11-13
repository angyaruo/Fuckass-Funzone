import test from 'node:test';
import assert from 'node:assert/strict';
import {Match3Game,MATCH_KINDS,MATCH_SIZE,findMatchRuns,hasMatchMove,cellAt} from '../src/match3.js';
const adjacent=(a,b)=>Math.abs(a%7-b%7)+Math.abs(Math.floor(a/7)-Math.floor(b/7))===1;
function moveFinder(g){
 for(let a=0;a<49;a++)for(const b of [a+1,a+7]){
  if(b>=49||!adjacent(a,b))continue;
  const board=g.board.map(x=>({...x}));[board[a],board[b]]=[board[b],board[a]];
  if(findMatchRuns(board).length)return[a,b];
 }
 return null;
}
test('7x7 initial boards are free of matches and contain real legal moves for adversarial RNGs',()=>{
 for(const random of [()=>0,()=>.5,()=>.999,Math.random]){
  const g=new Match3Game({random});assert.equal(g.board.length,49);assert.equal(findMatchRuns(g.board).length,0);
  assert.equal(hasMatchMove(g.board),true);assert.ok(moveFinder(g));assert.equal(g.score,0);assert.equal(g.moves,0);
 }
});
test('swap only accepts neighbors; invalid swaps revert without costing score or a move',()=>{
 const events=[],g=new Match3Game({random:()=>.48,onEvent:(name)=>events.push(name)});
 const original=g.snapshot();assert.equal(g.swap(-1,1),false);assert.equal(g.swap(0,20),false);
 let invalid=null;for(let a=0;a<49&&!invalid;a++)for(const b of[a+1,a+7]){
  if(!adjacent(a,b)||b>=49)continue;
  const swap=g.board.map(t=>({...t}));[swap[a],swap[b]]=[swap[b],swap[a]];
  if(!findMatchRuns(swap).length){invalid=[a,b];break;}
 }
 assert.ok(invalid);assert.equal(g.swap(...invalid),false);
 assert.deepEqual(g.board,original.board);assert.equal(g.score,0);assert.equal(g.moves,0);assert.ok(events.includes('invalid_swap'));
});
test('matches resolve, tiles refill, gravity preserves valid board and snapshots restore without losing progress',()=>{
 const events=[],g=new Match3Game({random:()=>0,onEvent:(name,payload)=>events.push({name,payload})});
 const first=moveFinder(g);assert.ok(first);
 assert.equal(g.swap(...first),true);assert.ok(g.score>0);assert.equal(g.moves,1);
 assert.equal(g.board.length,49);assert.equal(g.board.every(t=>MATCH_KINDS.includes(t.kind)),true);
 assert.equal(findMatchRuns(g.board).length,0);assert.equal(hasMatchMove(g.board),true);
 const snap=g.snapshot();const copy=new Match3Game({random:()=>.75,saved:snap});
 assert.deepEqual(copy.board,g.board);assert.equal(copy.score,g.score);assert.equal(copy.moves,g.moves);
 assert.equal(copy.status,'paused');assert.ok(events.some(x=>x.name==='match'));assert.ok(events.some(x=>x.name==='score'));
});
test('constant random sources do not produce unbounded cascades or runaway scores',()=>{
 for(const random of [()=>0,()=>.999,()=>.5]){
  const g=new Match3Game({random});
  for(let i=0;i<12;i++){
   const cells=moveFinder(g);if(!cells)break;
   assert.equal(g.swap(...cells),true);
   assert.ok(g.score<100000,'no runaway score from pathological RNG');
   assert.equal(g.board.filter(Boolean).length,49);
   assert.equal(findMatchRuns(g.board).length,0);
  }
 }
});
test('four- and five-in-a-row create rocket and bomb PNG-backed special pieces',()=>{
 for(const [length,power] of [[4,'row'],[5,'bomb']]){
  const g=new Match3Game({random:()=>.31});
  // Row zero becomes CAT HEART CAT CAT [CAT] after swapping below into slot one.
  for(let x=0;x<length;x++)g.board[x]={kind:x===1?'heart':'cat',power:null};
  g.board[8]={kind:'cat',power:null};
  const before=g.moves;assert.equal(g.swap(8,1),true);
  assert.equal(g.moves,before+1);
  assert.ok(g.board.some(t=>t?.power===power),`expected ${power} after ${length}-line match`);
 }
});
test('existing rockets and bombs activate on a valid adjacent swap without a starting match',()=>{
 for(const power of ['row','column','bomb']){
  const events=[],g=new Match3Game({random:()=>0,onEvent:(n,d)=>events.push([n,d])});
  g.board[1]={...g.board[1],power};
  const old=g.score;assert.equal(g.swap(1,2),true);assert.ok(g.score>old);
  assert.ok(events.some(([name])=>name==='special_triggered'),`${power} should trigger`);
  assert.equal(g.board.length,49);assert.equal(findMatchRuns(g.board).length,0);
 }
});
test('bad saves rejected without mutation and old save fields are optional',()=>{
 const g=new Match3Game({random:()=>.4}),original=g.snapshot();
 const malformed={...original,board:original.board.slice()};malformed.board[7]={kind:'banana',power:null};
 assert.equal(g.restore(malformed),false);assert.deepEqual(g.snapshot(),original);
 assert.equal(g.restore({...original,board:[]}),false);
 assert.equal(g.restore({...original,score:-5}),false);
 const old={...original};delete old.spawnSerial;assert.equal(g.restore(old),true);
});
test('canvas hit test excludes gutters and bounds, and maps each cell exactly',()=>{
 assert.equal(cellAt(28,77),0);assert.equal(cellAt(28+44*6+20,77+44*6+20),48);
 assert.equal(cellAt(28+41,77),-1);assert.equal(cellAt(-5,50),-1);assert.equal(cellAt(340,400),-1);
});
