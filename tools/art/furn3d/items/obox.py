# おそなえ箱（obox）：いまの絵のデザインのまま。白い石の箱・上に、ひとまわり大きい石のふた（まん中にほそ長い口）・前に立体の金の星・四すみの足・足もとの草。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（70×73ドット）に合わせる）
#   足：四すみに石の足（0.16角・高さ0.08、たての角を丸める）。地面におく。
#   本体：足の上にのる石の箱（よこ0.78・おく0.38・高さ0.52）。たての角を半径0.07で丸め、上下のふちも少し面取り。
#   ふた：本体の上にのる石の板（よこ0.92・おく0.52・あつさ0.10）。たての角を半径0.08で丸める。まん中に、ほそ長い口（よこ0.44・おく0.09）を、ぬいて作る。
#   口のふち：口のまわりに、少し高いふち（はば0.03・高さ0.02）。口のかべ・中は、光がとどかないので、くらい。
#   金の星：本体の前の面のまん中に、まん中がもり上がった立体の金の星（4つのとがり）。
#   草：足もとの左右に、草むら（粒）。
from blueprint import Part as P
from common import *
import math,random
from temple import ST,ST2,GOLD,LEAF,LEAF2,MT,LF,tufts,STONETEX,star3d,grass,gbox
ID='obox';BOTTOM=62;GRAD=True;CONTRAST=1.25
VIEWS=[('obox',0)]
X0,X1,Y0,Y1=0.08,0.92,0.46,0.90
s0,s1,t0,t1=0.28,0.72,0.61,0.70;z0,z1=0.60,0.70
def slot(x,y,z):   # 口の中のかべ：光がとどかないので、くらい（下ほどくらい）
    if s0-0.001<=x<=s1+0.001 and t0-0.001<=y<=t1+0.001 and z<z1+0.017:return (150,140,128) if z>0.65 else (124,116,106)
    return None
def S_(p):p.texobj=STONETEX;p.soft1=True;p.olk=0.96;return p   # 白い石の質感（神殿と同じ）
def piece(pts):   # 凸の形の点を、まわる順にならべる
    cx=sum(p[0] for p in pts)/len(pts);cy=sum(p[1] for p in pts)/len(pts)
    return sorted(pts,key=lambda p:math.atan2(p[1]-cy,p[0]-cx))
def PARTS():
    L=[]
    for k,(x,y) in enumerate(((X0,Y0),(X1-0.16,Y0),(X0,Y1-0.16),(X1-0.16,Y1-0.16))):
        L.append(S_(P('足%d'%(k+1),'prism',(rrect(x,y,x+0.16,y+0.16,0.04),0,0.08,'z'),ST2,bevel=0.01,note='地面におく')))
    L.append(S_(P('本体','prism',(rrect(X0+0.03,Y0+0.03,X1-0.03,Y1-0.03,0.07,n=6),0.08,0.60,'z'),ST,on=tuple('足%d'%k for k in range(1,5)),bevel=0.015,note='足の上')))
    a0,a1,b0,b1=X0-0.04,X1+0.04,Y0-0.04,Y1+0.04
    O_=rrect(a0,b0,a1,b1,0.08,n=6)   # ふたは、口のまわりの4つの石を組む（外の角は丸める）。口の所は、ぬけている
    for nm,pts in(('ふた',piece([q for q in O_ if q[1]<t0]+[(a0,t0),(a1,t0)])),('ふた（前）',piece([q for q in O_ if q[1]>t1]+[(a0,t1),(a1,t1)])),
                  ('ふた（左）',[(a0,t0),(s0,t0),(s0,t1),(a0,t1)]),('ふた（右）',[(s1,t0),(a1,t0),(a1,t1),(s1,t1)])):
        p=S_(P(nm,'prism',(pts,z0,z1,'z'),ST,on=('本体',),grp='ふた',note='本体の上'));p.decal=slot;L.append(p)
    for nm,bx in(('口のふち（おく）',(s0-0.03,t0-0.03,z1,s1+0.03,t0,z1+0.02)),('口のふち（前）',(s0-0.03,t1,z1,s1+0.03,t1+0.03,z1+0.02)),('口のふち（左）',(s0-0.03,t0,z1,s0,t1,z1+0.02)),('口のふち（右）',(s1,t0,z1,s1+0.03,t1,z1+0.02))):
        p=S_(P(nm,'box',bx,ST2,on=('ふた','ふた（前）'),bevel=0,grp='口のふち',note='口のまわりの、少し高いふち'));p.decal=slot;L.append(p)
    k=P('中のかげ','box',(s0,t0,0.52,s1,t1,0.60),(120,112,104),on=('本体',),note='口の下の箱の中');k.tex=False;L.append(k)
    return L
def EXTRA(sc):star3d(sc,0.5,Y1-0.03,0.34,0.18,0.065,0.08,GOLD)
GSP=((X0-0.01,Y1-0.01),(X0+0.0,Y1-0.14),(X1+0.01,Y1-0.01),(X1-0.0,Y1-0.14))
PBOX=gbox(GSP)
def PWATER():return grass(GSP,4)   # 足もとの草むらは粒
