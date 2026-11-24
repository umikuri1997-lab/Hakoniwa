# クォータービューの土のブロックのタイルセット：ブロックの1だんを3Dで組んで、角の形ごとの完成したチップに写す（壁の iso_conn.py と同じ写し方・切り方）。
# 使い方：python3 tools/art/iso/iso_block.py <出力フォルダ> [--sample] [--chips [--from]]（--from：写しなおさずに、出力フォルダの絵をチップに。--sample [--only 5,6]：見本のならび（1〜6。5・6は入隅）を写す。--chips：角の形ぜんぶを写して chips.js に入れる）
#
# 設計図（1マスの1だん。x=東・y=南・z=上。マスの左上が(0,0)、1だんの高さ1）
#   形は、まるい箱（rounded box）：外に出ている所（となりのマスのそのだんが空・上が空）だけ、箱を R ちぢめた芯から R はなれた面にする。
#   入隅（L字の内がわの角）は、ひくいマスがかさねるべつの絵（build_fillet。下の「入隅」）。
#     外に出ている辺は、まるくなる（手前のたての角・左右のはしのたての角・上の面のふち）。となりがつづく向きは、まるめずに平らなふたの面にする。
#     箱はマスの中だけ（1×1×1）。ゲームと同じに奥から（x+y・下のだんから）かさねると、手前のマスが、ふたの面をかくす。
#     となりとのさかいの断面は、どちらのマスも同じまるみ・同じでこぼこ（せかいの場所できめる）なので、線もすきまも出ない。
#   でこぼこ：横の面を、がけの絵（cliff:block・cliff:blockm）の暗い所ほど、面の向きに DEP へこませる（岩のみぞがへこみ、まるい角のふちがガタガタになる）。
#     上の面はへこませない（まるいふちの上のほうは、少しずつ）。
#   てっぺんのふち：がけの絵の上の帯の明るさ（toprof）に合わせて、地面の色とのさかいを上下させ（明るい岩は上へ・われめには地面がたれる）、
#     われめでは、手前（南・東）のまるいふちを下げて、かたちもかけさせる（まっすぐなふちにしない。うしろのふちは下げない）。
#   色：横の面は、がけの絵（いちばん上のだん cliff:block・その下 cliff:blockm。ゲームの icFace と同じ写し方：左の面は x、右の面は 1−y、たては 1−z）。
#     上の面と、まるいふちの上のほうは、地面の絵（草 tex:grass・かれた地面 tex:dry。画面の場所でくりかえす）。草は、ふちから少し長くたれる。
#     明るさ：上 1・左の面（南）.94・右の面（東）.74（ゲームの ICLF・ICRT）。まるい所は、面の向きでまぜて、段にする。
# チップのなまえ（g64。ax・ay は、そのだんの下の面のまん中の点）：iso:blk-<g|d|m>:<n><s><e><w>[-<南西><南東><北東>]（g 草の上のだん・d 草原のかれた地面・k ほかのステージの地面・v 火山の地面の上のだん・m 上にブロックがつづくだん。nsew は外に出ていれば1。
#   うしろの3つは、内がわの角になるななめのマスがうまっていれば1）。上の面の平らな所のかたちは <なまえ>~top（ゲームの地面をこのかたちで切って見せる）
import sys,os,math
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
for p in(ART,HERE,os.path.join(ROOT,'tools')):sys.path.insert(0,p)
import numpy as np
from PIL import Image
import oblique3d as O
import iso_conn as IC
R=0.2      # 角のまるみの半径（マス）。出隅も入隅（blkf）も同じ
DEP=0.045  # でこぼこのふかさ（マス）
JUP=0.035  # てっぺんのふち：岩の明るい所は、地面の色のさかいが上へ出る（だん）
JDN=0.11   # てっぺんのふち：岩のわれめ（暗い所）は、地面の色が下へたれる（だん）
JGR=0.04   # 草は、もう少したれる（だん）
DEPZ=0.10  # てっぺんのふち：岩のわれめで、まるいふちを下げて、かたちをかけさせる（だん）
NG=44      # 面ごとの、こまかさ
LEV=(1.0,0.97,0.94,0.86,0.80,0.74)   # 明るさの段
_C=None
def chipimgs():
    global _C
    if _C is None:
        import chips;_C=chips.load_imgs()[1]
    return _C
def arr(k):return np.asarray(chipimgs()[k]['f'][0].convert('RGB'),float)
def lum(a):g=a.mean(2);return (g-g.min())/max(1e-6,g.max()-g.min())
def soft(L):
    """でこぼこを、岩のかたまりの大きさのゆるい形に（こまかい点の段を出さない）"""
    for _ in range(3):L=(np.roll(L,1,0)+np.roll(L,-1,0)+np.roll(L,1,1)+np.roll(L,-1,1)+L)/5
    return (L-L.min())/max(1e-6,L.max()-L.min())
