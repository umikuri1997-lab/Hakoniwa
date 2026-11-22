# 自然物（木・枯れ木・茂み・岩・きのこ）のチップを、トリポのモデル（tools/art/models/tripo/nat_*.glb、tools/art/nature3d/nature_prep.py）から写すための、共通の部品。
# モデルには、目じるしの色（幹・葉・かさ・じく…）がついている。同じモデルを、目じるしごとにべつの部品にして（fsel）、色をつける（recol）。
# 幹は皮のテクスチャ（barktex）、岩は石のテクスチャ（stone）。
import colorsys,numpy as np
from blueprint import Part as P
from common import notex
def kind(c):
    h,s,v=colorsys.rgb_to_hsv(*(np.asarray(c,float)/255));h*=360
    if s<0.1:return 'dot'
    if s<0.3:return 'under' if h<45 else 'stem'
    if h<15 or h>340:return 'cap'
    if h<50:return 'bark'
    return 'leaf'
def widen(cx,cy,k):
    """高さはそのまま、よこ・おくゆきを k 倍（太くする）"""
    def f(V):V[:,0]=cx+(V[:,0]-cx)*k;V[:,1]=cy+(V[:,1]-cy)*k;return V
    return f
def nat(nm,f,size,col,mk,cx=0.5,cy=0.5,rot=0,k=0.0,tex=None,wide=1.0):
    """mk：使う目じるし（'bark'・'leaf'・'cap'・'under'・'stem'・'dot'。岩は 'dot'）。tex：'bark' か 'stone'"""
    d=('tripo/'+f,cx,cy,0,size,rot,0);p=P(nm,'model',d,col,on=('ground',),note='地面に置く');p.recol=col;p.recolk=k
    if wide!=1.0:p.warp=widen(cx,cy,wide)
    if mk:p.fsel=lambda V,F,C,mk=mk:np.array([kind(c)==mk for c in C],bool)
    if tex=='bark':p.barktex=True
    elif tex=='stone':p.stone=True
    else:notex(p)
    return p
def deep(c):
    """写した色が c になる、モデルの色（モデルの色は白に MODEL_SOFT まぜて写すので、こくしておく）"""
    from blueprint import MODEL_SOFT as k
    return tuple(max(0,min(255,round((v-255*k)/(1-k)))) for v in c)
def dots(p,n=6,r=0.05,col=(250,246,236),seed=1):
    """かさの上の面に、白い点（まるい点を、なるべくはなして n こ）。点の場所は、モデルの上を向いた面からえらぶ"""
    from blueprint import model_tris
    V,F,C=model_tris(*p.dims);sel=np.array([kind(c)=='cap' for c in C]);t=V[F[sel]];ctr=t.mean(1)
    cand=ctr[(ctr[:,2]>np.percentile(ctr[:,2],30))&(ctr[:,1]>np.percentile(ctr[:,1],40))]   # かさの上のほう（面の表うらはモデルでそろっていないので、高さでえらぶ）
    rng=np.random.default_rng(seed);pts=[cand[rng.integers(len(cand))]]
    for _ in range(n-1):
        d=np.min([np.linalg.norm(cand-q,axis=1) for q in pts],0);pts.append(cand[d.argmax()])
    P_=np.array(pts);p.decal=lambda x,y,z:col if (np.linalg.norm(P_-[x,y,z],axis=1)<r).any() else None
    return p
def _h(i,j,s=0):
    v=np.sin(i*127.1+j*311.7+s*74.7)*43758.5453;return v-np.floor(v)
def leaves(p,dark,light,cell=0.12,seed=0,needle=False):
    """葉のもよう（decal）：小さな葉のかたまりを、ずらしてならべる。葉の下のふちに、こい色のふち（葉と葉のかさなり）、左上に明るい所。
    needle：とんがりの木。葉先が下にとがった、ぎざぎざの段にする"""
    def f(x,y,z):   # もようは、画面の上での場所（見おろし25度）できめる。面のかたむきで、もようがのびない
        u=x/cell;v=(z*0.906-y*0.423)/(cell*0.8);j=np.floor(v);u2=u+0.5*(j%2);i=np.floor(u2)
        cx=i+0.5+(_h(i,j,seed)-0.5)*0.3;cy=j+0.5+(_h(j,i,seed)-0.5)*0.3;dx=u2-cx;dy=v-cy
        if needle:
            if dy<-0.05 and abs(dx)<0.42*(1+dy*0.9) and dy>-0.75:return dark if dy<-0.4 else None
            return light if (dy>0.25 and dx<-0.1) else None
        r=np.hypot(dx/0.62,dy/0.55)
        if dy<-0.1 and 0.86<r<1.08:return dark
        if np.hypot(dx+0.18,dy-0.2)<0.16:return light
        return None
    p.decal=f;return p
