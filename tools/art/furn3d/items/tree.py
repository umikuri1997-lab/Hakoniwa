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
    (195,35,0.62,(0.46,0.38,0.32),0.62),   # 左
    (330,30,0.66,(0.48,0.38,0.32),0.74),   # 右おく
    (25,40,0.56,(0.40,0.34,0.30),0.68),    # 右
    (110,32,0.46,(0.32,0.28,0.26),0.82),   # 手前（小さい：幹が見える）
    (240,70,0.58,(0.46,0.38,0.34),1.0),    # 上（幹のつづき）
]
TRUNK=0.78
LVL={2:((2,4),(30,50),(0.55,0.75),(0.30,0.90)),3:((2,3),(28,50),(0.50,0.70),(0.25,0.90)),4:((1,3),(25,45),(0.45,0.65),(0.30,0.95))}   # 数は少なめ（交差・束にしない）
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
    g,tips,lobes,_=skeleton()
    json.dump({'P':[list(map(float,p)) for p in g.P],'par':[int(x) for x in g.par],'tips':[[int(i) for i in t] for t in tips],'lobes':[[list(map(float,c)),list(rr)] for c,rr in lobes]},open(SKELF,'w'))
def loadskel():
    d=json.load(open(SKELF));return np.array(d['P']),np.array(d['par']),d['tips'],[(np.array(c),tuple(rr)) for c,rr in d['lobes']]
# ---- デフォルメの樹冠（持ち主の指示：どうぶつの森・ドラゴンクエストビルダーズのような、かわいいデフォルメの広葉樹） ----
# 骨格（tree_skel.json）は、そのまま。細い枝（太さ THIN より細い）は描くのをはぶく（骨格の中にはのこる）。
# 葉群：側枝ごと（枝先から親へたどって、太さ GROUPR をこえた所の枝ごと）に1つ。まん中はその枝先たちのまん中、半径はその広がり＋ゆとり（大小まちまち）。
#   主枝の先にも1つ。葉群は、でこぼこのある玉（ゆっくりかわるむら）で、となりの葉群とかさなって、1つづきの樹冠になる。
#   表面に、小さな葉（セットの葉4しゅるい KITLEAF をまぜる。長さ 0.10 の0.75〜1.25倍）を、すきまなく（ほかの葉群の中になる所にはつけない）。葉は表面にそって、重さで下を向く。
#   葉は1まいずつ目立たせない（葉群の中は線を引かない・すじの左右の色わけなし）。明暗は葉群ごと：葉群の中で上・光の向きが明るく、下が暗い。奥・下の葉群は1段暗い（手前・まん中・奥の3層）。
THIN=0.011;GROUPR=0.024;PL,PW=0.09,0.065;PZ=0.74;WIDEN=0.22   # WIDEN：葉群を、幹から横へ広げる割合。PZ：葉群のたての、つぶし（見おろしの写し方で、丸い玉がたてにのびて見えるので）
def puffs(P,par,r,tips):
    groups={}
    for idx in tips:
        t=idx[-1];j=t
        while par[j]>=0 and r[j]<GROUPR:j=par[j]
        groups.setdefault(j,[]).append(P[t])
    out=[]
    for j,pts in groups.items():
        Q=np.array(pts+[P[j]]);c=Q.mean(0);ext=np.linalg.norm(Q-c,axis=1).max()
        c=c+np.array([(c[0]-CX)*WIDEN,(c[1]-CY)*WIDEN*0.5,0.04])   # 横へ少し広げる（樹冠を横に広く）。枝先は葉群の中のまま
        out.append((c,max(0.21,min(0.36,ext*0.8+0.14))))
    return out
KITLEAF=['leaf','leaf_oak','leaf_long','leaf_wide']   # 葉の形（持ち主からもらった植物のセット tripo/kit_*.glb から。持ち主の指示：葉はここから）
_KL=[]
def kitleaves():
    """セットの葉を読み、面をへらして（たくさん置くので）、葉の向きの軸にそろえる：のびる向き e1・はばの向き e2・表の向き e3。長さ1・まん中が原点"""
    if _KL:return _KL
    import trimesh
    for nm in KITLEAF:
        m=trimesh.load(os.path.join(os.path.dirname(N.__file__),'..','..','models','tripo','kit_'+nm+'.glb'),force='mesh')
        if len(m.faces)>40:m=m.simplify_quadric_decimation(face_count=40)
        V=np.asarray(m.vertices,float);V=np.stack([V[:,0],-V[:,2],V[:,1]],1)   # glTF（y上・z手前）→ x・y南・z上
        c=V.mean(0);_,_,vt=np.linalg.svd(V-c,full_matrices=False);Q=(V-c)@vt.T;Q/=Q[:,0].max()-Q[:,0].min()
        _KL.append(Q[np.asarray(m.faces)])
    return _KL
