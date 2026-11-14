# 木（tree：植えた木・ntree：森の木。同じ絵）。持ち主の指示（自然な樹形の法則）。いちばん大事なこと：幹から葉の先まで枝がつながり、葉をとっても1本の木として成り立つ骨格。
# 設計図（単位はマス。地面 z=0。根もと (0.5, 0.62)）：
#   幹：根もとから上へ（少しかたむき、ゆるくまがる）。幹の先は、そのまま「上の主枝」になって細くなる（とちゅうで切れない）。
#   主枝 MAIN：(向き, 立ち上がり, 長さ, 葉群の半径 (よこ, おく, たて), つけ根の高さ)。幹からなめらかに外へ、先は少しずつ上へ（U字・フックにしない：1節で曲がるのは小さく）。
#   葉群：主枝の先のまわりの、でこぼこのあるだ円体（natcommon.envelope）。その主枝の枝は、ぜんぶこの中におさまる長さ（葉群の形が樹冠の形）。
#   側枝・小枝・細枝：芽（らせん137.5度）から、親の向きから25〜55度ひらき、葉群の外へ向く。長さは親の 0.45〜0.65倍、葉群の中におさまる長さまで。
#     下・内向きの芽は、のびないことが多い。どの段も、先の芽がそのままのびる。
#   太さ：パイプモデル（先 0.005、親は子の太さ^1.8 の和。幹は 0.16 まで）。分かれた子のつけ根に、えり。
#   骨格は1回だけ作って tree_skel.json に固定する（python3 tools/art/furn3d/items/tree.py --skel）。葉つきは、その骨格を読んで葉をたすだけ（枝を消す・うごかす・たすをしない）。
#   SKEL=True で写すと、葉をつけない骨格だけ（たしかめ用）。
import math
import numpy as np
import natcommon as N
ID='tree';GRAD=True;PARALLEL=True;BOTTOM=56
VIEWS=[('tree',0),('ntree',0)]
CX,CY=0.5,0.62;SEED=2;SKEL=False
MAIN=[   # 向き・立ち上がり・長さ・葉群の半径・つけ根の高さ（幹の長さにたいする割合。1.0 は幹の先＝上の主枝）
    (185,32,0.66,(0.50,0.40,0.34),0.70),   # 左（いちばん長い）
    (345,38,0.58,(0.44,0.36,0.32),0.84),   # 右（左より高い所から：左右非対称）
    (285,48,0.50,(0.40,0.34,0.30),0.92),   # 右おく
    (125,40,0.42,(0.34,0.30,0.28),0.78),   # 左手前（小さい）
    (60,78,0.52,(0.44,0.38,0.34),1.0),     # 上（幹のつづき）
]   # 主枝は上から見て、ちがう向き（交差しない）
TRUNK=0.62   # 幹はやや短く（デフォルメ）
LVL={2:((3,4),(30,50),(0.60,0.80),(0.35,0.85)),3:((2,3),(28,45),(0.50,0.70),(0.35,0.90)),4:((1,2),(25,40),(0.45,0.60),(0.45,0.90))}   # 子の数は少なく（Y字に分かれる。トゲのような小枝を作らない）。太い枝ほど長い
def spots(rs,span,nb,gap=0.18):
    """芽の場所：はんいの中に、たがいに gap より近づけない（1か所から何本も出さない）。間かくはまちまち"""
    out=[]
    for _ in range(nb*20):
        if len(out)>=nb:break
        x=rs.uniform(*span)
        if all(abs(x-y)>=gap for y in out):out.append(x)
    return sorted(out)
class G:
    def __init__(s):s.P=[];s.par=[];s.lv=[]
    def add(s,p,pa,lv):s.P.append(np.array(p,float));s.par.append(pa);s.lv.append(lv);return len(s.P)-1
def fit(env,p,d,L):
    """p から d へ、葉群の外へ出るまでの長さ（L まで）。葉群の外から出る枝は、葉群に入ってから出るまで。入らなければ0"""
    t=0.0;inside=env(p)
    while t<L:
        q=env(p+d*(t+0.03))
        if inside and not q:break
        inside=inside or q;t+=0.03
    return t if inside else 0.0   # 葉群に入らない枝は、のばさない（分かれ目のまわりに短い枝がかたまらない）