def flat(p):p.soft1=True;return p   # かげは2だん（立体に見えすぎないように）
def leafballs(sc,glb,size,tones,inner,gap=0.06,L=0.10,W=0.065,cx=0.5,cy=0.5,wide=1.0):
    """葉のかたまり（モデルの葉の玉）を、御神木と同じやり方で、小さな葉の部品でおおう（sacred_tripo.leafparts）。
    tones：葉の色5つ（明るい→暗い）、inner：かたまりの中の色"""
    import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','sacred-tree'))
    import sacred_tripo as ST
    from blueprint import model_tris
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    ST.LEAFTONES=[tuple(t) for t in tones];ST.LEAFIN=tuple(inner);ST.LEAFGAP=gap;ST.LEAFL,ST.LEAFW=L,W
    V,F,C=model_tris('tripo/'+glb,cx,cy,0,size,0,0);V=widen(cx,cy,wide)(V.copy());sel=np.array([kind(c)=='leaf' for c in C]);F=F[sel]
    # 点をわけて持っているので、場所でつなぐ
    key=np.round(V,5);_,inv=np.unique(key,axis=0,return_inverse=True);inv=inv.ravel();Fi=inv[F]
    e=np.r_[Fi[:,[0,1]],Fi[:,[1,2]]];n=inv.max()+1;g=coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(n,n))
    lab=connected_components(g,directed=False)[1][Fi[:,0]]
    for gi,c in enumerate(np.unique(lab)):
        q=V[F[lab==c]].copy();c0=q.reshape(-1,3).mean(0);n=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0])
        bad=((q.mean(1)-c0)*n).sum(1)<0;q[bad]=q[bad][:,[0,2,1]]   # 面の表を外へ（モデルの面の向きはそろっていない）
        ST.leafparts(sc,q,gi)
def post_specks(im):
    import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','sacred-tree'))
    import sacred_tripo as ST;return ST.specks(im)
def facets(sc,glb,cx,cy,size,rot,pal,zs=1.0,gi='rock'):
    """角ばった石：モデルの面ごとに、光の向きで pal（明るい→暗い）の色をきめる（面がそのまま見える。お手本の岩の絵）"""
    import oblique3d as O
    from blueprint import model_tris
    V,F,C=model_tris('tripo/'+glb,cx,cy,0,size,rot,0,zs);t=V[F];c0=V.mean(0)
    n=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]);n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-12
    n*=np.sign(((t.mean(1)-c0)*n).sum(1))[:,None]   # 外向き
    d=n@O.LIGHT;cut=np.quantile(d,np.linspace(1,0,len(pal)+1)[1:-1])   # 面の数で同じくらいずつ、5だんに
    sc.texture(None);sc.material('flat');sc.smooth(False);sc.group(gi);sc.part()
    for tt,dd in zip(t,d):
        k=int((dd<cut).sum());sc.tri(tt[0],tt[1],tt[2],pal[k])
    sc.group(None);sc.material(None)
def barkdecal(p,pal,step=0.045,seg=0.16):
    """木の皮の柄（御神木と同じ考え方）：幹・枝ののびる向き（sacred_tripo.barkaxis）にそった、とぎれとぎれのこいみぞと、明るいすじ。pal：明るい・ふつう・みぞ"""
    import sys,os,math;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','sacred-tree'))
    import sacred_tripo as ST
    from blueprint import model_tris
    from scipy.spatial import cKDTree
    V,F,C=model_tris(*p.dims);F=F[p.fsel(V,F,C)] if getattr(p,'fsel',None) else F
    cen,ax,n=ST.barkaxis(V[F]);T_=cKDTree(cen)
    def f(x,y,z):
        i=T_.query((x,y,z))[1];a=ax[i];b=np.cross(a,n[i]);q=np.array((x,y,z))
        sv=float(q@b)/step;t=float(q@a);w_=sv+0.25*math.sin(t*20+sv*0.5);k=math.floor(w_);fs=w_-k
        h1,h2=ST._h(k,math.floor(t/seg+ST._h(k,3,5)[0]),13)
        if fs<0.3 and h1<0.8:return pal[2]
        if 0.5<fs<0.72 and h2<0.5:return pal[0]
        return pal[1]
    p.decal=f;notex(p);return p
