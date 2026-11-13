/** Gabu's judgment engine. Driven by game events; independent of DOM/time/network. */
const SAYINGS=Object.freeze({
 match3:{
  invalid_swap:['Those are not even friends.','Inventing new match rules, are we?','It helps if the colors agree.'],
  match:['Three. A triumph of arithmetic.','You found three identical things. Incredible.','Fine. That one counted.'],
  special_created:['FOUR? Who taught you ambition?','A special tile. Try not to waste it.'],
  special_triggered:['THAT is how you make an entrance.','Collateral damage! My favorite.'],
  cascade:['Okay, that was actually gorgeous.','CHAIN REACTION. I retract one insult.'],
  reshuffle:['The board got bored of you.','No moves. Even the tiles gave up.']
 },
 snake:{score:['Another snack. The creature persists.','Eat, grow, make worse decisions.'],death:['You ran into WHAT?','Natural selection filed a report.'],win:['THE SNAKE ATE THE UNIVERSE.']},
 '2048':{move:['Outstanding. You moved some squares.'],score:['A braincell merger. Rare event.'],win:['TWO THOUSAND FORTY-EIGHT?!','Your neurons unionized!'],death:['There is no room for your mistakes.'],undo:['Rewriting history already?']},
 bird:{death:['THE PIPE WON.','Aerodynamics called. They are laughing.'],new_best:['NEW RECORD. I TAKE IT BACK.'],score:['How are you still airborne?']},
 gabi:{death:['I HAVE LANDED. BADLY.'],new_best:['JETPACK SUPREMACY.'],hit:['Personal space, BUILDING.'],coin:['I DESERVE THAT COIN.']},
 plinko:{land:['How predictably pedestrian.','The numbers have spoken. Regrettably.'],jackpot:['A most EXQUISITE windfall.','Naturally. I orchestrated that.'],bust:['An unfortunate investment. Yours.','The house appreciates your contribution.'],practice:['Rehearsing your bankruptcy?','A sensible fiscal precaution.']}
});
const MOODS=Object.freeze({idle:'gabu_smug',smug:'gabu_smug',annoyed:'gabu_annoyed',hype:'gabu_hype',panic:'gabu_panic',dizzy:'gabu_dizzy',sleepy:'gabu_sleepy',shock:'gabu_shock',magnate:'gabu_magnate'});
export class ReactionDirector {
 constructor(){this.current=null;this.remaining=0;this.elapsed=0;this.counts=new Map();this.history=[];}
 emit(game,event,data={}){
  const key=game+':'+event,count=(this.counts.get(key)||0)+1;this.counts.set(key,count);
  let mood='smug',priority=1,duration=2.9;
  if(event==='reset'||event==='start'||event==='pause'||event==='move'&&game!=='2048'||event==='flap'||event==='thrust'||event==='coin'&&game==='gabi'&&count%5!==0)return null;
  if(event==='score'&&game==='snake'&&count%3!==0)return null;
  if(event==='score'&&game==='2048'&&((data?.earned||0)<128))return null;
  if(event==='score'&&game==='bird'&&count%10!==0)return null;
  if(event==='match'&&game==='match3'&&data.chain>1)return null; // cascade has its own line
  if(event==='match'&&game==='match3'&&count%4!==1)return null;
  if(event==='invalid_swap'&&count%3!==1)return null;
  if(event==='move'&&game==='2048'&&count%20!==0)return null;
  if(event==='special_created'){mood='hype';priority=3;}
  else if(event==='cascade'||event==='win'||event==='new_best'){mood='hype';priority=5;duration=3.8;}
  else if(event==='special_triggered'){mood='shock';priority=4;}
  else if(event==='invalid_swap'){mood='annoyed';priority=2;}
  else if(event==='death'){mood='panic';priority=5;duration=3.8;}
  else if(event==='hit'){mood='annoyed';priority=3;}
  else if(event==='reshuffle'){mood='dizzy';priority=3;}
  else if(event==='undo'){mood='annoyed';priority=2;}
  else if(event==='jackpot'){mood='magnate';priority=5;duration=4;}
  else if(event==='bust'){mood='magnate';priority=3;}
  else if(event==='practice'){mood='magnate';priority=2;}
  else if(event==='land'&&game==='plinko'){mood='magnate';priority=2;}
  else if(event==='score'){mood='smug';priority=1;}
  const pool=SAYINGS[game]?.[event];if(!pool?.length)return null;
  const line=pool[(count-1)%pool.length];
  if(this.current&&this.remaining>1.1&&priority<this.current.priority)return null;
  if(this.current?.event===event&&this.current?.game===game&&this.remaining>1.5)return null;
  this.current={game,event,mood,art:MOODS[mood],line,priority};this.remaining=duration;this.elapsed=0;
  this.history.push({game,event,line});if(this.history.length>12)this.history.shift();
  return this.current;
 }
 update(dt){if(!Number.isFinite(dt)||dt<=0)return;this.elapsed+=dt;this.remaining=Math.max(0,this.remaining-dt);if(this.remaining===0)this.current=null;}
 clear(){this.current=null;this.remaining=0;}
}
