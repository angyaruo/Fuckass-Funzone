import test from 'node:test';
import assert from 'node:assert/strict';
import {ArcadeEngine,WORLD,lifecycleTransition,sanitizeSettings,progressSpeed} from '../src/engine.js';

const stable=()=>.5;
test('settings sanitize corruption and preserve defaults',()=>{
 assert.deepEqual(sanitizeSettings(null),{autoOpen:true,mode:'gabi',difficulty:'normal',sound:false,reduceMotion:false,autoHideIdle:false,gabuReactions:true});
 assert.equal(sanitizeSettings({mode:'bird',difficulty:'chaos',sound:true}).difficulty,'chaos');
 assert.equal(sanitizeSettings({mode:'bad',difficulty:'bad',sound:'true'}).sound,false);
});
test('start/stop dedup, overlapping jobs, readiness survives late duplicate stop',()=>{
 let s={activeIds:[],ready:false};
 s=lifecycleTransition(s,'start','g1');s=lifecycleTransition(s,'start','g1');
 assert.deepEqual(s.activeIds,['g1']);
 s=lifecycleTransition(s,'start','g2');
 s=lifecycleTransition(s,'end','g1');assert.equal(s.ready,false);
 s=lifecycleTransition(s,'stop','g2');assert.equal(s.ready,true);
 s=lifecycleTransition(s,'stop','g2');assert.deepEqual(s.activeIds,[]);
 s=lifecycleTransition(s,'start','g3');assert.equal(s.ready,false);
});
test('bird flaps, pauses, resumes, and dt cannot explode after tab suspend',()=>{
 const g=new ArcadeEngine({random:stable,mode:'bird'});
 g.start();g.press();assert.equal(g.velocity,-285);
 const y=g.y;g.update(.02);assert.ok(g.y<y);
 g.pause();const hold=g.y;g.update(10);assert.equal(g.y,hold);
 g.start();g.update(1000);assert.equal(g.status,'playing');assert.ok(Math.abs(g.y-hold)<60);
});
test('gabi hold thrust changes acceleration; bird stays impulse based',()=>{
 let g=new ArcadeEngine({random:stable,mode:'gabi'});g.start();g.velocity=0;
 g.press();g.update(.08);assert.ok(g.velocity<0);
 g.release();let v=g.velocity;g.update(.06);assert.ok(g.velocity>v);
 g=new ArcadeEngine({random:stable,mode:'bird'});g.start();g.velocity=0;g.update(.08);assert.ok(g.velocity>0);
});
test('bird one collision death; gabi three hits with invulnerability',()=>{
 const event=[];const g=new ArcadeEngine({random:stable,mode:'bird',onEvent:(x)=>event.push(x)});
 g.start();g.hit('obstacle');assert.equal(g.status,'dead');assert.equal(g.health,0);
 assert.equal(event.filter(x=>x==='death').length,1);
 const t=new ArcadeEngine({random:stable,mode:'gabi'});t.start();t.hit('obstacle');assert.equal(t.health,2);
 t.hit('obstacle');assert.equal(t.health,2);
 t.invulnerable=0;t.hit('obstacle');assert.equal(t.health,1);
 t.invulnerable=0;t.hit('obstacle');assert.equal(t.status,'dead');
});
test('clear pipe scores once, does not lose score on subsequent frames',()=>{
 const g=new ArcadeEngine({random:stable,mode:'bird'});g.start();g.y=180;g.velocity=0;
 g.pipes.push({x:WORLD.playerX-90,width:60,center:200,gap:300,passed:false,coinTaken:false});
 g.step(1/120);assert.equal(g.score,1);g.step(1/120);assert.equal(g.score,1);
});
test('coin collision counts once; null/NaN dt is a no-op',()=>{
 const g=new ArcadeEngine({random:stable,mode:'gabi'});g.start();g.y=195;g.velocity=0;
 g.pipes.push({x:WORLD.playerX-31,width:62,center:195,gap:340,passed:false,coinTaken:false});
 g.update(NaN);assert.equal(g.age,0);g.update(-100);assert.equal(g.age,0);
 g.step(1/120);assert.equal(g.coins,1);g.step(1/120);assert.equal(g.coins,1);
});
test('reset clears transient state without leaking previous mode or coins',()=>{
 const g=new ArcadeEngine({mode:'gabi'});g.start();g.coins=99;g.pipes.push({x:12});
 g.reset('bird','chill');assert.equal(g.coins,0);assert.equal(g.health,1);assert.equal(g.pipes.length,0);
 assert.equal(g.status,'idle');assert.equal(g.difficulty,'chill');
});


