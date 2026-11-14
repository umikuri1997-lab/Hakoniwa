# 自然の物（木・枯れ木・茂み・岩・大岩）を、トリポのモデル（tools/art/models/tripo）から3Dのまま写すための共通の部品。
# 葉の作り方は、御神木（tools/art/sacred-tree/sacred_tripo.py）と同じ：
#   モデルの葉のかたまりの表面に、小さな葉の部品をならべる（leafparts。かたまりの中は線を引かない）。
#   写したあと、葉の中の3ドットまでの点は、まわりの色にする（specks）。
# 木の皮も御神木と同じ：のびる向き（barkaxis）にそったみぞとすじ、なめらかな色むら（barkpat2）。
# 幹・枝は、モデルを使わずに、ここで組む（limb：点をつないだ、先ほど細い管。根もとは根のふくらみ）。
import os,sys,math
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..','..')
sys.path.insert(0,os.path.join(ART,'sacred-tree'))
import numpy as np
import sacred_tripo as ST
from blueprint import model_tris

def clumps(V,F,size=0.7):
    """葉の面を、かたまりにわける：つながっている面ごと。大きなかたまりは、場所で size マスくらいずつにわける（k-means）"""
    import scipy.sparse as sp
    from scipy.sparse.csgraph import connected_components as cc
    if not len(F):return []
    _,inv=np.unique(np.round(V,6),axis=0,return_inverse=True);inv=inv.reshape(-1);F2=inv[F];n=inv.max()+1
    e=np.concatenate([F2[:,[0,1]],F2[:,[1,2]]]);_,lab=cc(sp.coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(n,n)),directed=False);fl=lab[F2[:,0]]
    out=[]
    for i in np.unique(fl):
        s=F[fl==i];c=V[s].mean(1);ext=c.max(0)-c.min(0);k=max(1,int(round(np.prod(np.maximum(ext,size*0.5))/size**3)))
        if k==1:out.append(s);continue
        rs=np.random.RandomState(3);C=c[rs.choice(len(c),k,replace=False)]
        for _ in range(20):
            L=np.argmin(((c[:,None]-C[None])**2).sum(2),1)
            C=np.array([c[L==j].mean(0) if (L==j).any() else C[j] for j in range(k)])
        for j in range(k):
            if (L==j).sum()>=8:out.append(s[L==j])
    return out

def barktones(V,F,col):
    """木の皮の明るさ（4だん）：モデルの色の明るさで、面ごとに BARK4 のどれか。ドットごとには、いちばん近い面の段"""
    from scipy.spatial import cKDTree
    L=col.mean(1);q=np.quantile(L,[0.14,0.45,0.8]);lv=np.where(L>q[2],0,np.where(L>q[1],1,np.where(L>q[0],2,3)))
    T_=cKDTree(V[F].mean(1))
    def f(x,y,z):return ST.BARK4[lv[T_.query((x,y,z))[1]]]
    return f

def bark(sc,V,F,col):
    """木の皮：御神木と同じ柄（のびる向きのみぞ・すじ・色むら）"""
    if not len(F):return
    q=V[F];cen,ax,n=ST.barkaxis(q)
    sc.decal(ST.barkpat2(barktones(V,F,col),cen,ax,n));sc.part()
    for t in q:sc.tri(t[0],t[1],t[2],ST.BARK[1])
    sc.decal(None)

def leaves(sc,V,F,size=0.7,gi0=0):
    """葉：御神木と同じ（かたまりごとに、小さな葉の部品でおおう）"""
    for i,s in enumerate(clumps(V,F,size)):ST.leafparts(sc,V[s],gi0+i)

def rootin(V,F,col,k,zk=0.35):
    """根をちぢめる：幹のまん中（高さ zk の所の木の皮の断面）から、幹の半径より外の点を、k 倍にまん中へよせる。下ほど強く"""
    g=col[:,1]>col[:,0]+4;B=V[F[~g]].reshape(-1,3);z0,z1=B[:,2].min(),B[:,2].max();zc=z0+zk*(z1-z0)
    band=B[np.abs(B[:,2]-zc)<0.03*(z1-z0)];c=(band[:,:2].max(0)+band[:,:2].min(0))/2;R=(band[:,:2].max(0)-band[:,:2].min(0)).mean()/2
    V=V.copy();d=V[:,:2]-c;r=np.hypot(d[:,0],d[:,1]);w=np.clip(1-(V[:,2]-z0)/(zc-z0),0,1)   # 下ほど1
    kk=1-(1-k)*w;nr=np.where(r>R,R+(r-R)*kk,r);m=np.where(r>1e-9,nr/np.maximum(r,1e-9),1.0)
    V[:,0]=c[0]+d[:,0]*m;V[:,1]=c[1]+d[:,1]*m;return V
