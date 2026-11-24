# 土のステージの地われ（riftM・riftJ）と、自然の岩の橋（TSBRY の2行）のタイルセット：3Dで組んで、マスごとの完成したチップに写す。
# 使い方：python3 tools/art/tsuchi/rift3d.py <出力フォルダ> [--sample] [--chips]
#   --sample：見本のならび（地われ・橋）を写す。--chips：タイルぜんぶを写して chips.js に入れる（g64。ax・ay はマスのまん中の地面の点）。
#
# 作り方は、ゲーム制作のふつうの作法（くぼみ・穴のオートタイル。土のブロックのタイルセット iso_block.py と同じ写し方・色）。
#   地われは、谷の地面（高さ0）を、たてに深くくりぬいたみぞ。クォータービューは南（左下）・東（右下）から見おろすので、
#   見える岩の壁は、北と西の陸の、みぞに向いた面だけ。南・東の陸の面はうらがわで見えない。
#   それで、地われのマスに見える物は、北・西・北西のマスと、ふち（陸のでこぼこ）にかかる東・南のマスだけできまる
#   （47まいのブロブのうち、見た目がかわる組み合わせだけを写す）。
#   ふかい所は、だんだんくらくなり、底は見えない（1.3だんより下は、まっくら。もっと遠いマスは見えない）。
# 設計図（マス。x=東・y=南・z=上。地われのマスの左上が(0,0)、地面の高さ0、1だん＝高さ1）
#   陸：高さ0より下は、ぜんぶ岩。みぞに向いた所は、陸のマスのふちから、でこぼこのぶん（LIP＋岩のみぞ DEP）みぞへ出る。
#     出かたは、せかいの場所できめる（1マスでくりかえす）ので、となりのマスと、つなぎ目がそろう。
#   橋：地われの上の2行の、うすい岩の板（上の面は高さ0）。板のあつさは、陸から遠いほどうすい（アーチ）。
#     いちばんうすい所 TMIN・陸のきわ TMAX。下は、地われのくらやみ。
#   色：岩の壁は、がけの絵（いちばん上のだん cliff:block・その下 cliff:face のくりかえし。iso_block と同じ）。
#     明るさ：上 1・南に向いた面 .94・東に向いた面 .74（ゲームの ICLF・ICRT）。ふかさで、くらい色 DARKC へ段でまぜる。
#     陸の上の面（高さ0）は、すける（ゲームの地面の絵が見える）。橋の上の面は、岩の面。
# チップのなまえ（g64。128×96 のひし形の中だけ。ax・ay はマスのまん中の地面の点）
#   iso:rift:<北><西><北西><東><南>[-<西の橋の数><東の橋の数>]   p 地われ・l 陸・b 橋（北が橋のときだけ、うしろに橋の場所）
#   iso:riftb:<西の橋の数><東の橋の数><北><南>   橋の上の面（橋の数は、その向きにつづく橋のマスの数。2より多いときは2）
import sys,os,math,json
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
for p in(ART,os.path.join(ART,'iso'),os.path.join(ROOT,'tools')):sys.path.insert(0,p)
import numpy as np
from PIL import Image
import iso_block as IB
TW,THT=128,96          # 1マスのひし形（g64）
PXA,PXB,PXL=64,48,72   # せかいの1マス・1だんが、絵の何ドットか（x−y・x+y・高さ）
LIP=0.035              # 陸のふちが、みぞへ出るぶん（いつも）
LIPV=0.05              # ふちのでこぼこ（1マスでくりかえす、ゆるい波）
DEP=0.05               # 岩のみぞのふかさ（がけの絵の暗い所ほどへこむ。iso_block の DEP）
TMIN,TMAX=0.40,0.95    # 橋の板のあつさ（だん）：まん中・陸のきわ
DSTEP=0.004            # 光の線をすすめる、こまかさ（だん）
DMAX=1.8               # ここまで見る（これより下は、まっくら）
FADE=((0.30,0.0),(0.55,0.28),(0.80,0.55),(1.05,0.78),(1.30,1.0))   # (ふかさ, くらさ)：このふかさより下は、このくらさ（段）
BRC=(196,168,138)   # 橋の上の面の岩の色（がけの絵 cliff:block の明るい所）
DARKC=np.array((46,34,28),float)   # 地われのいちばん下の色（いまの地われの底の色に近い、こげ茶）
LEV=IB.LEV
def pnoise(u,s=0.0):   # 1マスでくりかえす、なめらかなゆらぎ（0〜1）
    t=2*np.pi*u;return 0.5+0.25*np.sin(3*t+1.3+s)+0.15*np.sin(7*t+0.4+2*s)+0.1*np.sin(11*t+2.1+3*s)
