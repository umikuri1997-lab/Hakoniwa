# 御神木（草原）の切り株・芽・若葉・若木・御神木を、トリポのモデル（models/tripo/sacred_stump.glb）から、
# 3Dのままドット絵に写す（スキル model3d-pixel。写し方は furn3d.py と同じ：見おろし42度・奥行きだけ遠近・かげ4だん）。
# 使い方：python3 tools/art/sacred-tree/sacred_tripo.py <出力フォルダ> [--chips]
#
# 設計図（形が自由な物なので、部品の表ではなく、モデルの分け方と置き方）：
#   モデルには4つの物が入っている（上から見て、左おく＝育った木・右おく＝切り株・左手前＝若木の生えた切り株・右手前＝芽の出た切り株）。
#   点のつながりでわけ、場所で4つにまとめる。黄色い小さな玉は光のつぶ（育った木・若木だけ。かげなしで光らせる）。
#   切り株・芽・若葉・若木の切り株は、どれも同じ物（右おくの切り株）を使う（段階で切り株がかわらないように）。
#     芽：右手前の切り株の芽を、その切り株の大きさ→右おくの切り株の大きさにうつして、のせる。若葉：同じ芽を1.8倍にして、のせる。
#     若木：左手前の若木（幹・枝・葉）を、同じようにうつして、のせる。
#   大きさ：切り株は、はば2.30マス（いまの絵と同じくらい）。御神木は、はば5.6マス（いまの絵と同じくらい）。
#   置き方：幹のまん中を、4×4マスのまん中（x=2.0・y=2.0）に。
#   色：いまの絵の色に合わせる。モデルの色の明るさのちがいだけをのこし（木の皮のすじ・年輪）、色は、いまの絵の木の皮・切り口・葉の色にする（3だんにそろえる）。
import sys,os,math
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
sys.path.insert(0,ART);sys.path.insert(0,os.path.join(ART,'furn3d'))
import numpy as np
from PIL import Image
import oblique3d as O
import furn3d as F3

GLB=os.path.join(ART,'models','tripo','sacred_stump.glb')
TX=2.0          # 幹のまん中（マス）
TY=2.0          # 幹のまん中（4×4マスのまん中）
STUMPW=2.30     # 切り株（根もふくむ）のはば（マス）
TREEW=5.60      # 御神木（葉もふくむ）のはば（マス）
LEAFK=1.8       # 若葉：芽の大きさ
# いまの絵の色（明るい所・ふつう・暗い所）
BARK=[(239,175,121),(218,152,106),(182,125,88)]   # お手本の絵の木の皮：明るいすじ・ふつう・みぞ
CUT=[(248,226,186),(238,210,166),(222,190,146)]
LEAF=[(225,234,117),(191,208,99),(172,194,96)]   # お手本の絵の葉：明るい・ふつう・下のふち
GLOW=(255,246,176)
MOTEK=0.45     # 光のつぶの大きさ（モデルの玉は大きいので、ちぢめる）

def load():
    import trimesh,scipy.sparse as sp
    from scipy.sparse.csgraph import connected_components as cc
    m=trimesh.load(GLB,force='mesh')
    v=np.asarray(m.vertices,float);Fc=np.asarray(m.faces)
    col=np.asarray(m.visual.to_color().vertex_colors,float)[:,:3][Fc].mean(1)   # 面の色（テクスチャの色）
    _,inv=np.unique(np.round(v,5),axis=0,return_inverse=True);inv=inv.reshape(-1);F2=inv[Fc];n=inv.max()+1
    e=np.concatenate([F2[:,[0,1]],F2[:,[1,2]]]);_,lab=cc(sp.coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(n,n)),directed=False);fl=lab[F2[:,0]]
    global TEXL
    TEXL=np.asarray(m.visual.material.baseColorTexture.convert('L'),float)   # モデルのテクスチャの明るさ（もように使う）
    UV=np.asarray(m.visual.uv,float)
    V=np.stack([v[:,0],v[:,2],v[:,1]],1);Fc=Fc[:,[0,2,1]]   # glTF（y上・z手前）→ x・y南・z上（軸を入れかえると裏表がかわるので、面のならびを逆に）
    comps=[]
    for i in np.unique(fl):
        s=np.where(fl==i)[0];p=V[Fc[s]].reshape(-1,3);c=col[s].mean(0)
        kind='glow' if c[0]>215 and c[1]>200 else 'leaf' if c[1]>c[0] else 'wood'
        q=p.mean(0);grp=('L' if q[0]<0 else 'R')+('B' if q[1]<0 else 'F')   # LB=育った木・RB=切り株・LF=若木・RF=芽
        if grp[0]=='L' and (p.max(0)-p.min(0)).max()<0.035:kind='glow'   # 光のつぶ・こぼれた小さな玉（色が木や葉の色の物も）。絵には入れない
        comps.append(dict(f=Fc[s],uv=UV[Fc[s]],col=col[s],kind=kind,grp=grp,n=len(s),lo=p.min(0),hi=p.max(0)))
    return V,comps

_BT=[]
def BARKTEX():
    """木の皮のテクスチャ（ambientCG Bark001）。たてのすじが見えるように、まきの皮より、こく・大きく"""
    if not _BT:_BT.append(O.Tex(os.path.join(ART,'textures','bark001.png'),span=0.8,flow=7,minrun=4,dark=(0.24,0.86),light=(0.18,1.08)))
    return _BT[0]
LEAFS=0.26    # まるい葉のならぶ間かく（マス）
def _h(i,j,k):
    n=(i*73856093)^(j*19349663)^(k*83492791);n=(n^(n>>13))*1274126177&0xffffffff;return ((n&0xffff)/65535.0,((n>>16)&0xffff)/65535.0)