def tree(sc,glb,cx,cy,size,rot=0,leaf=True,csize=0.7,zs=1.0,root=1.0,ys=1.0):
    """木（モデル1つ）を置く。葉がなければ（枯れ木）、ぜんぶ木の皮。root：根の広がり（1でモデルのまま）。ys：おくゆきのちぢめ"""
    sc.smooth(True)
    V,F,col=model_tris('tripo/'+glb,cx,cy,0,size,rot,0,zs);F=F[:,[0,2,1]]   # 軸を入れかえると裏表がかわるので、面のならびを逆に（葉を表がわにならべるため）
    if root!=1.0:V=rootin(V,F,col,root)
    if ys!=1.0:V=V.copy();V[:,1]=cy+(V[:,1]-cy)*ys
    g=col[:,1]>col[:,0]+4   # 緑の面が葉
    bark(sc,V,F[~g],col[~g])
    Fl=F[g]
    if leaf:leaves(sc,V,Fl,csize)
    sc.smooth(False)
    return V

def specks(im):return ST.specks(im)

def limb(T,pts,rs,n=14,flare=0.0,lobes=5,fh=0.16,cap=True):
    """幹・枝：点 pts をつないだ管。rs は点ごとの半径。まわりの向きは、ねじれないように、となりの輪からうつしていく。
    flare：根のふくらみ（根もとの半径に足す分、lobes 本の根。高さ fh まで、なめらかに消える）。cap：先をふさぐ。三角形を T に足す"""
    P=[np.array(q,float) for q in pts];m=len(P)
    D=[P[min(i+1,m-1)]-P[max(i-1,0)] for i in range(m)];D=[d/np.linalg.norm(d) for d in D]
    u=np.cross(D[0],[0,1.0,0]);u/=np.linalg.norm(u);R=[]
    for i in range(m):
        u=u-D[i]*(u@D[i]);u/=np.linalg.norm(u);v=np.cross(D[i],u);ring=[]
        for j in range(n):
            a=2*math.pi*j/n;r=rs[i]
            if flare:
                h=P[i][2]-P[0][2];w=max(0.0,1-h/fh)**2;r=r+flare*w*(0.45+0.55*max(0.0,math.cos(lobes*a+0.7))**1.5)
            ring.append(P[i]+r*(math.cos(a)*u+math.sin(a)*v))
        R.append(ring)
    for i in range(m-1):
        for j in range(n):
            a,b,c,d=R[i][j],R[i+1][j],R[i+1][(j+1)%n],R[i][(j+1)%n];T+=[(a,b,c),(a,c,d)]
    if cap:
        for j in range(n):T.append((P[-1],R[-1][j],R[-1][(j+1)%n]))
    if flare:   # 根もとの底（地面より少し下まで）
        for j in range(n):T.append((P[0]-np.array([0,0,0.02]),R[0][j],R[0][(j+1)%n]))
    return T

def curve(a,b,bend=(0,0,0),k=6):
    """a から b への、まん中を bend だけずらした、ゆるい曲がり（k+1 点）"""
    a,b,bend=np.array(a,float),np.array(b,float),np.array(bend,float)
    return [a+(b-a)*t+bend*4*t*(1-t) for t in np.linspace(0,1,k+1)]

def barktone(x,y,z):
    """木の皮のもとの明るさ（4だん）：たてにのびた、なめらかなむら（御神木はモデルのテクスチャの明るさ。ここでは同じ4だんを、ノイズで）"""
    v=ST.vnoise(x/0.07,y/0.07,z/0.30)*0.7+ST.vnoise(x/0.2+5,y/0.2,z/0.5)*0.3
    return ST.BARK4[0 if v>0.68 else 1 if v>0.48 else 2 if v>0.32 else 3]