def hullrock(sc,c,r,h,pal,seed=0,peak=(0,0),gi='r',ring=((0,1.0,9),(0.45,0.82,7),(0.8,0.45,5),(1.0,0.08,2)),crack=None):
    """角ばった岩を、点をつつむ形（凸包）で組む：c=(x,y) 置く所、r 半径（よこ・おく）、h 高さ、peak：てっぺんのずれ。面ごとに光の向きで pal の色（facets と同じ）"""
    import oblique3d as O
    from scipy.spatial import ConvexHull
    rs=np.random.RandomState(seed);P=[]
    for z,k,n in ring:
        for i in range(n):
            a=2*np.pi*(i+rs.uniform(-0.3,0.3))/n;rr=k*rs.uniform(0.85,1.08)
            P.append((c[0]+peak[0]*z+np.cos(a)*r[0]*rr,c[1]+peak[1]*z+np.sin(a)*r[1]*rr,h*min(1,z*rs.uniform(0.95,1.05))))
    P=np.array(P);H=ConvexHull(P);t=P[H.simplices];c0=P.mean(0)
    n=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]);n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-12;n*=np.sign(((t.mean(1)-c0)*n).sum(1))[:,None]
    keep=n[:,2]>-0.5;t,n=t[keep],n[keep];d=n@O.LIGHT;cut=np.quantile(d,np.linspace(1,0,len(pal)+1)[1:-1])
    if crack:   # ひび：手前の面に、上から下へ、まがった線と、えだわかれ（お手本の大岩）
        import math
        def cf(x,y,z):
            u=x-c[0];w=z/h
            if y<c[1]:return None
            m=0.04*math.sin(w*9)+(0.10*(0.55-w) if w<0.55 else 0)
            if 0.25<w<0.85 and abs(u-m)<0.012:return crack
            if 0.3<w<0.5 and abs((u-m)+(w-0.5)*0.9)<0.011 and u>m:return crack
            return None
        sc.decal(cf)
    sc.texture(None);sc.material('flat');sc.smooth(False);sc.group(gi);sc.part()
    for tt,dd in zip(t,d):sc.tri(tt[0],tt[1],tt[2],pal[int((dd<cut).sum())])
    sc.decal(None)
    sc.group(None);sc.material(None)
_BTX=[]
def barktexdecal(p,pal,span=(1.6,0.86)):
    """木の皮のテクスチャ（CC0、ambientCG Bark001 textures/bark001.png）を、幹・枝ののびる向き（sacred_tripo.barkaxis）にそってはり、
    明るさだけを3だん（pal：明るい・ふつう・みぞ）にする。span：テクスチャ1まいの、のびる向き・まわりの向きの長さ（マス）"""
    import sys,os,math;from PIL import Image,ImageFilter
    sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','sacred-tree'))
    import sacred_tripo as ST
    from blueprint import model_tris
    from scipy.spatial import cKDTree
    if not _BTX:
        im=Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','textures','bark001.png')).convert('L').resize((128,70),Image.BOX).filter(ImageFilter.GaussianBlur(0.8))
        L=np.asarray(im,float);_BTX.append((L,np.quantile(L,0.28),np.quantile(L,0.80)))
    L,lo,hi=_BTX[0];TH,TW=L.shape
    V,F,C=model_tris(*p.dims);F=F[p.fsel(V,F,C)] if getattr(p,'fsel',None) else F
    cen,ax,n=ST.barkaxis(V[F]);T_=cKDTree(cen)
    def f(x,y,z):
        i=T_.query((x,y,z))[1];a=ax[i];a=a if a[2]>=0 else -a;b=np.cross(a,n[i]);q=np.array((x,y,z))
        u=(float(q@a)/span[0])%1;v=(float(q@b)/span[1])%1;l=L[int(v*TH)%TH,int(u*TW)%TW]   # テクスチャのすじ（横）を、のびる向きに
        return pal[2] if l<lo else pal[0] if l>hi else pal[1]
    p.decal=f;notex(p);return p
def _comps(V,F):
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    key=np.round(V,5);_,inv=np.unique(key,axis=0,return_inverse=True);inv=inv.ravel();Fi=inv[F]
    e=np.r_[Fi[:,[0,1]],Fi[:,[1,2]]];n=inv.max()+1;g=coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(n,n))
    return connected_components(g,directed=False)[1][Fi[:,0]]
def vnoise2(x,y):
    ix,iy=np.floor(x),np.floor(y);fx,fy=x-ix,y-iy;sm=lambda t:t*t*(3-2*t);fx,fy=sm(fx),sm(fy)
    r=lambda a,b:_h(a,b,9)
    return r(ix,iy)*(1-fx)*(1-fy)+r(ix+1,iy)*fx*(1-fy)+r(ix,iy+1)*(1-fx)*fy+r(ix+1,iy+1)*fx*fy