def shape(n,s,e,w,top):
    """芯（ちぢめた箱）と、まるみ。外に出ていない向きは、マスのふちまで（まるめない）"""
    x0=R if w else 0.0;x1=1-R if e else 1.0;y0=R if n else 0.0;y1=1-R if s else 1.0
    return (x0,x1,y0,y1,0.0,1-R if top else 1.0),(w,e,n,s,top)
def surf(core,ex):
    """まるい箱の面の点（下の面はなし）。もどり：[(点, 向き)]の格子のリスト"""
    x0,x1,y0,y1,z0,z1=core;w,e,n,s,top=ex
    ox0,ox1,oy0,oy1,oz1=x0-(R if w else 0),x1+(R if e else 0),y0-(R if n else 0),y1+(R if s else 0),z1+(R if top else 0)
    lo=np.array([x0,y0,z0]);hi=np.array([x1,y1,z1])
    t=np.linspace(0,1,NG+1);U,V=np.meshgrid(t,t)
    faces=[]
    for ax,sgn in((0,-1),(0,1),(1,-1),(1,1),(2,1)):
        q=np.zeros(U.shape+(3,))
        rng=[(ox0,ox1),(oy0,oy1),(z0,oz1)]
        o=[i for i in range(3) if i!=ax]
        q[...,ax]=rng[ax][1] if sgn>0 else rng[ax][0]
        q[...,o[0]]=rng[o[0]][0]+U*(rng[o[0]][1]-rng[o[0]][0]);q[...,o[1]]=rng[o[1]][0]+V*(rng[o[1]][1]-rng[o[1]][0])
        c=np.clip(q,lo,hi);d=q-c;ln=np.linalg.norm(d,axis=2,keepdims=True)
        nn=np.zeros_like(q);nn[...,ax]=sgn
        nrm=np.where(ln>1e-9,d/np.maximum(ln,1e-9),nn)
        p=c+nrm*np.where(ln>1e-9,R,0)
        p=np.where(ln>1e-9,p,q)
        faces.append((p,nrm,(ax,sgn)))
    return faces
def facetex(p,nrm,top_tex):
    """場所 p（マスの中。外もくりかえす）の、横の面の絵の (行, 列)"""
    x,y,z=p
    side=0 if nrm[1]>=nrm[0] else 1   # 0 左の面（南）・1 右の面（東）
    u=(x%1) if side==0 else (1-(y%1))%1
    return min(63,int((1-min(1,max(0,z)))*64)),min(63,int(u*64)),side
GT={'g':'tex:grass','d':'tex:dry','k':'ground#0','v':'groundr#0'}   # まるいふちの色をとる地面の絵（草・草原のかれた地面・ほかのステージの地面・火山の地面）
KEY=(255,0,255)   # 上の面の平らな所の印（ゲームの地面を見せる所。チップ ~top のかたち）
def rimk(nrm):
    """まるいふちの上のほう（地面の色）の明るさ。光は左上：奥（北・西）のふちは明るい。南（.94）と東（.8）のあいだは段でつなぐ"""
    a=max(0,nrm[1]);b=max(0,nrm[0]);c=max(0,-nrm[0])+max(0,-nrm[1])
    if c<0.1 and nrm[2]>0.8:return 1.0
    k=(a*0.94+b*0.8+c*1.14)/(a+b+c+1e-6)   # 向きでまぜる（入隅のまるいふちは、手前から奥へまわるので、きりかえると奥の明るさがかたまりで出た）
    return min((1.14,1.0,0.94,0.86,0.8),key=lambda v:abs(v-k))
def toprof(tex):
    """がけの絵の上の帯（0〜14行）の、列ごとの明るさ（0〜1。となりの列となめらかにつなぐ。1マスでくりかえす）。てっぺんのふちのでこぼこ"""
    L=tex[:15].mean(2).mean(0)
    for _ in range(3):L=(np.roll(L,1)+np.roll(L,-1)+L)/3
    return (L-L.min())/max(1e-6,L.max()-L.min())
def ucorner(x,y,u,core,e,s):
    """南東の出隅（手前の角）のまるい所は、南の面の列から東の面の列へ、まわりの長さにそってつなぐ（面の向きできりかえると、角で絵がとんだ）"""
    if not(e and s):return u
    x1,y1=core[1],core[3];cn=(x>x1+1e-9)&(y>y1+1e-9)
    al=np.arctan2(np.maximum(x-x1,0),np.maximum(y-y1,0));uc=(x1+2*R*al/(math.pi/2))%1
    return np.where(cn,uc,u)
def midtex():
    """下のだんの岩の絵（64×64）：がけの正面の24〜46行を、うら返し＋そのまま にならべる（上は46行め＝いちばん上のだんの下はしの行、まん中は24行め、下はまた46行め）。
    だんのさかいでも、上下に何だんつんでも、もようがとぎれない"""
    f=chipimgs()['cliff:face']['f'][0].convert('RGB').crop((0,24,64,47));f=np.asarray(f.resize((64,32),Image.BOX),float)
    return np.concatenate([f[::-1],f],0)