def grow(g,i0,d,L,lv,env,c,rs,tips):
    """節 i0 から、向き d・長さ L の枝（lv 段）。節ごとに少しだけ曲がる（外・上へ）。芽から子の枝"""
    n=max(3,int(L/0.05));up=np.array([0,0,1.0]);idx=[i0];dd=d.copy()
    for k in range(n):
        out=g.P[idx[-1]]-c;out=out/np.linalg.norm(out) if np.linalg.norm(out)>1e-6 else dd
        dd=dd*0.92+out*0.05+up*0.03+rs.normal(0,0.025,3);dd/=np.linalg.norm(dd)   # 1節の曲がりは小さく
        idx.append(g.add(g.P[idx[-1]]+dd*L/n,idx[-1],lv))
    if lv==4:tips.append(idx);return
    nc,ang,lk,span=LVL[lv+1];nb=rs.randint(nc[0],nc[1]+1);az=rs.uniform(0,6.28)
    for s in spots(rs,span,nb):
        i=min(n-1,int(s*n));q=g.P[idx[i]];ld=g.P[idx[i+1]]-g.P[idx[i]];ld/=np.linalg.norm(ld)
        u=np.cross(ld,up);u=u/np.linalg.norm(u) if np.linalg.norm(u)>1e-6 else np.array([1.0,0,0]);v=np.cross(ld,u)
        az+=N.GOLD;side=u*math.cos(az)+v*math.sin(az);a=math.radians(rs.uniform(*ang))
        cd=ld*math.cos(a)+side*math.sin(a);out=q-c;out=out/np.linalg.norm(out) if np.linalg.norm(out)>1e-6 else cd
        cd=cd*0.75+out*0.25;cd/=np.linalg.norm(cd)
        if cd[2]<-0.35 and rs.rand()<0.7:continue   # 下向きの芽は、のびないことが多い
        cl=min(L*rs.uniform(*lk),fit(env,q,cd,L))
        if cl<0.06:continue
        grow(g,idx[i],cd,cl,lv+1,env,c,rs,tips)
    cl=min(L*rs.uniform(*LVL[lv+1][2]),fit(env,g.P[idx[-1]],dd,L))   # 先の芽
    if cl>=0.06:grow(g,idx[-1],dd,cl,lv+1,env,c,rs,tips)
    elif lv<4:tips.append(idx[-3:])
def PARTS():return []
def skeleton():
    rs=np.random.RandomState(SEED);g=G();up=np.array([0,0,1.0]);tips=[];lobes=[]
    i=g.add((CX,CY,0),-1,0);n=int(TRUNK/0.05);tr=[i];d=np.array([0.04,0.0,1.0]);d/=np.linalg.norm(d)
    for k in range(n):
        d=d+rs.normal(0,0.02,3);d[2]=max(d[2],0.9);d/=np.linalg.norm(d);tr.append(g.add(g.P[tr[-1]]+d*TRUNK/n,tr[-1],0))
    for k,(az,el,ln,rr,h0) in enumerate(MAIN):
        j=tr[min(len(tr)-1,int(round(h0*n)))];md=N.dirv(az,el) if h0<1.0 else (d*0.6+N.dirv(az,el)*0.4)
        md/=np.linalg.norm(md);m=int(ln/0.05);pts=[j];dd=md.copy()
        for t in range(m):   # 主枝：なめらかに外へ、先は少しずつ上へ
            dd=dd*0.93+up*(0.05 if t>m*0.5 else 0.01)+rs.normal(0,0.02,3);dd/=np.linalg.norm(dd);pts.append(g.add(g.P[pts[-1]]+dd*ln/m,pts[-1],1))
        c=g.P[pts[-1]]+np.array([0,0,rr[2]*0.2]);env=N.envelope(c,*rr,SEED*7+k);lobes.append((c,rr))
        bigenv=lambda p,env=env:env(p)   # 葉群の中
        nc,ang,lk,span=LVL[2];nb=rs.randint(nc[0],nc[1]+1);az2=rs.uniform(0,6.28)
        for s in spots(rs,(0.45,0.95),nb):   # 側枝
            i2=min(m-1,int(s*m));q=g.P[pts[i2]];ld=g.P[pts[i2+1]]-q;ld/=np.linalg.norm(ld)
            u=np.cross(ld,up);u=u/np.linalg.norm(u) if np.linalg.norm(u)>1e-6 else np.array([1.0,0,0]);v=np.cross(ld,u)
            az2+=N.GOLD;cd=ld*math.cos(math.radians(rs.uniform(*ang)))+(u*math.cos(az2)+v*math.sin(az2))*math.sin(math.radians(rs.uniform(*ang)))
            out=q-c;cd=cd/np.linalg.norm(cd)*0.7+(out/np.linalg.norm(out) if np.linalg.norm(out)>1e-6 else cd)*0.3;cd/=np.linalg.norm(cd)
            if cd[2]<-0.35 and rs.rand()<0.7:continue
            cl=min(ln*rs.uniform(*lk),fit(bigenv,q,cd,ln))
            if cl>=0.06:grow(g,pts[i2],cd,cl,2,bigenv,c,rs,tips)
        cl=min(ln*0.55,fit(bigenv,g.P[pts[-1]],dd,ln))   # 主枝の先の芽
        if cl>=0.06:grow(g,pts[-1],dd,cl,2,bigenv,c,rs,tips)
    return g,tips,lobes,rs
