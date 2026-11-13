import test from 'node:test';
import assert from 'node:assert/strict';
import { SnakeGame, Merge2048, SNAKE_COLS, SNAKE_ROWS } from '../src/puzzles.js';

const rng=()=>0;
test('snake seeds a valid board, rejects reversal, collects food and snapshots safely after scoring',()=>{
 const events=[],s=new SnakeGame({random:rng,onEvent:(name)=>events.push(name)});
 assert.equal(s.body.length,3);assert.equal(s.status,'idle');
 assert.equal(s.setDirection('left'),false);assert.equal(s.setDirection('right'),true);
 s.food={x:7,y:7};s.step();assert.equal(s.score,1);assert.equal(s.body.length,4);
 assert.ok(s.food&&!s.body.some(p=>p.x===s.food.x&&p.y===s.food.y));
 const restored=new SnakeGame({random:rng,saved:s.snapshot()});assert.equal(restored.score,1);assert.deepEqual(restored.body,s.body);
 assert.ok(events.includes('score'));
});
test('snake accelerates, collisions end play, invalid restore never mutates state',()=>{
 const s=new SnakeGame({random:rng});const prior=s.snapshot();
 assert.equal(s.restore({body:[{x:999,y:2}],direction:'right'}),false);
 assert.deepEqual(s.snapshot(),prior);
 assert.ok(s.speed()<14);s.score=900;assert.equal(s.speed(),14);
 s.reset();s.body=[{x:SNAKE_COLS-1,y:4},{x:SNAKE_COLS-2,y:4}];s.start();s.direction='right';s.nextDirection='right';s.step();assert.equal(s.status,'dead');
});
test('snake crash resilience and interrupted ticks',()=>{
 const s=new SnakeGame({random:rng});s.start();s.update(NaN);s.update(-1);assert.equal(s.body[0].x,6);
 s.update(99999);assert.ok(s.body[0].x<10,'frame time is bounded to prevent path desync');
 s.pause();const loc=s.body[0].x;s.update(5);assert.equal(s.body[0].x,loc);
});
test('2048 starts with two tiles, merges 2+2 once and spawns an extra tile',()=>{
 const events=[],g=new Merge2048({random:rng,onEvent:(e)=>events.push(e)});
 assert.equal(g.board.filter(Boolean).length,2);
 g.board=[2,2,0,0,...Array(12).fill(0)];g.status='idle';
 assert.equal(g.move('left'),true);assert.equal(g.board[0],4);
 assert.equal(g.score,4);assert.equal(g.moves,1);
 assert.ok(g.board.filter(Boolean).length>=2);assert.ok(events.includes('score'));
 assert.equal(g.undo(),true);assert.deepEqual(g.board.slice(0,4),[2,2,0,0]);
});
test('2048 no-op does not spawn or consume undo, and valid restore resumes paused',()=>{
 const g=new Merge2048({random:rng});g.board=[2,4,8,16,...Array(12).fill(0)];g.start();
 assert.equal(g.move('left'),false);assert.deepEqual(g.board.slice(0,4),[2,4,8,16]);
 const copy=new Merge2048({random:rng,saved:g.snapshot()});assert.equal(copy.status,'paused');assert.deepEqual(copy.board,g.board);
 assert.equal(copy.restore({board:[9,...Array(15).fill(0)]}),false);
});
test('2048 full immovable board dies, 2048 achievement triggers on merge',()=>{
 const g=new Merge2048({random:rng});g.board=Array.from({length:16},(_,i)=>Math.pow(2,(i%2)+(Math.floor(i/4)%2)+1));
 assert.equal(g.canMove(),false);
 g.board=[1024,1024,...Array(14).fill(0)];g.start();g.move('left');assert.ok(g.won);assert.equal(g.board[0],2048);
});
