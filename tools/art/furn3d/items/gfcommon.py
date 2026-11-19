# 限定の家具（g_*）の質感（持ち主のたのみ：毎回、質感を入れる）
import os
import oblique3d as O
TX=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','textures')
WOODT=O.Tex(os.path.join(TX,'wood049.png'),span=1.0,flow=8,minrun=3,dark=(0.34,0.82),light=(0.26,1.1))   # 木目
PAPERT=O.Tex(os.path.join(TX,'paper005.png'),span=0.8,flow=2,minrun=2,dark=(0.12,0.95),light=(0.1,1.04))   # 紙のすじ
CLAYT=O.Tex(os.path.join(TX,'plaster001.png'),span=1.0,flow=2,minrun=2,dark=(0.3,0.86),light=(0.22,1.08))   # 素焼きの土のざらつき
def W(p):p.texobj=WOODT;return p
def PA(p):p.texobj=PAPERT;return p
def CL(p):p.texobj=CLAYT;return p
FABT=O.Tex(os.path.join(TX,'fabric026.png'),span=0.35,flow=1,minrun=1,dark=(0.1,0.96),light=(0.08,1.03))   # 布の織り目
def FA(p):p.texobj=FABT;return p
import math
import numpy as _np
def _n(v):v=_np.array(v,float);return v/max(1e-9,_np.linalg.norm(v))
def leaf(sc,p0,d,L,Wd,col,vein=None,up=(0,0,1),curl=0.12,droop=0.0,n=10,m=6,tip=1.0):
    """とがった葉を1まい（うすい面）。p0：つけね・d：のびる向き・L：長さ・Wd：はばの半分。curl：よこにまるめる・droop：さきが下へたれる。
    色：まん中のすじ・よこのすじは vein、ふちは少しこく"""
    p0=_np.array(p0,float);d=_n(d);sd=_n(_np.cross(d,up));nm=_n(_np.cross(sd,d))
    vein=vein or tuple(c*0.86 for c in col);edge=tuple(c*0.93 for c in col)
    def P(u,v):
        w=Wd*math.sin(math.pi*min(1,u))**0.75*(1-0.25*u)
        return p0+d*L*u+sd*w*v+nm*(curl*Wd*(v*v)-droop*L*u*u)
    sc.part()
    for i in range(n):
        for j in range(m):
            u0,u1=i/n,(i+1)/n;v0,v1=-1+2*j/m,-1+2*(j+1)/m;uc,vc=(u0+u1)/2,(v0+v1)/2
            c=vein if abs(vc)<1.0/m+0.01 and uc<0.9 else col
            sc.quad(P(u0,v0),P(u1,v0),P(u1,v1),P(u0,v1),c)
