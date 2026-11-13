/** Canvas renderers for the two additional Funzone games. Draws art and data, never font icons. */
import {SNAKE_COLS,SNAKE_ROWS,SNAKE_FOOD_KINDS} from './puzzles.js';
const W=360,H=452;
const round=(ctx,x,y,w,h,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
const gradient=(ctx,a,b)=>{const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,a);g.addColorStop(1,b);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);};
const text=(ctx,str,x,y,sz=16,color='#ffffff',align='left')=>{ctx.font=`800 ${sz}px ui-sans-serif,system-ui,sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(str,x,y);ctx.textAlign='left';};
const drawAsset=(ctx,img,x,y,w,h)=>{if(img?.complete&&img.naturalWidth){ctx.drawImage(img,x,y,w,h);return true;}return false;};
function banner(ctx,{name,score,best,ready}){
 // Quiet single-line in-canvas scoreboard; the host header owns generation state.
 text(ctx,name,20,35,13,'#ffe0f4');
 text(ctx,`SCORE ${score}`,140,35,12,'#ffffff');
 text(ctx,`BEST ${best}`,342,35,12,'#ffcf8b','right');
 ctx.fillStyle='#fff0f31f';ctx.fillRect(20,53,320,1);
}
function dim(ctx,message,sub){
 ctx.fillStyle='#120e27bc';ctx.fillRect(0,55,360,350);
 round(ctx,45,154,270,120,16,'#271a40');
 ctx.strokeStyle='#dc75b9';ctx.lineWidth=2;ctx.strokeRect(46,155,268,118);
 text(ctx,message,180,198,24,'#ffcfed','center');
 text(ctx,sub,180,229,12,'#eed9f4','center');
}
export function drawSnake(canvas,game,images,{ready=false,best=0,skin='default'}={}){
 if(!canvas?.getContext)return;const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
 
 const SNAKE_SKINS = {
   snake_mint: { glow: '#4ef2bb', track: '#1a6b61', stroke: '#60d7bd', fill: '#eafff5', headFilter: 'hue-rotate(190deg) saturate(1.5) brightness(1.1)', bands: [[20,'#133c43'],[15,'#219b8d'],[10,'#70e5be'],[4,'#d1fff0']] },
   snake_sunset: { glow: '#ff7a59', track: '#8c3b4a', stroke: '#ff9783', fill: '#fff0cf', headFilter: 'hue-rotate(43deg) saturate(1.6) brightness(1.1)', bands: [[20,'#51263c'],[15,'#bc5a60'],[10,'#ff967a'],[4,'#ffe0ad']] },
   snake_cyber: { glow: '#39ff14', track: '#135c24', stroke: '#4ade80', fill: '#dcfce7', headFilter: 'hue-rotate(140deg) saturate(2.2) brightness(1.2)', bands: [[20,'#0f3819'],[15,'#1b8735'],[10,'#39ff14'],[4,'#f0fdf4']] },
   snake_amethyst: { glow: '#c084fc', track: '#542982', stroke: '#d8b4fe', fill: '#fae8ff', headFilter: 'hue-rotate(300deg) saturate(1.6) brightness(1.05)', bands: [[20,'#27123d'],[15,'#7033ab'],[10,'#c084fc'],[4,'#faf5ff']] },
   snake_gold: { glow: '#ffd700', track: '#855e14', stroke: '#fde047', fill: '#fef9c3', headFilter: 'hue-rotate(80deg) saturate(2.2) brightness(1.15)', bands: [[20,'#4a3307'],[15,'#ab7b13'],[10,'#ffd700'],[4,'#fffbeb']] },
   snake_crimson: { glow: '#ff385c', track: '#871a2b', stroke: '#fb7185', fill: '#ffe4e6', headFilter: 'hue-rotate(20deg) saturate(1.9) brightness(1.05)', bands: [[20,'#420f18'],[15,'#b02137'],[10,'#ff385c'],[4,'#fff1f2']] },
   snake_frost: { glow: '#38bdf8', track: '#175375', stroke: '#7dd3fc', fill: '#e0f2fe', headFilter: 'hue-rotate(230deg) saturate(1.6) brightness(1.15)', bands: [[20,'#0f3247'],[15,'#1d7ea8'],[10,'#38bdf8'],[4,'#f0f9ff']] },
 };
 const activeSkin = (skin==='snake_mint'||skin==='snake_sunset') ? SNAKE_SKINS[skin] : (SNAKE_SKINS[skin] || { glow: '#ff5ea7', track: '#8c1f58', stroke: '#e75aa8', fill: '#ffd5e9', bands: [[20,'#28132f'],[15,'#b92f7b'],[10,'#f46ab1'],[4,'#ffc4e1']] });

 // Cyber-arcade background
 gradient(ctx,'#1e1430','#0e111c');
 for(let i=0;i<18;i++){ctx.fillStyle=i%2?'#ff78b518':'#38bdf818';ctx.fillRect((i*53+12)%360,(i*83+12)%400,2,2);}
 
 const size=22,x0=26,y0=65;
 // Playfield cabinet bezel
 round(ctx,17,55,326,350,16,'#1a1528');
 ctx.strokeStyle='#5f4277';ctx.lineWidth=1.5;ctx.strokeRect(17.5,55.5,325,349);
 ctx.fillStyle='#ff78b5';ctx.fillRect(20,56,320,2); // Neon rim
 
 // Sleek dark matrix grid
 for(let y=0;y<SNAKE_ROWS;y++)for(let x=0;x<SNAKE_COLS;x++){
  round(ctx,x0+x*size,y0+y*size,size-2,size-2,4,(x+y)%2?'#18152a':'#131122');
 }
 
 // One continuous outlined ribbon, NOT disconnected squares. Turns remain rounded.
 const centers=game.body.map(p=>({x:x0+p.x*size+size/2-1,y:y0+p.y*size+size/2-1}));
 if(centers.length>1){
  const trace=()=>{ctx.beginPath();const tail=centers[centers.length-1];ctx.moveTo(tail.x,tail.y);for(let i=centers.length-2;i>=0;i--)ctx.lineTo(centers[i].x,centers[i].y);};
  ctx.lineCap='round';ctx.lineJoin='round';

  if(typeof ctx.save==='function'){
   ctx.save();
   if(ctx.shadowColor!==undefined){
    ctx.shadowColor=activeSkin.glow;
    ctx.shadowBlur=10;
   }
   trace();ctx.lineWidth=15;
   ctx.strokeStyle=activeSkin.track;
   ctx.stroke();
   ctx.restore();
  }

  const bands=activeSkin.bands;
  for(const [thickness,color] of bands){
   trace();ctx.lineWidth=thickness;ctx.strokeStyle=color;ctx.stroke();
  }
  // Taper the tail beyond its final joint so the creature has a real silhouette.
  const last=centers.at(-1),before=centers.at(-2);
  const vx=Math.sign(last.x-before.x),vy=Math.sign(last.y-before.y);
  ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(last.x+vx*9,last.y+vy*9);
  ctx.lineWidth=5;ctx.strokeStyle=activeSkin.stroke;ctx.stroke();
  // Luminous scale glints along the body spine
  for(let i=1;i<centers.length;i++){
   const c=centers[i];ctx.beginPath();ctx.arc(c.x-2,c.y-3,2.2,0,Math.PI*2);
   ctx.fillStyle=activeSkin.fill;ctx.fill();
  }
 }
 if(centers.length){
  const head=centers[0],angle={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[game.direction]||0;
  ctx.save();ctx.translate(head.x,head.y);ctx.rotate(angle);
  if(activeSkin.glow&&ctx.shadowColor!==undefined){
   ctx.shadowColor=activeSkin.glow;ctx.shadowBlur=12;
  }
  if('filter' in ctx&&typeof ctx.filter==='string'&&activeSkin.headFilter){
   ctx.filter=activeSkin.headFilter;
  }
  if(!drawAsset(ctx,images.snake_head,-18,-18,36,36)){
   round(ctx,-14,-13,30,28,13,activeSkin.stroke||'#ed5ca2');round(ctx,4,-5,12,10,5,activeSkin.fill||'#ffbddc');
  }
  if('filter' in ctx&&typeof ctx.filter==='string')ctx.filter='none';
  ctx.restore();
 }
 if(game.food){
  const p=game.food,x=x0+p.x*size,y=y0+p.y*size;
  const kind=SNAKE_FOOD_KINDS.includes(p.kind)?p.kind:'apple';
  ctx.beginPath();ctx.arc(x+size/2,y+size/2,14,0,Math.PI*2);ctx.fillStyle='#ff78b532';ctx.fill();
  if(!drawAsset(ctx,images[`snake_food_${kind}`]||images.snake_snack,x-3,y-4,size+7,size+7))round(ctx,x+3,y+3,size-6,size-6,8,'#ffb75a');
 }
 banner(ctx,{name:'SNAKE',score:game.score,best,ready});
 if(game.status==='idle')dim(ctx,'SNAKE','Press Play, swipe or use arrow keys');
 else if(game.status==='paused')dim(ctx,'PAUSED','Resume whenever you like');
 else if(game.status==='dead')dim(ctx,'GAME OVER',`Snacks collected: ${game.score}`);
}
const TILE_COLORS={2:['#f6deef','#67416a'],4:['#f7cbdc','#623961'],8:['#ffb88c','#55305a'],16:['#ff9d9c','#542b52'],32:['#ff7ea6','#fff9fb'],64:['#f56197','#ffffff'],128:['#ec78db','#ffffff'],256:['#cd7be5','#ffffff'],512:['#ac7bdc','#ffffff'],1024:['#b1a1ff','#ffffff'],2048:['#ffe08e','#65304a']};
const MERGE_THEMES = {
  merge_mint: {
    canvasBg: ['#0d232a', '#061318'],
    boardBg: '#133943',
    boardBorder: '#2dd4bf',
    emptyCell: '#1b4d5a',
    palette: ['#c8f6e8','#a9e9db','#8bd8df','#71c4dd','#6faddd','#698fd0','#637bc2','#7271b3','#8b86cc','#9abbe4','#ffe3a7'],
    textColors: ['#0c2e36','#0c2e36','#0c2e36','#0c2e36','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#2b2310'],
    starColor: '#2dd4bf20',
    metaColor: '#5eead4',
  },
  merge_candy: {
    canvasBg: ['#2e162c', '#180917'],
    boardBg: '#421f3f',
    boardBorder: '#f43f5e',
    emptyCell: '#582753',
    palette: ['#ffe7da','#ffcfbf','#ffbea8','#ffa6ad','#f48fb3','#df7eaf','#d777bd','#c880c6','#af7cc8','#9b7dd0','#ffe8a0'],
    textColors: ['#4a1f33','#4a1f33','#4a1f33','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#3b2208'],
    starColor: '#f43f5e20',
    metaColor: '#ffa5d2',
  },
  merge_cyber: {
    canvasBg: ['#040f07', '#020703'],
    boardBg: '#092514',
    boardBorder: '#22c55e',
    emptyCell: '#103d21',
    palette: ['#0f291e','#134e3f','#0d7355','#059669','#10b981','#34d399','#6ee7b7','#a7f3d0','#fef08a','#fde047','#facc15'],
    textColors: ['#86efac','#bbf7d0','#dcfce7','#ffffff','#ffffff','#041a0d','#041a0d','#041a0d','#041a0d','#041a0d','#041a0d'],
    starColor: '#22c55e20',
    metaColor: '#4ade80',
  },
  merge_amethyst: {
    canvasBg: ['#140826', '#080312'],
    boardBg: '#210c40',
    boardBorder: '#a855f7',
    emptyCell: '#30135c',
    palette: ['#2e1065','#3b0764','#581c87','#6b21a8','#7e22ce','#9333ea','#a855f7','#c084fc','#d8b4fe','#e9d5ff','#fae8ff'],
    textColors: ['#e9d5ff','#f3e8ff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#1e0836','#18062b','#18062b','#120421'],
    starColor: '#a855f722',
    metaColor: '#c084fc',
  },
  merge_gold: {
    canvasBg: ['#1d1206', '#0d0702'],
    boardBg: '#2c1a07',
    boardBorder: '#eab308',
    emptyCell: '#3d250c',
    palette: ['#3a2608','#54380b','#784e0e','#a16207','#ca8a04','#eab308','#facc15','#fde047','#fef08a','#fffbeb','#ffffff'],
    textColors: ['#ffeebf','#ffe299','#ffd56b','#ffffff','#ffffff','#2a1702','#261301','#201001','#1c0e01','#180b00','#180b00'],
    starColor: '#eab30822',
    metaColor: '#fde047',
  },
  merge_sunset: {
    canvasBg: ['#230c28', '#110416'],
    boardBg: '#35113d',
    boardBorder: '#f97316',
    emptyCell: '#4a1755',
    palette: ['#3f123d','#5b1846','#7d1d4a','#9f224b','#c22b46','#e34234','#f26419','#f6ae2d','#f7c815','#f9e076','#fff4cc'],
    textColors: ['#ffe4f7','#ffd0f0','#ffbadf','#ffffff','#ffffff','#ffffff','#ffffff','#260818','#240713','#290a05','#260905'],
    starColor: '#f973161c',
    metaColor: '#fdba74',
  },
  merge_noir: {
    canvasBg: ['#11161d', '#080a0e'],
    boardBg: '#1c242f',
    boardBorder: '#94a3b8',
    emptyCell: '#273342',
    palette: ['#1e293b','#334155','#475569','#64748b','#94a3b8','#cbd5e1','#e2e8f0','#f1f5f9','#38bdf8','#0ea5e9','#0284c7'],
    textColors: ['#cbd5e1','#e2e8f0','#f8fafc','#ffffff','#0f172a','#0f172a','#0f172a','#0f172a','#082f49','#082f49','#ffffff'],
    starColor: '#94a3b81a',
    metaColor: '#cbd5e1',
  },
};
export function drawMerge(canvas,game,{ready=false,best=0,skin='default'}={}){
 if(!canvas?.getContext)return;const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
 const theme = (skin==='merge_mint'||skin==='merge_candy') ? MERGE_THEMES[skin] : (MERGE_THEMES[skin] || null);
 const palette = theme?.palette || null;
 const canvasBg = theme?.canvasBg || ['#282139','#1b192b'];
 const boardBg = theme?.boardBg || '#443450';
 const emptyCell = theme?.emptyCell || '#3b294d';
 const starCol = theme?.starColor || '#fee3b81c';
 const metaCol = theme?.metaColor || '#e9c9ef';

 gradient(ctx,canvasBg[0],canvasBg[1]);
 for(let i=0;i<20;i++){ctx.fillStyle=i%4?'#f1b7ff11':starCol;ctx.fillRect((i*91+11)%360,(i*89)%452,5,5);}
 const x0=29,y0=91,cell=68,gap=8;
 round(ctx,19,78,322,321,13,boardBg);
 if(theme?.boardBorder){
  ctx.strokeStyle=theme.boardBorder;ctx.lineWidth=1.5;ctx.strokeRect(19,78,322,321);
 }
 for(let i=0;i<16;i++){
  const x=x0+(i%4)*(cell+gap),y=y0+Math.floor(i/4)*(cell+gap),value=game.board[i];
  const index=value?Math.max(1,Math.log2(value)):0;
  const tileBackground=value?(palette?palette[Math.min(index-1,palette.length-1)]:(TILE_COLORS[value]||['#ffda86','#703654'])[0]):emptyCell;
  round(ctx,x,y,cell,cell,10,tileBackground);
  if(value){
   const col=theme ? theme.textColors[Math.min(index-1,theme.textColors.length-1)] : (TILE_COLORS[value]||['#ffda86','#703654'])[1];
   const digits=String(value).length;const sz=digits>=5?15:digits===4?20:digits===3?26:31;
   text(ctx,String(value),x+cell/2,y+cell/2+sz*.34,sz,col,'center');
   if(value>=2048){ctx.strokeStyle='#fff1b4';ctx.lineWidth=2;ctx.strokeRect(x+3,y+3,cell-6,cell-6);}
  }
 }
 banner(ctx,{name:'2048',score:game.score,best,ready});
 text(ctx,`MOVES ${game.moves}     HIGHEST TILE ${Math.max(...game.board)}`,180,423,11,metaCol,'center');
 if(game.status==='paused')dim(ctx,'PAUSED','Resume to keep merging');
 else if(game.status==='dead')dim(ctx,'NO MOVES',`Final score: ${game.score}`);
 else if(game.status==='idle') {text(ctx,'SWIPE OR USE ARROWS',180,70,10,'#c6aacb','center');}
 if(game.won&&game.status!=='dead'){round(ctx,82,57,196,24,11,'#b66c51');text(ctx,'2048 UNLOCKED!',180,73,12,'#fff5d8','center');}
}
