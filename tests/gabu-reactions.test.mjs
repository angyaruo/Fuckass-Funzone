import test from 'node:test';import assert from 'node:assert/strict';
import {ReactionDirector} from '../src/reactions.js';
test('Gabu is event-driven, prioritizes real milestones, and expires without a timer leak',()=>{
 const g=new ReactionDirector();assert.equal(g.emit('match3','start'),null);
 const roast=g.emit('match3','invalid_swap');assert.ok(roast?.line);assert.equal(roast.mood,'annoyed');
 const special=g.emit('match3','special_created',{level:'rocket'});assert.equal(special.mood,'hype');
 assert.equal(g.emit('match3','invalid_swap'),null,'low-priority roast cannot interrupt power-up celebration');
 assert.equal(g.emit('match3','cascade',{chain:3})?.mood,'hype');
 assert.ok(g.current);g.update(5);assert.equal(g.current,null);assert.equal(g.remaining,0);
});
test('Gabu covers all existing games and avoids spamming on ordinary score events',()=>{
 const g=new ReactionDirector();
 assert.equal(g.emit('bird','score'),null);
 assert.equal(g.emit('bird','death')?.mood,'panic');g.clear();
 assert.equal(g.emit('gabi','hit')?.mood,'annoyed');g.clear();
 assert.equal(g.emit('snake','score'),null);assert.equal(g.emit('snake','death')?.mood,'panic');g.clear();
 assert.equal(g.emit('2048','score',{earned:4}),null);
 assert.equal(g.emit('2048','win',{value:2048})?.mood,'hype');g.clear();
 assert.equal(g.emit('match3','reshuffle')?.mood,'dizzy');
});
test('monocle Gabu is genuinely event driven for Plinko, not random timed dialogue',()=>{
 const d=new ReactionDirector();
 assert.equal(d.emit('plinko','drop',{stake:5}),null);
 assert.equal(d.emit('plinko','land',{multiplier:2,payout:10})?.art,'gabu_magnate');
 assert.equal(d.emit('plinko','jackpot',{multiplier:8,payout:80})?.art,'gabu_magnate');
 assert.equal(d.current?.priority,5);
});
test('Gabu rotates through large pool of sayings without getting stuck on index 0',()=>{
 const g=new ReactionDirector();
 const lines=new Set();
 for(let i=0;i<10;i++){
  g.clear();
  const res=g.emit('match3','invalid_swap');
  if(res)lines.add(res.line);
  g.emit('match3','invalid_swap');
  g.emit('match3','invalid_swap');
 }
 assert.ok(lines.size >= 5, 'should cycle through multiple distinct lines');
});