def leafpat(x,y,z):
    """葉の柄（お手本の絵と同じ、小さなまるい葉がかさなるかたまり）：画面の上での場所（よこ x・たて z−0.9y）に、
    まるい葉を1マスに1まい、ばらばらの場所・大きさで置き、下（手前）の葉を上にかさねる。
    葉の下のふちに、少し暗い弧（葉のかさなりのかげ）。葉の左上に、ときどき明るい所。明るい・暗いの大きな段は、かたまりの形のかげで"""
    u=x/LEAFS;v=-(z-0.9*y)/LEAFS;iu,iv=math.floor(u),math.floor(v);best=None
    for dj in(-1,0,1):
        for di in(-1,0,1):
            i,j=iu+di,iv+dj;a,b=_h(i,j,7);a2,b2=_h(i,j,11)
            cu=i+0.15+0.7*a;cv=j+0.15+0.7*b;r=0.70+0.25*a2
            du,dv=(u-cu)/r,(v-cv)/r
            if du*du+dv*dv<1 and (best is None or cv>best[0]):best=(cv,du,dv,b2)
    if best is None:return LEAF[2]
    _,du,dv,b2=best;d=math.hypot(du,dv)
    if d>0.76 and dv>0.15:return LEAF[2]     # 下のふちの弧
    if b2<0.55 and math.hypot(du+0.3,dv+0.3)<0.33:return LEAF[0]   # 左上の明るい所
    return LEAF[1]

LOBE=0.17      # 葉の玉のならぶ間かく（マス）
LEAFIN=(146,172,88)   # かたまりの中（玉と玉のすきまから見える、こい緑。お手本の絵の、かたまりの下のかげの色）
def lobes(sc,q,n,gi):
    """葉のかたまり（モデルの面 q・面の向き n）の、見える側の表面に、まるい葉の玉（半径 0.09〜0.13 マス）を、
    面の大きさに合わせた数だけ、少し中へしずめてならべる。上を向いた所の玉は明るい黄緑、ほかはふつうの黄緑。
    もとのかたまりは、少しちぢめて、こい緑の中身にする。玉どうし・中身とのさかいには線を引かない（同じグループ）"""
    n=n/np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
    rs=np.random.RandomState(1000+gi);area=np.linalg.norm(np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]),axis=1)/2
    vis=(n[:,1]*0.67+n[:,2]*0.74>-0.25)   # 見える側（南と上）
    A=area*vis;N=max(3,int(A.sum()/(LOBE*LOBE)))
    cen=q.reshape(-1,3).mean(0)
    sc.group('leaf%d'%gi)
    sc.part()   # 中身
    for t in q:t2=cen+(t-cen)*0.9;sc.tri(t2[0],t2[1],t2[2],LEAFIN)
    idx=rs.choice(len(q),N,p=A/A.sum())
    for k_ in idx:
        w=rs.dirichlet((1,1,1));pt=w@q[k_];nn=n[k_];r=0.09+0.04*rs.rand();c_=pt-nn*r*0.45
        sc.sphere(c_[0],c_[1],c_[2],r,LEAF[0] if nn[2]>0.55 else LEAF[1],n=10,m=6)
    sc.group(None)

TEXL=None
def texpat(items,pal):
    """モデルのテクスチャ（モデルの形に合わせて作られた、木の皮のすじ・葉の重なり）を、ドットごとに読み、
    その明るさで、お手本の絵の色（明るい・ふつう・暗い）にする。items=[(面の点 q, 面ごとのuv)]"""
    from scipy.spatial import cKDTree
    Q=np.concatenate([q for q,u in items]);U=np.concatenate([u for q,u in items]);T_=cKDTree(Q.mean(1));H,W=TEXL.shape
    def lum(uv):return TEXL[np.clip(((1-uv[...,1])*H).astype(int),0,H-1),np.clip((uv[...,0]*W).astype(int),0,W-1)]
    ss=lum(U.mean(1));lo,hi=np.quantile(ss,0.3),np.quantile(ss,0.75)   # 明るさのさかい（そのなかまの中で）
    def f(x,y,z):
        p=np.array((x,y,z));i=T_.query(p)[1];a,b,c=Q[i];v0,v1,v2=b-a,c-a,p-a
        d00,d01,d11,d20,d21=v0@v0,v0@v1,v1@v1,v2@v0,v2@v1;dn=d00*d11-d01*d01 or 1e-12
        w1=(d11*d20-d01*d21)/dn;w2=(d00*d21-d01*d20)/dn;w0=1-w1-w2
        L=float(lum(w0*U[i,0]+w1*U[i,1]+w2*U[i,2]))
        return pal[2] if L<lo else pal[0] if L>hi else pal[1]
    return f

LEAFSPEC=0.93   # 葉のつやが出る向きの近さ（大きいほど、つやは小さく、光にまっすぐ向いた所だけ）
LEAFVEIN=(160,182,86)   # 葉脈・まん中のすじ（谷）の色
def veinpat(q):
    """1まいの葉（モデルの葉のかたまり1つ）の柄：葉ののびる向き（いちばん長い向き）を、まん中のすじにする。
    まん中のすじがいちばん低い谷なので暗く、そこからふちへ明るくなる。すじから、葉の先のほうへななめに、細い葉脈"""
    P=q.reshape(-1,3);c0=P.mean(0);_,_,vt=np.linalg.svd(P-c0,full_matrices=False);e1,e2=vt[0],vt[1]
    t0=(P-c0)@e1;s0=(P-c0)@e2;L=t0.max()-t0.min();tip=1 if t0.max()>-t0.min() else -1
    nb=12;edges=np.linspace(t0.min(),t0.max(),nb+1);W_=np.array([np.abs(s0[(t0>=edges[i])&(t0<=edges[i+1])]).max() if ((t0>=edges[i])&(t0<=edges[i+1])).any() else 0 for i in range(nb)])   # 長さの場所ごとの、葉のはば
    mid=np.array([np.median(s0[(t0>=edges[i])&(t0<=edges[i+1])]) if ((t0>=edges[i])&(t0<=edges[i+1])).any() else 0 for i in range(nb)])   # まん中のすじの場所
    VP=0.11    # 葉脈の間かく（マス）
    def f(x,y,z):
        d=np.array((x,y,z))-c0;t=float(d@e1);sv=float(d@e2);k=min(nb-1,max(0,int((t-edges[0])/(L/nb+1e-9))))
        w=max(W_[k],1e-6);ds=(sv-mid[k])/w;ad=abs(ds)
        if ad<0.09:return LEAFVEIN   # まん中のすじ（谷）
        if 0.15<ad<0.72 and ((t*tip-ad*w*0.9)/VP)%1<0.11:return LEAFVEIN if ad<0.45 else LEAF[1]   # 葉脈：すじから、先のほうへななめ
        return LEAF[1] if ad<0.45 else LEAF[0]
    return f

