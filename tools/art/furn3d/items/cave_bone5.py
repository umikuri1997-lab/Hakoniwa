# 洞窟のほね（cave:bone#5）：とても大きなあばらぼね（2倍）。もとは cave_bone1。持ち主のたのみで、ほねの大きさの差をつける。大きな生き物のあばらぼね：せぼね（小さな骨のつらなり）から、弓なりの太いあばらが6本。かたほうは床にうまる。持ち主のたのみで作りなおした（太さのかわる骨 tongue・ふるい骨の色）。見た目だけのかざり。
# 設計図（単位はマス）：はば約1.2マス。床に半分うまる高さ。木と同じ5色のかげ（TONE5、あみかけなし）。
ID='cave_bone5';VIEWS=[('cave:bone#5',0)]
from blueprint import Part as P
import math
TONE5=True;DITHER=0;BOTTOM=56
B=(224,208,172);B2=(196,176,138);K=(70,54,40)
def T(name,pts,rs,col=B,on=('ground',)):
    p=P(name,'tongue',(pts,rs),col,on=on);p.tex=False;return p
POST=None
def PARTS():
    L=[]
    for i in range(9):   # せぼね：小さな骨のつらなり
        x=-0.15+i*0.16;L.append(P('せ%d'%i,'egg',(x,0.80,0.08,0.07,0.06,0.06,0),B))
        L.append(T('とげ%d'%i,[(x,0.80,0.1),(x-0.02,0.82,0.2)],[0.03,0.008]))
    for i in range(6):   # あばら：太さがかわる、弓なりの骨（よこにも、まがる）
        x=-0.12+i*0.19;r=0.6-i*0.04;h=0.42-i*0.03
        pts=[(x,0.78,0.09)]+[(x+0.24*(1-math.cos(t*1.7)),0.78-r*math.sin(t*1.45)*0.95,0.09+h*math.sin(t*2.6)) for t in(0.2,0.4,0.6,0.8,1.0)]   # 手前のせぼねから、おくへ弓なりに
        L.append(T('あばら%d'%i,pts,[0.035,0.032,0.028,0.024,0.018,0.012]))
    return L

_P0=PARTS
def PARTS():   # もとの部品を、まん中 (0.5,0.5) から 2.0 倍にする
    import numpy as np
    K=2.0;X=lambda x:0.5+(x-0.5)*K;Y=lambda y:0.55+(y-0.55)*K
    out=[]
    for p in _P0():
        d=p.dims
        if p.kind=='tongue':p.dims=([(X(a),Y(b),c*K) for a,b,c in d[0]],[r*K for r in d[1]])
        elif p.kind=='egg':p.dims=(X(d[0]),Y(d[1]),d[2]*K,d[3]*K,d[4]*K,d[5]*K)+tuple(d[6:])
        elif p.kind=='cone':p.dims=(X(d[0]),Y(d[1]),d[2]*K,d[3]*K,d[4]*K)
        f=getattr(p,'decal',None)
        if f:p.decal=lambda px,py,pz,f=f:f(0.5+(px-0.5)/K,0.55+(py-0.55)/K,pz/K)   # 面のもよう（目のあな）も同じだけ
        out.append(p)
    return out
