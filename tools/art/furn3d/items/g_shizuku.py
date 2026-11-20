# 金魚ばち（g_shizuku、水のせいれいのお返し）：まるくふくらんだガラスのはち。上の口は、すこしせまくなってから、ひらひら外へひらく。
#   中は4分の3まで水、赤い金魚が1ぴき（大きなひらひらのしっぽ）・水草・底の小石。台はなく、地面にじかにおく。
# 設計図（単位はマス）：ガラス（ろくろの形、底の半径0.15・いちばん太い所の半径0.27（高さ0.22）・首の半径0.17（高さ0.42）・口のふち半径0.21（高さ0.46）、material glass）
#   → 水（ガラスの内がわ、高さ0.33まで、material gwater）→ 底の小石・水草2本 → 金魚（からだ・しっぽ2まい・せびれ、水の中）。
from blueprint import Part as P
from common import *
import math
ID='g_shizuku';BOTTOM=46;GRAD=True
VIEWS=[('g_shizuku',0)]
CX,CY=0.50,0.55;FISH=(246,108,62);FIN=(252,176,110);GL=(214,238,250);WA=(150,206,240)
OUT=[(0.15,0.0),(0.22,0.04),(0.26,0.12),(0.27,0.22),(0.255,0.32),(0.2,0.4),(0.17,0.43),(0.19,0.45),(0.215,0.465)]
def r_at(z,prof):
    for (r0,a),(r1,b) in zip(prof,prof[1:]):
        if a<=z<=b:return r0+(r1-r0)*(z-a)/max(1e-9,b-a)
    return prof[-1][0]
def PARTS():
    L=[]
    for k,(dx,dy,r,c) in enumerate([(-0.08,0.03,0.045,(220,210,190)),(0.06,-0.02,0.04,(200,190,172)),(0.0,0.07,0.04,(232,196,170)),(0.09,0.06,0.035,(206,214,220))]):
        p=P('小石%d'%k,'ball',(CX+dx,CY+dy,0.035,r,0.6),c,note='はちの底');p.tex=False;L.append(p)
    for k,(dx,h) in enumerate([(-0.11,0.2),(0.12,0.15)]):
        L.append(notex(P('水草%d'%k,'cyl',(CX+dx,CY-0.05,0.02,0.02,0.02+h),(104,186,116),detail=6,on=('小石0',),note='底から水の中へ')))
    f=P('金魚','ball',(CX-0.02,CY+0.04,0.2,0.07,0.7),FISH,on=('水',),note='水の中にうかぶ');f.tex=False;L.append(f)
    t=P('しっぽ','prism',([(CX+0.04,0.2),(CX+0.17,0.28),(CX+0.12,0.2),(CX+0.17,0.12)],CY+0.02,CY+0.06,'y'),FIN,on=('金魚',),note='からだのうしろに、ひらひらのしっぽ');t.tex=False;L.append(t)
    L.append(notex(P('せびれ','prism',([(CX-0.04,0.245),(CX+0.02,0.29),(CX+0.04,0.25)],CY+0.035,CY+0.045,'y'),FIN,on=('金魚',),note='せなか')))
    w=P('水','lathe',(CX,CY,[(0.0,0.012)]+[(r_at(z,OUT)-0.012,z) for z in (0.012,0.04,0.12,0.22,0.3,0.33)]+[(0.0,0.33)]),WA,detail=48,note='ガラスの内がわ、4分の3まで');w.tex=False;w.gwater=True;L.append(w)
    g=P('ガラス','lathe',(CX,CY,[(0.0,0.0)]+OUT+[(0.2,0.465),(0.18,0.45),(0.158,0.43)]+[(r_at(z,OUT)-0.012,z) for z in (0.4,0.32,0.22,0.12,0.04,0.012)]+[(0.0,0.012)]),GL,detail=64,note='地面におく。ろくろでひいたガラス');g.tex=False;g.glass=True;L.append(g)
    return L
TONE5=True;TONE3=True   # かげは3だん・あみ少し（限定の家具。持ち主がきめた）