test('progression accelerates monotonically, caps at +72%, and respects selected difficulty',()=>{
 const start=progressSpeed('gabi','normal',0,0);
 assert.equal(start,166);
 assert.ok(progressSpeed('gabi','normal',4,1500)>start);
 assert.ok(progressSpeed('gabi','normal',12,3500)>progressSpeed('gabi','normal',4,1500));
 assert.ok(Math.abs(progressSpeed('gabi','normal',200,100000)-start*1.72)<.001);
 assert.ok(progressSpeed('bird','chaos',10,500)>progressSpeed('bird','chill',10,500));
 assert.ok(Number.isFinite(progressSpeed('bird','chaos',NaN,Infinity)));
});

test('previous personal best places one immovable rooftop flag on its scoring building',()=>{
 const g=new ArcadeEngine({random:stable,mode:'gabi',recordTarget:3});
 for(let i=0;i<5;i++)g.spawn();
 assert.deepEqual(g.pipes.filter(p=>p.landmark).map(p=>p.number),[3]);
 assert.equal(g.recordTarget,3);
 g.start();g.y=200;g.velocity=0;
 g.score=3;g.distance=345;
 const events=[];g.onEvent=(type,details)=>events.push([type,details]);
 g.pipes=[{x:WORLD.playerX-95,width:63,center:200,gap:370,passed:false,coinTaken:true}];
 g.step(1/120);
 assert.equal(g.score,4);
 assert.equal(g.newBest,true);
 assert.ok(g.newBestFlash>2.9);
 assert.equal(events.filter(x=>x[0]==='new_best').length,1);
 assert.equal(events.find(x=>x[0]==='new_best')[1].previousBest,3);
 g.pipes=[{x:WORLD.playerX-95,width:63,center:200,gap:370,passed:false,coinTaken:true}];
 g.step(1/120);
 assert.equal(g.score,5);
 assert.equal(events.filter(x=>x[0]==='new_best').length,1);
 assert.equal(g.recordTarget,3,'landmark must not chase new records mid-run');
 g.reset('gabi','normal',5);
 assert.equal(g.recordTarget,5);
 assert.equal(g.newBest,false);
 assert.equal(g.newBestFlash,0);
 for(let i=0;i<6;i++)g.spawn();
 assert.deepEqual(g.pipes.filter(p=>p.landmark).map(p=>p.number),[5]);
});

test('no flag for zero best, and bird never receives rooftop building markers',()=>{
 const gabi=new ArcadeEngine({mode:'gabi',recordTarget:0});gabi.spawn();
 assert.equal(gabi.pipes[0].landmark,false);
 const bird=new ArcadeEngine({mode:'bird',recordTarget:3});
 for(let i=0;i<3;i++)bird.spawn();
 assert.ok(bird.pipes.every(p=>!p.landmark));
});

test('spawn spacing stays based on distance as world speed increases',()=>{
 const g=new ArcadeEngine({mode:'gabi',random:stable});g.start();g.y=170;g.velocity=0;g.holding=false;
 const first=g.spawnClock;
 g.step(1/120);
 assert.ok(g.spawnClock<first && g.spawnClock>0);
 assert.ok(g.distance>0);
 assert.ok(Math.abs(g.spawnClock-(first-g.distance))<1e-6);
});
