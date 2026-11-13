import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Match3Game, MATCH_ROWS, MATCH_WIDTHS, MATCH_HINT_DELAY, findMatchRuns, findMatchMove, hasMatchMove, neighbors} from '../src/match3.js';
import {drawMatch3, matchLayout, matchCellAt} from '../src/match3-render.js';
const deadBoard=width=>Array.from({length:width*MATCH_ROWS},(_,i)=>({kind:['cat','heart','star','fish','gem','cookie'][(i%width+Math.floor(i/width))%6],power:null}));

test('6/7/8-column widths generate legal, cascade-safe boards even with adversarial RNG',()=>{
 for(const width of MATCH_WIDTHS){
  for(const random of [()=>0,()=>.5,()=>.999,Math.random]){
   const g=new Match3Game({width,random});
   assert.equal(g.width,width);assert.equal(g.board.length,MATCH_ROWS*width);
   assert.equal(findMatchRuns(g.board,width).length,0);
   assert.ok(hasMatchMove(g.board,width));
   const [a,b]=findMatchMove(g.board,width);assert.ok(neighbors(a,b,width));
   const initial=g.board.map(x=>({...x}));[initial[a],initial[b]]=[initial[b],initial[a]];
   assert.ok(findMatchRuns(initial,width).length||g.board[a].power||g.board[b].power);
   assert.ok(g.swap(a,b));assert.equal(g.moves,1);
   assert.equal(g.board.length,MATCH_ROWS*width);
   assert.equal(findMatchRuns(g.board,width).length,0);
   if(g.status!=='dead')assert.ok(hasMatchMove(g.board,width));
   const snap=g.snapshot(),restore=new Match3Game({width,saved:snap});
   assert.deepEqual(restore.board,g.board);
   assert.equal(restore.width,width);
  }
 }
});

test('four seconds of true idle shows a genuine swap and player action clears it',()=>{
 const g=new Match3Game({random:()=>.41});g.start();
 assert.equal(g.getHint(),null);g.update(MATCH_HINT_DELAY-0.1);assert.equal(g.getHint(),null);
 g.update(0.15);const hint=g.getHint();assert.ok(hint);assert.ok(neighbors(hint[0],hint[1],g.width));
 const b=g.board.map(x=>({...x}));[b[hint[0]],b[hint[1]]]=[b[hint[1]],b[hint[0]]];
 assert.ok(findMatchRuns(b,g.width).length||g.board[hint[0]].power||g.board[hint[1]].power);
 g.touch();assert.equal(g.getHint(),null);g.update(4.1);assert.ok(g.getHint());
 g.pause();assert.equal(g.getHint(),null);g.update(9);assert.equal(g.getHint(),null);
});

test('boards with zero legal moves stop as an explicit failed state and restore dead',()=>{
 for(const width of MATCH_WIDTHS){
  const dead=deadBoard(width);assert.equal(findMatchRuns(dead,width).length,0);assert.equal(findMatchMove(dead,width),null);
  const events=[],g=new Match3Game({width,onEvent:(name,payload)=>events.push([name,payload])});
  g.board=dead;g.start();assert.equal(g.checkMoves(),false);assert.equal(g.status,'dead');
  assert.ok(events.some(([name])=>name==='no_moves'));
  assert.equal(g.getHint(),null);assert.equal(g.swap(0,1),false);
  const revived=new Match3Game({width,saved:g.snapshot()});assert.equal(revived.status,'dead');
  revived.start();assert.equal(revived.status,'playing');assert.ok(hasMatchMove(revived.board,width));
 }
});

test('old 7x7 saves remain readable and cross-width snapshots are rejected atomically',()=>{
 const classic=new Match3Game({random:()=>.8});const legacy=classic.snapshot();delete legacy.width;
 const restored=new Match3Game({width:7,saved:legacy});assert.deepEqual(restored.board,classic.board);
 for(const width of [6,8]){
  const g=new Match3Game({width});const initial=g.snapshot();
  assert.equal(g.restore(legacy),false);assert.deepEqual(g.snapshot(),initial);
  assert.equal(g.restore({...initial,width:7}),false);assert.deepEqual(g.snapshot(),initial);
 }
});

test('variable-width hitboxes center the board and exclude gutters',()=>{
 for(const width of MATCH_WIDTHS){
  const {x,y,step,cell}=matchLayout(width);
  assert.equal(matchCellAt(x+cell/2,y+cell/2,width),0);
  assert.equal(matchCellAt(x+(width-1)*step+cell/2,y+(MATCH_ROWS-1)*step+cell/2,width),width*MATCH_ROWS-1);
  assert.equal(matchCellAt(x+cell+1,y,width),-1,'the gap must not register a tap');
  assert.ok(x>0&&x+width*step-4<=340);
 }
});

test('renderer draws the real pair hint asset and obvious dead-board overlay',()=>{
 const calls=[];const ctx={setTransform(){},fillRect(){},strokeRect(){},beginPath(){},roundRect(){},fill(){},stroke(){},moveTo(){},lineTo(){},save(){},restore(){},drawImage(img){calls.push(['image',img.name]);},fillText(txt){calls.push(['text',txt]);},createLinearGradient(){return {addColorStop(){}}}};
 const canvas={width:720,height:904,getContext:()=>ctx};
 const images={match_vec_hint:{name:'hint',complete:true,naturalWidth:64}};
 const g=new Match3Game({width:8});g.start();g.update(4.2);
 drawMatch3(canvas,g,images,{hint:g.getHint()});
 assert.ok(calls.some(([k,n])=>k==='image'&&n==='hint'));
 g.board=deadBoard(8);g.checkMoves();calls.length=0;
 drawMatch3(canvas,g,images,{});
 assert.ok(calls.some(([k,n])=>k==='text'&&n==='NO MOVES LEFT'));
 const vector=fs.readFileSync(new URL('../assets/match3/vector/hint.svg',import.meta.url),'utf8');
 assert.match(vector,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 const bundle=fs.readFileSync(new URL('../dist/frontend.js',import.meta.url),'utf8');
 assert.ok(bundle.includes('\"match_vec_hint\":\"data:image/svg+xml;base64,'+Buffer.from(vector).toString('base64')+'\"'),'exact hint SVG embedded');
});
