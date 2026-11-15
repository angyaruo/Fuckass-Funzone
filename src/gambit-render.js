/** Familiar poker-table hierarchy, original card art, and shared input geometry. */
import { GAMBIT_JOKERS, GAMBIT_HANDS } from './gambit-rules.js';
import { GAMBIT_SUIT_COLORS, drawGambitCard, drawGambitJoker, drawGambitDeck, drawGambitPack } from './gambit-art.js';

const C = { ink:'#fff8e7', muted:'#bad3c9', gold:'#f6d97a', blue:'#139bea', red:'#ee5149', dark:'#243740', green:'#23634f', future:'#789c90' };
const jokerBy = id => GAMBIT_JOKERS.find(item => item.id === id);
const handBy = id => GAMBIT_HANDS.find(item => item.id === id);
const number = n => Math.floor(Number(n)||0).toLocaleString('en-US');
const cardName = id => (({1:'Ace',11:'Jack',12:'Queen',13:'King'})[id%13+1] || id%13+1)+' of '+['Clubs','Diamonds','Spades','Hearts'][Math.floor(id/13)];
const region = (kind,x,y,w,h,label,extra={}) => ({kind,x,y,w,h,label,enabled:true,...extra});
const ownedOffer = (game,offer) => offer.kind==='joker'&&game.jokers.includes(offer.id);
function optionCopy(option,game){
  if(option.kind==='joker'){const item=jokerBy(option.id);return {title:item?.name||'Joker',detail:item?.description||'',tag:item?.rarity||'Joker'};}
  if(option.kind==='hand')return {title:(handBy(option.id)?.name||option.id)+' upgrade',detail:'Add 15 base chips and 1 base Mult to this hand for the run.',tag:'LEVEL '+((game.handLevels[option.id]||0)+1)+' TO '+((game.handLevels[option.id]||0)+2)};
  return {title:cardName(option.id),detail:'This exact card gains 10 chips whenever it scores. The boost lasts for the run.',tag:'CARD ENHANCEMENT'};
}
function offerName(offer){return offer.kind==='joker'?jokerBy(offer.id)?.name||'Joker':offer.pack==='joker'?'Joker Pack':'Upgrade Pack';}
function offerDetail(offer){return offer.kind==='joker'?jokerBy(offer.id)?.description||'':offer.pack==='joker'?'Reveal three different Jokers and choose one.':'Choose a hand-level upgrade or an enhancement for one playing card.';}
function offerLabel(game,offer){return (offer.sold?'Sold. ':ownedOffer(game,offer)?'Already equipped. ':game.money<offer.price?'Not enough run coins. ':'')+'Buy '+offerName(offer)+' for '+offer.price+' run coins. '+offerDetail(offer);}
function handGeometry(game){
  const n=game.hand.length,step=n>1?192/(n-1):0;
  return game.hand.map((id,index)=>{const offset=index-(n-1)/2,y=302+Math.abs(offset)*2-(game.selected.includes(id)?18:0),x=n===1?207:111+index*step;
    return {id,index,x,y,w:46,h:68,tilt:offset*.015,hitX:x+(index<n-1?Math.min(step*.4,18):23),hitY:y+19};});
}
function shopGeometry(index){const col=index%2,row=Math.floor(index/2);return {x:113+col*121,y:row===0?160:282,w:108,h:row===0?92:73,buyY:row===0?257:360};}