_T=None
def degreen(a):
    """がけの絵のコケ（緑）を、同じ明るさの、すなの岩の色に（地われの中にコケはない）"""
    a=a.copy();g=(a[...,1]>a[...,0]-4)&(a[...,1]>a[...,2]+12);L=a.mean(2)
    rock=np.array((1.13,0.93,0.80));a[g]=np.clip(L[g][:,None]*rock,0,254);return a
def lipn(u):   # ふちの、ゆるい波（1マスでくりかえす）
    t=2*np.pi*u;return 0.5+0.3*np.sin(t+1.3)+0.2*np.sin(2*t+0.4)
def tex():
    """岩の壁の絵：いちばん上のだん（cliff:block）とその下（cliff:face の中ほどを上下つないだ midtex）、でこぼこの明るさ"""
    global _T
    if _T is None:
        a=degreen(IB.arr('cliff:block'));m=degreen(IB.midtex());_T=(a,m,IB.soft(IB.lum(a)),IB.soft(IB.lum(m)))
    return _T
def texat(u,d):
    """壁の (ゆらぎの向きの場所 u, ふかさ d) の色とでこぼこ（0 くぼみ〜1）"""
    a,m,La,Lm=tex()
    r=np.clip((d%1)*64,0,63).astype(int);c=np.clip((u%1)*64,0,63).astype(int)
    top=d<1
    col=np.where(top[...,None],a[r,c],m[r,c]);L=np.where(top,La[r,c],Lm[r,c])
    return col,L
class Cells:
    """まわりのマスの種類（地われのマスが (0,0)）。k：{(dx,dy):'p'|'l'|'b'}、ない所は地われ。br：橋のマスの (西の数, 東の数)"""
    def __init__(self,k,br=None):self.k=k;self.br=br or {}
    def kind(self,dx,dy):return self.k.get((dx,dy),'p')
BUMP=0.07   # 橋の上の面のでこぼこ（だん）
_VP=np.random.RandomState(7).rand(26,2)*(5.0,4.0)-(1.0,1.0)   # 橋の板の、ひびの点（橋ぜんたいの場所。西のはしのマスの左上が(0,0)・はば3・2行）
def hbump(x,y):
    """橋の上の面：ひびで分かれた、ひらたい岩の板（橋ぜんたいでの場所 x,y のボロノイ。くりかえさない）。0 みぞ〜1 板"""
    d=np.sqrt((x[...,None]-_VP[:,0])**2+(y[...,None]-_VP[:,1])**2);d.sort(-1)
    return np.clip((d[...,1]-d[...,0])/0.10,0,1)
def boxdist(px,py,cx,cy):
    """点から、マス (cx,cy)〜(cx+1,cy+1) までの、たいらな向きのきょり"""
    ddx=np.maximum(np.maximum(cx-px,px-(cx+1)),0);ddy=np.maximum(np.maximum(cy-py,py-(cy+1)),0)
    return np.hypot(ddx,ddy),ddx,ddy
def field(C,x,y,z):
    """中が正（岩）。もどり：(場, ゆらぎの向きの場所 u, 橋か)"""
    best=np.full(x.shape,-9.0);U=np.zeros(x.shape);isb=np.zeros(x.shape,bool)
    bs=[c for c,kd in C.k.items() if kd=='b'];inb=None
    if bs:
        fx,fy=np.floor(x),np.floor(y);inb=np.zeros(x.shape,bool)
        for cx,cy in bs:inb|=(fx==cx)&(fy==cy)
    for (cx,cy),kd in C.k.items():
        if kd=='p':continue
        dist,ddx,ddy=boxdist(x,y,cx,cy)
        u=np.where(ddy>=ddx,x,1-y)   # 南・北に向いた面は x・東・西に向いた面は y にそって
        d=-z
        _,L=texat(u,np.maximum(d,0))
        disp=LIP+LIPV*lipn(u)+DEP*(1-L)*np.clip(d/0.06,0,1)   # 上のふちは、みぞをへこませない
        f=disp-dist
        if kd=='l' and inb is not None:f=np.where(inb,-dist,f)
        if kd=='l':f=np.minimum(f,-z+1e-3)   # 高さ0の面も岩の中（上の面は、すける地面）
        else:   # 橋：うすい板（アーチ）
            iw,ie,ri=C.br.get((cx,cy),(0,0,0))
            lx=x-cx;gx=iw+lx;gy=ri+(y-cy)   # 橋ぜんたいでの場所
            dw=iw+lx;de=ie+1-lx;dd=np.clip(np.minimum(dw,de),0,None)
            T=TMIN+(TMAX-TMIN)*np.clip(1-dd/0.9,0,1)**1.6+0.06*pnoise(gx,1.0)   # 橋ぜんたいの場所で（マスでくりかえさない）
            f=np.minimum(f,np.minimum(-z+1e-3-BUMP*(1-hbump(gx,gy)),z+T))   # 上の面は、ゆるいでこぼこ
        m=f>best;best=np.where(m,f,best);U=np.where(m,u,U);isb=np.where(m,kd=='b',isb)
    return best,U,isb
