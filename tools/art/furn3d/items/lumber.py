# 伐採場（lumber）：画角30・左右にも遠近・見おろし34度。色は、いまの絵に合わせる。いまの絵（お手本）と同じならび。根のはった切り株に斧がささり、右に丸太を2本ななめにねかせ、左手前に、わったまき、そばに葉の小枝。
# 形は、トリポのモデル（tools/art/models/tripo：stump・log_lying・firewood・sprig）。色は設計図でつける（モデルは色なし）。単位はマス。大きさは、いまの絵（93×68ドット）に合わせた。
#   切り株（stump.glb）：根は、のこす長さ0.6にちぢめ、さきほど細く・低くする（rootwarp）。高さ0.63で、地面に置く（根が手前へまっすぐ向かないよう40度まわす）。上の面（切り口。モデルでは約17度かたむいているので、モデルをまわして水平にする）は年輪の色（もよう）、ほかは皮の色。
#   斧：鉄の頭（あつさ0.035、刃はこの面の中で、柄にちょっかく）を、切り株のまん中より0.10うしろに、刃を切り口に切りこませる。柄（木、半径0.028）は頭の穴から右上へ。刃先は、といだ明るい色。
#   丸太（log_lying.glb）2本：地面に、ななめにねかせる（おくが左・手前が右）。切り口は明るい木で、年輪の線とふちは皮の色（もよう）。
#   わったまき（firewood.glb）：左手前の地面に。わった面・切り口は明るい木、皮は皮の色。
#   葉の小枝（sprig.glb）：切り株の左と右手前の地面に。木くず：うすい板を地面に3まい。
from blueprint import Part as P,model_tris,LOGEND,MAKIRING,MAKIHEART
from common import *
import math
import numpy as np
ID='lumber';GRAD=True;BOTTOM=62;FOV=30;FULLPERSP=True;ELEV=34   # 画角30・左右にも遠近・見おろし34度（持ち主がきめた）
VIEWS=[('lumber',0)]
CX,CY=0.34,0.52
BARK=(222,134,66);IRON=(176,180,196);LEAF=(150,200,86);HANDLE=(214,150,90)   # 色は、いまの絵（お手本）に合わせる
TOP=(234,186,126);RING=(246,222,174);HEART=(240,200,140);CHIP=(240,206,150)
EDGE=(238,242,250)   # 刃先：といだ明るい色
T='tripo/'
def rings(r,R):   # 切り口の色：皮のふち・明るい木・年輪の線・しん
    q=r/R
    if q>0.90:return BARK
    if 0.58<q<0.66 or 0.30<q<0.35:return RING
    if q<0.12:return HEART
    return TOP
def logring(r,R):   # 丸太の切り口：年輪の線とふちは皮の色
    q=r/R
    if q>0.86 or 0.52<q<0.62:return BARK
    if q<0.14:return HEART
    return TOP
def rootwarp(c,R,HT):
    """根をちぢめ、さきほど細くする：幹（半径 R）の外の点を、まん中へよせ（のこす長さ0.6）、
    根のまん中の向き（地面の近くの点の向きの山、5本）へよせ（さきほど強く）、高さもさきほど低くする"""
    def f(V):
        d=V[:,:2]-c;r=np.hypot(d[:,0],d[:,1]);th=np.arctan2(d[:,1],d[:,0]);o=r>R*1.05
        g=V[:,2]<HT*0.35;hb=np.histogram(th[o&g],bins=72,range=(-np.pi,np.pi),weights=r[o&g]-R)[0]
        hb=np.convolve(np.r_[hb[-3:],hb,hb[:3]],np.ones(5),'same')[3:-3];pk=[]
        for i in np.argsort(-hb):
            a=-np.pi+(i+0.5)*2*np.pi/72
            if all(abs((a-b+np.pi)%(2*np.pi)-np.pi)>0.5 for b in pk):pk.append(a)
            if len(pk)==5:break
        rm=r[o].max();t=np.clip((r-R)/(rm-R),0,1)
        nr=np.where(o,R+(r-R)*0.6,r)
        P_=np.array(pk);df=(th[:,None]-P_[None,:]+np.pi)%(2*np.pi)-np.pi;j=np.argmin(np.abs(df),1);dd=df[np.arange(len(th)),j]
        nth=np.where(o,th-dd*0.55*t,th)
        V[:,0]=c[0]+nr*np.cos(nth);V[:,1]=c[1]+nr*np.sin(nth);V[:,2]=np.where(o,V[:,2]*(1-0.45*t),V[:,2]);return V
    return f
def model(nm,f,cx,cy,size,rot,col,zs=1.0,k=0.5,note='地面に置く',on=('ground',),up=None):
    d=(T+f,cx,cy,0,size,rot,0,zs,up);p=P(nm,'model',d,col,on=on,note=note);p.recol=col;p.recolk=k;return notex(p),model_tris(*d)[0]
