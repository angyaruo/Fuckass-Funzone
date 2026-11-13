/** Variable-width 7-row Match-3 canvas. Clean trinkets stay legible at every width.
 * SVG hint sparkles and paired highlights are visual cues only; the engine supplies legal moves.
 */
import {MATCH_SIZE,MATCH_ROWS,cellAt} from './match3.js';
const W=360,H=452;
export function matchLayout(cols=MATCH_SIZE){
 const step=Math.min(44,Math.floor(312/cols)),cell=step-4,span=cols*step-4;
 return {x:Math.round((W-span)/2),y:77+Math.round((304-(MATCH_ROWS*step-4))/2),step,cell,cols,rows:MATCH_ROWS};
}
const COLORS=Object.freeze({
  backgroundTop:'#1e222b', backgroundBottom:'#171b24',
  board:'#303540', well:'#20242d', cellA:'#2b303a',cellB:'#292e37',
  type:{cat:'#30434d',heart:'#f36e9f',star:'#f1cb65',fish:'#54d6da',cookie:'#d9b28e',gem:'#aa85ed'},
  select:'#8df0ec',rocket:'#6bd7e7',bomb:'#ff95ca',ink:'#fbf3ef',muted:'#bbc4d0'
});
const rounded=(ctx,x,y,w,h,r,fill)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
const drawTxt=(ctx,t,x,y,size,color=COLORS.ink,align='left')=>{ctx.font=`800 ${size}px ui-sans-serif,system-ui,sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(t,x,y);ctx.textAlign='left';};
const drawSprite=(ctx,img,x,y,w,h)=>{if(!img?.complete||!img.naturalWidth)return false;ctx.drawImage(img,x,y,w,h);return true;};
function drawTrinket(ctx,images,name,x,y,size){
  return drawSprite(ctx,images[`match_vec_${name}`],x,y,size,size)||drawSprite(ctx,images[`match_${name}`],x,y,size,size);
}
function drawCornerFocus(ctx,x,y,CELL){
  // Four small L-shaped focus brackets, readable without obscuring the piece.
  const c=COLORS.select;
  rounded(ctx,x+1,y+1,10,3,1.5,c);rounded(ctx,x+1,y+1,3,10,1.5,c);
  rounded(ctx,x+CELL-11,y+1,10,3,1.5,c);rounded(ctx,x+CELL-4,y+1,3,10,1.5,c);
  rounded(ctx,x+1,y+CELL-4,10,3,1.5,c);rounded(ctx,x+1,y+CELL-11,3,10,1.5,c);
  rounded(ctx,x+CELL-11,y+CELL-4,10,3,1.5,c);rounded(ctx,x+CELL-4,y+CELL-11,3,10,1.5,c);
}
export const matchCellAt=(x,y,cols=MATCH_SIZE)=>cellAt(x,y,matchLayout(cols));
function drawHint(ctx,images,game,hint,geometry,reduceMotion){
 if(!Array.isArray(hint)||hint.length!==2)return;
 const {x:X,y:Y,step:STEP,cell:CELL,cols}=geometry;
 const glow=reduceMotion?.85:.60+.25*Math.sin(game.idleTime*5);
 ctx.save();ctx.globalAlpha=glow;
 for(const ix of hint){
  if(ix<0||ix>=game.board.length)continue;
  const x=X+(ix%cols)*STEP,y=Y+Math.floor(ix/cols)*STEP;
  ctx.beginPath();ctx.roundRect(x-2,y-2,CELL+4,CELL+4,9);ctx.strokeStyle='#9aeee7';ctx.lineWidth=2.7;ctx.stroke();
  if(!drawSprite(ctx,images.match_vec_hint,x+CELL-12,y-5,17,17)){
   ctx.beginPath();ctx.moveTo(x+CELL-3,y-4);ctx.lineTo(x+CELL-3,y+8);ctx.moveTo(x+CELL-9,y+2);ctx.lineTo(x+CELL+3,y+2);ctx.strokeStyle='#e7fff8';ctx.lineWidth=1.7;ctx.stroke();
  }
 }
 ctx.restore();
}
export function drawMatch3(canvas,game,images,{best=0,selected=-1,reduceMotion=false,hint=null}={}){
 if(!canvas?.getContext)return;const ctx=canvas.getContext('2d');if(!ctx)return;
 const layout=matchLayout(game.width),{x:X,y:Y,step:STEP,cell:CELL,cols}=layout;
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
 const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,COLORS.backgroundTop);bg.addColorStop(1,COLORS.backgroundBottom);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 // Sparse, very faint scenery keeps the board the brightest object.
 for(let i=0;i<13;i++){ctx.fillStyle='#7e8e9c17';ctx.fillRect((i*73+11)%W,(i*113+17)%H,2,2);}
 drawTrinket(ctx,images,'cat',16,13,20);
 drawTxt(ctx,'TRINKET PANIC',42,31,12,'#ffe6ef');
 drawTxt(ctx,`SCORE ${game.score}`,160,31,11,'#fdfaf7');
 drawTxt(ctx,`BEST ${best}`,342,31,11,'#ead4c4','right');
 rounded(ctx,20,51,320,1,0,'#444953');
 rounded(ctx,16,67,328,326,14,COLORS.board);
 rounded(ctx,20,71,320,318,11,COLORS.well);
 for(let row=0;row<MATCH_ROWS;row++)for(let col=0;col<cols;col++){
  const ix=row*cols+col,x=X+col*STEP,y=Y+row*STEP,tile=game.board[ix];
  const active=ix===selected, power=tile?.power;
  if(active)rounded(ctx,x-2,y-2,CELL+4,CELL+4,10,COLORS.select);
  else if(power)rounded(ctx,x-1.5,y-1.5,CELL+3,CELL+3,10,power==='bomb'?COLORS.bomb:COLORS.rocket);
  rounded(ctx,x,y,CELL,CELL,8,active?'#32424b':power?'#303743':(row+col)%2?COLORS.cellB:COLORS.cellA);
  if(!tile){if(active)drawCornerFocus(ctx,x,y,CELL);continue;}
  if(!drawTrinket(ctx,images,tile.kind,x+3,y+3,CELL-6)){
   // Temporary decoding/fallback mode stays semantically color-distinct.
   rounded(ctx,x+8,y+8,CELL-16,CELL-16,7,COLORS.type[tile.kind]||'#ebd7e3');
  }
  if(power){
   const tint=power==='bomb'?COLORS.bomb:COLORS.rocket;
   const size=Math.min(17,Math.round(CELL*.42)),bx=x+CELL-size-1,by=y+CELL-size-1;
   rounded(ctx,bx-1,by-1,size+2,size+2,6,'#1b2531');
   rounded(ctx,bx,by,size,size,5,tint);
   drawTrinket(ctx,images,power==='bomb'?'bomb':'rocket',bx,by,size);
  }
  if(active)drawCornerFocus(ctx,x,y,CELL);
  if(game.flash>0&&game.lastClear.includes(ix)){
   ctx.globalAlpha=Math.min(reduceMotion?.12:.25,game.flash*.38);rounded(ctx,x,y,CELL,CELL,8,'#e8fffb');ctx.globalAlpha=1;
  }
 }
 if(game.status==='playing'&&selected<0&&hint)drawHint(ctx,images,game,hint,layout,reduceMotion);
 drawTxt(ctx,`MOVES ${String(game.moves).padStart(3,'0')}`,22,420,11,COLORS.muted);
 drawTxt(ctx,game.combo>1?`CASCADE ×${game.combo}`:`SPECIALS ${game.specialsUsed}`,338,420,11,game.combo>1?'#9ee9e4':COLORS.muted,'right');
 drawTxt(ctx,game.status==='dead'?'NO MOVES LEFT — NEW BOARD TO RETRY':hint&&selected<0?'GABU FOUND A LEGAL SWAP FOR YOU':`${cols} × ${MATCH_ROWS}  ·  TAP OR DRAG TO SWAP`,180,440,9,game.status==='dead'?'#ffb1c8':hint?'#8de9df':'#aeb9c4','center');
 if(game.status==='dead')overlay(ctx,'NO MOVES LEFT','Tap NEW BOARD to try again.');
 if(game.status==='paused')overlay(ctx,'PAUSED','Your trinkets are going nowhere.');
 if(game.status==='idle'){
  rounded(ctx,81,195,198,48,10,'#17212be9');
  rounded(ctx,83,197,194,44,8,'#2f414b');
  drawTxt(ctx,'SWAP TO MATCH 3',180,224,15,'#f1fbfc','center');
 }
}
function overlay(ctx,message,sub){
 ctx.fillStyle='#131820b8';ctx.fillRect(0,53,W,H-53);
 rounded(ctx,37,175,286,94,13,'#26313d');
 rounded(ctx,39,177,282,90,11,'#202733');
 drawTxt(ctx,message,180,216,22,'#fff0f5','center');drawTxt(ctx,sub,180,239,12,'#c7d5de','center');
}