BARKT=0.055   # 切り株の樹皮のあつさ（マス）
def roundstump(P):
    """切り株（モデル）の、かたむいた切り口をたいらにする：切り口の面のかたむきをはかり、根もとは動かさずに、上ほど、そのかたむきの分だけ高さをずらす（形はかえない）"""
    U,inv=np.unique(P.reshape(-1,3),axis=0,return_inverse=True);inv=inv.reshape(-1)
    zl,zh=U[:,2].min(),U[:,2].max();H=zh-zl;top=U[U[:,2]>zh-0.12*H];cx,cy=top[:,0].mean(),top[:,1].mean()
    A=np.c_[np.ones(len(top)),top[:,0]-cx,top[:,1]-cy];a0,gx,gy=np.linalg.lstsq(A,top[:,2],rcond=None)[0]   # 切り口の面 z = a0 + gx·x + gy·y
    w=np.clip((U[:,2]-zl)/H,0,1)**1.5
    U2=U.copy();U2[:,2]=U[:,2]-(gx*(U[:,0]-cx)+gy*(U[:,1]-cy))*w
    return U2[inv].reshape(P.shape)
SPROUT=[(186,220,112),(160,204,96)]   # 芽の葉の色（明るい・ふつう）
STEMC=(132,172,82)
def leafmesh(base,ang,L,W,pitch,fold=0.35,droop=0.25):
    """平たい葉（先がとがった、たまごの形）を三角形にする。base：つけ根・ang：上から見た向き・pitch：上へのそり（ラジアン）。
    まん中のすじがいちばん低い（fold：ふちほど上がる）。先は少したれる（droop）"""
    d=np.array([math.cos(ang),math.sin(ang),0.0]);sd=np.array([-math.sin(ang),math.cos(ang),0.0]);up=np.array([0,0,1.0])
    def P(t,u):
        w=W*math.sin(math.pi*min(1,t*1.05))**0.75*(1-0.25*t);h=math.sin(pitch)*t*L-droop*L*t*t+fold*w*abs(u)
        return base+d*math.cos(pitch)*t*L+sd*u*w+up*h
    T=[];nt,ns=10,6
    for i in range(nt):
        for j in range(-ns,ns):
            t0,t1=i/nt,(i+1)/nt;u0,u1=j/ns,(j+1)/ns
            a,b,c,dd=P(t0,u0),P(t1,u0),P(t1,u1),P(t0,u1);T+= [(a,b,c),(a,c,dd)]
    return np.array(T)
def sprout(sc,base,name):
    """切り株の切り口から出た芽：細い茎と、平たい葉（芽は1まい・若葉は2まい、ひらく）。葉はまん中のすじが低く、葉脈も"""
    H=0.16 if name=='bud' else 0.24;top=base+np.array([0.01,0,H])
    sc.outline(0);sc.tube([tuple(base),tuple(base+np.array([0.0,0,H*0.5])),tuple(top)],0.008,STEMC,n=6);sc.outline()   # 細い茎（輪郭線なし。1〜2ドット）
    lv=[leafmesh(top,-0.4,0.15,0.055,1.0,0.5,0.15)] if name=='bud' else [leafmesh(top,0.15,0.22,0.08,0.5),leafmesh(top,math.pi-0.15,0.22,0.08,0.5)]
    for q in lv:
        f=veinpat(q);sc.material('satin');sc.decal(lambda x,y,z,f=f:SPROUT[0] if f(x,y,z)==LEAF[0] else SPROUT[1] if f(x,y,z)==LEAF[1] else STEMC);sc.part();sc.material(None)
        for t in q:sc.tri(t[0],t[1],t[2],SPROUT[1])
        sc.decal(None)
def leafclump(q):
    """葉のかたまり1つの柄：茎のつく、まん中がいちばん低い（くらい）、ふちへいくほど明るい、3つの段（ふちの形にそった帯）。
    まん中から、ふちへ放射状に、細い葉脈を少し"""
    P=q.reshape(-1,3);c0=P.mean(0);_,_,vt=np.linalg.svd(P-c0,full_matrices=False);e1,e2=vt[0],vt[1]
    X=(P-c0)@e1;Y=(P-c0)@e2;A=np.arctan2(Y,X);R=np.hypot(X,Y);nb=24;ab=((A+math.pi)/(2*math.pi)*nb).astype(int)%nb
    RM=np.array([R[ab==i].max() if (ab==i).any() else R.max() for i in range(nb)]);RM=np.maximum(RM,(RM+np.roll(RM,1)+np.roll(RM,-1))/3)   # 向きごとの、ふちまでの長さ
    NV=5;off=(c0[0]*13.1+c0[2]*7.7)%1   # 葉脈の本数と向きのずれ
    def f(x,y,z):
        d=np.array((x,y,z))-c0;X_,Y_=float(d@e1),float(d@e2);a=math.atan2(Y_,X_);i=int((a+math.pi)/(2*math.pi)*nb)%nb;u=math.hypot(X_,Y_)/max(RM[i],1e-6)
        u+=0.10*math.sin(3*a+off*6.3)+0.06*math.sin(7*a+off*2.1)+0.04*math.sin(13*a)   # さかいを、ゆらがせる（まんまるの帯にしない）
        if 0.28<u<0.62:
            k=(a/(2*math.pi)*NV+off)%1
            if min(k,1-k)*2*math.pi/NV*math.hypot(X_,Y_)<0.010:return LEAF[2]   # 葉脈（まん中のかげの色で、ふつうの所だけ）
        lv=2 if u<0.30 else 1 if u<0.70 else 0
        h_,_=_h(math.floor(x/0.034),math.floor((z-0.9*y)/0.034),23)   # ざらつき：葉の表面の小さなむら（2ドットくらいの点を、ところどころ）
        if h_<0.08:lv=min(2,lv+1)
        elif h_<0.12 and lv==1:lv=0
        return LEAF[lv]
    return f

