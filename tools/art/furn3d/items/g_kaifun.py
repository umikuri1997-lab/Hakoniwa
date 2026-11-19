# 貝がらのふんすい（g_kaifun、水のせいれいの手紙のお礼）：大きなほたて貝のうけ皿に、まき貝の口から水がちょろちょろおちる、小さなふんすい（8コマで動く）。
# 設計図（単位はマス）：台（まるい石、半径0.16・高さ0〜0.06、石の質感）→ うけ皿（ひらいたほたて貝、半径0.27・高さ0.06〜0.16、つやのある貝、すじもよう）
#   → 皿の水（すける、高さ0.14）→ まき貝（皿のうしろのまん中に立つ、高さ0.16〜0.42、口は前を向く）→ 真珠（皿のふち）→ 水（粒：口から放物線で皿へ）。
from blueprint import Part as P
from common import *
from gfcommon import *
import math
ID='g_kaifun';BOTTOM=46;GRAD=True;FRAMES=8;STREAK=(0.25,0.12)
VIEWS=[('g_kaifun',0)]
FR=0
CX,CY=0.50,0.56;SHELL=(250,214,210);RIDGE=(226,150,160);CONCH=(250,236,214);CSTR=(226,190,150);WATER=(120,196,240);JET=(170,220,250);JETL=(236,248,255)
WZ=0.14;MOUTH=(CX,CY-0.02,0.36)
def PARTS():
    s=P('台','cyl',(CX,CY,0.16,0.0,0.06),(214,210,200),detail=32,note='地面におく');s.stone=True;L=[s]
    p=P('うけ皿','lathe',(CX,CY,[(0.0,0.06),(0.16,0.07),(0.25,0.12),(0.275,0.16),(0.25,0.155),(0.16,0.11),(0.0,0.1)]),SHELL,detail=64,on=('台',),note='台の上の、ひらいたほたて貝');p.tex=False;p.shiny=True
    p.decal=lambda x,y,z:RIDGE if int((math.atan2(y-CY,x-CX)+math.pi)*8/math.pi)%2==0 and math.hypot(x-CX,y-CY)>0.1 else None;L.append(p)
    c=P('まき貝','lathe',(CX,CY-0.13,[(0.0,0.11),(0.07,0.12),(0.08,0.2),(0.065,0.28),(0.045,0.35),(0.025,0.4),(0.0,0.43)]),CONCH,detail=32,on=('うけ皿',),note='皿のうしろに立てる');c.tex=False;c.shiny=True
    c.decal=lambda x,y,z:CSTR if int(z*45)%3==0 else None;L.append(c)
    m=P('貝の口','ball',(MOUTH[0],MOUTH[1]-0.0,MOUTH[2],0.035,0.8),(244,190,180),on=('まき貝',),note='まき貝の前の口');m.tex=False;L.append(m)
    for k,a in enumerate((200,340)):
        q=P('真珠%d'%k,'ball',(CX+0.24*math.cos(math.radians(a)),CY+0.24*math.sin(math.radians(a)),0.17,0.022),(252,248,244),on=('うけ皿',),note='皿のふち');q.tex=False;q.shiny=True;L.append(q)
    return L
def EXTRA(sc):
    ph=FR/FRAMES;r=0.24
    def disk(u,v):U,V=2*u-1,2*v-1;return (CX+r*U*math.sqrt(max(0,1-V*V/2)),CY+r*V*math.sqrt(max(0,1-U*U/2)))
    def top(x,y):X,Y=disk((x-(CX-r))/(2*r),(y-(CY-r))/(2*r));d=math.hypot(X-CX,Y-(CY+0.06));return WZ+0.005*math.sin(d*40-ph*2*math.pi)
    sc.material('clear');hfield(sc,CX-r,CY-r,CX+r,CY+r,top,lambda x,y:WATER,n=(40,40),shape=disk);sc.material(None)
PBOX=[(CX,CY,0.45)]
def PWATER():
    import random;t=FR/FRAMES;P=[];rnd=random.Random(3);d=MOUTH[2]-WZ;T=math.sqrt(2*d)
    for i in range(140):
        ph=rnd.random();age=(t+ph)%1.0;tau=age*T;vy=rnd.uniform(0.13,0.17)/T;w=rnd.uniform(-0.012,0.012)
        P.append((MOUTH[0]+w,MOUTH[1]+0.03+vy*tau,MOUTH[2]-tau*tau/2,rnd.uniform(0.009,0.014),rnd.choice([JETL,JET,JET]),0))
    for i in range(24):
        ph=rnd.random();an=rnd.uniform(0,2*math.pi);age=(t+ph)%1.0;up=rnd.uniform(0.02,0.04);v=math.sqrt(2*up);tau=age*2*v;rr=0.05*age
        P.append((MOUTH[0]+rr*math.cos(an),MOUTH[1]+0.18+rr*math.sin(an),WZ+v*tau-tau*tau/2,0.008,JETL,0))
    return P
TONE5=True;TONE3=True   # かげは3だん・あみ少し（限定の家具。持ち主がきめた）
