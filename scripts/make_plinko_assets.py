"""Create independent RGBA game assets for Plinko from already-licensed Funzone art.
Pixel shapes are drawn at 3x resolution; no prepacked sprite-sheet slicing.
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'assets'/'plinko';out.mkdir(exist_ok=True)
scale=3
S=lambda z:round(z*scale)
# Preserve the approved high-resolution monocled Gabu render instead of drawing
# a miniature top hat onto the old Gabu pose. Never silently regenerate old art.
reference=ROOT/'assets/source/plinko-host-original.png'
if not reference.exists():raise FileNotFoundError('Approved Plinko host original is required: '+str(reference))
im=Image.open(reference).convert('RGBA')
main=im.crop((55,0,1190,1220));main.thumbnail((420,420),Image.Resampling.LANCZOS)
main.save(out/'gabu-monocle.png',optimize=True)
peek=im.crop((75,0,1200,1005));peek.thumbnail((450,400),Image.Resampling.LANCZOS)
peek.save(out/'gabu-peek.png',optimize=True)
# Cute gold/pink cat-chip, transparent independent PNG.
chip=Image.new('RGBA',(S(128),S(128)),(0,0,0,0));p=ImageDraw.Draw(chip)
p.ellipse((S(11),S(11),S(117),S(117)),fill='#432137',outline='#e18cb8',width=S(5))
p.ellipse((S(17),S(17),S(111),S(111)),fill='#bc4b85',outline='#ffda8a',width=S(6))
p.ellipse((S(27),S(27),S(101),S(101)),fill='#f1b66d',outline='#fff0be',width=S(3))
p.polygon([(S(38),S(49)),(S(41),S(33)),(S(53),S(42)),(S(74),S(42)),(S(88),S(33)),(S(91),S(49)),(S(89),S(81)),(S(74),S(91)),(S(51),S(91)),(S(37),S(81))],fill='#35213d')
p.ellipse((S(50),S(60),S(57),S(67)),fill='#6ce9fa');p.ellipse((S(73),S(60),S(80),S(67)),fill='#ffd081')
p.ellipse((S(63),S(73),S(68),S(77)),fill='#f7aad2')
chip.resize((128,128),Image.Resampling.LANCZOS).save(out/'cat-chip.png',optimize=True)
# Standalone square app icon: cat-chip over pegboard with no text/glyph.
app=Image.new('RGBA',(S(128),S(128)),(0,0,0,0));a=ImageDraw.Draw(app)
a.rounded_rectangle((S(7),S(7),S(121),S(121)),radius=S(26),fill='#2f243f',outline='#ef91c7',width=S(4))
for row in range(5):
 for col in range(5-(row%2)):
  px=24+col*20+(row%2)*10;py=26+row*16
  a.ellipse((S(px-3),S(py-3),S(px+3),S(py+3)),fill='#ffd38d')
mini=chip.resize((S(68),S(68)),Image.Resampling.LANCZOS)
app.alpha_composite(mini,(S(30),S(59)))
app.resize((128,128),Image.Resampling.LANCZOS).save(out/'plinko-app.png',optimize=True)
print('Plinko PNGs:',[(p.name,p.stat().st_size) for p in out.glob('*.png')])