def barktexdecal(p,pal,span=(1.5,0.75),axis=None):
    """木の皮：CC0 のテクスチャ（ambientCG Bark001、textures/bark001.png。すじは横むき）を、幹ののびる向きにすじが通るようにはる。
    axis='z'：まっすぐな幹（まわりの向きは幹のまん中からの角度）。None：枝ごとの向き（sacred_tripo.barkaxis）。
    明るさを4だん（pal：明るい・ふつう・少し暗い・みぞ。もようの色は、ふつうの色に近く、うすく）。テクスチャはぼかしてから使い、ドットのぶつぶつにしない"""
    import sys,os,math;from PIL import Image,ImageFilter
    sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','sacred-tree'))
    import sacred_tripo as ST
    from blueprint import model_tris
    from scipy.spatial import cKDTree
    if not _BTX:
        im=Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','textures','bark001.png')).convert('L').resize((32,48),Image.BOX).filter(ImageFilter.GaussianBlur(0.8))   # すじの向き（よこ）を強くちぢめて、長いみぞにする
        L=np.asarray(im,float);_BTX.append((L,np.quantile(L,[0.16,0.40,0.86])))
    L,qs=_BTX[0];TH,TW=L.shape
    V,F,C=model_tris(*p.dims);V=p.warp(V.copy()) if getattr(p,'warp',None) else V;F=F[p.fsel(V,F,C)] if getattr(p,'fsel',None) else F
    if axis=='z':
        q=V[F].reshape(-1,3);c=q[q[:,2]<np.quantile(q[:,2],0.3)][:,:2].mean(0);R=np.median(np.hypot(*(q[:,:2]-c).T))
        def uv(x,y,z):return z,math.atan2(y-c[1],x-c[0])*R
    elif axis=='screen':   # 枝わかれした幹：画面の上で、枝ののびる向き（15度ずつにそろえる）に、すじをまわす。画面の場所で決めるので、同じ枝の中ではすじがつながる
        cen,ax,n=ST.barkaxis(V[F]);T_=cKDTree(cen)
        ang=np.round(np.degrees(np.arctan2(np.abs(ax[:,2]),ax[:,0]*np.sign(ax[:,2]+1e-9)))/15)*15
        from scipy.ndimage import median_filter
        nb=T_.query(cen,k=min(25,len(cen)))[1];ang=np.array([np.median(ang[i]) for i in nb])   # まわりの面となめらかに
        def uv(x,y,z):
            t=math.radians(ang[T_.query((x,y,z))[1]]);return x*math.cos(t)+z*math.sin(t),-x*math.sin(t)+z*math.cos(t)
    else:
        cen,ax,n=ST.barkaxis(V[F]);T_=cKDTree(cen)
        def uv(x,y,z):
            i=T_.query((x,y,z))[1];a=ax[i];a=a if a[2]>=0 else -a;b=np.cross(a,n[i]);q=np.array((x,y,z));return float(q@a),float(q@b)
    def f(x,y,z):
        u,v=uv(x,y,z);l=L[int((v/span[1])%1*TH)%TH,int((u/span[0])%1*TW)%TW]
        return pal[3] if l<qs[0] else pal[2] if l<qs[1] else pal[0] if l>qs[2] else pal[1]
    p.decal=f;notex(p);return p
def mushdecal(p,style,pal,seed=0):
    """きのこのかさ・じく・かさのうらの柄（decal）。pal は style ごと：
    'cap'：かさ。pal=(明るい, ふつう, ふちの暗い所, もよう)。もよう：seed の style2 で 'warts'（ベニテングタケの白いいぼ）・'cracks'（シイタケのひび）・'marble'（ブナシメジのまだら）
    'stem'：じく。pal=(明るい, ふつう, すじ)。たてのせんい
    'under'：かさのうら。pal=(ふつう, ひだ)。まん中から外へのびるひだ"""
    import math
    from blueprint import model_tris
    V,F,C=model_tris(*p.dims);F=F[p.fsel(V,F,C)];lab=_comps(V,F);info=[]
    for c in np.unique(lab):
        q=V[F[lab==c]].reshape(-1,3);info.append((q[:,:2].mean(0),np.hypot(*(q[:,:2]-q[:,:2].mean(0)).T).max(),q[:,2].min(),q[:,2].max()))
    def near(x,y,z):return min(info,key=lambda t:math.hypot(x-t[0][0],y-t[0][1])/max(t[1],1e-6)+abs(z-(t[2]+t[3])/2)*0.5)
    kind_,mode=style if isinstance(style,tuple) else (style,None)
    def f(x,y,z):
        c,r,z0,z1=near(x,y,z);dx,dy=x-c[0],y-c[1];d=math.hypot(dx,dy)/max(r,1e-6);a=math.atan2(dy,dx);h=(z-z0)/max(z1-z0,1e-6)
        if kind_=='stem':
            s=vnoise2(a*5.0,z*14)
            return pal[2] if s<0.28 else pal[0] if (s>0.78 and dx<0) else pal[1]
        if kind_=='under':
            return pal[1] if (a*14/math.pi)%1<0.28 and d>0.25 else pal[0]
        # かさ：上ほど明るく、ふちは暗い
        base=pal[2] if (h<0.22 or d>0.92) else pal[0] if (h>0.72 and dx<0.2*r) else pal[1]
        if mode=='warts':
            for k in range(9):
                ka=2*math.pi*(k*0.381+_h(k,seed,1));kd=0.25+0.6*_h(k,seed,2);px,py=c[0]+math.cos(ka)*kd*r,c[1]+math.sin(ka)*kd*r
                if math.hypot(x-px,y-py)<r*(0.11+0.05*_h(k,seed,3)) and h>0.3:return pal[3]
        elif mode=='cracks':   # 白いひび：まん中から外への、とぎれた線と、輪の線
            if h>0.4 and 0.2<d<0.85 and ((a*5/math.pi+0.6*vnoise2(d*6,a*3))%1<0.2) :return pal[3]
            if h>0.6 and abs(d-0.45-0.08*vnoise2(a*4,1))<0.04 and vnoise2(a*6,2)>0.45:return pal[3]
        elif mode=='marble':   # まだら：うすい色のしみ
            if h>0.35 and vnoise2(x*22+seed,y*22+z*22)>0.62:return pal[3]
        return base
    p.decal=f;notex(p);return p
