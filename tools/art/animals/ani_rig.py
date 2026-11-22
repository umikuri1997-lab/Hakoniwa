"""飼う生き物のボーン（骨）とモーション。持ち主のモデル（animals/*.glb）に骨を入れて、コマごとにポーズをつけて写す（ドット絵のアニメ）。
骨：体（root：上下のゆれ・ころがり）・頭（首のつけねを支点に、前へうなずく）・足（2本か4本。ももの付け根を支点に、前後にふる）。
点の重み：足は地面からの高さ（足の付け根より下ほど足について行く）、頭は前の方・上の方ほど頭について行く。あいだはなめらかにまぜる（線形のスキニング）。
向き：モデルの顔の向き（目の位置）を前（f）、それと直角の横（s）。ポーズをつけたあと、rot 度まわす（ゲームでは右ななめ前）。
モーション（POSES）：立つ（息をする2コマ）・歩く（4コマ。ななめの足が組でふる）・食べる（3コマ。頭をさげて、ついばむ・かむ）・よろこぶ（3コマ。かがむ・はねる・おりる）。"""
import os,math,numpy as np
from scipy.cluster.vq import kmeans2
RIG={  # 生き物ごと：足の数・足の付け根の高さ（全体の高さの何わり）・頭の範囲（前へのきょりの何わりから前）・首の高さ
 'niwatori':dict(legs=2,hip=.16,head=.05,neck=.45,headall=True),   # まんまるの鳥：頭と体がひとつなので、体ごと前へかたむけてついばむ
 'hitsuji':dict(legs=4,hip=.24,head=.30,neck=.42,eatk=.75,hb=.12),   # 顔が毛にうもれないように、頭は少しだけさげる
 'yagi':dict(legs=4,hip=.36,neck=.52,upper=True,eatk=.6)}   # たてに長い体：首から上（体の上半分・顔・角）を、まとめて頭の骨に
def smooth(e0,e1,x):t=np.clip((x-e0)/(e1-e0),0,1);return t*t*(3-2*t)
def rotm(axis,deg):
    a=np.asarray(axis,float);a/=np.linalg.norm(a);t=math.radians(deg);K=np.array([[0,-a[2],a[1]],[a[2],0,-a[0]],[-a[1],a[0],0]]);return np.eye(3)+math.sin(t)*K+(1-math.cos(t))*K@K
class Rig:
    def __init__(s,name,V,C):
        R=RIG[name];s.R=R;H=V[:,2].max();s.H=H;c=np.array([(V[:,0].max()+V[:,0].min())/2,(V[:,1].max()+V[:,1].min())/2]);s.c=c
        eye=(C.mean(1)<90);ev=V[eye] if eye.sum()>20 else V[V[:,2]>H*.6]   # 目（くらい色）のある方が前
        f=ev[:,:2].mean(0)-c;f/=np.linalg.norm(f);s.f=np.array([f[0],f[1],0.]);s.s=np.array([-f[1],f[0],0.])   # 前・横（ゲームの向き）
        s.u=(V[:,:2]-c)@f;s.umax=s.u.max();z=V[:,2]
        low=z<H*R['hip'];P=V[low][:,:2];k=R['legs']
        cen,_=kmeans2(P,k,seed=3,minit='++');s.legs=[np.array([q[0],q[1],H*R['hip']]) for q in cen]   # 足の付け根
        d=np.stack([np.linalg.norm(V[:,:2]-q[:2],axis=1) for q in s.legs],1);s.leg=d.argmin(1)
        s.wleg=smooth(H*R['hip'],H*R['hip']*.55,z)*(d.min(1)<H*.35)   # 付け根より下ほど足に（はなれた点は足にしない）
        u0=s.umax*R.get('head',0)
        if R.get('headall'):s.whead=0*z
        elif R.get('upper'):u0=s.umax*.1;s.whead=smooth(H*(R['neck']-.12),H*(R['neck']+.08),z)*smooth(-s.umax*.15,s.umax*.35,s.u)   # 首から上の、前のほう（顔・角）。うしろの背中はつけない（背中がもりあがらないように）
        else:s.whead=smooth(u0,u0+s.umax*R.get('hb',.25),s.u)*smooth(H*R['neck']*.7,H*R['neck'],z)
        s.neck=np.array([c[0]+f[0]*u0,c[1]+f[1]*u0,H*R['neck']])
        # 足の組：前後（u）と左右（s）で、ななめの組をきめる（4本は 前左+後右 / 前右+後左、2本は左右）
        lu=[(q[:2]-c)@f for q in s.legs];ls=[(q[:2]-c)@s.s[:2] for q in s.legs]
        s.pair=[(1 if (lu[i]>0)==(ls[i]>0) else 0) if k==4 else (1 if ls[i]>0 else 0) for i in range(k)]
    def pose(s,V,bob=0.,roll=0.,pitch=0.,head=0.,swing=0.,sq=1.):
        """bob：体を上へ（マス）・roll：横へころがる・pitch：体ごと前へかたむく（度）・head：頭を前へ（度）・swing：足をふる（度、組で逆）・sq：たてのちぢみ"""
        V=V.copy();H=s.H;base=np.array([s.c[0],s.c[1],0.])
        # 足：組ごとに逆へふる（付け根の横の軸のまわり）
        for i,q in enumerate(s.legs):
            m=(s.leg==i)&(s.wleg>0)
            if not m.any():continue
            a=swing*(1 if s.pair[i] else -1);Rm=rotm(s.s,a);P=(V[m]-q)@Rm.T+q;w=s.wleg[m][:,None];V[m]=V[m]*(1-w)+P*w
        # 頭：首を支点に前へ
        if head and s.whead.any():
            m=s.whead>0;Rm=rotm(s.s,head);P=(V[m]-s.neck)@Rm.T+s.neck;w=s.whead[m][:,None];V[m]=V[m]*(1-w)+P*w
        # 体：ちぢみ・前へかたむく（足もとを支点）・ころがる・上へ
        V[:,2]=V[:,2]*sq
        if pitch:V=(V-base)@rotm(s.s,pitch).T+base
        if roll:V=(V-base)@rotm(s.f,roll).T+base
        V[:,2]+=bob*H
        V[:,2]-=min(0,V[:,2].min())   # 地面の下へもぐらない
        return V