LEAFGLOSS=(243,245,142)   # 葉のつや（お手本の絵の、いちばん明るい葉の色）
def leafnat(q,uv,lh):
    """葉のかたまり1つの柄：
    ・モデルのテクスチャの明るさ（葉の重なり・すじ。モデルの形にそってかかれている）と、
    ・まん中（茎のつく所）がいちばん低くくらい・ふちほど明るい、かたまりの形の影（ふちまでの長さで、なめらかに）
    を、なめらかにまぜて、3つの色にする。いちばん明るいふちの所だけ、つや（さらに明るい色）。点のむらは入れない"""
    from scipy.spatial import cKDTree
    P=q.reshape(-1,3);c0=P.mean(0);_,_,vt=np.linalg.svd(P-c0,full_matrices=False);e1,e2=vt[0],vt[1]
    X=(P-c0)@e1;Y=(P-c0)@e2;A=np.arctan2(Y,X);R=np.hypot(X,Y);nb=24;ab=((A+math.pi)/(2*math.pi)*nb).astype(int)%nb
    RM=np.array([R[ab==i].max() if (ab==i).any() else R.max() for i in range(nb)]);RM=(RM+np.roll(RM,1)+np.roll(RM,-1))/3
    T_=cKDTree(q.mean(1));H,W=TEXL.shape;lo,hi=lh
    Pu,inv=np.unique(np.round(q.reshape(-1,3),6),axis=0,return_inverse=True);inv=inv.reshape(-1,3)   # 点ごとの面の向き（なめらかなつやのため）
    fn=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]);VN=np.zeros((len(Pu),3))
    for k_ in range(3):np.add.at(VN,inv[:,k_],fn)
    VN/=np.maximum(np.linalg.norm(VN,axis=1,keepdims=True),1e-12)
    HV=O.LIGHT+np.array([0,math.cos(math.radians(42)),math.sin(math.radians(42))]);HV/=np.linalg.norm(HV)   # 光と目のあいだの向き
    def f(x,y,z):
        p=np.array((x,y,z));i=T_.query(p)[1];a,b,c=q[i];v0,v1,v2=b-a,c-a,p-a
        d00,d01,d11,d20,d21=v0@v0,v0@v1,v1@v1,v2@v0,v2@v1;dn=d00*d11-d01*d01 or 1e-12
        w1=(d11*d20-d01*d21)/dn;w2=(d00*d21-d01*d20)/dn;w0=1-w1-w2;u_=w0*uv[i,0]+w1*uv[i,1]+w2*uv[i,2]
        L=TEXL[min(H-1,max(0,int((1-u_[1])*H))),min(W-1,max(0,int(u_[0]*W)))];tl=min(1,max(0,(L-lo)/(hi-lo+1e-9)))
        d=p-c0;X_,Y_=float(d@e1),float(d@e2);an=math.atan2(Y_,X_);k=int((an+math.pi)/(2*math.pi)*nb)%nb;u=min(1,math.hypot(X_,Y_)/max(RM[k],1e-6))
        nv=w0*VN[inv[i,0]]+w1*VN[inv[i,1]]+w2*VN[inv[i,2]];sp=float(nv@HV)/max(np.linalg.norm(nv),1e-9)
        v=0.6*tl+0.4*u**0.8   # テクスチャ（葉の重なり・細かなむら＝ざらつき）と、まん中が低い影
        if sp>LEAFSPEC and v>0.45:return LEAFGLOSS   # つや：光と目のあいだを向いた、明るい所だけ
        return LEAF[2] if v<0.34 else LEAF[1] if v<0.60 else LEAF[0]
    return f

LEAFL,LEAFW=0.13,0.085   # 葉の部品1まいの長さ・はば（マス）
LEAFGAP=0.085   # 葉をならべる間かく（マス）
LEAFTONES=[(232,240,128),(214,230,112),(194,216,100),(172,198,92),(150,180,86)]   # 葉の色（明るい→暗い。お手本の絵の葉の色）
def leafpart(base,d,sd,nn,L,W,fold=0.25,droop=0.35):
    """葉1まいの部品：つけ根 base から、向き d へのびる、先のとがったたまごの形。sd：はばの向き、nn：葉の表の向き。
    まん中のすじがいちばん低い（ふちほど表がわへ上がる fold）。先はうらがわへ少したれる（droop）"""
    def P(t,u):
        w=W*math.sin(math.pi*min(1,t*1.04))**0.7*(1-0.3*t);return base+d*t*L+sd*u*w+nn*(fold*w*abs(u)-droop*L*t*t)
    T=[];nt,ns=5,2
    for i in range(nt):
        for j in range(-ns,ns):
            t0,t1=i/nt,(i+1)/nt;u0,u1=j/ns,(j+1)/ns;a,b,c,e=P(t0,u0),P(t1,u0),P(t1,u1),P(t0,u1);T+=[(a,b,c),(a,c,e)]
    return T
