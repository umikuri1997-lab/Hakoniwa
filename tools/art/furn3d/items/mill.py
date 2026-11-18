# 粉ひき小屋（mill、2×2マス）：うしろに、かたながれの屋根の小屋。前の広場に、大きな石うす。こむぎを、こむぎこにする。
#   見おろしでは屋根が石うすをかくすので、屋根はうしろの半分だけにする。
# 設計図（じっさいに建てられる組み方。単位はマス）
#   小屋の柱：うしろに2本（0.08角・高さ0〜1.10）、前に2本（0.08角・高さ0〜0.86）。うしろは y 0.62、前は y 1.12。
#   うしろのかべ：うしろの柱のあいだに、たて板（はば0.095・あつさ0.025）をすきまなく。
#   けた：前の柱の上・うしろの柱の上に、よこの角材（0.06角）。
#   屋根：うしろから前へさがる、かたながれ。板（あつさ0.025）を、よこ長に4まい。柱の外まで、よこ0.08・前0.10出す。
#   台：前の広場のまん中に、木の台（0.80×0.56、高さ0〜0.12）。
#   石うす：台の上に、下の石（半径0.30・高さ0.09）と上の石（半径0.26・高さ0.09）。上の石のまん中に、こむぎを入れる穴（くらい色）と、まわすための木の取っ手（たての棒）。
#   こむぎこのふくろ：小屋の下の左に2つ（白い布のふくろ、口をひもでしばる）。
from blueprint import Part as P
from common import *
import math
ID='mill';SZ=(2,2);BOTTOM=128;GRAD=True
VIEWS=[('mill',0),('mill>1',1),('mill>2',2)]   # 前・右・後ろ（左は右の反転）
X0,X1=0.16,1.84;YB,YF=0.62,1.12;PS=0.08;ZB,ZF=1.10,0.86
STONE=(220,216,210);HOLE=(150,140,130);SACKC=(246,242,232);TIE=(196,160,120)
def PARTS():
    L=[]
    for nx,x in(('左',X0),('右',X1-PS)):
        L.append(P('柱（%sうしろ）'%nx,'box',(x,YB,0,x+PS,YB+PS,ZB),WOOD,bevel=0,note='地面に立てる'))
        L.append(P('柱（%s前）'%nx,'box',(x,YF-PS,0,x+PS,YF,ZF),WOOD,bevel=0,note='地面に立てる'))
    L.append(P('けた（うしろ）','box',(X0-0.04,YB+0.01,ZB-0.06,X1+0.04,YB+0.07,ZB),WOOD,bevel=0,on=('柱（左うしろ）','柱（右うしろ）'),note='柱の上にのせる'))
    L.append(P('けた（前）','box',(X0-0.04,YF-0.07,ZF-0.06,X1+0.04,YF-0.01,ZF),WOOD,bevel=0,on=('柱（左前）','柱（右前）'),note='柱の上にのせる'))
    L+=planks('うしろのかべの板',X0,X1,YB-0.025,YB,0.0,lambda x:ZB-0.06,on=('柱（左うしろ）','柱（右うしろ）'))
    # 屋根：うしろのけたから前のけたへ。前へ0.10、よこへ0.08出す
    y0,z0,y1,z1=YB-0.04,ZB+0.005,YF+0.10,ZF-(ZB-ZF)*0.10/(YF-YB)+0.005
    L0=math.hypot(y1-y0,z1-z0);uy,uz=(y1-y0)/L0,(z1-z0)/L0;ny_,nz_=-uz,uy
    if nz_<0:ny_,nz_=-ny_,-nz_
    pt=lambda s,h:(y0+uy*s+ny_*h,z0+uz*s+nz_*h);NB=4;bt=0.025
    for b in range(NB):
        s0=L0*b/NB;s1=L0*(b+1)/NB-0.002
        L.append(P('屋根板%d'%(b+1),'prism',([pt(s0,0),pt(s1,0),pt(s1,bt),pt(s0,bt)],X0-0.08,X1+0.08,'x'),WOOD,on=('けた（うしろ）','けた（前）'),note='けたにくぎでとめる'))
    CX,CY=1.0,1.50
    L.append(P('台','box',(CX-0.40,CY-0.28,0,CX+0.40,CY+0.28,0.12),WOOD,bevel=0,note='地面におく'))
    p=notex(P('下の石','cyl',(CX,CY,0.30,0.12,0.21),STONE,on=('台',),detail=48,note='台の上におく'));p.soft1=True;L.append(p)
    def hole(x,y,z):return HOLE if math.hypot(x-CX,y-CY)<0.05 else None
    p=notex(P('上の石','cyl',(CX,CY,0.26,0.212,0.30),STONE,on=('下の石',),detail=48,note='下の石の上にのせる'));p.decal=hole;p.soft1=True;L.append(p)
    L.append(P('取っ手','cyl',(CX+0.17,CY+0.05,0.025,0.30,0.46),WOOD,on=('上の石',),detail=16,note='上の石の穴にさしこむ'))
    for k,(sx,sy) in enumerate([(0.42,0.86),(0.66,0.92)]):
        p=notex(P('こむぎこのふくろ%d'%(k+1),'egg',(sx,sy,0.14,0.11,0.10,0.14,0),SACKC,on=('ground',),note='地面におく'));p.soft1=True;L.append(p)
        L.append(notex(P('ふくろのひも%d'%(k+1),'cyl',(sx,sy,0.065,0.25,0.28),TIE,on=('こむぎこのふくろ%d'%(k+1),),detail=16,note='ふくろの口をしばる')))
    return L

TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
