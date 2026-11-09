# 見張り台の3Dの下絵：2×2マス。木の4本の柱、上の床（せいれいが立つ）と、まわりのさく、前のハシゴ、柱のあいだのすじかい。
# Lv1〜2（ふつう）・Lv3〜4（旗）・Lv5（星）の3つ。床の高さは、上に立つせいれいの高さ（WPLIFT 65＝画面で約2マス）に合わせる。
# 出す絵：watch_lv1.png・watch_lv3.png・watch_lv5.png（ゲームの見え方・マス目と置くマスのわく）、*_nogrid.png、watch_side.png（まよこ）
import math,sys,os
import numpy as np
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..'))
from oblique3d import *
WOOD=(214,172,118);WOODD=(196,152,100);RAIL=(222,184,130);LADDER=(204,162,108)
DZ=2.50               # 床の上の面の高さ（0.8×2.5＝画面で2マス）
DT=0.22               # 床のあつさ
PW=0.28               # 柱のふとさ
IN=0.06               # 柱の、置くマスのふちからの内がわ
RB=0.13               # さくの横木・小さな柱のふとさ
RT=0.09               # さくの横木のあつさ
RBS=0.18              # 左右の横木のはば：横の面は見えないので、うしろ・前（上の面0.11＋手前の面0.09×0.8）と同じくらいに見えるはば
RH=0.42               # さくの高さ
def build(sc,lv):
    F=2-IN                                                                   # 柱の外がわ（前・右）
    D0,D1=IN-0.03,F+0.03                                                     # 床のはし（柱より少しだけ外）
    LX=(0.70,1.30);LW=0.13                                                   # ハシゴの柱のまん中・ふとさ
    HX0,HX1=LX[0]+LW/2,LX[1]-LW/2                                            # ハシゴの柱の内がわ（床の穴のはば）
    LY0,LY1=F-RB,F                                                           # ハシゴの柱の前後（前のさくと同じ線）
    EPW=0.20                                                                 # さくのはしの柱のふとさ
    PP=0.13                                                                  # 旗の柱のふとさ
    for (x,y) in ((IN,IN),(F-PW,IN),(IN,F-PW),(F-PW,F-PW)):                  # 4本の柱：地面から床をつらぬいて、さくの上まで
        sc.box(x,y,0,x+PW,y+PW,DZ+RH+0.06,WOODD)
        sc.box(x-0.035,y-0.035,DZ+RH+0.06,x+PW+0.035,y+PW+0.035,DZ+RH+0.15,RAIL)   # 柱の頭（柱の上にのせる）
    for k in range(8):                                                       # 床：よこ向きの板8まい。ハシゴがのぼる所は四角い穴
        w=(D1-D0)/8;y0=D0+k*w+0.006;y1=D0+(k+1)*w-0.006;c=WOOD if k%2 else (206,164,112)
        if y1>LY0-0.02:
            sc.box(D0,y0,DZ-DT,HX0,y1,DZ,c);sc.box(HX1,y0,DZ-DT,D1,y1,DZ,c)
        else:sc.box(D0,y0,DZ-DT,D1,y1,DZ,c)
    sc.box(D0+0.02,D0+0.02,DZ-DT-0.06,D1-0.02,LY0-0.04,DZ-DT+0.02,WOODD,bevel=0)   # 床をささえる下の板（穴の所はあける）
    sc.box(D0+0.02,LY0-0.04,DZ-DT-0.06,HX0,D1-0.02,DZ-DT+0.02,WOODD,bevel=0);sc.box(HX1,LY0-0.04,DZ-DT-0.06,D1-0.02,D1-0.02,DZ-DT+0.02,WOODD,bevel=0)
    for z in (DZ+RH,DZ+RH*0.45):                                             # さくの横木2本：柱と柱のあいだに。前は、ハシゴの柱まで
        if lv>=3:sc.box(IN+PW,IN+0.02,z-RT,1.0-PP/2,IN+RB,z,RAIL);sc.box(1.0+PP/2,IN+0.02,z-RT,F-PW,IN+RB,z,RAIL)   # うしろ：旗の柱の所で切る
        else:sc.box(IN+PW,IN+0.02,z-RT,F-PW,IN+RB,z,RAIL)                     # うしろ
        sc.box(IN+0.02,IN+PW,z-RT,IN+0.02+RBS,F-PW,z,RAIL);sc.box(F-0.02-RBS,IN+PW,z-RT,F-0.02,F-PW,z,RAIL)   # 左・右（絵の上でうしろ・前と同じ太さに見えるはば RBS）
        sc.box(IN+PW,F-RB,z-RT,HX0-EPW,F-0.02,z,RAIL);sc.box(HX1+EPW,F-RB,z-RT,F-PW,F-0.02,z,RAIL)   # 前（さくのはしの太い柱まで）
    for t in (0.5,1.5):                                                      # さくの小さな柱（うしろ・左・右）。まん中のうしろは旗の柱
        sc.box(t-RB/2,IN+0.03,DZ,t+RB/2,IN+RB-0.01,DZ+RH-0.01,RAIL)
    if lv<3:sc.box(1.0-RB/2,IN+0.03,DZ,1.0+RB/2,IN+RB-0.01,DZ+RH-0.01,RAIL)   # うしろのまん中の小さな柱（旗のときは旗の柱）
    for t in (0.6,1.0,1.4):
        sc.box(IN+0.03,t-RB/2,DZ,IN+RB-0.01,t+RB/2,DZ+RH-0.01,RAIL);sc.box(F-RB+0.01,t-RB/2,DZ,F-0.03,t+RB/2,DZ+RH-0.01,RAIL)
    # すじかい：左右とうしろは、柱と柱のあいだにX。前は、柱と床の角に短い方づえ（ハシゴのじゃまをしない）
    zl,zh=DZ-0.95,DZ-DT-0.06
    for (a,b) in (((IN+PW,IN+PW/2,zl),(F-PW,IN+PW/2,zh)),((F-PW,IN+PW/2,zl),(IN+PW,IN+PW/2,zh)),
                  ((IN+PW/2,IN+PW,zl),(IN+PW/2,F-PW,zh)),((IN+PW/2,F-PW,zl),(IN+PW/2,IN+PW,zh)),
                  ((F-PW/2,IN+PW,zl),(F-PW/2,F-PW,zh)),((F-PW/2,F-PW,zl),(F-PW/2,IN+PW,zh)),
                  ((IN+PW,F-PW/2,DZ-0.55),(IN+PW+0.30,F-PW/2,zh)),((F-PW,F-PW/2,DZ-0.55),(F-PW-0.30,F-PW/2,zh))):
        a,b=np.array(a),np.array(b);d=(b-a)/np.linalg.norm(b-a)
        sc.beam(a-d*0.14,b+d*0.14,0.06,WOODD)                               # はしは柱・床の中までのばす（切り口がういて見えない）
    for x in LX:sc.box(x-LW/2,LY0,0,x+LW/2,LY1,DZ-0.01,LADDER)               # ハシゴ：まっすぐ立てる。床の上の面まで
    for (x0,x1) in ((HX0-EPW,HX0),(HX1,HX1+EPW)):                             # さくのはしの太い柱：ハシゴの柱の上に、床から立てて、前のさくの横木を受ける（内がわは穴のふちにそろえる）
        sc.box(x0,LY0-0.03,DZ-DT,x1,LY1,DZ+RH+0.06,WOODD)
        sc.box(x0-0.03,LY0-0.06,DZ+RH+0.06,x1+0.03,LY1+0.03,DZ+RH+0.14,RAIL)   # 柱の頭
    for i in range(1,9):z=i*(DZ-DT)/9;sc.box(HX0,LY0+0.02,z-0.06,HX1,LY1-0.03,z+0.06,LADDER,bevel=0.015)   # 段は柱のあいだだけ、床の下まで
    if lv>=3:                                                                  # 旗（Lv3〜4）・星（Lv5）：うしろのまん中に床から立てた柱。さくの横木は、この柱にとりつく
        top=DZ+RH+0.80;py0,py1=IN+0.02,IN+RB;pc=(py0+py1)/2
        sc.box(1.0-PP/2,py0,DZ-DT,1.0+PP/2,py1,top,WOODD,bevel=0.015)
        sc.box(1.0-PP/2-0.025,py0-0.025,top,1.0+PP/2+0.025,py1+0.025,top+0.05,RAIL,bevel=0.012)   # 柱のてっぺんの玉ぶち
        if lv<5:                                                               # 旗：柱の右がわにつける（柱の面から）
            sc.part();sc.tri((1.0+PP/2,pc,top-0.04),(1.0+PP/2,pc,top-0.36),(1.50,pc,top-0.20),(110,170,230))
        else:                                                                  # 星：柱のてっぺんにのせる（いちばん下のへこみが柱の上）
            sc.part();R0,R1=0.24,0.10;c=top+0.05+R1;pts=[]
            for i in range(10):a=-math.pi/2+i*math.pi/5;r=R1 if i%2==0 else R0;pts.append((1.0+r*math.cos(a),pc,c+r*math.sin(a)))
            for i in range(10):sc.tri((1.0,pc,c),pts[i],pts[(i+1)%10],(250,214,90))
out=sys.argv[1] if len(sys.argv)>1 else os.path.dirname(__file__)
ext=(-0.5,2.5,-3.5,2.25)
for lv in (1,3,5):
    sc=Scene();build(sc,lv);fg=render(sc,game,ext,VIEW)
    bg=grid_bg(ext,(2,2));bg.alpha_composite(fg);bg.save(f'{out}/watch_lv{lv}.png');fg.save(f'{out}/watch_lv{lv}_nogrid.png')
sc=Scene();build(sc,1);sext=(-0.5,2.5,-3.5,0.5);sd=render(sc,side,sext,SIDE);bg=grid_bg(sext);bg.alpha_composite(sd);bg.save(f'{out}/watch_side.png')
print('ok')