def leafparts(sc,q,gi):
    """葉のかたまり（モデルの面 q）を、小さな葉の部品でおおう（お手本の絵の、葉がかさなるかたまり）：
    ・かたまりの中身：少しちぢめた、こい緑（葉のすきまのかげ）
    ・見える側の表面に、面の大きさに合わせた数の葉。つけ根は表面の少し内、葉は表面にそって、外へ・下へたれる向き（ばらつき）。
    ・葉の色は、かたまりの上ほど明るく、下・内ほど暗い（5つの色から、ばらつきも少し）"""
    rs=np.random.RandomState(500+gi);fn=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]);ar=np.linalg.norm(fn,axis=1)/2;n=fn/np.maximum(2*ar[:,None],1e-12)
    vis=(n[:,1]*0.74+n[:,2]*0.67>-0.35);A=ar*vis
    P0=q.reshape(-1,3);c0=P0.mean(0);zl,zh=P0[:,2].min(),P0[:,2].max()
    sc.part()   # 中身
    for t in q:t2=c0+(t-c0)*0.86;sc.tri(t2[0],t2[1],t2[2],LEAFIN)
    if A.sum()<=0:return
    N=max(6,int(A.sum()/(LEAFGAP*LEAFGAP)));idx=rs.choice(len(q),N,p=A/A.sum());sc.outline(None,0.9)
    order=[]
    for k_ in idx:
        w=rs.dirichlet((1,1,1));pt=w@q[k_];nn=n[k_]
        dn=np.array([0,0,-1.0])-nn*(-nn[2]);out=pt-c0;out-=nn*(out@nn)   # 表面にそって、下へ・外へ
        d=0.3*dn/max(np.linalg.norm(dn),1e-6)+0.7*out/max(np.linalg.norm(out),1e-6)
        ang=rs.uniform(-0.7,0.7);sd0=np.cross(nn,d);d=d*math.cos(ang)+sd0*math.sin(ang);d-=nn*(d@nn);d/=max(np.linalg.norm(d),1e-6);sd=np.cross(nn,d)
        L=LEAFL*rs.uniform(0.8,1.15);W=LEAFW*rs.uniform(0.85,1.15)
        h=(pt[2]-zl)/max(zh-zl,1e-6);tone=int(np.clip(round((1-h)*1.6+(1-nn[2])*1.3+rs.uniform(-0.35,0.35)),0,4))   # かたまりの上・上向きほど明るく、下・下向きほど暗く
        order.append((pt+nn*0.01-d*L*0.35,d,sd,nn,L,W,LEAFTONES[tone]))   # つけ根は、表面の少し外・少しうしろ（葉のまん中が表面のあたり）
    for base,d,sd,nn,L,W,col in order:
        sc.part()
        for t in leafpart(base,d,sd,nn,L,W):sc.tri(t[0],t[1],t[2],col)
    sc.outline()

ROSL,ROSW=0.26,0.15
ROSGRID=1.0   # 葉のかたまりをまとめるます目（マス）   # ロゼットの葉1まいの長さ・はば（マス）
def rosette(sc,c,out,sz,gi,rs):
    """葉のかたまり1つ：まるい中身（半径 r）を、葉の部品でおおう。葉は、かたまりの上から下へ、かわらのように重なる
    （どの葉も、上から下へ、表面にそってのびる。上の輪ほど葉が少ない）。
    色は葉の向き（上向きほど明るい）で、ばらつきは少し。かたまりの中は線を引かず（同じグループ）、まわりだけ線"""
    r=0.40*sz;k=sz;sc.group('ros%d'%gi);sc.outline(None,0.86)
    sc.part();sc.sphere(*c,r*0.9,LEAFTONES[3],n=12,m=8)   # 中身（葉のすきまから見える）
    tw=rs.uniform(0,6.28)
    for th in(12,42,72,100):
        t=math.radians(th);m=max(1,int(round(2*math.pi*math.sin(t)*r/(ROSL*0.62))));ph=tw+rs.uniform(0,6.28)
        for i in range(m):
            a=ph+2*math.pi*i/m+rs.uniform(-0.15,0.15)
            nn=np.array([math.sin(t)*math.cos(a),math.sin(t)*math.sin(a),math.cos(t)])
            d=np.array([math.cos(t)*math.cos(a),math.cos(t)*math.sin(a),-math.sin(t)])   # 表面にそって、上から下へ
            base=c+nn*r-d*ROSL*0.25
            sd=np.cross(nn,d);up_=nn[2]
            tone=int(np.clip(round(1.6-up_*1.8+rs.uniform(-0.25,0.25)),0,4))
            sc.part()
            for tt in leafpart(base,d,sd,nn,ROSL*rs.uniform(0.9,1.08),ROSW*rs.uniform(0.9,1.1),fold=0.25,droop=0.15):sc.tri(tt[0],tt[1],tt[2],LEAFTONES[tone])
    sc.group(None);sc.outline()
def branch(sc,pts,r0,r1):
    """枝：点をつないだ、先ほど細い管（木の皮の色）"""
    n=len(pts)
    for i in range(n-1):
        r=r0+(r1-r0)*i/(n-1);sc.tube([tuple(pts[i]),tuple(pts[i+1])],r,BARK[1],n=8)
def crown(sc,ros,bark):
    """御神木の葉の全体：モデルの葉のかたまりの場所に、ロゼットを置く。
    さらに、幹から、むこうがわ（北）と左右へ枝をのばし、その先にもロゼットを置く（奥にも枝と葉があるつくり）"""
    rs=np.random.RandomState(77);C=np.array([c for c,_ in ros]);cc=C.mean(0);cc[2]=C[:,2].min()+0.35*(C[:,2].max()-C[:,2].min())
    z=bark[:,2];H=z.max()-z.min();fork=bark[np.abs(z-(z.min()+0.55*H))<0.03*H].mean(0)   # 幹のまたの高さ
    extra=[]
    for ang,el,ln in((math.pi*0.5+0.0,0.55,1.5),(math.pi*0.5+0.9,0.45,1.6),(math.pi*0.5-0.9,0.45,1.6),(math.pi*0.5+1.8,0.3,1.4),(math.pi*0.5-1.8,0.3,1.4)):   # 向き（上から見て。+π/2 が北＝むこう）・上へのかたむき・長さ
        d=np.array([math.cos(ang),-math.sin(ang),0.0])*math.cos(el)+np.array([0,0,math.sin(el)])
        p1=fork+d*ln*0.5+np.array([0,0,0.25]);p2=fork+d*ln
        branch(sc,[fork,p1,p2],0.11,0.035)
        extra.append((p2,d))
        for j in range(2):   # 枝の先と、とちゅうの小枝の先に
            q_=p2+np.array([rs.uniform(-0.3,0.3),rs.uniform(-0.3,0.3),rs.uniform(0.0,0.35)]);branch(sc,[p1+(p2-p1)*0.6,q_],0.04,0.02);extra.append((q_,d))
    G={}   # モデルの葉のかたまりを、1マスくらいのます目でまとめる（かたまりを大きく・少なくして、あいだから枝と奥が見えるように）
    for c,sz in ros:G.setdefault(tuple(np.floor(c/ROSGRID).astype(int)),[]).append(c)
    big=[(np.mean(v,0),min(1.35,0.95+0.07*len(v))) for v in G.values()]
    allr=[(c,(c-cc)+np.array([0,0,0.6]),k) for c,k in big]+[(p,d+np.array([0,0,0.5]),1.1) for p,d in extra]
    allr.sort(key=lambda r:r[0][2])
    for gi,(c,out,k) in enumerate(allr):rosette(sc,np.array(c),np.array(out,float),k,gi,rs)

