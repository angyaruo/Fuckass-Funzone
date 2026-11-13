import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from '../dist/frontend.js';
import { findMatchRuns, findMatchMove } from '../src/match3.js';
import { matchLayout } from '../src/match3-render.js';

class ElementMock {
  constructor(tag='div') {this.tagName=tag.toUpperCase();this.children=[];this.listeners=new Map();this.attributes=new Map();this.style={};this.className='';this.textContent='';this.dataset={};this.checked=false;this.complete=true;this.naturalWidth=120;this.naturalHeight=120;
    this.classList={toggle:(cls,on)=>{const s=new Set(this.className.split(' ').filter(Boolean));if(on)s.add(cls);else s.delete(cls);this.className=[...s].join(' ');}}; }
  append(...nodes){this.children.push(...nodes)} appendChild(node){this.append(node);return node;}
  replaceChildren(...nodes){this.children=[...nodes];this.textContent='';}
  setAttribute(key,value){this.attributes.set(key,value)}
  addEventListener(event,callback){if(!this.listeners.has(event))this.listeners.set(event,new Set());this.listeners.get(event).add(callback)}
  removeEventListener(event,callback){this.listeners.get(event)?.delete(callback)}
  dispatch(event,payload={}){for(const fn of [...(this.listeners.get(event)||[])])fn({target:this,preventDefault(){},stopPropagation(){},...payload});}
  focus(){}
  getBoundingClientRect(){return {left:0,top:0,width:360,height:452}}
  setPointerCapture(){} hasPointerCapture(){return false}releasePointerCapture(){}
  getContext(){if(this.tagName!=='CANVAS')return null;return {
    setTransform(){},clearRect(){},fillRect(){},strokeRect(){},beginPath(){},roundRect(){},fill(){},stroke(){},ellipse(){},arc(){},moveTo(){},lineTo(){},closePath(){},fillText(){},drawImage(){},save(){},restore(){},translate(){},rotate(){},createLinearGradient(){return{addColorStop(){}}}
  };}
}
function flatten(node){return [node,...node.children.flatMap(c=>c instanceof ElementMock?flatten(c):[])];}