import json,os
SKELF=os.path.join(os.path.dirname(os.path.abspath(__file__)),'tree_skel.json')   # 固定した骨格（葉の有無で、ぜったいにかえない）
def makeskel():
    """骨格を1回だけ作って、ファイルに書く（python3 tools/art/furn3d/items/tree.py --skel）"""
    g,tips,lobes,rs=skeleton()
    json.dump({'P':[list(map(float,p)) for p in g.P],'par':[int(x) for x in g.par],'lv':[int(x) for x in g.lv],'tips':[[int(i) for i in t] for t in tips],'lobes':[[list(map(float,c)),list(rr)] for c,rr in lobes]},open(SKELF,'w'))
def loadskel():
    d=json.load(open(SKELF));return np.array(d['P']),np.array(d['par']),np.array(d['lv']),d['tips'],[(np.array(c),tuple(rr)) for c,rr in d['lobes']]
# ---- 葉（持ち主の指示：用意された葉1まいのモデルを、自然に分かれた枝のまわりに1まいずつ置き、そのかさなりで樹冠を作る。葉の塊を別の物として作らない） ----
# 葉のモデル：tripo/kit_leaf.glb（もらった植物のセットの、葉1まい）。形はかえない（面もへらさない）。大きさだけ、まるごと同じ割合で（0.85〜1.2倍）。
# 置く所：小枝・細枝（lv 3・4）と、側枝（lv 2）の幹から遠い所にそって、枝の長さ LEAFGAP ごとに1まい、左右たがいちがいに（1点から放射状に置かない）。
#   葉柄のはし（モデルの細いほうのはし）を枝の上の点につける。こさは場所でゆっくりかわる。まん中に近い所ほど多い。
# 向き：枝ののびる向きを基本に、横（たがいちがい）と少し上へ。表は上・太陽へ。ばらつきは少し（向きがばらばらになりすぎない）。
LEAFGAP=0.015   # 葉と葉の、枝にそった間かく（マス）
LEAFL=0.19   # 葉の長さ（マス）
_KL=[]
def kitleaf():
    """葉のモデルを読み、葉の軸にそろえる：のびる向き e1（葉柄のはしが原点、葉先が +）・はばの向き e2・表の向き e3。長さ1"""
    if _KL:return _KL[0]
    import trimesh
    m=trimesh.load(os.path.join(os.path.dirname(N.__file__),'..','..','models','tripo','kit_leaf.glb'),force='mesh')
    V=np.asarray(m.vertices,float);V=np.stack([V[:,0],-V[:,2],V[:,1]],1)   # glTF（y上・z手前）→ x・y南・z上
    c=V.mean(0);_,_,vt=np.linalg.svd(V-c,full_matrices=False);Q=(V-c)@vt.T
    a,b=Q[:,0].min(),Q[:,0].max();L_=b-a
    wa=np.abs(Q[Q[:,0]<a+0.15*L_,1]).max();wb=np.abs(Q[Q[:,0]>b-0.15*L_,1]).max()
    if wa>wb:Q[:,0]*=-1;Q[:,1]*=-1   # 細いほう（葉柄）を、−のはしに
    Q[:,0]-=Q[:,0].min();Q/=L_
    if Q[:,2].mean()<0:Q[:,2]*=-1
    _KL.append(Q[np.asarray(m.faces)]);return _KL[0]