POSES={  # コマ → ポーズ（持ち主：動きを大きく）
 '0':dict(),'1':dict(sq=.93),   # 立つ：息をする
 'w0':dict(swing=36,bob=.07,head=10),'w1':dict(swing=0,sq=.95,head=-2),'w2':dict(swing=-36,bob=.07,head=10),'w3':dict(swing=0,sq=.95,head=-2),   # 歩く：足を大きくふり、はずんで、うなずく
 'e0':dict(head=40),'e1':dict(head=56),'e2':dict(head=46,sq=.98),   # 食べる：頭をさげて、ついばむ
 'j0':dict(sq=.86,head=8),'j1':dict(sq=1.05,head=-16,swing=14),'j2':dict(sq=.97,head=-8,swing=-8)}   # よろこぶ：かがむ → のびて、頭を上げる → おりる（はねる高さは、ゲームで描く位置を上げる ANIJOY。絵は下のはしをそろえて写すので）
CHICK={'0':dict(),'1':dict(sq=.92),'w0':dict(swing=44,roll=11,bob=.08),'w1':dict(roll=0,sq=.94),'w2':dict(swing=-44,roll=-11,bob=.08),'w3':dict(roll=0,sq=.94),
 'e0':dict(pitch=30),'e1':dict(pitch=48),'e2':dict(pitch=36),
 'j0':dict(sq=.84),'j1':dict(sq=1.07,pitch=-12),'j2':dict(sq=.96,pitch=-5)}   # まんまるの鳥：体ごと、ころがって歩き、かたむいてついばむ。よろこぶと、ちぢんで、のびて、うしろへそる
ROT=-90   # 右むき（少し手前）。歩く足が見えるように
VROT={'d':25,'u':-155} if os.environ.get('ANIISO') else {'d':-35,'u':-185}   # ANIISO：クォータービューの前ななめ（左下を向く）・うしろななめ（右上を向く）。ゲームが左右を反転する   # 正面（d：手前へ歩く）・うしろ（u：奥へ歩く）。まっすぐ正面は −20、そこから15度右へ（顔が見える。ゲームで左右反転する）。ani_build.py
def warp(name,frame,rot=None):
    """blueprint の Part.warp にわたす関数：点（ゲームの向き）→ ポーズをつけて rot 度まわした点"""
    from blueprint import model_tris
    def f(V):
        p=dict(POSES.get(frame,{}))
        if name=='niwatori':p=dict(CHICK.get(frame,{}))
        elif frame[0]=='e':p['head']=p.get('head',0)*RIG[name].get('eatk',1)
        _,F,C=_mc[name];rg=_rig(name,V,F,C);W=rg.pose(V,**p)
        a=math.radians(ROT if rot is None else rot);Rm=np.array([[math.cos(a),-math.sin(a),0],[math.sin(a),math.cos(a),0],[0,0,1]]);c=np.array([rg.c[0],rg.c[1],0.])
        return (W-c)@Rm.T+c
    return f
_mc={};_rigs={}
def _rig(name,V,F,C):
    if name not in _rigs:
        fc=np.zeros((len(V),3));n=np.zeros(len(V))
        for k in range(3):np.add.at(fc,F[:,k],C);np.add.at(n,F[:,k],1)
        _rigs[name]=Rig(name,V,fc/np.maximum(n,1)[:,None])
    return _rigs[name]
def load(name,size):
    from blueprint import model_tris
    _mc[name]=model_tris('animals/%s.glb'%name,0.5,0.5,0,size,0,0)
