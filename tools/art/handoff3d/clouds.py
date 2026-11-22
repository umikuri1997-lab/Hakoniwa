"""H-9 A案。雲の海128×128、がけ64×36、雲の橋64×64。"""

import json
from math import pi
from pathlib import Path
import random
import subprocess

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'handoff/files/H-9'
SEA = [(157,194,224), (174,208,233), (191,220,239),
       (209,231,244), (226,239,246), (240,245,246), (250,248,239)]
CREAM = [(195,211,224), (209,213,219), (228,218,203),
         (244,232,208), (253,243,222), (255,250,236)]


def grid(w, h):
    y, x = np.mgrid[:h, :w]
    return x.astype(float), y.astype(float)


def ellipse(x, y, cx, cy, rx, ry, width=None, height=None):
    dx, dy = x-cx, y-cy
    if width:
        dx = (dx + width/2) % width - width/2
    if height:
        dy = (dy + height/2) % height - height/2
    return 1 - (dx/rx)**2 - (dy/ry)**2


def sea():
    n = 128
    x, y = grid(n, n)
    rng = random.Random(913)
    col = np.zeros((n,n), dtype=np.uint8)
    broad = .56*np.cos((2*y+x)*2*pi/n) + .44*np.sin((y-x)*2*pi/n)
    col[broad > -.24] = 1
    col[broad > .48] = 2
    banks = [(12,15,1), (76,6,0), (122,47,1), (46,43,0),
             (85,68,1), (10,87,0), (49,104,1), (108,112,0)]
    for cx, cy, near in banks:
        puffs = []
        for j in range(5):
            px = cx+(j-2)*10+rng.randint(-3,3)
            py = cy-(j-2)*3+rng.randint(-3,3)
            puffs.append((px, py, rng.randint(11,18), rng.randint(7,12)))
        cloud = np.maximum.reduce([ellipse(x,y,*p,n,n) for p in puffs])
        shade = np.maximum.reduce([
            ellipse(x,y,px+2,py+4,rx+2,ry+2,n,n) for px,py,rx,ry in puffs
        ])
        light = np.maximum.reduce([
            ellipse(x,y,px-2,py-2,rx-2,ry-2,n,n) for px,py,rx,ry in puffs
        ])
        col[shade > 0] = 2 + near
        col[cloud > 0] = 3 + near
        col[light > .10] = 4 + near
        col[light > .53] = 5 + near
    return Image.fromarray(np.array(SEA,dtype=np.uint8)[col])


def bridge_fields(vertical):
    x, y = grid(64,64)
    along, across = (y,x) if vertical else (x,y)
    middle = 32 if vertical else 30
    # The asymmetric shading stays at the upper-left in both directions.
    puffs = [(s, middle+offset, length, radius) for s,offset,length,radius in
             ((0,0,10,17),(8,-2,9,17),(16,1,11,17),(27,-1,10,18),
              (38,2,10,16),(48,-2,11,17),(57,0,10,17))]
    body = np.maximum.reduce([
        ellipse(along,across,s,c,l,r,64) for s,c,l,r in puffs
    ])
    shadow = np.maximum.reduce([
        ellipse(along,across,s+1,c+4,l+1,r+1,64) for s,c,l,r in puffs
    ])
    glow = np.maximum.reduce([
        ellipse(along,across,s-2,c-4,l-2,r-5,64) for s,c,l,r in puffs
    ])
    return np.stack((body, shadow, glow))


def bridge_pixels(fields):
    body, shadow, glow = fields
    rgb = np.zeros((64,64,4), dtype=np.uint8)
    for mask, index, alpha in ((shadow>0,0,112),(shadow>.18,1,190),(body>0,2,255),
                               (body>.21,3,255),(glow>0,4,255),(glow>.42,5,255)):
        rgb[mask] = (*CREAM[index], alpha)
    return Image.fromarray(rgb)


BRIDGE_MASKS = (5, 6, 7, 9, 10, 11, 13, 14, 15)


def junction(mask, horizontal, vertical):
    x, y = grid(64, 64)
    inner = np.stack((
        ellipse(x, y, 32, 30, 19, 19),
        ellipse(x, y, 35, 34, 20, 20),
        ellipse(x, y, 29, 26, 15, 14),
    ))
    # One surface and one contour, so the arm shadows never cross the bend.
    for bit, side, fields in ((1, x <= 32, horizontal), (2, x >= 32, horizontal),
                              (4, y <= 30, vertical), (8, y >= 30, vertical)):
        if mask & bit:
            inner = np.where(side, np.maximum(inner, fields), inner)
    return bridge_pixels(inner)


def cliff():
    w,h = 64,36
    x,y = grid(w,h)
    bend = np.rint(1.4*np.cos(2*pi*x/64)+.7*np.cos(6*pi*x/64))
    # Lithic columns meet at irregular vertical joints. Height follows the ground mask.
    offset = np.searchsorted([8,21,31,46,56],x)
    bias = np.array([1,8,0,9,3,1])[offset]
    joint = np.isin(x, [8,21,31,46,56])
    ledge = y == 11+bend + (offset%3)
    start = 2
    top = y-start
    bottom = 27+bend
    colors = np.array([(149,135,119),(171,154,133),(189,173,149),
                       (206,191,167),(220,207,181),(181,192,198),
                       (169,193,213)],dtype=np.uint8)
    index = np.where(bias >= 8, 3, 2)
    index = np.where(joint, 1, index)
    index = np.where(ledge, 3, index)
    index = np.where(top < 3, np.where(top == 0, 4, 1), index)
    index = np.where(y >= bottom-7, 5, index)
    index = np.where(y >= bottom-2, 6, index)
    alpha = np.select([top<0, y<bottom-7, y<bottom-4, y<bottom,
                       y<bottom+3, y<bottom+6],
                      [0,255,208,160,104,48],default=0).astype(np.uint8)
    return Image.fromarray(np.dstack((colors[index],alpha)))


