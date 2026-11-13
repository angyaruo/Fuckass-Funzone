import test from 'node:test';
import assert from 'node:assert/strict';
import { ArcadeEngine } from '../src/engine.js';
import { SimonGame, DuckGame, SlotGame, spinSymbols, slotMultiplier } from '../src/mini-games.js';
import { simonCell } from '../src/mini-games-render.js';
import { ReactionDirector } from '../src/reactions.js';
const playFor = (g,seconds) => {for(let t=0;t<seconds;t+=.1)g.update(.1)};

test('Jetpack collectible generates exactly one immediate coin event, independent of death',()=>{
 const events=[];const game=new ArcadeEngine({mode:'gabi',random:()=>.4,onEvent:(event,data)=>events.push({event,data})});
 game.start();game.spawnClock=9999;game.y=190;game.velocity=0;
 game.pipes=[{x:65,width:54,center:190,gap:250,passed:false,coinTaken:false,number:1}];
 game.step(.001);
 assert.equal(game.coins,1);assert.equal(events.filter(e=>e.event==='coin').length,1);
 game.step(.001);assert.equal(game.coins,1,'holding inside the same collectible cannot farm a coin');
});
test('Simon replays an actual growing sequence, rejects premature taps, and scores exactly one completed round',()=>{
 const events=[];const g=new SimonGame({random:()=>.1,onEvent:(type,data)=>events.push({type,data})});
 g.start();assert.equal(g.level,1);
 assert.equal(g.press(0),false,'input is locked while the demonstration plays');
 playFor(g,1.6);assert.equal(g.phase,'input');assert.equal(g.press(0),true);assert.equal(g.score,1);
 assert.equal(events.filter(e=>e.type==='score').length,1);
 playFor(g,2);assert.equal(g.level,2);playFor(g,2);assert.equal(g.phase,'input');
 g.press(3);assert.equal(g.status,'dead');assert.equal(g.score,1);
 const h=new SimonGame({saved:g.snapshot()});assert.equal(h.score,1);assert.equal(h.status,'dead');
 assert.equal(simonCell(80,140),0);assert.equal(simonCell(250,150),1);assert.equal(simonCell(80,285),2);assert.equal(simonCell(250,285),3);
});
test('Duck Hunt supports moving targets, countdown, hit detection, and a miss end state',()=>{
 const events=[];const g=new DuckGame({random:()=>.5,onEvent:e=>events.push(e)});
 assert.equal(g.shoot(100,100),false);assert.equal(g.misses,0,'start click cannot be counted as a missed shot');
 g.ducks=[{id:1,x:100,y:140,vx:80,phase:0,flap:0}];
 assert.equal(g.shoot(100,140),true);assert.equal(g.score,1);
 for(let i=0;i<8;i++)g.shoot(20,20);
 assert.equal(g.status,'dead');assert.equal(g.misses,8);
 const saved=g.snapshot();const restored=new DuckGame({saved});assert.equal(restored.status,'dead');assert.equal(restored.score,1);
 const timed=new DuckGame();timed.start();playFor(timed,46);assert.equal(timed.status,'dead');assert.equal(timed.timeLeft,0);
});
test('Slots math is deterministic, stakes are safe, and payouts settle once',()=>{
 assert.deepEqual(spinSymbols(()=>.999),['seven','seven','seven']);
 assert.equal(slotMultiplier(['seven','seven','seven']),40);
 assert.equal(slotMultiplier(['fish','fish','fish']),3);
 assert.equal(slotMultiplier(['fish','fish','star']),1);
 assert.equal(slotMultiplier(['fish','cherry','star']),0);
 const events=[];const g=new SlotGame({random:()=>.999,onEvent:(event,data)=>events.push({event,data})});
 assert.equal(g.spin(3),true);assert.equal(g.spin(3),false,'cannot buy two pending spins');
 playFor(g,1.2);assert.equal(g.pending,null);assert.equal(g.lastPayout,120);
 assert.equal(events.filter(e=>e.event==='land').length,1);
 playFor(g,3);assert.equal(events.filter(e=>e.event==='land').length,1,'no double settlement');
 g.spin(0);playFor(g,2);assert.equal(g.lastPayout,0,'FREE spins never mint tickets');
 assert.equal(g.spin(-1),false);assert.equal(g.spin(2),false);
});
test('Slots pending result survives reload without losing prepaid stake or rerolling',()=>{
 const before=new SlotGame({random:()=>.999});before.spin(5);before.update(.25);
 const stored=before.snapshot();assert.equal(stored.pending.stake,5);
 const after=new SlotGame({random:()=>0,saved:stored});assert.equal(after.status,'paused');assert.deepEqual(after.pending.reels,['seven','seven','seven']);
 const events=[];after.onEvent=(name,data)=>events.push({name,data});
 after.start();playFor(after,1.1);assert.equal(after.lastPayout,200);
 assert.equal(events.filter(e=>e.name==='land').length,1);
 const pending=new SlotGame();pending.spin(3);assert.equal(pending.cancel(),3);assert.equal(pending.pending,null);
});
test('new arcade games have contextual, non-spamming Gabu commentary',()=>{
 const d=new ReactionDirector();assert.equal(d.emit('simon','note',{color:0}),null);
 assert.ok(d.emit('simon','death')?.line);d.clear();
 assert.equal(d.emit('duck','score'),null);assert.ok(d.emit('duck','death')?.line);d.clear();
 assert.equal(d.emit('slots','spin'),null);assert.equal(d.emit('slots','jackpot')?.mood,'magnate');
});