def barkmesh(sc,T):
    """組んだ幹・枝に、御神木と同じ木の皮の柄をつけて、シーンに入れる"""
    q=np.array(T,float);cen,ax,n=ST.barkaxis(q)
    sc.smooth(True);sc.decal(ST.barkpat2(barktone,cen,ax,n));sc.part()
    for t in q:sc.tri(t[0],t[1],t[2],ST.BARK[1])
    sc.decal(None);sc.smooth(False)

def oakleaves(glb,cx,cy,size,rot=0,root_c=None):
    """モデルの葉だけをとる（幹・枝はつかわない）。モデルの幹の根もとのまん中が (cx,cy) に来るようにずらす。かえす：(点, 葉の面)"""
    V,F,col=model_tris('tripo/'+glb,cx,cy,0,size,rot,0);F=F[:,[0,2,1]]
    g=col[:,1]>col[:,0]+4;B=V[F[~g]].reshape(-1,3);z0,z1=B[:,2].min(),B[:,2].max()
    band=B[B[:,2]<z0+0.25*(z1-z0)];c=(band[:,:2].max(0)+band[:,:2].min(0))/2
    V=V.copy();V[:,0]+=cx-c[0];V[:,1]+=cy-c[1]
    return V,F[g]

# ---- ビルダーズ・あつ森のような葉（持ち主の指示） ----
# 1まいの葉（bigleaf）：大きく、まるみのある先のとがった形。まん中のすじで折れて（左右の面の向きがかわり、明るさが2つにわかれる）、先は少したれる。
# かたまり（puff）：まるい中身を、葉で、上から下へ、かわらのように重ねておおう。木は、かたまりを組み合わせる。
# 色：いまの木の絵の緑（明るい → 暗い）。
LEAFB=[(203,232,115),(178,218,100),(151,203,98),(120,188,105),(92,171,108)]
LEAFCORE=(78,140,100)
def bigleaf(base,d,sd,nn,L,W,fold=0.5,droop=0.18,nt=8,ns=3):
    def P(t,u):
        w=W*math.sin(math.pi*min(1,t*1.02))**0.6*(1-0.35*t*t);return base+d*t*L+sd*u*w+nn*(fold*w*abs(u)-droop*L*t*t)
    T=[]
    for i in range(nt):
        for j in range(-ns,ns):
            t0,t1=i/nt,(i+1)/nt;u0,u1=j/ns,(j+1)/ns;a,b,c,e=P(t0,u0),P(t1,u0),P(t1,u1),P(t0,u1);T+=[(a,b,c),(a,c,e)]
    return T
LIGHTV=np.array([-0.45,0.35,0.82]);LIGHTV/=np.linalg.norm(LIGHTV)   # 光（左上・手前の上から）
def puff(sc,c,r,rs,L=0.44,W=0.32,pal=LEAFB,core=LEAFCORE,olk=0.74,rings=(24,60,96),gi=0,dk=0.0):
    """葉のかたまり：中身（半径 r の玉）を、大きな葉で、上の輪から下の輪へ、かさねておおう。
    葉は、ぬった色のまま（flat）：かたまりの上ほど明るく・下ほど暗い段（丸いかたまりに見える）、すじの左右で1段ちがう色（折れた葉）。
    かたまりの中は線を引かない（葉は色の段で見せる。ドットでは葉ごとの線が、こまかい点になった）。まわりだけ線"""
    c=np.array(c,float)
    sc.group('puff%d'%gi);sc.outline(None,olk);sc.material('flat');sc.part();sc.sphere(*c,r*0.9,core,n=14,m=9)
    tw=rs.uniform(0,6.28)
    for th in rings:
        t=math.radians(th);m=max(3,int(round(2*math.pi*math.sin(t)*r/(W*1.1))));ph=tw+rs.uniform(0,6.28)
        for i in range(m):
            a=ph+2*math.pi*i/m+rs.uniform(-0.12,0.12)
            nn=np.array([math.sin(t)*math.cos(a),math.sin(t)*math.sin(a),math.cos(t)])
            d=np.array([math.cos(t)*math.cos(a),math.cos(t)*math.sin(a),-math.sin(t)])
            base=c+nn*r*0.92-d*L*0.30;sd=np.cross(nn,d)
            lt=float(nn@LIGHTV);tone=int(np.clip(round((1-lt)*2.8-0.3+dk+rs.uniform(-0.2,0.2)),0,len(pal)-2))   # dk：下のほうのかたまりは暗く
            side=float(sd@LIGHTV);sc.part()
            for q in bigleaf(base,d,sd,nn,L*rs.uniform(0.94,1.06),W*rs.uniform(0.94,1.06),nt=6,ns=2):
                sc.tri(q[0],q[1],q[2],pal[tone+(0 if (((q[0]+q[1]+q[2])/3-base)@sd)*side>0 else 1)])
    sc.material(None);sc.outline();sc.group(None)

