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

def limb(T,pts,rs,n=14,flare=0.0,lobes=5,fh=0.16,cap=True,wob=0.0,seed=0):
    """幹・枝：点 pts をつないだ管。rs は点ごとの半径。まわりの向きは、ねじれないように、となりの輪からうつしていく。
    flare：根のふくらみ（根もとの半径に足す分、lobes 本の根。高さ fh まで、なめらかに消える）。cap：先をふさぐ。三角形を T に足す"""
    P=[np.array(q,float) for q in pts];m=len(P)
    D=[P[min(i+1,m-1)]-P[max(i-1,0)] for i in range(m)];D=[d/np.linalg.norm(d) for d in D]
    u=np.cross(D[0],[0,1.0,0]);u/=np.linalg.norm(u);R=[]
    for i in range(m):
        u=u-D[i]*(u@D[i]);u/=np.linalg.norm(u);v=np.cross(D[i],u);ring=[]
        for j in range(n):
            a=2*math.pi*j/n;r=rs[i]
            if wob:r*=1+wob*(math.sin(2*a+seed+0.3*i)*0.6+math.sin(3*a+seed*1.7)*0.4)   # 断面は、まるでなく少しいびつ
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
LEAFTH=0.030   # 葉のあつさ（マス。持ち主の指示：あつみをもっと）
LEAFVEINC=(222,240,150)   # 葉のまん中のすじ（明るい線）
def roundleaf(base,d,sd,nn,L,W,fold=0.30,curl=0.14,th=LEAFTH,nt=8,ns=3):
    """1まいの葉：根もとからまるく広がり、先はとがる（たまごの形）。
    反り：先ほど、表のほうへ反りかえる（curl。持ち主の指示）。あつみ：表と裏の面と、ふちの面（th。持ち主の指示）。ふちの面は2段暗い色で、あつみが見える。
    すじ：まん中に、表より少し上の、細い明るい帯（葉脈）。
    かえす：(表と裏の三角形, ふちの三角形, すじの三角形)"""
    def wid(t):
        if not 0<t<1:return 0.0
        return W*math.sin(math.pi*t**0.8)**0.75*(1-0.45*max(0,t-0.55)/0.45)   # 先ほど細くとがる
    def P(t,u,k):
        w=wid(t);return base+d*t*L+sd*u*w+nn*(fold*w*abs(u)+curl*L*t*t+k*th*(1-abs(u)**2)*(0.35+0.65*math.sin(math.pi*t)))
    T=[];E=[];V=[]
    for k in(0.5,-0.5):
        for i in range(nt):
            for j in range(-ns,ns):
                t0,t1=i/nt,(i+1)/nt;u0,u1=j/ns,(j+1)/ns;a,b,c,e=P(t0,u0,k),P(t1,u0,k),P(t1,u1,k),P(t0,u1,k);T+=[(a,b,c),(a,c,e)]
    for i in range(nt):   # ふち（u=±1）：表と裏のあいだ。あつみ
        t0,t1=i/nt,(i+1)/nt
        for u in(-1,1):
            a,b=P(t0,u,0.5),P(t1,u,0.5);c,e=P(t1,u,-0.5),P(t0,u,-0.5);o=sd*u*0.003;E+=[(a+o,b+o,c+o),(a+o,c+o,e+o)]
    hw=0.006;lift=nn*0.004   # すじ：はば0.012（1ドットくらい）
    for i in range(1,nt-1):
        t0,t1=i/nt,(i+1)/nt;a,b=P(t0,0,0.5)+lift,P(t1,0,0.5)+lift;V+=[(a-sd*hw,b-sd*hw,b+sd*hw),(a-sd*hw,b+sd*hw,a+sd*hw)]
    return T,E,V