def flowfield(q,src):
    """木の皮の流れ：面の場所から、src（はじまりの点）からの、面をつたう道のりをはかり、その道のりがのびる向きを、面ごとの流れの向きにする。
    幹ではたて・根では外へ・枝では枝のさきへ。かえすのは、面のまん中の点・流れの向き・面の向き"""
    import scipy.sparse as sp
    from scipy.sparse.csgraph import dijkstra
    P=q.reshape(-1,3);key,inv=np.unique(np.round(P,5),axis=0,return_inverse=True);inv=inv.reshape(-1);F=inv.reshape(-1,3)
    e=np.concatenate([F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]]);w=np.linalg.norm(key[e[:,0]]-key[e[:,1]],axis=1)+1e-9
    G=sp.coo_matrix((w,(e[:,0],e[:,1])),shape=(len(key),len(key))).tocsr();G=G.maximum(G.T)
    S_=np.flatnonzero(src(key))
    D=dijkstra(G,directed=False,indices=S_,min_only=True)
    D[~np.isfinite(D)]=0
    A,B,C=key[F[:,0]],key[F[:,1]],key[F[:,2]];n=np.cross(B-A,C-A);nn=np.linalg.norm(n,axis=1,keepdims=True)+1e-12;n=n/nn
    e1,e2=B-A,C-A;d1,d2=(D[F[:,1]]-D[F[:,0]])[:,None],(D[F[:,2]]-D[F[:,0]])[:,None]   # 面の上での道のりの傾き（向き）
    g=(d1*np.cross(n,e2)-d2*np.cross(n,e1))/nn
    g/=np.linalg.norm(g,axis=1,keepdims=True)+1e-12
    return (A+B+C)/3,g,n
def barkpat(cen,g,n):
    """木の皮の柄：流れの向きにのびる、とぎれとぎれのみぞと、明るいすじ（お手本の絵の木の皮）"""
    from scipy.spatial import cKDTree
    T_=cKDTree(cen);P_=0.13
    def f(x,y,z):
        i=T_.query((x,y,z))[1];a=g[i];b=np.cross(a,n[i]);p=np.array((x,y,z))
        sv=float(p@b)/P_;t=float(p@a);w_=sv+0.3*math.sin(t*3+sv*0.4);k=math.floor(w_);fs=w_-k
        h1,h2=_h(k,math.floor(t/0.5+_h(k,3,5)[0]),13)
        if fs<0.22 and h1<0.85:return BARK[2]
        if 0.45<fs<0.62 and h2<0.45:return BARK[0]
        return BARK[1]
    return f
def tones(col,pal,mean):
    """モデルの色の明るさのちがい（そのなかまの平均とくらべる）だけで、3だんの色にする"""
    L=col.mean(1)/mean;return [pal[0] if l>1.06 else pal[2] if l<0.93 else pal[1] for l in L]

def stage(V,comps,name):
    """その段階の三角形：[(点の配列, 面, 色の一覧, 種類)]。大きさ・置き方をそろえる前のモデルの座標"""
    def big(grp):return max((c for c in comps if c['grp']==grp and c['kind']=='wood'),key=lambda c:c['hi'][0]-c['lo'][0])   # 切り株：いちばんはばの広い木の部品（若木の幹ではなく）
    def move(c,src,dst,k=1.0,anchor=None):
        """src の切り株から dst の切り株へ、同じ所にうつす（はば・高さの比で）。k：大きさ（anchor のまわりに）"""
        s=(dst['hi']-dst['lo'])/(src['hi']-src['lo']);p=(V[c['f']]-src['lo'])*s+dst['lo']
        if anchor is not None:p=(p-anchor)*k+anchor
        return p
    st=big('RB');out=[(roundstump(V[st['f']]),st,'bark')]
    if name=='stump':return out
    if name in('bud','leaf'):
        src=big('RF');sp=[c for c in comps if c['grp']=='RF' and c is not src]
        P=[move(c,src,st) for c in sp];allp=np.concatenate([p.reshape(-1,3) for p in P]);anc=allp[allp[:,2].argmin()]   # 芽の根もと
        return out+[(anc.reshape(1,1,3),dict(n=0,col=np.zeros((1,3)),uv=np.zeros((1,3,2))),'sprout')]   # 芽はモデルの形を使わず、作る（モデルの芽は、まるい玉に見えた）
    if name=='sapling':
        src=big('LF');its=[(move(c,src,st),c,{'wood':'bark','leaf':'leaf','glow':'glow'}[c['kind']]) for c in comps if c['grp']=='LF' and c is not src and c['kind']!='glow']   # 若木には光のつぶを出さない（いまの絵と同じ）
        tr=max((it for it in its if it[2]=='bark'),key=lambda it:it[1]['n'])[0].reshape(-1,3)   # 若木の幹
        zl=tr[:,2].min();b0=tr[tr[:,2]<zl+0.02*(tr[:,2].max()-zl)].mean(0);t0=tr[tr[:,2]>tr[:,2].max()-0.25*(tr[:,2].max()-zl)].mean(0)
        a=math.atan2(t0[1]-b0[1],t0[2]-b0[2])   # うしろ（北）へのかたむき。根もとのまわりに、まっすぐ立てる（モデルでは、うしろへたおれていた）
        R=np.array([[1,0,0],[0,math.cos(a),-math.sin(a)],[0,math.sin(a),math.cos(a)]])
        return out+[(((p_-b0)@R.T)+b0,c,k) for p_,c,k in its]
    return [(V[c['f']],c,{'wood':'bark','leaf':'leaf'}[c['kind']]) for c in comps if c['grp']=='LB' and c['kind']!='glow']   # 光のつぶは絵に入れない（ゲームで動くつぶにする drawSacredMotes）