# ---- 木の組み立てどおりに葉をつける（持ち主の指示：葉はランダムな場所に置かず、木の構造にそって） ----
# 小枝（twig）に、つけ根から先へ、左右交互に葉をつけ（葉は小枝の向きから外へ開き、表は上を向く）、先に1まい。
def rot(v,ax,a):
    ax=ax/np.linalg.norm(ax);return v*math.cos(a)+np.cross(ax,v)*math.sin(a)+ax*(ax@v)*(1-math.cos(a))
def dirv(az,el):
    """上から見た向き az（度、0が東・90が南＝手前）と、立ち上がり el（度）の向き"""
    a,e=math.radians(az),math.radians(el);return np.array([math.cos(e)*math.cos(a),math.cos(e)*math.sin(a),math.sin(e)])
def twigleaves(p,d,length,n,L,W,spread=55,tip=True):
    """小枝（p から向き d へ length）につく葉：(つけ根, のびる向き, はばの向き, 表の向き, 長さ, はば) の一覧。
    葉は n 組、左右交互。外へ spread 度ひらき、少し上へそる。先に1まい"""
    out=[];up=np.array([0,0,1.0]);side=np.cross(up,d)
    if np.linalg.norm(side)<1e-6:side=np.array([1.0,0,0])
    side/=np.linalg.norm(side)
    for i in range(n):
        t=(i+1)/(n+1);b=p+d*length*t;s=1 if i%2==0 else -1
        ld=rot(d,up,math.radians(spread*s));ld=ld+up*0.25;ld/=np.linalg.norm(ld)
        out.append((b,ld,L*(0.85+0.25*t),W*(0.85+0.25*t)))
    if tip:out.append((p+d*length*0.95,(d+up*0.15)/np.linalg.norm(d+up*0.15),L*1.1,W*1.1))
    res=[]
    for b,ld,l,w in out:
        sd=np.cross(up,ld);sd=sd/np.linalg.norm(sd) if np.linalg.norm(sd)>1e-6 else np.array([1.0,0,0]);nn=np.cross(ld,sd)
        if nn[2]<0:nn=-nn;sd=-sd
        res.append((b,ld,sd,nn,l,w))
    return res
def drawleaves(sc,leaves,gi,pal=LEAFB,dk=0.0,olk=0.74,zlo=0.0,zhi=1.0):
    """葉の一覧を、1つのかたまり（グループ）として入れる。ぬった色のまま：表が光に向くほど・高い所ほど明るく、すじの左右で1段ちがう"""
    sc.group('lf%d'%gi);sc.outline(None,olk);sc.material('flat')
    for b,ld,sd,nn,l,w in leaves:
        lt=float(nn@LIGHTV);h=(b[2]-zlo)/max(zhi-zlo,1e-6)
        tone=int(np.clip(round((1-lt)*2.4+(1-h)*1.2-0.4+dk),0,len(pal)-2));side=float(sd@LIGHTV);sc.part()
        for q in bigleaf(b,ld,sd,nn,l,w,fold=0.45,droop=0.22,nt=6,ns=2):
            sc.tri(q[0],q[1],q[2],pal[tone+(0 if (((q[0]+q[1]+q[2])/3-b)@sd)*side>0 else 1)])
    sc.material(None);sc.outline();sc.group(None)

