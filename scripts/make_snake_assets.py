"""Generate crisp, transparent original Snake sprites for Fuckass Funzone.

All art is drawn at 4x resolution and antialiased on export. No external
images/fonts or emoji sprites. Re-running this is deterministic and offline.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import math

ROOT=Path(__file__).resolve().parents[1]
DST=ROOT/'assets'/'funzone'
DARK='#25102f'
BORDER='#3b173e'
PINK='#ef5799'
LIGHT='#ffb4d9'
S=4

def make():
 im=Image.new('RGBA',(128*S,128*S),(0,0,0,0))
 d=ImageDraw.Draw(im)
 def box(b):return tuple(int(v*S) for v in b)
 def xy(points):return [(round(x*S),round(y*S)) for x,y in points]
 def oval(b,fill,outline=None,width=1):d.ellipse(box(b),fill=fill,outline=outline,width=int(width*S))
 def rect(b,r,fill,outline=None,width=1):d.rounded_rectangle(box(b),radius=round(r*S),fill=fill,outline=outline,width=round(width*S))
 def poly(points,fill,outline=None,width=1):d.polygon(xy(points),fill=fill);d.line(xy(points+[points[0]]),fill=outline,width=round(width*S),joint='curve') if outline else None
 def line(points,fill,width=2,joint='curve'):d.line(xy(points),fill=fill,width=round(width*S),joint=joint)
 def save(name):
  im.resize((128,128),Image.Resampling.LANCZOS).save(DST/name,optimize=True)
 return im,d,oval,rect,poly,line,save

def head():
 im,d,O,R,P,L,save=make()
 # Forked tongue and neck sit behind the head and remain visible on rotations.
 L([(111,84),(123,86)],'#ff7bad',5)
 L([(120,86),(125,80)],'#ff7bad',3)
 L([(120,86),(125,92)],'#ff7bad',3)
 O((16,38,109,114),DARK)
 O((20,42,105,110),PINK)
 O((18,62,52,105),'#be3a83')
 # Side-profile rounded snout, outlined as part of the head.
 R((66,63,119,102),17,DARK)
 R((70,67,114,98),13,'#f477ae')
 O((80,82,112,99),'#ff9cc6')
 # Top crest gives the snake a distinctive silhouette even at 22px.
 P([(40,46),(37,23),(56,35),(67,20),(78,40),(89,30),(95,51)],DARK)
 P([(44,48),(42,30),(57,43),(67,27),(76,46),(85,36),(88,54)],'#a65ade')
 P([(48,47),(61,36),(67,47)],'#e99aff')
 # Muzzle line and nostril.
 L([(92,95),(103,95),(110,90)],'#92335f',3)
 O((103,77,108,82),DARK)
 # Huge high-contrast eye, looking FORWARD in the direction of travel.
 O((64,48,98,84),DARK)
 O((67,51,95,80),'#fff5fc')
 O((76,52,91,76),'#ffbd63')
 O((79,54,91,71),'#843759')
 O((84,57,89,67),'#190f35')
 O((80,55,85,60),'#ffffff')
 # Smile / blush / gleam.
 O((54,88,69,94),'#ff9ec0')
 L([(51,92),(55,88)],'#ffcfdf',2)
 O((36,54,50,63),'#ffabd7')
 save('snake-head.png')

def fruit(name):
 im,d,O,R,P,L,save=make()
 if name=='apple':
  O((21,31,106,115),DARK);O((26,35,100,109),'#ef4568')
  O((34,39,81,94),'#ff607f');O((37,47,56,65),'#ffa6bd')
  L([(64,41),(70,17)],DARK,8);L([(64,39),(70,19)],'#905a45',4)
  O((67,14,100,31),DARK);O((72,18,96,29),'#70dc99')
 elif name=='berry':
  for b in [(17,56,62,104),(48,31,100,93),(74,59,112,103)]:O(b,DARK)
  for b in [(22,60,59,98),(52,35,96,89),(77,63,108,98)]:O(b,'#6a72ee')
  for b in [(31,65,43,77),(65,42,79,56),(88,68,98,79)]:O(b,'#bbe8ff')
  P([(44,34),(55,17),(65,33),(73,17),(80,34)],'#75d7b0',DARK,3)
 elif name=='star':
  points=[]
  for i in range(10):
   a=-math.pi/2+i*math.pi/5
   r=54 if i%2==0 else 25
   points.append((64+math.cos(a)*r,64+math.sin(a)*r))
  P(points,DARK);pts=[]
  for i in range(10):
   a=-math.pi/2+i*math.pi/5
   r=46 if i%2==0 else 21
   pts.append((64+math.cos(a)*r,64+math.sin(a)*r))
  P(pts,'#ffc74f');O((46,46,62,61),'#fff5b0')
  O((51,70,57,77),DARK);O((75,70,81,77),DARK)
  d.arc(tuple(int(v*S) for v in (57,67,78,91)),5,170,fill=DARK,width=3*S)
 elif name=='fish':
  P([(24,57),(5,32),(10,92)],DARK)
  P([(23,58),(11,43),(13,83)],'#ffb74f')
  O((18,37,116,97),DARK)
  O((23,41,109,92),'#ffb65e')
  O((32,46,74,62),'#ffe1ab')
  O((81,60,93,73),'#fff8fb')
  O((86,64,91,71),DARK)
  L([(42,79),(48,84)],'#df6a72',4)
  P([(38,38),(53,18),(70,39)],DARK)
  P([(42,38),(54,24),(65,40)],'#ff8b92')
 elif name=='cookie':
  O((13,15,115,117),DARK);O((19,21,109,111),'#d49268')
  O((28,31,99,99),'#efbc7d')
  for b in [(40,39,55,54),(72,33,89,50),(31,66,47,82),(73,73,91,89),(55,92,65,100)]:O(b,'#7c4567')
  O((34,28,50,43),'#ffdfab')
 elif name=='candy':
  P([(31,46),(7,30),(11,100),(34,85)],DARK)
  P([(34,49),(14,40),(17,87),(36,82)],'#cd80ef')
  P([(95,46),(120,29),(119,100),(94,85)],DARK)
  P([(94,49),(114,40),(112,88),(92,82)],'#df83e9')
  O((29,29,101,103),DARK)
  O((34,35,96,97),'#f77fba')
  O((45,43,69,62),'#ffcadc')
  L([(55,80),(84,50)],'#fff1bb',9)
 else: raise ValueError(name)
 save(f'snake-food-{name}.png')

if __name__=='__main__':
 DST.mkdir(parents=True,exist_ok=True)
 head()
 for name in ['apple','berry','star','fish','cookie','candy']:fruit(name)
 # Old asset filename stays present for backwards-compatible tooling.
 (DST/'snake-snack.png').write_bytes((DST/'snake-food-apple.png').read_bytes())
 print('Wrote Snake head and 6 individual food PNGs into',DST)
