import test from 'node:test';
import assert from 'node:assert/strict';
import {ArcadeEngine,WORLD,DIFFICULTY,normalizeDifficulty,lifecycleTransition,sanitizeSettings,progressSpeed,gabiFlightFrame} from '../src/engine.js';

const stable=()=>.5;
test('settings sanitize corruption and preserve defaults',()=>{
 assert.deepEqual(sanitizeSettings(null),{autoOpen:true,mode:'gabi',difficulty:'normal',sound:false,reduceMotion:false,autoHideIdle:false,gabuReactions:true});
 assert.equal(sanitizeSettings({mode:'bird',difficulty:'chaos',sound:true}).difficulty,'medium','old Chaos preferences migrate without changing physics');
 assert.equal(sanitizeSettings({difficulty:'hard'}).difficulty,'hard');
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
test('Gabi calm animation loops only 0–2 while tapping shows 3–5 by held duration',()=>{
 const g=new ArcadeEngine({mode:'gabi',random:stable});
 for(const [age,expected] of [[0,0],[.12,1],[.24,2],[.35,0],[.46,1],[.58,2]]){
   g.age=age;
   assert.equal(gabiFlightFrame(g),expected,`idle ${age}s stays in the calm 0–2 loop`);
 }
 assert.equal(gabiFlightFrame(g,true),0,'reduced-motion mode keeps idle calm and still');
 g.start();g.press();
 assert.equal(gabiFlightFrame(g),3,'immediate tap starts with the first thrust expression');
 g.update(.12);g.update(.03);
 assert.equal(gabiFlightFrame(g),4,'holding past 120ms uses the middle expression');
 const priorHold=g.thrustHoldTime;g.press();
 assert.equal(g.thrustHoldTime,priorHold,'repeated keyboard-down events do not restart a hold');
 g.update(.12);g.update(.05);
 assert.equal(gabiFlightFrame(g),5,'sustained hold past 300ms uses the strongest expression');
 assert.equal(gabiFlightFrame(g,true),5,'reduced motion preserves the input reaction cue');
 g.release();assert.equal(gabiFlightFrame(g),5,'release holds the exact last expression briefly');
 g.update(.12);assert.equal(gabiFlightFrame(g),5,'long-hold reaction is still visible after release');
 g.update(.05);assert.ok(gabiFlightFrame(g)<=2,'Gabi returns to idle after the brief release window');
 g.press();assert.equal(gabiFlightFrame(g),3,'a new tap resets progression to first reaction');
 g.release();assert.equal(gabiFlightFrame(g),3);
 g.pause();assert.ok(gabiFlightFrame(g)<=2,'pause clears a pending reaction');
 g.reset();assert.equal(gabiFlightFrame(g),0,'new run starts with the calm face');
 assert.equal(g.thrustHoldTime,0);assert.equal(g.thrustReleaseTime,0);
});

test('Gabi short taps do not vanish between RAF frames; death clears reactions',()=>{
 const g=new ArcadeEngine({mode:'gabi',random:stable});g.start();
 g.press();g.release();
 assert.equal(gabiFlightFrame(g),3,'a sub-frame tap is visible even with no update between input events');
 g.update(.08);assert.equal(gabiFlightFrame(g),3);
 g.update(.09);assert.ok(gabiFlightFrame(g)<=2,'quick taps do not freeze his shocked expression');
 g.press();g.update(.12);g.update(.03);g.release();
 assert.equal(gabiFlightFrame(g),4,'medium tap holds middle expression briefly');
 g.hit('obstacle');g.invulnerable=0;g.hit('obstacle');g.invulnerable=0;g.hit('obstacle');
 assert.equal(g.status,'dead');assert.equal(g.thrustReleaseTime,0,'death clears the pending reaction');
 assert.ok(gabiFlightFrame(g)<=2,'dead game does not return a live thrust frame');
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
 assert.equal(progressSpeed('bird','chaos',10,500),progressSpeed('bird','medium',10,500),'old top-tier speed is byte-for-byte equivalent');
});

test('flight difficulty tiers preserve Medium, and Hard is deliberately brutal but navigable',()=>{
 assert.equal(DIFFICULTY.medium,1.28,'old maximum is now Medium');
 assert.equal(DIFFICULTY.hard,1.9);
 assert.equal(normalizeDifficulty('chaos'),'medium');
 const mediumBird=new ArcadeEngine({mode:'bird',difficulty:'chaos',random:()=>.5});
 const hardBird=new ArcadeEngine({mode:'bird',difficulty:'hard',random:()=>.5});
 const mediumGabi=new ArcadeEngine({mode:'gabi',difficulty:'medium',random:()=>.5});
 const hardGabi=new ArcadeEngine({mode:'gabi',difficulty:'hard',random:()=>.5});
 assert.equal(mediumBird.difficulty,'medium','engine also accepts legacy saves');
 assert.equal(mediumBird.health,1);
 assert.equal(mediumGabi.health,3);
 assert.equal(hardGabi.health,1,'Hard Jetpack is one-hit');
 assert.ok(progressSpeed('bird','hard',0,0)>progressSpeed('bird','medium',0,0)*1.45);
 for(const [medium,hard] of [[mediumBird,hardBird],[mediumGabi,hardGabi]]){
   medium.spawn();hard.spawn();
   assert.ok(hard.pipes[0].gap<medium.pipes[0].gap*.86,'Hard openings are substantially narrower');
   assert.ok(hard.pipes[0].gap>(hard.mode==='bird'?36:50),'Hard opening still clears a player');
   hard.spawnClock=0;hard.start();hard.step(1/120);
   const mediumInterval=(hard.mode==='bird'?270:291)/Math.sqrt(DIFFICULTY.medium);
   const hardInterval=(hard.mode==='bird'?270:291)/Math.sqrt(DIFFICULTY.hard);
   assert.ok(hardInterval<mediumInterval*.85,'Hard hazards have tighter spacing');
 }
 hardGabi.hit('obstacle');assert.equal(hardGabi.status,'dead');
 const alternating=[0,1,0,1,0,1];
 const fairHard=new ArcadeEngine({mode:'bird',difficulty:'hard',random:()=>alternating.shift()??.5});
 for(let i=0;i<6;i++)fairHard.spawn();
 for(let i=1;i<fairHard.pipes.length;i++)assert.ok(Math.abs(fairHard.pipes[i].center-fairHard.pipes[i-1].center)<=70,'Hard does not randomly spawn an impossible vertical jump');
 fairHard.reset('gabi','chaos');assert.equal(fairHard.difficulty,'medium');assert.equal(fairHard.health,3);
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
