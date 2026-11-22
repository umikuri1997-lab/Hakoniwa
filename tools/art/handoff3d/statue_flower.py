"""H-3 石像CとH-8 あけよい草B。寸法はマス。

石像は幅0.80の八角の台で支える。台の上に高さ0.64の外套と足を
彫り、首から背にかけて頭巾を受ける。貝形の頭巾の外縁と青い内側は
同じ断面を共有する。中央の貝飾りと手は外套の胸でつなぐ。
あけよい草は、高さ0.25の芽から高さ0.56にのびる。葉は茎に留める。
つぼみの先では、5枚の先のとがった花びらを同じ花床から開く。
"""

import json
from math import cos, pi, radians, sin
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw

from night import O, bowl, leaf, render


ROOT = Path(__file__).resolve().parents[3]
STATUE_BOUNDS = (-.5, .5, -1.625, .5)
FLOWER_BOUNDS = (-.5, .5, -.8125, .5)
STONE = (233, 220, 196)
CREAM = (247, 235, 212)
BLUE = (152, 190, 204)
LILAC = (204, 175, 226)
PETAL = (248, 235, 249)
GREEN = (121, 144, 87)


def statue():
    scene = O.Scene()
    scene.material('flat')
    base_profile = ((0, .25), (.33, .25), (.39, .21), (.40, .17), (.40, .04), (.373, 0))
    bowl(scene, 0, 0, base_profile,
         lambda j, i: (CREAM, CREAM, STONE, BLUE if i % 2 == 0 else (139, 176, 193),
                       (184, 166, 142))[j], .90, count=8)
    scene.material('soft1')
    scene.smooth(True)
    for x in (-.101, .101):
        scene.box(x-.069, -.055, .24, x+.069, .153, .345, STONE, bevel=.033)
    bowl(scene, 0, 0, ((.095, .923), (.195, .79), (.18, .58), (.276, .33), (.25, .318)),
         lambda j, i: BLUE if i in range(11, 22) else STONE, .63)
    for direction in (-1, 1):
        scene.tube([(direction*x, y, z) for x,y,z in
                    ((.105, .015, .86), (.205,.065,.67), (.163,.145,.57), (.104,.163,.633))],
                   .059, STONE, n=12)
        scene.sphere(direction*.100, .172, .633, .06, CREAM, n=16, m=8)
    scene.sphere(0, .019, 1.064, .196, CREAM, n=32, m=16, zs=1.13)

    hood_profile = ((.12, -.215), (.63, -.163), (1, -.020),
                    (1, .133), (.86, .157), (.74, .116), (.62, -.125))
    rings = []
    for scale, y in hood_profile:
        ring = []
        for i in range(64):
            a = i*2*pi/64
            ripple = 1 + .075*cos(5*(a-pi/2))
            x = .345*cos(a)*ripple
            z = .344*sin(a)*ripple + .103*max(0, sin(a))**8
            ring.append((x*scale, y, 1.107+z*scale))
        rings.append(ring)
    scene.part()
    for j, (back, front) in enumerate(zip(rings, rings[1:])):
        color = (STONE, STONE, STONE, CREAM, BLUE, BLUE)[j]
        for i in range(64):
            k = (i+1) % 64
            scene.quad(back[i], back[k], front[k], front[i], color)

    scene.material('flat')
    scene.outline(0)
    for x in (-.079, .079):
        scene.tube([(x-.033,.19,1.080),(x,.211,1.095),(x+.032,.198,1.079)],
                   .009, (150,128,104))
    scene.tube([(-.038,.210,1.021),(0,.221,1.013),(.038,.210,1.021)], .009, (150,128,104))
    scene.outline(1)
    scene.part()
    root = (0, .193, .594)
    edge = [(.109*cos(a), .184, .594+.137*sin(a))
            for a in (pi*i/24 for i in range(25))]
    for i, (a, b) in enumerate(zip(edge, edge[1:])):
        middle = tuple((u+v)/2 for u,v in zip(a,b))
        rise = (middle[0], .216, middle[2])
        color = CREAM if i % 4 < 2 else (228, 209, 182)
        scene.tri(root, a, rise, color)
        scene.tri(root, rise, b, color)
    return scene