def post_clean(im,maxn=2):
    """葉の小さな点（specks）と、幹の小さな点（茶色の maxn ドットまでのかたまり）を、まわりの色に"""
    from scipy.ndimage import label,binary_dilation
    from PIL import Image
    im=post_specks(im);a=np.array(im);A_=a[...,3]>0;C_=a[...,:3].astype(int);key=C_[...,0]*65536+C_[...,1]*256+C_[...,2]
    brown=A_&(C_[...,0]>C_[...,1]+20)
    for k in np.unique(key[brown]):
        L_,n=label((key==k)&brown)
        if n==0:continue
        sz=np.bincount(L_.ravel())
        for j in np.flatnonzero(sz[1:]<=maxn)+1:
            m=L_==j;ring=binary_dilation(m)&~m&brown
            if not ring.any():continue
            vals,cnt=np.unique(key[ring],return_counts=True);v=vals[cnt.argmax()];C_[m]=[v>>16,(v>>8)&255,v&255];key[m]=v
    a[...,:3]=C_;return Image.fromarray(a)
def cedar(sc,cx,cy,H,R,n,pal,trunk,snow=None,seed=0):
    """とんがりの木（お手本の杉の絵の形）：下から上へ、だんだん小さくなる n だんの円すい。だんの下のふちは、下向きのとげ（ぎざぎざ）。
    pal：明るい→暗い（だんの上ほど明るく、下のふちは暗い）。trunk：幹の色（いちばん下のだんの下に見える）。snow：だんの上の左に、うすい灰色の雪（山の杉）"""
    import math
    rs=np.random.RandomState(seed);TH=H*0.14;top=H;base=TH   # 幹の見える高さ
    sc.texture(None);sc.material(None);sc.smooth(False);sc.group('trunk');sc.decal(None);sc.part()
    tr=R*0.13;m=12
    for i in range(m):
        a0,a1=2*math.pi*i/m,2*math.pi*(i+1)/m
        p=lambda a,z:(cx+math.cos(a)*tr,cy+math.sin(a)*tr,z);sc.quad(p(a0,0),p(a1,0),p(a1,base+0.2),p(a0,base+0.2),trunk)
    sc.group(None)
    hs=(top-base)/(n*0.72)
    for k in range(n):
        zb=base+k*(top-base-hs)/max(n-1,1)*0.98;zt=zb+hs*(1.0 if k<n-1 else 1.15);r=R*(1-0.72*k/max(n-1,1))
        def f(x,y,z,zb=zb,zt=zt,k=k):
            h=(z-zb)/(zt-zb)
            if snow and h>0.45 and x<cx-0.02 and _h(round(x*9),round(z*9),seed+k)<0.5:return snow
            return pal[3] if h<0.12 else pal[2] if h<0.35 else pal[1] if h<0.7 else pal[0]
        sc.decal(f);sc.group('t%d'%k);sc.part();seg=28
        for i in range(seg):   # 円すい：下のふちは、とげの先（下へ）と、そのあいだ（上へ）をかわりばんこに
            a0,a1=2*math.pi*i/seg,2*math.pi*(i+1)/seg;am=(a0+a1)/2
            d0=-0.08*hs if i%2==0 else 0.06*hs
            d1=-0.08*hs if (i+1)%2==0 else 0.06*hs
            q0=(cx+math.cos(a0)*r,cy+math.sin(a0)*r,zb+d0+rs.uniform(-0.02,0.02)*hs);q1=(cx+math.cos(a1)*r,cy+math.sin(a1)*r,zb+d1)
            sc.tri((cx,cy,zt),q0,q1,(255,255,255))
            sc.tri((cx,cy,zb+0.25*hs),q1,q0,(255,255,255))   # 下の面（下から見えないが、すきまをふさぐ）
        sc.group(None)
    sc.decal(None)