class Stage:
    """furn3d.shot にわたす設計図（PARTS は空、EXTRA で三角形を足す）"""
    def __init__(s,V,comps,name):
        s.name=name;s.ID='story:'+name;s.items=stage(V,comps,name);s.GRAD=True;s.PARALLEL=True   # 遠近なし：furn3d の遠近は1マスの物に合わせた強さなので、大きな木では、上ほど大きくゆがむ
        P=np.concatenate([p.reshape(-1,3) for p,_,_ in s.items]);bark=np.concatenate([p.reshape(-1,3) for p,c,k in s.items if c is s.items[0][1]])
        main=(max((it for it in s.items if it[2]=='bark'),key=lambda it:it[1]['n']) if name=='tree' else s.items[0])[0].reshape(-1,3)   # 切り株（はじめの部品）・御神木の幹（いちばん大きな木の部品）
        if name=='tree':k=TREEW/(P[:,0].max()-P[:,0].min())
        else:k=STUMPW/(bark[:,0].max()-bark[:,0].min())
        z=main[:,2];Hm=z.max()-z.min();lo,hi=(0.5,0.8) if name!='tree' else (0.25,0.40)   # 幹の高さの所（根より上）の断面
        band=main[(z>z.min()+lo*Hm)&(z<z.min()+hi*Hm)];tcx=(band[:,0].max()+band[:,0].min())/2;tcy=(band[:,1].max()+band[:,1].min())/2   # 幹のまん中
        s.T=lambda p,k=k,tcx=tcx,tcy=tcy,z0=P[:,2].min():np.stack([(p[...,0]-tcx)*k+TX,(p[...,1]-tcy)*k+TY,(p[...,2]-z0)*k],-1)
    def leafbox(s):
        if not hasattr(s,'_lb'):s._lb=[(s.T(p).reshape(-1,3).min(0),s.T(p).reshape(-1,3).max(0)) for p,c,k in s.items if k=='leaf' and c['n']>60]
        return s._lb
    def leaflh(s):
        """葉ぜんぶのテクスチャの明るさのはば（くらい所・明るい所）"""
        if not hasattr(s,'_lh'):
            U=np.concatenate([c['uv'].mean(1) for p,c,k in s.items if k=='leaf']);H,W=TEXL.shape
            L=TEXL[np.clip(((1-U[:,1])*H).astype(int),0,H-1),np.clip((U[:,0]*W).astype(int),0,W-1)];s._lh=(np.quantile(L,0.05),np.quantile(L,0.95))
        return s._lh
    def PARTS(s):return []
    def EXTRA(s,sc):
        sc.smooth(True);s._gid=[];s._ros=[]
        for kind in('bark','stem','leaf','glow','sprout'):
            its=[(p,c) for p,c,k in s.items if k==kind]
            if not its:continue
            allc=np.concatenate([c['col'] for p,c in its]);mean=allc.mean(1).mean()
            if kind=='sprout':
                for p,c in its:sprout(sc,s.T(p)[0,0],s.name)
                continue
            for p,c in its:
                q=s.T(p);n=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]);nz=n[:,2]/np.maximum(np.linalg.norm(n,axis=1),1e-12)
                if kind=='glow':   # 光のつぶ：小さくして、かげなしで光らせる
                    m=q.reshape(-1,3).mean(0);q=(q-m)*MOTEK+m;sc.part();sc.material('flat');sc.outline(0)
                    for t in q:sc.tri(t[0],t[1],t[2],GLOW)
                    sc.material(None);sc.outline();continue
                if kind=='bark':
                    top=q[...,2].max();cut=(nz>0.75)&(q[:,:,2].mean(1)>top*0.7)&(c is s.items[0][1])   # 切り口（上を向いた、高い所の面）
                    LB=[(lo+(hi-lo)*0.05,hi-(hi-lo)*0.05) for lo,hi in s.leafbox()]   # 葉のかたまりの中（ふちから少し内がわ）
                    keep=np.array([not ct and not any((t.mean(0)>lo).all() and (t.mean(0)<hi).all() for lo,hi in LB) for t,ct in zip(q,cut)])   # 葉のかたまりをつきぬけた枝のさきは描かない（モデルでは葉の中から茶色の点が出ていた）
                    zl,zh=q[...,2].min(),q[...,2].max();H=zh-zl
                    if c is s.items[0][1] and s.name!='tree':src=lambda K:K[:,2]>zh-0.08*H   # 切り株：切り口のふちから、幹を下へ・根の先へ
                    elif s.name=='tree':src=lambda K:np.abs(K[:,2]-(zl+0.30*H))<0.02*H   # 御神木：幹のなかほどから、上は枝へ・下は根へ
                    else:src=lambda K:K[:,2]<zl+0.04*H   # 若木：根もとから、枝の先へ
                    sc.decal(texpat([(q[keep],c['uv'][keep])],BARK));sc.part()   # 木の皮：モデルのテクスチャのすじ（幹・根・枝の流れにそっている）
                    for t in q[keep]:sc.tri(t[0],t[1],t[2],BARK[1])
                    sc.decal(None)
                    if cut.any():   # 切り口：ふちから同じあつさの樹皮、その内がわに、ふちの形にそった年輪
                        cq=q[cut].reshape(-1,3);cx,cy=cq[:,0].mean(),cq[:,1].mean();A_=np.arctan2(cq[:,1]-cy,cq[:,0]-cx);R_=np.hypot(cq[:,0]-cx,cq[:,1]-cy)
                        NB=48;bi=((A_+math.pi)/(2*math.pi)*NB).astype(int)%NB;RB=np.array([R_[bi==i].max() if (bi==i).any() else np.nan for i in range(NB)])
                        ok_=~np.isnan(RB);RB=np.interp(np.arange(NB),np.flatnonzero(ok_),RB[ok_],period=NB);RB=(RB+np.roll(RB,1)+np.roll(RB,-1)+np.roll(RB,2)+np.roll(RB,-2))/5   # 向きごとの、ふちまでの長さ（なめらかに）
                        def ring(x,y,z,cx=cx,cy=cy,RB=RB):
                            a=math.atan2(y-cy,x-cx);f_=(a+math.pi)/(2*math.pi)*NB-0.5;i0=int(math.floor(f_))%NB;tt=f_-math.floor(f_);Rb=RB[i0]*(1-tt)+RB[(i0+1)%NB]*tt
                            r=math.hypot(x-cx,y-cy);d=Rb-r
                            if d<BARKT:return BARK[2] if (a*16/(2*math.pi))%1<0.14 else BARK[1]   # あつい樹皮（ふちから同じあつさ。ところどころ、ひび）
                            if d<BARKT+0.02:return BARK[2]   # 樹皮と木のさかい
                            if d<BARKT+0.05:return CUT[0]
                            u=1-r/max(Rb-BARKT,1e-6)   # ふちから、まん中へ（0〜1）
                            return CUT[2] if any(abs(u-q_)<0.045 for q_ in(0.32,0.55,0.78)) else CUT[1]
                        sc.decal(ring);sc.part()
                        for t in q[cut]:sc.tri(t[0],t[1],t[2],CUT[1])
                        sc.decal(None)
                    continue
                if False:   # （前のやり方：葉の玉。使わない）
                    if not hasattr(s,'_lc'):s._lc=np.array([s.T(p_).reshape(-1,3).mean(0) for p_,c_,k_ in s.items if k_=='leaf'])
                    m0=q.reshape(-1,3).mean(0);dd=np.sort(np.linalg.norm(s._lc-m0,axis=1))
                    if len(dd)>1 and dd[1]>0.9 or (q.reshape(-1,3).max(0)-q.reshape(-1,3).min(0)).max()<0.12:continue   # はなれて1つだけうかぶ葉（モデルのこぼれ）は描かない：お手本の絵と同じ、小さなまるい葉の玉がかさなる形に作りなおす（lobes）
                    lobes(sc,q,n,len(s._gid));s._gid.append(1);continue
                if kind=='leaf' and s.name=='tree':   # 御神木：葉のかたまりの表面に、小さな葉の部品をならべる（leafparts）
                    if not hasattr(s,'_lc'):s._lc=np.array([s.T(p_).reshape(-1,3).mean(0) for p_,c_,k_ in s.items if k_=='leaf'])
                    m0=q.reshape(-1,3).mean(0);dd=np.sort(np.linalg.norm(s._lc-m0,axis=1))
                    if len(dd)>1 and dd[1]>0.9:continue   # はなれて1つだけうかぶ葉（モデルのこぼれ）
                    P_=q.reshape(-1,3);s._ros.append((P_.mean(0),float((P_.max(0)-P_.min(0)).max())));continue   # 葉のかたまりの場所と大きさ（あとで crown がロゼットにする）
                sc.decal(leafnat(q,c['uv'],s.leaflh()));sc.part()   # 若木の葉：モデルのテクスチャの明るさと、まん中が低い影
                for t in q:sc.tri(t[0],t[1],t[2],LEAF[1])
                sc.decal(None)
        if s.name=='tree' and s._ros:crown(sc,s._ros,s.T(max((it for it in s.items if it[2]=='bark'),key=lambda it:it[1]['n'])[0]).reshape(-1,3))
        sc.smooth(False)

