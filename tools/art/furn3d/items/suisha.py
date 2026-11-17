# 水車（suisha、1×1マス）：水べに建てる木の水車。まわり5マスの粉ひき小屋・はたおり機が、せいれいがいなくても動く。
# 設計図（じっさいに建てられる組み方。単位はマス）
#   土台：地面に、木の台（0.80×0.30、高さ0〜0.10）。うしろ（y 0.30〜0.60）。
#   柱：土台の上に2本（0.07角、高さ0.10〜0.70）、左右（x 0.30・0.63）。上に横木（0.06角、高さ0.70〜0.76）。
#   軸：横木のまん中から前へ、木の軸（半径0.035）。輪のまん中（ハブ）まで。
#   輪：カメラのほうを向く面にならべる（ゲームで2Dのまま回すので、写した形がまるくなるように、たての寸法を K 倍にのばす）。
#     ハブ（木の玉、半径0.06）・うで8本（はば0.035、ハブから0.36）・まわりのふち（はば0.05、半径0.33〜0.38、16この板）・水かき8まい（ふちの外へ0.07、はば0.06）。
#   動く部品（ゲームで回る）：輪（ハブ・うで・ふち・水かき）。回る支点はハブのまん中。
from blueprint import Part as P
from common import *
import math
ID='suisha';BOTTOM=56;GRAD=True
VIEWS=[('suisha',0)]
CX=0.5;HY=0.80;HZ=0.42;K=0.96   # 写した輪が、たてよこ同じ大きさ（まる）になるように（56×56）
def ring(r0,r1,a0,a1):   # 輪の面（x,z）の、扇の形の板
    n=4;o=[(CX+r1*math.cos(a0+(a1-a0)*i/n),HZ+K*r1*math.sin(a0+(a1-a0)*i/n)) for i in range(n+1)]
    return o+[(CX+r0*math.cos(a1-(a1-a0)*i/n),HZ+K*r0*math.sin(a1-(a1-a0)*i/n)) for i in range(n+1)]
def quad(s0,s1,t0,t1,a):   # ハブからの向き a の、長方形
    c,s=math.cos(a),math.sin(a);P_=lambda u,v:(CX+u*c-v*s,HZ+K*(u*s+v*c));return [P_(s0,t0),P_(s1,t0),P_(s1,t1),P_(s0,t1)]
def PARTS():
    L=[]
    L.append(P('土台','box',(0.10,0.30,0,0.90,0.60,0.10),WOOD,bevel=0,note='地面におく'))
    for nx,x in(('左',0.30),('右',0.63)):L.append(P('%sの柱'%nx,'box',(x,0.42,0.10,x+0.07,0.49,0.70),WOOD,bevel=0,on=('土台',),note='土台にほぞでたてる'))
    L.append(P('横木','box',(0.26,0.425,0.70,0.74,0.485,0.76),WOOD,bevel=0,on=('左の柱','右の柱'),note='柱の上にのせる'))
    L.append(P('軸','log',((CX,0.49,HZ),(CX,HY-0.02,HZ),0.035),WOOD,on=('横木',),note='柱のあいだの横木から前へ（ささえの木は見えない）'))
    y0=HY-0.03
    L.append(P('輪のハブ','ball',(CX,HY,HZ,0.06),WOOD,on=('軸',),note='軸のさき'))
    for k in range(8):
        a=k*math.pi/4
        L.append(P('輪のうで%d'%(k+1),'prism',(quad(0.04,0.35,-0.017,0.017,a),y0+0.010,y0+0.040),WOOD,on=('輪のハブ',),note='ハブにさしこむ',grp='輪うで'))
        L.append(P('輪の水かき%d'%(k+1),'prism',(quad(0.375,0.45,-0.03,0.03,a+math.pi/8),y0-0.010,y0+0.060),WOOD,on=('輪のふち%d'%(2*k+1),),note='ふちの外がわに、くぎでとめる'))
    for k in range(16):
        a0=k*2*math.pi/16;a1=(k+1)*2*math.pi/16-0.01
        L.append(P('輪のふち%d'%(k+1),'prism',(ring(0.33,0.38,a0,a1),y0,y0+0.050),WOOD,on=('輪のうで%d'%(k//2+1),),note='うでのさきに、くぎでとめる',grp='輪ふち'))
    return L
MOVE={'suisha':{'sel':lambda n:n.startswith('輪'),'pivot':(CX,HY,HZ)}}

TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
