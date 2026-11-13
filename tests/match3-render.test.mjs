import test from 'node:test';import assert from 'node:assert/strict';
import {Match3Game} from '../src/match3.js';import {drawMatch3,matchCellAt} from '../src/match3-render.js';
function makeCanvas(){const imagesSeen=[],words=[],fills=[];
 const ctx={setTransform(){},createLinearGradient(){return{addColorStop(){}}},fillRect(){},beginPath(){},roundRect(){},fill(){fills.push(this.fillStyle)},strokeRect(){},
  drawImage(img){imagesSeen.push(img.name)},fillText(s){words.push([s,this.fillStyle])}};
 return {canvas:{width:720,height:904,getContext(){return ctx}},imagesSeen,words,fills};
}
test('Match-3 renderer chooses 49 separate crisp SVG tiles plus tiny mascot header',()=>{
 const g=new Match3Game({random:()=>.45});g.start();const b=makeCanvas();
 const images=new Proxy({}, {get:(_o,name)=>({name,complete:true,naturalWidth:64})});
 drawMatch3(b.canvas,g,images,{best:1600,selected:8});
 assert.equal(b.imagesSeen.filter(name=>name.startsWith('match_vec_')).length,50,'49 SVG tiles plus one SVG header charm, never a sheet');
 assert.ok(b.words.some(([s,col])=>s==='SCORE 0'&&col==='#fdfaf7'));
 assert.ok(b.words.some(([s,col])=>s==='BEST 1600'&&col==='#ead4c4'),'best score is cream, not yellow');
 assert.equal(matchCellAt(28,77),0,'cell geometry is backwards compatible');
 assert.ok(b.fills.includes('#8df0ec'),'selection has high contrast teal focus ring');
 assert.ok(b.fills.includes('#2b303a')&&b.fills.includes('#292e37'),'low-chroma neutral cells');
 assert.ok(!b.fills.includes('#443150')&&!b.fills.includes('#3a294b'),'old grape-on-grape cells are gone');
});
test('SVGs loading asynchronously fall back to old individual PNG assets',()=>{
 const g=new Match3Game({random:()=>.43});g.start();const b=makeCanvas();
 const images=new Proxy({}, {get:(_o,name)=>({name,complete:true,naturalWidth:name.startsWith('match_vec_')?0:128})});
 drawMatch3(b.canvas,g,images,{selected:20});
 assert.equal(b.imagesSeen.filter(name=>/^match_(?!vec_)/.test(name)).length,50);
});
test('special pieces are rendered with distinct vector medallions in addition to base shape',()=>{
 const g=new Match3Game({random:()=>.32});g.start();g.board[0].power='row';g.board[1].power='bomb';const b=makeCanvas();
 const images=new Proxy({}, {get:(_o,name)=>({name,complete:true,naturalWidth:64})});
 drawMatch3(b.canvas,g,images,{selected:0});
 assert.ok(b.imagesSeen.includes('match_vec_rocket'));
 assert.ok(b.imagesSeen.includes('match_vec_bomb'));
 assert.ok(b.fills.includes('#6bd7e7')&&b.fills.includes('#ff95ca'),'special powers have different border colors');
});