def PARTS():
    L=[]
    V0,F0,_=model_tris(T+'stump.glb',0,0,0,1.0);t0=V0[F0];n0=np.cross(t0[:,1]-t0[:,0],t0[:,2]-t0[:,0]);n0/=np.linalg.norm(n0,axis=1,keepdims=True)+1e-9
    sel=(np.abs(n0[:,2])>0.85)&(t0[:,:,2].mean(1)>V0[:,2].max()*0.6);ar=np.linalg.norm(np.cross(t0[:,1]-t0[:,0],t0[:,2]-t0[:,0]),axis=1)
    UP=(n0[sel]*np.sign(n0[sel][:,2:3])*ar[sel,None]).sum(0)   # モデルの切り口の向き（かたむいている）→ これをまっすぐ上にする
    s,V=model('切り株','stump.glb',CX,CY,0.63,40,BARK,up=tuple(UP))
    Fm=model_tris(*s.dims)[1];t=V[Fm];n=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]);n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-9
    tp=t[(np.abs(n[:,2])>0.85)&(t[:,:,2].mean(1)>V[:,2].max()*0.6)].reshape(-1,3)   # 切り口（上を向いた、高い所の面。モデルの切り口は少しかたむいている）
    co=np.linalg.lstsq(np.c_[tp[:,:2],np.ones(len(tp))],tp[:,2],rcond=None)[0];c=tp[:,:2].mean(0);R=np.hypot(*(tp[:,:2]-c).T).max();HT=float(co@[c[0],c[1],1])
    s.decal=lambda x,y,z:rings(math.hypot(x-c[0],y-c[1]),R) if z>co[0]*x+co[1]*y+co[2]-0.02 and math.hypot(x-c[0],y-c[1])<R*1.02 else None;s.barktex=True;s.warp=rootwarp(c,R,HT);L.append(s)
    d=(0.82,0.57);b=(0.57,-0.82);E=(c[0]-0.13,HT+0.17);AY=c[1]-0.08   # 斧：柄の向き d、刃の向き b（d にちょっかく）
    pt=lambda s_,t:(E[0]+s_*d[0]+t*b[0],E[1]+s_*d[1]+t*b[1])
    head=[pt(-0.055,-0.06),pt(0.055,-0.06),pt(0.065,0.08),pt(0.13,0.24),pt(-0.13,0.24),pt(-0.065,0.08)]
    ax=P('斧の頭','prism',(head,AY-0.0175,AY+0.0175),IRON,on=('切り株',),note='刃を切り口に切りこませる');ax.metal=True
    ax.decal=lambda x,y,z:EDGE if (x-E[0])*b[0]+(z-E[1])*b[1]>0.165 else None;L.append(notex(ax))
    a=pt(-0.02,0);e=pt(0.34,0)
    h=P('斧の柄','frust',((a[0],AY,a[1]),(e[0],AY,e[1]),0.026,0.030),HANDLE,on=('斧の頭',),note='頭の穴にさしこむ');h.detail=12;L.append(notex(h))
    for k,(x,y) in enumerate(((1.00,0.62),(1.22,0.70))):   # 丸太：ななめ（おくが左・手前が右）
        lg,V=model('丸太%d'%(k+1),'log_lying.glb',x,y,0.22,0,BARK,note='地面に、ななめにねかせる')
        P2=V[:,:2]-V[:,:2].mean(0);w,U=np.linalg.eigh(P2.T@P2);u=U[:,1]   # 丸太の向き（上から見ていちばん長い向き）
        rot=math.degrees(math.atan2(u[1],u[0]));want=62   # 手前右へ62度
        lg.dims=lg.dims[:5]+(want-rot,)+lg.dims[6:];V=model_tris(*lg.dims)[0];P2=V[:,:2]-V[:,:2].mean(0);w,U=np.linalg.eigh(P2.T@P2);u=U[:,1]
        t=P2@u;t0,t1=t.min(),t.max();cz=V[:,2].max()/2;m0=V[:,:2].mean(0);Rl=cz
        def dec(x,y,z,u=u,t0=t0,t1=t1,m0=m0,cz=cz,Rl=Rl):
            tt=(x-m0[0])*u[0]+(y-m0[1])*u[1]
            if tt<t0+0.012 or tt>t1-0.012:
                v=-(x-m0[0])*u[1]+(y-m0[1])*u[0];return logring(math.hypot(v,z-cz),Rl)
            return None
        lg.decal=dec;lg.barktex=True;L.append(lg)
    fw,_=model('わったまき','firewood.glb',-0.06,0.96,0.12,90,CHIP,k=0.6);L.append(fw)
    for k,(x,y,w,dd) in enumerate(((0.40,1.00,0.09,0.05),(0.56,1.05,0.07,0.04),(0.86,1.00,0.06,0.04))):
        L.append(notex(P('木くず%d'%(k+1),'box',(x,y,0,x+w,y+dd,0.02),CHIP,bevel=0,note='地面')))
    for k,(x,y,sz,rot) in enumerate(((-0.22,0.56,0.20,0),(0.74,0.92,0.17,70))):
        g,_=model('葉の小枝%d'%(k+1),'sprig.glb',x,y,sz,rot,LEAF,k=0.6);g.deco=True;g.olk=0.86;L.append(g)
    return L
