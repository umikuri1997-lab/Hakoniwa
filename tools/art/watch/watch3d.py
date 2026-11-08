# 見張り台の3Dの下絵：2×2マス。木の4本の柱、上の床（せいれいが立つ）と、まわりのさく、前のハシゴ、柱のあいだのすじかい。
# Lv1〜2（ふつう）・Lv3〜4（旗）・Lv5（星）の3つ。床の高さは、上に立つせいれいの高さ（WPLIFT 65＝画面で約2マス）に合わせる。
# 出す絵：watch_lv1.png・watch_lv3.png・watch_lv5.png（ゲームの見え方・マス目と置くマスのわく）、*_nogrid.png、watch_side.png（まよこ）
import math,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..'))
from oblique3d import *
WOOD=(214,172,118);WOODD=(196,152,100);RAIL=(222,184,130);LADDER=(204,162,108)
DZ=2.50               # 床の上の面の高さ（0.8×2.5＝画面で2マス）
DT=0.22               # 床のあつさ
PW=0.28               # 柱のふとさ
IN=0.06               # 柱の、置くマスのふちからの内がわ
RB=0.13               # さくの横木・小さな柱のふとさ
RT=0.09               # さくの横木のあつさ
RH=0.42               # さくの高さ
def build(sc,lv):
    for (x,y) in ((IN,IN),(2-IN-PW,IN),(IN,2-IN-PW),(2-IN-PW,2-IN-PW)):   # 4本の柱（床の上のさくの角まで）
        sc.box(x,y,0,x+PW,y+PW,DZ+RH+0.06,WOODD)
        sc.box(x-0.04,y-0.04,DZ+RH+0.02,x+PW+0.04,y+PW+0.04,DZ+RH+0.14,RAIL)   # 柱の頭
    for k in range(8):                                                       # 床：よこ向きの板8まい（1まいおきに少し色をかえる・すきま）
        y0=-0.04+k*2.08/8;sc.box(-0.04,y0+0.008,DZ-DT,2.04,y0+2.08/8-0.008,DZ,WOOD if k%2 else (206,164,112))
    sc.box(-0.02,-0.02,DZ-DT,2.02,2.02,DZ-0.02,WOODD)                       # 床の下の板（すきまから地面が見えないように）
    for z in (DZ+RH,DZ+RH*0.45):                                             # さく（横木2本）：前は、ハシゴの所をあける
        e=0.012                                                              # 柱の面とぴったり同じ所にしない（面があらそってざらざらになる）
        sc.box(IN+PW,IN+e,z-RT,2-IN-PW,IN+RB,z,RAIL)
        sc.box(IN+e,IN+PW,z-RT,IN+RB,2-IN-PW,z,RAIL);sc.box(2-IN-RB,IN+PW,z-RT,2-IN-e,2-IN-PW,z,RAIL)
        sc.box(IN+PW,2-IN-RB,z-RT,0.72,2-IN-e,z,RAIL);sc.box(1.28,2-IN-RB,z-RT,2-IN-PW,2-IN-e,z,RAIL)
    for t in (0.5,1.0,1.5):                                                  # さくの小さな柱
        sc.box(t-RB/2,IN+0.02,DZ+0.005,t+RB/2,IN+RB-0.02,DZ+RH-0.02,RAIL)
        sc.box(IN+0.02,t-RB/2,DZ+0.005,IN+RB-0.02,t+RB/2,DZ+RH-0.02,RAIL);sc.box(2-IN-RB+0.02,t-RB/2,DZ+0.005,2-IN-0.02,t+RB/2,DZ+RH-0.02,RAIL)
    sc.box(0.66,2-IN-RB+0.02,DZ+0.005,0.66+RB,2-IN-0.02,DZ+RH,RAIL);sc.box(1.34-RB,2-IN-RB+0.02,DZ+0.005,1.34,2-IN-0.02,DZ+RH,RAIL)   # ハシゴの両がわの小さな柱
    yb=2.0-0.02                                                               # すじかい（左右とうしろの柱のあいだ、前は左右の柱からハシゴへ）
    for (a,b) in (((IN+PW,IN+PW/2,DZ-0.75),(2-IN-PW,IN+PW/2,DZ-DT)),((2-IN-PW,IN+PW/2,DZ-0.75),(IN+PW,IN+PW/2,DZ-DT)),
                  ((IN+PW/2,IN+PW,DZ-0.75),(IN+PW/2,2-IN-PW,DZ-DT)),((2-IN-PW/2,IN+PW,DZ-0.75),(2-IN-PW/2,2-IN-PW,DZ-DT)),
                  ((IN+PW,2-IN-PW/2,DZ-0.70),(0.70,2-IN-PW/2,DZ-DT)),((2-IN-PW,2-IN-PW/2,DZ-0.70),(1.30,2-IN-PW/2,DZ-DT))):
        sc.beam(a,b,0.065,WOODD)
    for x in (0.70,1.30):sc.box(x-0.07,yb-0.04,0,x+0.07,yb+0.10,DZ+0.06,LADDER)    # ハシゴ：まっすぐ立てる。前のまん中
    for i in range(1,8):z=i*DZ/8;sc.box(0.70,yb-0.02,z-0.07,1.30,yb+0.08,z+0.07,LADDER)
    if lv>=3:                                                                  # 旗（Lv3〜4）・星（Lv5）は、うしろのまん中の柱の上に
        sc.box(0.95,IN+0.01,DZ+RH,1.05,IN+0.11,DZ+RH+0.75,WOODD)
        top=DZ+RH+0.75
        if lv<5:
            sc.part();sc.tri((1.05,IN+0.06,top),(1.05,IN+0.06,top-0.32),(1.52,IN+0.06,top-0.16),(110,170,230))
        else:
            sc.part();pts=[];R0,R1=0.24,0.10
            for i in range(10):a=math.pi/2+i*math.pi/5;r=R0 if i%2==0 else R1;pts.append((1.0+r*math.cos(a),IN+0.04,top+0.05+r*math.sin(a)))
            for i in range(10):sc.tri((1.0,IN+0.02,top+0.05),pts[i],pts[(i+1)%10],(250,214,90))
out=sys.argv[1] if len(sys.argv)>1 else os.path.dirname(__file__)
ext=(-0.5,2.5,-3.5,2.25)
for lv in (1,3,5):
    sc=Scene();build(sc,lv);fg=render(sc,game,ext,VIEW)
    bg=grid_bg(ext,(2,2));bg.alpha_composite(fg);bg.save(f'{out}/watch_lv{lv}.png');fg.save(f'{out}/watch_lv{lv}_nogrid.png')
sc=Scene();build(sc,1);sext=(-0.5,2.5,-3.5,0.5);sd=render(sc,side,sext,SIDE);bg=grid_bg(sext);bg.alpha_composite(sd);bg.save(f'{out}/watch_side.png')
print('ok')
