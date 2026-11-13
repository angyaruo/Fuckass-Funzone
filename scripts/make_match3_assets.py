#!/usr/bin/env python3
"""Deterministic PNG icons/portraits sourced from the extension's existing licensed art.
Does not crop sprite sheets; only known isolated RGBA sprite files are used.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import json
ROOT=Path(__file__).resolve().parents[1]
SPR=ROOT/'assets/sprites';FOOD=ROOT/'assets/funzone';OUT=ROOT/'assets/match3'
S=192
ASSETS={'heart':SPR/'heart.png','star':FOOD/'snake-food-star.png','fish':FOOD/'snake-food-fish.png','cookie':FOOD/'snake-food-cookie.png'}
FACES={'smug':'gabi_fly_3','annoyed':'gabi_hurt','hype':'gabi_fly_5','panic':'gabi_crash','dizzy':'gabi_dizzy','sleepy':'gabi_sleep','shock':'gabi_surprise'}
for f in [*ASSETS.values(),*(SPR/(s+'.png') for s in FACES.values())]:
    if not f.is_file():raise SystemExit(f'Missing source asset: {f}')
OUT.mkdir(exist_ok=True,parents=True)
def border_sprite(src,size=192):
    src=src.convert('RGBA');src.thumbnail((size-24,size-24),Image.Resampling.LANCZOS)
    z=Image.new('RGBA',(size,size));x=(size-src.width)//2;y=(size-src.height)//2
    alpha=Image.new('L',(size,size));alpha.paste(src.getchannel('A'),(x,y))
    dark=alpha.filter(ImageFilter.MaxFilter(9));stroke=Image.new('RGBA',(size,size),(39,21,64,0));stroke.putalpha(dark)
    z.alpha_composite(stroke);z.alpha_composite(src,(x,y));return z
for name,f in ASSETS.items():border_sprite(Image.open(f)).save(OUT/f'match-{name}.png')
# Cat-face gem: unmistakable silhouette with pointy ears, hand-drawn outlines and heterochrome eyes.
a=Image.new('RGBA',(S,S));d=ImageDraw.Draw(a)
outline='#2b163c';inside='#4e3269'
d.polygon([(27,91),(26,24),(68,46),(98,38),(132,44),(165,23),(168,97),(164,134),(139,153),(57,153),(27,132)],fill=outline)
d.polygon([(35,95),(38,37),(70,55),(97,47),(130,54),(158,36),(158,98),(153,127),(133,144),(62,144),(39,126)],fill=inside)
d.polygon([(47,59),(44,43),(70,59)],fill='#f07eb4');d.polygon([(132,60),(150,43),(149,65)],fill='#f07eb4')
d.ellipse((43,93,82,124),fill='#21172f');d.ellipse((107,93,146,124),fill='#21172f')
d.ellipse((57,97,70,115),fill='#ffc16b');d.ellipse((120,97,134,115),fill='#7ddcff')
d.ellipse((61,99,66,105),fill='white');d.ellipse((124,99,129,105),fill='white')
d.polygon([(90,121),(105,121),(97,129)],fill='#f3a4ce')
d.arc((88,124,97,137),0,180,fill='#ffc0dc',width=3);d.arc((97,124,106,137),0,180,fill='#ffc0dc',width=3)
d.ellipse((45,126,61,132),fill='#a85985');d.ellipse((136,126,152,132),fill='#a85985')
a.save(OUT/'match-cat.png')
# Cel-shaded amethyst tile with sharp facets and a dark stroke.
a=Image.new('RGBA',(S,S));d=ImageDraw.Draw(a)
p=[(96,9),(153,50),(166,122),(102,180),(39,132),(30,59)]
d.polygon(p,fill='#2e1648');d.polygon([(96,19),(145,55),(156,119),(100,169),(48,129),(40,61)],fill='#b77eeb')
d.polygon([(96,19),(40,61),(80,79),(110,78)],fill='#f6b5fd')
d.polygon([(96,19),(145,55),(110,78)],fill='#df98ff')
d.polygon([(40,61),(48,129),(98,169),(80,79)],fill='#8e64c7')
d.polygon([(80,79),(110,78),(98,169)],fill='#cc96fa')
d.polygon([(110,78),(145,55),(156,119),(98,169)],fill='#7f54af')
d.line([(66,50),(93,31),(116,45)],fill='#fff7ff',width=6)
a.save(OUT/'match-gem.png')
# Ability overlays — icon PNGs, no font-based symbols.
a=Image.new('RGBA',(S,S));d=ImageDraw.Draw(a)
d.polygon([(34,108),(100,24),(154,79),(108,154)],fill='#301c40')
d.polygon([(42,105),(103,37),(143,80),(106,143)],fill='#f066a8')
d.ellipse((89,65,124,102),fill='#ffe1f2');d.ellipse((97,73,116,94),fill='#7542a8')
d.polygon([(36,100),(14,130),(61,116)],fill='#ffca60');d.polygon([(87,150),(103,177),(114,146)],fill='#ffd16b')
a.save(OUT/'match-rocket.png')
a=Image.open(OUT/'match-cat.png').copy();d=ImageDraw.Draw(a)
d.ellipse((124,11,158,45),fill='#ffe28f');d.ellipse((130,18,150,38),fill='#ff9b4c')
a.save(OUT/'match-bomb.png')
# Crop by explicit portrait region from already isolated sprite (no grid bleed).
for mood,source in FACES.items():
    original=Image.open(SPR/(source+'.png')).convert('RGBA')
    if mood=='sleepy':crop=original.crop((5,0,225,172))
    elif mood=='panic':crop=original.crop((5,0,231,178))
    else:crop=original.crop((25,0,238,180))
    crop.thumbnail((136,118),Image.Resampling.LANCZOS)
    dest=Image.new('RGBA',(144,128));dest.alpha_composite(crop,((144-crop.width)//2,0))
    dest.save(OUT/f'gabu-{mood}.png')
# Audit transparency and source bounds for every output.
manifest={}
for f in sorted(OUT.glob('*.png')):
 im=Image.open(f);assert im.mode=='RGBA' and im.getbbox(),f
 manifest[f.name]={'size':im.size,'bbox':im.getbbox()}
(OUT/'asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Created',len(manifest),'independent transparent PNG assets at',OUT)
