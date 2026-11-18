# ふしぎな切り株（kdkabu、もりのこだまの見つかる所）：切り株（stump.glb、伐採場と同じ作り・色）を高さ0.30マスで地面に置き、
#   切り口の上に、だれかがつんだような小石を3つ（下から大・中・小のたまごの形、灰青の石）。光は自然の物の太陽（natcommon.SUN）。
from blueprint import Part as P,model_tris
from common import *
from natcommon import SUN
import math
import numpy as np
from lumber import rings,rootwarp,model,BARK
ID='kdkabu';GRAD=True;BOTTOM=58;LIGHT=SUN
VIEWS=[('kdkabu',0)]
CX,CY=0.5,0.52
PEB=(178,190,204)
def PARTS():
    L=[]
    V0,F0,_=model_tris('tripo/stump.glb',0,0,0,1.0);t0=V0[F0];n0=np.cross(t0[:,1]-t0[:,0],t0[:,2]-t0[:,0]);n0/=np.linalg.norm(n0,axis=1,keepdims=True)+1e-9
    sel=(np.abs(n0[:,2])>0.85)&(t0[:,:,2].mean(1)>V0[:,2].max()*0.6);ar=np.linalg.norm(np.cross(t0[:,1]-t0[:,0],t0[:,2]-t0[:,0]),axis=1)
    UP=(n0[sel]*np.sign(n0[sel][:,2:3])*ar[sel,None]).sum(0)
    s,V=model('切り株','stump.glb',CX,CY,0.30,160,BARK,up=tuple(UP))
    Fm=model_tris(*s.dims)[1];t=V[Fm];n=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]);n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-9
    tp=t[(np.abs(n[:,2])>0.85)&(t[:,:,2].mean(1)>V[:,2].max()*0.6)].reshape(-1,3)
    co=np.linalg.lstsq(np.c_[tp[:,:2],np.ones(len(tp))],tp[:,2],rcond=None)[0];c=tp[:,:2].mean(0);R=np.hypot(*(tp[:,:2]-c).T).max();HT=float(co@[c[0],c[1],1])
    s.decal=lambda x,y,z:rings(math.hypot(x-c[0],y-c[1]),R) if z>co[0]*x+co[1]*y+co[2]-0.02 and math.hypot(x-c[0],y-c[1])<R*1.02 else None;s.barktex=True;s.warp=rootwarp(c,R*1.05,0.4);L.append(s)
    z=HT;prev='切り株'
    for k,(rx,rz) in enumerate(((0.10,0.055),(0.075,0.045),(0.05,0.035))):   # 小石：下から大・中・小。少しずつずらしてつむ
        x=c[0]+(-0.012,0.014,-0.006)[k];y=c[1]+(0.0,-0.01,0.004)[k]
        p=P('小石%d'%(k+1),'egg',(x,y,z+rz,rx,rx*0.9,rz,(10,-25,40)[k]),PEB,on=(prev,),note='下の物の上にのせる');p.tex=False;L.append(p)
        z+=rz*2-0.012;prev='小石%d'%(k+1)
    return L
TONE5=True
