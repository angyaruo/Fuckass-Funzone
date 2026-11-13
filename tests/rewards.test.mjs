import test from 'node:test';
import assert from 'node:assert/strict';
import { milestonePayout, creditTickets, MAX_TICKETS } from '../src/rewards.js';

test('every game has safe, nonrepeatable score milestones',()=>{
 const expectations=[['bird',5],['gabi',5],['snake',2],['2048',64],['match3',400],['simon',2],['duck',3]];
 for(const [id,step] of expectations){
  assert.equal(milestonePayout(id,0,step-1),0,id);
  assert.equal(milestonePayout(id,0,step),1,id);
  assert.equal(milestonePayout(id,step,step),0,id+' replay');
  assert.equal(milestonePayout(id,step+2,step),0,id+' rollback');
  assert.equal(milestonePayout(id,0,step*3),3,id+' tier growth');
 }
 assert.equal(milestonePayout('2048',0,6400),99,'one scoring frame cannot mint an unbounded amount');
 assert.equal(milestonePayout('slots',0,40),0,'slots only rewards settled reel payouts');
});
test('credits cap safely and reject invalid payout amounts',()=>{
 assert.equal(creditTickets(0,1),1,'Jetpack coin can credit immediately');
 assert.equal(creditTickets(1,-100),1);
 assert.equal(creditTickets(MAX_TICKETS-1,90),MAX_TICKETS);
 assert.equal(creditTickets(15,NaN),15);
});
