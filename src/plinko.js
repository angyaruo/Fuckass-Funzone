/** Funzone Plinko: local-only, fictional-ticket game with deterministic stepping.
 * Pure engine, no DOM, time source, network, or access to model prompts.
 */
export const PLINKO_W = 360;
export const PLINKO_H = 452;
export const PLINKO_SLOTS = Object.freeze([8,2,1,1,0,1,1,2,8]);
export const PLINKO_BIN_LEFT = 18;
export const PLINKO_BIN_RIGHT = 342;
export const PLINKO_BIN_Y = 396;
export const PLINKO_PEGS = Object.freeze(Array.from({length:8},(_,row)=>
  Array.from({length:row%2?7:8},(_,column)=>({x:33+column*42+(row%2?21:0),y:143+row*28}))).flat());
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function validInt(n,max=100000000){return Number.isSafeInteger(n)?clamp(n,0,max):0;}
function validBall(raw){
 if(!raw||typeof raw!=='object')return null;
 const b={x:Number(raw.x),y:Number(raw.y),vx:Number(raw.vx),vy:Number(raw.vy),age:Number(raw.age),stake:Number(raw.stake)};
 if(!Object.values(b).every(Number.isFinite)||b.x<0||b.x>360||b.y<0||b.y>450||b.age<0||b.age>30||!Number.isSafeInteger(b.stake)||b.stake<0||b.stake>100000000)return null;
 return b;
}
export class PlinkoGame {
 constructor({saved,onEvent=()=>{},rng=Math.random}={}){
  this.onEvent=onEvent;this.rng=typeof rng==='function'?rng:Math.random;
  this.drops=validInt(saved?.drops);this.spent=validInt(saved?.spent);
  this.won=validInt(saved?.won);this.best=validInt(saved?.best);
  this.last=Array.isArray(saved?.last)?saved.last.filter(x=>Number.isSafeInteger(x?.payout)&&x.payout>=0&&x.payout<=100000000&&PLINKO_SLOTS.includes(x.multiplier)).slice(0,5):[];
  this.ball=validBall(saved?.ball);
  this.status=this.ball?'paused':'idle';this.trail=[];this.flash=0;this.lastResult=null;
 }
 snapshot(){return {drops:this.drops,spent:this.spent,won:this.won,best:this.best,last:this.last.map(x=>({...x})),ball:this.ball?{...this.ball}:null};}
 start(){if(this.ball&&this.status==='paused')this.status='playing';}
 pause(){if(this.status==='playing')this.status='paused';}
 togglePause(){if(this.ball){this.status=this.status==='playing'?'paused':'playing';return true;}return false;}
 /** Return stake for a cancelled in-flight ball. A completed ball is never refundable. */
 cancel(){const refund=this.ball?.stake||0;this.ball=null;this.trail=[];this.status='idle';this.flash=0;return refund;}
 reset(){return this.cancel();}
 launch(x,stake=0){
  if(this.ball)return false;
  if(!Number.isSafeInteger(stake)||stake<0||stake>100000000)return false;
  const start=clamp(Number.isFinite(x)?x:180,145,215);
  this.ball={x:start,y:98,vx:(this.rng()-.5)*125,vy:18,age:0,stake};
  this.trail=[];this.flash=0;this.status='playing';this.onEvent('drop',{stake});return true;
 }
 update(dt){
  if(!Number.isFinite(dt)||dt<=0)return;
  // Finish feedback must expire even after the ball has settled; otherwise
  // a payout banner can remain frozen on the canvas until the next drop.
  this.flash=Math.max(0,this.flash-dt);
  if(this.status!=='playing'||!this.ball)return;
  // Fixed, bounded micro-steps avoid tunnelling through pegs after tab pauses.
  let left=clamp(dt,0,.12);
  while(left>0&&this.ball){const step=Math.min(1/180,left);left-=step;this.step(step);}
 }
 step(dt){
  const ball=this.ball;if(!ball)return;
  ball.age+=dt;ball.vy=clamp(ball.vy+620*dt,-300,370);
  ball.vx+=(180-ball.x)*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
  if(ball.x<26){ball.x=26;ball.vx=Math.abs(ball.vx)*.76;}
  if(ball.x>334){ball.x=334;ball.vx=-Math.abs(ball.vx)*.76;}
  for(const peg of PLINKO_PEGS){
   const dx=ball.x-peg.x,dy=ball.y-peg.y,dist2=dx*dx+dy*dy,minDist=11;
   if(dist2>=minDist*minDist)continue;
   const dist=Math.sqrt(dist2)||.001;
   // Prefer a sideways release when the ball is perfectly centered over a peg.
   const side=dx===0?(this.rng()<.5?-1:1):Math.sign(dx);
   const nx=dist>.01?dx/dist:side,ny=dist>.01?dy/dist:-1;
   ball.x=clamp(peg.x+nx*minDist,26,334);ball.y=peg.y+ny*minDist;
   ball.vx=clamp(side*(35+Math.min(28,Math.abs(ball.vx)*.2)+this.rng()*65),-95,95);
   ball.vy=Math.max(125,Math.abs(ball.vy)*.75);
  }
  ball.vx*=Math.pow(.995,dt*60);
  if(this.trail.length===0||Math.abs(this.trail.at(-1).y-ball.y)>5){this.trail.push({x:ball.x,y:ball.y});if(this.trail.length>9)this.trail.shift();}
  if(ball.y>=PLINKO_BIN_Y||ball.age>=11)this.finish();
 }
 finish(){
  if(!this.ball)return;
  const stake=this.ball.stake;
  const slot=clamp(Math.floor((this.ball.x-PLINKO_BIN_LEFT)/((PLINKO_BIN_RIGHT-PLINKO_BIN_LEFT)/PLINKO_SLOTS.length)),0,PLINKO_SLOTS.length-1);
  const multiplier=PLINKO_SLOTS[slot];
  // Practice balls always pay zero, even on a 6x slot.
  const payout=stake?stake*multiplier:0;
  this.drops++;this.spent+=stake;this.won+=payout;this.best=Math.max(this.best,payout);
  const result={slot,multiplier,stake,payout,practice:stake===0};
  this.last.unshift({slot,multiplier,payout});this.last=this.last.slice(0,5);
  this.lastResult=result;this.flash=1.2;this.ball=null;this.trail=[];this.status='idle';
  this.onEvent('land',result);
  if(!stake)this.onEvent('practice',result);
  else if(multiplier>=6)this.onEvent('jackpot',result);
  else if(multiplier===0)this.onEvent('bust',result);
 }
}