# ---- 木の冠（持ち主の指示：葉は半分の大きさ・枝→小枝→細枝→葉・太陽を向く・かさならない・上から見てすきまなし・重力） ----
SUN=np.array([-0.35,0.25,0.90]);SUN/=np.linalg.norm(SUN)   # 太陽の向き（左上・少し手前の、高い所）
def crownleaves(clusters,L=0.16,W=0.10,ext=1.25):
    """かたまり（まん中 c・半径 R・ふくらみ H）ごとに、葉を、まん中から外へ同心円にならべる（輪のはば＝面にそって葉の長さ、輪の中の間かく＝葉のはば。かさならず、すきまもない）。
    葉の高さは、かたまりの面 z=cz+H(1−(r/R)²)（外ほど下がる＝枝の先が葉の重さでたれる）。R の ext 倍まで。
    ほかの、もっと高いかたまりの下になる所には置かない（上から見たとき、上の葉だけ）。
    葉は、外へのびる向き。表は、面の向きと太陽の向きのまん中（太陽のほうを向く）。かえす：かたまりごとの葉の一覧（つけ根, のびる向き, はばの向き, 表の向き, 長さ, はば, 外からの近さ）"""
    up=np.array([0,0,1.0]);out=[]
    def zat(k,x,y):
        c,R,H=clusters[k];r=math.hypot(x-c[0],y-c[1])
        return None if r>R*ext else c[2]+H*(1-(r/R)**2)
    for k,(c,R,H) in enumerate(clusters):
        lv=[];rr=[0.0]
        while rr[-1]<R*ext:   # 輪の間かくは、面にそった長さで葉1まいぶん（ななめの所で、横から見てもすきまがない）
            r0=rr[-1];sl=2*H*r0/R**2;rr.append(r0+0.82*L/math.sqrt(1+sl*sl))   # 0.82：まるい葉の先が、つぎの輪の葉と葉のあいだに入る
        for i,r in enumerate(rr[:-1]):
            m=1 if i==0 else max(6,int(round(2*math.pi*r/W)));ph=(i%2)*math.pi/m   # となりの輪とは、葉の半分ずつずらす
            for j in range(m):
                a=ph+2*math.pi*j/m;x,y=c[0]+r*math.cos(a),c[1]+r*math.sin(a);z=zat(k,x,y)
                if any(q!=k and zat(q,x,y) is not None and zat(q,x,y)>z for q in range(len(clusters))):continue
                o=np.array([math.cos(a),math.sin(a),0.0]) if i else np.array([1.0,0,0])
                g=np.array([-2*H*r/R**2*math.cos(a),-2*H*r/R**2*math.sin(a),1.0]);g/=np.linalg.norm(g)   # 面の向き
                nn=g*0.65+SUN*0.35;nn/=np.linalg.norm(nn)
                ld=o-nn*(o@nn);ld/=np.linalg.norm(ld);sd=np.cross(nn,ld)
                b=np.array((x,y,z))-ld*L*0.5+nn*0.004*i+g*0.02   # 葉のまん中が、その場所。外の輪ほど、ほんの少し上（内の葉の先にかさならない）
                lv.append((b,ld,sd,nn,L,W,r/(R*ext)))
        out.append(lv)
    return out
def roundleaf(base,d,sd,nn,L,W,fold=0.35,droop=0.08,nt=5,ns=2):
    """まるい葉（根もとからまるく広がり、先が少しとがる）。かさねずに、ならべてすきまが小さい形"""
    def P(t,u):
        w=W*(1-abs(2*t-1)**2.5)**0.5*(1-0.25*max(0,t-0.6)/0.4) if 0<t<1 else 0.0;return base+d*t*L+sd*u*w+nn*(fold*w*abs(u)-droop*L*t*t)
    T=[]
    for i in range(nt):
        for j in range(-ns,ns):
            t0,t1=i/nt,(i+1)/nt;u0,u1=j/ns,(j+1)/ns;a,b,c,e=P(t0,u0),P(t1,u0),P(t1,u1),P(t0,u1);T+=[(a,b,c),(a,c,e)]
    return T
def crowncore(sc,c,R,H,ext=1.25,dz=0.05,n=24,m=8,col=LEAFB[3]):
    """かたまりの中身：葉の面の少し下の、こい緑の面（葉のすきまから枝が見えないように）"""
    sc.part()
    def P(i,j):r=R*ext*i/m;a=2*math.pi*j/n;return (c[0]+r*math.cos(a),c[1]+r*math.sin(a),c[2]+H*(1-(r/R)**2)-dz)
    for i in range(m):
        for j in range(n):sc.quad(P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1),col)