def render(C,own=(0,0)):
    """マス own（ふつうは地われのマス (0,0)、橋の上の面はそのマス）のひし形の絵（RGBA）。陸の上の面は、すける"""
    ox,oy=own
    v,u=np.mgrid[0:THT,0:TW].astype(float)
    sx=(u+0.5-PXA)/PXA;sy=(v+0.5)/PXB   # x−y・x+y（地面の高さ0）
    x0=(sx+sy)/2+ox;y0=(sy-sx)/2+oy;z0=np.zeros_like(x0)
    inside=(x0>=ox)&(x0<ox+1)&(y0>=oy)&(y0<oy+1)
    out=np.zeros((THT,TW,4),np.uint8)
    xs,ys=x0[inside],y0[inside]
    n=xs.size;hit=np.full(n,-1.0);
    # 光の線（画面のドット1つ）：ふかさ d で、x・y は 0.75d ずつ北西へ
    dprev=np.zeros(n);fprev,_,_=field(C,xs,ys,np.zeros(n))
    done=fprev>0;hit[done]=0.0
    d=0.0
    while d<DMAX and not done.all():
        d+=DSTEP;idx=np.where(~done)[0]
        xx=xs[idx]-0.75*d;yy=ys[idx]-0.75*d;zz=np.full(idx.size,-d)
        f,_,_=field(C,xx,yy,zz);h=f>0
        hit[idx[h]]=d;done[idx[h]]=True
    # あたった所の色
    col=np.zeros((n,4))
    top=hit==0.0;none=hit<0
    dd=np.where(hit>0,hit,0.0);px=xs-0.75*dd;py=ys-0.75*dd;pz=-dd
    if (hit>0).any():   # すすめすぎたぶんを、2分でもどす
        lo=dd-DSTEP;hi=dd.copy();m=hit>0
        for _ in range(8):
            mid=(lo+hi)/2;f,_,_=field(C,xs-0.75*mid,ys-0.75*mid,-mid)
            hi=np.where(m&(f>0),mid,hi);lo=np.where(m&(f<=0),mid,lo)
        dd=np.where(m,hi,dd);px=xs-0.75*dd;py=ys-0.75*dd;pz=-dd
    f0,U,isb=field(C,px,py,pz)
    e=0.004
    gx=(field(C,px+e,py,pz)[0]-field(C,px-e,py,pz)[0])/(2*e)
    gy=(field(C,px,py+e,pz)[0]-field(C,px,py-e,pz)[0])/(2*e)
    gz=(field(C,px,py,pz+e)[0]-field(C,px,py,pz-e)[0])/(2*e)
    N=-np.stack([gx,gy,gz],1);N/=np.maximum(np.linalg.norm(N,axis=1,keepdims=True),1e-9)
    c0,_=texat(U,np.maximum(-pz,0))
    a_=np.maximum(0,N[:,1]);b_=np.maximum(0,N[:,0]);t_=np.maximum(0,N[:,2]);sm=a_+b_+t_+1e-6
    k=(a_*0.94+b_*0.74+t_*1.0)/sm;k=np.where((N[:,1]<0)&(N[:,0]<0),0.9,k)
    k=np.array([min(LEV,key=lambda q:abs(q-kk)) for kk in k])
    rgb=np.clip(c0*k[:,None],0,254)
    # 橋の上の面：岩の面（すなの岩の色を、でこぼこの向きの明るさの段で）
    tb=isb&(N[:,2]>0.6)
    if tb.any():
        kt=np.clip(N[tb,2]*0.55+0.45-0.25*N[tb,1]-0.25*N[tb,0],0,1.1)   # 光は左上：北西を向いた所は明るく
        kt=np.select([kt>0.97,kt>0.9],[1.0,0.92],0.84)   # 3だん
        rgb[tb]=np.clip(np.array(BRC)[None,:]*kt[:,None],0,254)
    sb=isb&~tb   # 橋の南の面
    if sb.any():rgb[sb]=np.clip(np.array(BRC)[None,:]*(k[sb]*0.9)[:,None],0,254)
    # ふかさで、くらく（段）
    fd=np.zeros(n)
    _,Lw=texat(U,np.maximum(-pz,0))
    for dz,kk in FADE:fd=np.where(-pz>=dz+0.12*(Lw-0.5),kk,fd)   # 段のさかいは、岩のもようにそって波うつ
    fd=np.where(none,1.0,fd);fd=np.where(isb,0.0,fd)   # 橋の板は、くらやみの上の明るい岩（下はまっくら）
    rgb=rgb*(1-fd[:,None])+DARKC*fd[:,None]
    col[:,:3]=rgb;col[:,3]=255
    col[top&~isb,3]=0   # 陸の上の面：ゲームの地面
    O=out.reshape(-1,4);ii=np.where(inside.reshape(-1))[0];O[ii]=np.round(col).astype(np.uint8)
    return Image.fromarray(out)
