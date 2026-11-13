/** Canvas renderers for the two additional Funzone games. Draws art and data, never font icons. */
import {SNAKE_COLS,SNAKE_ROWS,SNAKE_FOOD_KINDS} from './puzzles.js';
const W=360,H=452;
const round=(ctx,x,y,w,h,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
const gradient=(ctx,a,b)=>{const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,a);g.addColorStop(1,b);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);};
const text=(ctx,str,x,y,sz=16,color='#ffffff',align='left')=>{ctx.font=`800 ${sz}px ui-sans-serif,system-ui,sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(str,x,y);ctx.textAlign='left';};
const drawAsset=(ctx,img,x,y,w,h)=>{if(img?.complete&&img.naturalWidth){ctx.drawImage(img,x,y,w,h);return true;}return false;};
function banner(ctx,{name,score,best,ready}){
 round(ctx,11,10,338,42,12,'#201832d9');
 text(ctx,name,20,36,14,'#ffe1f6');
 text(ctx,`SCORE ${score}`,143,36,12,'#ffffff');
 text(ctx,`BEST ${best}`,345,36,12,'#ffd381','right');
 if(ready){round(ctx,88,421,186,23,11,'#442957');text(ctx,'RESPONSE READY',181,437,11,'#ffe7fd','center');}
}
function dim(ctx,message,sub){
 ctx.fillStyle='#120e27bc';ctx.fillRect(0,55,360,350);
 round(ctx,45,154,270,120,16,'#271a40');
 ctx.strokeStyle='#dc75b9';ctx.lineWidth=2;ctx.strokeRect(46,155,268,118);
 text(ctx,message,180,198,24,'#ffcfed','center');
 text(ctx,sub,180,229,12,'#eed9f4','center');
}
export function drawSnake(canvas,game,images,{ready=false,best=0}={}){
 if(!canvas?.getContext)return;const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
 gradient(ctx,'#0a3342','#191b39');
 for(let i=0;i<16;i++){ctx.fillStyle='#ffffff0b';ctx.fillRect((i*53+12)%360,(i*83+12)%400,2,2);}
 const size=22,x0=26,y0=65;
 round(ctx,17,55,326,350,17,'#082331');
 for(let y=0;y<SNAKE_ROWS;y++)for(let x=0;x<SNAKE_COLS;x++){
  round(ctx,x0+x*size,y0+y*size,size-2,size-2,3,(x+y)%2?'#124455':'#104052');
 }
 // One continuous outlined ribbon, NOT disconnected squares. Turns remain rounded.
 const centers=game.body.map(p=>({x:x0+p.x*size+size/2-1,y:y0+p.y*size+size/2-1}));
 if(centers.length>1){
  const trace=()=>{ctx.beginPath();const tail=centers[centers.length-1];ctx.moveTo(tail.x,tail.y);for(let i=centers.length-2;i>=0;i--)ctx.lineTo(centers[i].x,centers[i].y);};
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const [thickness,color] of [[20,'#28132f'],[15,'#b92f7b'],[10,'#f46ab1'],[4,'#ffc4e1']]){
   trace();ctx.lineWidth=thickness;ctx.strokeStyle=color;ctx.stroke();
  }
  // Taper the tail beyond its final joint so the creature has a real silhouette.
  const last=centers.at(-1),before=centers.at(-2);
  const vx=Math.sign(last.x-before.x),vy=Math.sign(last.y-before.y);
  ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(last.x+vx*9,last.y+vy*9);
  ctx.lineWidth=5;ctx.strokeStyle='#e75aa8';ctx.stroke();
  // Tiny scale glints are part of the body, not individual floating square tiles.
  for(let i=1;i<centers.length;i++){
   const c=centers[i];ctx.beginPath();ctx.arc(c.x-3,c.y-4,2.2,0,Math.PI*2);
   ctx.fillStyle='#ffd5e9';ctx.fill();
  }
 }
 if(centers.length){
  const head=centers[0],angle={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[game.direction]||0;
  ctx.save();ctx.translate(head.x,head.y);ctx.rotate(angle);
  if(!drawAsset(ctx,images.snake_head,-18,-18,36,36)){
   round(ctx,-14,-13,30,28,13,'#ed5ca2');round(ctx,4,-5,12,10,5,'#ffbddc');
  }
  ctx.restore();
 }
 if(game.food){
  const p=game.food,x=x0+p.x*size,y=y0+p.y*size;
  const kind=SNAKE_FOOD_KINDS.includes(p.kind)?p.kind:'apple';
  ctx.beginPath();ctx.arc(x+size/2,y+size/2,13,0,Math.PI*2);ctx.fillStyle='#f6c1f727';ctx.fill();
  if(!drawAsset(ctx,images[`snake_food_${kind}`]||images.snake_snack,x-3,y-4,size+7,size+7))round(ctx,x+3,y+3,size-6,size-6,8,'#ffb75a');
 }  banner(ctx,{name:'SNAKE',score:game.score,best,ready});
 if(game.status==='idle')dim(ctx,'SNAKE','Press Play, swipe or use arrow keys');
 else if(game.status==='paused')dim(ctx,'PAUSED','Resume whenever you like');
 else if(game.status==='dead')dim(ctx,'GAME OVER',`Snacks collected: ${game.score}`);
}
const TILE_COLORS={2:['#f6deef','#67416a'],4:['#f7cbdc','#623961'],8:['#ffb88c','#55305a'],16:['#ff9d9c','#542b52'],32:['#ff7ea6','#fff9fb'],64:['#f56197','#ffffff'],128:['#ec78db','#ffffff'],256:['#cd7be5','#ffffff'],512:['#ac7bdc','#ffffff'],1024:['#b1a1ff','#ffffff'],2048:['#ffe08e','#65304a']};
export function drawMerge(canvas,game,{ready=false,best=0}={}){
 if(!canvas?.getContext)return;const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
 gradient(ctx,'#38234d','#1b1738');
 for(let i=0;i<20;i++){ctx.fillStyle=i%4?'#f1b7ff11':'#fee3b81c';ctx.fillRect((i*91+11)%360,(i*89)%452,5,5);}
 const x0=29,y0=91,cell=68,gap=8;
 round(ctx,19,78,322,321,16,'#513759');
 for(let i=0;i<16;i++){
  const x=x0+(i%4)*(cell+gap),y=y0+Math.floor(i/4)*(cell+gap),value=game.board[i];
  round(ctx,x,y,cell,cell,10,value?(TILE_COLORS[value]||['#ffda86','#703654'])[0]:'#3b294d');
  if(value){const col=(TILE_COLORS[value]||['#ffda86','#703654'])[1],digits=String(value).length;const sz=digits>=5?15:digits===4?20:digits===3?26:31;
   text(ctx,String(value),x+cell/2,y+cell/2+sz*.34,sz,col,'center');
   if(value>=2048){ctx.strokeStyle='#fff1b4';ctx.lineWidth=2;ctx.strokeRect(x+3,y+3,cell-6,cell-6);}
  }
 }
 banner(ctx,{name:'2048',score:game.score,best,ready});
 text(ctx,`MOVES ${game.moves}     HIGHEST TILE ${Math.max(...game.board)}`,180,423,11,'#e9c9ef','center');
 if(game.status==='paused')dim(ctx,'PAUSED','Resume to keep merging');
 else if(game.status==='dead')dim(ctx,'NO MOVES',`Final score: ${game.score}`);
 else if(game.status==='idle') {round(ctx,86,57,188,24,11,'#6c376f');text(ctx,'SWIPE OR USE ARROWS',180,73,11,'#fff1f9','center');}
 if(game.won&&game.status!=='dead'){round(ctx,82,57,196,24,11,'#b66c51');text(ctx,'2048 UNLOCKED!',180,73,12,'#fff5d8','center');}
}