def build(n,s,e,w,top,var,dg=(0,0,0)):
    """var：'g' 草・'d' かれた地面・'m' 上につづく。dg：ななめのマス（南西・南東・北東）がうまっているか（内がわの角）。
    もどり：(横の面とまるいふちの絵, 上の面のかたち, ax, ay)"""
    core,ex=shape(n,s,e,w,top)
    tex=arr('cliff:block') if top else midtex();L=soft(lum(tex))   # でこぼこは、その面の岩の絵の明るさから（色とでこぼこがそろう）
    LT=toprof(arr('cliff:block'))   # てっぺんのふちのでこぼこ（岩の絵の上の帯の明るさ）
    led=arr('cliff:block')[2:5].reshape(-1,3).mean(0)   # 上にだんがある所の上の面（だんの角から少し見える）：岩のいちばん上の明るい帯の色
    sw,se,ne=dg
    def cfade(x,y,nrm):   # 内がわの角の手前で、へこみをなくす（へこんだ面の角から、うしろのマスの角がのぞいて、明るい線に見えた）
        f=np.ones_like(x);F=lambda d:np.clip(d/0.12,0,1)
        sf=nrm[...,1]>=nrm[...,0]   # 左の面（南）
        if not e and se:f=np.where(sf,f*F(1-x),f)
        if not w and sw:f=np.where(sf,f*F(x),f)
        if not s and se:f=np.where(~sf,f*F(1-y),f)
        if not n and ne:f=np.where(~sf,f*F(y),f)
        return f
    gt=arr(GT.get(var,'tex:dry'))
    if var!='g':   # かれた地面の小石（まわりと色のちがう点）は、まわりの色に（ふちのたれた所に、小石が点でならんだ）
        med=np.median(gt,axis=1,keepdims=True);dif=np.abs(gt.mean(2,keepdims=True)-med.mean(2,keepdims=True))
        gt=np.where(dif>12,np.broadcast_to(med,gt.shape),gt)
    sc=O.Scene();sc.material('flat')
    lo=np.array(core[0::2]);hi=np.array(core[1::2])
    def col(x,y,z):
        p=np.array([x,y,z]);c=np.clip(p,lo,hi);d=p-c;ln=np.linalg.norm(d)
        nrm=d/ln if ln>1e-6 else np.array([0,0,1.0])
        if ln<=1e-6 and z<core[5]-1e-3:   # へこませて芯の中に入った点（てっぺんのふちを下げた所）：いちばん近い外の面の向き（上向きにすると、明るい点が出た）
            cand=[(hi[0]-x,(1,0,0),e),(hi[1]-y,(0,1,0),s),(x-lo[0],(-1,0,0),w),(y-lo[1],(0,-1,0),n)]
            cand=[c_ for c_ in cand if c_[2]] or cand
            nrm=np.array(min(cand,key=lambda c_:c_[0])[1],float)
        if top and nrm[2]>0.985 and z>core[5]-1e-3:return np.array(KEY,float)   # 上の面の平らな所：ゲームの地面
        u=(x+y)%1;uf=float(ucorner(x,y,((x%1) if nrm[1]>=nrm[0] else (1-(y%1))%1),core,e,s));lt=LT[min(63,int(uf*64))]
        zb=core[5]+R*0.55+JUP*lt-JDN*(1-lt)-(JGR if var=='g' else 0.0)   # 地面の色と岩のさかい：岩の絵に合わせて、明るい岩は上へ出て、われめには地面がたれる
        if top and z>zb:   # まるいふちの上のほう：地面の色
            dep=min(R*0.65,max(0.0,core[5]+R-z));c0=gt[min(gt.shape[0]-1,int(dep/R*12)+40),int(u*gt.shape[1])%gt.shape[1]]   # たれた所も、まえと同じ行の色（下の行の小石が、ふちに点でならんだ）
            k=rimk(nrm)   # 光は左上：奥（北・西）のまるいふちは明るい
        elif not top and z>0.999:c0=led;k=0.94   # 上にだんがある所のふたの面
        else:
            r_,c_,side=facetex(p,nrm,None);c0=tex[r_,min(63,int(uf*64))]
            a=max(0,nrm[1]);b=max(0,nrm[0]);t=max(0,nrm[2]);sm=a+b+t+1e-6
            if top and a+b>0.15:t=0.0   # てっぺんの岩の頭は、横の面の明るさのまま（上向きの明るさをまぜると、でこぼこの頭ごとに明るい点が出た）
            sm=a+b+t+1e-6;k=(a*0.94+b*0.74+t*1.0)/sm
            if nrm[1]<0 and nrm[0]<0:k=0.9
            k=min(LEV,key=lambda v:abs(v-k))
        return np.clip(c0*k,0,254)
    sc.decal(col);sc.part()
    for p,nrm,(ax,sg) in surf(core,ex):
        # でこぼこ：外に出ている横むきの所だけ、がけの絵の暗い所をへこます（ふたの面・上の面のまん中はへこまさない）
        side=sum(np.maximum(0,nrm[...,i]*sg_) for i,sg_,on in((0,1,e),(0,-1,w),(1,1,s),(1,-1,n)) if on)
        P=p.copy();zz=np.clip(P[...,2],0,1);rr=np.minimum(63,((1-zz)*64).astype(int))
        uu=ucorner(P[...,0],P[...,1],np.where(nrm[...,1]>=nrm[...,0],P[...,0]%1,(1-(P[...,1]%1))%1),core,e,s);cc=np.minimum(63,(uu*64).astype(int))
        dd=DEP*(1-L[rr,cc])*np.clip(side*1.25-0.15,0,1)*cfade(P[...,0],P[...,1],nrm)
        if top:dd=dd*np.clip((core[5]+R*0.7-P[...,2])/(R*0.7),0,1)
        P=P-nrm*dd[...,None]
        if top:   # てっぺんのふち：岩のわれめで、まるいふちを下げる（かたちが岩の絵に合わせてかける。上の面のまん中・ふたの面は下げない）
            ci=np.minimum(63,(ucorner(p[...,0],p[...,1],np.where(np.abs(nrm[...,1])>=np.abs(nrm[...,0]),p[...,0]%1,(1-(p[...,1]%1))%1),core,e,s)*64).astype(int))   # 南の面は x、東の面は 1−y
            fr=sum(np.maximum(0,nrm[...,i]) for i,on in((0,e),(1,s)) if on)   # 手前（南・東）のふちだけ（うしろのふちは、明るい線がとぎれて、こわれて見えた）
            X_,Y_=p[...,0],p[...,1];F=lambda d:np.clip(d/0.12,0,1);sf=nrm[...,1]>=nrm[...,0];ef=np.ones_like(X_)   # となりにつづくはし・うしろのふちとあう角の手前では下げない（ふたの面・うしろのふちとのあいだに、すきまが出た）
            ef=np.where(sf,ef*F(X_),ef*F(Y_))   # 西・北のはしは、うしろのふち・つづきのふたの面とあう所なので、いつも
            if not e:ef=np.where(sf,ef*F(1-X_),ef)
            if not s:ef=np.where(~sf,ef*F(1-Y_),ef)
            wz=np.clip((p[...,2]-core[5])/R,0,1)*np.clip(fr*2,0,1)*cfade(X_,Y_,nrm)*ef
            P[...,2]=P[...,2]-DEPZ*(1-LT[ci])*wz
        for i in range(NG):
            for j in range(NG):
                a,b,c,d=P[i,j],P[i,j+1],P[i+1,j+1],P[i+1,j]
                sc.tri(a,b,c,(0.5,0.5,0.5));sc.tri(a,c,d,(0.5,0.5,0.5))
    sc.material(None)
    sc.t=[(IC.rot(a),IC.rot(b),IC.rot(c),cc,pid) for a,b,c,cc,pid in sc.t]
    sc.dc={pid:(lambda f:(lambda x,y,z:f(*IC.unrot(x,y),z)))(f) for pid,f in sc.dc.items()}
    O.S=IC.S
    im=O.render_px(sc,IC.PROJ,IC.EXTS,IC.DEPTH,outer=False,merge=0)   # まわりに輪郭線を引かない（だん・マスのつなぎ目に線が出る）
    a=np.array(im);m=(a[...,0]==255)&(a[...,1]==0)&(a[...,2]==255)&(a[...,3]>0)
    tp=np.zeros_like(a);tp[m]=(255,255,255,255);a[m]=0
    bb=Image.fromarray(np.maximum(a,tp)).getbbox()
    A=Image.fromarray(a).crop(bb);T=Image.fromarray(tp).crop(bb)
    return A,T,IC.PX0-bb[0],IC.PY0-bb[1]   # T は A と同じわく（ゲームに入れるときは、T だけの大きさに切る：to_chips）
