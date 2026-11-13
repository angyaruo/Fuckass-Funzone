import test from 'node:test';
import assert from 'node:assert/strict';
import { Match3Game, MATCH_TIMER_MODES } from '../src/match3.js';
import { DuckGame, DUCK_TIMER_MODES, DUCK_SPEEDS } from '../src/mini-games.js';
import { drawMatch3 } from '../src/match3-render.js';
import { drawDuck } from '../src/mini-games-render.js';

const advance = (game, seconds) => { for (let i = 0; i < seconds * 10; i++) game.update(.1); };
const canvasTrace = () => {
 const words=[];
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),fillText(value){words.push(String(value));}},
  {get(target,key){return key in target?target[key]:()=>{};},set(target,key,value){target[key]=value;return true;}});
 return {canvas:{width:720,height:904,getContext:()=>ctx},words};
};

test('Match-3 timer modes count down only while playing, fail exactly once, and restore',()=>{
 assert.deepEqual(MATCH_TIMER_MODES,[0,60,120,180]);
 const events=[];const g=new Match3Game({timerSeconds:60,onEvent:(event)=>events.push(event)});
 assert.equal(g.timeLeft,60);g.update(5);assert.equal(g.timeLeft,60,'idle clock is frozen');
 g.start();advance(g,12);assert.ok(g.timeLeft>47.9&&g.timeLeft<48.1);
 g.pause();const left=g.timeLeft;advance(g,12);assert.equal(g.timeLeft,left,'pause does not spend remaining time');
 const snap=g.snapshot();const h=new Match3Game({saved:snap,timerSeconds:0});
 assert.equal(h.status,'paused');assert.equal(h.timerSeconds,60);assert.equal(h.timeLeft,left,'paused restore does not refill the clock');
 h.start();advance(h,49);assert.equal(h.status,'dead');assert.equal(h.endReason,'time');assert.equal(h.timeLeft,0);
 assert.equal(h.swap(0,1),false);
 const traced=canvasTrace();drawMatch3(traced.canvas,h,{},{});
 assert.ok(traced.words.includes('TIME’S UP!'),'a timeout must not be mislabeled NO MOVES');
 assert.equal(events.filter(x=>x==='timeout').length,0,'the original paused board never emitted a late timeout');
 h.reset(180);assert.equal(h.timerSeconds,180);assert.equal(h.timeLeft,180);assert.equal(h.endReason,null);
});

test('Match-3 no-timer mode is truly unlimited and old saves remain compatible',()=>{
 const g=new Match3Game({timerSeconds:0});g.start();advance(g,240);
 assert.equal(g.status,'playing');assert.equal(g.timeLeft,0);assert.equal(g.timerSeconds,0);
 const traced=canvasTrace();drawMatch3(traced.canvas,g,{},{});
 assert.ok(traced.words.includes('ZEN · NO TIMER'));
 const legacy=g.snapshot();delete legacy.timerSeconds;delete legacy.timeLeft;delete legacy.endReason;
 const restored=new Match3Game({timerSeconds:0,saved:legacy});assert.equal(restored.status,'paused');assert.equal(restored.timerSeconds,0);
 const before=restored.snapshot();assert.equal(restored.restore({...before,timerSeconds:15}),false);
 assert.deepEqual(restored.snapshot(),before,'invalid timer data must not partially mutate the board');
});

test('Duck Hunt timed/untimed modes preserve misses as a loss condition and countdown is pausable',()=>{
 assert.deepEqual(DUCK_TIMER_MODES,[0,30,45,60,90]);assert.deepEqual(DUCK_SPEEDS,['chill','normal','chaos']);
 const events=[];const timed=new DuckGame({timerSeconds:30,onEvent:(name,data)=>events.push({name,data})});
 timed.start();advance(timed,8);timed.pause();const left=timed.timeLeft;
 advance(timed,30);assert.equal(timed.timeLeft,left);
 const restored=new DuckGame({saved:timed.snapshot(),timerSeconds:90,speed:'chaos'});
 assert.equal(restored.timerSeconds,30);assert.equal(restored.speed,'normal');assert.equal(restored.timeLeft,left);
 restored.start();advance(restored,24);assert.equal(restored.status,'dead');assert.equal(restored.endReason,'time');
 const traced=canvasTrace();drawDuck(traced.canvas,restored);
 assert.ok(traced.words.includes('TIME’S UP!'));assert.ok(traced.words.includes('The 30-second season has concluded.'));
 const free=new DuckGame({timerSeconds:0});free.start();advance(free,120);
 assert.equal(free.status,'playing');assert.equal(free.timeLeft,0);
 for(let i=0;i<8;i++)free.shoot(10,10);
 assert.equal(free.status,'dead');assert.equal(free.endReason,'misses');
 const freeTrace=canvasTrace();drawDuck(freeTrace.canvas,new DuckGame({timerSeconds:0}));
 assert.ok(freeTrace.words.includes('FREE HUNT'));assert.ok(freeTrace.words.includes('OPEN'));
 const missTrace=canvasTrace();drawDuck(missTrace.canvas,free);
 assert.ok(missTrace.words.includes('HUNT TERMINATED'),'untimed loss is not TIME’S UP');
});

test('Duck speed changes real duck velocity/spawn pace and saved hunt remains stable',()=>{
 const velocities={};const spawns={};
 for(const speed of DUCK_SPEEDS){
  const g=new DuckGame({random:()=>.5,speed,timerSeconds:0});g.start();
  g.spawn();velocities[speed]=Math.abs(g.ducks[0].vx);
  g.ducks=[];g.spawnClock=0;g.update(.1);spawns[speed]=g.spawnClock;
  const rehydrated=new DuckGame({saved:g.snapshot(),timerSeconds:90,speed:'normal'});
  assert.equal(rehydrated.speed,speed);assert.equal(rehydrated.timerSeconds,0);
 }
 assert.ok(velocities.chill<velocities.normal&&velocities.normal<velocities.chaos,'difficulty must affect physics');
 assert.ok(spawns.chill>spawns.normal&&spawns.normal>spawns.chaos,'difficulty must affect spawn interval');
 const corrupted=new DuckGame();const before=corrupted.snapshot();
 assert.equal(corrupted.restore({...before,speed:'hyperspeed'}),false);
 assert.deepEqual(corrupted.snapshot(),before,'bad options must not corrupt a valid hunt');
 const old={score:4,misses:2,shots:5,timeLeft:30,status:'paused'};
 const legacy=new DuckGame({saved:old});assert.equal(legacy.timerSeconds,45);assert.equal(legacy.speed,'normal');
});