def shot(M):
    """furn3d と同じ見え方で写し、ゲームの置き方（ax・ay、g64のドット）をきめる：幹の根もと (TX, y, 0) の写る所が、ゲームの (TX, y) に来るように"""
    O.GRAD=True;inf={};im,ex0,base,yb=F3.shot(M,0,info=inf)
    PROJ,E,S_,fw=inf['PROJ'],inf['ext'],inf['S'],inf['fwd']
    gy=TY;u,v=PROJ(fw((TX,gy,0)));px,py=(u-E[0])*S_,(v-E[2])*S_   # 根もとの近くの地面の点
    bb=im.getbbox();im=im.crop(bb)
    ax=round(TX*64-px)+bb[0];ay=round(gy*64-py)+bb[1]
    return im,ax,ay

def main(out,chips=False):
    os.makedirs(out,exist_ok=True);V,comps=load()
    sys.path.insert(0,os.path.join(ROOT,'tools'));import chips as CHP
    head,CC=CHP.load_imgs();CH={}
    for name in('stump','bud','leaf','sapling','tree'):
        M=Stage(V,comps,name);im,ax,ay=shot(M);CH[M.ID]=(im,ax,ay)
        im.save(os.path.join(out,name+'.png'));im.resize((im.width*6,im.height*6),Image.NEAREST).save(os.path.join(out,name+'_x6.png'))
        print(M.ID,'%dx%d ax %d ay %d'%(im.width,im.height,ax,ay),'色',len(set(map(tuple,np.array(im).reshape(-1,4)[np.array(im).reshape(-1,4)[:,3]>0][:,:3].tolist()))))
    # いまの絵（上）と新しい絵（下）を、4×4マスの同じ所にならべる（3倍）
    cell=(-64*1,-64*5,64*5,64*4+16);cw,chh=cell[2]-cell[0],cell[3]-cell[1]
    can=Image.new('RGBA',(cw*5+16*6,chh*2+48),(150,190,120,255))
    for i,k in enumerate(CH):
        for r,(im,ax,ay) in enumerate([(CC[k]['f'][0].convert('RGBA'),CC[k]['ax'],CC[k]['ay']),CH[k]]):
            ox=16+i*(cw+16);oy=16+r*(chh+16)
            fr=Image.new('RGBA',(cw,chh),(0,0,0,0));
            from PIL import ImageDraw
            d=ImageDraw.Draw(fr);d.rectangle([-cell[0],-cell[1],-cell[0]+256,-cell[1]+256],outline=(214,170,70,255))
            fr.alpha_composite(im,(ax-cell[0],ay-cell[1])) if ax-cell[0]>=0 and ay-cell[1]>=0 else fr.paste(im,(ax-cell[0],ay-cell[1]),im)
            can.alpha_composite(fr,(ox,oy))
    can.resize((can.width*2,can.height*2),Image.NEAREST).save(os.path.join(out,'cmp_x2.png'))
    if chips:
        for k,(im,ax,ay) in CH.items():CC[k]={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':[im]}
        CHP.pack_imgs(head,CC)
        with open(os.path.join(ROOT,'.chips_changed'),'a') as f:f.write('\n'.join(CH)+'\n')
        print('チップに入れた')
if __name__=='__main__':main(sys.argv[1],'--chips' in sys.argv)