def rimshade(im,dark=(16,4),light=(9,-3),vmin=45):
    """コワイノの絵と同じかげの付け方：ふちの内がわ（輪郭のすぐ内の1ドット）を、右・下がわは暗く、左・上がわは明るく。
    dark・light：明るさ（100段階）を引く・足す数と、あざやかさを足す・引く数。vmin：これより暗い色は、この明るさまで上げる（黒っぽくしない）"""
    import colorsys
    from PIL import Image
    a=np.array(im).copy();A0=a[...,3]>0;A=A0&mask(a) if mask else A0;H,W=A.shape
    pad=np.pad(A,1);out=lambda dy,dx:~pad[1+dy:1+dy+H,1+dx:1+dx+W]
    edge=A&(out(0,1)|out(0,-1)|out(1,0)|out(-1,0))   # 輪郭のドット
    inner=A&~edge;pe=np.pad(edge,1);nb=lambda dy,dx:pe[1+dy:1+dy+H,1+dx:1+dx+W]
    dk=inner&(nb(0,1)|nb(1,0)|nb(1,1));lt=inner&(nb(0,-1)|nb(-1,0)|nb(-1,-1))&~dk
    def adj(c,dv,ds):
        h,s,v=colorsys.rgb_to_hsv(*(np.asarray(c,float)/255));v=min(1,max(0,v-dv/100));s=min(1,max(0,s+ds/100))
        return [round(x*255) for x in colorsys.hsv_to_rgb(h,s,v)]
    cache={}
    for m,(dv,ds) in ((dk,dark),(lt,(-light[0],light[1]))):
        for y,x in zip(*np.nonzero(m)):
            k=(tuple(a[y,x,:3]),dv,ds)
            if k not in cache:cache[k]=adj(a[y,x,:3],dv,ds)
            a[y,x,:3]=cache[k]
    for y,x in zip(*np.nonzero(A&(a[...,:3].max(-1)<vmin*2.55))):   # 輪郭・かげの黒っぽい色
        h,s,v=colorsys.rgb_to_hsv(*(a[y,x,:3]/255.0));a[y,x,:3]=[round(q*255) for q in colorsys.hsv_to_rgb(h,s,vmin/100)]
    return Image.fromarray(a)
SUNEL=30;SUNAZ=8   # 太陽：高さの角（度）・正面から左へのかたむき（度）。持ち主がきめた（左からを弱めて、正面よりに）
SUN=(-float(np.cos(np.radians(SUNEL))*np.sin(np.radians(SUNAZ))),float(np.cos(np.radians(SUNEL))*np.cos(np.radians(SUNAZ))),float(np.sin(np.radians(SUNEL))))   # 自然の物の光（太陽）：3Dの向き（x 右・y 手前・z 上）。木・茂み（tone5 の light=sunscreen(ELEV)）・岩・きのこ（LIGHT）・落ち影（castshadow.py）も、この光（持ち主がきめた：太陽は1つ）
def sunscreen(elev):
    """SUN を、見おろし elev 度のカメラの、画面の 右・下・手前 の成分にする（tone5 の light）。画面の下＝(0,sin e,−cos e)・手前＝(0,cos e,sin e)"""
    e=np.radians(elev);L=np.array(SUN);return (float(L[0]),float(L[1]*np.sin(e)-L[2]*np.cos(e)),float(L[1]*np.cos(e)+L[2]*np.sin(e)))
