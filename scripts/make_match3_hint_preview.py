from pathlib import Path
import json,math,io
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import cairosvg
ROOT=Path(__file__).resolve().parent.parent
states=json.loads((ROOT/'docs/match3-preview-data.json').read_text())
colors={'bg':'#171b24','header':'#1e222b','board':'#303540','well':'#20242d','cella':'#2b303a','cellb':'#292e37','ink':'#fbf3ef','muted':'#bbc4d0'}
try:
 font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',13)
 fontsm=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',10)
 fontlg=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',23)
except OSError:
 font=ImageFont.load_default();fontsm=font;fontlg=font
sprites={}
for kind in ['cat','heart','star','fish','cookie','gem','hint']:
 p=ROOT/'assets/match3/vector'/f'{kind}.svg'
 b=cairosvg.svg2png(bytestring=p.read_bytes(),output_width=128,output_height=128)
 sprites[kind]=Image.open(io.BytesIO(b)).convert('RGBA')
def one(state):
 width=state['width'];n=7
 step=min(44,312//width);cell=step-4;span=width*step-4
 X=round((360-span)/2);Y=77+round((304-(n*step-4))/2)
 img=Image.new('RGBA',(360,452),'#1e222b');d=ImageDraw.Draw(img)
 d.rounded_rectangle((0,0,359,451),radius=12,fill=colors['header'])
 d.text((18,16),'TRINKET PANIC',fill='#ffe6ef',font=font)
 d.text((177,17),f"SCORE {state['score']}",fill='#fdfaf7',font=fontsm)
 d.text((296,34),f"{width} x 7",fill='#d0f0e8',font=fontsm)
 d.rectangle((20,51,340,52),fill='#444953')
 d.rounded_rectangle((16,67,344,393),radius=14,fill=colors['board'])
 d.rounded_rectangle((20,71,340,389),radius=11,fill=colors['well'])
 for ix,tile in enumerate(state['board']):
  r,c=divmod(ix,width);x=X+c*step;y=Y+r*step
  d.rounded_rectangle((x,y,x+cell,y+cell),radius=8,fill=colors['cella'] if (r+c)%2==0 else colors['cellb'])
  art=sprites[tile['kind']].resize((cell-6,cell-6),Image.Resampling.LANCZOS)
  img.alpha_composite(art,(x+3,y+3))
 if state['hint']:
  for ix in state['hint']:
   r,c=divmod(ix,width);x=X+c*step;y=Y+r*step
   d.rounded_rectangle((x-2,y-2,x+cell+2,y+cell+2),radius=9,outline='#9aeee7',width=3)
   art=sprites['hint'].resize((17,17),Image.Resampling.LANCZOS)
   img.alpha_composite(art,(x+cell-12,y-5))
 d.text((20,410),f"MOVES {state['moves']:03d}",fill=colors['muted'],font=fontsm)
 d.text((237,410),'SPECIALS 1',fill=colors['muted'],font=fontsm)
 text='GABU FOUND A SWAP' if state['hint'] else 'NO MOVES LEFT'
 d.text((180,442),text,anchor='ms',fill='#8de9df' if state['hint'] else '#ffb1c8',font=fontsm)
 if state['status']=='dead':
  veil=Image.new('RGBA',img.size,(0,0,0,0));vd=ImageDraw.Draw(veil)
  vd.rectangle((0,54,359,451),fill=(11,17,24,176))
  vd.rounded_rectangle((37,175,323,269),radius=13,fill='#26313d',outline='#cb719e',width=2)
  vd.text((180,208),'NO MOVES LEFT',anchor='mm',fill='#fff0f5',font=fontlg)
  vd.text((180,241),'NEW BOARD TO RETRY',anchor='mm',fill='#c7d5de',font=fontsm)
  img=Image.alpha_composite(img,veil)
 return img
panels=[one(s) for s in states];g=20;W=360*4+g*5;H=516
out=Image.new('RGBA',(W,H),'#100f1b');d=ImageDraw.Draw(out)
for i,(s,panel) in enumerate(zip(states,panels)):
 x=g+(360+g)*i
 d.rounded_rectangle((x-2,42,x+362,498),radius=12,fill='#4a354f')
 out.alpha_composite(panel,(x,44))
 labels=['COZY • 6 COLUMNS','CLASSIC • 7 COLUMNS','BUSY • 8 COLUMNS','NO-MOVES FAIL STATE']
 d.text((x+7,19),labels[i],fill='#f1dcea',font=font)
out.save(ROOT/'docs/match3-v2.3.3-hints-and-widths-preview.png')
print(ROOT/'docs/match3-v2.3.3-hints-and-widths-preview.png')