/** The action list is paint order; overlapping hand cards receive taps from the top down. */
export function gambitActions(game,{inspection=null}={}){
  if(game.status!=='playing')return [];
  if(inspection){
    const index=typeof inspection==='string'?game.jokers.indexOf(inspection):-1;
    const offer=typeof inspection==='object'&&Number.isInteger(inspection.offer)?game.shop[inspection.offer]:null;
    const secondary=offer?'buy':game.phase==='shop'&&index>=0?'sell':null;
    return [region('close',109,390,secondary?144:238,48,'BACK TO TABLE'),...(secondary?[region(secondary,261,390,86,48,offer?offerLabel(game,offer):'Sell '+jokerBy(inspection)?.name+' for 2 run coins',{displayLabel:offer?'BUY $'+offer.price:'SELL +$2',index:offer?inspection.offer:index,enabled:!offer||(!offer.sold&&!ownedOffer(game,offer)&&game.money>=offer.price)})]:[])];
  }
  const info=region('info',12,402,82,35,'RUN INFO');
  if(game.phase==='pack')return [info,...(game.pack?.options||[]).map((option,index)=>{const copy=optionCopy(option,game);return region('packOption',111+index*80,111,72,111,(game.pack.selected===index?'Selected: ':'Inspect ')+copy.title+'. '+copy.detail,{index});}),region('claim',109,390,150,48,'CHOOSE CARD',{enabled:Number.isInteger(game.pack?.selected)}),region('skip',269,390,78,48,'SKIP')];
  if(game.phase==='replace')return [info,...game.jokers.map((id,index)=>region('replace',111+index*80,255,72,102,'Replace '+jokerBy(id)?.name+' with '+jokerBy(game.pendingJoker)?.name,{id,index})),region('skip',109,390,238,48,'KEEP CURRENT JOKERS')];
  const jokers=game.jokers.map((id,index)=>region('joker',113+index*78,27,66,92,'Inspect '+jokerBy(id)?.name+'. '+jokerBy(id)?.description,{id,index}));
  if(game.phase==='shop')return [info,...jokers,...game.shop.flatMap((offer,index)=>{const g=shopGeometry(index);return [region('offer',g.x,g.y,g.w,g.h,'Inspect '+offerName(offer)+'. '+offerDetail(offer),{index}),region('buy',g.x,g.buyY,g.w,22,offerLabel(game,offer),{displayLabel:offer.sold?'SOLD':ownedOffer(game,offer)?'OWNED':'BUY $'+offer.price,index,enabled:!offer.sold&&!ownedOffer(game,offer)&&game.money>=offer.price})];}),region('next',109,412,238,26,'NEXT ROUND')];
  if(game.phase==='score')return [info,...jokers,region('continue',109,390,238,48,'CONTINUE')];
  if(game.phase!=='play')return [info];
  return [info,...jokers,region('deck',305,221,40,61,'Inspect remaining deck'),...handGeometry(game).map(g=>region('card',g.x,g.y,g.w,g.h,cardName(g.id)+', '+(game.selected.includes(g.id)?'selected':'unselected')+(game.cardBoosts[g.id]?'. Bonus '+game.cardBoosts[g.id]+' chips when scoring.':''),g)),region('play',109,390,76,48,'PLAY HAND',{enabled:game.selected.length>0&&game.playsLeft>0}),region('sort',193,390,68,22,'SORT RANK',{mode:'rank'}),region('sort',193,416,68,22,'SORT SUIT',{mode:'suit'}),region('discard',269,390,78,48,'DISCARD',{enabled:game.selected.length>0&&game.discardsLeft>0&&game.deck.length>0})];
}
export function gambitHitAt(x,y,game,view={}){
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  return [...gambitActions(game,view)].reverse().find(a=>a.enabled&&x>=a.x&&x<a.x+a.w&&y>=a.y&&y<a.y+a.h)||null;
}
function box(ctx,x,y,w,h,fill,stroke=null,r=4){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function text(ctx,value,x,y,size=11,color=C.ink,align='left',maxWidth=null){ctx.font=`900 ${size}px ui-monospace,Consolas,monospace`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=color;if(maxWidth)ctx.fillText(String(value),x,y,maxWidth);else ctx.fillText(String(value),x,y);}
function wrap(ctx,value,x,y,width,size=10,color=C.ink,maxLines=4,lineHeight=size+4){
  ctx.font=`800 ${size}px ui-monospace,Consolas,monospace`;
  const measure=s=>ctx.measureText?ctx.measureText(s).width:s.length*size*.6;
  const lines=[];let line='';for(const word of String(value).split(/\s+/)){const next=line?line+' '+word:word;if(line&&measure(next)>width){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
  lines.slice(0,maxLines).forEach((part,i)=>{if(i===maxLines-1&&lines.length>maxLines){while(part&&measure(part+'...')>width)part=part.slice(0,-1);part+='...';}text(ctx,part,x,y+i*lineHeight,size,color,'left',width);});
}
function button(ctx,a,focused=false){
  const fill=a.kind==='play'||a.kind==='continue'||a.kind==='next'||a.kind==='claim'||a.kind==='buy'?C.blue:a.kind==='discard'||a.kind==='sell'?C.red:'#db8b18';
  box(ctx,a.x,a.y+3,a.w,a.h,a.enabled?'#132a2c':'#223c37',null,5);
  box(ctx,a.x,a.y,a.w,a.h-1,a.enabled?fill:'#466057',focused?'#fff4ac':'#ffffff42',5);
  const label=(a.displayLabel||a.label).replace('SORT ','');
  if(label==='PLAY HAND') {text(ctx,'Play',a.x+a.w/2,a.y+20,12,a.enabled?C.ink:'#9eb3a7','center');text(ctx,'Hand',a.x+a.w/2,a.y+34,12,a.enabled?C.ink:'#9eb3a7','center');}
  else text(ctx,label,a.x+a.w/2,a.y+a.h/2+4,a.h<28?9:10,a.enabled?C.ink:'#9eb3a7','center',a.w-8);
}
function background(ctx){
  ctx.fillStyle='#1b5848';ctx.fillRect(0,0,360,452);
  ctx.save();ctx.strokeStyle='#83b79210';ctx.lineWidth=22;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(103+i*58,-15);ctx.bezierCurveTo(230-i*13,99,100+i*40,250,375-i*26,465);ctx.stroke();}
  ctx.restore();box(ctx,5,5,96,442,'#293d42','#0e2628',5);box(ctx,105,5,250,442,'#205d4b00','#90b69735',5);
}
function reportFor(game){return game.phase==='score'?game.lastResult:game.phase==='play'?game.preview():null;}
function rail(ctx,game,best){
  box(ctx,11,12,84,23,game.phase==='shop'?'#c65f32':'#167cb4','#9bbcab66');text(ctx,game.phase==='shop'?'THE SHOP':'ROUND '+game.round,53,28,11,C.ink,'center',78);
  box(ctx,11,41,84,79,'#173741','#48666b');text(ctx,'Score at least',53,56,8,C.ink,'center');
  ctx.beginPath();ctx.arc(53,80,15,0,Math.PI*2);ctx.fillStyle='#166e91';ctx.fill();ctx.strokeStyle='#93cbd1';ctx.lineWidth=2;ctx.stroke();text(ctx,'G',53,86,18,C.ink,'center');
  text(ctx,number(game.target),53,113,15,'#ff7465','center',78);
  box(ctx,11,128,84,54,'#1a2b30','#587275');text(ctx,'Round score',53,141,9,C.ink,'center');text(ctx,number(game.roundScore),53,169,22,C.ink,'center',78);
  const report=reportFor(game),level=report?(game.handLevels[report.id]||0)+1:1;
  box(ctx,11,190,84,105,'#1c2e31','#52676b');
  wrap(ctx,report?.name||'Select cards',17,207,73,11,C.ink,2,13);text(ctx,report?'lvl.'+level:'1 to 5 cards',53,235,8,C.muted,'center');
  box(ctx,14,245,35,33,C.blue);box(ctx,58,245,34,33,C.red);
  text(ctx,number(report?.chips||0),31.5,268,17,C.ink,'center',31);text(ctx,'X',53,267,11,C.ink,'center');text(ctx,report?Number(report.mult.toFixed(2)):0,75,268,17,C.ink,'center',29);
  text(ctx,'CHIPS',31,289,6.5,C.muted,'center');text(ctx,'MULT',75,289,6.5,C.muted,'center');
  box(ctx,11,304,40,47,'#1a2e32','#526a6d');box(ctx,55,304,40,47,'#1a2e32','#526a6d');
  text(ctx,'Hands',31,317,8,C.ink,'center');text(ctx,'Discards',75,317,7,C.ink,'center');text(ctx,game.playsLeft,31,343,24,C.blue,'center');text(ctx,game.discardsLeft,75,343,24,C.red,'center');
  box(ctx,11,360,84,33,'#1a2b30','#526a6d');text(ctx,'$'+game.money,53,384,22,'#ffc963','center',76);
  text(ctx,'RUN '+number(game.score),53,448,6.5,C.muted,'center',88);
}
function jokers(ctx,game){
  for(let i=0;i<3;i++){const x=113+i*78,id=game.jokers[i];if(id)drawGambitJoker(ctx,id,x,27,66,92);else{box(ctx,x,27,66,92,'#0c342f70','#83a18b55',5);text(ctx,'JOKER',x+33,73,9,'#89ac98','center');}}
  text(ctx,game.jokers.length+'/3',114,134,9,C.ink);text(ctx,'GABU\'S GAMBIT',345,18,8,C.ink,'right',231);
}
function optionArt(ctx,option,game,x,y,w,h,selected=false){
  if(option.kind==='joker')drawGambitJoker(ctx,option.id,x,y,w,h,{selected});
  else if(option.kind==='card')drawGambitCard(ctx,option.id,x,y,w,h,{selected,boost:Math.min(30,(game.cardBoosts[option.id]||0)+10)});
  else {box(ctx,x+2,y+4,w,h,'#123c35');box(ctx,x,y,w,h,'#d9ecf2',selected?C.gold:'#7196c8',5);box(ctx,x+5,y+5,w-10,h-10,'#486dae');text(ctx,'LEVEL',x+w/2,y+20,10,C.ink,'center',w-10);ctx.beginPath();ctx.arc(x+w/2,y+h*.52,w*.24,0,Math.PI*2);ctx.fillStyle='#f4cc69';ctx.fill();text(ctx,'+1',x+w/2,y+h*.52+5,14,'#263c65','center');wrap(ctx,handBy(option.id)?.name||option.id,x+6,y+h-26,w-12,9,C.ink,2,11);}
}
function playScreen(ctx,game,reduced){
  jokers(ctx,game);
  if(game.phase==='score'){
    const report=game.lastResult,steps=report?.steps||[],elapsed=Math.max(0,Math.min(1.2,game.scoreTime||0));
    text(ctx,report?.name||'HAND PLAYED',227,156,13,C.gold,'center',231);
    const played=game.lastPlay?.cards||report?.scoringCards||[],step=Math.min(43,216/Math.max(1,played.length));
    played.forEach((id,index)=>drawGambitCard(ctx,id,227-(played.length*step+42-step)/2+index*step,169,42,61,{boost:game.cardBoosts[id]||0}));
    const active=reduced||elapsed>=1.2?-1:Math.min(steps.length-1,Math.floor(elapsed/1.2*steps.length));
    steps.forEach((s,i)=>{const y=253+i*18,current=i===active,future=active>=0&&i>active;if(current)box(ctx,110,y-12,238,17,'#0d342d',C.gold,3);text(ctx,s.label,115,y,8,future?C.future:current?C.gold:C.ink,'left',157);text(ctx,number(s.chips)+' X '+Number(s.mult.toFixed(2)),343,y,9,future?C.future:C.ink,'right',72);});
    text(ctx,'+'+number(report?.total||0),227,371,23,C.gold,'center',230);return;
  }
  const report=game.preview();
  text(ctx,report?.name||'BUILD YOUR HAND',115,174,13,report?C.gold:C.ink,'left',226);
  text(ctx,report?number(report.total)+' projected':'Select up to five cards',115,197,report?17:10,report?'#aee5ff':C.muted,'left',183);
  if(!report)wrap(ctx,'Match ranks, build a straight, or collect one suit.',115,224,169,10,C.muted,3,15);
  drawGambitDeck(ctx,307,223,34,47,game.deck.length);
  const geometry=handGeometry(game);
  geometry.forEach(g=>drawGambitCard(ctx,g.id,g.x,g.y,g.w,g.h,{selected:game.selected.includes(g.id),boost:game.cardBoosts[g.id]||0,tilt:g.tilt}));
  geometry.forEach(g=>text(ctx,g.index+1,g.x+8,385,7,C.muted,'center'));
  text(ctx,game.selected.length+'/'+game.hand.length+' SELECTED',227,279,8,C.ink,'center');
}
function shopScreen(ctx,game){
  jokers(ctx,game);text(ctx,'IMPROVE YOUR RUN',227,150,10,C.gold,'center');
  game.shop.forEach((offer,index)=>{const g=shopGeometry(index),owned=ownedOffer(game,offer);if(offer.kind==='joker')drawGambitJoker(ctx,offer.id,g.x+25,g.y,58,80);else drawGambitPack(ctx,offer.pack,g.x+28,g.y,52,66);
    if(index<2)text(ctx,offerName(offer),g.x+g.w/2,g.y+90,8,C.ink,'center',104);
    if(offer.sold||owned){box(ctx,g.x+15,g.y+20,g.w-30,23,'#1d3433e8','#b3c3a4');text(ctx,offer.sold?'SOLD':'OWNED',g.x+g.w/2,g.y+36,11,C.gold,'center');}
  });
}
function packScreen(ctx,game){
  text(ctx,game.pack?.kind==='joker'?'JOKER PACK':'UPGRADE PACK',227,36,19,C.ink,'center',232);text(ctx,'CHOOSE 1',227,60,10,C.gold,'center');
  (game.pack?.options||[]).forEach((option,index)=>optionArt(ctx,option,game,111+index*80,111,72,104,game.pack.selected===index));
  const chosen=game.pack?.options?.[game.pack.selected],copy=chosen?optionCopy(chosen,game):null;
  box(ctx,110,242,238,132,'#143f35','#8bbaa2',5);
  text(ctx,copy?.title||'Pick a card to inspect',119,264,12,C.gold,'left',220);
  if(copy){text(ctx,copy.tag.toUpperCase(),119,284,8,'#a4d6ee','left',219);wrap(ctx,copy.detail,119,305,219,11,C.ink,4,16);}
  else wrap(ctx,'Tap a card above to see its boost. Choose Card confirms your choice.',119,290,219,11,C.ink,4,16);
  text(ctx,'Already paid. Skip discards this pack.',227,384,7,C.muted,'center',233);
}
function replaceScreen(ctx,game){
  text(ctx,'JOKER SLOTS FULL',227,36,16,C.ink,'center',232);text(ctx,'Incoming',227,57,9,C.gold,'center');
  if(game.pendingJoker)drawGambitJoker(ctx,game.pendingJoker,194,69,66,92,{selected:true});
  wrap(ctx,jokerBy(game.pendingJoker)?.description||'',115,184,228,10,C.ink,3,14);
  text(ctx,'CHOOSE ONE TO REPLACE',227,239,10,C.gold,'center');
  game.jokers.forEach((id,index)=>drawGambitJoker(ctx,id,111+index*80,255,72,102));
}
function infoScreen(ctx,game,inspection){
  if(inspection.info){text(ctx,'RUN INFO',227,37,18,C.gold,'center');wrap(ctx,'Play 1 to 5 cards. Beat each target in four hands; three discards refresh your cards.',116,65,226,11,C.ink,4,15);
    const rules=['High Card: highest card','Pair: 2 of one rank','Two Pair: two pairs','Three: 3 of one rank','Straight: 5 in order','Flush: 5 of one suit','Full House: trio + pair','Four: 4 of one rank','Straight Flush: both'];rules.forEach((line,i)=>text(ctx,line,116,143+i*22,9,C.ink,'left',225));text(ctx,'Run coins are separate from arcade tickets.',227,365,8,C.muted,'center',230);return;}
  if(inspection.deck){text(ctx,'YOUR DECK',227,37,18,C.gold,'center');text(ctx,game.deck.length+' cards left to draw',227,65,11,C.ink,'center');
    for(let suit=0;suit<4;suit++){const ids=game.deck.filter(id=>Math.floor(id/13)===suit).sort((a,b)=>(b%13||13)-(a%13||13));box(ctx,113,90+suit*62,232,54,'#133f35','#7aa88b');text(ctx,['CLUBS','DIAMONDS','SPADES','HEARTS'][suit]+'  '+ids.length,121,108+suit*62,11,['#7ed8bd','#ffb36c','#a8c7ff','#ff8e98'][suit]);wrap(ctx,ids.map(id=>({0:'A',10:'J',11:'Q',12:'K'})[id%13]||id%13+1).join(' '),121,128+suit*62,215,10,C.ink,2,12);}
    text(ctx,game.hand.length+' in hand / '+game.discard.length+' played or discarded',227,365,9,C.muted,'center',230);return;}
  const offer=typeof inspection==='object'?game.shop[inspection.offer]:null,id=offer?.kind==='joker'?offer.id:typeof inspection==='string'?inspection:null;
  const title=offer?offerName(offer):jokerBy(id)?.name||'Joker';text(ctx,title,227,37,17,C.gold,'center',229);
  if(id)drawGambitJoker(ctx,id,184,59,86,121);else if(offer)drawGambitPack(ctx,offer.pack,188,65,78,109);
  const detail=offer?offerDetail(offer):jokerBy(id)?.description||'';wrap(ctx,detail,116,213,225,13,C.ink,6,19);
  if(offer)text(ctx,'COST $'+offer.price,227,355,17,C.gold,'center');else text(ctx,'ACTIVE FOR THIS RUN',227,355,9,C.muted,'center');
}
function overlay(ctx,game){box(ctx,105,5,250,442,'#123a32e8');box(ctx,113,130,234,181,'#243d44','#d9e6c5',6);text(ctx,game.status==='dead'?game.won?'HOUSE OUTPLAYED':'THE HOUSE HOLDS':game.status==='paused'?'PAUSED':"GABU'S GAMBIT",230,160,17,C.gold,'center',220);wrap(ctx,game.status==='dead'?'Round '+game.round+' of 6. Run score '+number(game.score)+'.':'Build poker hands. Find Jokers. Turn small advantages into a winning run.',124,192,212,12,C.ink,4,18);text(ctx,game.status==='paused'?'PRESS PLAY TO RESUME':'PRESS PLAY TO START',230,285,10,'#b8dfff','center',217);}

export function drawGambit(canvas,game,{best=0,reduced=false,cursor=-1,inspection=null}={}){
  const ctx=canvas?.getContext?.('2d');if(!ctx)return;
  ctx.save();ctx.setTransform(canvas.width/360,0,0,canvas.height/452,0,0);ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.globalAlpha=1;ctx.lineCap='round';ctx.lineJoin='round';
  background(ctx);rail(ctx,game,best);
  if(inspection)infoScreen(ctx,game,inspection);else if(game.phase==='shop')shopScreen(ctx,game);else if(game.phase==='pack')packScreen(ctx,game);else if(game.phase==='replace')replaceScreen(ctx,game);else playScreen(ctx,game,reduced);
  const actions=gambitActions(game,{inspection});actions.forEach((a,index)=>{if(['info','play','sort','discard','continue','next','buy','claim','skip','close','sell'].includes(a.kind))button(ctx,a,index===cursor);if(index===cursor){ctx.strokeStyle=C.gold;ctx.lineWidth=2;ctx.strokeRect(a.x-2,a.y-2,a.w+4,a.h+4);}});
  if(game.status!=='playing')overlay(ctx,game);ctx.restore();
}