def tone5(im,base,hi=((10,-4),(19,-8)),sh=((15,4),(28,8)),ol=(38,10),cuts=(12,35,72,92),dw=0.12,rim=0.7,streak=(0.14,0.07),blur=1.4,vmin=45,light=(-0.6,-0.5,0.8),mask=None,thin=True,mix=0.0,under=None,pal=None,olc=None):
    """コワイノの絵のようなかげ（持ち主がきめた）：色は5つだけ（こいかげ・かげ・base・ハイライト・明るいハイライト）と輪郭。
    写したときの奥行き（oblique3d.LAST_ZB）から面の向きを出し、光（light：画面の左・下・手前の向き）とのなめらかな明るさを5だんにわける。だんのさかいめ（dw のはば）は、2色を市松もようのあみかけでまぜる。
    hi・sh：base から明るさ（100段階）を足す・引く数と、あざやかさを引く・足す数。ol：輪郭（base から）。cuts：だんのさかいめ（明るさの順の%）。
    rim：ふちの内がわは、右下を暗く・左上を明るく（だんの数）。streak：木の皮のすじをのこす量（暗いすじ・明るいすじ。いちばん強い所の割合）。vmin：輪郭の明るさの下限。
    mask：かえる所（絵の色 → True/False の関数。ほかの所はそのまま。木の幹と葉を、べつの色で2回かける）。thin：すじは細長い所だけ（False なら、まるい所も。葉の部品のさかいめ）。
    mix：写した絵の明るさ（ぼかしたもの）を、面の向きの明るさにまぜる割合（葉のつぶつぶの形をのこす）。under：(上にある物の色 → True/False, ドット数, だん数)：その物の下は、近いほど暗く（葉のかげ）。
    pal・olc：5色（暗い→明るい）と輪郭の色をじかにきめる（葉：かげは青みのある緑）"""
    import colorsys
    from PIL import Image
    from scipy.ndimage import gaussian_filter,label
    def hsv(dv,ds):
        h,s,v=colorsys.rgb_to_hsv(*(np.asarray(base,float)/255));v=min(1,max(vmin/100 if dv<-30 else 0,v+dv/100));s=min(1,max(0,s+ds/100))
        return np.array([round(x*255) for x in colorsys.hsv_to_rgb(h,s,v)],np.uint8)
    pal=[np.array(c,np.uint8) for c in pal] if pal else [hsv(-sh[1][0],sh[1][1]),hsv(-sh[0][0],sh[0][1]),hsv(0,0),hsv(hi[0][0],hi[0][1]),hsv(hi[1][0],hi[1][1])];OL=np.array(olc,np.uint8) if olc else hsv(-ol[0],ol[1])
    a=np.array(im).copy();A0=a[...,3]>0;A=A0&mask(a) if mask else A0;H,W=A.shape
    pad=np.pad(A,1);out=lambda dy,dx:~pad[1+dy:1+dy+H,1+dx:1+dx+W]
    pad0=np.pad(A0,1);out0=lambda dy,dx:~pad0[1+dy:1+dy+H,1+dx:1+dx+W]
    edge=A&(out0(0,1)|out0(0,-1)|out0(1,0)|out0(-1,0));inner=A&~edge   # 輪郭は、すきとおった所とのさかいだけ（幹と葉のさかいは輪郭にしない）
    if inner.sum()<8:return im   # かえる所がない（葉のない切り株など）
    L=a[...,:3].astype(float)@[0.299,0.587,0.114]
    m=inner.astype(float);Lb=gaussian_filter(L*m,blur)/np.maximum(gaussian_filter(m,blur),1e-6)   # 皮のすじを見つけるための、ぼかした明るさ
    import oblique3d as O
    z=O.LAST_ZB;mz=(z>-1e8)&A0;w=gaussian_filter(mz.astype(float),1.2);zs=gaussian_filter(np.where(mz,z,0),1.2)/np.maximum(w,1e-6)
    gy,gx=np.gradient(zs);gx=np.clip(gx*O.S,-3,3);gy=np.clip(gy*O.S,-3,3)   # 奥行きのかたむき（1ドットあたり）→ 面の向き
    n=np.dstack([-gx,-gy,np.ones_like(gx)]);n/=np.linalg.norm(n,axis=2,keepdims=True);lv_=np.asarray(light,float);sh_=n@(lv_/np.linalg.norm(lv_))
    if mix:   # 面の向きの明るさと、写した絵の明るさを、それぞれ順番（%）にしてまぜる
        rk=lambda v:np.interp(v,np.sort(v[inner]),np.linspace(0,1,int(inner.sum())))
        sh_=(1-mix)*rk(sh_)+mix*rk(Lb)
    q=np.percentile(sh_[inner],[0]+list(cuts)+[100]);t=np.interp(sh_,q,[0,0.5,1.5,2.5,3.5,4])
    if under:   # 上にある物（葉）のかげ：上 n ドットのうちに、その物があれば、近いほど暗く
        um=under[0](a)&A0;n_,k_=under[1],under[2]
        dist=np.full((H,W),n_+1)
        for dy in range(n_,0,-1):
            sm=np.zeros_like(um);sm[dy:]=um[:-dy];dist[sm]=dy
        hit=inner&(dist<=n_);t[hit]-=k_*(1-(dist[hit]-1)/n_)
    pe=np.pad(edge,1);nb=lambda dy,dx:pe[1+dy:1+dy+H,1+dx:1+dx+W]
    t[inner&(nb(0,1)|nb(1,0)|nb(1,1))]-=rim;t[inner&(nb(0,-1)|nb(-1,0)|nb(-1,-1))&~(nb(0,1)|nb(1,0)|nb(1,1))]+=rim*0.6
    d=L-Lb;lv=np.floor(t+0.5);fr=t+0.5-lv   # fr：0.5 がだんのまん中、0 と 1 がさかいめ
    yy,xx=np.mgrid[0:H,0:W];ck=(xx+yy)%2==0
    lo=fr<dw;up=fr>1-dw;lv[lo&ck]-=1;lv[up&~ck]+=1   # さかいめは市松もようで、となりのだんとまぜる
    for sgn,k_ in ((-1,streak[0]),(1,streak[1])):   # 木の皮のすじ：いちばん強い所だけ、1だん
        if k_<=0:continue
        thr=np.quantile(sgn*d[inner],1-k_);s_=inner&(sgn*d>=thr);lab,n=label(s_)
        from scipy.ndimage import find_objects
        for i_,sl in enumerate(find_objects(lab),1):   # 細長いすじだけ（長さ3ドットから、はばの2倍より長い）。まるい点はのこさない
            hh,ww=sl[0].stop-sl[0].start,sl[1].stop-sl[1].start
            if not thin or max(hh,ww)>=3 and max(hh,ww)>=2*min(hh,ww):lv[sl][lab[sl]==i_]+=sgn
    lv=np.clip(lv,0,4).astype(int)
    P=np.array(pal);a[inner,:3]=P[lv[inner]];a[edge,:3]=OL
    return Image.fromarray(a)