test('Spindle mock: mounts, starts once, survives end, handles stop and teardown without leaks',()=>{
 const old={window:globalThis.window,document:globalThis.document,Image:globalThis.Image,HTMLElement:globalThis.HTMLElement,localStorage:globalThis.localStorage,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 const window=new ElementMock('window');const document=new ElementMock('document');
 document.createElement=(tag)=>new ElementMock(tag);document.createElementNS=(_ns,tag)=>new ElementMock(tag);document.hidden=false;
 globalThis.window=window;globalThis.document=document;globalThis.HTMLElement=ElementMock;
 globalThis.Image=class extends ElementMock {constructor(){super('img')}set src(url){this._src=url}get src(){return this._src}};
 const cache=new Map();globalThis.localStorage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)};
 const queued=new Map();let id=0;
 globalThis.requestAnimationFrame=(cb)=>{queued.set(++id,cb);return id};globalThis.cancelAnimationFrame=id=>queued.delete(id);
 const ws=new Map();const placements={widget:null,drawer:null,action:null};
 const ctx={host:{extensionInstallationId:'test-profile'},events:{on:(event,fn)=>{ws.set(event,fn);return()=>ws.delete(event)}},ui:{
   createFloatWidget:()=>{
    const h={root:new ElementMock('section'),visible:null,destroyed:false,setVisible(v){this.visible=v},destroy(){this.destroyed=true}};
    placements.widget=h;return h;
   },
   registerDrawerTab:()=>{const h={root:new ElementMock('section'),destroyed:false,destroy(){this.destroyed=true}};placements.drawer=h;return h;},
   registerInputBarAction:()=>{const h={destroyed:false,onClick(fn){this.click=fn;return()=>{this.click=null}},destroy(){this.destroyed=true}};placements.action=h;return h;}
 }};
 try {
  const stop=setup(ctx);assert.equal(placements.widget.visible,false);assert.equal(ws.size,3);
  const buttons=flatten(placements.widget.root).filter(x=>x.tagName==='BUTTON');
  assert.ok(buttons.length>5);
  ws.get('GENERATION_STARTED')({generationId:'G1'});
  assert.equal(placements.widget.visible,true);assert.ok(queued.size>0);
  ws.get('GENERATION_STARTED')({generationId:'G1'});
  const canvas=flatten(placements.widget.root).find(x=>x.tagName==='CANVAS');assert.ok(canvas);
  canvas.dispatch('pointerdown',{pointerType:'touch',pointerId:1,button:0});
  canvas.dispatch('pointerup',{pointerId:1});
  ws.get('GENERATION_ENDED')({generationId:'G1'});
  assert.equal(placements.widget.visible,true,'a finished answer never interrupts an active run');
  // The single phone picker opens six game apps without a permanent tab rail.
  const apps=flatten(placements.widget.root).filter(x=>x.className==='bb-app');
  assert.equal(apps.length,6,'Funzone OS exposes six custom-asset apps');
  assert.equal(flatten(placements.widget.root).filter(x=>x.className==='bb-mode').length,0);
  const pick=mode=>{const picker=flatten(placements.widget.root).find(x=>x.className.includes('bb-phone-button'));assert.ok(picker);picker.dispatch('click');
    const target=apps.find(x=>x.title===`Open ${mode}`);assert.ok(target,mode);target.dispatch('click');};
  pick('Snake');
  const root=flatten(placements.widget.root).find(x=>x.className.includes('bb-float'));
  root.dispatch('keydown',{target:canvas,code:'ArrowDown'});
  pick('2048');root.dispatch('keydown',{target:canvas,code:'ArrowLeft'});
  // The new single primary control is actually functional while a game is running.
  const primary=flatten(placements.widget.root).find(x=>x.className.includes('bb-mainbutton'));
  assert.ok(primary);
  assert.equal(primary.attributes.get('aria-label'),'Pause','2048 started from directional input');
  primary.dispatch('click');assert.equal(primary.attributes.get('aria-label'),'Resume');
  primary.dispatch('click');assert.equal(primary.attributes.get('aria-label'),'Pause');
  assert.equal(flatten(placements.widget.root).filter(x=>x.className.includes('bb-ticker')).length,0,'tickets moved into single top line');
  assert.equal(flatten(placements.widget.root).filter(x=>x.className.includes('bb-wallet')).length,1,'tickets have one compact wallet');
  assert.equal(flatten(placements.widget.root).filter(x=>x.className.includes('bb-mini')).length,3,'duplicate pause button removed');
  const currentSave=JSON.parse(cache.get('bird_brain:v1:test-profile'));
  assert.equal(currentSave.arcadeGame,'2048');
  assert.ok(Array.isArray(currentSave.puzzles.merge.board));
  assert.ok(Array.isArray(currentSave.puzzles.snake.body));
  pick('Trinket Panic');
  assert.equal(JSON.parse(cache.get('bird_brain:v1:test-profile')).arcadeGame,'match3');
  const freshMatch=JSON.parse(cache.get('bird_brain:v1:test-profile')).puzzles.match3;
  assert.equal(freshMatch.board.length,49);
  let legal=null;
  for(let a=0;a<49&&!legal;a++)for(const b of [a+1,a+7]){
    if(b>=49||Math.abs(a%7-b%7)+Math.abs(Math.floor(a/7)-Math.floor(b/7))!==1)continue;
    const attempt=freshMatch.board.map(t=>({...t}));[attempt[a],attempt[b]]=[attempt[b],attempt[a]];
    if(findMatchRuns(attempt).length){legal=[a,b];break;}
  }
  assert.ok(legal,'engine has a legal first move');
  function tap(ix){const cx=28+ix%7*44+20,cy=77+Math.floor(ix/7)*44+20;
    canvas.dispatch('pointerdown',{pointerType:'touch',pointerId:1,clientX:cx,clientY:cy});
    canvas.dispatch('pointerup',{pointerType:'touch',pointerId:1,clientX:cx,clientY:cy});}
  tap(legal[0]);tap(legal[1]);
  const updatedMatch=JSON.parse(cache.get('bird_brain:v1:test-profile')).puzzles.match3;
  assert.equal(updatedMatch.moves,1,'two adjacent taps make a real match');
  assert.ok(updatedMatch.score>0,'match score survives in localStorage');
  assert.ok(flatten(placements.widget.root).some(x=>x.className==='bb-reaction'),'Gabu reaction DOM is mounted');
  // Width controls preserve the original 7x7 save and create an independent 8x7 board.
  const widthSelect=flatten(placements.widget.root).find(x=>x.className==='bb-match-size-select');assert.ok(widthSelect);
  widthSelect.value='8';widthSelect.dispatch('change');
  let widthSave=JSON.parse(cache.get('bird_brain:v1:test-profile'));
  assert.equal(widthSave.match3Width,8);assert.equal(widthSave.puzzles.match3.board.length,56);
  assert.equal(widthSave.match3Boards[7].moves,1,'classic progress survives width switching');
  const next=findMatchMove(widthSave.puzzles.match3.board,8);assert.ok(next,'8-column board is playable');
  const wide=matchLayout(8);
  for(const ix of next){const cx=wide.x+(ix%8)*wide.step+wide.cell/2,cy=wide.y+Math.floor(ix/8)*wide.step+wide.cell/2;
    canvas.dispatch('pointerdown',{pointerType:'touch',pointerId:5,clientX:cx,clientY:cy});
    canvas.dispatch('pointerup',{pointerType:'touch',pointerId:5,clientX:cx,clientY:cy});}
  widthSave=JSON.parse(cache.get('bird_brain:v1:test-profile'));
  assert.equal(widthSave.puzzles.match3.moves,1,'wide touch hitboxes map to real matches');
  widthSelect.value='7';widthSelect.dispatch('change');
  widthSave=JSON.parse(cache.get('bird_brain:v1:test-profile'));
  assert.equal(widthSave.puzzles.match3.moves,1,'classic save restores without wiping its move history');
  assert.equal(widthSave.match3Boards[8].moves,1,'wide board remains banked for later');
  const drawerWidth=flatten(placements.drawer.root).find(x=>x.attributes.get('aria-label')==='Match-3 difficulty');assert.ok(drawerWidth);
  drawerWidth.value='6';drawerWidth.dispatch('change');
  assert.equal(JSON.parse(cache.get('bird_brain:v1:test-profile')).puzzles.match3.board.length,42,'drawer difficulty changes width too');
  widthSelect.value='7';widthSelect.dispatch('change');
  pick('Plinko');
  const plinkoStage=flatten(placements.widget.root).find(x=>x.className==='bb-game-stage');
  const plinkoHost=flatten(plinkoStage).find(x=>x.className==='bb-plinko-host');
  assert.equal(plinkoStage.dataset.game,'plinko');
  assert.ok(plinkoHost?.children.some(x=>x.className==='bb-plinko-host-art'),'monocled Gabu peeks over the cabinet');
  const plinkoBar=flatten(placements.widget.root).find(x=>x.className==='bb-controls');
  assert.equal(plinkoBar.dataset.mode,'plinko');
  assert.ok(plinkoBar.children.some(x=>x.className==='bb-plinko-bets'),'wager and drop share the same action strip');
  const walletBefore=JSON.parse(cache.get('bird_brain:v1:test-profile')).tickets;
  const free=flatten(placements.widget.root).find(x=>x.dataset.value==='0');
  assert.ok(free,'practice wager is available');free.dispatch('click');
  canvas.dispatch('pointerdown',{pointerType:'touch',button:0,pointerId:4,clientX:180,clientY:140});
  const activeDrop=JSON.parse(cache.get('bird_brain:v1:test-profile'));
  assert.equal(activeDrop.puzzles.plinko.ball.stake,0,'practice drop costs no tickets');
  assert.equal(activeDrop.tickets,walletBefore,'practice preserves wallet');
  pick('Gabi Jetpack');

  assert.equal(JSON.parse(cache.get('bird_brain:v1:test-profile')).arcadeGame,'gabi');
  assert.ok(flatten(placements.widget.root).some(x=>x.tagName==='SVG'),'SVG icons are built as real DOM elements');
  let tasks=[...queued.entries()];for(const [key,fn] of tasks){queued.delete(key);fn(16);}
  stop();stop();
  assert.equal(ws.size,0);assert.equal(queued.size,0);
  assert.equal(placements.widget.destroyed,true);assert.equal(placements.drawer.destroyed,true);assert.equal(placements.action.destroyed,true);
  assert.equal(window.listeners.get('blur')?.size||0,0);
 } finally {for(const [k,v] of Object.entries(old)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
