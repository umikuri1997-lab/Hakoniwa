"""H-8 夜のゆりかごと夜の仕事のあと。寸法はマス。

ゆりかごは幅2.64、奥行き1.45の石鉢。鉢底を地面から0.16上に置き、
左右の石の脚で受ける。土の修理で脚間に台を積む。背の三日月は鉢の
後ろ半分に沿う石壁で、両端を低くし、中央は高さ1.67まで立ち上げる。
木は鉢の縁に蔓を編む。水は内側の石を洗う。火は鉢底の小皿に置く。
風のとばりは石壁の上端に留め、壁の内側へ垂らす。
寝床は土のくぼみに葉を敷く。うずみ火は灰を盛って小さな炭を埋める。
戸口のしるしは石の台と柱を組み、柱の正面に月を彫る。
"""

import argparse
import json
from math import cos, pi, radians, sin
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import furntone
import oblique3d as O

ELEMENTS = ('earth', 'wood', 'water', 'fire', 'wind')
CRADLE_BOUNDS = (-1.5, 1.5, -2.125, 1)
MARK_BOUNDS = (-0.5, 0.5, -0.75, 0.5)
STONE = (144, 132, 166)
OLD_STONE = (117, 109, 130)
VINE = (139, 151, 108)


def bowl(scene, cx, cy, profile, col, depth, count=64):
    scene.part()
    rings = [
        [(cx + r * cos(i * 2*pi/count), cy + r * depth * sin(i * 2*pi/count), z)
         for i in range(count)] for r, z in profile
    ]
    for j, (a, b) in enumerate(zip(rings, rings[1:])):
        for i in range(count):
            k = (i + 1) % count
            scene.quad(a[i], a[k], b[k], b[i], col(j, i))