def EXTRA(sc):
    P,par,lv,tips,lobes=loadskel()
    r,ch=N.radii(par,rtip=0.006,E=1.6,rmax=0.12)
    T=[]
    for c in N.chains(par,ch,r):
        if len(c)<2:continue
        pts=P[c];rr=list(r[c])
        if c[0]!=0 and len(ch[c[0]])>1:rr[1]=rr[1]*1.25   # えり
        rr[-1]=min(rr[-1],0.004)   # 先は細く
        mr=max(rr);N.limb(T,pts,rr,n=14 if mr>0.08 else 8 if mr>0.02 else 5,flare=0.08 if c[0]==0 else 0.0,fh=0.2,wob=0.07 if mr>0.06 else 0.0,seed=len(T)%17)
    N.roots(T,(CX,CY,0),0.14,np.random.RandomState(SEED+50),L=0.12)
    N.barkmesh(sc,T)
    if SKEL:return
    rs=np.random.RandomState(SEED+100);up=np.array([0,0,1.0]);Q=kitleaf()
    zs=P[lv>=3][:,2];zl,zh=zs.min(),zs.max();ctr=P[lv>=3].mean(0)
    sc.outline(None,0.86);sc.material('flat');side=1
    for i in range(1,len(P)):
        j=par[i]
        if lv[i]<2:continue
        if lv[i]==2 and math.hypot(P[i][0]-CX,P[i][1]-CY)<0.12:continue   # 側枝の、幹に近い所にはつけない
        d=P[i]-P[j];Le=np.linalg.norm(d)
        if Le<1e-6:continue
        d/=Le;u=np.cross(d,up);u=u/np.linalg.norm(u) if np.linalg.norm(u)>1e-6 else np.array([1.0,0,0])
        dens=(0.55+0.9*N.ST.vnoise(P[i][0]/0.3+5,P[i][1]/0.3,P[i][2]/0.3))*(1.25-0.5*min(1,np.linalg.norm((P[i]-ctr)/np.array([0.9,0.7,0.5]))))   # こさのむら・まん中ほど多い
        k=int(Le/LEAFGAP*dens+rs.rand())
        for t_ in range(k):
            side=-side;b0=P[j]+d*Le*rs.uniform(0,1)
            o=d*0.75+u*side*0.75+up*rs.uniform(0.05,0.35)+rs.normal(0,0.12,3);o/=np.linalg.norm(o)   # 枝の向きを基本に、横（たがいちがい）・少し上へ
            nn=up*0.6+N.SUN*0.4+rs.normal(0,0.15,3);nn-=o*(nn@o);nn/=np.linalg.norm(nn)   # 表は上・太陽へ
            sd=np.cross(nn,o);f=rs.uniform(0.85,1.2)
            h=(b0[2]-zl)/max(zh-zl,1e-6);tone=int(np.clip(round((1-float(nn@N.LIGHTV))*1.4+(1-h)*1.3-0.4),0,len(N.LEAFB)-2))
            W3=Q@np.stack([o,sd,nn],0)*LEAFL*f+b0;sc.part()
            for q in W3:sc.tri(q[0],q[1],q[2],N.LEAFB[tone])
    sc.material(None);sc.outline()
def POST(im):return N.specks(im)
if __name__=='__main__':
    import sys
    if '--skel' in sys.argv:makeskel();print('骨格を書いた',SKELF)
