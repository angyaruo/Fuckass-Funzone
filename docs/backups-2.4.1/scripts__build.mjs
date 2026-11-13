/** Zero-dependency reproducible bundler. Fail before writes on uncertain anchors.
 * Source + sprites -> self-contained browser dist/frontend.js (no asset URL problems).
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const matches=(text,frag)=>(text.split(frag).length-1);
function requireOnce(src, needle, place) {
  if(matches(src,needle)!==1) throw Error(`${place}: expected exactly one build anchor: ${needle}`);
}
const engine=read('src/engine.js');
const puzzles=read('src/puzzles.js');
const puzzleRender=read('src/puzzle-render.js');
const match3=read('src/match3.js');
const matchRender=read('src/match3-render.js');
const reactions=read('src/reactions.js');
const plinko=read('src/plinko.js');
const plinkoRender=read('src/plinko-render.js');
const shop=read('src/shop.js');
let ui=read('src/frontend.js');
const css=read('src/style.css');
const importAnchor="import { ArcadeEngine, WORLD, MODE, DEFAULT_SETTINGS, sanitizeSettings, lifecycleTransition } from './engine.js';";
const assetAnchor='const ASSETS = /* BUILD_ASSETS */ {};';
const cssAnchor="const CSS = /* BUILD_CSS */ '';";
const puzzleAnchor="import { SnakeGame, Merge2048 } from './puzzles.js';";
const renderAnchor="import { drawSnake, drawMerge } from './puzzle-render.js';";
const matchAnchor="import { Match3Game, MATCH_WIDTHS, MATCH_ROWS } from './match3.js';";
const matchRenderAnchor="import { drawMatch3, matchCellAt } from './match3-render.js';";
const reactionAnchor="import { ReactionDirector } from './reactions.js';";
const plinkoAnchor="import { PlinkoGame } from './plinko.js';";
const plinkoRenderAnchor="import { drawPlinko } from './plinko-render.js';";
const shopAnchor="import { SHOP_CATALOG, SHOP_SLOTS, restoreShop, purchaseReward, equipReward } from './shop.js';";
for(const [needle,label] of [[importAnchor,'engine import'],[puzzleAnchor,'puzzles import'],[renderAnchor,'render import'],[matchAnchor,'match-3 engine import'],[matchRenderAnchor,'match-3 renderer import'],[reactionAnchor,'reaction engine import'],[plinkoAnchor,'plinko engine import'],[plinkoRenderAnchor,'plinko renderer import'],[shopAnchor,'shop import'],[assetAnchor,'asset marker'],[cssAnchor,'CSS marker']]) requireOnce(ui,needle,label);
const spriteNames=[...Array.from({length:6},(_,i)=>`bird_flap_${i}`),...Array.from({length:6},(_,i)=>`gabi_fly_${i}`),'bird_dizzy','bird_dead','gabi_hurt','gabi_crash','gabi_dead','cloud','coin','star','heart','flame_0','flame_1','flame_2','record_flag','best_banner','game_over_banner'];
const assetPaths=Object.fromEntries([
  ...spriteNames.map(name=>[name,`assets/sprites/${name}.png`]),
  ['cover','assets/cover/jetpack-cover.png'],['icon','assets/funzone/funzone-icon.png'],
  ['funzone_logo','assets/funzone/funzone-logo.png'],
  ['snake_head','assets/funzone/snake-head.png'],['snake_snack','assets/funzone/snake-snack.png'],
  ...['apple','berry','star','fish','cookie','candy'].map(k=>[`snake_food_${k}`,`assets/funzone/snake-food-${k}.png`]),
  ['merge_tile','assets/funzone/merge-tile.png'],
  ...['cat','heart','star','fish','cookie','gem','rocket','bomb'].map(k=>[`match_${k}`,`assets/match3/match-${k}.png`]),
  ...['smug','annoyed','hype','panic','dizzy','sleepy','shock'].map(k=>[`gabu_${k}`,`assets/match3/gabu-${k}.png`]),
  ['gabu_magnate','assets/plinko/gabu-monocle.png'],['gabu_peek','assets/plinko/gabu-peek.png'],['plinko_chip','assets/plinko/cat-chip.png'],['plinko_app','assets/plinko/plinko-app.png'],
]);
const svgPaths={...Object.fromEntries(['cat','heart','star','fish','cookie','gem','rocket','bomb'].map(k=>[`match_vec_${k}`,`assets/match3/vector/${k}.svg`])),match_vec_hint:'assets/match3/vector/hint.svg',plinko_crest:'assets/plinko/cat-crest.svg'};
const assets={};
for(const [key,p] of Object.entries(assetPaths)) {
  const contents=fs.readFileSync(path.join(root,p));
  if(contents.length<25 || !contents.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))) throw Error('PNG invalid '+p);
  assets[key]='data:image/png;base64,'+contents.toString('base64');
}
for(const [key,p] of Object.entries(svgPaths)) {
  const xml=read(p);
  if(!/^<svg\s[^>]*xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/.test(xml.trim()) || !xml.includes('viewBox="0 0 64 64"') || !xml.includes('</svg>')) throw Error('SVG format invalid: '+p);
  if(/<\/?(?:script|foreignObject|image|text|use|style)\b|on(?:load|click|error)\s*=|href\s*=|url\s*\(|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i.test(xml))throw Error('SVG requires self-contained vector paths: '+p);
  assets[key]='data:image/svg+xml;base64,'+Buffer.from(xml).toString('base64');
}
let pureEngine=engine.replace(/^export\s+/gm,'');
const purePuzzles=puzzles.replace(/^export\s+/gm,'');
const pureRender=puzzleRender.replace("import {SNAKE_COLS,SNAKE_ROWS,SNAKE_FOOD_KINDS} from './puzzles.js';\n",'').replace(/^export\s+/gm,'');
const pureMatch3=match3.replace(/^export\s+/gm,'');
const pureMatchRender="const {drawMatch3,matchCellAt,matchLayout}=(()=>{\n"+matchRender.replace("import {MATCH_SIZE,MATCH_ROWS,cellAt} from './match3.js';\n",'').replace(/^export\s+/gm,'')+"\nreturn {drawMatch3,matchCellAt,matchLayout};\n})();";
const pureReactions=reactions.replace(/^export\s+/gm,'');
const pureShop=shop.replace(/^export\s+/gm,'');
const plinkoPublic='PlinkoGame,PLINKO_W,PLINKO_H,PLINKO_PEGS,PLINKO_SLOTS,PLINKO_BIN_LEFT,PLINKO_BIN_RIGHT,PLINKO_BIN_Y';
const purePlinko=`const {${plinkoPublic}}=(()=>{\n${plinko.replace(/^export\s+/gm,'')}\nreturn {${plinkoPublic}};\n})();`;
const purePlinkoRender=`const {drawPlinko}=(()=>{\n${plinkoRender.replace("import {PLINKO_W,PLINKO_H,PLINKO_PEGS,PLINKO_SLOTS,PLINKO_BIN_LEFT,PLINKO_BIN_RIGHT,PLINKO_BIN_Y} from './plinko.js';\n",'').replace(/^export\s+/gm,'')}\nreturn {drawPlinko};\n})();`;
ui=ui.replace(importAnchor,pureEngine).replace(puzzleAnchor,purePuzzles).replace(renderAnchor,pureRender)
  .replace(matchAnchor,pureMatch3).replace(matchRenderAnchor,pureMatchRender).replace(reactionAnchor,pureReactions)
  .replace(plinkoAnchor,purePlinko).replace(plinkoRenderAnchor,purePlinkoRender).replace(shopAnchor,pureShop)
  .replace(assetAnchor,'const ASSETS = '+JSON.stringify(assets)+';').replace(cssAnchor,'const CSS = '+JSON.stringify(css)+';');
const banner=`/* Fuckass Funzone 2.4.0 | self-contained Spindle frontend | ${Object.keys(assets).length} embedded PNG/SVG assets | generated from editable src/ */\n`;
// Artifact is validated in memory before writes.
const candidate=banner+ui;
if(candidate.includes('BUILD_ASSETS')||candidate.includes('BUILD_CSS')||candidate.includes("from './engine.js'")||candidate.includes("from './puzzles.js'")||candidate.includes("from './puzzle-render.js'")||candidate.includes("from './match3.js'")||candidate.includes("from './match3-render.js'")||candidate.includes("from './reactions.js'")||candidate.includes("from './plinko.js'")||candidate.includes("from './plinko-render.js'")||candidate.includes("from './shop.js'"))throw Error('Unresolved build marker');
const old=path.join(root,'dist/frontend.js');
fs.mkdirSync(path.dirname(old),{recursive:true});
const temp=old+'.tmp';
fs.writeFileSync(temp,candidate);
fs.renameSync(temp,old);
console.log('Built dist/frontend.js',Math.round(candidate.length/1024),'KiB with',Object.keys(assets).length,'embedded PNG/SVG assets');
