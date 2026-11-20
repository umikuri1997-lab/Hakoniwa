# g_w_kinoko（特別な家具・木）：きのこのスツール。草のベッド（g_w_bed）のかわり（持ち主がえらんだ）。トリポのモデルはなく、設計図から3Dで組む。
# 設計図（単位はマス。置くマス1×1、地面におく）
#   じく：クリーム色の、根もとが少しひろがった円柱（半径0.17→0.13・高さ0〜0.30）。
#   かさ（すわる所）：じくの上。下の面（ひだ・うすい茶）は高さ0.29〜0.33、ふち（半径0.31）から、上はひくいドーム（てっぺん0.47、まん中はすわれるように平ら）。
#     かさの色は、やわらかい赤茶。上の面に白い水玉8こ（半径0.035〜0.05）。
#   足もと：右手前に小さなきのこ1本（じく・かさ・白い点1こ）、左うしろに苔のかたまり2こ。どの向きから見ても同じに見えないように。
# かげと質感は、ほかの限定の家具と同じマットキャップ・スムーズシェード80度・見おろし30度・平行に写す。
import numpy as np,math
from blueprint import Part as P
ID='g_w_kinoko';BOTTOM=58;GRAD=True
VIEWS=[('g_w_kinoko',0),('g_w_kinoko>1',1),('g_w_kinoko>2',2),('g_w_kinoko>3',3)]
CX,CY=0.5,0.5;STEM=(250,238,210);GILL=(238,196,150);CAP=(232,72,56);DOT=(255,250,240);MOSS=(118,196,72)   # あざやかに（持ち主）
import random
_R=random.Random(7);DOTS=[]   # 水玉（持ち主：白もようが不自然）：大きさのそろった丸を少しならべるのをやめ、本物のベニテングタケのように、
# てっぺんほど大きく・ふちほど小さいつぶを、いびつな形で、12こちらす。ふち（りんかくにかかる所）には置かない
while len(DOTS)<12:
    a=_R.uniform(0,360);e=_R.uniform(28,88);r=0.10+0.12*(e-28)/60*_R.uniform(0.7,1.0)
    u=(math.cos(math.radians(e))*math.cos(math.radians(a)),math.cos(math.radians(e))*math.sin(math.radians(a)),math.sin(math.radians(e)))
    if all(math.acos(max(-1,min(1,sum(p*q for p,q in zip(u,v)))))>(r+w)*1.25 for v,w,_ in DOTS):DOTS.append((u,r,_R.uniform(0,6.28)))
def capdecal(x,y,z):
    if z<0.335:return GILL
    v=((x-CX)/0.31,(y-CY)/0.31,(z-0.29)/0.18);n=math.sqrt(sum(q*q for q in v)) or 1;v=[q/n for q in v]   # ドームの上の場所（ドームのつぶれをもどした向き）
    for u,r,ph in DOTS:
        d=math.acos(max(-1,min(1,sum(p*q for p,q in zip(u,v)))))
        if d<r*1.3:
            t=math.atan2(v[1]-u[1],v[0]-u[0])
            if d<r*(1+0.22*math.sin(3*t+ph)+0.12*math.sin(5*t+ph*2)):return DOT   # いびつなふち
    return CAP
def PARTS():
    L=[]
    s=P('じく','lathe',(CX,CY,[(0.0,0.0),(0.17,0.0),(0.15,0.04),(0.135,0.12),(0.13,0.24),(0.14,0.30),(0.0,0.30)]),STEM,detail=48,on=('ground',),note='地面におく');s.tex=False;L.append(s)
    c=P('かさ','lathe',(CX,CY,[(0.0,0.29),(0.14,0.29),(0.29,0.32),(0.31,0.345),(0.30,0.38),(0.26,0.42),(0.18,0.455),(0.08,0.47),(0.0,0.47)]),CAP,detail=64,on=('じく',),note='じくの上');c.tex=False;c.decal=capdecal;L.append(c)
    mx,my=CX+0.27,CY+0.20   # 小さなきのこ
    s2=P('小さなじく','lathe',(mx,my,[(0.0,0.0),(0.045,0.0),(0.035,0.06),(0.035,0.10),(0.0,0.10)]),STEM,detail=24,on=('ground',));s2.tex=False;L.append(s2)
    def d2(x,y,z):return DOT if z>0.15 and math.hypot(x-mx-0.015,y-my+0.01)<0.022 else (GILL if z<0.105 else CAP)
    c2=P('小さなかさ','lathe',(mx,my,[(0.0,0.095),(0.08,0.10),(0.085,0.115),(0.07,0.14),(0.035,0.16),(0.0,0.165)]),CAP,detail=32,on=('小さなじく',));c2.tex=False;c2.decal=d2;L.append(c2)
    for i,(bx,by,r) in enumerate([(CX-0.22,CY-0.16,0.07),(CX-0.12,CY-0.24,0.055)]):
        m=P('苔%d'%i,'ball',(bx,by,r*0.25,r,0.55),MOSS,on=('ground',));m.tex=False;L.append(m)
    return L
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # ほかの限定の家具と同じ
