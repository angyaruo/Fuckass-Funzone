/** Permanent, purely local arcade cosmetic rewards. No purchases, services or real money. */
export const SHOP_CATALOG = Object.freeze([
  // CABINET THEMES (8 items)
  {id:'cabinet_mint',slot:'cabinet',name:'Midnight Mint',description:'Cool teal glow for your entire Funzone HUD.',price:35,asset:'match_vec_fish',color:'#63d8d6'},
  {id:'cabinet_cherry',slot:'cabinet',name:'Cherry Afterhours',description:'Raspberry neon and dramatic pink controls.',price:55,asset:'match_vec_heart',color:'#ff81a9'},
  {id:'cabinet_royal',slot:'cabinet',name:'The House Royale',description:'Gold-trimmed cabinet. Gabu approves.',price:95,asset:'gabu_magnate',color:'#ffdb93'},
  {id:'cabinet_cyber',slot:'cabinet',name:'Matrix Terminal',description:'Phosphor lime and terminal black obsidian glass.',price:45,asset:'match_vec_rocket',color:'#39ff14'},
  {id:'cabinet_amethyst',slot:'cabinet',name:'Void Syndicate',description:'Deep cosmic indigo frame laced with electric ultraviolet.',price:65,asset:'match_vec_gem',color:'#c084fc'},
  {id:'cabinet_sunset',slot:'cabinet',name:'Synthwave Sunset',description:'Warm twilight violet with blazing neon tangerine trim.',price:50,asset:'match_vec_star',color:'#ff7b54'},
  {id:'cabinet_crimson',slot:'cabinet',name:'Overdrive Crimson',description:'Carbon fiber chassis with scorching racing red accents.',price:75,asset:'flame_0',color:'#ff3366'},
  {id:'cabinet_monochrome',slot:'cabinet',name:'Noir Executive',description:'Matte stealth titanium with icy white precision lines.',price:80,asset:'gabu_smug',color:'#e2e8f0'},

  // SNAKE SKINS (7 items)
  {id:'snake_mint',slot:'snake',name:'Mint Noodle',description:'A fresh mint-green ribbon for Snake.',price:22,asset:'snake_head',color:'#77ebc5'},
  {id:'snake_sunset',slot:'snake',name:'Sunset Noodle',description:'A peach-and-coral ribbon for Snake.',price:38,asset:'snake_head',color:'#ffae87'},
  {id:'snake_cyber',slot:'snake',name:'Toxic Viper',description:'High-voltage matrix green ribbon with radioactive neon bloom.',price:32,asset:'snake_head',color:'#39ff14'},
  {id:'snake_amethyst',slot:'snake',name:'Void Serpent',description:'Deep abyssal indigo body shimmering with ultraviolet trim.',price:44,asset:'snake_head',color:'#c084fc'},
  {id:'snake_gold',slot:'snake',name:'Gilded Ouroboros',description:'Solid high-roller 24k gold scales that radiate opulent light.',price:65,asset:'snake_head',color:'#ffd700'},
  {id:'snake_crimson',slot:'snake',name:'Magma Drake',description:'Scorching volcanic scarlet core with crackling embers.',price:42,asset:'snake_head',color:'#ff385c'},
  {id:'snake_frost',slot:'snake',name:'Glacial Wyrm',description:'Crystalline arctic cyan body with frozen diamond shine.',price:48,asset:'snake_head',color:'#38bdf8'},

  // PLINKO TRAILS (7 items)
  {id:'plinko_aqua',slot:'plinko',name:'Aqua Comet',description:'Make falling Plinko chips leave a cyan trail.',price:28,asset:'plinko_chip',color:'#72e2f3'},
  {id:'plinko_gold',slot:'plinko',name:'Gilded Descent',description:'A warm golden trail worthy of The House.',price:48,asset:'plinko_crest',color:'#ffd77e'},
  {id:'plinko_neon',slot:'plinko',name:'Laser Fuchsia',description:'High-energy vaporwave hot magenta particle ribbon.',price:34,asset:'plinko_chip',color:'#ff2a8d'},
  {id:'plinko_emerald',slot:'plinko',name:'Lucky Clover',description:'Radiant casino emerald sparks trailing your chip.',price:42,asset:'plinko_chip',color:'#10b981'},
  {id:'plinko_amethyst',slot:'plinko',name:'Cosmic Stardust',description:'Deep purple and lilac stardust streaming down the board.',price:52,asset:'plinko_chip',color:'#a855f7'},
  {id:'plinko_solar',slot:'plinko',name:'Solar Flare',description:'Supernova plasma and blazing orange sparks in freefall.',price:58,asset:'plinko_chip',color:'#ff6700'},
  {id:'plinko_frost',slot:'plinko',name:'Diamond Prism',description:'Prismatic refractive icy cyan sparkle stream.',price:46,asset:'plinko_chip',color:'#a5f3fc'},

  // 2048 MERGE PALETTES (7 items)
  {id:'merge_mint',slot:'merge',name:'Sea-Glass 2048',description:'Cool mint and blue tones for merge tiles.',price:30,asset:'merge_tile',color:'#7bd8da'},
  {id:'merge_candy',slot:'merge',name:'Sugar Rush 2048',description:'Peach, rose and candy-pink merge tiles.',price:42,asset:'match_vec_cookie',color:'#ffb6b3'},
  {id:'merge_cyber',slot:'merge',name:'Cyber Matrix 2048',description:'Hacker terminal tiles scaling from forest to radioactive lime.',price:36,asset:'merge_tile',color:'#22c55e'},
  {id:'merge_amethyst',slot:'merge',name:'Void Crystal 2048',description:'Ethereal amethyst tiles deepening into deep starlight.',price:48,asset:'match_vec_gem',color:'#a855f7'},
  {id:'merge_gold',slot:'merge',name:'High Stakes Gold',description:'Casino progression from antique brass to 24k bullion.',price:68,asset:'plinko_crest',color:'#eab308'},
  {id:'merge_sunset',slot:'merge',name:'Retro Sunset 2048',description:'80s synth gradient scaling from dusk plum into fiery coral.',price:44,asset:'match_vec_star',color:'#f97316'},
  {id:'merge_noir',slot:'merge',name:'Titanium Monochrome',description:'Brushed graphite tiles with high-contrast icy numerals.',price:52,asset:'merge_tile',color:'#94a3b8'},
]);
export const SHOP_SLOTS = Object.freeze(['cabinet','snake','plinko','merge']);
export const SHOP_DEFAULTS = Object.freeze({cabinet:'default',snake:'default',plinko:'default',merge:'default'});
const catalogById=new Map(SHOP_CATALOG.map(item=>[item.id,item]));
export function restoreShop(raw){
 const owned=Array.isArray(raw?.owned)?[...new Set(raw.owned.filter(id=>typeof id==='string'&&catalogById.has(id)))]:[];
 const equipped={...SHOP_DEFAULTS};
 for(const slot of SHOP_SLOTS){
  const id=raw?.equipped?.[slot];
  if(typeof id==='string'&&owned.includes(id)&&catalogById.get(id)?.slot===slot)equipped[slot]=id;
 }
 return {owned,equipped};
}
export function purchaseReward(raw,id,wallet){
 const shop=restoreShop(raw),item=catalogById.get(id);
 if(!item)return {ok:false,reason:'unknown',shop,tickets:wallet};
 if(shop.owned.includes(id))return {ok:false,reason:'owned',shop,tickets:wallet};
 if(!Number.isSafeInteger(wallet)||wallet<0||wallet<item.price)return {ok:false,reason:'funds',shop,tickets:wallet};
 return {ok:true,reason:'purchased',tickets:wallet-item.price,shop:{owned:[...shop.owned,id],equipped:{...shop.equipped,[item.slot]:id}}};
}
export function equipReward(raw,slot,id){
 const shop=restoreShop(raw);
 if(!SHOP_SLOTS.includes(slot))return {ok:false,shop};
 if(id==='default')return {ok:true,shop:{owned:shop.owned,equipped:{...shop.equipped,[slot]:'default'}}};
 if(!shop.owned.includes(id)||catalogById.get(id)?.slot!==slot)return {ok:false,shop};
 return {ok:true,shop:{owned:shop.owned,equipped:{...shop.equipped,[slot]:id}}};
}