def cradle(mask, occupancy=''):
    earth, wood, water, fire, wind = (mask & (1 << i) for i in range(5))
    scene = O.Scene()
    scene.material('soft1')
    scene.smooth(True)
    stone = STONE if earth else OLD_STONE
    scene.box(-0.95, -0.36, 0, -0.52, 0.42, 0.2, stone, bevel=0.045)
    scene.box(0.52, -0.36, 0, 0.95, 0.42, 0.2, stone, bevel=0.045)
    if earth:
        bowl(scene, 0, 0, ((0, .23), (1.08, .23), (1.13, .14), (1.12, 0)),
             lambda j, i: stone, .53)
    inner = (102, 114, 166) if water else (91, 79, 96)
    scene.tag('bowl_outer')
    bowl(scene, 0, 0, ((.84, .16), (1.11, .22), (1.31, .45), (1.32, .55),
                      (1.25, .61), (1.13, .57)),
         lambda j, i: stone, .55)
    scene.tag('bowl_inner')
    scene.join('bowl_outer', 'bowl_inner')
    scene.material('flat')
    bowl(scene, 0, 0, ((1.13, .57), (1.01, .36), (0, .36)),
         lambda j, i: tuple(c - 12 for c in inner) if j == 0 else inner, .55)
    scene.material('soft1')
    scene.tag(None)

    angles = [pi + i*pi/48 for i in range(49)]
    heights = [.54 + 1.13 * max(0, -sin(a))**1.4 for a in angles]
    scene.part()
    for a, b, za, zb in zip(angles, angles[1:], heights, heights[1:]):
        def point(angle, radius, height):
            return (radius*cos(angle), .55*radius*sin(angle), height)

        top = .07 if earth else .075
        scene.quad(point(a, 1.29, .48), point(b, 1.29, .48),
                   point(b, 1.26, zb), point(a, 1.26, za), stone)
        scene.quad(point(a, 1.26, za), point(b, 1.26, zb),
                   point(b, 1.13, zb-top), point(a, 1.13, za-top), stone)
        scene.quad(point(a, 1.13, za-top), point(b, 1.13, zb-top),
                   point(b, 1.13, .48), point(a, 1.13, .48), stone)
    if not earth:
        for angle in (.48, 1.17, 2.65):
            pts = [(r*cos(angle+d), r*.55*sin(angle+d), z)
                   for r, d, z in ((1.29, -.015, .45), (1.328, .02, .53), (1.273, -.024, .611))]
            scene.tube(pts, .012, (81, 72, 92))

    if wood:
        for phase in (0, pi):
            pts = [(1.306*cos(a), .724*sin(a), .56 + .045*sin(12*a+phase))
                   for a in (i*2*pi/144 for i in range(145))]
            scene.tube(pts, .024, VINE if phase == 0 else (115, 122, 85))
    if wind:
        scene.part()
        arc = list(zip(angles, heights))[6:-6]
        for i, ((a, za), (b, zb)) in enumerate(zip(arc, arc[1:])):
            def cloth(angle, z, index):
                return (1.115*cos(angle), .609*sin(angle),
                        z-.06-.26-.06*cos(index*pi/6))

            scene.quad((1.136*cos(a), .625*sin(a), za-.071),
                       (1.136*cos(b), .625*sin(b), zb-.071),
                       cloth(b, zb, i+1), cloth(a, za, i),
                       (182, 164, 213) if (i//6) % 2 else (171, 151, 201))
    # 空いた鉢底を、ゲーム側で影やヌシ様を置く場所に使う。
    if fire:
        ember(scene, .73 if occupancy else .12, .05, .366, .19, occupancy == 'born')
    return scene


def ember(scene, x, y, z, width, bright):
    bowl(scene, x, y, ((0, z), (width, z), (.82*width, z+.065), (0, z+.04)),
         lambda j, i: (97, 77, 88), .8, 24)
    scene.material('flat')
    color = (255, 196, 125) if bright else (237, 143, 102)
    for dx, dy in ((-.045, .015), (.042, -.025), (.024, .045)):
        scene.sphere(x+dx, y+dy, z+.05, .037, color, n=8, m=4, zs=.52)
    scene.material('soft1')


def leaf(scene, x, y, z, angle, length):
    def point(u, v, h):
        return (x + (u*cos(angle)-v*sin(angle))*length,
                y + (u*sin(angle)+v*cos(angle))*length, z+h)

    scene.part()
    root, tip = point(0, 0, 0), point(1, 0, .018)
    spine = point(.52, 0, .045)
    for side, color in ((-1, (143, 164, 105)), (1, (166, 185, 119))):
        edge = point(.52, side*.24, 0)
        scene.tri(root, edge, spine, color)
        scene.tri(spine, edge, tip, color)


def mark(name, bright=False):
    scene = O.Scene()
    scene.material('soft1')
    scene.smooth(True)
    if name == 'nedoko':
        bowl(scene, 0, .12, ((.34, 0), (.39, .11), (.35, .17), (.25, .11), (0, .075)),
             lambda j, i: (127, 96, 78), .64, 40)
        for i in range(9):
            angle = i*2*pi/9
            leaf(scene, .035*cos(angle), .12+.03*sin(angle), .09, angle, .22)
    elif name == 'uzumi':
        bowl(scene, 0, .15, ((.27, 0), (.24, .085), (.15, .16), (0, .19)),
             lambda j, i: (157, 146, 150), .75, 32)
        ember(scene, .01, .19, .143, .12, bright)
    else:
        scene.box(-.2, -.08, 0, .2, .16, .075, OLD_STONE, bevel=.025)
        scene.box(-.133, -.05, .07, .133, .10, .63, STONE, bevel=.036)
        scene.material('flat')
        scene.part()
        for i in range(16):
            def crescent(t, inner):
                a = (.38 + 1.27*t)*pi
                return (.092*cos(a) + .027 + (.065*sin(pi*t) if inner else 0),
                        .101, .37 - .093*sin(a))

            a, b = i/16, (i+1)/16
            scene.quad(crescent(a, False), crescent(b, False),
                       crescent(b, True), crescent(a, True), (233, 203, 136))
    return scene


def render(scene, bounds):
    image = O.render_px(scene, O.game, bounds, O.VIEW, k=.84, merge=12)
    return furntone.tone(image, dw=0)


def old_art():
    source = (Path(__file__).resolve().parents[3] / 'js/yami.js').read_text()
    cradle_js = source[source.index('let YCRC=null;'):source.index('function yamiFlowerDraw')]
    mark_js = source[source.index('function yamiMarkDraw'):source.index('/* ===== お話の後半')]
    capture = """
    let ops = [];
    const ctx = {globalAlpha:1, save(){}, restore(){}, clearRect(){},
      fillRect(x,y,w,h){ops.push([x,y,w,h,this.fillStyle,this.globalAlpha])}};
    const document = {createElement(){return {getContext(){return ctx}}}};
    const YKEL = ['earth','wood','water','fire','wind'];
    const S = {flags:{}}, Y = {crN:{}}, yamiState = () => Y;
    """
    capture += cradle_js + mark_js + """
    const report = {};
    for (const mask of [0,1,2,4,8,16,31]) {
      ops = [];
      Y.crN = Object.fromEntries(YKEL.map((key,i)=>[key,mask & (1<<i)]));
      yamiCradleArt();
      report['cradle_'+mask] = ops;
    }
    for (const k of ['nedoko','uzumi','toguchi']){
      ops = [];
      yamiMarkDraw({k},0,0,0);
      report[k] = ops;
    }
    console.log(JSON.stringify(report));
    """
    return json.loads(subprocess.check_output(['node', '-'], input=capture, text=True))


def comparison(out):
    old = old_art()
    for name, keys, frame, stretch in (
        ('cradle', ('cradle_0','cradle_1','cradle_2','cradle_4','cradle_8','cradle_16','cradle_31'), (192,200), 4),
        ('marks', ('nedoko','uzumi','toguchi'), (64,80), 2),
    ):
        w, h = frame
        sheet = Image.new('RGB', (w*4+24,h*len(keys)*2), '#494157')
        labels = ImageDraw.Draw(sheet)
        for row, key in enumerate(keys):
            y0 = row*h*2
            old_image = Image.new('RGBA', (w,h))
            painter = ImageDraw.Draw(old_image)
            for x,y,r,d,col,alpha in old[key]:
                if not col:
                    continue
                # Compare the game capture at g64, matching the ground reference.
                top = 24 if stretch == 4 else 16
                painter.rectangle((x*stretch,y*stretch+top,(x+r)*stretch-1,(y+d)*stretch+top-1),
                                  fill=col+f'{round(alpha*255):02x}')
            new_image = Image.open(out / (key + '.png'))
            for x0, image in ((0,old_image),(2*w+24,new_image)):
                zoom = image.resize((w*2,h*2), Image.Resampling.NEAREST)
                sheet.paste(zoom,(x0,y0),zoom)
            labels.text((3,y0+3), key, fill='white')
            labels.text((w*2+27,y0+3), '3D / g64', fill='white')
        sheet.save(out / f'{name}_cmp.png')


def main(out):
    out.mkdir(parents=True, exist_ok=True)
    O.S = 64
    O.SMCREASE = cos(radians(80))
    for mask in range(32):
        render(cradle(mask), CRADLE_BOUNDS).save(out / f'cradle_{mask}.png')
    for stage in ('rest','born'):
        render(cradle(31, stage), CRADLE_BOUNDS).save(out / f'cradle_{stage}.png')
    for name in ('nedoko','uzumi','toguchi'):
        render(mark(name), MARK_BOUNDS).save(out / f'{name}.png')
    render(mark('uzumi', True), MARK_BOUNDS).save(out / 'uzumi_1.png')
    comparison(out)
    for name in ('cradle_31','nedoko','uzumi','toguchi'):
        image = Image.open(out / f'{name}.png')
        crop = image.crop(image.getbbox())
        crop.resize((crop.width*10, crop.height*10), Image.Resampling.NEAREST).save(out / f'{name}_x10.png')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('out', type=Path)
    main(parser.parse_args().out)
