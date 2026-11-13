#!/usr/bin/env python3
"""Illustrative offline visual QA based on exact SVG assets + renderer palette and geometry.
Not a Chromium capture; no screenshots or generated AI artwork are used.
"""
from pathlib import Path
from io import BytesIO
import cairosvg
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/match3-readability-preview.png'
SCALE=2; W=360;H=452
im=Image.new('RGBA',(W*SCALE,H*SCALE),'#1e222b');d=ImageDraw.Draw(im)
font='/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf'
def f(size):return ImageFont.truetype(font,size*SCALE)
def rect(xy,fill,r=0):
 xy=tuple(v*SCALE for v in xy);d.rounded_rectangle(xy,radius=r*SCALE,fill=fill)
def text(x,y,t,size,color):d.text((x*SCALE,y*SCALE),t,font=f(size),fill=color)
for y in range(H):
 a=y/H;c=tuple(round(a*b+(1-a)*a0) for a0,b in [(30,23),(34,27),(43,36)]);
 d.line((0,y*SCALE,W*SCALE,y*SCALE),fill=c,width=SCALE)
for i in range(13):
 x=(i*73+11)%W;y=(i*113+17)%H;rect((x,y,x+1,y+1),'#323943')
icons={}
for p in (ROOT/'assets/match3/vector').glob('*.svg'):
 data=cairosvg.svg2png(bytestring=p.read_bytes(),output_width=128,output_height=128)
 icons[p.stem]=Image.open(BytesIO(data)).convert('RGBA')
def icon(name,x,y,s):
 sprite=icons[name].resize((s*SCALE,s*SCALE),Image.Resampling.LANCZOS);im.alpha_composite(sprite,(x*SCALE,y*SCALE))
icon('cat',16,13,20);text(42,16,'TRINKET PANIC',12,'#ffe6ef');text(160,16,'SCORE 1900',11,'#fdfaf7');text(292,16,'BEST 1900',11,'#ead4c4')
rect((20,51,340,52),'#444953')
rect((16,67,344,393),'#303540',14);rect((20,71,340,389),'#20242d',11)
board=[
 ['fish','heart','gem','cat','gem','star','fish'],
 ['star','cat','star','fish','cat','star','heart'],
 ['gem','cat','heart','cookie','star','cookie','gem'],
 ['gem','fish','star','gem','cat','fish','heart'],
 ['cookie','star','gem','fish','star','star','cookie'],
 ['fish','fish','heart','fish','cat','cat','heart'],
 ['gem','cat','fish','star','cookie','heart','heart'],
]
for row in range(7):
 for col in range(7):
  x=28+col*44;y=77+row*44
  if row==3 and col==2:rect((x-2,y-2,x+42,y+42),'#8df0ec',10)
  rect((x,y,x+40,y+40),'#32424b' if row==3 and col==2 else ('#292e37' if (row+col)%2 else '#2b303a'),8)
  icon(board[row][col],x+3,y+3,34)
  if row==3 and col==2:
   for xx,yy,w,h in [(x+1,y+1,10,3),(x+1,y+1,3,10),(x+29,y+1,10,3),(x+36,y+1,3,10),(x+1,y+36,10,3),(x+1,y+29,3,10),(x+29,y+36,10,3),(x+36,y+29,3,10)]:rect((xx,yy,xx+w,yy+h),'#8df0ec',1)
text(22,410,'MOVES 008',11,'#bbc4d0');text(266,410,'SPECIALS 1',11,'#bbc4d0')
text(80,434,'TAP TWO NEIGHBORS OR DRAG TO SWAP',8,'#aeb9c4')
OUT.parent.mkdir(exist_ok=True)
im.convert('RGB').save(OUT,optimize=True)
print(OUT)
