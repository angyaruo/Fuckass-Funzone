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
export function drawPlinko(canvas,game,images,{tickets=0,stake=1,reduced=false}={}){
 if(!canvas?.getContext)return;const c=canvas.getContext('2d');if(!c)return;
 c.setTransform(canvas.width/PLINKO_W,0,0,canvas.height/PLINKO_H,0,0);
 const bg=c.createLinearGradient(0,0,0,PLINKO_H);bg.addColorStop(0,'#23172c');bg.addColorStop(.62,'#151b26');bg.addColorStop(1,'#11161f');c.fillStyle=bg;c.fillRect(0,0,360,452);
 // Stage-like cabinet shell: quieter than Match-3, but with more ceremony than a blank board.
 const shell=c.createLinearGradient(0,0,360,452);shell.addColorStop(0,'#30203a');shell.addColorStop(.55,'#1a1d29');shell.addColorStop(1,'#271a31');
 round(c,14,73,332,352,18,shell);
 strokeRound(c,15,74,330,350,18,'#7c5479',1.5);
 strokeRound(c,21,80,318,340,14,'#35263a',1);
 const rail=c.createLinearGradient(0,0,0,26);rail.addColorStop(0,'#ff9fd1');rail.addColorStop(1,'#a24b7f');
 c.fillStyle=rail;c.fillRect(27,86,306,2.5);
 c.globalAlpha=.12;c.fillStyle='#ffd8ef';c.fillRect(24,83,312,6);c.globalAlpha=1;
 // Top score band.
 round(c,20,14,320,40,11,'#2b2234');
 label(c,'PLINKO',33,39,17,'#fff2df');
 sprite(c,images.plinko_crest,118,22,22,22);
 label(c,`BEST ${game.best}`,154,38,11,'#f7e7cb');
 // House plaque gives the machine an owner without shouting over the pegboard.
 pill(c,134,101,92,24,'#4d2f55','#be82a0');
 sprite(c,images.plinko_crest,143,106,14,14);
 label(c,'THE HOUSE',180,118,11,'#ffe6cf','center');
 // Peg chamber.
 const chamberGrad=c.createLinearGradient(0,90,0,415); chamberGrad.addColorStop(0,'#141b28'); chamberGrad.addColorStop(1,'#101621');
 round(c,24,90,312,314,12,chamberGrad);
 c.save(); c.globalAlpha=.18; c.strokeStyle='#6d4966'; c.lineWidth=1;
 for(let y=104;y<390;y+=28){c.beginPath();c.moveTo(31,y);c.lineTo(329,y);c.stroke();}
 c.restore();
 // Modest stage-corner flourishes: more pizzazz, not more clutter.
 c.save(); c.strokeStyle='#7d5877'; c.globalAlpha=.5; c.lineWidth=1;
 const corners=[[35,102,1,1],[325,102,-1,1],[35,392,1,-1],[325,392,-1,-1]];
 for(const [x,y,sx,sy] of corners){c.beginPath();c.moveTo(x,y+12*sy);c.lineTo(x,y);c.lineTo(x+12*sx,y);c.stroke();}
 c.restore();
 // Pegs: copper dots with a little life, but still easy to scan past.
 for(const p of PLINKO_PEGS){
  c.beginPath();c.arc(p.x,p.y,6.25,0,Math.PI*2);c.fillStyle='#40263a';c.fill();
  c.beginPath();c.arc(p.x,p.y,4.15,0,Math.PI*2);c.fillStyle='#e6a16d';c.fill();
  c.beginPath();c.arc(p.x-1.2,p.y-1.35,1.55,0,Math.PI*2);c.fillStyle='#fff1cb';c.fill();
  if(!reduced){c.beginPath();c.arc(p.x+.75,p.y+.6,5.3,0,Math.PI*2);c.strokeStyle='rgba(255,204,156,.10)';c.lineWidth=.8;c.stroke();}
 }
 // Drop guide uses the active stake tint so the action feels intentional.
 const aimX=game.ball?.x ?? 180;
 const wagerColor=stake>=10?'#ee78b3':stake>=5?'#ac7fd9':stake>=1?'#6dc4d5':'#b1a7b9';
 c.save(); c.globalAlpha=.65;
 c.strokeStyle=wagerColor; c.lineWidth=1.5; c.setLineDash?.([4,4]); c.beginPath(); c.moveTo(aimX,123); c.lineTo(aimX,149); c.stroke(); c.restore(); c.setLineDash?.([]);
 // Payout bins are the reward spectacle. Let them do the talking.
 const binW=(PLINKO_BIN_RIGHT-PLINKO_BIN_LEFT)/PLINKO_SLOTS.length;
 const colors=['#c99a41','#8d6cb4','#54a5b4','#64a38f','#8a6f55','#64a38f','#54a5b4','#8d6cb4','#c99a41'];
 const glows=['#ffd16e','#b492ff','#7ddbf0','#8ef1c6','#c6a47a','#8ef1c6','#7ddbf0','#b492ff','#ffd16e'];
 const result=game.lastResult,winning=result&&game.flash>0?result.slot:-1;
 for(let i=0;i<PLINKO_SLOTS.length;i++){
  const x=PLINKO_BIN_LEFT+i*binW,won=i===winning;
  c.fillStyle='#c597b9';c.fillRect(x+binW-.75,PLINKO_BIN_Y-26,1.5,25);
  c.save();
  if(won){c.shadowColor=glows[i];c.shadowBlur=reduced?0:18;c.globalAlpha=1;}
  round(c,x+1,PLINKO_BIN_Y-2,binW-2,34,6,colors[i]);
  if(won){
   strokeRound(c,x+1.5,PLINKO_BIN_Y-1.5,binW-3,33,6,'#fff1bc',2.4);
   c.strokeStyle='#fff1bc';c.lineWidth=2.2;c.strokeRect(x+2.5,PLINKO_BIN_Y,binW-5,28);
   if(!reduced){spark(c,x+binW/2,PLINKO_BIN_Y-8,'#fff0b7',.9);spark(c,x+7,PLINKO_BIN_Y+7,glows[i],.6);spark(c,x+binW-7,PLINKO_BIN_Y+8,glows[i],.6);}
  } else {
   strokeRound(c,x+1.5,PLINKO_BIN_Y-1.5,binW-3,33,6,'rgba(255,255,255,.09)',1);
  }
  label(c,`x${PLINKO_SLOTS[i]}`,x+binW/2,PLINKO_BIN_Y+19,11,'#ffffff','center');
  c.restore();
 }
 c.strokeStyle='#936c8d';c.lineWidth=2;c.beginPath();c.moveTo(18,88);c.lineTo(18,425);c.lineTo(342,425);c.lineTo(342,88);c.stroke();
 // Ball and trail.
 if(game.ball){
  if(!reduced)game.trail.forEach((p,i)=>{c.globalAlpha=(i+1)/(game.trail.length+1)*.22;c.beginPath();c.arc(p.x,p.y,6.8,0,Math.PI*2);c.fillStyle='#f6b9ec';c.fill();});
  c.globalAlpha=1;const {x,y}=game.ball;
  if(!sprite(c,images.plinko_chip,x-11,y-11,22,22)){
   c.beginPath();c.arc(x,y,8,0,Math.PI*2);c.fillStyle='#f7bf78';c.fill();c.strokeStyle='#fff1b1';c.lineWidth=2;c.stroke();
  }
 }else{
  sprite(c,images.plinko_chip,169,118,22,22);
 }
 // Compact toast near the bottom, never a slab over the pegs.
 if(result&&game.flash>0){
  const message=result.practice?'PRACTICE':result.multiplier===0?'NO PAYOUT':`x${result.multiplier} +${result.payout}`;
  const toastW=Math.min(112,Math.max(62,message.length*5.9+18));
  const tx=Math.max(20,Math.min(340-toastW,PLINKO_BIN_LEFT+(result.slot+.5)*binW-toastW/2));
  pill(c,tx,PLINKO_BIN_Y-52,toastW,22,'#2f2338','#b886a6');
  label(c,message,tx+toastW/2,PLINKO_BIN_Y-37,10,'#fff0da','center');
 }
 const foot=game.ball?(game.status==='paused'?'PAUSED':'BALL IN PLAY'):result?`${result.multiplier}X  /  +${result.payout} TICKETS`:'CHOOSE YOUR WAGER AND DROP';
 label(c,foot,180,443,9,'#d1bfd0','center');
}
