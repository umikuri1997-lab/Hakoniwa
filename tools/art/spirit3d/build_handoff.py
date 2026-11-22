"""トモリ・ツキミの部品と3Dの動きの絵を引き継ぎ用フォルダに出す。

python3 tools/art/spirit3d/build_handoff.py handoff/files/H-4
動きの名前を続けて渡すと、指定した動きだけ写す。
"""
import argparse
from concurrent.futures import ProcessPoolExecutor
from functools import partial
import json
from math import pi
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

import build
from core import EXT, chip, view
from light_dark import LightDark, rgb
from motions import MOTIONS
from rig import shoot

ELEMENTS = ('light','dark')
REVIEW_MOTIONS = ('walk','walk_hp','walk_hn','talk','talkjoy','wave',
                  'sitfront','sleepcurl','leanon','qspin','dance')
FACES = ('front','side','back')
POSE = {'bN': .35, 'bF': .35}
FONT = Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')


def part_image(mesh, face):
    """点の一番手前の色を1ドットに写す。足もとからの位置も返す。"""
    points, pigment = mesh
    x,y,z = view(face)(points)
    columns = np.floor(x).astype(int)
    rows = np.floor(y).astype(int)
    left, top = int(columns.min()),int(rows.min())
    width = int(columns.max())-left+1
    height = int(rows.max())-top+1
    ids = (rows-top)*width+columns-left
    order = np.lexsort((z,ids))
    last = np.r_[ids[order[1:]]!=ids[order[:-1]],True]
    front = order[last]
    image = np.zeros((height*width,4),np.uint8)
    image[ids[front],:3] = pigment[front]
    image[ids[front],3] = 255
    return Image.fromarray(image.reshape(height,width,4)),left,top


def write_parts(spirit, out):
    records = {}
    for name, mesh in spirit.tex.items():
        points, pigments = mesh
        for face, suffix in ((0,''),(1,'S')):
            image,left,top = part_image((points,pigments[face]),face)
            key = spirit.E+name+suffix
            file = key.replace(':','_')+'.png'
            image.save(out/file,optimize=True)
            records[key] = {'file': 'parts/'+file, 'ax':left,'ay':top,
                            'w':image.width,'h':image.height,'g':64}
    for name, mesh in (('tail',spirit.tail[:2]),('chest',spirit.chest),('cape',spirit.cape)):
        if mesh is None:
            continue
        view_index = 1 if name=='tail' else 0
        image,left,top = part_image(mesh,view_index)
        key = spirit.E+name
        file = key.replace(':','_')+'.png'
        image.save(out/file,optimize=True)
        records[key] = {'file':'parts/'+file,'ax':left,'ay':top,
                        'w':image.width,'h':image.height,'g':64}
    return records


def add_eyes(image, overlay, eye, color, origin, expression='n'):
    dx,dy,face,mir = eye
    if face in (0,1):
        pixels,x,y = chip('sp:face'+('S' if face else '')+'#'+expression)
        pixels = pixels.copy()
        pixels[pixels[...,3]>0,:3] = rgb(color)
        eyes = Image.fromarray(pixels)
        if mir:
            x = -x-eyes.width
            eyes = eyes.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        image.alpha_composite(eyes,(x+dx-origin[0],y+dy-origin[1]))
    if overlay is not None:
        image.alpha_composite(overlay)
    return image


def still_sheet(spirits, out):
    scale = 2
    cell = (144*scale,123*scale)
    # 左向きは横のカメラを半周させ、同じ立体を反対から写す。
    views = ((0,0),(1,0),(2,0),(1,pi))
    sheet = Image.new('RGB',(cell[0]*len(views),cell[1]*2+40),'#f4eee8')
    draw = ImageDraw.Draw(sheet)
    japanese = FONT.is_file()
    font = ImageFont.truetype(str(FONT),17) if japanese else ImageFont.load_default()
    names = ('トモリ','ツキミ') if japanese else ('Tomori','Tsukimi')
    direction_labels = ('正面','右','背面','左') if japanese else ('front','right','back','left')
    for i,spirit in enumerate(spirits):
        for j,(face,spin) in enumerate(views):
            label = direction_labels[j]
            pixels,over,anchors = shoot(spirit,face,{**POSE,'spin':spin})
            image = add_eyes(Image.fromarray(pixels),Image.fromarray(over),
                             anchors['eye'],spirit.desc['eye'],(EXT[0],EXT[2]))
            image = image.crop((0,10,144,133)).resize(cell,Image.Resampling.NEAREST)
            x,y = j*cell[0], i*(cell[1]+20)
            draw.rectangle((x+3,y+21,x+cell[0]-4,y+cell[1]+16),
                           fill=('#ede8e2','#ede5f2')[i])
            space = '　' if japanese else '  '
            draw.text((x+15,y+1),f'{names[i]}{space}{label}',font=font,fill='#4a4149')
            sheet.paste(image,(x,y+20),image)
    sheet.save(out/'character-views.png',optimize=True)