def crowncore(sc,c,R,H,ext=1.25,dz=0.05,n=24,m=8,col=LEAFB[4]):
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
            h=(b[2]-zlo)/max(zhi-zlo,1e-6);lt=float(nn@LIGHTV);tone=int(np.clip(round((1-lt)*1.8+0.8*e**3+(1-h)*0.8-0.4),0,len(pal)-2))   # 光に向く葉ほど明るく、ふち（たれた所）と低い所は少し暗い
            side=float(sd@LIGHTV);sc.part()
            TT,EE,VV=roundleaf(b,ld,sd,nn,l,w)
            for q in TT:sc.tri(q[0],q[1],q[2],pal[tone+(0 if (((q[0]+q[1]+q[2])/3-b)@sd)*side>0 else 1)])
            for q in EE:sc.tri(q[0],q[1],q[2],pal[min(len(pal)-1,tone+2)])   # ふち（あつみ）は2段暗い
            for q in VV:sc.tri(q[0],q[1],q[2],LEAFVEINC if tone<=1 else pal[max(0,tone-1)])   # すじ：1段明るい
        sc.material(None);sc.outline();sc.group(None)

def poisson(c,Rmax,rmin,seed,k=30,sl=None):
    """上から見た円（まん中 c・半径 Rmax）の中に、たがいに rmin より近づかない点を、ばらばらに、すきまなくまく（ブリッドソンのやり方）。
    sl(点)：その所の面のかたむき。ななめの所ほど、上から見た間かくをつめる（面の上で同じこさ）"""
    f=(lambda q:rmin/math.sqrt(1+sl(q)**2)) if sl else (lambda q:rmin)
    rs=np.random.RandomState(seed);P=[np.array(c[:2],float)+rs.uniform(-0.03,0.03,2)];act=[0]
    while act:
        i=act[rs.randint(len(act))];ok=False;ri=f(P[i])
        for _ in range(k):
            a=rs.uniform(0,2*math.pi);r=rs.uniform(ri,2*ri);q=P[i]+r*np.array((math.cos(a),math.sin(a)))
            if np.hypot(*(q-c[:2]))>Rmax:continue
            rq=f(q)
            if all(np.hypot(*(q-p))>=min(rq,f(p)) for p in P):P.append(q);act.append(len(P)-1);ok=True;break
        if not ok:act.remove(i)
    return np.array(P)
DENS=0.85   # 葉と葉のいちばん近い間かく（葉の長さの何倍。持ち主の指示：密度を下げる）
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
        for x,y in poisson(np.array(c),R*ext,DENS*L,seed*31+k,sl=lambda q,c=c,R=R,H=H:2*H*math.hypot(q[0]-c[0],q[1]-c[1])/R**2):
            z=zat(k,x,y);r=math.hypot(x-c[0],y-c[1])
            if any(q!=k and zat(q,x,y) is not None and zat(q,x,y)>z for q in range(len(clusters))):continue
            a=math.atan2(y-c[1],x-c[0])+rs.uniform(-0.5,0.5) if r>0.02 else rs.uniform(0,6.28)
            o=np.array([math.cos(a),math.sin(a),0.0])
            g=np.array([-2*H*(x-c[0])/R**2,-2*H*(y-c[1])/R**2,1.0]);g/=np.linalg.norm(g)
            nn=g*0.8+SUN*0.2+rs.uniform(-0.12,0.12,3);nn/=np.linalg.norm(nn)
            ld=o-nn*(o@nn);ld/=np.linalg.norm(ld);sd=np.cross(nn,ld);f=rs.uniform(0.85,1.15)
            b=np.array((x,y,z))-ld*L*f*0.5+g*0.02+nn*rs.uniform(0,0.01)
            lv.append((b,ld,sd,nn,L*f,W*f,r/(R*ext)))
        out.append(lv)
    return out