def modelfacets(sc,path,c,size,pal,zs=1.0,rot=0,gi='m',split=True,view=42,light=(-0.75,0.35,0.55),tilt=0):   # light：左から強く当てて、柱の左の面と右の面の明るさをはっきりわける（水晶らしく）
    """3Dモデル（glb）を、面ごとに光の向きで pal の色（hullrock と同じ。かげは5だん）にして組む。split：つながった形ごと（水晶なら1本ずつ）に、べつのグループにする（あいだに輪郭線が出る）。
    c=(x,y) 置く所（足もとのまん中）、size：モデルの高さ（マス、zs でのばす前）"""
    import os,trimesh,oblique3d as O
    M=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','models',path)
    s=trimesh.load(M,force='scene');ms=[]
    for node in s.graph.nodes_geometry:
        T,g=s.graph[node];m=s.geometry[g].copy();m.apply_transform(T);ms.append(m)
    m=trimesh.util.concatenate(ms);m=trimesh.Trimesh(m.vertices,m.faces,process=True)
    F=np.asarray(m.faces);E={}   # 辺→面（trimesh の split・facets は、このモデルでは、となりの面を見つけられなかったので、自分でつなぐ）
    for f,tr in enumerate(F):
        for e in((tr[0],tr[1]),(tr[1],tr[2]),(tr[2],tr[0])):E.setdefault(tuple(sorted(e)),[]).append(f)
    def groups(ok):
        par=list(range(len(F)))
        def fd(x):
            while par[x]!=x:par[x]=par[par[x]];x=par[x]
            return x
        for fs in E.values():
            for g in fs[1:]:
                if ok(fs[0],g):par[fd(g)]=fd(fs[0])
        G={}
        for f in range(len(F)):G.setdefault(fd(f),[]).append(f)
        return list(G.values())
    FN=np.asarray(m.face_normals)
    comps=groups(lambda a,b:True) if split else [list(range(len(F)))]
    flats=groups(lambda a,b:FN[a]@FN[b]>0.995)
    parts=[(np.asarray(m.vertices),F[c],c) for c in comps]
    V=np.asarray(m.vertices);k=size/(V[:,1].max()-V[:,1].min());a=np.radians(rot)
    cx,cz,y0=(V[:,0].max()+V[:,0].min())/2,(V[:,2].max()+V[:,2].min())/2,V[:,1].min()
    def tf(P):
        x,y,z=(P[:,0]-cx)*k,(P[:,2]-cz)*k,(P[:,1]-y0)*k*zs
        x,y=x*np.cos(a)-y*np.sin(a),x*np.sin(a)+y*np.cos(a);tl=np.radians(tilt);x,z=x*np.cos(tl)+z*np.sin(tl),-x*np.sin(tl)+z*np.cos(tl)   # tilt：左右へかたむける（度）
        return np.stack([c[0]+x,c[1]+y,z],1)
    cut=np.linspace(0.75,-0.35,len(pal)-1)   # 光の向きとの内積で、明るい順に pal の色（y と z を入れかえるので、面の向きをそろえるため、点の順を 0・2・1 に）
    VT=tf(np.asarray(m.vertices));NA=np.cross(VT[F[:,2]]-VT[F[:,0]],VT[F[:,1]]-VT[F[:,0]]);NA/=np.linalg.norm(NA,axis=1,keepdims=True)+1e-12
    for fc in flats:   # 平らな面（いくつかの三角形）は、向きを1つにそろえる（さかいに色のちがいを出さない）
        q=NA[fc].mean(0);NA[fc]=q/(np.linalg.norm(q)+1e-12)
    AR=np.linalg.norm(np.cross(VT[F[:,1]]-VT[F[:,0]],VT[F[:,2]]-VT[F[:,0]]),axis=1);LT=np.array(light,float)/np.linalg.norm(light);dd=NA@LT;o_=np.argsort(-dd);cw=np.cumsum(AR[o_])/AR.sum()
    cut=[dd[o_][np.searchsorted(cw,q)] for q in(0.14,0.38,0.64,0.86)]   # 面の広さでわけた5だん（明るい面14%・つぎ24%・まん中26%・かげ22%・こいかげ14%）
    for i,(_,FF,c) in enumerate(parts):
        t=VT[FF[:,[0,2,1]]];n=NA[c]
        cen=t.mean(1);ok=(n@np.array([0,np.cos(np.radians(view)),np.sin(np.radians(view))])>0.02)   # うら向きの面と、同じ所にかさなった面（ちらつく）はすてる
        _,u=np.unique(np.round(cen[ok],4),axis=0,return_index=True);t,n=t[ok][np.sort(u)],n[ok][np.sort(u)]
        d=n@LT;sc.texture(None);sc.material('flat');sc.smooth(False);sc.group('%s%d'%(gi,i));sc.part()
        for tt,dd in zip(t,d):sc.tri(tt[0],tt[1],tt[2],pal[int((dd<cut).sum())])
    sc.group(None);sc.material(None)