# 入隅（L字の内がわの角）：まわりの3マスがそのだんまであって、このマスだけひくい角に、まるいかべ（半径 R）をうめる。
#   ひくいマス（E）が、自分の列のあとに、そのだんの高さへ1まいの絵（iso:blkf-<だん>:<角>-<A><B><C>）でかさねる（持ち主がえらんだ。まわりのマスのチップはかえない）。
#   角：E の nw・ne・sw・se。B は E のたて（北・南）のとなり（南・北の面）、C はよこ（西・東）のとなり（東・西の面）、A はななめ。<A><B><C> は、そのマスがこのだんでいちばん上か。
#   形：まるい入隅のかべ（C0 から R はなれた円柱の4分の1）。上のふちは、となりのふちと同じまるみ r（B・C がいちばん上なら R、上にだんがつづくなら0。あいだはなめらかにつなぐ）。
#     まるいふちは、A・B・C の角の上にもかかる（その所は、あとからかさねて上書きする）。上にだんがつづくマスの所へは出さない（上のだんの下にもぐる）。
#     平らな上の面のうち、まわりのマスの所は描かない（その下の、まわりのマスの上の面が見える）。E の中の平らな所は、ふたの色（上につづく）か地面の色。
FCOR={'nw':((0,0),(1,1)),'ne':((1,0),(-1,1)),'sw':((0,1),(1,-1)),'se':((1,1),(-1,-1))}   # 角：E の中の角の点 P と、E の中へ向かう向き
def build_fillet(cor,tA,tB,tC,var):
    (Px,Py),(ux,uy)=FCOR[cor];C0=np.array([Px+R*ux,Py+R*uy]);H=math.pi/2
    texB=arr('cliff:block') if tB else midtex();texC=arr('cliff:block') if tC else midtex()
    LB=soft(lum(texB));LC=soft(lum(texC));LT=toprof(arr('cliff:block'))
    led=arr('cliff:block')[2:5].reshape(-1,3).mean(0);gt=arr(GT.get(var,'tex:dry'))
    if var not in('g','m'):
        med=np.median(gt,axis=1,keepdims=True);dif=np.abs(gt.mean(2,keepdims=True)-med.mean(2,keepdims=True))
        gt=np.where(dif>12,np.broadcast_to(med,gt.shape),gt)
    sstep=lambda t:t*t*(3-2*t)
    def hdir(a):return np.stack([-ux*np.sin(a),-uy*np.cos(a)],-1)
    def rof(a):
        """上のふちのまるみ（a：B の面のがわ0 → C の面のがわ π/2）。上につづくマスの所へは出さない"""
        t=np.clip(a/H,0,1);r=R*(tB*(1-sstep(t))+tC*sstep(t))
        ca=np.maximum(np.cos(a),1e-6);sa=np.maximum(np.sin(a),1e-6)
        if not tB:r=np.where(a<H/2,np.minimum(r,R*(1/ca-1)),r)
        if not tC:r=np.where(a>H/2,np.minimum(r,R*(1/sa-1)),r)
        if not tA:   # A は上にだんがつづく：その上のだんの下にもぐらない
            r0=R*(np.maximum(1/ca,1/sa)-1)   # A のマスに入らない
            if tB and tC:   # 上のだんは、B・C がわが外に出た角なので、Q（P から A へ R）を中心にまるい：その外なら入ってよい
                Q=np.array([Px-R*ux,Py-R*uy]);hx,hy=-ux*np.sin(a),-uy*np.cos(a);ox,oy=C0[0]-Q[0],C0[1]-Q[1]
                b_=ox*hx+oy*hy;c_=ox*ox+oy*oy-R*R;dq=-b_-np.sqrt(np.maximum(b_*b_-c_,0))   # C0 から h の向きに、上のだんの角の円にとどく長さ
                r0=np.maximum(r0,dq-R)
            r=np.minimum(r,r0)
        return np.maximum(r,0)
    def uface(x,y,nx,ny):return np.where(ny>=nx,x%1,(1-(y%1))%1)
    hB,hC=hdir(np.array(0.0)),hdir(np.array(H))
    uB=float(uface(C0[0]+R*hB[0],C0[1]+R*hB[1],-hB[0],-hB[1]));uC=float(uface(C0[0]+R*hC[0],C0[1]+R*hC[1],-hC[0],-hC[1]))
    du=((uC-uB+0.5)%1)-0.5   # B の面の列から C の面の列へ、みじかいほうでつなぐ
    def uof(a):return (uB+du*np.clip(a/H,0,1))%1
    def mixc(a,row,col):   # 岩の色：B がわと C がわの絵を、角のまわりでまぜる
        t=sstep(np.clip(a/H,0,1));return texB[row,col]*(1-t)+texC[row,col]*t
    def ang(x,y):
        v=np.array([x,y])-C0;d=float(np.hypot(*v));h=v/max(d,1e-9)
        return float(np.clip(math.atan2(-h[0]*ux,-h[1]*uy),0,H)),d,h
    def inE(x,y):return 0<=x<=1 and 0<=y<=1
    def col(x,y,z):
        a,d,h=ang(x,y);r=float(rof(np.array(a)));zc=1-r
        if z>zc+1e-4 and r>1e-4:
            q=np.array([(d-(R+r))*h[0],(d-(R+r))*h[1],z-zc]);nrm=q/max(1e-9,np.linalg.norm(q))
        elif z>=1-1e-3 and d>R+r-1e-3:nrm=np.array([0,0,1.0])
        else:nrm=np.array([-h[0],-h[1],0.0])
        if nrm[2]>0.985 and z>1-1e-2:
            if not inE(x,y):
                inB=(y-Py)*uy<0;inC=(x-Px)*ux<0
                if inB and inC or not((inB and abs(y-Py)<R) or (inC and abs(x-Px)<R)):return np.array(KEY,float)   # まわりのマスの平らな上の面：描かない（そのマスの地面が見える）
                return np.clip(gt[40,int(((x+y)%1)*gt.shape[1])%gt.shape[1]],0,254)   # そのマスのまるいふちの上：平らにうめる（地面の色）
            return np.clip((gt[40,int(((x+y)%1)*gt.shape[1])%gt.shape[1]] if (tB or tC) else led)*(1.0 if (tB or tC) else 0.94),0,254)   # E の中の平らな所：B か C がいちばん上なら、その上の面とつづく地面。どちらも上につづくなら、ふたの色
        u=float(uof(np.array(a)));ci=min(63,int(u*64));lt=LT[ci]
        zb=zc+r*0.55+(JUP*lt-JDN*(1-lt)-(JGR if var=='g' else 0.0))*(r/R)
        if r>1e-4 and z>zb:
            dep=min(R*0.65,max(0.0,1-z));c0=gt[min(gt.shape[0]-1,int(dep/R*12)+40),int(((x+y)%1)*gt.shape[1])%gt.shape[1]]
            k=rimk(nrm)
        elif r<=1e-4 and z>0.999:c0=led;k=0.94
        else:
            c0=mixc(a,min(63,int((1-min(1,max(0,z)))*64)),ci)
            aa=max(0,nrm[1]);bb=max(0,nrm[0]);t=max(0,nrm[2])
            if aa+bb>0.15:t=0.0
            k=(aa*0.94+bb*0.74+t*1.0)/(aa+bb+t+1e-6)
            if nrm[1]<0 and nrm[0]<0:k=0.9
            k=min(LEV,key=lambda v:abs(v-k))
        return np.clip(c0*k,0,254)
    sc=O.Scene();sc.material('flat');sc.decal(col);sc.part()
    A=np.linspace(0,H,NG+1);T=np.linspace(0,1,NG+1);AA,TT=np.meshgrid(A,T)
    r=rof(AA);h=hdir(AA);zc=1-r
    def grid(d,z,nh,nz):   # 点と、外向き（E の空へ）の向き
        P=np.zeros(AA.shape+(3,));P[...,0]=C0[0]+d*h[...,0];P[...,1]=C0[1]+d*h[...,1];P[...,2]=z
        N=np.zeros_like(P);N[...,0]=-h[...,0]*nh;N[...,1]=-h[...,1]*nh;N[...,2]=nz;return P,N
    ph=TT*H
    pats=[grid(R+0*TT,TT*zc,1,0),                                   # たてのかべ
          grid(R+r-r*np.sin(ph),zc+r*np.cos(ph),np.sin(ph),np.cos(ph))]   # 上のふち（φ：0 てっぺん → π/2 かべ）
    dE=np.minimum(R/np.maximum(np.cos(AA),1e-6),R/np.maximum(np.sin(AA),1e-6))   # E の中の、ふたの面のおわり（マスのふち）
    pats.append(grid(R+r+TT*np.maximum(0,dE-(R+r)),1+0*TT,0,1))   # 平らな上の面（E の中だけ）
    for i,(P,N) in enumerate(pats):
        if i<2:   # でこぼこ：がけの絵の暗い所をへこます（となりの面と同じ式。B・C の面とのさかいでそろう）
            rr=np.minimum(63,((1-np.clip(P[...,2],0,1))*64).astype(int));cc=np.minimum(63,(uof(AA)*64).astype(int))
            t=sstep(np.clip(AA/H,0,1));Lm=LB[rr,cc]*(1-t)+LC[rr,cc]*t
            hz=np.sqrt(N[...,0]**2+N[...,1]**2);dd=DEP*(1-Lm)*np.clip(hz*1.25-0.15,0,1)
            rs=np.maximum(r,1e-6);dd=dd*np.where(r>1e-4,np.clip((zc+rs*0.7-P[...,2])/(rs*0.7),0,1),1)
            P=P-N*dd[...,None]
            if i==1:   # てっぺんのふち：手前を向いた所は、岩のわれめで下げる（となりのふちと同じ）
                fr=np.maximum(0,N[...,0])+np.maximum(0,N[...,1])
                wz=np.clip((P[...,2]-zc)/rs,0,1)*np.clip(fr*2,0,1)*(r/R)
                P[...,2]=P[...,2]-DEPZ*(1-LT[cc])*wz
        for a_ in range(NG):
            for b_ in range(NG):
                p1,p2,p3,p4=P[a_,b_],P[a_,b_+1],P[a_+1,b_+1],P[a_+1,b_]
                sc.tri(p1,p2,p3,(0.5,0.5,0.5));sc.tri(p1,p3,p4,(0.5,0.5,0.5))
    sc.material(None)
    sc.t=[(IC.rot(a),IC.rot(b),IC.rot(c),cc,pid) for a,b,c,cc,pid in sc.t]
    sc.dc={pid:(lambda f:(lambda x,y,z:f(*IC.unrot(x,y),z)))(f) for pid,f in sc.dc.items()}
    O.S=IC.S
    im=O.render_px(sc,IC.PROJ,IC.EXTS,IC.DEPTH,outer=False,merge=0)
    a=np.array(im);m=(a[...,0]==255)&(a[...,1]==0)&(a[...,2]==255);a[m]=0
    I=Image.fromarray(a);bb=I.getbbox()
    if bb is None:return None
    return I.crop(bb),IC.PX0-bb[0],IC.PY0-bb[1]