# ---- 骨格から育てる木（持ち主の指示：根もと → 幹 → 主枝 → 側枝 → 小枝 → 細枝 → 葉の塊） ----
# ・枝は節（芽）から出る：枝にそって、らせんに 137.5度ずつまわる芽の位置から（葉序）。
# ・先ほど細い：どの枝も、つけ根から先へ、なめらかに細くなる。子の枝は、つけた所の親の太さより細い。
# ・つけ根はふくらんで、親となめらかにつながる（枝のえり：はじめの少しだけ太い）。
# ・分かれる角度はまちまち（段ごとのはんいの中で）。光（上・外）へ曲がる（屈光）。外・上の芽ほど枝を出す。
# ・成長の履歴：ゆるい曲がり・太さのむら・ところどころ枯れ枝の跡（短く折れた枝）。
# ・葉は細枝の先のまわりにだけ（葉の塊）。樹冠の形は、枝ののび方できまる。
GOLD=math.radians(137.5)
LV=[   # 段ごと：(子の数のはんい, 親からの角度のはんい（度）, 長さ（親の何倍）, 子が出るはんい（親の長さの割合）)
    None,
    ((3,4),(50,72),(0.78,0.98),(0.0,0.0)),    # 主枝（幹から）
    ((3,5),(35,70),(0.50,0.66),(0.30,0.95)),  # 側枝
    ((2,4),(30,75),(0.48,0.62),(0.30,0.95)),  # 小枝
    ((2,3),(25,65),(0.45,0.60),(0.35,1.00)),  # 細枝
]
def _bendto(d,want,k):v=d*(1-k)+want*k;return v/np.linalg.norm(v)
def roots(T,p,r,rs,n=5,L=0.24):
    """根張り：幹の根もとから、太い根が外へ（幹の延長）。とちゅうで側根を1本。太さ・長さ・向きはまちまち"""
    az=rs.uniform(0,6.28)
    for k in range(n):
        az+=2*math.pi/n+rs.uniform(-0.45,0.45);o=np.array([math.cos(az),math.sin(az),0.0]);l=L*rs.uniform(0.6,1.25)
        a=np.array(p)+np.array([0,0,0.09]);pts=[a+o*r*0.4,a+o*(r*0.8+l*0.3)-np.array([0,0,0.07]),a+o*(r+l*0.7)-np.array([0,0,0.10]),a+o*(r+l)-np.array([0,0,0.12])]
        rr=[r*0.45,r*0.30,r*0.18,r*0.08];limb(T,pts,rr,n=10,wob=0.1,seed=k)
        q=pts[2];o2=np.array([math.cos(az+0.9*rs.choice([-1,1])),math.sin(az+0.9),0.0]);o2/=np.linalg.norm(o2)
        limb(T,[q,q+o2*l*0.35-np.array([0,0,0.03])],[r*0.12,r*0.05],n=6)
