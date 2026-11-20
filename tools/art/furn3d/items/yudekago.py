# ゆでかご（yudekago）：温泉の湯にしずめて、たけのこなどをゆでる竹のかご（火山）。温泉の水のマスに置く。
# 設計図（じっさいに作れる組み方。単位はマス。水面は高さ0）
#   くい：青竹2本（半径0.035・高さ0.66）。かごの左と右、湯の底にさして立てる。
#   横木：青竹1本（半径0.03）。2本のくいの上（高さ0.60）にわたして、なわでしばる。
#   なわ：2本。横木から、かごのふちの左と右へさげる。
#   かご：竹であんだ、まるいかご（外の半径0.25・かべのあつさ0.03）。下の半分は湯の中なので、絵にするのは水面（高さ0）から上の0.11だけ。底は竹のあみ。
#   ふちの竹：かごの口に、竹のたがを1本まく（高さ0.17〜0.21）。
#   たけのこ：かごの中に3本（円すい。根もとの半径0.07・高さ0.16）。底にならべる。
from blueprint import Part as P
from common import *
import math
ID='yudekago';GRAD=True;BOTTOM=50
VIEWS=[('yudekago',0)]
CX,CY=0.50,0.50;R=0.25;TH=0.03;Z0=0.0;Z1=0.11
GREEN=(170,204,128);BASKET=(232,208,146);HOOP=(206,178,112);ROPE=(214,190,150);TAKE=(212,170,112);TIP=(236,214,160)
def NT(p):p.tex=False;return p
def PARTS():
    L=[]
    for n,x in(('左',CX-0.36),('右',CX+0.36)):L.append(NT(P('くい（%s）'%n,'cyl',(x,CY,0.035,Z0,0.66),GREEN,detail=16,note='湯の底にさして立てる')))
    L.append(NT(P('横木','log',((CX-0.42,CY,0.60),(CX+0.42,CY,0.60),0.03),GREEN,on=('くい（左）','くい（右）'),note='くいの上にわたして、なわでしばる')))
    L.append(NT(P('かご','ring',(CX,CY,R-TH,R,Z0,Z1),BASKET,detail=40,on=('なわ（左）','なわ（右）'),note='なわでつる。下の半分は湯の中')))
    L.append(NT(P('かごの底','cyl',(CX,CY,R-TH+0.002,Z0,Z0+0.02),BASKET,detail=40,on=('かご',),note='かごの下のはし')))
    L.append(NT(P('ふちの竹','ring',(CX,CY,R-TH-0.004,R+0.012,Z1-0.03,Z1+0.012),HOOP,detail=40,on=('かご',),note='かごの口にまく')))
    for n,s in(('左',-1),('右',1)):L.append(NT(P('なわ（%s）'%n,'rope',((CX+s*(R-0.01),CY,Z1),(CX+s*(R-0.01),CY,0.60),0.012),ROPE,on=('横木',),note='横木から、かごのふちへ')))
    for k,(dx,dy,h) in enumerate(((-0.09,0.03,0.17),(0.07,-0.04,0.15),(0.04,0.09,0.13))):
        t=NT(P('たけのこ%d'%(k+1),'cone',(CX+dx,CY+dy,0.07,Z0+0.02,Z0+0.02+h),TAKE,detail=16,on=('かごの底',),note='かごの底にならべる'))
        z0=Z0+0.02;t.decal=(lambda z0,h:lambda x,y,z:TIP if z>z0+h*0.62 else None)(z0,h);L.append(t)
    return L

TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
DITHER=0.04   # あみかけは最小限（持ち主がきめた。ふつうは furntone.DW）
