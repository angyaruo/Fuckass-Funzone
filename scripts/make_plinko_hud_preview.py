"""Offline compositional preview using embedded game assets and renderer coordinates.
This is NOT a screenshot of Lumiverse; intended to QA hierarchy in the 360px HUD.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math
ROOT=Path(__file__).resolve().parents[1]
S=2;W,H=410,656
im=Image.new('RGBA',(W*S,H*S),'#100e17');d=ImageDraw.Draw(im)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def font(n,bold=False):
 p='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else FONT
 return ImageFont.truetype(p,n*S)
def rr(xy,r,c,stroke=None,width=1):
 box=[round(q*S) for q in xy];d.rounded_rectangle(box,radius=r*S,fill=c,outline=stroke,width=width*S)
def text(x,y,s,n=11,col='#fcebf7',bold=False,anchor=None):d.text((round(x*S),round(y*S)),str(s),fill=col,font=font(n,bold),anchor=anchor)
def paste(rel,x,y,w,h):
 art=Image.open(ROOT/rel).convert('RGBA');art.thumbnail((int(w*S),int(h*S)),Image.Resampling.LANCZOS)
 im.alpha_composite(art,(round((x+(w-art.width/S)/2)*S),round((y+(h-art.height/S)/2)*S)))
rr((10,7,398,630),14,'#221c30','#5d4867',1)
paste('assets/funzone/funzone-logo.png',20,14,137,40)
rr((167,19,195,47),7,'#352640','#805877')
# Hand-drawn vector phone glyph; no font/glyph stand-ins for UI icons.
d.rounded_rectangle((175*S,23*S,188*S,43*S),radius=3*S,outline='#f3c1e0',width=2*S)
d.line([(179*S,27*S),(184*S,27*S)],fill='#f3c1e0',width=S)
d.ellipse((181*S,39*S,183*S,41*S),fill='#f3c1e0')
d.ellipse((244*S,29*S,251*S,36*S),fill='#95809e');text(258,36,'IDLE',9,'#c8b6d0',True)
rr((297,18,364,48),8,'#292238','#655273');paste('assets/sprites/coin.png',302,23,17,19);text(339,35,'149',13,'#fff2f7',True,'mm')
rr((368,19,390,46),5,'#2b2538','#695477');text(379,33,'×',13,'#eee0ed',True,'mm')
# Game stage occupies its real 360x452 aspect ratio, scaled to a 355px playfield.
gameX,gameY=27,63;z=355/360
def g(x,y):return (gameX+x*z,gameY+y*z)
def gr(box,r,c,stroke=None,width=1):rr((*g(box[0],box[1]),*g(box[2],box[3])),int(r*z),c,stroke,width)
gr((0,0,360,452),10,'#151723','#56415d')
gr((16,77,344,424),11,'#141a28','#6c536d')
gr((20,14,340,54),11,'#2b2234');text(*g(33,38),'PLINKO',15,'#fff2df',True)
text(*g(155,38),'BEST 80',10,'#f1d8ba',True)
gr((25,80,335,82),1,'#a75983')
# board pegs at exact engine locations
for row in range(8):
 for col in range(7 if row%2 else 8):
  x=33+col*42+(21 if row%2 else 0);y=143+row*28;cx,cy=g(x,y);q=4*z
  d.ellipse(((cx-q-1)*S,(cy-q-1)*S,(cx+q+1)*S,(cy+q+1)*S),fill='#503b4d')
  d.ellipse(((cx-q)*S,(cy-q)*S,(cx+q)*S,(cy+q)*S),fill='#e9a972')
  d.ellipse(((cx-2.6)*S,(cy-2.8)*S, (cx-.2)*S,(cy-.4)*S),fill='#fff4cc')
# winning bin emphasis, payout caption attached below the playfield
multipliers=[8,2,1,1,0,1,1,2,8]
colors=['#a37a3e','#755a93','#317d91','#477b7a','#3b3547','#477b7a','#317d91','#755a93','#a37a3e']
for i,m in enumerate(multipliers):
 x=18+i*36
 gr((x+1,394,x+35,428),4,colors[i],'#fff1bc' if i==8 else None,2 if i==8 else 1)
 text(*g(x+18,416),'x'+str(m),10,'#fff',True,'mm')
gr((259,347,343,371),6,'#352539');text(*g(301,364),'x8 +40',10,'#ffedd1',True,'mm')
text(*g(180,442),'8X / +40 TICKETS',8,'#cdb9cb',True,'mm')
# Gabu is anchored near the top-right corner, over the empty machine hood.
paste('assets/plinko/gabu-peek.png',g(264,37)[0],g(37,37)[1],100,100)
# Front trim visually hides the bottom of his jacket for a peeking effect.
rr((g(275,129)[0],g(129,129)[1],g(355,129)[0],g(355,135)[1]),3,'#171923','#ad668b')
# A temporary event-driven speech bubble stays away from the trajectory.
rr((g(8,79)[0],g(79,79)[1],g(139,127)[0],g(139,127)[1]),8,'#302539','#b988a8')
text(*g(17,97),'Predictably',10,'#ffecf8',True)
text(*g(17,112),'pedestrian.',10,'#ffecf8',True)
# A single combined action strip (no second wager row)
rr((27,517,381,556),8,'#211b2d','#4a3b57')
text(36,536,'BET',8,'#d3b6c7',True)
for i,(name,xw) in enumerate([('FREE',63),('1',101),('5',139),('10',177),('25',215)]):
 rr((xw,522,xw+33,551),5,'#9b477a' if name=='5' else '#2d2636','#ffb2d8' if name=='5' else '#59475d')
 text(xw+16.5,537,name,8,'#fff',True,'mm')
rr((251,521,315,552),6,'#67405b','#a87898');text(283,537,'DROP',10,'#fff',True,'mm')
rr((320,521,349,552),5,'#2d2636','#57475f')
d.arc((326*S,529*S,344*S,545*S),35,325,fill='#ded1e5',width=2*S)
d.polygon([(326*S,535*S),(326*S,529*S),(333*S,531*S)],fill='#ded1e5')
rr((353,521,379,552),5,'#2d2636','#57475f')
d.polygon([(357*S,533*S),(362*S,533*S),(367*S,528*S),(367*S,544*S),(362*S,539*S),(357*S,539*S)],outline='#ded1e5',fill=None)
d.arc((364*S,531*S,373*S,541*S),-55,55,fill='#ded1e5',width=2*S)
text(205,582,'THE HOUSE ALWAYS MEOWS',10,'#d7a9c9',True,'mm')
text(205,611,'OFFLINE ART / LAYOUT PREVIEW — NOT A LIVE HUD SCREENSHOT',8,'#93829e',False,'mm')
output=ROOT/'docs/plinko-hud-v2.3.1-preview.png'
im.convert('RGB').save(output,optimize=True)
print(output)