def growbranch(T,leafs,p,d,length,r0,lv,rs,top,stubs=True,used=None):
    """1本の枝を、節ごとにのばし、芽から子の枝を出す。lv：0幹・1主枝・2側枝・3小枝・4細枝。
    向き：つけ根はななめ上・なかほどは重さで横へ（垂れ）・先は上へ（光）。外へ広がる"""
    nseg=10 if lv<=1 else 6;pts=[np.array(p,float)];dd=d.copy();up=np.array([0,0,1.0])
    for i in range(nseg):
        t=i/nseg;out=pts[-1]-np.array([top[0],top[1],pts[-1][2]]);out=out/np.linalg.norm(out) if np.linalg.norm(out)>1e-6 else np.zeros(3)
        if lv==0:dd=_bendto(dd,up,0.04)
        else:
            dd=_bendto(dd,out if np.linalg.norm(out)>0 else dd,0.05)   # 外へ（光・すきまのある方へ）
            if lv<=2 and 0.25<t<0.7:dd=dd+np.array([0,0,-0.02*length/0.6])   # 重さで、なかほどが垂れる
            if t>=0.6:dd=_bendto(dd,up,0.10 if lv<=2 else 0.05)   # 先は上へ
        dd=dd+rs.normal(0,0.07 if lv>0 else 0.04,3);dd[2]=max(dd[2],-0.08);dd/=np.linalg.norm(dd)   # 成長の履歴：ゆるい曲がり
        pts.append(pts[-1]+dd*length/nseg)
    rend=r0*(0.55 if lv<4 else 0.35)
    rr=[r0+(rend-r0)*(i/nseg)**0.8 for i in range(nseg+1)]
    rr=[r*(1+0.05*math.sin(i*1.7+lv)) for i,r in enumerate(rr)]   # 太さのむら
    if lv>0:rr[0]*=1.45;rr[1]*=1.15   # 枝えり：つけ根のふくらみ
    limb(T,pts,rr,n=14 if lv==0 else 10 if lv<=2 else 6,flare=0.08 if lv==0 else 0.0,fh=0.22,wob=0.08 if lv<=1 else 0.0,seed=lv*7+len(T)%13)
    if lv==0:roots(T,p,r0,rs)
    if lv==4:   # 細枝：節ごとに葉（葉の塊）
        leafs.append(pts);return
    nlv=lv+1;nc,ang,lk,span=LV[nlv]
    nb=rs.randint(nc[0],nc[1]+1)
    spots=np.sort(rs.uniform(0.58,0.88,nb)) if lv==0 else np.sort(rs.uniform(span[0],span[1],nb))   # 間かくは、まちまち
    az=rs.uniform(0,6.28);used=[] if lv==0 else used
    for k,s in enumerate(spots):
        i=min(nseg-1,int(s*nseg));q=pts[i]+(pts[i+1]-pts[i])*(s*nseg-i);ld=pts[i+1]-pts[i];ld/=np.linalg.norm(ld)
        u=np.cross(ld,[0,0,1.0]);u=u/np.linalg.norm(u) if np.linalg.norm(u)>1e-6 else np.array([1.0,0,0]);v=np.cross(ld,u)
        if lv==0:   # 主枝：芽のらせん（137.5度）の近くで、ほかの主枝のいない向き（すきまのある方）
            cands=[az+GOLD*(k+1)+dz for dz in np.linspace(-0.8,0.8,7)]
            ca=max(cands,key=lambda x:min([abs((x-w+math.pi)%(2*math.pi)-math.pi) for w in used] or [9]))
            used.append(ca);side=np.array([math.cos(ca),math.sin(ca),0.0])
        else:
            az+=GOLD;side=u*math.cos(az)+v*math.sin(az)   # 芽は、らせんに137.5度ずつ
        a=math.radians(rs.uniform(*ang));cd=ld*math.cos(a)+side*math.sin(a);cd/=np.linalg.norm(cd)
        out=q-np.array([top[0],top[1],q[2]]);light=0.5+0.5*max(0.0,(out/np.linalg.norm(out)) @ cd if np.linalg.norm(out)>1e-6 else 0.5)+0.3*max(0.0,cd[2])   # 外・上を向く芽ほど、よくのびる
        if lv>=2 and light<0.55 and rs.rand()<0.5:continue   # 内がわ・下向きの芽は、のびないことが多い
        cl=length*rs.uniform(*lk)*min(1.15,light)*(1.15-0.5*s if lv==0 else 1-0.35*s)   # 下の（古い）枝ほど長い
        if stubs and lv<=1 and rs.rand()<0.12:   # 枯れ枝の跡：短く折れた枝
            limb(T,[q,q+cd*0.06],[rr[i]*0.5,rr[i]*0.42],n=8);continue
        growbranch(T,leafs,q,cd,cl,min(rr[i]*0.62,r0*0.68),nlv,rs,top,stubs,used)   # 子は、親より細い
    if lv<=3:   # 先の芽：そのままのびる（幹の先は、主枝の1本になる）
        growbranch(T,leafs,pts[-1],dd,length*(0.55 if lv==0 else rs.uniform(*LV[nlv][2])),rend*0.9,nlv,rs,top,stubs,used)
