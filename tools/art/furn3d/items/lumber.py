# 伐採場（lumber）：いまの絵（お手本）と同じならび。すそのひろがった大きな切り株に斧がささり、右に丸太を2本ななめにねかせ、左手前に、わった板・木くず、そばに草。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（93×68ドット）に合わせた）
#   切り株：皮のついた丸太をたてにした形（半径0.28・高さ0〜0.26。上の面は年輪）。根5本：幹のすそ（高さ0.18）から地面（まん中から0.44）へひろがる三角のひれ（はば0.24→上0.12）。下の面は地面につき、幹の中からはじまる。
#   斧：鉄の頭（あつさ0.035、刃はこの面の中で、柄にちょっかく）を、切り株のまん中より0.10うしろに、刃を0.04ほど切りこませる。柄（木、半径0.028）は頭の穴から右上へ。刃先（はしから0.075）は、といだ明るい色。
#   丸太：皮のついた丸太（半径0.11・長さ0.58〜0.60）2本を、地面にならべて、ななめにねかせる（おくが左・手前が右）。切り口は手前とおく。
#   わった板：木の板（0.28×0.12×0.07・0.24×0.10×0.06）を、左手前の地面に、よこにねかせる。木くず：うすい板を地面に3まい。
#   草：トリポの草（tripo/grass.glb）を、切り株の左と右手前に。
from blueprint import Part as P
from common import *
from blueprint import LOGEND
import math
ID='lumber';GRAD=True;BOTTOM=62
VIEWS=[('lumber',0)]
CX,CY,R,HT=0.34,0.52,0.28,0.26
BARK=(214,160,104);IRON=(176,180,196);GRASS=(150,206,104)
EDGE=(238,242,250)   # 刃先：といだ明るい色
RO,RZ,RW=0.44,0.18,0.12   # 根：地面でとどく所・幹につく高さ・はばの半分
def MT(p):p.metal=True;p.tex=False;return p
def PARTS():
    L=[P('切り株','log',((CX,CY,0.0),(CX,CY,HT),R),BARK,note='地面にたてる')]
    for k,a in enumerate((195,300,30,125,250)):   # 根：幹のすそから、地面へひろがる三角のひれ（下の面は地面につく。幹の中からはじまる）
        r=math.radians(a);ca,sa=math.cos(r),math.sin(r)
        def lay(z,ca=ca,sa=sa):
            t=z/RZ;ro=RO-(RO-R)*t**0.7;w=RW*(1-0.5*t)   # 上ほど、幹によって細く
            return([(CX+u*ca-v*sa,CY+u*sa+v*ca) for u,v in((R-0.10,-w),(ro,-w*0.5),(ro,w*0.5),(R-0.10,w))],z)
        q=P('根%d'%(k+1),'loft',[lay(z) for z in(0.0,0.05,0.10,0.15,RZ)],BARK,on=('切り株',),note='幹のすそから地面へ、下の面は地面');L.append(notex(q))
    d=(0.82,0.57);b=(0.57,-0.82);E=(CX-0.15,HT+0.25);AY=CY-0.10   # 斧：柄の向き d、刃の向き b（d にちょっかく）
    pt=lambda s,t:(E[0]+s*d[0]+t*b[0],E[1]+s*d[1]+t*b[1])
    head=[pt(-0.055,-0.06),pt(0.055,-0.06),pt(0.065,0.08),pt(0.13,0.24),pt(-0.13,0.24),pt(-0.065,0.08)]
    ax=MT(P('斧の頭','prism',(head,AY-0.0175,AY+0.0175),IRON,on=('切り株',),note='刃を切り株の上の面に切りこませる'))
    ax.decal=lambda x,y,z:EDGE if (x-E[0])*b[0]+(z-E[1])*b[1]>0.165 else None   # 刃先の帯（といだ所）
    L.append(ax)
    a=pt(-0.02,0);e=pt(0.34,0)
    h=P('斧の柄','frust',((a[0],AY,a[1]),(e[0],AY,e[1]),0.026,0.030),WOOD,on=('斧の頭',),note='頭の穴にさしこむ');h.detail=12;L.append(notex(h))
    RL=0.11
    for k,(xa,ya,xb,yb) in enumerate(((0.74,0.34,0.96,0.90),(0.97,0.30,1.19,0.86))):L.append(P('丸太%d'%(k+1),'log',((xa,ya,RL),(xb,yb,RL),RL),BARK,note='地面に、ななめにねかせる（おくが左・手前が右）'))
    L.append(P('わった板1','box',(-0.14,0.78,0,0.14,0.90,0.07),WOOD,bevel=0,note='地面'))
    L.append(P('わった板2','box',(0.00,0.92,0,0.24,1.02,0.06),WOOD,bevel=0,note='地面'))
    for k,(x,y,w,dd) in enumerate(((0.40,0.92,0.09,0.05),(0.56,0.97,0.07,0.04),(0.66,0.88,0.06,0.04))):
        L.append(notex(P('木くず%d'%(k+1),'box',(x,y,0,x+w,y+dd,0.02),LOGEND,bevel=0,note='地面')))
    for k,(x,y,s,rot) in enumerate(((-0.06,0.60,0.20,0),(0.66,0.78,0.17,70))):
        g=P('草%d'%(k+1),'model',('tripo/grass.glb',x,y,0,s,rot,0),on=('ground',),note='地面',deco=True);g.recol=GRASS;g.recolk=0.6;g.olk=0.86;L.append(notex(g))
    return L
