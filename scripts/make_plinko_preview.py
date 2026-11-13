"""Offline art/design preview (NOT a browser screenshot). No web/network and no font redistribution."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import cairosvg,io
ROOT=Path(__file__).resolve().parents[1]
W,H=1200,670
out=Image.new('RGB',(W,H),(23,19,35));draw=ImageDraw.Draw(out)
for y in range(H):
 t=y/H;draw.line([(0,y),(W,y)],fill=(int(32-8*t),int(25-4*t),int(48-9*t)))
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
B=lambda n:ImageFont.truetype(font,n)

def rect(box,r,fill,outline=None,width=1):draw.rounded_rectangle(box,radius=r,fill=fill,outline=outline,width=width)
def text(xy,s,size,color,anchor=None):draw.text(xy,s,font=B(size),fill=color,anchor=anchor)
def png(path,xy,sz):
 a=Image.open(ROOT/path).convert('RGBA');a.thumbnail(sz,Image.Resampling.LANCZOS)
 out.paste(a,(int(xy[0]+(sz[0]-a.width)/2),int(xy[1]+(sz[1]-a.height)/2)),a)

rect((24,24,1176,646),26,(27,22,40),(124,76,120),3)
png('assets/funzone/funzone-logo.png',(42,27),(280,75))
text((355,63),'FUNZONE OS  /  PLINKO',25,'#FFF2E4')
text((352,96),'Independent SVG/PNG assets  |  six games  |  fictional tickets only',14,'#CBB9D0')
# launcher
rect((48,145,425,618),23,(41,31,57),(119,74,118),2)
text((75,177),'GABU PHONE',18,'#FFE0EB')
rect((68,195,402,278),15,(64,43,78),(122,82,122),1)
png('assets/plinko/gabu-monocle.png',(70,188),(128,108))
text((199,228),'Six delightful apps.',16,'#FFE4ED')
text((199,255),'One very smug manager.',12,'#D9BCD8')
apps=[('Bird','assets/sprites/bird_flap_0.png'),('Jetpack','assets/sprites/gabi_fly_0.png'),('Snake','assets/funzone/snake-head.png'),('2048','assets/funzone/merge-tile.png'),('Match-3','assets/match3/match-cat.png'),('Plinko','assets/plinko/plinko-app.png')]
for i,(name,p) in enumerate(apps):
 c=i%3;r=i//3;x=80+c*112;y=302+r*118
 rect((x,y,x+91,y+83),16,(71,50,84),(148,91,139),2)
 png(p,(x+13,y+4),(64,63))
 text((x+46,y+105),name,12,'#FFF0F7',anchor='mm')
rect((107,553,366,591),10,(141,72,117),(235,151,200),1)
text((237,573),'CONTINUE PLINKO',13,'#FFF4F8','mm')
# board
rect((449,145,879,618),21,(20,26,38),(122,75,117),2)
rect((462,163,863,210),10,(55,37,58))
text((485,194),'PLINKO',22,'#FFF0D5')
text((754,192),'BEST 80',15,'#FFDB9A')
# arced canopy
rect((608,226,728,260),10,(116,54,97),(240,185,133),2)
crest=Image.open(io.BytesIO(cairosvg.svg2png(url=str(ROOT/'assets/plinko/cat-crest.svg'),output_width=42,output_height=42))).convert('RGBA')
out.paste(crest,(616,219),crest)
text((695,244),'THE HOUSE',10,'#FFF2E1',anchor='mm')
for r in range(8):
 for c in range(7 if r%2 else 8):
  x=483+c*46+(r%2)*23;y=289+r*33
  draw.ellipse((x-5,y-5,x+5,y+5),fill='#7C4F51')
  draw.ellipse((x-3,y-3,x+3,y+3),fill='#FFDA95')
# chip near middle
png('assets/plinko/cat-chip.png',(663,332),(32,32))
for i,m in enumerate([8,2,1,1,0,1,1,2,8]):
 x=466+i*44
 colors=['#B44780','#815B93','#507D95','#547B71','#92713F','#547B71','#507D95','#815B93','#B44780']
 rect((x,561,x+42,601),5,colors[i])
 text((x+21,583),'x'+str(m),12,'#FFFFFF',anchor='mm')
# right side portrait and wager
rect((908,145,1149,618),19,(45,32,57),(137,89,127),2)
png('assets/plinko/gabu-monocle.png',(932,165),(196,166))
text((1028,336),'MADAME GABU',18,'#FFE7F3','mm')
text((1028,358),'CHAIR OF COMPLIANCE',10,'#CBB0C4','mm')
rect((932,387,1127,469),13,(32,26,43),(111,81,103),1)
text((951,408),'FICTIONAL WAGER',12,'#EBC8D8')
for i,l in enumerate(['FREE','1','5','10']):
 x=951+i*42
 rect((x,426,x+39,456),8,(155,71,113) if i==2 else (63,49,70),(184,123,166))
 text((x+20,442),l,10,'#FFFFFF','mm')
rect((955,503,1105,558),13,(190,64,119),(247,173,204),2)
text((1030,532),'DROP',20,'#FFFFFF','mm')
text((1030,581),'THE HOUSE ALWAYS MEOWS',10,'#E8C8D3','mm')
# footer
text((601,631),'ART / LAYOUT PREVIEW — Not a live Lumiverse screenshot',12,'#BDABC3','mm')
out.save(ROOT/'docs/plinko-phone-preview.png',optimize=True)
print(ROOT/'docs/plinko-phone-preview.png')
