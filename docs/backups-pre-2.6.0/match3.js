/** Fuckass Funzone Match-3 — deterministic, DOM-free, saveable puzzle engine. */
export const MATCH_SIZE=7; // Legacy default; existing 7x7 saves remain valid.
export const MATCH_ROWS=7;
export const MATCH_WIDTHS=Object.freeze([6,7,8]);
export const MATCH_HINT_DELAY=12;
const widthOf=w=>MATCH_WIDTHS.includes(w)?w:MATCH_SIZE;
const cellCount=w=>w*MATCH_ROWS;
export const MATCH_KINDS=Object.freeze(['cat','heart','star','fish','cookie','gem']);
export const MATCH_POWERS=Object.freeze(['row','column','bomb']);

const rand=(fn,max)=>Math.min(max-1,Math.max(0,Math.floor((Number(fn())||0)*max)));
const copyTile=(tile)=>tile?{kind:tile.kind,power:tile.power||null}:null;
const validTile=(tile)=>!!tile&&MATCH_KINDS.includes(tile.kind)&&(tile.power==null||MATCH_POWERS.includes(tile.power));
export const neighbors=(a,b,width=MATCH_SIZE)=>Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&a<cellCount(width)&&b>=0&&b<cellCount(width)&&Math.abs(a%width-b%width)+Math.abs(Math.floor(a/width)-Math.floor(b/width))===1;