def flower(stage):
    scene = O.Scene()
    scene.material('soft1')
    scene.smooth(True)
    height = (.25, .50, .55, .55)[stage]
    stem = ((-.028,.035,0),(-.064,.016,height*.42),(-.015,0,height*.78),
            (.024,-.022,height))
    scene.tube(stem, .023, GREEN, n=10)
    leaf(scene, -.062,.016,height*.42, .2, .156 if stage == 0 else .24)
    leaf(scene, -.018,.003,height*.74, 2.86, .135 if stage == 0 else .22)
    if stage >= 2:
        x,y,z = stem[-1]
        scene.material('flat')
        bowl(scene, x,y, ((.062,z-.023),(.084,z+.005),(.060,z+.014)),
             lambda j,i: GREEN, .9, count=20)
        scene.part()
        for i in range(5):
            a = pi/2 + i*2*pi/5
            reach = .087 if stage == 2 else .21
            rise = .166 if stage == 2 else .046

            def at(u, v, h):
                return (x+u*cos(a)-v*sin(a), y+u*sin(a)+v*cos(a), z+h)

            root = at(0,0,.022)
            left = at(reach*.52,-reach*.40,rise*.45)
            right = at(reach*.52,reach*.40,rise*.45)
            ridge = at(reach*.65,0,rise*.63)
            tip = at(reach,0,rise)
            scene.tri(root, left, ridge, PETAL)
            scene.tri(root, ridge, right, (237,217,245))
            scene.tri(ridge, left, tip, LILAC)
            scene.tri(ridge, tip, right, (225,199,239))
        if stage == 3:
            scene.sphere(x,y,z+.047,.037,(245,218,144), n=12,m=6,zs=.48)
    return scene


def old_drawings():
    objects = (ROOT/'js/draw-objects.js').read_text()
    yami = (ROOT/'js/yami.js').read_text()
    statue_code = objects.split("case'lurestatue':", 1)[1].split("case'stele':", 1)[0]
    flower_code = yami[yami.index('function yamiFlowerDraw'):yami.index('function yamiDrawAdd2')]
    capture = """
    let ops = [];
    const ctx = {save(){},restore(){},fillRect(x,y,w,h){
        ops.push([x,y,w,h,this.fillStyle]);
    }};
    const shadow = () => {};
    """
    capture += flower_code + """
    const c = ctx, x = 0, y = 0;
    switch ('statue') {case 'statue':
    """ + statue_code + """
    }
    const rows = [ops];
    for(let stage=0;stage<4;stage++){
        ops = [];
        yamiFlowerDraw(0,0,stage,1);
        rows.push(ops);
    }
    console.log(JSON.stringify(rows));
    """
    return json.loads(subprocess.check_output(['node','-'], input=capture, text=True))


def save_comparison(images, drawings, path, bounds):
    w,h = images[0].size
    offset = round(-bounds[2]*64)-32
    sheet = Image.new('RGB',(w*8+18,h*4*len(images)),'#555064')
    for i, (image, ops) in enumerate(zip(images, drawings)):
        previous = Image.new('RGBA',(w,h))
        draw = ImageDraw.Draw(previous)
        for x,y,r,d,color in ops:
            draw.rectangle((x*2,y*2+offset,(x+r)*2-1,(y+d)*2+offset-1),fill=color)
        for x, chip in ((0,previous),(4*w+18,image)):
            zoom = chip.resize((w*4,h*4),Image.Resampling.NEAREST)
            sheet.paste(zoom,(x,i*h*4),zoom)
    sheet.save(path)


def main():
    O.S = 64
    O.SMCREASE = cos(radians(80))
    old = old_drawings()
    h3 = ROOT/'handoff/files/H-3'
    h8 = ROOT/'handoff/files/H-8'
    h3.mkdir(parents=True, exist_ok=True)
    statue_image = render(statue(), STATUE_BOUNDS)
    statue_image.save(h3/'lurestatue.png')
    save_comparison([statue_image], old[:1], h3/'lurestatue_cmp_x4.png', STATUE_BOUNDS)
    flowers = [render(flower(i), FLOWER_BOUNDS) for i in range(4)]
    for i, image in enumerate(flowers):
        image.save(h8/f'akeyoi_{i}.png')
    save_comparison(flowers, old[1:], h8/'akeyoi_cmp_x4.png', FLOWER_BOUNDS)
    for out, name, image in ((h3,'lurestatue',statue_image),(h8,'akeyoi_3',flowers[3])):
        image = image.crop(image.getbbox())
        image.resize((image.width*10,image.height*10),Image.Resampling.NEAREST).save(out/f'{name}_x10.png')


if __name__ == '__main__':
    main()
