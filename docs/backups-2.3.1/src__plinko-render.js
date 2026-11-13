/** Compact Playfield renderer for the fictional-ticket Plinko board. */
import {PLINKO_W,PLINKO_H,PLINKO_PEGS,PLINKO_SLOTS,PLINKO_BIN_LEFT,PLINKO_BIN_RIGHT,PLINKO_BIN_Y} from './plinko.js';
function round(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
function label(ctx,s,x,y,size=12,color='#fdf0f9',align='left'){
 ctx.font=`800 ${size}px ui-sans-serif,system-ui,sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(String(s),x,y);ctx.textAlign='left';
}
const sprite=(ctx,img,x,y,w,h)=>{if(img?.complete&&img.naturalWidth){ctx.drawImage(img,x,y,w,h);return true;}return false;};
export function drawPlinko(canvas,game,images,{tickets=0,stake=1,reduced=false}={}){
 if(!canvas?.getContext)return;const c=canvas.getContext('2d');if(!c)return;
 c.setTransform(canvas.width/PLINKO_W,0,0,canvas.height/PLINKO_H,0,0);
 const bg=c.createLinearGradient(0,0,0,PLINKO_H);bg.addColorStop(0,'#21192b');bg.addColorStop(1,'#131923');c.fillStyle=bg;c.fillRect(0,0,360,452);
 // Quiet backdrop; machine trim is not allowed to compete with the trajectory.
 round(c,16,70,328,344,18,'#141a28');c.strokeStyle='#815779';c.lineWidth=1.5;c.strokeRect(17,71,326,342);
 round(c,20,14,320,42,12,'#302138');label(c,'PLINKO',33,40,17,'#fff2df');
 label(c,`BEST ${game.best}`,247,39,12,'#ffda94');
 if(!sprite(c,images.gabu_magnate,288,56,54,59))label(c,'GABU',290,83,10,'#ffbecc');
 // A proper miniature machine canopy.
 c.fillStyle='#b63f79';c.fillRect(24,78,312,5);c.fillStyle='#f1a2d3';c.fillRect(38,82,284,2);
 const canopy=c.createLinearGradient(154,0,206,0);canopy.addColorStop(0,'#3b203e');canopy.addColorStop(.5,'#77365c');canopy.addColorStop(1,'#3b203e');
 round(c,119,88,122,25,10,canopy);sprite(c,images.plinko_crest,127,88,23,23);label(c,'THE HOUSE',188,105,11,'#fff0dc','center');
 // Even peg rows and the ball occupy separate contrast layers.
 for(const p of PLINKO_PEGS){
  c.beginPath();c.arc(p.x,p.y,6.1,0,Math.PI*2);c.fillStyle='#4e3142';c.fill();
  c.beginPath();c.arc(p.x,p.y,4,0,Math.PI*2);c.fillStyle='#e9a972';c.fill();
  c.beginPath();c.arc(p.x-1.3,p.y-1.5,1.5,0,Math.PI*2);c.fillStyle='#fff4cc';c.fill();
 }
 const binW=(PLINKO_BIN_RIGHT-PLINKO_BIN_LEFT)/PLINKO_SLOTS.length;
 const colors=['#b44780','#8a518d','#397e99','#537e79','#a07945','#537e79','#397e99','#8a518d','#b44780'];
 for(let i=0;i<PLINKO_SLOTS.length;i++){
  const x=PLINKO_BIN_LEFT+i*binW;
  round(c,x+1,PLINKO_BIN_Y-2,binW-2,33,5,colors[i]);
  label(c,`x${PLINKO_SLOTS[i]}`,x+binW/2,PLINKO_BIN_Y+19,11,'#ffffff','center');
  c.fillStyle='#d2a1cf';c.fillRect(x+binW-.8,PLINKO_BIN_Y-29,1.6,28);
 }
 c.strokeStyle='#a76e96';c.lineWidth=3;c.beginPath();c.moveTo(18,88);c.lineTo(18,427);c.lineTo(342,427);c.lineTo(342,88);c.stroke();
 if(game.ball){
  if(!reduced)game.trail.forEach((p,i)=>{c.globalAlpha=(i+1)/(game.trail.length+1)*.26;c.beginPath();c.arc(p.x,p.y,7,0,Math.PI*2);c.fillStyle='#f6b9ec';c.fill();});
  c.globalAlpha=1;const {x,y}=game.ball;
  if(!sprite(c,images.plinko_chip,x-11,y-11,22,22)){
   c.beginPath();c.arc(x,y,8,0,Math.PI*2);c.fillStyle='#f7bf78';c.fill();c.strokeStyle='#fff1b1';c.lineWidth=2;c.stroke();
  }
 }else{
  sprite(c,images.plinko_chip,169,113,22,22);
 }
 round(c,22,435,316,12,5,'#241d2c');
 label(c,game.ball?(game.status==='paused'?'BALL PAUSED':'BOUNCING...'):game.lastResult?`${game.lastResult.multiplier}X  ·  +${game.lastResult.payout} TICKETS`:'CHOOSE YOUR WAGER AND DROP',180,444,9,'#f5d5e7','center');
 if(game.lastResult&&game.flash>0&&!reduced){round(c,83,184,194,43,13,'#39243ff0');label(c,game.lastResult.multiplier>=6?'JACKPOT!':game.lastResult.practice?'PRACTICE':`${game.lastResult.multiplier}X PAYOUT`,180,213,19,'#fff0b5','center');}
}