/** Return all horizontal and vertical runs of >=3, with orientation for specials. */
export function findMatchRuns(board,width=MATCH_SIZE){
 const result=[];
 for(let y=0;y<MATCH_ROWS;y++)for(let x=0;x<width;){
  const at=y*width+x,kind=board[at]?.kind;let next=x+1;
  while(kind&&next<width&&board[y*width+next]?.kind===kind)next++;
  if(kind&&next-x>=3)result.push({kind,axis:'row',cells:Array.from({length:next-x},(_,j)=>y*width+x+j)});
  x=next;
 }
 for(let x=0;x<width;x++)for(let y=0;y<MATCH_ROWS;){
  const at=y*width+x,kind=board[at]?.kind;let next=y+1;
  while(kind&&next<MATCH_ROWS&&board[next*width+x]?.kind===kind)next++;
  if(kind&&next-y>=3)result.push({kind,axis:'column',cells:Array.from({length:next-y},(_,j)=>(y+j)*width+x)});
  y=next;
 }
 return result;
}
/** An actual legal adjacent move, including moving a powered tile. Never mutates the supplied board. */
export function findMatchMove(board,width=MATCH_SIZE){
 if(!MATCH_WIDTHS.includes(width)||!Array.isArray(board)||board.length!==cellCount(width)||findMatchRuns(board,width).length)return null;
 const copy=board.map(copyTile);
 for(let at=0;at<copy.length;at++){
  for(const dest of [at+1,at+width]){
   if(!neighbors(at,dest,width))continue;
   if(copy[at]?.power||copy[dest]?.power)return [at,dest];
   if(copy[at]?.kind===copy[dest]?.kind)continue;
   [copy[at],copy[dest]]=[copy[dest],copy[at]];
   const yes=findMatchRuns(copy,width).length>0;
   [copy[at],copy[dest]]=[copy[dest],copy[at]];
   if(yes)return [at,dest];
  }
 }
 return null;
}
export function hasMatchMove(board,width=MATCH_SIZE){return findMatchMove(board,width)!==null;}
export function cellAt(canvasX,canvasY,{x=28,y=77,step=44,cell=40,cols=MATCH_SIZE,rows=MATCH_ROWS}={}){
 const col=Math.floor((canvasX-x)/step),row=Math.floor((canvasY-y)/step);
 if(col<0||col>=cols||row<0||row>=rows)return -1;
 if(canvasX<x+col*step||canvasX>=x+col*step+cell||canvasY<y+row*step||canvasY>=y+row*step+cell)return -1;
 return row*cols+col;
}
export class Match3Game {
 constructor({random=Math.random,onEvent=()=>{},saved,width=MATCH_SIZE}={}){
  this.random=random;this.onEvent=onEvent;this.width=widthOf(width);this.reset();if(saved)this.restore(saved);
 }
 randomTile(){const n=(rand(this.random,MATCH_KINDS.length)+this.spawnSerial++)%MATCH_KINDS.length;return {kind:MATCH_KINDS[n],power:null};}
 buildBoard(){
  // Generate without accidental starting matches; playability is checked before accepting.
  const width=this.width,total=cellCount(width);
  for(let attempt=0;attempt<48;attempt++){
   const board=Array(total).fill(null);
   for(let i=0;i<total;i++){
    let choices=MATCH_KINDS.filter(k=>!(i%width>=2&&board[i-1]?.kind===k&&board[i-2]?.kind===k) && !(i>=width*2&&board[i-width]?.kind===k&&board[i-width*2]?.kind===k));
    if(!choices.length)choices=MATCH_KINDS;
    board[i]={kind:choices[rand(this.random,choices.length)],power:null};
   }
   if(hasMatchMove(board,width))return board;
  }
  // Finite, deterministic fallback even with a broken/constant PRNG.
  const board=Array.from({length:total},(_,i)=>({kind:MATCH_KINDS[(i%width+2*Math.floor(i/width)+Math.floor((i%width)/2))%MATCH_KINDS.length],power:null}));
  board[0]={kind:'cat',power:null};board[1]={kind:'heart',power:null};board[2]={kind:'cat',power:null};board[width+1]={kind:'cat',power:null};
  // Remove any incidental pre-matches outside the guaranteed first-row swap lane.
  for(let i=0;i<total;i++)if(i!==0&&i!==1&&i!==2&&i!==width+1){
   for(let k=0;k<MATCH_KINDS.length&&findMatchRuns(board,width).some(r=>r.cells.includes(i));k++)board[i]={kind:MATCH_KINDS[(MATCH_KINDS.indexOf(board[i].kind)+1)%MATCH_KINDS.length],power:null};
  }
  if(hasMatchMove(board,width)&&!findMatchRuns(board,width).length)return board;
  // Final deterministic search that never loops indefinitely under broken RNGs.
  for(let salt=1;salt<64;salt++){
   const out=Array.from({length:total},(_,i)=>({kind:MATCH_KINDS[(i%width+salt*Math.floor(i/width))%MATCH_KINDS.length],power:null}));
   out[0]={kind:'cat',power:null};out[1]={kind:'heart',power:null};out[2]={kind:'cat',power:null};out[width+1]={kind:'cat',power:null};
   if(!findMatchRuns(out,width).length&&hasMatchMove(out,width))return out;
  }
  throw Error('Could not generate a legal Match-3 board');
 }
 reset(){this.spawnSerial=0;this.board=this.buildBoard();this.score=0;this.moves=0;this.status='idle';this.combo=0;this.cascades=0;this.lastClear=[];this.flash=0;this.badSwaps=0;this.specialsUsed=0;this.idleTime=0;this.hintPair=null;this.onEvent('reset');}
 start(){if(this.status==='dead')this.reset();if(this.status==='playing')return;this.status='playing';this.touch();this.onEvent('start');}
 pause(){if(this.status==='playing'){this.status='paused';this.onEvent('pause');}}
 togglePause(){if(this.status==='playing')this.pause();else if(this.status==='paused')this.start();}
 /** Any real input dismisses the hint until the player goes idle again. */
 touch(){this.idleTime=0;this.hintPair=null;}
 update(dt){if(!Number.isFinite(dt)||dt<=0)return;this.flash=Math.max(0,this.flash-dt);if(this.status==='playing')this.idleTime=Math.min(120,this.idleTime+dt);}
 getHint(delay=MATCH_HINT_DELAY){const wait=Number.isFinite(delay)&&delay>=0?delay:MATCH_HINT_DELAY;if(wait===0||this.status!=='playing'||this.idleTime<wait)return null;return this.hintPair||(this.hintPair=findMatchMove(this.board,this.width));}
 checkMoves(){if(hasMatchMove(this.board,this.width))return true;this.status='dead';this.touch();this.onEvent('no_moves',{score:this.score,moves:this.moves,width:this.width});return false;}
 expandPower(board,indices,swappedWith=null){
  const queue=[...indices],visited=new Set();
  while(queue.length){
   const ix=queue.shift();if(visited.has(ix)||ix<0||ix>=cellCount(this.width))continue;
   visited.add(ix);const tile=board[ix];if(!tile?.power)continue;
   if(tile.power==='row')for(let x=0;x<this.width;x++)queue.push(Math.floor(ix/this.width)*this.width+x);
   else if(tile.power==='column')for(let y=0;y<MATCH_ROWS;y++)queue.push(y*this.width+ix%this.width);
   else if(tile.power==='bomb'){
    const kind=swappedWith?.kind||tile.kind;
    for(let i=0;i<cellCount(this.width);i++)if(board[i]?.kind===kind)queue.push(i);
   }
  }
  return visited;
 }
 refill(board,cleared){
  // Apply gravity *per column*. New tiles come from the top.
  for(let x=0;x<this.width;x++){
   const keep=[];for(let y=MATCH_ROWS-1;y>=0;y--){const at=y*this.width+x;if(!cleared.has(at)&&board[at])keep.push(copyTile(board[at]));}
   for(let y=MATCH_ROWS-1;y>=0;y--)board[y*this.width+x]=keep[MATCH_ROWS-1-y]||this.randomTile();
  }
 }
 resolve(initial,origin=null,swappedWith=null){
  const board=this.board;let pending=initial,depth=0,total=0,created=0,triggered=0;
  while(depth<14){
   const runs=depth===0?pending:findMatchRuns(board,this.width);
   if(!runs.length)break;
   const removed=new Set(runs.flatMap(r=>r.cells));
   const reserved=new Map();
   for(const run of runs){
    const largest=run.cells.length;
    const cross=run.cells.some(cell=>runs.some(other=>other!==run&&other.cells.includes(cell)));
    const power=(largest>=5||cross)?'bomb':largest>=4?(run.axis==='row'?'row':'column'):null;
    if(!power)continue;
    const keep=(origin!==null&&run.cells.includes(origin))?origin:run.cells[Math.floor((run.cells.length-1)/2)];
    const existing=reserved.get(keep);
    if(!existing||power==='bomb')reserved.set(keep,{kind:board[keep].kind,power});
   }
   // Existing powers fire when cleared; freshly-created powers are protected.
   for(const [ix] of reserved)removed.delete(ix);
   const powered=this.expandPower(board,removed,swappedWith);
   for(const ix of powered)removed.add(ix);
   for(const [ix] of reserved)removed.delete(ix);
   for(const ix of removed)if(board[ix]?.power)triggered++;
   for(const [ix,tile] of reserved){board[ix]=tile;created++;}
   const amount=removed.size;
   if(!amount)break;
   total+=amount;
   this.score+=amount*40*(depth+1)+(reserved.size*60);
   this.lastClear=[...removed];this.flash=.55;
   for(const ix of removed)board[ix]=null;
   this.refill(board,removed);
   this.onEvent('match',{count:amount,chain:depth+1,score:this.score});
   if(reserved.size)this.onEvent('special_created',{count:reserved.size,level:[...reserved.values()].some(v=>v.power==='bomb')?'bomb':'rocket'});
   if(depth>0)this.onEvent('cascade',{chain:depth+1,score:this.score});
   depth++;
  }
  if(depth===14&&findMatchRuns(board,this.width).length){this.board=this.buildBoard();this.onEvent('reshuffle',{reason:'cascade_cap'});}
  this.combo=depth;this.cascades+=Math.max(0,depth-1);this.specialsUsed+=triggered;
  if(triggered)this.onEvent('special_triggered',{count:triggered,cascade:true});
  this.onEvent('score',{score:this.score,gained:total,chain:depth});
  this.checkMoves();
  return {cleared:total,chain:depth,created,triggered};
 }
 swap(a,b){
  if(!neighbors(a,b,this.width)||this.status==='dead'||this.status==='paused')return false;
  if(this.status==='idle')this.start();this.touch();
  const first=this.board[a],second=this.board[b];if(!first||!second)return false;
  // Bombs and rockets activate on any adjacent swap; no ordinary run required.
  const activating=!!(first.power||second.power);
  [this.board[a],this.board[b]]=[second,first];
  const runs=findMatchRuns(this.board,this.width);
  if(!runs.length&&!activating){
   [this.board[a],this.board[b]]=[first,second];this.badSwaps++;
   this.onEvent('invalid_swap',{badSwaps:this.badSwaps});return false;
  }
  this.moves++;
  let report;
  if(activating){
   const targets=new Set([a,b]);
   // After swap, the power now sits opposite its original cell.
   const expanded=this.expandPower(this.board,targets,first.power?second:first);
   for(const ix of expanded)targets.add(ix);
   const amount=targets.size;this.lastClear=[...targets];this.flash=.55;
   for(const ix of targets)this.board[ix]=null;
   this.score+=amount*65;this.specialsUsed++;
   this.refill(this.board,targets);
   this.onEvent('special_triggered',{count:amount,bomb:first.power==='bomb'||second.power==='bomb'});
   const follow=findMatchRuns(this.board,this.width);
   report=follow.length?this.resolve(follow,b):{cleared:0,chain:0,created:0,triggered:1};
   if(!follow.length){this.combo=1;this.onEvent('score',{score:this.score,gained:amount,chain:1});this.checkMoves();}
  }else report=this.resolve(runs,b);
  this.onEvent('move',{moves:this.moves,score:this.score,chain:report.chain});
  return true;
 }
 snapshot(){return {width:this.width,board:this.board.map(copyTile),score:this.score,moves:this.moves,status:this.status==='dead'?'dead':'paused',combo:this.combo,cascades:this.cascades,badSwaps:this.badSwaps,specialsUsed:this.specialsUsed,spawnSerial:this.spawnSerial};}
 restore(data){
  if(!data||(data.width===undefined?MATCH_SIZE:data.width)!==this.width||!Array.isArray(data.board)||data.board.length!==cellCount(this.width)||data.board.some(tile=>!validTile(tile)))return false;
  if(findMatchRuns(data.board,this.width).length)return false;
  if(!Number.isSafeInteger(data.score)||data.score<0||data.score>1e10||!Number.isSafeInteger(data.moves)||data.moves<0||data.moves>1e7)return false;
  this.board=data.board.map(copyTile);this.score=data.score;this.moves=data.moves;this.status=data.status==='dead'?'dead':'paused';this.combo=Number.isInteger(data.combo)?Math.max(0,Math.min(20,data.combo)):0;
  this.cascades=Number.isInteger(data.cascades)?Math.max(0,Math.min(1e7,data.cascades)):0;
  this.badSwaps=Number.isInteger(data.badSwaps)?Math.max(0,Math.min(1e7,data.badSwaps)):0;
  this.specialsUsed=Number.isInteger(data.specialsUsed)?Math.max(0,Math.min(1e7,data.specialsUsed)):0;
  this.spawnSerial=Number.isSafeInteger(data.spawnSerial)&&data.spawnSerial>=0?Math.min(1e9,data.spawnSerial):0;this.flash=0;this.lastClear=[];this.touch();if(!hasMatchMove(this.board,this.width))this.status='dead';return true;
 }
}