# ---- 形の一覧 ----
def span(k,b,row,iw,ie,ri):
    """橋の1行（マス 0 が、西に iw・東に ie の橋をもつ。ri：橋の何行め 0・1）。はしの外は陸"""
    for a in range(-iw,ie+1):k[(a,row)]='b';b[(a,row)]=(iw+a,ie-a,ri)
    k[(-iw-1,row)]='l';k[(ie+1,row)]='l'
def pit_cells(N,Wk,NW,E,S,br=(0,0)):
    k={(0,-1):N,(-1,0):Wk,(-1,-1):NW,(1,0):E,(0,1):S,(0,0):'p'}
    b={}
    if N=='b':
        iw,ie=br;span(k,b,-1,iw,ie,1);span(k,b,-2,iw,ie,0)   # 橋は2行
        k[(-1,0)]=Wk;k[(1,0)]=E
    return Cells(k,b)
def pit_key(N,Wk,NW,E,S,br=None):return N+Wk+NW+E+S+('-%d%d'%br if br else '')
def pit_keys():
    K=[]
    for N in 'pl':
        for Wk in 'pl':
            for NW in 'pl':
                for E in 'pl':
                    for S in 'pl':K.append((N,Wk,NW,E,S,None))
    for iw in range(3):
        for ie in range(3):
            for Wk in 'pl':
                for E in 'pl':
                    for S in 'pl':K.append(('b',Wk,'b' if iw else 'l',E,S,(iw,ie)))
    return K
def bridge_cells(iw,ie,N,S):
    k={(0,-1):N,(0,1):S};b={}
    span(k,b,0,iw,ie,1 if N=='b' else 0)
    if N=='b':span(k,b,-1,iw,ie,0)
    if S=='b':span(k,b,1,iw,ie,1)
    return Cells(k,b)
def bridge_keys():
    K=[]
    for iw in range(3):
        for ie in range(3):
            for N,S in(('p','b'),('l','b'),('b','p'),('b','l')):K.append((iw,ie,N,S))
    return K
def _pit(k):
    N,Wk,NW,E,S,br=k;return 'iso:rift:'+pit_key(*k),render(pit_cells(N,Wk,NW,E,S,br or (0,0)))
def _brg(k):
    iw,ie,N,S=k;return 'iso:riftb:%d%d%s%s'%k,render(bridge_cells(iw,ie,N,S))
def allimgs():
    from multiprocessing import Pool
    jobs=[(_pit,k) for k in pit_keys()]+[(_brg,k) for k in bridge_keys()]
    with Pool(min(8,os.cpu_count() or 1)) as P:res=P.map(_run,jobs)
    return dict(res)