def drawcrown(sc,groups,pal=LEAFB,olk=0.74,cl=None):
    """かたまりごとに、葉を入れる（かたまりの中は線を引かない）。ぬった色のまま：外ほど・低いかたまりほど暗く、すじの左右で1段ちがう"""
    zs=[l[0][2] for g in groups for l in g];zlo,zhi=min(zs),max(zs)
    for gi,g in enumerate(groups):
        sc.group('cr%d'%gi);sc.outline(None,olk);sc.material('flat')
        if cl:crowncore(sc,*cl[gi])
        for b,ld,sd,nn,l,w,e in g:
            h=(b[2]-zlo)/max(zhi-zlo,1e-6);tone=int(np.clip(round(1.8*e**3+(1-h)*1.6-0.2),0,len(pal)-2))   # ふち（たれた所）と低い所ほど暗い
            side=float(sd@LIGHTV);sc.part()
            for q in roundleaf(b,ld,sd,nn,l,w):
                sc.tri(q[0],q[1],q[2],pal[tone+(0 if (((q[0]+q[1]+q[2])/3-b)@sd)*side>0 else 1)])
        sc.material(None);sc.outline();sc.group(None)

def poisson(c,Rmax,rmin,seed,k=30):
    """上から見た円（まん中 c・半径 Rmax）の中に、たがいに rmin より近づかない点を、ばらばらに、すきまなくまく（ブリッドソンのやり方）"""
    rs=np.random.RandomState(seed);P=[np.array(c[:2],float)+rs.uniform(-0.03,0.03,2)];act=[0]
    while act:
        i=act[rs.randint(len(act))];ok=False
        for _ in range(k):
            a=rs.uniform(0,2*math.pi);r=rs.uniform(rmin,2*rmin);q=P[i]+r*np.array((math.cos(a),math.sin(a)))
            if np.hypot(*(q-c[:2]))>Rmax:continue
            if all(np.hypot(*(q-p))>=rmin for p in P):P.append(q);act.append(len(P)-1);ok=True;break
        if not ok:act.remove(i)
    return np.array(P)
def crownleaves2(clusters,L=0.16,W=0.10,ext=1.2,seed=0):
    """かたまりごとに、葉をばらばらに（均等にしない）、かさならないように、上から見てすきまなくまく（poisson）。大きさも少しずつちがう。
    葉の高さは、かたまりの面（外ほど重さでたれる）。ほかの、もっと高いかたまりの下には置かない。
    葉は、かたまりのまん中から外へのびる向きを、ばらばらに±30度。表は、面の向きと太陽の向きのまん中"""
    up=np.array([0,0,1.0]);out=[]
    def zat(k,x,y):
        c,R,H=clusters[k];r=math.hypot(x-c[0],y-c[1])
        return None if r>R*ext else c[2]+H*(1-(r/R)**2)
    for k,(c,R,H) in enumerate(clusters):
        rs=np.random.RandomState(seed*31+k);lv=[]
        for x,y in poisson(np.array(c),R*ext,0.62*L,seed*31+k):
            z=zat(k,x,y);r=math.hypot(x-c[0],y-c[1])
            if any(q!=k and zat(q,x,y) is not None and zat(q,x,y)>z for q in range(len(clusters))):continue
            a=math.atan2(y-c[1],x-c[0])+rs.uniform(-0.5,0.5) if r>0.02 else rs.uniform(0,6.28)
            o=np.array([math.cos(a),math.sin(a),0.0])
            g=np.array([-2*H*(x-c[0])/R**2,-2*H*(y-c[1])/R**2,1.0]);g/=np.linalg.norm(g)
            nn=g*0.6+SUN*0.4+rs.uniform(-0.12,0.12,3);nn/=np.linalg.norm(nn)
            ld=o-nn*(o@nn);ld/=np.linalg.norm(ld);sd=np.cross(nn,ld);f=rs.uniform(0.85,1.15)
            b=np.array((x,y,z))-ld*L*f*0.5+g*0.02+nn*rs.uniform(0,0.01)
            lv.append((b,ld,sd,nn,L*f,W*f,r/(R*ext)))
        out.append(lv)
    return out
