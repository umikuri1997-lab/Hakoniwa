# 木（tree：植えた木・ntree：森の木。同じ絵）。持ち主の指示（自然な樹形の法則）。いちばん大事なこと：幹から葉の先まで枝がつながり、葉をとっても1本の木として成り立つ骨格。
# 設計図（単位はマス。地面 z=0。根もと (0.5, 0.62)）：
#   幹：根もとから上へ（少しかたむき、ゆるくまがる）。根は、幹の下がそのまま、ひくく・なだらかに広がる（根の板はつけない）。幹の先は、そのまま「上の主枝」になって細くなる（とちゅうで切れない）。
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
    (185,55,0.44,(0.50,0.40,0.34),0.72),   # 左（ななめ上へ）
    (345,58,0.40,(0.44,0.36,0.32),0.84),   # 右（左より高い所から：左右非対称）
    (285,62,0.36,(0.40,0.34,0.30),0.92),   # 右おく
    (115,55,0.34,(0.34,0.30,0.28),0.80),   # 左手前（小さい）
    (60,80,0.40,(0.44,0.38,0.34),1.0),     # 上（幹のつづき）
]   # 主枝は上から見て、ちがう向き（交差しない）
TRUNK=0.62   # 幹はやや短く（デフォルメ）
CROWN=((0.50,0.58,1.16),0.72,0.64,0.62)   # ドーム〜たまごの形：よこはば（1.4）は、木の高さ（2.0くらい）より少しせまい   # 樹冠の形（さいしょにきめる）：まん中・よこ・おく・たての半径。ゆるいでこぼこ（natcommon.envelope）。枝も葉も、この中
def crownenv():return N.envelope(CROWN[0],*CROWN[1:],SEED*13)
LVL={2:((3,4),(30,50),(0.52,0.70),(0.30,0.85)),3:((2,3),(25,42),(0.38,0.52),(0.30,0.90)),4:((1,2),(18,30),(0.25,0.38),(0.45,0.90))}   # Y字。長い枝は短く、細枝（4）はもっと短く、おだやかな角度（トゲにしない）
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
        dd=dd*0.90+out*0.03+up*(0.05 if k<n*0.6 else -0.04)+rs.normal(0,0.045,3);dd/=np.linalg.norm(dd)   # 1節の曲がりは小さく、ゆるくまがる。なかほどまでは上へ、先は葉の重さで少し下がる
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
            dd=dd*0.93+up*(0.02 if t<m*0.7 else -0.03)+rs.normal(0,0.02,3);dd/=np.linalg.norm(dd);pts.append(g.add(g.P[pts[-1]]+dd*ln/m,pts[-1],1))   # ななめ上へ。先は少しだけ下がる（重さ）
        c=np.array(CROWN[0]);lobes.append((c,rr));bigenv=crownenv()   # 枝は樹冠の形の中
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
# 置く所：樹冠の形の中にある枝（主枝の先のほう・側枝・小枝・細枝）にそって、根もと側から先まで、間かく LEAFGAP ごとに1まい（間かくはまちまち）。
#   左右たがいちがいに、まわりも少しずつずらして、上・下・手前・おくへ（1点から放射状に置かない）。内がわほど多い。葉柄のはしを枝の上の点につける。
# 向き：枝ののびる向きを基本に、外へひらく。表は、上と、樹冠の外がわのまん中（表が下を向かない：上の向きの成分を 0.25 より大きく）。
#   回転は葉柄のはしを中心に、傾きはおだやかに（ばらつき少し）。大きさは1つ（かえない）。
LEAFGAP=0.013   # 葉と葉の、枝にそった間かく（マス）
LEAFL=0.19   # 葉の長さ（マス。どの葉も同じ）
_KL=[]
def kitleaf():
    """葉のモデルを読み、葉の軸にそろえる：のびる向き e1（葉柄のはしが原点、葉先が +）・はばの向き e2・表の向き e3（もらったセットで、うしろを向いていた面が表）。長さ1"""
    if _KL:return _KL[0]
    import trimesh
    m=trimesh.load(os.path.join(os.path.dirname(N.__file__),'..','..','models','tripo','kit_leaf.glb'),force='mesh')
    V=np.asarray(m.vertices,float)   # glTF のまま
    c=V.mean(0);_,_,vt=np.linalg.svd(V-c,full_matrices=False);e1,e3=vt[0],vt[2]
    if e3[2]>0:e3=-e3   # 表の向き：もらったセットで、うしろ（−Z）を向いていたがわ（持ち主が見て、手前がわは裏だった）
    Q0=(V-c)@e1;a,b=Q0.min(),Q0.max();L_=b-a;w=(V-c)@np.cross(e3,e1)
    if np.abs(w[Q0<a+0.15*L_]).max()>np.abs(w[Q0>b-0.15*L_]).max():e1=-e1   # 細いほう（葉柄）を、−のはしに
    e2=np.cross(e3,e1)   # 右手の向き（e1・e2・e3）：置くときの (o, sd=nn×o, nn) と同じならび
    Q=(V-c)@np.stack([e1,e2,e3],1);Q[:,0]-=Q[:,0].min();Q/=L_
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
        mr=max(rr);N.limb(T,pts,rr,n=14 if mr>0.08 else 8 if mr>0.02 else 5,flare=0.13 if c[0]==0 else 0.0,fh=0.20,wob=0.07 if mr>0.06 else 0.0,seed=len(T)%17)
    N.barkmesh(sc,T)
    if SKEL:return
    rs=np.random.RandomState(SEED+100);up=np.array([0,0,1.0]);Q=kitleaf();env=N.envelope(CROWN[0],*(np.array(CROWN[1:])*1.08),SEED*13)
    C0=np.array(CROWN[0]);zl,zh=C0[2]-CROWN[3],C0[2]+CROWN[3]
    sc.outline(None,0.86);sc.material('flat');az=0.0
    for i in range(1,len(P)):
        j=par[i]
        if lv[i]<3:continue   # 葉は小枝・細枝に（先のほうに多い）
        d=P[i]-P[j];Le=np.linalg.norm(d)
        if Le<1e-6:continue
        d/=Le;u=np.cross(d,up);u=u/np.linalg.norm(u) if np.linalg.norm(u)>1e-6 else np.array([1.0,0,0]);v=np.cross(d,u)
        tipw=1.0+1.6*(lv[i]==4 or not len(ch[i]))   # 細枝・枝先のまわりに多く（小さな葉群）
        k=int(Le/LEAFGAP*tipw*rs.uniform(0.6,1.4)+rs.rand())
        for t_ in range(k):
            b0=P[j]+d*Le*rs.uniform(0,1)
            if not env(b0):continue   # 樹冠の形の外の枝（幹・主枝のつけ根）には、つけない
            az+=math.pi+rs.uniform(-0.6,0.6);rad=u*math.cos(az)+v*math.sin(az)   # 左右たがいちがい（となりの葉と反対がわ、ばらつき少し）。まわりも少しずつずれて、上・下・手前・おくへ
            o=d*0.6+rad*0.8-up*0.15+rs.normal(0,0.10,3);o/=np.linalg.norm(o)   # 枝ののびる向きを基本に、外へひらき、重さで少し下へ
            out=b0-C0;out/=max(np.linalg.norm(out),1e-6)
            nn=up*0.6+out*0.4+rs.normal(0,0.10,3);nn-=o*(nn@o)
            if np.linalg.norm(nn)<1e-3:continue
            nn/=np.linalg.norm(nn)
            if nn[2]<0.25:   # 表が下・横を向く置き方はしない：葉ののびる向きを上へ起こしてから、もう1回
                o=o+up*0.8;o/=np.linalg.norm(o);nn=up-o*(up@o);nn/=np.linalg.norm(nn)
            sd=np.cross(nn,o)
            h=(b0[2]-zl)/max(zh-zl,1e-6);tone=int(np.clip(round((1-h)*1.6+(1-nn[2])*0.8-0.3),0,len(N.LEAFB)-2))   # 上ほど・表が上を向くほど明るい
            W3=Q@np.stack([o,sd,nn],0)*LEAFL+b0;sc.part()
            for q in W3:sc.tri(q[0],q[1],q[2],N.LEAFB[tone])
    sc.material(None);sc.outline()
def POST(im):return N.specks(im)
if __name__=='__main__':
    import sys
    if '--skel' in sys.argv:makeskel();print('骨格を書いた',SKELF)
