/** Bird Brain · Lumiverse Spindle frontend (zero runtime dependencies)
 * Built from source by scripts/build.mjs; images and CSS are embedded into dist.
 */
import { ArcadeEngine, WORLD, MODE, DEFAULT_SETTINGS, sanitizeSettings, lifecycleTransition } from './engine.js';
import { SnakeGame, Merge2048 } from './puzzles.js';
import { drawSnake, drawMerge } from './puzzle-render.js';

const ASSETS = /* BUILD_ASSETS */ {};
const CSS = /* BUILD_CSS */ '';

/** Every HUD icon is a real SVG shape or PNG. No emoji, ASCII pseudo-icons, or icon fonts. */
const ICON_PATHS = Object.freeze({
  close:['M18 6 6 18','m6 6 12 12'],
  play:['M8 5v14l11-7z'],
  pause:['M8 5v14','M16 5v14'],
  restart:['M3 12a9 9 0 1 0 3-6.7','M3 3v6h6'],
  volume:['M11 5 6 9H3v6h3l5 4z','M15.5 8.5a5 5 0 0 1 0 7','M18 5a9 9 0 0 1 0 14'],
  mute:['M11 5 6 9H3v6h3l5 4z','M16 9l5 6','m21 9-5 6'],
  undo:['M9 14 4 9l5-5','M4 9h10a6 6 0 0 1 0 12h-2'],
  settings:['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7','M19.4 15l1.3 2.2-2.5 2.5L16 18.4l-2 .8-.6 2.8h-3l-.6-2.8-2-.8-2.2 1.3-2.5-2.5L4.4 15l-.8-2 .8-2-1.3-2.2L5.6 6.3 7.8 7.6l2-.8.6-2.8h3l.6 2.8 2 .8 2.2-1.3 2.5 2.5L19.4 11l.8 2z'],
  trophy:['M8 4h8v7a4 4 0 0 1-8 0z','M8 6H5v3a3 3 0 0 0 3 3','M16 6h3v3a3 3 0 0 1-3 3','M12 15v5','M8 20h8'],
  arrow:['M5 12h14','m13 6 6 6-6 6'],
});
function svgIcon(name,size=16) {
  const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');
  for(const [k,v] of Object.entries({viewBox:'0 0 24 24',width:String(size),height:String(size),fill:'none',stroke:'currentColor','stroke-width':'2','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(k,v);
  for(const d of ICON_PATHS[name]||ICON_PATHS.play){const path=document.createElementNS(ns,'path');path.setAttribute('d',d);svg.append(path);}
  return svg;
}
function setIconLabel(el,iconName,label) {
  el.replaceChildren(svgIcon(iconName),create('span','',label));
  el.setAttribute('aria-label',label);
}
function setImageLabel(el,assetName,label){
  el.replaceChildren(image(assetName,'bb-tab-art'),create('span','',label));el.setAttribute('aria-label',label);
}
const GRADIENTS = {
  bird: { sky1: '#49b8ed', sky2: '#8ddffd', skyline: '#6ba5d6', floor: '#6baf62', pipe: '#83d862', light: '#d7ff84', edge: '#286b4e', glow: '#f3e678', tint: '#1e4b5f' },
  gabi: { sky1: '#302362', sky2: '#6846a6', skyline: '#42356e', floor: '#353154', pipe: '#552b66', light: '#ff8bab', edge: '#27183c', glow: '#fcaed7', tint: '#fff2fa' },
};

function create(tag, className = '', text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = String(text);
  return el;
}
function button(className, label, action, title = label) {
  const el = create('button', className, label);
  el.type = 'button'; el.title = title;
  el.addEventListener('click', action);
  return el;
}
function image(name, className = '') {
  const img = create('img', className);
  img.src = ASSETS[name] || '';
  img.alt = '';
  img.draggable = false;
  return img;
}
function safeLoad(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
  catch { return fallback; }
}
function safeSave(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode / quota */ }
}
function writeStyle(target) {
  const style = create('style'); style.textContent = CSS; target.appendChild(style);
  return style;
}
function safeDestroy(handle) { try { handle?.destroy?.(); } catch { /* host teardown */ } }

function makeSound(settings) {
  let audio = null;
  return {
    play(kind) {
      if (!settings.sound) return;
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;
        audio ||= new Ctor();
        if (audio.state === 'suspended') void audio.resume();
        const osc = audio.createOscillator(), gain = audio.createGain();
        const t = audio.currentTime, notes = { flap: 420, thrust: 220, score: 780, coin: 990, hit: 180, death: 106, start: 560 };
        osc.type = kind === 'hit' || kind === 'death' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(notes[kind] || 410, t);
        osc.frequency.exponentialRampToValueAtTime(Math.max(80, (notes[kind] || 410) * 0.65), t + 0.12);
        gain.gain.setValueAtTime(0.045, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        osc.connect(gain); gain.connect(audio.destination); osc.start(t); osc.stop(t + 0.14);
      } catch { /* muted system audio is never a gameplay failure */ }
    },
    dispose() { try { void audio?.close?.(); } catch {} audio = null; },
  };
}

function loadImages() {
  const names = [
    ...Array.from({ length: 6 }, (_, i) => `bird_flap_${i}`),
    ...Array.from({ length: 6 }, (_, i) => `gabi_fly_${i}`),
    'bird_dizzy','bird_dead','gabi_hurt','gabi_crash','gabi_dead','cloud','coin','star','heart',
    'flame_0','flame_1','flame_2','record_flag','best_banner','game_over_banner',
    'snake_head','snake_snack',...['apple','berry','star','fish','cookie','candy'].map(k=>`snake_food_${k}`),'merge_tile',
  ];
  const imgs = {};
  for (const name of names) {
    if (!ASSETS[name] || typeof Image === 'undefined') continue;
    try { const img = new Image(); img.src = ASSETS[name]; imgs[name] = img; }
    catch { /* render falls back to drawn mascots */ }
  }
  return imgs;
}

function drawPill(ctx, x, y, w, h, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(12, h/2));
  ctx.fillStyle = color; ctx.fill();
}
function drawSprite(ctx, img, x, y, width, height) {
  if (!img || !img.complete || !img.naturalWidth) return false;
  const scale = Math.min(width/img.naturalWidth, height/img.naturalHeight);
  const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
  ctx.drawImage(img, x - w/2, y - h/2, w, h);
  return true;
}
function paintSky(ctx, mode, age, reduced, images) {
  const c = GRADIENTS[mode], w = WORLD.width, h = WORLD.height;
  const bg = ctx.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,c.sky1); bg.addColorStop(1,c.sky2);
  ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
  if (mode === 'gabi') {
    for(let i=0;i<16;i++) {
      const x = (i*79+19)%w, y=(i*61+35)%300;
      ctx.fillStyle = `rgba(255,231,255,${0.15 + (i%3)*0.11})`;
      ctx.fillRect(x,y, i%4===0 ? 3 : 2,i%4===0 ? 3 : 2);
    }
  }
  const shift = reduced ? 0 : (age*10) % 180;
  ctx.globalAlpha = mode==='gabi'? .27:.5;
  for(let i=-1;i<4;i++) {
    const x = i*158 + 50 - shift, y = 80+((i+3)*67)%175;
    if (!drawSprite(ctx, images.cloud, x,y,86,44)) {
      drawPill(ctx,x-35,y-4,80,21,'#ffffff');
    }
  }
  ctx.globalAlpha = 1;
  const parallax = reduced?0:(age*25)%55;
  ctx.fillStyle=c.skyline;
  for (let i=0;i<12;i++) {
    const x = i*53 - parallax;
    const hh = 38+((i*23+17)%64);
    ctx.fillRect(x, WORLD.floor-hh, 39,hh);
    if (mode==='gabi') {
      ctx.fillStyle = '#fb96d16b';
      for(let wy=WORLD.floor-hh+9;wy<WORLD.floor-7;wy+=13) ctx.fillRect(x+9,wy,5,4);
      ctx.fillStyle=c.skyline;
    }
  }
  ctx.fillStyle = c.floor;
  ctx.fillRect(0,WORLD.floor, w, h-WORLD.floor);
  ctx.fillStyle = mode==='bird'?'#d2f79d':'#f880c8';
  ctx.fillRect(0,WORLD.floor, w, 5);
  if (!reduced) {
    const scroll=(age*50)%32;
    ctx.globalAlpha=.18; ctx.fillStyle=mode==='bird'?'#2d744c':'#e9aaff';
    for(let x=-32;x<w+32;x+=32) ctx.fillRect(x-scroll, WORLD.floor+15, 20,5);
    ctx.globalAlpha=1;
  }
}
function paintPipe(ctx, pipe, color, mode) {
  const x=pipe.x,w=pipe.width, gapTop=pipe.center-pipe.gap/2,gapBottom=pipe.center+pipe.gap/2;
  const sections=[{y:-10,h:gapTop+10, capY:gapTop-19},{y:gapBottom,h:WORLD.floor-gapBottom,capY:gapBottom}];
  for(let i=0;i<2;i++) {
    const p=sections[i]; if (p.h<=0) continue;
    const grad=ctx.createLinearGradient(x,0,x+w,0);
    grad.addColorStop(0,color.edge);grad.addColorStop(.13,color.pipe);grad.addColorStop(.45,color.light);grad.addColorStop(.7,color.pipe);grad.addColorStop(1,color.edge);
    ctx.fillStyle=grad;ctx.strokeStyle=color.edge;ctx.lineWidth=3;
    ctx.fillRect(x,p.y,w,p.h);ctx.strokeRect(x+1.5,p.y,w-3,p.h);
    ctx.fillStyle=color.pipe; ctx.fillRect(x-5,p.capY,w+10,20);
    ctx.strokeStyle=color.edge;ctx.strokeRect(x-5,p.capY,w+10,20);
    ctx.fillStyle=color.light;ctx.globalAlpha=.65;ctx.fillRect(x+3,p.capY+3,6,13);ctx.globalAlpha=1;
    if(mode==='gabi') { ctx.strokeStyle='#ff90d290';ctx.lineWidth=2;ctx.strokeRect(x+1,p.y,w-2,p.h); }
  }
}

