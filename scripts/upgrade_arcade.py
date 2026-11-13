"""One-time guarded v1.2 -> Funzone v2 scaffold migration.
Fails before writing when the expected source anchors are absent or ambiguous.
"""
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'src/frontend.js'
s=p.read_text()
def swap(a,b):
 global s
 n=s.count(a)
 if n!=1:raise RuntimeError(f'Expected exactly one anchor (found {n}): {a[:140]!r}')
 s=s.replace(a,b)
swap("import { ArcadeEngine, WORLD, MODE, DEFAULT_SETTINGS, sanitizeSettings, lifecycleTransition } from './engine.js';", "import { ArcadeEngine, WORLD, MODE, DEFAULT_SETTINGS, sanitizeSettings, lifecycleTransition } from './engine.js';\nimport { SnakeGame, Merge2048 } from './puzzles.js';\nimport { drawSnake, drawMerge } from './puzzle-render.js';")
swap("const ICON = '<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 12h12M12 6v12\"/></svg>';", """/** Every HUD icon is a real SVG shape or PNG. No emoji, ASCII pseudo-icons, or icon fonts. */
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
}""")
swap("    'flame_0','flame_1','flame_2','record_flag','best_banner','game_over_banner',", "    'flame_0','flame_1','flame_2','record_flag','best_banner','game_over_banner',\n    'snake_head','snake_snack','merge_tile',")
swap("      else {ctx.fillStyle='#e3d3ed';ctx.font='24px sans-serif';ctx.fillText('♡',x-8,27);}", "      else {ctx.save();ctx.globalAlpha=.22;drawSprite(ctx,images.heart,x,26,24,24);ctx.restore();}")
swap("  if(ready) ctx.fillText('AI FINISHED · KEEP PLAYING ♡',center,hintY);", "  if(ready) ctx.fillText('AI FINISHED · KEEP PLAYING',center,hintY);")
start=s.index('export function setup(ctx) {')
# preserve ui and render functions above entrypoint and replace setup with modular version.
s=s[:start]+r'''/** Spindle frontend; one widget, multiple independent client-side games. */
export function setup(ctx) {
  const storageKey='bird_brain:v1:'+String(ctx?.host?.extensionInstallationId||'local');
  const persisted=safeLoad(storageKey,{});
  const settings=sanitizeSettings(persisted.settings);
  let activeMode=['bird','gabi','snake','2048'].includes(persisted.arcadeGame)?persisted.arcadeGame:settings.mode;
  const bests={};for(const id of ['bird','gabi','snake','2048'])bests[id]=Math.max(0,Math.floor(Number(persisted?.bests?.[id])||0));
  let tickets=Math.max(0,Math.floor(Number(persisted.tickets)||0));
  const images=loadImages();let lifecycle={activeIds:[],ready:false};
  let widget=null,drawer=null,action=null,frame=0,lastTs=0,shown=false,disposed=false;
  let keyHeld=false,pointerStart=null;
  let canvas=null,statusEl=null,footerEl=null,playButton=null,pauseButton=null,soundButton=null,ticketEl=null,highs=null;
  const tabButtons=new Map(),off=[],listeners=[],sound=makeSound(settings);
  const save=()=>safeSave(storageKey,{settings,bests,arcadeGame:activeMode,tickets,puzzles:{snake:snake.snapshot(),merge:merge.snapshot()}});
  function award(id,score){
    const current=Math.max(0,Math.floor(Number(score)||0));
    if(current>bests[id]){
      // Tickets only awarded for new milestones, not repeated retries or undo loops.
      const gain=id==='snake'?Math.floor(current/3)-Math.floor(bests[id]/3):id==='2048'?Math.floor(current/128)-Math.floor(bests[id]/128):0;
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
    if(playButton)setIconLabel(playButton,'play',current.status==='playing'?'RUNNING':current.status==='paused'?'RESUME':current.status==='dead'?'AGAIN':'PLAY');
    if(pauseButton)setIconLabel(pauseButton,current.status==='paused'?'play':'pause',current.status==='paused'?'Resume':'Pause');
    if(soundButton)setIconLabel(soundButton,settings.sound?'volume':'mute',settings.sound?'Sound on':'Sound off');
    if(ticketEl)ticketEl.textContent=String(tickets).padStart(3,'0');
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
    const bar=create('div','bb-controls');
    playButton=button('bb-mainbutton','',play,'Play game');setIconLabel(playButton,'play','PLAY');
    pauseButton=button('bb-mini','',()=>{active().togglePause();save();refresh();},'Pause or resume');setIconLabel(pauseButton,'pause','Pause');
    const resetButton=button('bb-mini','',restart,'Restart game');setIconLabel(resetButton,'restart','Restart');
    soundButton=button('bb-mini','',()=>{settings.sound=!settings.sound;save();refresh();},'Toggle sound');setIconLabel(soundButton,'mute','Sound off');
    const undoButton=button('bb-mini bb-undo','',()=>{if(activeMode==='2048'){merge.undo();save();refresh();}},'Undo 2048 move');setIconLabel(undoButton,'undo','Undo');
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
'''
p.write_text(s)
print('Replaced frontend with unified HUD and puzzles integration')