def capture_old():
    world = (ROOT/'js/draw-world.js').read_text()
    wind = (ROOT/'js/wind.js').read_text()
    source = """
    let ops=[];
    let c={fillRect(x,y,w,h){ops.push([x,y,w,h,this.fillStyle])}};
    const document={createElement(){return {getContext(){return c}}}};
    function mulberry(a){return ()=>{let t=a+=0x6D2B79F5;
      t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);
      return ((t^t>>>14)>>>0)/4294967296}}
    const W=1,H=1,TS=32,LIFT=0,S={},WNS=S,WN={dir:[1],br:[1]};
    const windOn=()=>true, hash=()=>0;
    const isoLv=()=>0,isoGroundLv=()=>{},groundTf=()=>{},dpr=1,cam={z:1};
    """
    source += world[world.index('let SKYTEX=null'):world.index('\n',world.index('const SKYFACE='))+1]
    source += wind[wind.index('function drawWindGround'):wind.index('    /* 風のすじ：')]
    source += """
    }}
    skyTex();const sea=ops;
    ops=[];drawWindGround(c,0,0,1,1,0);const horizontal=ops;
    ops=[];WN.dir[0]=0;drawWindGround(c,0,0,1,1,0);const vertical=ops;
    console.log(JSON.stringify({sea,horizontal,vertical,face:SKYFACE,height:SKYFH}));
    """
    return json.loads(subprocess.check_output(['node','-'],input=source,text=True))


def captured_rects(ops, size):
    image = Image.new('RGBA',size)
    draw = ImageDraw.Draw(image)
    for x,y,w,h,color in ops:
        draw.rectangle((x,y,x+w-1,y+h-1),fill=color)
    return image


def assembled(tile, wall, horizontal, vertical, corner=None):
    image = Image.new('RGBA',(256,256))
    for y in (0,128):
        for x in (0,128):
            image.paste(tile,(x,y))
    for x in (128,192):
        image.alpha_composite(wall,(x,96))
    d = ImageDraw.Draw(image)
    d.rounded_rectangle((128,49,255,97),radius=12,fill='#b6ca83')
    d.rectangle((140,74,248,96),fill='#b6ca83')
    image.alpha_composite(horizontal,(0,48))
    image.alpha_composite(horizontal if corner is None else corner,(64,48))
    for y in ((78,142) if corner is None else (112,176)):
        image.alpha_composite(vertical,(64,y))
    return image


def main():
    tile, wall = sea(), cliff()
    h_fields, v_fields = bridge_fields(False), bridge_fields(True)
    horizontal, vertical = bridge_pixels(h_fields), bridge_pixels(v_fields)
    corners = {mask: junction(mask,h_fields,v_fields) for mask in BRIDGE_MASKS}
    for mask, tile_image in corners.items():
        tile_image.save(OUT/f'skybridge_m{mask}.png')
    for name,image in (('skysea',tile),('skycliff',wall),
                       ('skybridge_h',horizontal),('skybridge_v',vertical)):
        image.save(OUT/f'{name}.png')
    old = capture_old()
    old_sea = captured_rects(old['sea'],(128,128))
    old_h, old_v = [captured_rects(old[k],(32,32)).resize((64,64),Image.Resampling.NEAREST)
                    for k in ('horizontal','vertical')]
    old_wall = Image.new('RGBA',(64,36))
    draw = ImageDraw.Draw(old_wall)
    for y in range(old['height']):
        index = 0 if y<2 else 1 if y<old['height']-5 else 2 if y<old['height']-2 else 3
        draw.rectangle((0,y*2,63,y*2+1),fill=tuple(old['face'][index]))
    sheet = Image.new('RGB',(1036,512),'#eee8dc')
    for i, parts in enumerate(((old_sea,old_wall,old_h,old_v),
                               (tile,wall,horizontal,vertical,corners[11]))):
        sheet.paste(assembled(*parts).resize((512,512),Image.Resampling.NEAREST),(i*524,0))
    sheet.save(OUT/'cmp_x2.png')
    seam = Image.new('RGB',(256,256))
    for y in (0,128):
        for x in (0,128):
            seam.paste(tile,(x,y))
    seam.resize((512,512),Image.Resampling.NEAREST).save(OUT/'skysea_2x2.png')
    assembled(tile,wall,horizontal,vertical,corners[11]).resize((768,768),Image.Resampling.NEAREST).save(
        OUT/'connections_x3.png')
    joins = Image.new('RGBA',(192*3,192*3))
    for i, (mask, center) in enumerate(corners.items()):
        sample = Image.new('RGBA',(192,192), '#bddbef')
        sample.alpha_composite(center,(64,64))
        for bit, at, arm in ((1,(0,64),horizontal),(2,(128,64),horizontal),
                             (4,(64,0),vertical),(8,(64,128),vertical)):
            if mask & bit:
                sample.alpha_composite(arm,at)
        ImageDraw.Draw(sample).text((4,4),f'm{mask}',fill='#4a4e65')
        joins.paste(sample,(i%3*192,i//3*192))
    joins.save(OUT/'bridge_junctions.png')


if __name__ == '__main__':
    main()
