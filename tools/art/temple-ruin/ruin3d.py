# こわれた神殿の3Dのお手本（絵をたのむときにわたす）。いまの神殿の絵（chips の statue、177×226・g64、ax−57・ay−164）と同じ大きさ・置き方。
# 部品の表（blueprint.Part）で、こわれる前の神殿（intact）と、こわれた神殿（ruin）を書く。こわれた所は、ささえのたしかめのない「かざり」か、地面・段にのる。
# x=東・y=南・z=上（マス）。神殿のマス（像のマス）の左上が(0,0)。ゲームの見え方は 画面=(x, y−0.8z)。
# 出す絵：ruin_full.png（マス目・置くマスのわく）・ruin_full_nogrid.png・ruin_side.png（まよこ）・intact_full.png（くらべる用）・bp_ruin.png（設計図）・sheet.png（たのむときの1まい）
import math,os,sys
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,os.path.join(HERE,'..'))
from PIL import Image,ImageDraw
from oblique3d import Scene,render,game,side,VIEW,SIDE,grid_bg
from blueprint import Part as P,build,blueprint

ST=(232,226,214);ST2=(214,208,196);ST3=(196,190,178)      # 石（明るい・ふつう・かげ）
OLD=(214,208,194);OLD2=(196,190,176)                        # こわれた神殿の、くすんだ石
BACK=(150,158,184);GOLD=(226,190,96);GOLD0=(196,176,120)   # おくのかべ・金・くすんだ金
BAN=(108,140,206);BAN0=(150,166,196);CRY=(140,200,250);CRY0=(170,186,200);MOSS=(150,190,110);RUB=(200,194,182)
CL,CR,CYC,COLR=-0.17,1.17,0.5,0.15                          # 前の柱：中心のx・y・半径
EZ0,EZ1=1.72,1.98                                           # はり（エンタブラチュア）の高さ
RX0,RX1,RY0,RY1,RZ=-0.8,1.8,-0.42,0.74,2.55                 # 屋根：はしのx・おく・前・むねの高さ

def base(old):
    s,s2=(OLD,OLD2) if old else (ST,ST2)
    L=[P('下の段','box',(-0.86,-0.52,0,1.86,0.95,0.14),s2,note='地面にすえる'),
       P('上の段','box',(-0.72,-0.46,0.14,1.72,0.78,0.30),s,on=('下の段',))]
    return L

def columns(old,broken_right=False):
    s,s2=(OLD,OLD2) if old else (ST,ST2);L=[]
    for nm,x in(('左',CL),('右',CR)):
        for ny,y in(('前',CYC),('おく',-0.28)):
            k='柱（%s%s）'%(nm,ny);top=EZ0
            if broken_right and nm=='右' and ny=='前':top=0.98
            L.append(P(k+'の台','box',(x-0.21,y-0.21,0.30,x+0.21,y+0.21,0.40),s2,on=('上の段',)))
            L.append(P(k,'cyl',(x,y,COLR,0.40,top-(0 if top<EZ0 else 0.08)),s,on=(k+'の台',),detail=24,note='おれて上がない' if top<EZ0 else ''))
            if top>=EZ0:L.append(P(k+'の頭','box',(x-0.2,y-0.2,EZ0-0.08,x+0.2,y+0.2,EZ0),GOLD0 if old else GOLD,on=(k,)))
    return L

def walls(old):
    s=OLD if old else ST2
    return [P('おくのかべ','box',(-0.05,-0.40,0.30,1.05,-0.30,EZ0),BACK if not old else (138,144,164),on=('上の段',)),
            P('左のかべ','box',(-0.70,-0.40,0.30,-0.40,0.20,EZ0),s,on=('上の段',)),
            P('右のかべ','box',(1.40,-0.40,0.30,1.70,0.20,EZ0 if not old else 1.18),s,on=('上の段',),note='上がくずれた' if old else '')]

def entab(old,chipped=False):
    s=OLD if old else ST
    return [P('はり','box',(-0.82,-0.42,EZ0,1.82 if not chipped else 1.30,0.72,EZ1),s,on=('柱（左前）','柱（右おく）','左のかべ')+(() if chipped else ('右のかべ',)),note='右はしがおちた' if chipped else '')]

def altar(old):
    L=[P('水晶の台（下）','cyl',(0.5,-0.08,0.22,0.30,0.38),OLD2 if old else ST2,on=('上の段',),detail=32),
       P('水晶の台（上）','cyl',(0.5,-0.08,0.17,0.38,0.46),OLD if old else ST,on=('水晶の台（下）',),detail=32)]
    return L