def tipleaves(clumps,L=0.16,W=0.10,dmin=0.62,seed=0):
    """細枝の節に葉：細枝の先の半分に、節を4〜6こ（間かくはまちまち）、節ごとに1まい（互生：となりの節と137.5度ずつまわる）、先に2まい。
    葉は細枝から外へ（葉柄の向き）、表は太陽へ。向き・大きさは少しずつちがう。葉どうしは、まん中が dmin×長さ より近づかない（かさならない）"""
    rs=np.random.RandomState(seed);up=np.array([0,0,1.0]);put=[];out=[]
    for pts in clumps:
        P=np.array(pts);lv=[];n=rs.randint(4,7);ts=np.sort(rs.uniform(0.45,1.0,n));az=rs.uniform(0,6.28)
        nodes=[(t,None) for t in ts]+[(1.0,0.4),(1.0,-0.4)]
        for t,tw in nodes:
            f_=t*(len(P)-1);i=min(len(P)-2,int(f_));base=P[i]+(P[i+1]-P[i])*(f_-i);d=P[i+1]-P[i];d/=np.linalg.norm(d)
            u=np.cross(d,up);u=u/np.linalg.norm(u) if np.linalg.norm(u)>1e-6 else np.array([1.0,0,0]);v=np.cross(d,u)
            if tw is None:az+=GOLD;o=d*0.45+(u*math.cos(az)+v*math.sin(az))*0.9
            else:o=d+u*tw
            o=o+up*0.15;o/=np.linalg.norm(o)
            nn=SUN*0.6+up*0.2+o*0.3+rs.normal(0,0.12,3);nn/=np.linalg.norm(nn)   # 表は太陽へ（ばらつき）
            ld=o-nn*(o@nn);ld/=np.linalg.norm(ld);sd=np.cross(nn,ld);f=rs.uniform(0.8,1.2)
            c=base+ld*L*f*0.5
            if any(np.linalg.norm(c-q)<dmin*L for q in put):continue
            put.append(c);lv.append((base,ld,sd,nn,L*f,W*f,0.0))
        out.append(lv)
    return out
LEAFOLK=0.86   # 葉の輪郭線のこさ（となりの色×これ）
def drawclumps(sc,groups,pal=LEAFB,olk=0.74,axis=(0.5,0.6),tonef=None):
    """葉の塊ごとに入れる（塊の中は線を引かない）。光に向く葉・外・上ほど明るい。すじの左右で1段、ふち（あつみ）は2段暗い"""
    zs=[l[0][2] for g in groups for l in g];zlo,zhi=min(zs),max(zs);rmax=max(math.hypot(l[0][0]-axis[0],l[0][1]-axis[1]) for g in groups for l in g)
    for gi,g in enumerate(groups):
        if not g:continue
        sc.outline(None,LEAFOLK);sc.material('flat')   # 葉1まいずつに、うすい輪郭線（葉群でまとめない：1まいずつ見える）
        for b,ld,sd,nn,l,w,_ in g:
            h=(b[2]-zlo)/max(zhi-zlo,1e-6);ro=math.hypot(b[0]-axis[0],b[1]-axis[1])/rmax;lt=float(nn@LIGHTV)
            tone=int(np.clip(round((1-lt)*1.5+(1-h)*1.9+(1-ro)*1.0-0.7),0,len(pal)-2)) if tonef is None else tonef(gi,b,nn);side=float(sd@LIGHTV);sc.part()   # 下・内ほど暗い（立体感）。tonef：葉群ごとのかげ
            TT,EE,VV=roundleaf(b,ld,sd,nn,l,w)
            for q in TT:sc.tri(q[0],q[1],q[2],pal[tone+(0 if (((q[0]+q[1]+q[2])/3-b)@sd)*side>0 else 1)])
            for q in EE:sc.tri(q[0],q[1],q[2],pal[min(len(pal)-1,tone+2)])   # ふち（あつみ）は2段暗い
            for q in VV:sc.tri(q[0],q[1],q[2],LEAFVEINC if tone<=1 else pal[max(0,tone-1)])   # すじ：1段明るい
        sc.material(None);sc.outline()