def motion_cell(sheet, motion, element, frame, face, eye, expression='n'):
    g = motion['g'][element]
    w,h,ax,ay = g[:4]
    tile = sheet.crop((frame*w,face*h,(frame+1)*w,(face+1)*h))
    over = None
    if len(g)>4 and g[5]:
        oy,oh = g[4:]
        over = Image.new('RGBA',tile.size)
        start = h*3+face*oh
        over.paste(sheet.crop((frame*w,start,(frame+1)*w,start+oh)),(0,oy))
    return add_eyes(tile,over,motion['e'][element][face][frame],eye,
                    (ax,ay),expression)


def preview_walk(out, paths, spm, spirits):
    frames = []
    info = spm['walk']
    for frame in range(info['n']):
        combined = Image.new('RGB',(356,252),'#f4eee8')
        for row,spirit in enumerate(spirits):
            el = spirit.el
            ax,ay = info['g'][el][2:4]
            for face in range(3):
                tile = motion_cell(paths[el],info,el,frame,face,spirit.desc['eye'])
                x = face*118+58+ax
                y = row*126+116+ay
                combined.paste(tile,(x,y),tile)
        frames.append(combined)
    frames[0].save(out/'walk.gif',save_all=True,append_images=frames[1:],
                   loop=0,duration=round(1000/(info['n']*info['r'])),optimize=True)


def preview_actions(out, motions, colors):
    samples = (('walk','歩く','Walk',2,0,'n'), ('talkjoy','話す','Talk',4,0,'n'),
               ('sleepcurl','眠る','Sleep',1,1,'shut'))
    if not all(name in motions for name,*_ in samples):
        return
    sheet = Image.new('RGB',(786,536),'#f4eee8')
    draw = ImageDraw.Draw(sheet)
    japanese = FONT.is_file()
    font = ImageFont.truetype(str(FONT),16) if japanese else ImageFont.load_default()
    for row,el in enumerate(ELEMENTS):
        name = (('トモリ','ツキミ') if japanese else ('Tomori','Tsukimi'))[row]
        for col,(key,ja,en,frame,face,expression) in enumerate(samples):
            motion = motions[key]
            with Image.open(out/motion['s'][el]) as src:
                tile = motion_cell(src.convert('RGBA'),motion,el,frame,face,
                                   colors[el]['eye'],expression)
            x,y = col*262+6,row*268+4
            draw.rounded_rectangle((x,y,x+250,y+257),10,
                                   fill='#fff6da' if el=='light' else '#ede5f2')
            draw.text((x+12,y+10),f'{name}  {ja if japanese else en}',
                      font=font,fill='#4a4149')
            art = tile.resize((tile.width*2,tile.height*2),Image.Resampling.NEAREST)
            sheet.paste(art,(x+125-art.width//2,y+248-art.height),art)
    sheet.save(out/'motion-views.png',optimize=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    parser.add_argument('motion', nargs='*', metavar='MOTION')
    parser.add_argument('--all', action='store_true', help='全動作を写す')
    args = parser.parse_args()
    selected = tuple(MOTIONS) if args.all else args.motion or REVIEW_MOTIONS
    if any(name not in MOTIONS for name in selected):
        parser.error('動きの名前が見つからない')
    out = args.output
    parts = out/'parts'
    motions = out/'motions'
    parts.mkdir(parents=True,exist_ok=True)
    motions.mkdir(exist_ok=True)
    spirits = [LightDark(el) for el in ELEMENTS]
    records = {}
    for spirit in spirits:
        records.update(write_parts(spirit,parts))
    still_sheet(spirits,out)
    manifest = {'parts':records,'colors':{spirit.el:spirit.desc for spirit in spirits},
                'directions':FACES,'motions':{}}
    walks = {}
    with ProcessPoolExecutor(max_workers=2) as pool:
        for name,el,raw,geo,eyes,hands in pool.map(partial(build.job,factory=LightDark),
                                                  [(n,e) for n in selected for e in ELEMENTS]):
            fname = f'{name}_{el}.webp'
            (motions/fname).write_bytes(raw)
            motion = manifest['motions'].setdefault(name,{'n':MOTIONS[name]['n'],
                     'r':MOTIONS[name]['rate'],'s':{},'g':{},'e':{},'h':hands})
            motion['s'][el] = 'motions/'+fname
            motion['g'][el] = geo
            motion['e'][el] = eyes
            if name=='walk':
                walks[el] = Image.open(motions/fname).convert('RGBA')
            print(name,el,flush=True)
    if walks:
        preview_walk(out,walks,manifest['motions'],spirits)
    preview_actions(out,manifest['motions'],manifest['colors'])
    (out/'sprites.json').write_text(json.dumps(manifest,ensure_ascii=False,
                                              separators=(',',':'))+'\n')


if __name__=='__main__':
    main()