/** Gabi's obstacles are actual urban towers, not purple pipes. The lower
 * building's roof is the physical score marker; it carries the saved-best flag.
 * Collision bounds intentionally remain the same simple rectangles as before. */
function paintBuilding(ctx, tower, images) {
  const x=tower.x, w=tower.width;
  const roofTop=tower.center-tower.gap/2;
  const roofBottom=tower.center+tower.gap/2;
  const variant=(tower.number||0)%4;
  const accent=['#ef79b2','#7bd6fc','#ffc978','#bb97ff'][variant];
  function facade(top,bottom,lower) {
    const h=bottom-top;
    if(h<=0)return;
    const body=ctx.createLinearGradient(x,top,x+w,bottom);
    body.addColorStop(0,'#39264f');body.addColorStop(.55,'#241d3e');body.addColorStop(1,'#30234e');
    ctx.fillStyle=body;ctx.fillRect(x,top,w,h);
    ctx.strokeStyle='#181529';ctx.lineWidth=3;ctx.strokeRect(x+1,top,w-2,h);
    ctx.fillStyle='#66517c';ctx.fillRect(x+4,top,3,h);ctx.fillRect(x+w-7,top,3,h);
    const first=lower?top+18:top+15;
    for(let wy=first;wy+8<bottom-9;wy+=24) {
      for(let col=0;col<3;col++) {
        const lit=((Math.floor(wy/24)+col*3+variant*2)%5)!==0;
        ctx.fillStyle=lit?(col===1?'#ffcf91':'#be9cf3'):'#352b53';
        ctx.fillRect(x+9+col*16,wy,9,12);
        ctx.globalAlpha=.45;ctx.fillStyle='#ffffff';
        if(lit)ctx.fillRect(x+11+col*16,wy+2,2,6);
        ctx.globalAlpha=1;
      }
    }
    // Skylines have parapets, warning-light strips and rooftop ledges.
    const ledge=lower?top:bottom-9;
    ctx.fillStyle='#18162c';ctx.fillRect(x-4,ledge,w+8,10);
    ctx.fillStyle=accent;ctx.fillRect(x-4,ledge,w+8,3);
    ctx.fillStyle='#a685b1';ctx.fillRect(x+5,ledge+(lower?9:-6),3,7);
    ctx.fillRect(x+w-8,ledge+(lower?9:-6),3,7);
  }
  facade(0,roofTop,false);
  facade(roofBottom,WORLD.floor,true);
  // The flag belongs to the building where the last PERSONAL BEST was set,
  // not the best that is being updated live on this run.
  if(tower.landmark) {
    drawSprite(ctx,images.record_flag,x+w-13,roofBottom-22,43,48);
  }
}