# ---- 樹冠の形を先にきめて、その中に枝をのばす（持ち主の指示：自然な樹形の20の法則） ----
# スペース・コロニゼーション（Runions ほか 2007）：樹冠の形の中に目じるしの点をまき、幹の先から、近くの目じるしへ向かって枝をのばす（ついた目じるしは消す）。
#   → 主枝は放射状に・長さも向きもまちまち・とちゅうで何度も分かれ・側枝が横へ・樹冠の中までうまる。枝は幹から先までつながる。
# 太さ：先の枝から根もとへ、子の太さを合わせて親の太さにする（r^E の和。急に細くならない）。分かれた所は、子のほうが細い。
def envelope(c,rx,ry,rz,seed):
    """樹冠の形：横に広いだ円体に、ゆっくりかわるでこぼこ（突き出し・くぼみ）。かえす：点がその中か"""
    def inside(p):
        x,y,z=(p[0]-c[0])/rx,(p[1]-c[1])/ry,(p[2]-c[2])/rz;d=math.sqrt(x*x+y*y+z*z)
        if d<1e-9:return True
        b=1+0.18*(ST.vnoise(x*1.6+seed,y*1.6,z*1.6)-0.5)*2+0.08*(ST.vnoise(x*4+seed,y*4+3,z*4)-0.5)*2
        if z<-0.35:b*=0.85   # 下は少しすぼまる
        return d<b
    return inside
def colonize(base,trunkh,env,box,n_att=520,D=0.055,di=0.45,dk=0.09,seed=0,iters=220):
    """幹（base からまっすぐ上へ trunkh）をのばしてから、目じるしへ枝をのばす。かえす：点・親の番号"""
    rs=np.random.RandomState(seed);lo,hi=np.array(box[0]),np.array(box[1]);A=[]
    while len(A)<n_att:
        p=lo+(hi-lo)*rs.rand(3)
        if env(p):A.append(p)
    A=np.array(A);P=[np.array(base,float)];par=[-1];z=0.0
    while z<trunkh:   # 幹：少しかたむき、ゆるくまがる
        z+=D;q=P[-1]+np.array([rs.normal(0,0.008)+0.004,rs.normal(0,0.006),D]);P.append(q);par.append(len(P)-2)
    alive=np.ones(len(A),bool)
    for it in range(iters):
        if not alive.any():break
        Pn=np.array(P);acc={}
        for ai in np.flatnonzero(alive):
            d=np.linalg.norm(Pn-A[ai],axis=1);j=int(d.argmin())
            if d[j]<dk:alive[ai]=False;continue
            if d[j]<di:v=(A[ai]-Pn[j])/d[j];acc.setdefault(j,[]).append(v)
        if not acc:break
        for j,vs in acc.items():
            v=np.sum(vs,0);v/=np.linalg.norm(v);v=v+np.array([0,0,0.12])+rs.normal(0,0.10,3);v/=np.linalg.norm(v)   # 光（上）へ少し・成長のむら
            P.append(P[j]+v*D);par.append(j)
    return np.array(P),np.array(par)
def radii(par,rtip=0.010,E=2.4,rmax=None):
    """太さ：先（子のない点）は rtip。親は、子の太さの r^E の和の E 乗根（パイプモデル）"""
    n=len(par);r=np.full(n,rtip);ch=[[] for _ in range(n)]
    for i in range(1,n):
        if par[i]>=0:ch[par[i]].append(i)
    for i in range(n-1,-1,-1):
        if ch[i]:r[i]=sum(r[c]**E for c in ch[i])**(1/E)
    if rmax:r=np.minimum(r,rmax)
    return r,ch
def chains(par,ch,r=None):
    """枝を、分かれる所から先へ、つながった点の列にする（いちばん太い子が親の列のつづき。太い枝が、とちゅうで切れたように終わらない）"""
    out=[];stack=[(0,None)]
    while stack:
        i,pp=stack.pop();c=[pp,i] if pp is not None else [i]
        while True:
            cs=ch[i]
            if not cs:break
            big=max(cs,key=lambda k:r[k] if r is not None else len(ch[k]))   # つづき：いちばん太い子
            for k in cs:
                if k!=big:stack.append((k,i))
            c.append(big);i=big
        out.append(c)
    return out