def fkey(cor,tA,tB,tC,var):
    """入隅のチップのなまえ（ゲームの icFilKey と同じ）。B・C どちらもいちばん上でなければ、まるみがないので 'm' の1つだけ"""
    if not(tB or tC):return 'iso:blkf-m:%s-000'%cor
    return 'iso:blkf-%s:%s-%d%d%d'%(var,cor,tA,tB,tC)
def fallkeys():
    K=[]
    for cor in FCOR:
        K.append((cor,0,0,0,'m'))
        for v in('g','d','k','v'):
            for tB,tC in((1,0),(0,1),(1,1)):
                for tA in(0,1):K.append((cor,tA,tB,tC,v))
    return K
def fillets_for(cells,var):
    """cells のまわりの、ひくいマスの入隅（マス・だん・角・A・B・C）"""
    hv=lambda x,y:cells.get((x,y),0);out=[]
    xs=[x for x,y in cells];ys=[y for x,y in cells]
    OFF={'nw':((0,-1),(-1,0),(-1,-1)),'ne':((0,-1),(1,0),(1,-1)),'sw':((0,1),(-1,0),(-1,1)),'se':((0,1),(1,0),(1,1))}
    for x in range(min(xs)-1,max(xs)+2):
        for y in range(min(ys)-1,max(ys)+2):
            h=hv(x,y)
            for cor,((bx,by),(cx,cy),(ax,ay)) in OFF.items():
                B,C,A=hv(x+bx,y+by),hv(x+cx,y+cy),hv(x+ax,y+ay)
                for L in range(h+1,min(A,B,C)+1):out.append((x,y,L,(cor,int(A==L),int(B==L),int(C==L),var)))
    return out
