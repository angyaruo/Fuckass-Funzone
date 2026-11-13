import test from 'node:test';
import assert from 'node:assert/strict';
import {drawFrame} from '../src/frontend.js';
import {ArcadeEngine} from '../src/engine.js';

function renderer() {
  const drawn=[], texts=[], fills=[];
  const ctx={
    drawImage(img,...box){drawn.push({name:img.name,box})},
    fillText(text,x,y){texts.push({text,color:this.fillStyle,align:this.textAlign,x,y})},
    fillRect(...box){fills.push({color:this.fillStyle,box})},
    setTransform(){},clearRect(){},strokeRect(){},beginPath(){},roundRect(){},fill(){},stroke(){},
    ellipse(){},arc(){},moveTo(){},lineTo(){},closePath(){},save(){},restore(){},translate(){},rotate(){},
    createLinearGradient(){return {addColorStop(){}}},
  };
  const canvas={width:720,height:904,getContext:()=>ctx};
  const images=new Proxy({}, {get(_obj,name){return {name,complete:true,naturalWidth:100,naturalHeight:100}}});
  return {canvas,images,drawn,texts,fills};
}
const lifecycle={ready:false,activeIds:[]};
const opts={reduceMotion:false};

test('Bird and Gabi HUD anchors use left alignment on first play without requiring a crash',()=>{
 for(const mode of ['bird','gabi']){
   const g=new ArcadeEngine({mode});g.start();
   const screen=renderer();
   // Reused canvas after Simon, Duck or another game; textAlign is not
   // cleared by CanvasRenderingContext2D.setTransform or clearRect.
   screen.canvas.getContext().textAlign='center';
   drawFrame(screen.canvas,g,screen.images,opts,lifecycle,12);
   const hud=screen.texts.filter(x=>x.text.startsWith('SCORE ')||x.text.startsWith('BEST '));
   assert.equal(hud.length,2);
   assert.ok(hud.every(x=>x.align==='left'),`${mode}: score & best are left anchored even before first death`);
   // The update must be unconditional, even when another draw leaves center.
   screen.canvas.getContext().textAlign='center';
   drawFrame(screen.canvas,g,screen.images,opts,lifecycle,12);
   assert.ok(screen.texts.slice(-2).every(x=>x.align==='left'),`${mode}: subsequent frames ignore stale alignment`);
 }
});

test('Gabi uses calm frames only in idle and progression 3→5 for jetpack taps on the real canvas',()=>{
 const g=new ArcadeEngine({mode:'gabi',random:()=>.5});g.start();
 const paint=(reduced=false)=>{
   const s=renderer();drawFrame(s.canvas,g,s.images,{reduceMotion:reduced},lifecycle,0);
   return s.drawn.filter(x=>/^gabi_fly_/.test(x.name)).map(x=>x.name);
 };
 for(const [age,expected] of [[0,0],[.12,1],[.24,2],[.35,0],[.46,1]]){
   g.age=age;assert.deepEqual(paint(),[`gabi_fly_${expected}`],`normal flight at ${age}s`);
 }
 assert.deepEqual(paint(true),['gabi_fly_0'],'reduced motion uses the static resting face');
 g.press();assert.deepEqual(paint(),['gabi_fly_3']);
 g.update(.12);g.update(.04);assert.deepEqual(paint(),['gabi_fly_4']);
 g.update(.12);g.update(.04);assert.deepEqual(paint(),['gabi_fly_5']);
 assert.deepEqual(paint(true),['gabi_fly_5'],'reduced motion keeps a meaningful thrust cue');
 g.release();assert.deepEqual(paint(),['gabi_fly_5']);
 g.update(.12);g.update(.05);
 assert.match(paint()[0],/^gabi_fly_[012]$/,'release returns to calm loop');
 g.press();g.release();assert.deepEqual(paint(),['gabi_fly_3'],'quick tap registers without a RAF step');
 g.status='dead';assert.deepEqual(paint(),[],'dead uses separate crash sprite, not live thrust animation');
});

test('Gabi renders city buildings, fixed previous-best flag, actual flame sprites, white coin text and record art',()=>{
  const g=new ArcadeEngine({mode:'gabi',recordTarget:1});
  g.start();g.holding=true;g.coins=20;g.score=2;g.age=3;
  g.newBest=true;g.newBestFlash=2;
  g.spawn();g.pipes[0].x=185;g.pipes[0].landmark=true;
  const screen=renderer();drawFrame(screen.canvas,g,screen.images,opts,lifecycle,2);
  assert.ok(screen.drawn.some(x=>x.name==='record_flag'),'flag art visible atop the milestone tower');
  assert.ok(screen.drawn.some(x=>/^flame_/.test(x.name)),'actual PNG flame visible during thrust');
  assert.ok(screen.drawn.some(x=>x.name==='best_banner'),'NEW BEST! banner renders while playing');
  assert.ok(screen.fills.some(x=>x.color==='#ffcf91' || x.color==='#be9cf3'),'lit building windows are drawn');
  assert.ok(screen.texts.some(x=>x.text==='×20' && x.color==='#ffffff'),'coin total is drawn in white');
  assert.ok(screen.texts.some(x=>x.text==='BEST 002' && x.color==='#ffffff'),'HUD has a bright current best');
  g.status='dead';g.holding=false;g.newBestFlash=0;
  const endScreen=renderer();drawFrame(endScreen.canvas,g,endScreen.images,opts,lifecycle,2);
  assert.ok(endScreen.drawn.some(x=>x.name==='game_over_banner'),'game over art is used');
  assert.ok(endScreen.drawn.some(x=>x.name==='best_banner'),'new record art survives to game over');
});

test('Bird mode remains pipes-only with no Gabi buildings or flame assets',()=>{
  const g=new ArcadeEngine({mode:'bird'});g.start();g.spawn();g.pipes[0].x=190;
  const screen=renderer();drawFrame(screen.canvas,g,screen.images,opts,lifecycle,3);
  assert.ok(screen.fills.some(x=>x.color==='#83d862'),'bird pipes remain green');
  assert.ok(!screen.fills.some(x=>x.color==='#ffcf91'),'no lit building windows in bird mode');
  assert.ok(!screen.drawn.some(x=>/^flame_/.test(x.name)),'no Gabi flame sprites');
});
