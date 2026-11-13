/** Plush mini-cabinet renderer for the fictional-ticket Plinko board. */
import {PLINKO_W,PLINKO_H,PLINKO_PEGS,PLINKO_SLOTS,PLINKO_BIN_LEFT,PLINKO_BIN_RIGHT,PLINKO_BIN_Y} from './plinko.js';
function round(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
function strokeRound(ctx,x,y,w,h,r,color,width=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function label(ctx,s,x,y,size=12,color='#fdf0f9',align='left'){
 ctx.font=`800 ${size}px ui-sans-serif,system-ui,sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(String(s),x,y);ctx.textAlign='left';
}
const sprite=(ctx,img,x,y,w,h)=>{if(img?.complete&&img.naturalWidth){ctx.drawImage(img,x,y,w,h);return true;}return false;};
function pill(ctx,x,y,w,h,fill,stroke){round(ctx,x,y,w,h,Math.min(10,h/2),fill); if(stroke)strokeRound(ctx,x+.5,y+.5,w-1,h-1,Math.min(10,h/2),stroke,1);}
function spark(ctx,x,y,color='#ffd791',scale=1){
 ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1.2*scale;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(x,y-4*scale);ctx.lineTo(x,y+4*scale);ctx.moveTo(x-4*scale,y);ctx.lineTo(x+4*scale,y);ctx.stroke();
 ctx.beginPath();ctx.moveTo(x-2.6*scale,y-2.6*scale);ctx.lineTo(x+2.6*scale,y+2.6*scale);ctx.moveTo(x+2.6*scale,y-2.6*scale);ctx.lineTo(x-2.6*scale,y+2.6*scale);ctx.stroke();
 ctx.restore();
}
export function drawPlinko(canvas,game,images,{tickets=0,stake=1,reduced=false,trailSkin='default'}={}){
 if(!canvas?.getContext)return;const c=canvas.getContext('2d');if(!c)return;
 c.setTransform(canvas.width/PLINKO_W,0,0,canvas.height/PLINKO_H,0,0);
 
 // Deep midnight casino backdrop
 const bg=c.createLinearGradient(0,0,0,PLINKO_H);
 bg.addColorStop(0,'#1a1027');bg.addColorStop(0.35,'#101421');bg.addColorStop(0.75,'#0a0e18');bg.addColorStop(1,'#070a12');
 c.fillStyle=bg;c.fillRect(0,0,360,452);

 // Polished luxury gold & rose-gold casino cabinet shell
 const shellBorder=c.createLinearGradient(0,72,360,424);
 shellBorder.addColorStop(0,'#f5ca68');shellBorder.addColorStop(0.25,'#945c2a');shellBorder.addColorStop(0.5,'#ffd885');shellBorder.addColorStop(0.75,'#a1632f');shellBorder.addColorStop(1,'#572a12');
 round(c,13,72,334,354,18,shellBorder);

 const shell=c.createLinearGradient(0,74,0,424);
 shell.addColorStop(0,'#2b1b38');shell.addColorStop(0.5,'#131826');shell.addColorStop(1,'#1f142b');
 round(c,15,74,330,350,16,shell);
 strokeRound(c,15.5,74.5,329,349,16,'#ffd27d',1.2);
 strokeRound(c,20.5,79.5,319,339,12,'#5c3756',1);

 // Glowing neon marquee rail across top of board
 const rail=c.createLinearGradient(0,0,360,0);
 rail.addColorStop(0,'#ff78b5');rail.addColorStop(0.5,'#ffd57e');rail.addColorStop(1,'#b55fe6');
 c.fillStyle=rail;c.fillRect(26,85,308,3);
 if(!reduced){
  c.save();c.shadowColor='#ff78b5';c.shadowBlur=8;c.fillStyle='#ffffff';
  c.fillRect(26,85,308,1.2);c.restore();
 }

 // Top marquee band
 const marqueeBg=c.createLinearGradient(0,14,0,54);
 marqueeBg.addColorStop(0,'#3c224a');marqueeBg.addColorStop(0.5,'#20152d');marqueeBg.addColorStop(1,'#2f173b');
 round(c,20,14,320,40,11,marqueeBg);
 strokeRound(c,20.5,14.5,319,39,11,'#e0a353',1.5);
 strokeRound(c,22.5,16.5,315,35,9,'#573356',1);

 // Metallic gold 3D PLINKO lettering
 c.save();
 c.font='900 17px ui-sans-serif,system-ui,sans-serif';
 c.fillStyle='#000000a0';c.fillText('PLINKO',34,40);
 const plinkoGold=c.createLinearGradient(0,24,0,40);
 plinkoGold.addColorStop(0,'#ffffff');plinkoGold.addColorStop(0.35,'#ffe599');plinkoGold.addColorStop(0.7,'#f5b842');plinkoGold.addColorStop(1,'#c47918');
 c.fillStyle=plinkoGold;c.fillText('PLINKO',33,39);
 c.restore();

 // Gilded crest
 if(!reduced){c.save();c.shadowColor='#ffd77d';c.shadowBlur=8;}
 sprite(c,images.plinko_crest,118,22,22,22);
 if(!reduced)c.restore();

 // High score badge
 pill(c,148,22,96,24,'#181224','#be82a0');
 label(c,`BEST ${game.best}`,196,38,11,'#ffe6b8','center');

 // House plaque
 pill(c,134,101,92,24,'#4d2f55','#be82a0');
 sprite(c,images.plinko_crest,143,106,14,14);
 label(c,'THE HOUSE',180,118,11,'#ffe6cf','center');

 // Peg chamber
 const chamberGrad=c.createLinearGradient(0,90,0,415);
 chamberGrad.addColorStop(0,'#111624');chamberGrad.addColorStop(0.5,'#0d131e');chamberGrad.addColorStop(1,'#0a0e17');
 round(c,24,90,312,314,12,chamberGrad);

 // Ambient spotlight behind pegs
 if(!reduced&&typeof c.createRadialGradient==='function'){
  c.save();
  const spot=c.createRadialGradient(180,230,10,180,230,150);
  spot.addColorStop(0,'rgba(168,85,247,0.12)');
  spot.addColorStop(0.5,'rgba(236,72,153,0.05)');
  spot.addColorStop(1,'transparent');
  c.fillStyle=spot;c.fillRect(24,90,312,314);
  c.restore();
 }

 // Subtle casino chevron guides
 c.save();c.globalAlpha=.14;c.strokeStyle='#aa6e9e';c.lineWidth=1;
 for(let y=116;y<380;y+=36){
  c.beginPath();c.moveTo(180,y-14);c.lineTo(315,y+10);c.stroke();
  c.beginPath();c.moveTo(180,y-14);c.lineTo(45,y+10);c.stroke();
 }
 c.restore();

 // Glowing side rebound rails
 c.save();
 const leftBumper=c.createLinearGradient(0,92,0,404);
 leftBumper.addColorStop(0,'#ff78b5');leftBumper.addColorStop(0.5,'#b0559a');leftBumper.addColorStop(1,'#7e5bef');
 c.fillStyle=leftBumper;
 c.fillRect(24,94,3.5,302);
 c.fillRect(332.5,94,3.5,302);
 c.restore();

 // Stage-corner flourishes
 c.save();c.strokeStyle='#d49646';c.globalAlpha=.55;c.lineWidth=1.2;
 const corners=[[34,101,1,1],[326,101,-1,1],[34,393,1,-1],[326,393,-1,-1]];
 for(const [x,y,sx,sy] of corners){
  c.beginPath();c.moveTo(x,y+10*sy);c.lineTo(x,y);c.lineTo(x+10*sx,y);c.stroke();
  c.beginPath();c.arc(x+3*sx,y+3*sy,1.2,0,Math.PI*2);c.fillStyle='#ffd885';c.fill();
 }
 c.restore();

 // Glass sheen across upper corner
 if(!reduced){
  c.save();
  c.beginPath();c.moveTo(24,90);c.lineTo(160,90);c.lineTo(24,226);c.closePath?.();
  const glass=c.createLinearGradient(24,90,160,226);
  glass.addColorStop(0,'rgba(255,255,255,0.06)');glass.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=glass;c.fill();
  c.restore();
 }

 // Shiny 3D golden brass casino pins
 for(const p of PLINKO_PEGS){
  c.beginPath();c.arc(p.x,p.y+1.2,5.6,0,Math.PI*2);c.fillStyle='rgba(5,4,10,0.65)';c.fill();
  if(typeof c.createRadialGradient==='function'){
   const pegGrad=c.createRadialGradient(p.x-1.3,p.y-1.3,0.5,p.x,p.y,5);
   pegGrad.addColorStop(0,'#fffde8');
   pegGrad.addColorStop(0.25,'#fcd66a');
   pegGrad.addColorStop(0.7,'#c98124');
   pegGrad.addColorStop(1,'#66360c');
   c.fillStyle=pegGrad;
  }else{
   c.fillStyle='#e5a94e';
  }
  c.beginPath();c.arc(p.x,p.y,4.6,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(p.x-1.3,p.y-1.3,1.3,0,Math.PI*2);c.fillStyle='#ffffff';c.fill();
  if(!reduced){
   c.beginPath();c.arc(p.x,p.y,5.4,0,Math.PI*2);
   c.strokeStyle='rgba(255,225,130,0.2)';c.lineWidth=0.8;c.stroke();
  }
 }

 // Drop targeting guide
 const aimX=game.ball?.x ?? 180;
 const wagerColor=stake>=10?'#ffd269':stake>=5?'#f472b6':stake>=1?'#67e8f9':'#c084fc';
 c.save();
 c.globalAlpha=.75;c.strokeStyle=wagerColor;c.lineWidth=1.8;
 if(!reduced){c.shadowColor=wagerColor;c.shadowBlur=8;}
 c.setLineDash?.([4,3]);c.beginPath();c.moveTo(aimX,123);c.lineTo(aimX,149);c.stroke();
 c.setLineDash?.([]);
 c.beginPath();c.moveTo(aimX-4,144);c.lineTo(aimX,149);c.lineTo(aimX+4,144);c.stroke();
 c.restore();

 // 3D Multiplier Pockets
 const binW=(PLINKO_BIN_RIGHT-PLINKO_BIN_LEFT)/PLINKO_SLOTS.length;
 const binColors=[
  ['#9e6612','#e6a833','#7a4805'], // x8 Gold
  ['#682187','#ad4fd6','#4a1363'], // x2 Purple
  ['#15536b','#2597b8','#0d394a'], // x1 Cyan
  ['#1b5c46','#2da67f','#113d2f'], // x1 Mint
  ['#47131e','#7d2334','#2e0a12'], // x0 Hazard
  ['#1b5c46','#2da67f','#113d2f'], // x1 Mint
  ['#15536b','#2597b8','#0d394a'], // x1 Cyan
  ['#682187','#ad4fd6','#4a1363'], // x2 Purple
  ['#9e6612','#e6a833','#7a4805']  // x8 Gold
 ];
 const binBorders=['#ffe08a','#e8a3ff','#7be8ff','#7effce','#f87185','#7effce','#7be8ff','#e8a3ff','#ffe08a'];
 const glows=['#ffd700','#c084fc','#38bdf8','#34d399','#f43f5e','#34d399','#38bdf8','#c084fc','#ffd700'];
 const result=game.lastResult,winning=result&&game.flash>0?result.slot:-1;

 for(let i=0;i<PLINKO_SLOTS.length;i++){
  const x=PLINKO_BIN_LEFT+i*binW,won=i===winning;
  const divGrad=c.createLinearGradient(0,PLINKO_BIN_Y-26,0,PLINKO_BIN_Y);
  divGrad.addColorStop(0,'#e5ad58');divGrad.addColorStop(0.5,'#ffffff');divGrad.addColorStop(1,'#8c5520');
  c.fillStyle=divGrad;c.fillRect(x+binW-.75,PLINKO_BIN_Y-26,1.5,25);
  
  c.save();
  if(won){c.shadowColor=glows[i];c.shadowBlur=reduced?0:22;c.globalAlpha=1;}
  const pocketGrad=c.createLinearGradient(0,PLINKO_BIN_Y-2,0,PLINKO_BIN_Y+32);
  pocketGrad.addColorStop(0,binColors[i][1]);
  pocketGrad.addColorStop(0.3,binColors[i][0]);
  pocketGrad.addColorStop(1,binColors[i][2]);
  round(c,x+1,PLINKO_BIN_Y-2,binW-2,34,6,pocketGrad);
  
  c.fillStyle='rgba(255,255,255,0.38)';
  c.fillRect(x+3,PLINKO_BIN_Y-1,binW-6,1.5);

  if(won){
   strokeRound(c,x+1.5,PLINKO_BIN_Y-1.5,binW-3,33,6,'#fff1bc',2.4);
   c.strokeStyle='#fff1bc';c.lineWidth=2.2;c.strokeRect(x+2.5,PLINKO_BIN_Y,binW-5,28);
   if(!reduced){
    spark(c,x+binW/2,PLINKO_BIN_Y-8,'#fff0b7',1.1);
    spark(c,x+7,PLINKO_BIN_Y+7,glows[i],.7);
    spark(c,x+binW-7,PLINKO_BIN_Y+8,glows[i],.7);
   }
  } else {
   strokeRound(c,x+1.5,PLINKO_BIN_Y-1.5,binW-3,33,6,binBorders[i],1.2);
  }
  
  c.font='900 11px ui-sans-serif,system-ui,sans-serif';
  c.fillStyle='#000000a0';
  c.textAlign='center';
  c.fillText(`x${PLINKO_SLOTS[i]}`,x+binW/2,PLINKO_BIN_Y+20);
  c.fillStyle=i===4?'#ffd1d8':'#ffffff';
  c.fillText(`x${PLINKO_SLOTS[i]}`,x+binW/2,PLINKO_BIN_Y+19);
  c.textAlign='left';
  c.restore();
 }

 c.strokeStyle='#936c8d';c.lineWidth=2;c.beginPath();c.moveTo(18,88);c.lineTo(18,425);c.lineTo(342,425);c.lineTo(342,88);c.stroke();

 // Ball and trail
 if(game.ball){
  const FLAIR_PROFILES = {
   plinko_aqua: { trail: '#80f6f5', core: '#e0fcff', spark: '#38bdf8', aura: '#80f6f5' },
   plinko_gold: { trail: '#ffe59a', core: '#fffbeb', spark: '#facc15', aura: '#ffd700' },
   plinko_neon: { trail: '#ff2a8d', core: '#ffe4f1', spark: '#ff77bb', aura: '#ff2a8d' },
   plinko_emerald: { trail: '#10b981', core: '#d1fae5', spark: '#34d399', aura: '#10b981' },
   plinko_amethyst: { trail: '#a855f7', core: '#f3e8ff', spark: '#c084fc', aura: '#a855f7' },
   plinko_solar: { trail: '#ff6700', core: '#fff7ed', spark: '#fb923c', aura: '#ff4500' },
   plinko_frost: { trail: '#a5f3fc', core: '#ffffff', spark: '#38bdf8', aura: '#7dd3fc' },
  };
  const flair = (trailSkin==='plinko_aqua'||trailSkin==='plinko_gold') ? FLAIR_PROFILES[trailSkin] : (FLAIR_PROFILES[trailSkin] || { trail: '#f6b9ec', core: '#fff0fa', spark: '#f472b6', aura: '#ffcf79' });
  const trailColor = flair.trail;
  if(!reduced)game.trail.forEach((p,i)=>{
   const alpha=(i+1)/(game.trail.length+1);
   c.globalAlpha=alpha*.48;
   c.beginPath();c.arc(p.x,p.y,7.5,0,Math.PI*2);
   c.fillStyle=trailColor;c.fill();
   c.globalAlpha=alpha*.85;
   c.beginPath();c.arc(p.x,p.y,3.2,0,Math.PI*2);
   c.fillStyle=flair.core;c.fill();
   if(i%2===0){
    const ox=Math.sin(i*2.3)*6,oy=Math.cos(i*1.9)*3;
    c.globalAlpha=alpha*.7;
    c.beginPath();c.arc(p.x+ox,p.y+oy,1.8,0,Math.PI*2);
    c.fillStyle=flair.spark;c.fill();
   }
  });
  c.globalAlpha=1;const {x,y}=game.ball;
  if(!reduced){
   c.save();c.shadowColor=flair.aura;c.shadowBlur=14;
   c.beginPath();c.arc(x,y,13,0,Math.PI*2);
   c.strokeStyle=flair.trail;c.lineWidth=1.5;c.stroke();
  }
  if(!sprite(c,images.plinko_chip,x-11,y-11,22,22)){
   c.beginPath();c.arc(x,y,8,0,Math.PI*2);c.fillStyle='#f7bf78';c.fill();c.strokeStyle='#fff1b1';c.lineWidth=2;c.stroke();
  }
  if(!reduced)c.restore();
 }else{
  if(!reduced){c.save();c.shadowColor='#ffcf79';c.shadowBlur=10;}
  sprite(c,images.plinko_chip,169,118,22,22);
  if(!reduced)c.restore();
 }

 // Floating result toast badge
 if(result&&game.flash>0){
  const message=result.practice?'PRACTICE':result.multiplier===0?'NO PAYOUT':`x${result.multiplier} +${result.payout}`;
  const toastW=Math.min(116,Math.max(68,message.length*6+20));
  const tx=Math.max(20,Math.min(340-toastW,PLINKO_BIN_LEFT+(result.slot+.5)*binW-toastW/2));
  c.save();
  if(!reduced){c.shadowColor='#ffd700';c.shadowBlur=12;}
  pill(c,tx,PLINKO_BIN_Y-52,toastW,22,'#281636','#facc15');
  c.restore();
  c.font='900 10px ui-sans-serif,system-ui,sans-serif';
  c.fillStyle='#fff6d6';c.textAlign='center';
  c.fillText(message,tx+toastW/2,PLINKO_BIN_Y-37);
  c.textAlign='left';
 }

 // Bottom illuminated status line
 const foot=game.ball?(game.status==='paused'?'PAUSED':'BALL IN PLAY'):result?`${result.multiplier}X  /  +${result.payout} TICKETS`:'CHOOSE YOUR WAGER AND DROP';
 c.save();
 c.font='900 9px ui-sans-serif,system-ui,sans-serif';
 c.fillStyle='#ffde9e';c.textAlign='center';
 c.fillText(foot,180,443);c.textAlign='left';
 c.restore();
}