function paintMascot(ctx, game, images, reduced) {
  const isGabi=game.mode==='gabi';
  const hurt=game.invulnerable>0 && Math.floor(game.age*12)%2===0;
  if (hurt && !reduced) ctx.globalAlpha=.45;
  ctx.save();
  ctx.translate(WORLD.playerX,game.y);
  ctx.rotate(Math.max(-.36,Math.min(.7,game.velocity/850)));
  const frame=reduced?0:Math.floor(game.age*(isGabi?9:12))%6;
  if(isGabi && game.holding && game.status==='playing') {
    const fireFrame=reduced?1:Math.floor(game.age*15)%3;
    // The art already has a small baked-in exhaust. This extra real flame
    // extends the jetpack stream only while thrust is held, and is behind Gabi.
    ctx.globalAlpha=.9;
    drawSprite(ctx,images[`flame_${fireFrame}`],-32,34,30,52);
    ctx.globalAlpha=(hurt && !reduced) ? .45 : 1;
  }
  const name=game.status==='dead' ? (isGabi?'gabi_dead':'bird_dead'):
    (hurt && isGabi?'gabi_hurt':(isGabi?`gabi_fly_${frame}`:`bird_flap_${frame}`));
  const size=isGabi?75:57;
  if(!drawSprite(ctx, images[name], 0,0, size,size)) {
    ctx.fillStyle=isGabi?'#f16176':'#ffd44d';
    ctx.beginPath();ctx.ellipse(0,0,isGabi?21:22,isGabi?23:18,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(8,-5,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1f1843';ctx.beginPath();ctx.arc(10,-5,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f99242';ctx.beginPath();ctx.moveTo(19,0);ctx.lineTo(28,4);ctx.lineTo(17,9);ctx.closePath();ctx.fill();
  }
  ctx.restore();ctx.globalAlpha=1;
}
function paintHud(ctx, game, ready, images, best) {
  const isGabi=game.mode==='gabi';
  drawPill(ctx,11,10,isGabi?112:105,29,'#17122ddb');
  ctx.font='bold 15px ui-monospace, monospace';
  ctx.fillStyle='#ffffff';ctx.textBaseline='middle';
  ctx.fillText('SCORE '+String(game.score).padStart(3,'0'),20,25);
  if(isGabi) {
    drawPill(ctx,126,10,97,29,'#17122de8');
    drawSprite(ctx,images.coin,146,24,21,21);
    // Reapply ink AFTER drawing the coin; it should always be bright white.
    ctx.font='900 16px ui-monospace,monospace';
    ctx.fillStyle='#ffffff';ctx.shadowColor='#100b25';ctx.shadowBlur=4;
    ctx.fillText('×'+String(game.coins).padStart(2,'0'),163,25);
    ctx.shadowBlur=0;
  }
  // Current best belongs in the HUD too, but the in-world flag stays anchored
  // to the PREVIOUS best, as it was at the beginning of this run.
  drawPill(ctx,11,45,117,25,'#1b1739db');
  drawSprite(ctx,images.record_flag,23,57,18,24);
  ctx.fillStyle='#ffffff';ctx.font='800 12px ui-monospace,monospace';
  ctx.fillText('BEST '+String(best).padStart(3,'0'),36,58);
  if (ready) {
    drawPill(ctx,197,44,151,23,'#f6bde9e6');
    ctx.font='bold 11px ui-sans-serif,sans-serif';ctx.fillStyle='#391b4d';ctx.textAlign='center';
    ctx.fillText('RESPONSE READY!',272,56);ctx.textAlign='start';
  }
  if(isGabi) {
    for(let n=0;n<3;n++) {
      const x=274+n*27;
      if(n<game.health) drawSprite(ctx,images.heart,x,26,24,24);
      else {ctx.save();ctx.globalAlpha=.22;drawSprite(ctx,images.heart,x,26,24,24);ctx.restore();}
    }
  }
  // Play an actual NEW BEST graphic for 3 seconds, once per run.
  if(game.status==='playing' && game.newBestFlash>0) {
    const pulse=1 + (Math.sin(game.age*12)+1)*.045;
    drawSprite(ctx,images.best_banner,180,112,193*pulse,80*pulse);
  }
}
function paintOverlay(ctx, game, ready, best, generationActive, images) {
  if(game.status==='playing') return;
  ctx.fillStyle='#0e1027ad';ctx.fillRect(0,80,WORLD.width,WORLD.floor-120);
  const center=WORLD.width/2;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.shadowColor='#171332';ctx.shadowBlur=5;
  ctx.fillStyle='#fff6eb';ctx.font='900 26px ui-sans-serif, sans-serif';
  const died=game.status==='dead';
  const recordLayout=died && game.newBest;
  if(died) {
    // Distinct non-overlapping banner lanes, even when both assets are shown.
    if(recordLayout) drawSprite(ctx,images.best_banner,center,115,165,62);
    if(!drawSprite(ctx,images.game_over_banner,center,recordLayout?192:178,210,76)) {
      ctx.fillText('GAME OVER!',center,recordLayout?192:178);
    }
  } else {
    ctx.fillText(game.status==='paused'?'PAUSED':'BIRD BRAIN',center,185);
  }
  ctx.shadowBlur=0;
  ctx.font='600 13px ui-sans-serif, sans-serif';ctx.fillStyle='#e8d9ff';
  const line=died ? `Score ${game.score} · Best ${best}` : game.status==='paused' ? 'Your chaos is on hold' :
    game.mode==='gabi'?'Hold to fire the jetpack':'Tap to flap. Regret everything.';
  ctx.fillText(line,center,recordLayout?249:219);
  if(died && game.mode==='gabi') ctx.fillText(`Coins collected: ${game.coins}`,center,recordLayout?269:242);
  const buttonY=recordLayout?296:265;
  drawPill(ctx,center-105,buttonY,210,38,game.mode==='gabi'?'#eb5d95':'#ffd15a');
  ctx.fillStyle='#24172e';ctx.font='800 15px ui-sans-serif,sans-serif';
  ctx.fillText(game.status==='paused'?'RESUME':'TAP TO PLAY',center,buttonY+19);
  ctx.font='600 11px ui-sans-serif,sans-serif';ctx.fillStyle='#e6d0ee';
  const hintY=recordLayout?366:337;
  if(ready) ctx.fillText('AI FINISHED · KEEP PLAYING',center,hintY);
  else if(generationActive) ctx.fillText('AI THINKING · YOU ARE NOT',center,hintY);
  ctx.textAlign='start';
}
export function drawFrame(canvas, game, images, opts, state, best) {
  if(!canvas || !canvas.getContext) return;
  const ctx=canvas.getContext('2d'); if(!ctx) return;
  ctx.setTransform(canvas.width/WORLD.width,0,0,canvas.height/WORLD.height,0,0);
  ctx.clearRect(0,0,WORLD.width,WORLD.height);
  paintSky(ctx,game.mode,game.age,opts.reduceMotion,images);
  for(const pipe of game.pipes) {
    if(game.mode==='gabi')paintBuilding(ctx,pipe,images);
    else paintPipe(ctx,pipe,GRADIENTS.bird,'bird');
    if(game.mode==='gabi' && !pipe.coinTaken) drawSprite(ctx,images.coin,pipe.x+pipe.width/2,pipe.center,24,24);
  }
  paintMascot(ctx,game,images,opts.reduceMotion);
  paintHud(ctx,game,state.ready,images,best);
  paintOverlay(ctx,game,state.ready,best,state.activeIds.length>0,images);
}

/** Spindle frontend entry. Return teardown; no backend worker or generation privilege. */
/** Spindle frontend; one widget, multiple independent client-side games. */
export function setup(ctx) {
  const storageKey='bird_brain:v1:'+String(ctx?.host?.extensionInstallationId||'local');
  const persisted=safeLoad(storageKey,{});
  const settings=sanitizeSettings(persisted.settings);
  let activeMode=['bird','gabi','snake','2048'].includes(persisted.arcadeGame)?persisted.arcadeGame:settings.mode;
  const bests={};for(const id of ['bird','gabi','snake','2048'])bests[id]=Math.max(0,Math.floor(Number(persisted?.bests?.[id])||0));
  let tickets=Number.isSafeInteger(persisted.tickets)?Math.max(0,Math.min(100000000,persisted.tickets)):0;
  const images=loadImages();let lifecycle={activeIds:[],ready:false};
  let widget=null,drawer=null,action=null,frame=0,lastTs=0,shown=false,disposed=false;
  let keyHeld=false,pointerStart=null;
  let canvas=null,statusEl=null,footerEl=null,playButton=null,pauseButton=null,soundButton=null,ticketEl=null,highs=null,controlsEl=null,undoButton=null;
  const tabButtons=new Map(),off=[],listeners=[],sound=makeSound(settings);
  const save=()=>safeSave(storageKey,{settings,bests,arcadeGame:activeMode,tickets,puzzles:{snake:snake.snapshot(),merge:merge.snapshot()}});
  function award(id,score){
    const current=Math.max(0,Math.floor(Number(score)||0));
    if(current>bests[id]){
      // Tickets only awarded for new milestones, not repeated retries or undo loops.
      const gain=id==='snake'?Math.floor(current/3)-Math.floor(bests[id]/3):id==='2048'?Math.floor(current/128)-Math.floor(bests[id]/128):Math.floor(current/5)-Math.floor(bests[id]/5);
      tickets+=Math.max(0,Math.min(99,gain));bests[id]=current;
    }
    save();
  }
  const game=new ArcadeEngine({mode:settings.mode,difficulty:settings.difficulty,recordTarget:bests[settings.mode],onEvent:(event)=>{
    if(['flap','thrust','score','coin','hit','death','start','new_best'].includes(event))sound.play(event==='new_best'?'score':event);
    if(event==='score'||event==='death')award(game.mode,game.score);
    refresh();
  }});
  const snake=new SnakeGame({saved:persisted?.puzzles?.snake,onEvent:(event)=>{
    if(event==='score'||event==='death')award('snake',snake.score);
    if(event==='death')sound.play('death');else if(event==='score')sound.play('coin');
    refresh();
  }});
  const merge=new Merge2048({saved:persisted?.puzzles?.merge,onEvent:(event)=>{
    if(event==='score'||event==='death'||event==='move'||event==='undo')award('2048',merge.score);
    if(event==='score')sound.play('score');
    refresh();
  }});
  const bind=(el,event,fn,options)=>{el.addEventListener(event,fn,options);listeners.push(()=>el.removeEventListener(event,fn,options));};
  const active=()=>activeMode==='snake'?snake:activeMode==='2048'?merge:game;
  function refresh(){
    if(!statusEl)return;
    statusEl.textContent=lifecycle.activeIds.length?'AI THINKING':lifecycle.ready?'RESPONSE READY':'ARCADE READY';
    statusEl.dataset.state=lifecycle.activeIds.length?'thinking':lifecycle.ready?'ready':'idle';
    const current=active();
    if(footerEl)footerEl.textContent=activeMode==='snake'?'SNAKE: ARROWS / WASD / SWIPE  ·  GROW OR GO HOME':activeMode==='2048'?'2048: SWIPE / ARROWS  ·  UNDO AVAILABLE':game.status==='playing'?(game.mode==='gabi'?'HOLD SPACE / PRESS TO THRUST':'TAP / SPACE TO FLAP'):`BEST ${String(bests[game.mode]).padStart(3,'0')} · ${game.mode==='gabi'?'3 HEARTS':'ONE BAD DECISION'}`;
    if(playButton){setIconLabel(playButton,'play',current.status==='playing'?'RUNNING':current.status==='paused'?'RESUME':current.status==='dead'?'AGAIN':'PLAY');playButton.disabled=current.status==='playing';}
    if(pauseButton)setIconLabel(pauseButton,current.status==='paused'?'play':'pause',current.status==='paused'?'Resume':'Pause');
    if(soundButton)setIconLabel(soundButton,settings.sound?'volume':'mute',settings.sound?'Sound on':'Sound off');
    if(ticketEl)ticketEl.textContent=String(tickets).padStart(3,'0');
    if(undoButton)undoButton.hidden=activeMode!=='2048';
    if(controlsEl)controlsEl.classList.toggle('bb-merge',activeMode==='2048');
    for(const [mode,btn] of tabButtons)btn.classList.toggle('selected',mode===activeMode);
    if(highs)highs.textContent=`BIRD ${bests.bird}   ·   GABI ${bests.gabi}   ·   SNAKE ${bests.snake}   ·   2048 ${bests['2048']}`;
  }
  function tick(now){
    frame=0;if(!shown||disposed)return;
    const dt=lastTs?Math.max(0,Math.min(.12,(now-lastTs)/1000)):0;lastTs=now;
    if(activeMode==='snake'){snake.update(dt);drawSnake(canvas,snake,images,{ready:lifecycle.ready,best:bests.snake});}
    else if(activeMode==='2048')drawMerge(canvas,merge,{ready:lifecycle.ready,best:bests['2048']});
    else{game.update(dt);drawFrame(canvas,game,images,settings,lifecycle,bests[game.mode]);}
    frame=requestAnimationFrame(tick);
  }
  function startRaf(){if(frame||!shown||disposed)return;lastTs=0;frame=requestAnimationFrame(tick);}
  function stopRaf(){if(frame)cancelAnimationFrame(frame);frame=0;lastTs=0;}
  function show(){if(disposed||!widget)return;shown=true;widget.setVisible(true);refresh();startRaf();}
  function hide(){if(!shown)return;shown=false;active().pause();if(activeMode==='bird'||activeMode==='gabi')game.release();stopRaf();save();widget?.setVisible(false);refresh();}
  function switchMode(mode,launch=false){
    if(!['bird','gabi','snake','2048'].includes(mode))return;
    if(activeMode!==mode)active().pause();
    activeMode=mode;
    if(mode==='bird'||mode==='gabi'){
      // Do not reset an existing bird/Gabi run just because the player opens another tab.
      if(game.mode!==mode){settings.mode=mode;game.reset(mode,settings.difficulty,bests[mode]);}
    }
    save();if(launch){show();active().start();canvas?.focus?.({preventScroll:true});}refresh();
  }
  function openMode(mode){switchMode(mode,true);}
  function play(){const g=active();if(g.status==='playing')return;if(g.status==='dead')g.reset(g.mode||undefined,settings.difficulty,bests[activeMode]);g.start();refresh();canvas?.focus?.({preventScroll:true});save();}
  function restart(){const g=active();if(activeMode==='bird'||activeMode==='gabi')g.reset(game.mode,settings.difficulty,bests[game.mode]);else g.reset();save();refresh();}
  function pointerDown(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();canvas?.focus?.({preventScroll:true});pointerStart={x:e.clientX??0,y:e.clientY??0};
    if(activeMode==='bird'||activeMode==='gabi'){
      if(game.status==='dead')game.reset(game.mode,settings.difficulty,bests[game.mode]);
      if(game.status==='paused')game.start();game.press();
    }else if(activeMode==='snake'&&snake.status==='idle')snake.start();
    try{canvas?.setPointerCapture?.(e.pointerId);}catch{}refresh();
  }
  function pointerUp(e){
    if(activeMode==='bird'||activeMode==='gabi')game.release();
    else if(pointerStart){
      const dx=(e.clientX??0)-pointerStart.x,dy=(e.clientY??0)-pointerStart.y;
      if(Math.max(Math.abs(dx),Math.abs(dy))>18){const dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');if(activeMode==='snake')snake.setDirection(dir);else if(merge.move(dir))save();}
    }
    pointerStart=null;
    try{if(canvas?.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);}catch{}
    refresh();
  }
  function onKeyDown(e){
    if(e.target!==canvas)return;
    if(e.target instanceof HTMLElement&&(e.target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)))return;
    const dirs={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
    if(activeMode==='snake'||activeMode==='2048'){
      if(dirs[e.code]){e.preventDefault();e.stopPropagation();if(activeMode==='snake')snake.setDirection(dirs[e.code]);else if(merge.move(dirs[e.code]))save();refresh();return;}
      if(e.code==='Space'){e.preventDefault();active().togglePause();refresh();return;}
      if(activeMode==='2048'&&(e.code==='KeyZ'||e.code==='Backspace')){e.preventDefault();merge.undo();save();refresh();}
      return;
    }
    if(e.code!=='Space'&&e.code!=='ArrowUp')return;
    if(e.repeat&&(keyHeld||game.mode==='bird')){e.preventDefault();return;}
    e.preventDefault();e.stopPropagation();if(game.status==='dead')game.reset(game.mode,settings.difficulty,bests[game.mode]);
    if(!keyHeld||game.mode==='gabi')game.press();keyHeld=true;refresh();
  }
  function onKeyUp(e){
    if(activeMode==='snake'||activeMode==='2048'||(e.code!=='Space'&&e.code!=='ArrowUp')||e.target!==canvas)return;
    e.preventDefault();e.stopPropagation();keyHeld=false;game.release();
  }
  try{
    widget=ctx.ui.createFloatWidget({width:382,height:635,chromeless:true,resizable:true,snapToEdge:true,
      persistGeometry:'bird_brain_arcade_v1',mobileClamp:true,touchScrollMode:'native',tooltip:'Fuckass Funzone Arcade',
      bounds:{minWidth:292,minHeight:350,maxWidth:660,maxHeight:850}});
    widget.setVisible(false);writeStyle(widget.root);
    const root=create('div','bb bb-float');
    const header=create('div','bb-header');
    const logo=image('funzone_logo','bb-brand');logo.alt='Fuckass Funzone — Arcade Intermission';
    header.append(logo);
    statusEl=create('span','bb-status','ARCADE READY');statusEl.setAttribute('aria-live','polite');
    header.append(statusEl);
    const close=button('bb-iconbutton bb-close','',hide,'Minimize arcade');setIconLabel(close,'close','Close');header.append(close);
    root.append(header);
    const ticker=create('div','bb-ticker');ticker.append(image('coin','bb-currency-icon'),create('span','bb-ticket-label','ARCADE TICKETS'));
    ticketEl=create('strong','bb-ticket-count','000');ticker.append(ticketEl);root.append(ticker);
    const tabs=create('div','bb-tabs');
    for(const [id,label,art] of [['bird','BIRD','bird_flap_0'],['gabi','JETPACK','gabi_fly_0'],['snake','SNAKE','snake_head'],['2048','2048','merge_tile']]){
      const btn=button('bb-mode','',()=>switchMode(id),`Play ${label}`);
      setImageLabel(btn,art,label);tabButtons.set(id,btn);tabs.append(btn);
    }
    root.append(tabs);
    canvas=create('canvas','bb-canvas');canvas.width=720;canvas.height=904;canvas.tabIndex=0;
    canvas.setAttribute('role','button');canvas.setAttribute('aria-label','Funzone game playfield. Use arrow keys or swipe for puzzles; tap or hold for flight games.');
    root.append(canvas);
    const bar=create('div','bb-controls');controlsEl=bar;
    playButton=button('bb-mainbutton','',play,'Play game');setIconLabel(playButton,'play','PLAY');
    pauseButton=button('bb-mini','',()=>{active().togglePause();save();refresh();},'Pause or resume');setIconLabel(pauseButton,'pause','Pause');
    const resetButton=button('bb-mini','',restart,'Restart game');setIconLabel(resetButton,'restart','Restart');
    soundButton=button('bb-mini','',()=>{settings.sound=!settings.sound;save();refresh();},'Toggle sound');setIconLabel(soundButton,'mute','Sound off');
    undoButton=button('bb-mini bb-undo','',()=>{if(activeMode==='2048'){merge.undo();save();refresh();}},'Undo 2048 move');setIconLabel(undoButton,'undo','Undo');
    bar.append(playButton,pauseButton,resetButton,soundButton,undoButton);root.append(bar);
    footerEl=create('div','bb-footer');root.append(footerEl);
    widget.root.append(root);
    bind(canvas,'pointerdown',pointerDown);bind(canvas,'pointerup',pointerUp);bind(canvas,'pointercancel',pointerUp);
    bind(root,'keydown',onKeyDown);bind(root,'keyup',onKeyUp);
    bind(window,'blur',()=>{keyHeld=false;game.release();active().pause();save();refresh();});
    bind(document,'visibilitychange',()=>{if(document.hidden){keyHeld=false;game.release();active().pause();save();refresh();}});
    bind(canvas,'contextmenu',e=>e.preventDefault());
    drawer=ctx.ui.registerDrawerTab({id:'bird_brain',title:'Fuckass Funzone',shortName:'Funzone',description:'The arcade inside your model wait time',
      keywords:['arcade','bird','gabi','jetpack','snake','2048','funzone','waiting','thinking']});
    writeStyle(drawer.root);
    const panel=create('section','bb bb-drawer');
    const banner=image('funzone_logo','bb-drawer-logo');banner.alt='Fuckass Funzone Arcade';panel.append(banner);
    const hero=image('cover','bb-cover');hero.alt='Gabi in the neon jetpack arcade';panel.append(hero);
    const h=create('div','bb-intro');h.append(create('h2','', 'FUCKASS FUNZONE'),create('p','', 'Your model is thinking. Your arcade is open.'));panel.append(h);
    const launches=create('div','bb-launches bb-launches-grid');
    for(const [id,label,art] of [['bird','Fuckass Bird','bird_flap_0'],['gabi','Gabi Jetpack','gabi_fly_0'],['snake','Snake','snake_head'],['2048','2048','merge_tile']]){
      const b=button('bb-launch','',()=>openMode(id),`Open ${label}`);setImageLabel(b,art,label);launches.append(b);
    }
    panel.append(launches);
    const upcoming=create('div','bb-upcoming');upcoming.append(create('span','','MATCH-3  ·  COMING SOON'),create('span','','PLINKO  ·  COMING SOON'));panel.append(upcoming);
    const note=create('p','bb-help','Bird: tap to flap. Gabi: hold to thrust. Snake: swipe or use arrows/WASD. 2048: swipe or arrows to merge, Z to undo. Each game keeps its own progress; generating a reply never cancels a run.');panel.append(note);
    panel.append(create('h3','bb-section','ARCADE CONFIG'));
    const fields=create('div','bb-fields');
    function toggle(label,key,help){const line=create('label','bb-setting'),info=create('span','bb-setting-label');
      info.append(create('strong','',label),create('small','',help));const input=create('input');input.type='checkbox';input.checked=!!settings[key];
      bind(input,'change',()=>{settings[key]=input.checked;save();refresh();});line.append(info,input);fields.append(line);}
    toggle('Open on generation','autoOpen','Auto-show the arcade when a reply starts.');
    toggle('Sound effects','sound','Muted by default.');
    toggle('Reduced motion','reduceMotion','Disable decorative flight animations.');
    toggle('Auto-hide when idle','autoHideIdle','Only when generation stops and you are not in a run.');
    const diffRow=create('label','bb-setting');const diffLabel=create('span','bb-setting-label');
    diffLabel.append(create('strong','','Flight difficulty'),create('small','','Speed and obstacle gap'));diffRow.append(diffLabel);
    const select=create('select','bb-select');
    for(const [v,label] of [['chill','Chill'],['normal','Normal'],['chaos','Absolute chaos']]){const o=create('option');o.value=v;o.textContent=label;select.append(o);}
    select.value=settings.difficulty;bind(select,'change',()=>{settings.difficulty=select.value;game.reset(settings.mode,settings.difficulty,bests[settings.mode]);save();refresh();});
    diffRow.append(select);fields.append(diffRow);panel.append(fields);
    panel.append(create('h3','bb-section','PERSONAL BESTS'));
    highs=create('div','bb-bests');panel.append(highs);
    panel.append(button('bb-quiet','Clear high scores',()=>{
      for(const id of Object.keys(bests))bests[id]=0;
      if(game.status!=='playing')game.reset(game.mode,settings.difficulty,0);
      save();refresh();
    }));
    drawer.root.append(panel);
    try{action=ctx.ui.registerInputBarAction({id:'bird_brain_launch',label:'Fuckass Funzone',subtitle:'Arcade intermission',iconName:'gamepad-2',tooltip:'Open Fuckass Funzone'});
      off.push(action.onClick(()=>{show();canvas.focus({preventScroll:true});}));}
    catch(err){console.info('[Fuckass Funzone] Chat bar action not available:',err);}
    for(const [event,type] of [['GENERATION_STARTED','start'],['GENERATION_ENDED','end'],['GENERATION_STOPPED','stop']]){
      off.push(ctx.events.on(event,payload=>{
        if(disposed)return;const id=payload?.generationId||payload?.generation_id||'unknown';const prev=lifecycle;
        lifecycle=lifecycleTransition(lifecycle,type,id);
        if(type==='start'&&settings.autoOpen&&!shown&&!prev.activeIds.includes(id))show();
        if((type==='end'||type==='stop')&&settings.autoHideIdle&&active().status!=='playing'&&active().status!=='paused'&&shown)hide();
        refresh();
      }));
    }
    refresh();
    return function teardown(){if(disposed)return;disposed=true;stopRaf();game.release();save();sound.dispose();
      for(const fn of [...off,...listeners])try{fn();}catch{};
      safeDestroy(action);safeDestroy(drawer);safeDestroy(widget);canvas=null;statusEl=null;footerEl=null;};
  }catch(err){disposed=true;stopRaf();sound.dispose();for(const fn of [...off,...listeners])try{fn();}catch{};
    safeDestroy(action);safeDestroy(drawer);safeDestroy(widget);throw err;}
}
