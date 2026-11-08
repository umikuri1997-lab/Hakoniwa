# 噴水の3Dの下絵：2×2マス。丸い石の水ばち（石を2だんつむ）、中に水、まん中に石の台と、ふき上げる水。
# 出す絵：fountain_full.png（ゲームの見え方・マス目と置くマスのわく）、fountain_full_nogrid.png、fountain_side.png（まよこ）
import math,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..'))
from oblique3d import *
CX,CY=1.0,1.0
RO,RI=0.92,0.74       # 水ばちの外・内の半径
HW=0.36               # 水ばちのかべの高さ（石2だん）
WZ=0.27               # 水の面の高さ
PR,PH=0.17,0.42       # まん中の台の半径・高さ
JR,JH=0.05,1.05       # ふき上げる水の太さ・てっぺんの高さ
BR=0.46               # 水の落ちる所の半径
STONE=[(236,232,224),(222,218,210),(230,226,218)]
WATER=(150,206,240);JET=(214,238,252)
def stone(row):
    return lambda i,a0,a1:STONE[(i//3+row)%3]          # 石1こ＝3つの面、だんごとに半分ずらす
def build(sc):
    for r in range(2):                                   # 外がわのかべ：石を2だん
        z0=HW*r/2;z1=HW*(r+1)/2
        sc.ring_wall(CX,CY,RO,z0,z1-0.006,stone(r),n=48);sc.ring_wall(CX,CY,RO-0.004,z1-0.006,z1,lambda *a:(200,196,188),n=48)
    sc.annulus(CX,CY,RI,RO,HW,stone(2),n=48)            # かべのてっぺん
    sc.ring_wall(CX,CY,RI,WZ,HW,lambda *a:(212,208,200),n=48)  # かべの内がわ
    sc.annulus(CX,CY,0,RI,WZ,lambda *a:WATER,n=48)      # 水
    sc.ring_wall(CX,CY,PR,WZ,PH,lambda i,a0,a1:STONE[i%2],n=24)  # まん中の台
    sc.annulus(CX,CY,0,PR,PH,lambda *a:STONE[0],n=24)
    sc.ring_wall(CX,CY,JR,PH,JH,lambda *a:JET,n=20)    # まん中からまっすぐふき上げる水
    for k in range(8):                                   # てっぺんから8本の水が、弧をえがいて外へ落ちる
        a=2*math.pi*k/8+math.pi/8
        pts=[(CX+BR*t*math.cos(a),CY+BR*t*math.sin(a),JH-(JH-WZ)*t*t) for t in [i/14 for i in range(15)]]
        sc.tube(pts,0.03,JET)
    sc.sphere(CX,CY,JH,0.07,JET)                         # ふき上げたてっぺんの水
    for k in range(8):                                   # 水の落ちる所の小さな波の輪
        a=2*math.pi*k/8+math.pi/8;x=CX+BR*math.cos(a);y=CY+BR*math.sin(a)
        sc.annulus(x,y,0.04,0.08,WZ+0.004,lambda *q:(196,230,250),n=16)
sc=Scene();build(sc)
out=sys.argv[1] if len(sys.argv)>1 else os.path.dirname(__file__)
ext=(-1.0,3.0,-2.0,3.0)
fg=render(sc,game,ext,VIEW);bg=grid_bg(ext,(2,2));bg.alpha_composite(fg);bg.save(f'{out}/fountain_full.png');fg.save(f'{out}/fountain_full_nogrid.png')
sext=(-1.0,3.0,-2.0,0.5);sd=render(sc,side,sext,SIDE);bg=grid_bg(sext);bg.alpha_composite(sd);bg.save(f'{out}/fountain_side.png')
print('ok')
