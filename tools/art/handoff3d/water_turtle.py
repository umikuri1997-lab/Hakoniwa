"""H-10 水のヌシ様 A案。マスを単位にした設計図。

幅2.38、奥行き1.74の丸い石のこうらを腹で受ける。こうらの上を
すり鉢形にくぼませ、半径0.67の池を入れる。石の板は縁でかみ合う。
眠るときは手足と首をこうらに引っこめる。目を覚ますと首を右手前へ
出して四本の足で支える。ハスは池底からまっすぐ伸ばす。夜明けには
舟のように水に浮く姿にし、実際に上がる高さはゲームに任せる。
"""

import json
from math import cos, pi, radians, sin
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw

from night import O, bowl, render

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT/'handoff/files/H-10'
BOUNDS = (-1.5, 1.96875, -1.75, 1)
STONE = (181, 176, 151)
MOSS = (151, 157, 100)
SKIN = (155, 163, 117)
CREAM = (226, 207, 158)
STAGES = ('sleep', 'awake', 'dawn')


def ellipsoid(scene, center, axes, color, detail=24):
    start = len(scene.t)
    scene.sphere(0,0,0,1,color,n=detail,m=detail//2)
    for i in range(start,len(scene.t)):
        a,b,c,color,pid = scene.t[i]
        scene.t[i] = (a*axes+center,b*axes+center,c*axes+center,color,pid)


def shell(scene):
    profile = ((.55,.28),(.89,.30),(1.09,.40),(1.19,.57),
               (1.16,.72),(1.06,.90),(.89,1.05),(.72,1.085),
               (.64,1.02),(.62,.92),(0,.92))
    moss_patches = ((-.73,-.35,1.01,.35),(-.29,-.60,.99,.25),
                    (.57,-.46,.96,.31),(.91,.18,.82,.28),
                    (-.83,.36,.76,.29),(.21,.49,.99,.22))

    def patina(x,y,z):
        for cx,cy,cz,r in moss_patches:
            dist = ((x-cx)**2 + (y-cy)**2 + .9*(z-cz)**2)/r**2
            edge = 1 + .18*cos(32*x+21*y) + .10*sin(38*y-10*z)
            if dist < edge:
                return MOSS
        return None

    def panel(j, i):
        if j >= 8:
            return (135,130,109)
        span = (i + (3 if j < 4 else 0)) % 10
        if span == 0 and 1 <= j <= 6:
            return (146,143,121)
        if j in (3, 6):
            return (196,190,164)
        return STONE

    scene.decal(patina)
    bowl(scene,0,0,profile,panel,.73,count=80)
    scene.decal(None)
    scene.material('flat')
    bowl(scene,0,0,((0,.968),(.655,.968)),
         lambda j,i: (105,161,174),.73,count=48)
    scene.outline(0)
    for x,y,rx,ry,col in ((-.12,-.13,.42,.09,(126,179,187)),
                         (.22,.12,.31,.057,(119,173,183)),
                         (-.29,.15,.21,.043,(137,187,190))):
        bowl(scene,x,y,((0,.972),(rx,.972)),lambda j,i: col,ry/rx,count=32)
    scene.outline(1)


def limbs(scene, stage):
    scene.material('soft1')
    tucked = stage == 'sleep'
    floating = stage == 'dawn'
    body_z = .26
    ellipsoid(scene,(0,0,body_z),(.91,.61,.22),(173,155,113))
    if tucked:
        return
    for x in (-.70,.66):
        for y in (-.42,.38):
            step = .10 if y > 0 and not tucked else 0
            z = .23 if floating else .18
            ellipsoid(scene,(x+step,y,z),(.26,.22,.21),SKIN)
            if not floating:
                for j in (-1,0,1):
                    ellipsoid(scene,(x+step+j*.082,y+.165,.105),(.043,.055,.056),CREAM,12)
    position = (1.28,.35,.46 if floating else .40)
    ellipsoid(scene,(.84,.24,.36),(.41,.21,.20),SKIN)
    ellipsoid(scene,position,(.34,.25,.25),SKIN,32)
    x,y,z = position
    ellipsoid(scene,(x+.13,y+.09,z-.10),(.25,.203,.13),CREAM)
    scene.material('flat')
    scene.outline(0)
    scene.tube([(x-.058,y+.248,z+.019),(x+.015,y+.259,z+.006),
                (x+.078,y+.252,z+.019)],.009,(96,108,81))
    eye = (122,105,73)
    scene.tube([(x-.051,y+.252,z+.089),(x-.011,y+.261,z+.124),
                (x+.041,y+.259,z+.102)],.017,eye)
    scene.tube([(x-.074,y+.233,z+.132),(x-.025,y+.237,z+.151),
                (x+.037,y+.234,z+.141)],.027,CREAM)
    for dx in (.171,.229):
        ellipsoid(scene,(x+dx,y+.202,z+.045),(.016,.011,.014),eye,12)
    scene.outline(1)


def pad(scene, x,y,z,r, color):
    scene.part()
    center = (x,y,z)
    for i in range(26):
        def edge(k):
            a = .31+2*pi*k/28
            return (x+r*cos(a), y+.80*r*sin(a),z+.012+.009*cos(2*a))
        scene.tri(center,edge(i),edge(i+1),color)


def lotus(scene, stage):
    scene.material('flat')
    if stage != 'dawn':
        pad(scene,.31,.12,.981,.15,(161,143,103))
        pad(scene,-.28,-.12,.981,.18,(173,152,107))
        scene.tube([(-.22,-.13,.970),(-.22,-.13,1.21),(-.27,-.13,1.30)],
                   .019,(143,125,83))
        pad(scene,-.31,-.13,1.286,.09,(159,131,91))
        return
    pad(scene,-.39,.14,.979,.17,(137,164,104))
    pad(scene,.30,.15,.980,.17,(157,182,111))
    pad(scene,.35,-.15,.981,.12,(135,162,107))
    for x,y,height,r in ((-.16,-.12,1.33,.18),(.26,.07,1.17,.105)):
        scene.tube([(x,y,.974),(x,y,height)],.017,(129,156,98))
        scene.part()
        for ring in (0,1):
            for i in range(7):
                a = 2*pi*(i+ring*.5)/7
                reach = r*(1-.32*ring)
                rise = r*(.55+.27*ring)

                def at(u,v,z):
                    return (x+reach*(u*cos(a)-v*sin(a)),
                            y+reach*(u*sin(a)+v*cos(a)),height+z)

                root = at(0,0,0)
                ridge = at(.51,0,rise*.38)
                tip = at(1,0,rise)
                left = at(.56,-.31,rise*.31)
                right = at(.56,.31,rise*.32)
                scene.quad(root,left,tip,ridge,(240,161,190))
                scene.quad(root,ridge,tip,right,(250,188,207))
        ellipsoid(scene,(x,y,height+.028),(.048,.048,.032),(255,220,144),16)


def capture_old():
    code = (ROOT/'js/mizube-story.js').read_text()
    fn = code[code.index('function mzOval'):code.index('function mzKanadePos')]
    source = """
    const S={ground:[0],flags:{},mz:{}}, MZV={};
    let ops=[];
    const ctx={save(){},restore(){},fillRect(x,y,w,h){ops.push([x,y,w,h,this.fillStyle])}};
    """ + fn + """
    const drawings=[];
    for (let i=0;i<3;i++){
        S.flags={mzKame:i>0,mzDawn:i===2};
        ops=[];
        mzKameDraw(ctx,0,0,0,0);
        drawings.push(ops);
    }
    console.log(JSON.stringify(drawings));
    """
    return json.loads(subprocess.check_output(['node','-'],input=source,text=True))


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    O.S = 64
    O.SMCREASE = cos(radians(80))
    old = capture_old()
    for i, stage in enumerate(STAGES):
        scene = O.Scene()
        scene.material('soft1')
        scene.smooth(True)
        limbs(scene,stage)
        shell(scene)
        lotus(scene,stage)
        image = render(scene,BOUNDS)
        assert image.getchannel('A').getextrema() == (0,255)
        w,h = image.size
        l,t,r,b = image.getbbox()
        assert 0 < l < r < w and 0 < t < b < h, (stage,image.getbbox())
        image.save(OUT/f'mzkame_{stage}.png')
        if i == 0:
            sheet = Image.new('RGB',(w*4+20,h*6),'#839bac')
        previous = Image.new('RGBA',image.size)
        draw = ImageDraw.Draw(previous)
        for x,y,a,b,col in old[i]:
            px,py = 96+(x-16)*2,112+(y-18)*2
            draw.rectangle((px,py,px+a*2-1,py+b*2-1),fill=col)
        for x, frame in ((0,previous),(w*2+20,image)):
            scaled = frame.resize((w*2,h*2),Image.Resampling.NEAREST)
            sheet.paste(scaled,(x,i*h*2),scaled)
        ImageDraw.Draw(sheet).text((5,i*h*2+4),stage,fill='white')
        if stage == 'dawn':
            zoom = image.crop(image.getbbox())
            zoom.resize((zoom.width*10,zoom.height*10),Image.Resampling.NEAREST).save(
                OUT/'mzkame_dawn_x10.png')
    sheet.save(OUT/'mzkame_cmp_x2.png')


if __name__ == '__main__':
    main()