def EXTRA(sc):
    P,par,tips,lobes=loadskel();up=np.array([0,0,1.0]);rs=np.random.RandomState(SEED+100)   # 葉の乱数は、骨格とべつ
    r,ch=N.radii(par,rtip=0.005,E=1.8,rmax=0.16)
    T=[]
    for c in N.chains(par,ch,r):
        if len(c)<2:continue
        keep=[k for k in c if r[k]>=THIN or k==c[0]]   # 細い枝は、はぶく
        if len(keep)<2:continue
        pts=P[keep];rr=list(r[keep])
        if c[0]!=0 and len(ch[c[0]])>1:rr[1]=rr[1]*1.25   # えり
        rr[-1]=min(rr[-1],THIN*0.8)   # 先は細く（切り口にしない。葉群の中）
        mr=max(rr);N.limb(T,pts,rr,n=14 if mr>0.08 else 8,flare=0.07 if c[0]==0 else 0.0,fh=0.2,wob=0.07 if mr>0.06 else 0.0,seed=len(T)%17)
    N.roots(T,(CX,CY,0),0.12,np.random.RandomState(SEED+50),L=0.10)
    N.barkmesh(sc,T)
    if SKEL:return
    PF=puffs(P,par,r,tips)
    zs=[c[2] for c,_ in PF];ys=[c[1] for c,_ in PF];zlo,zhi=min(zs),max(zs);ylo,yhi=min(ys),max(ys)
    def rad(k,u):   # 葉群 k の、向き u の半径（でこぼこ）
        c,R=PF[k];return R*(1+0.22*(N.ST.vnoise(u[0]*1.8+k*3.1,u[1]*1.8,u[2]*1.8)-0.5)*2)
    def inside(p,k0):
        for k,(c,R) in enumerate(PF):
            if k==k0:continue
            d=p-c
            dz=d*np.array([1,1,1/PZ]);n_=np.linalg.norm(dz)
            if n_<rad(k,dz/max(n_,1e-9))*0.92:return True
        return False
    view=np.array([0,0.74,0.67])
    for k,(c,R) in enumerate(PF):
        lay=0.5*(1-(c[1]-ylo)/max(yhi-ylo,1e-6))+0.6*(1-(c[2]-zlo)/max(zhi-zlo,1e-6))   # 奥・下ほど暗い
        sc.group('pf%d'%k);sc.outline(None,0.80);sc.material('flat')
        sc.part();sc.sphere(*c,R*0.86,N.LEAFB[3],n=16,m=10,zs=PZ)   # 中身
        n=int(4*math.pi*R*R/(PL*PW*0.55))
        for i in range(n):   # 表面に、すきまなく（フィボナッチの点＋ばらつき）
            zz=1-2*(i+0.5)/n;ph=i*N.GOLD+rs.uniform(-0.2,0.2);rr_=math.sqrt(max(0,1-zz*zz));u=np.array([rr_*math.cos(ph),rr_*math.sin(ph),zz])
            if u@view<-0.35:continue   # 見えない裏がわ
            p=c+u*rad(k,u)*0.97*np.array([1,1,PZ])
            if inside(p,k):continue
            lt=float(u@N.LIGHTV);tone=int(np.clip(round((1-lt)*1.7-0.4+lay),0,len(N.LEAFB)-2))
            nn=u*0.85+N.SUN*0.15;nn/=np.linalg.norm(nn);t=np.cross(nn,up)
            t=t/np.linalg.norm(t) if np.linalg.norm(t)>1e-6 else np.array([1.0,0,0]);dn=np.cross(t,nn)   # 表面にそって下へ（重さ）
            a=rs.uniform(-0.9,0.9);ld=-dn*math.cos(a)+t*math.sin(a);sd=np.cross(nn,ld);f=rs.uniform(0.75,1.25)
            col=N.LEAFB[tone] if rs.rand()>0.15 else N.LEAFB[min(len(N.LEAFB)-1,tone+1)]
            Q=kitleaves()[rs.randint(len(KITLEAF))];sz=PL*f*1.15;M3=np.stack([ld,sd*rs.choice([-1,1]),nn],0)   # セットの葉を、その場所・向き・大きさに
            W3=Q@M3*sz+p;sc.part()
            for q in W3:sc.tri(q[0],q[1],q[2],col)
        sc.material(None);sc.outline();sc.group(None)
def POST(im):return N.specks(im)
if __name__=='__main__':
    import sys
    if '--skel' in sys.argv:makeskel();print('骨格を書いた',SKELF)