def roof_intact(sc,old=False):
    s,s2=(OLD,OLD2) if old else (ST,ST2);mx=(RX0+RX1)/2
    sc.part()
    for y,c in((RY1,s),(RY0,s2)):sc.tri((RX0+0.18,y,EZ1),(RX1-0.18,y,EZ1),(mx,y,RZ),c)   # 前・おくの三角（ペディメント）
    sc.part();sc.quad((RX0,RY0-0.04,EZ1-0.02),(RX0,RY1+0.04,EZ1-0.02),(mx,RY1+0.04,RZ+0.08),(mx,RY0-0.04,RZ+0.08),s)   # 左の屋根
    sc.part();sc.quad((RX1,RY0-0.04,EZ1-0.02),(RX1,RY1+0.04,EZ1-0.02),(mx,RY1+0.04,RZ+0.08),(mx,RY0-0.04,RZ+0.08),s2)  # 右の屋根
    sc.box(mx-0.06,RY0-0.06,RZ+0.02,mx+0.06,RY1+0.06,RZ+0.14,s)                                                   # むね
    sc.sphere(mx,RY1+0.06,RZ+0.2,0.08,GOLD);sc.box(mx-0.02,RY1+0.05,RZ+0.2,mx+0.02,RY1+0.08,RZ+0.48,GOLD)        # てっぺんの金の星（かんたんに）
    sc.box(mx-0.14,RY1+0.01,2.2,mx+0.14,RY1+0.04,2.48,GOLD)                                                     # 三角の中の金の星

def roof_ruin(sc):
    """左の屋根はのこる。右の屋根はくずれおちて、はりの上は、むねの近くの切れはしだけ。前の三角は右がわが欠けた"""
    mx=(RX0+RX1)/2;s,s2=OLD,OLD2
    sc.part()   # 前の三角：右がわがぎざぎざに欠けた形（左はし→てっぺん→欠けた所→はりの上）
    F=[(RX0+0.18,RY1,EZ1),(mx,RY1,RZ),(mx+0.22,RY1,RZ-0.36),(mx+0.38,RY1,RZ-0.5),(mx+0.52,RY1,RZ-0.78),(mx+0.80,RY1,EZ1)]
    for i in range(1,len(F)-1):sc.tri(F[0],F[i],F[i+1],s)
    sc.part()
    for i in range(1,len(F)-1):sc.tri((F[0][0],RY0,F[0][2]),(F[i][0],RY0,F[i][2]),(F[i+1][0],RY0,F[i+1][2]),s2)   # おくの三角も同じ形
    sc.part();sc.quad((RX0,RY0-0.04,EZ1-0.02),(RX0,RY1+0.04,EZ1-0.02),(mx,RY1+0.04,RZ+0.08),(mx,RY0-0.04,RZ+0.08),s)   # 左の屋根
    sc.part();sc.quad((mx,RY0-0.04,RZ+0.08),(mx,RY0+0.46,RZ+0.08),(mx+0.26,RY0+0.30,RZ-0.24),(mx+0.44,RY0-0.04,RZ-0.44),s2)   # 右の屋根の、のこった切れはし（おくのほう）
    sc.box(mx-0.06,RY0-0.06,RZ+0.02,mx+0.06,RY1-0.30,RZ+0.14,s)                                                   # むね（前が少しおれた）

def ruin_extra(sc):
    """くずれた物：おれた柱の上（上の段にたおれている）・石のかけら・くすんだ水晶のかけら・やぶれた旗・こけとつる"""
    sc.part();sc.tube([(0.98,0.62,0.43),(1.58,0.56,0.43)],0.13,OLD,n=16)            # おれた柱の上の部分（上の段にたおれた）
    sc.box(1.56,0.40,0.30,1.78,0.76,0.56,GOLD0)                                     # その柱の頭
    for x,y,z,w,d,h in((-0.55,0.58,0.30,0.20,0.16,0.12),(0.86,0.66,0.30,0.18,0.14,0.10),(1.30,0.80,0.14,0.16,0.12,0.10),(-0.20,0.80,0.14,0.14,0.12,0.08),(0.30,0.62,0.30,0.12,0.10,0.07),(1.55,-0.10,0.30,0.16,0.14,0.10)):
        sc.box(x,y,z,x+w,y+d,z+h,RUB)                                                # 石のかけら
    sc.part();sc.tri((0.42,-0.08,0.46),(0.56,-0.08,0.46),(0.47,-0.08,0.86),CRY0)       # くすんだ水晶のかけら（ひかっていない）
    sc.tri((0.42,-0.08,0.46),(0.47,-0.15,0.46),(0.47,-0.08,0.86),(150,166,180))
    sc.part();sc.quad((-0.76,0.73,1.70),(-0.48,0.73,1.70),(-0.48,0.73,1.24),(-0.76,0.73,1.36),BAN0)   # 左の旗（下がやぶれて短い）
    sc.box(1.48,0.30,0.30,1.70,0.42,0.32,BAN0)                                           # 右の旗は、上の段に落ちている
    import random;rd=random.Random(7)
    for k in range(34):   # こけ・つる：段のすみ・柱の下・かべ
        c=rd.choice([(-0.8,0.9,0.15),(-0.65,0.75,0.31),(1.75,0.9,0.15),(1.6,0.72,0.31),(CL-0.12,CYC+0.18,0.6),(CR+0.1,CYC+0.18,0.5),(-0.6,0.18,1.0),(1.6,0.18,0.9)])
        sc.sphere(c[0]+rd.uniform(-0.08,0.08),c[1]+rd.uniform(-0.04,0.04),c[2]+rd.uniform(-0.1,0.25),rd.uniform(0.035,0.07),MOSS,n=10,m=6)

