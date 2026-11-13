"""Build isolated PNG sprites from the two *known* original AI sprite sheets.

The previous builder used overlapping rectangles, cutting jetpack silhouettes and
including adjacent stars, hearts, cloud fragments and wings. This version selects
specific *foreground connected components* by stable source-image seed points,
then restores their antialiased edges. Only the three-heart cluster needs a
curated crop, since the source artist merged those hearts into one component.

Requirements: Pillow and NumPy (same as the original builder). No OpenCV needed.
Fail before writing if source art changes, seeds disappear, masks merge, or any
output is suspicious. All source sheets stay intact and editable.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import tempfile
from PIL import Image, ImageFilter, ImageOps, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets' / 'source'
SPRITES = ROOT / 'assets' / 'sprites'
COVER = ROOT / 'assets' / 'cover'

# SHA-256 pins prevent someone swapping in a newly generated sheet with different
# packing and silently corrupting otherwise correctly selected sprites.
SOURCES = {
    'bird': ('bird-arcade-sheet.png', '088ef7f4c44785ee0cc019da99a4fd65e593354fd6b557e04dcec6db699f7ae0', (1536,1024)),
    'gabi': ('gabi-jetpack-sheet.png', '973263117ee917e84574f190e1a935372e318b1b8e0982e2bb96622e7cfc1e9f', (1774,887)),
}

# Each tuple: (filename, sheet, (x,y) interior seed pixel, max exported dimension).
# This is explicit per-sprite metadata, NOT a uniform grid or bounding rectangle.
SPECS = [
    *[(f'bird_flap_{i}', 'bird', pt, 200) for i,pt in enumerate([
        (180,132),(395,125),(610,112),(850,125),(1100,132),(1330,123)
    ])],
    ('bird_dizzy','bird',(1040,280),200),
    ('bird_dead','bird',(670,466),200),
    *[(f'gabi_fly_{i}', 'gabi', pt, 240) for i,pt in enumerate([
        (220,160),(479,160),(770,160),(1046,158),(1342,158),(1596,150)
    ])],
    ('gabi_sleep','gabi',(152,475),240),
    ('gabi_surprise','gabi',(385,470),240),
    ('gabi_dizzy','gabi',(650,457),240),
    ('gabi_hurt','gabi',(910,480),240),
    ('gabi_crash','gabi',(1180,470),240),
    ('gabi_dead','gabi',(1483,499),240),
    ('cloud','bird',(720,603),210),
    ('coin','bird',(1075,620),160),
    ('star','bird',(1190,623),160),
    ('bird_logo','gabi',(154,800),240),
    ('ready_banner','bird',(100,758),310),
    ('game_over_banner','bird',(651,784),310),
    ('best_banner','bird',(1025,779),310),
    # Three disconnected flame shapes and the little cat-flag, separated from
    # their neighbors by the same pinned-alpha silhouette extractor.
    ('flame_0','gabi',(573,644),180),
    ('flame_1','gabi',(635,694),180),
    ('flame_2','gabi',(735,675),180),
    ('record_flag','gabi',(1650,660),180),
]

# Confidence bounds for the large groups prevent a misplaced seed silently
# extracting a *different* object with the same approximate shape.
EXPECTED = {
  'bird_flap_0':(80,61,192,129),'bird_flap_1':(302,56,191,133),
  'bird_flap_2':(528,45,188,134),'bird_flap_3':(753,54,197,131),
  'bird_flap_4':(988,57,196,130),'bird_flap_5':(1232,59,196,130),
  'bird_dizzy':(942,233,184,115),'bird_dead':(554,415,189,110),
  'gabi_fly_0':(37,17,317,286),'gabi_fly_1':(332,19,311,291),
  'gabi_fly_2':(612,18,312,291),'gabi_fly_3':(896,17,303,292),
  'gabi_fly_4':(1183,12,291,292),'gabi_fly_5':(1447,16,301,286),
  'gabi_sleep':(15,333,244,249),'gabi_surprise':(258,334,252,240),
  'gabi_dizzy':(517,338,253,245),'gabi_hurt':(770,339,275,246),
  'gabi_crash':(1062,341,258,233),'gabi_dead':(1344,412,339,163),
  'cloud':(623,542,201,118),'coin':(1043,569,86,87),
  'star':(1144,557,104,99),'bird_logo':(24,750,315,124),
  'ready_banner':(70,705,363,145),'game_over_banner':(475,702,355,148),
  'best_banner':(847,688,348,164),
  'flame_0':(557,612,54,62),
  'flame_1':(610,608,68,147),
  'flame_2':(685,608,88,153),
  'record_flag':(1615,587,136,174),
}


def digest(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


class Sheet:
    """Scanline union-find for 8-connected alpha silhouettes; NumPy + PIL only."""
    def __init__(self, key: str):
        filename, expected_hash, size = SOURCES[key]
        raw = (SRC / filename).read_bytes()
        if digest(raw) != expected_hash:
            raise RuntimeError(f'{filename} changed: validate new sprite seeds before editing the source hash')
        self.image = Image.open(SRC / filename).convert('RGBA')
        if self.image.size != size:
            raise RuntimeError(f'{filename} dimensions changed')
        self.array = np.asarray(self.image)
        alpha = self.array[:,:,3]
        h,w = alpha.shape
        self.rows = []
        self.runs = []  # entries (y, x_start, x_end_exclusive, run_id)
        self.parent = []
        self.ranks = []
        previous = []
        for y in range(h):
            bits = alpha[y] > 80
            transitions = np.diff(np.pad(bits.astype(np.int8),(1,1)))
            starts = np.flatnonzero(transitions == 1)
            ends = np.flatnonzero(transitions == -1)
            now = []
            j = 0
            for x0,x1 in zip(starts.tolist(), ends.tolist()):
                i = len(self.parent)
                self.parent.append(i)
                self.ranks.append(0)
                run = (y,x0,x1,i)
                self.runs.append(run); now.append(run)
                while j<len(previous) and previous[j][2] < x0:  # diagonals count as connected
                    j += 1
                k=j
                while k<len(previous) and previous[k][1] <= x1:
                    self.union(i,previous[k][3]); k+=1
            self.rows.append(now)
            previous=now
        self.components={}
        for y,x0,x1,i in self.runs:
            r=self.find(i)
            c=self.components.setdefault(r,{'x0':w,'y0':h,'x1':0,'y1':0,'area':0,'runs':[]})
            c['x0']=min(c['x0'],x0); c['x1']=max(c['x1'],x1)
            c['y0']=min(c['y0'],y); c['y1']=max(c['y1'],y+1)
            c['area']+=x1-x0
            c['runs'].append((y,x0,x1))

    def find(self,n):
        while self.parent[n]!=n:
            self.parent[n]=self.parent[self.parent[n]]
            n=self.parent[n]
        return n

    def union(self,a,b):
        a=self.find(a);b=self.find(b)
        if a==b:return
        if self.ranks[a]<self.ranks[b]:a,b=b,a
        self.parent[b]=a
        if self.ranks[a]==self.ranks[b]:self.ranks[a]+=1

    def select(self, point: tuple[int,int], name: str):
        x,y=point
        matches=[self.find(i) for _,x0,x1,i in self.rows[y] if x0<=x<x1]
        if len(matches)!=1:
            raise RuntimeError(f'{name}: seed {point} not inside exactly one solid silhouette')
        c=self.components[matches[0]]
        box=(c['x0'],c['y0'],c['x1']-c['x0'],c['y1']-c['y0'])
        expected=EXPECTED[name]
        if any(abs(a-b)>4 for a,b in zip(box,expected)) or c['area']<1500:
            raise RuntimeError(f'{name}: ambiguous silhouette bounds {box}, expected {expected}')
        return c, box


def normalize_sprite(im: Image.Image, max_dim: int) -> Image.Image:
    bbox=im.getchannel('A').getbbox()
    if bbox is None: raise RuntimeError('Empty sprite')
    im=im.crop(bbox)
    im.thumbnail((max_dim,max_dim),Image.Resampling.LANCZOS)
    # Identical transparent padding for all independent frames; Canvas will fit
    # them by their real aspect ratio, not by a made-up sprite-sheet cell.
    return ImageOps.expand(im,border=4,fill=(0,0,0,0))


def extract(sheet: Sheet, component: dict, max_dim: int) -> Image.Image:
    border=7
    x0=max(0,component['x0']-border);y0=max(0,component['y0']-border)
    x1=min(sheet.image.width,component['x1']+border)
    y1=min(sheet.image.height,component['y1']+border)
    shape=(y1-y0,x1-x0)
    core=np.zeros(shape,dtype=np.uint8)
    for y,a,b in component['runs']:
        core[y-y0,a-x0:b-x0]=255
    growth=np.asarray(Image.fromarray(core,'L').filter(ImageFilter.MaxFilter(9))).copy()
    # Prevent nearby detached highlights or neighboring animation cells from
    # becoming part of a selected sprite, even when their AA halos touch.
    cropped=sheet.image.crop((x0,y0,x1,y1))
    arr=np.array(cropped,dtype=np.uint8)
    other=np.logical_and(arr[:,:,3]>80,core==0)
    growth[other]=0
    arr[:,:,3]=(arr[:,:,3].astype(np.uint16)*growth.astype(np.uint16)//255).astype(np.uint8)
    arr[:,:,3][arr[:,:,3]<25]=0
    return normalize_sprite(Image.fromarray(arr,'RGBA'),max_dim)


def one_heart(sheet: Sheet) -> Image.Image:
    # The artist outlined three touching hearts as a *single* connected shape.
    # A hand-confirmed left-heart ROI avoids the second/third hearts, while a
    # soft alpha cut gives its right outline room to breathe.
    roi=(1267,574,1348,652)
    arr=np.array(sheet.image.crop(roi),dtype=np.uint8)
    h,w=arr.shape[:2]
    # Hard safety assertion: the first heart must have substantial core pixels.
    if int(np.count_nonzero(arr[:,:,3]>100)) < 1800:
        raise RuntimeError('First heart changed / manual separator is stale')
    # The touch point at the right edge belongs to the following heart.
    # Feather only last 2 columns to avoid a hard square cut in the dark rim.
    taper=np.ones(w,dtype=np.float32)
    taper[-2:]=[0.55,0.0]
    arr[:,:,3]=(arr[:,:,3].astype(np.float32)*taper[None,:]).astype(np.uint8)
    arr[:,:,3][arr[:,:,3]<30]=0
    return normalize_sprite(Image.fromarray(arr,'RGBA'),118)


def render_preview(outdir: Path):
    names=[x[0] for x in SPECS]+['heart']
    cols=6; cell_w=195; cell_h=184
    rows=(len(names)+cols-1)//cols
    board=Image.new('RGB',(cols*cell_w, rows*cell_h+50),(29,25,46))
    painter=ImageDraw.Draw(board)
    painter.text((15,13),'BIRD BRAIN - ISOLATED SPRITES v1.2',fill=(255,219,241))
    for i,name in enumerate(names):
        sprite=Image.open(outdir/(name+'.png')).convert('RGBA')
        sprite.thumbnail((cell_w-18,cell_h-37),Image.Resampling.LANCZOS)
        x=(i%cols)*cell_w; y=(i//cols)*cell_h+44
        # Compositing through the alpha channel avoids falsely showing halos.
        board.paste(sprite,(x+(cell_w-sprite.width)//2,y+6),sprite)
        painter.text((x+12,y+cell_h-25),name,fill=(255,232,248))
        painter.rectangle((x+2,y+2,x+cell_w-3,y+cell_h-3),outline=(62,51,83),width=1)
    return board


def make_icon(gabi: Image.Image) -> Image.Image:
    icon=Image.new('RGBA',(256,256),(16,14,34,255))
    d=ImageDraw.Draw(icon)
    d.rounded_rectangle((3,3,252,252),radius=62,fill=(26,20,52,255),outline=(249,108,151,255),width=8)
    d.ellipse((36,39,221,220),fill=(91,42,116,220))
    im=gabi.copy();im.thumbnail((218,218),Image.Resampling.LANCZOS)
    icon.alpha_composite(im,((256-im.width)//2,(256-im.height)//2))
    return icon


def build():
    # Validate source IDs, dimensions, and silhouettes before touching existing outputs.
    sheets={name:Sheet(name) for name in SOURCES}
    selected=[]
    for name,key,point,size in SPECS:
        c,box=sheets[key].select(point,name)
        selected.append((name,key,point,size,c,box))
    manifest={ 'version':2, 'method':'seeded-connected-component-alpha', 'threshold':80,
               'assets':{}, 'source_sha256':{key:sha for key,(_,sha,_) in SOURCES.items()}}
    with tempfile.TemporaryDirectory(prefix='bird-brain-assets-') as tmp:
        staging=Path(tmp)
        for name,key,point,size,component,box in selected:
            im=extract(sheets[key],component,size)
            im.save(staging/(name+'.png'),optimize=True)
            manifest['assets'][name]={'source':key,'seed':point,'source_bounds':box,
                                      'component_pixels':component['area'],'size':list(im.size),
                                      'sha256':digest((staging/(name+'.png')).read_bytes())}
        heart=one_heart(sheets['bird'])
        heart.save(staging/'heart.png',optimize=True)
        manifest['assets']['heart']={'source':'bird','source_bounds':[1267,574,81,78],
                                     'method':'curated-single-heart','size':list(heart.size),
                                     'sha256':digest((staging/'heart.png').read_bytes())}
        preview=render_preview(staging)
        preview.save(staging/'sprite-preview.png',optimize=True)
        icon=make_icon(Image.open(staging/'gabi_fly_5.png').convert('RGBA'))
        icon.save(staging/'icon.png',optimize=True)
        (staging/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
        # The approved cover is deliberately left alone. Test actual opacity,
        # margins, checksums, and the number of final unique asset names first.
        names=[x[0] for x in SPECS]+['heart']
        if len(names)!=len(set(names)) or len(names)!=32:
            raise RuntimeError(f'Expected 32 unique sprites; found {len(names)}')
        for name in names:
            im=Image.open(staging/(name+'.png'))
            if im.mode!='RGBA' or min(im.size)<20 or im.getchannel('A').getbbox() is None:
                raise RuntimeError(f'{name} failed transparency/size validation')
            a=np.asarray(im.getchannel('A'))
            if np.any(a[0]) or np.any(a[-1]) or np.any(a[:,0]) or np.any(a[:,-1]):
                raise RuntimeError(f'{name} has no transparent boundary')
        SPRITES.mkdir(parents=True,exist_ok=True);COVER.mkdir(parents=True,exist_ok=True)
        for name in names:
            os.replace(staging/(name+'.png'),SPRITES/(name+'.png'))
        os.replace(staging/'manifest.json',SPRITES/'manifest.json')
        os.replace(staging/'sprite-preview.png',COVER/'sprite-preview.png')
        os.replace(staging/'icon.png',COVER/'icon.png')
    print(f'Validated and rebuilt {len(names)} isolated sprite PNGs, preview, icon, and manifest')

if __name__=='__main__':build()
