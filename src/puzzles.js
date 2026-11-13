/** Fuckass Funzone puzzle cores — no DOM, canvas, network or timers. */
const clampInt=(v,min,max,fallback)=>Number.isInteger(v)&&v>=min&&v<=max?v:fallback;
const isPower2=(v)=>Number.isInteger(v)&&v>=2&&v<=131072&&(v&(v-1))===0;
export const SNAKE_COLS=14, SNAKE_ROWS=15;
export const SNAKE_FOOD_KINDS=Object.freeze(['apple','berry','star','fish','cookie','candy']);
export const DIRS=Object.freeze({up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}});
export class SnakeGame {
 constructor({random=Math.random,onEvent=()=>{},saved}={}) {
  this.random=random;this.onEvent=onEvent;this.reset();if(saved)this.restore(saved);
 }
 reset(){this.body=[{x:6,y:7},{x:5,y:7},{x:4,y:7}];this.direction='right';this.nextDirection='right';this.status='idle';this.score=0;this.age=0;this.accumulator=0;this.snackCount=0;this.food=this.placeFood();this.onEvent('reset');}
 placeFood(){const empty=[];for(let y=0;y<SNAKE_ROWS;y++)for(let x=0;x<SNAKE_COLS;x++)if(!this.body.some(p=>p.x===x&&p.y===y))empty.push({x,y});
  if(!empty.length)return null;
  // Add the spawn count to the RNG index: snacks vary even with a seeded RNG.
  const clampRandom=()=>Math.max(0,Math.min(.999999,Number(this.random())||0));
  const slot=empty[Math.floor(clampRandom()*empty.length)];
  const kind=SNAKE_FOOD_KINDS[(Math.floor(clampRandom()*SNAKE_FOOD_KINDS.length)+this.snackCount)%SNAKE_FOOD_KINDS.length];
  this.snackCount++;return {...slot,kind};}
 start(){if(this.status==='dead')this.reset();if(this.status==='playing')return;this.status='playing';this.onEvent('start');}
 pause(){if(this.status==='playing'){this.status='paused';this.onEvent('pause');}}
 togglePause(){if(this.status==='playing')this.pause();else if(this.status==='paused')this.start();}
 setDirection(name){if(!DIRS[name])return false;const current=DIRS[this.direction],next=DIRS[name];if(current.x+next.x===0&&current.y+next.y===0)return false;this.nextDirection=name;if(this.status==='idle')this.start();return true;}
 speed(){return Math.min(14,5.5+this.score*.22);}
 update(delta){if(this.status!=='playing'||!Number.isFinite(delta)||delta<=0)return;this.age+=Math.min(delta,.12);this.accumulator+=Math.min(delta,.12);const interval=1/this.speed();let steps=0;while(this.accumulator>=interval&&this.status==='playing'&&steps++<3){this.accumulator-=interval;this.step();}}
 step(){this.direction=this.nextDirection;const move=DIRS[this.direction],h=this.body[0],head={x:h.x+move.x,y:h.y+move.y};const eating=!!this.food&&head.x===this.food.x&&head.y===this.food.y;const collisionLength=eating?this.body.length:this.body.length-1;
  if(head.x<0||head.x>=SNAKE_COLS||head.y<0||head.y>=SNAKE_ROWS||this.body.slice(0,collisionLength).some(p=>p.x===head.x&&p.y===head.y)){this.status='dead';this.onEvent('death',{score:this.score});return;}
  this.body.unshift(head);if(eating){this.score++;this.food=this.placeFood();this.onEvent('score',{score:this.score});if(!this.food){this.status='dead';this.onEvent('win',{score:this.score});}}
  else this.body.pop();
 }
 snapshot(){return {body:this.body.map(p=>({...p})),direction:this.direction,nextDirection:this.nextDirection,food:this.food?{...this.food}:null,snackCount:this.snackCount,score:this.score,status:this.status==='dead'?'dead':'paused'};}
 restore(data){if(!data||!Array.isArray(data.body)||data.body.length<2||data.body.length>SNAKE_COLS*SNAKE_ROWS)return false;const body=data.body.map(p=>({x:p?.x,y:p?.y}));if(body.some(p=>!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.x>=SNAKE_COLS||p.y<0||p.y>=SNAKE_ROWS))return false;
  const unique=new Set(body.map(p=>`${p.x},${p.y}`));if(unique.size!==body.length||!DIRS[data.direction])return false;
  const food=data.food;if(food!==null&&(!food||!Number.isInteger(food.x)||!Number.isInteger(food.y)||food.x<0||food.x>=SNAKE_COLS||food.y<0||food.y>=SNAKE_ROWS||unique.has(`${food.x},${food.y}`)||('kind' in food&&!SNAKE_FOOD_KINDS.includes(food.kind))))return false;
  if(data.snackCount!==undefined&&(!Number.isInteger(data.snackCount)||data.snackCount<0||data.snackCount>1000000))return false;
  this.body=body;this.food=food?{...food,kind:food.kind||'apple'}:null;this.score=clampInt(data.score,0,210,0);this.snackCount=data.snackCount??(this.score+1);this.direction=data.direction;this.nextDirection=DIRS[data.nextDirection]?data.nextDirection:data.direction;this.status=data.status==='dead'?'dead':'paused';this.accumulator=0;return true;
 }
}
export class Merge2048 {
 constructor({random=Math.random,onEvent=()=>{},saved}={}){this.random=random;this.onEvent=onEvent;this.reset();if(saved)this.restore(saved);}
 reset(){this.board=Array(16).fill(0);this.score=0;this.moves=0;this.status='idle';this.won=false;this.previous=null;this.spawn();this.spawn();this.onEvent('reset');}
 spawn(){const holes=[];for(let i=0;i<16;i++)if(!this.board[i])holes.push(i);if(!holes.length)return false;const r=Math.max(0,Math.min(.999999,Number(this.random())||0));const index=holes[Math.floor(r*holes.length)];this.board[index]=(Math.max(0,Math.min(.999999,Number(this.random())||0))<.9)?2:4;return true;}
 start(){if(this.status==='dead')this.reset();if(this.status==='playing')return;this.status='playing';this.onEvent('start');}
 pause(){if(this.status==='playing'){this.status='paused';this.onEvent('pause');}}
 togglePause(){if(this.status==='playing')this.pause();else if(this.status==='paused')this.start();}
 canMove(){if(this.board.some(x=>x===0))return true;for(let y=0;y<4;y++)for(let x=0;x<4;x++){const i=y*4+x;if(x<3&&this.board[i]===this.board[i+1])return true;if(y<3&&this.board[i]===this.board[i+4])return true;}return false;}
 move(direction){if(!DIRS[direction]||this.status==='dead')return false;if(this.status==='paused')this.start();if(this.status==='idle')this.start();const next=this.board.slice(),old=this.board.slice(),wasWon=this.won;let earned=0;let changed=false;
  for(let line=0;line<4;line++){
   const indices=[];for(let i=0;i<4;i++){let x,y;if(direction==='left'){x=i;y=line;}else if(direction==='right'){x=3-i;y=line;}else if(direction==='up'){x=line;y=i;}else{x=line;y=3-i;}indices.push(y*4+x);}
   const vals=indices.map(i=>old[i]).filter(Boolean),out=[];
   for(let i=0;i<vals.length;i++){if(vals[i]===vals[i+1]){const v=vals[i]*2;out.push(v);earned+=v;i++;if(v>=2048&&!this.won){this.won=true;this.onEvent('win',{value:v});}}else out.push(vals[i]);}
   while(out.length<4)out.push(0);indices.forEach((ix,i)=>{next[ix]=out[i];if(next[ix]!==old[ix])changed=true;});
  }
  if(!changed)return false;
  this.previous={board:old,score:this.score,moves:this.moves,won:wasWon};this.board=next;this.score+=earned;this.moves++;this.spawn();this.onEvent('move',{score:this.score,moves:this.moves,earned});
  if(earned)this.onEvent('score',{score:this.score,earned});
  if(!this.canMove()){this.status='dead';this.onEvent('death',{score:this.score});}
  return true;
 }
 undo(){if(!this.previous)return false;this.board=this.previous.board.slice();this.score=this.previous.score;this.moves=this.previous.moves;this.won=this.previous.won;this.status='playing';this.previous=null;this.onEvent('undo',{score:this.score});return true;}
 snapshot(){return {board:this.board.slice(),score:this.score,moves:this.moves,status:this.status==='dead'?'dead':'paused',won:this.won,previous:this.previous};}
 restore(data){if(!data||!Array.isArray(data.board)||data.board.length!==16||data.board.some(v=>v!==0&&!isPower2(v)))return false;
  this.board=data.board.slice();this.score=clampInt(data.score,0,999999999,0);this.moves=clampInt(data.moves,0,9999999,0);this.won=!!data.won;this.status=data.status==='dead'?'dead':'paused';this.previous=null;return true;}
}