def _run(j):return j[0](j[1])
# ---- 見本：ゲームと同じに、マスの形から名前をえらんでならべる（ゲームの tsRiftKey と同じ決め方） ----
def keyof(G,x,y):
    """G：{(x,y):'p'|'l'|'b'}（ない所は陸）。ゲームの tsRiftKey と同じ"""
    g=lambda a,b:G.get((a,b),'l')
    def bn(a,b):   # 橋の (西の数, 東の数)
        iw=0
        while g(a-iw-1,b)=='b' and iw<2:iw+=1
        ie=0
        while g(a+ie+1,b)=='b' and ie<2:ie+=1
        return iw,ie
    t=g(x,y)
    if t=='b':
        iw,ie=bn(x,y);N=g(x,y-1);S=g(x,y+1)
        if N!='b' and S!='b':S='b'   # （ないはず）
        if N=='b':S='l' if S=='l' else 'p'
        else:N='l' if N=='l' else 'p';S='b'
        return 'iso:riftb:%d%d%s%s'%(iw,ie,N,S)
    if t!='p':return None
    lb=lambda c:'p' if c=='p' else 'l'
    N=g(x,y-1);Wk=lb(g(x-1,y));E=lb(g(x+1,y));S=lb(g(x,y+1))
    if N=='b':
        iw,ie=bn(x,y-1);return 'iso:rift:'+pit_key('b',Wk,'b' if iw else 'l',E,S,(iw,ie))
    return 'iso:rift:'+pit_key(lb(N),Wk,lb(g(x-1,y-1)),E,S)
def sample(out,imgs):
    # 谷のかたち：たての地われ（はば2〜3、ゆれる）と、2行の橋
    G={}
    for y in range(-2,14):
        x0=int(round(1.2*math.sin((5 if 4<=y<=7 else y)/2.5)));wd=2 if y in(3,9) else 3   # 橋のまわり4行は同じ列（ゲームの tsRift）
        for a in range(wd):G[(x0+a,y)]='p'
    x0=int(round(1.2*math.sin(5/2.5)))   # ゲームと同じ：橋の上の行の、地われの列（はば3）
    for y in(5,6):
        for x in range(x0,x0+3):G[(x,y)]='b'
    xs=[x for x,y in G];ys=[y for x,y in G]
    X0=min((x-y)*64 for x in range(min(xs)-3,max(xs)+4) for y in range(min(ys)-1,max(ys)+2))-64
    X1=max((x-y)*64 for x in range(min(xs)-3,max(xs)+4) for y in range(min(ys)-1,max(ys)+2))+64
    Y1=max((x+y)*48 for x in range(min(xs)-3,max(xs)+4) for y in range(min(ys)-1,max(ys)+2))+96
    Y0=min((x+y)*48 for x in range(min(xs)-3,max(xs)+4) for y in range(min(ys)-1,max(ys)+2))
    gt=IB.arr('ground#0').astype(np.uint8);gt=np.kron(gt,np.ones((2,2,1),np.uint8))
    can=Image.new('RGBA',(X1-X0,Y1-Y0));B=Image.fromarray(gt).convert('RGBA')
    for yy in range(0,can.height,B.height):
        for xx in range(0,can.width,B.width):can.paste(B,(xx,yy))
    miss=set()
    for x in range(min(xs)-3,max(xs)+4):
        for y in range(min(ys)-1,max(ys)+2):
            k=keyof(G,x,y)
            if not k:continue
            im=imgs.get(k)
            if im is None:miss.add(k);continue
            can.alpha_composite(im,((x-y)*64-64-X0,(x+y)*48-Y0))
    if miss:print('ない形',sorted(miss))
    can.save(os.path.join(out,'sample.png'))
    return can
def to_chips(imgs):
    import chips
    head,C=chips.load_imgs()
    for k in [k for k in C if k.startswith('iso:rift:') or k.startswith('iso:riftb:')]:del C[k]
    for nm,im in imgs.items():C[nm]={'ax':64,'ay':48,'w':im.width,'h':im.height,'g':64,'f':[im]}
    chips.pack_imgs(head,C);print('chips',len(imgs))
if __name__=='__main__':
    out=sys.argv[1];os.makedirs(out,exist_ok=True)
    imgs=allimgs();print(len(imgs),'まい')
    for nm,im in imgs.items():im.save(os.path.join(out,nm.replace(':','_')+'.png'))
    if '--sample' in sys.argv:sample(out,imgs)
    if '--chips' in sys.argv:to_chips(imgs)