def parts(ruin):
    return base(ruin)+columns(ruin,ruin)+walls(ruin)+entab(ruin,ruin)+altar(ruin)

def scene(ruin):
    sc=Scene();build(sc,parts(ruin))
    if ruin:roof_ruin(sc);ruin_extra(sc)
    else:
        roof_intact(sc)
        sc.part();sc.tri((0.40,-0.08,0.75),(0.60,-0.08,0.75),(0.5,-0.08,1.2),CRY);sc.tri((0.40,-0.08,0.75),(0.60,-0.08,0.75),(0.5,-0.08,0.5),CRY)
        sc.part();sc.quad((-0.76,0.73,1.70),(-0.48,0.73,1.70),(-0.48,0.73,1.10),(-0.76,0.73,1.10),BAN)
        sc.part();sc.quad((1.48,0.73,1.70),(1.76,0.73,1.70),(1.76,0.73,1.10),(1.48,0.73,1.10),BAN)
    return sc

EXT=(-1.0,2.0,-3.0,1.0)   # ゲームの見え方の範囲（マス）。いまの神殿の絵は x −0.89〜1.88・y −2.56〜0.97
SEXT=(-1.0,2.0,-3.25,0.25)
def shots(out):
    for nm,ruin in(('ruin',1),('intact',0)):
        sc=scene(ruin);fg=render(sc,game,EXT,VIEW);bg=grid_bg(EXT,(1,1));bg.alpha_composite(fg);bg.save(f'{out}/{nm}_full.png')
        if ruin:
            fg.save(f'{out}/ruin_full_nogrid.png')
            sd=render(sc,side,SEXT,SIDE);b2=grid_bg(SEXT);b2.alpha_composite(sd);b2.save(f'{out}/ruin_side.png')
    bad=blueprint(f'{out}/bp_ruin.png','こわれた神殿',parts(1),(1,1),(-1.0,2.0,-0.6,1.0,3.0))
    return bad
if __name__=='__main__':
    out=sys.argv[1] if len(sys.argv)>1 else HERE
    print('bad',shots(out))

def sheet(out):
    """絵をたのむときにわたす1まい：左がお手本のキューブ、まん中がこわれた神殿の3D（角度・大きさ・置く場所）、右がいまの神殿の絵（直したあとの神殿。デザインのお手本）。どれも1マス128で同じ大きさ"""
    import json,re
    ROOT=os.path.join(HERE,'..','..','..');s=open(os.path.join(ROOT,'chips.js'),encoding='utf8').read()
    pages=json.loads(re.search(r'window.CHIPA=(\[[^\]]*\])',s).group(1));d=json.loads(re.search(r'"statue":(\{[^}]*\]\]\})',s).group(1))
    p,x,y,w,h=d['f'][0];art=Image.open(os.path.join(ROOT,pages[p])).convert('RGBA').crop((x,y,x+w,y+h));art=art.resize((w*2,h*2),Image.NEAREST)
    a=Image.open(f'{out}/ruin_full.png').convert('RGBA');b=grid_bg(EXT,(1,1));b.alpha_composite(art,(int((0-EXT[0])*128)+d['ax']*2,int((0-EXT[2])*128)+d['ay']*2))
    cube=Image.open(os.path.join(HERE,'..','ref','view-cube.png')).convert('RGBA');k=a.height/cube.height;cube=cube.resize((int(cube.width*k),a.height),Image.BOX)
    G=40;sh=Image.new('RGBA',(cube.width+a.width+b.width+G*4,a.height+G*2),(255,255,255,255));X=G
    for im in(cube,a,b):sh.alpha_composite(im,(X,G));X+=im.width+G
    sh.convert('RGB').save(f'{out}/sheet.png');return sh.size
if __name__=='__main__' and len(sys.argv)<=2:print('sheet',sheet(sys.argv[1] if len(sys.argv)>1 else HERE))