def dgof(ex,sw,se,ne):
    """ななめのマスのうち、形にかかわる物だけ（内がわの角になる所）。ほかは0にして、同じ形のチップをふやさない"""
    n,s,e,w=ex
    return (int(sw and (s and not w)),int(se and ((s and not e) or (e and not s))),int(ne and (e and not n)))
def key(ex,dg):return '%d%d%d%d'%tuple(ex)+('-'+'%d%d%d'%dg if any(dg) else '')
def tiles_for(cells,var):
    """cells：{(x,y):高さ}。マスごと・だんごとのチップ（同じ形は1回だけ写す）"""
    memo={};out=[]
    hv=lambda x,y:cells.get((x,y),0)
    for (x,y),h in cells.items():
        for L in range(1,h+1):
            ex=[hv(x,y-1)<L,hv(x,y+1)<L,hv(x+1,y)<L,hv(x-1,y)<L];top=L==h
            dg=dgof(ex,hv(x-1,y+1)>=L,hv(x+1,y+1)>=L,hv(x+1,y-1)>=L)
            v=var if top else 'm';k=(v,)+tuple(ex)+dg
            if k not in memo:memo[k]=build(*ex,top,v,dg)
            out.append((x,y,L,memo[k]))
    return out,memo
def compose(cells,var,pad=40):
    """ゲームと同じならべ方（x+y の順・下のだんから）で、地面の上にならべた見本"""
    T,_=tiles_for(cells,var)
    xs=[x for x,y in cells];ys=[y for x,y in cells];mh=max(cells.values())
    X0=min((x-y)*64 for x,y in cells)-128-pad;X1=max((x-y)*64 for x,y in cells)+128+pad
    Y0=min((x+y)*48 for x,y in cells)-48-mh*72-pad-60;Y1=max((x+y)*48 for x,y in cells)+96+pad
    bg=arr('tex:grass' if var=='g' else 'tex:dry').astype(np.uint8);B=Image.fromarray(bg)
    can=Image.new('RGBA',(X1-X0,Y1-Y0))
    for yy in range(0,can.height,bg.shape[0]//1):
        for xx in range(0,can.width,bg.shape[1]):can.paste(B.resize((bg.shape[1],bg.shape[0])),(xx,yy))
    gnd=can.copy()
    FM={};items=[((x+y,x,L),x,y,L,t) for x,y,L,t in T]
    for x,y,L,k in fillets_for(cells,var):   # 入隅：ひくいマスが、自分の列のあとにかさねる
        if k not in FM:FM[k]=build_fillet(*k)
        if FM[k]:items.append(((x+y,x,100+L),x,y,L,FM[k]))
    for _,x,y,L,t in sorted(items,key=lambda i:i[0]):
        im,ax,ay=(t[0],t[2],t[3]) if len(t)==4 else t
        cx=(x-y)*64-X0;cy=(x+y)*48+48-Y0-(L-1)*72;px,py=int(cx-ax),int(cy-ay)
        can.alpha_composite(im,(px,py))
        if len(t)==4:tp=t[1];g=gnd.crop((px,py,px+tp.width,py+tp.height));g.putalpha(tp.split()[0]);can.alpha_composite(g,(px,py))   # 上の面：ゲームの地面を、かたちで切って
    return can
def allkeys():
    """出る形ぜんぶ：(だん, 外に出ている向き nsew, ななめ) — ななめは dgof でそろえた物だけ"""
    K=set()
    for v in('g','d','k','v','m'):
        for b in range(16):
            ex=tuple(bool(b>>i&1) for i in range(4))
            for d in range(8):K.add((v,ex,dgof(ex,d&1,d>>1&1,d>>2&1)))
    return sorted(K)
def _onef(k):
    r=build_fillet(*k);return k,r
def _one(k):
    v,ex,dg=k;A,T,ax,ay=build(*ex,v!='m',v,dg);return k,A,T,ax,ay
def to_chips(out):
    from multiprocessing import Pool
    import chips
    import json
    ks=allkeys();print(len(ks),'の形');J=os.path.join(out,'blk.json')
    if '--from' in sys.argv:   # 写しなおさずに、出力フォルダの絵をチップに
        M=json.load(open(J));res=[(tuple(m['k'][:1])+(tuple(m['k'][1]),tuple(m['k'][2])),Image.open(os.path.join(out,m['f']+'.png')).copy(),Image.open(os.path.join(out,m['f']+'~top.png')).copy(),m['ax'],m['ay']) for m in M]
    else:
        with Pool(min(8,os.cpu_count() or 1)) as P:res=P.map(_one,ks)
        M=[]
        for (v,ex,dg),A,T,ax,ay in res:
            f='blk-%s-%s'%(v,key(ex,dg));A.save(os.path.join(out,f+'.png'));T.save(os.path.join(out,f+'~top.png'))
            M.append({'k':[v,[int(e) for e in ex],list(dg)],'f':f,'ax':ax,'ay':ay})
        json.dump(M,open(J,'w'))
    head,C=chips.load_imgs()
    for (v,ex,dg),A,T,ax,ay in res:
        nm='iso:blk-%s:%s'%(v,key(ex,dg))
        C[nm]={'ax':ax,'ay':ay,'w':A.width,'h':A.height,'g':64,'f':[A]}
        if v!='m':   # 上の面のかたち：上の面だけの大きさに切る（ゲームは、この大きさの作業用の絵で地面を切りぬく）
            b=T.getbbox();T2=T.crop(b);C[nm+'~top']={'ax':ax-b[0],'ay':ay-b[1],'w':T2.width,'h':T2.height,'g':64,'f':[T2]}
    FJ=os.path.join(out,'blkf.json')   # 入隅のまるいかべ
    if '--from' in sys.argv:
        FM=json.load(open(FJ));fres=[(tuple(m['k']),(Image.open(os.path.join(out,m['f']+'.png')).copy(),m['ax'],m['ay'])) for m in FM]
    else:
        with Pool(min(8,os.cpu_count() or 1)) as P:fres=P.map(_onef,fallkeys())
        FM=[]
        for k,r in fres:
            if not r:continue
            f=fkey(*k).replace('iso:','').replace(':','-');r[0].save(os.path.join(out,f+'.png'));FM.append({'k':list(k),'f':f,'ax':r[1],'ay':r[2]})
        json.dump(FM,open(FJ,'w'))
    for C_ in [k for k in C if k.startswith('iso:blkf-')]:del C[C_]
    for k,r in fres:
        if r:im,ax,ay=r;C[fkey(*k)]={'ax':ax,'ay':ay,'w':im.width,'h':im.height,'g':64,'f':[im]}
    chips.pack_imgs(head,C);print('chips',len(res),'入隅',len(fres))
if __name__=='__main__':
    out=sys.argv[1];os.makedirs(out,exist_ok=True)
    if '--sample' in sys.argv:
        S1={(0,0):1}
        S2={(x,y):1 for x in range(3) for y in range(2)}
        S3={(0,0):2,(1,0):1,(0,1):1,(0,2):1,(1,1):0}
        S3={k:v for k,v in S3.items() if v}
        S4={(1,1):3,(2,1):1,(1,2):1,(0,1):2,(1,0):2}
        S5={(x,y):1 for x in range(3) for y in range(3) if (x,y)!=(1,1)}   # 入隅が4つ（まん中だけひくい）
        S6={(x,y):(2 if x<2 and y<2 else 1) for x in range(4) for y in range(4) if not(x>=2 and y>=2)}   # 高さのちがう入隅
        for i,(c,v) in enumerate(((S1,'g'),(S2,'g'),(S3,'d'),(S4,'d'),(S5,'g'),(S6,'d'))):
            if '--only' in sys.argv and str(i+1) not in sys.argv[sys.argv.index('--only')+1].split(','):continue
            im=compose(c,v);im.save(os.path.join(out,'sample%d.png'%(i+1)))
            im.resize((im.width*2,im.height*2),Image.NEAREST).save(os.path.join(out,'sample%dx2.png'%(i+1)))
            print('sample',i+1,im.size)
    if '--chips' in sys.argv:to_chips(out)
