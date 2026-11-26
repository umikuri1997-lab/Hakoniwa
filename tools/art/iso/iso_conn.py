# クォータービューの、つながる物（H-14）を3Dで組んで写す：家の壁 12しゅるい（つなぎ方 m 0〜15 と、ひくい壁 ~low）。
# 使い方：python3 tools/art/iso/iso_conn.py <出力フォルダ> [id...] [--chips]（--cut：家の壁の切り口 iso:<id>:cut-e・cut-s だけ）
#   --chips：チップ iso:<id>:<m>・iso:<id>:<m>~low を chips.js に入れる（g64。ax・ay はマスのまん中の地面の点）。
#
# 見え方は iso3d.py と同じ（物を上から見て45度まわす：南が左下・東が右下。見おろし48.59度・遠近なし。1マスの1辺 90.51 ドット）。
# つなぎ方：1マスごとに「まん中の柱＋となりへのびる腕」（m：左1・右2・上4・下8）。
#   腕は、となりのマスの中まで（EXT）のばして組み、写したあと、ドットごとに見えている面のせかいの場所をもとめて、
#   そのマス（0〜1）の中の面のドットだけをのこす。となりのマスも同じ物を写すので、つなぎ目に線もすきまも出ない
#   （となりとの画面のずれは、ちょうど 64・48 ドットなので、ドットのます目もそろう）。
# 設計図（マス。x=東・y=南・z=上。マスの左上が(0,0)、まん中が(0.5,0.5)）
#   家の壁：あつさ 0.3・高さ 2.0（段差2だん。持ち主がきめた）。ひくい壁：高さ 0.2。
#   表の面（南・東・はしの面）：いまの壁の正面の絵（<id>:ext。なければ <id>:HLR の正面の行）を、1マス64ドットで世界の場所にはる。
#     絵は高さ1の64行なので、高さ2の壁は、下の32行（巾木）・まん中の32行（16〜47行）のくりかえし・上の32行（frow）。
#     ext は1マスでくりかえすように、左右のはしがいちばんにている64ドットを切りとる（レンガは2つぶんを64に）。
#   上の面：<id>:HLR の断面の行（てっぺん）を、壁ののびる向きにはる。
import sys,os,math,json
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
for p in(ART,HERE,os.path.join(ROOT,'tools')):sys.path.insert(0,p)
import numpy as np
from PIL import Image
import oblique3d as O
import iso3d as I
from blueprint import Part,build
S=I.ISOS;T=math.radians(I.ISOELEV);ST,CT=math.sin(T),math.cos(T)
PX0,PY0=108,220   # 絵のわくの中の、マスのまん中の地面の点（ドット）。わくの大きさ
WP,HP=216,270   # 高さ2の壁のてっぺんの奥の角は、地面の点から約197ドット上（150だと、てっぺんの面の奥がマスごとに切れて、すき間から外の地面が見えた）
OWN=(0,1,0,1)   # のこすマスのはんい（たしかめるときだけかえる）
EXT=0.45   # 腕を、となりのマスへのばす長さ
EDGE=1e-3   # マスの東・南のはしちょうどにある面（柵のドアの柱の東の面など）も、このマスの物にする（ないと、柱の東の面が切れる）
WALLS=['hwall','bamboowall','canvaswall','acaciawall','timberwall','canalwall','adobewall','yakiwall','rockwall','mosswall','moonwall','logwall','plasterwall','brickwall','yozorawall']
WT,WH,LH=0.3,2.0,0.2
def frow(z,h):
    """壁の正面の絵（高さ1の64行）の、高さ z の行。h が1より高い壁は、上の0.5・下の0.5はそのまま、あいだは16〜47行をくりかえす"""
    if h<=1.0:return int((1.0-z)*64)
    if h-z<=0.5:return int((h-z)*64)
    if z<0.5:return int((1.0-z)*64)
    return 16+int(((h-0.5-z)%0.5)*64)
FACE=(1.0,0.97,0.80)   # 面ごとの明るさ：上・南（左下）・東（右下）
def rot(p):   # 45度まわす（マスのまん中のまわり）
    c=s=math.sqrt(0.5);dx,dy=p[0]-0.5,p[1]-0.5;return np.array([0.5+c*dx-s*dy,0.5+s*dx+c*dy,p[2]])
def unrot(x,y):
    c=s=math.sqrt(0.5);dx,dy=x-0.5,y-0.5;return 0.5+c*dx+s*dy,0.5-s*dx+c*dy
PROJ,DEPTH=I._persp(I.ISOELEV,40.0,None,(0.5,0.5,0.0),False,I.ISOKEEP)
EXTS=(0.5-PX0/S,0.5+(WP-PX0)/S,0.5-PY0/S,0.5+(HP-PY0)/S)
def world_of(zb):
    """ドットごとの、見えている面のせかいの場所（x, y）。zb は奥行き（DEPTH との内積）"""
    gx,gy=np.meshgrid(np.arange(WP)+0.5,np.arange(HP)+0.5);X=EXTS[0]+gx/S;Y=EXTS[2]+gy/S
    h=(Y-0.5)/I.ISOK;d=zb-(0.5*CT+0.0*ST)   # proj の y＝0.5+h·ISOK（画面の上下は ISOK 倍）。h＝a·sinT−b·cosT、d＝a·cosT+b·sinT（a=y'−0.5・b=z）
    a=h*ST+d*CT;yr=0.5+a;xr=X
    return unrot(xr,yr)
def render(parts,decal):
    """parts：[(Part, 面の向きの関数)]。decal(pid番号→関数)"""
    sc=O.Scene();sc.material('flat')
    for p,f in parts:
        p0=sc.pid;sc.decal(f);build(sc,[p]);sc.decal(None)
    sc.material(None)
    sc.t=[(rot(a),rot(b),rot(c),col,pid) for a,b,c,col,pid in sc.t]
    sc.dc={pid:(lambda f:(lambda x,y,z:f(*unrot(x,y),z)))(f) for pid,f in sc.dc.items()}
    O.S=S
    im=O.render_px(sc,PROJ,EXTS,DEPTH,k=0.86,lw=1,k2=0.93,merge=0)
    return own_mask(im,bleed=BLEED)
BLEED=1   # マスのさかいの外へ、1ドットのこす（タイルのはみ出し）。ゲームはマスごとの絵を、はんぱな倍率でならべるので、絵のはしがうすくなり、うしろの地面がすけて、つなぎ目に線が出た（iPhone の Safari）。となりの絵にかさなる所は、同じ場所の同じ色
def own_mask(im,free=None,bleed=0):
    """見えている面が、このマスの中にあるドットだけをのこす（O.LAST_ZB を使う）。free：マスの外へ出てものこす部品の番号（ひらいたとびら）。bleed：マスの外へ、そのドット数だけのこす（つながる腕の所だけ。腕のない所には絵がない）"""
    a=np.array(im).copy();zb=O.LAST_ZB.copy();obj=zb>-1e8
    wx,wy=world_of(np.where(obj,zb,0))
    x0,x1,y0,y1=OWN;own=obj&(wx>=x0-1e-6)&(wx<x1+EDGE)&(wy>=y0-1e-6)&(wy<y1+EDGE)
    if free:own|=obj&np.isin(O.LAST_IDS,list(free))
    # まわりの輪郭（透明だった所に引いた線）は、となりの面のドットのマスにしたがう
    lab=np.where(obj,np.where(own,1,2),0)
    for _ in range(3):
        nb=lab.copy()
        for dy,dx in((0,1),(0,-1),(1,0),(-1,0)):
            sh=np.roll(np.roll(lab,dy,0),dx,1);nb=np.where((nb==0)&(sh>0),sh,nb)
            nb=np.where((lab==0)&(sh==1),1,nb)   # このマスの面ととなりの面の両方にふれる線のドットは、このマスの物にする（どちらのマスにもならず、つなぎ目の足もとに1ドットのすきまが出た）
        lab=nb
    keep=(lab==1)&(a[...,3]>0)
    for _ in range(bleed):
        d=keep.copy()
        for dy,dx in((0,1),(0,-1),(1,0),(-1,0)):d|=np.roll(np.roll(keep,dy,0),dx,1)
        keep=d&(a[...,3]>0)
    a[~keep]=0
    return Image.fromarray(notch(a))
def notch(a):
    """足もとの1ドットの切れこみ（とがった角を写したときの、左・右・上が絵で、下の3つが透明なドット）を、上のドットの色でうめる"""
    o=a[...,3]>0;sh=lambda dy,dx:np.roll(np.roll(o,-dy,0),-dx,1)
    m=~o&sh(0,-1)&sh(0,1)&sh(-1,0)&~sh(1,0)&~sh(1,-1)&~sh(1,1)
    a[m]=np.roll(a,1,0)[m];return a
def crop(im):
    bb=im.getbbox()
    if not bb:return im,0,0
    return im.crop(bb),PX0-bb[0],PY0-bb[1]
# ---- 家の壁のもよう ----
def chipsrc():
    # もとの絵（hwall:HLR など、前の正面の部品）は chips.js からけしてある（#2428）。写しなおすときは、けす前のリポジトリ（chips.js・assets/chips・tools/chips.py）を
    # べつのフォルダに出して（git archive 232ec344^ …）、CHIPSRC=<そのフォルダ> でわたす
    d=os.environ.get('CHIPSRC')
    if d:
        import importlib.util;sp=importlib.util.spec_from_file_location('chips_old',os.path.join(d,'tools','chips.py'));m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m.load_imgs()[1]
    sys.path.insert(0,os.path.join(ROOT,'tools'));import chips;return chips.load_imgs()[1]
def seamless64(tex):
    """1マス（64ドット）でくりかえす帯を切りとる：左はしと、64ドットさきの列がいちばんにている所"""
    W=tex.shape[1]
    if W<=64:return tex
    g=tex[...,:3].astype(float);best=min(range(0,W-64),key=lambda a:np.abs(g[:,a]-g[:,a+64]).mean()+np.abs(g[:,a+63]-g[:,(a+127)%W if a+127<W else a+63]).mean()*0)
    return tex[:,best:best+64]
def wall_tex(C,iid):
    hl=C[iid+':HLR'];im=np.array(hl['f'][0].convert('RGBA'));g=hl.get('g')==64
    if not g:im=np.repeat(np.repeat(im,2,0),2,1)
    top=im[1:17]   # 断面（てっぺん）の行。いちばん上・下の線はのぞく
    if iid+':ext' in C:
        ex=np.array(C[iid+':ext']['f'][0].convert('RGBA'))
        if iid=='brickwall':   # レンガは、くりかえしが 43 ドット：2つぶん（86）を64に
            W=ex.shape[1];g_=ex[...,:3].astype(float);a=min(range(0,W-86),key=lambda a:np.abs(g_[:,a]-g_[:,a+86]).mean())
            ex=np.array(Image.fromarray(ex[:,a:a+86]).resize((64,64),Image.BOX))
        else:ex=seamless64(ex)
        front=ex
    else:front=im[18:82]
    return top[...,:3].astype(float),front[...,:3].astype(float)
def wall_parts(m,top,front,h):
    L,R,U,D=m&1,m&2,m&4,m&8;t=WT/2;P=[]
    def deco(axis,y0f,y1f):
        def f(x,y,z):
            if z>h-5e-3:   # 上の面：のびる向きにそって、断面の絵
                u=x if axis=='x' else y;v=(y-y0f)/(y1f-y0f) if axis=='x' else (x-y0f)/(y1f-y0f)
                c=top[min(top.shape[0]-1,max(0,int(v*top.shape[0]))),math.floor(u*64)%64]*FACE[0]
            else:
                if axis=='x':u=x if abs(y-y1f)<1e-4 or abs(y-y0f)<1e-4 else y;k=FACE[1] if abs(y-y1f)<1e-4 else FACE[2]
                else:u=y if abs(x-y1f)<1e-4 or abs(x-y0f)<1e-4 else x;k=FACE[2] if abs(x-y1f)<1e-4 else FACE[1]
                r=frow(z,h);c=front[min(63,max(0,r)),math.floor(u*64)%64]*k
            return tuple(np.clip(c,0,255))
        return f
    def bx(x0,y0,x1,y1,axis,z1=None):
        P.append((Part('壁','box',(x0,y0,0,x1,y1,z1 or h),(200,200,200),grp='w'),deco(axis,y0 if axis=='x' else x0,y1 if axis=='x' else x1)))
    hz=L or R
    if hz:bx(-EXT if L else 0.5-t,0.5-t,1+EXT if R else 0.5+t,0.5+t,'x')
    if U and D and not hz:bx(0.5-t,-EXT,0.5+t,1+EXT,'y')   # まっすぐな所は1つの箱（まん中で2つにわけると、つなぎ目に線とすきまが出る）
    else:
        zt=h-1e-3 if hz else h   # よこの箱の中までのばし、上の面だけほんの少し下げる（同じ所に面が2つかさなると、ちらつく）
        if U:bx(0.5-t,-EXT,0.5+t,0.5 if hz else 0.5+t,'y',zt)
        if D:bx(0.5-t,0.5 if hz else 0.5-t,0.5+t,1+EXT,'y',zt)
    if not(hz or U or D):bx(0.5-t,0.5-t,0.5+t,0.5+t,'x')
    return P
CUTD=0.004   # 断面の板のあつさ（マス）
def cut_parts(top,d):
    """屋根をはずした家で、高い壁がとなりのひくい壁（手前）にかわる所の切り口（断面）：マスの東（d='e'）か南（'s'）のはしに立つ、うすい板。
    色は断面の行（てっぺんの絵の、あつさの向きの行）を、のびる向きにならした色（ドアの上の断面と同じ、となりの壁の断面の色）"""
    t=WT/2;row=top.mean(axis=1)
    def f(x,y,z):
        v=(y-(0.5-t))/(2*t) if d=='e' else (x-(0.5-t))/(2*t)
        c=row[min(row.shape[0]-1,max(0,int(v*row.shape[0])))]*(FACE[2] if d=='e' else FACE[1])
        return tuple(np.clip(c,0,255))
    box=(1-CUTD,0.5-t,0,1,0.5+t,WH) if d=='e' else (0.5-t,1-CUTD,0,0.5+t,1,WH)
    return [(Part('断面','box',box,(200,200,200),grp='w'),f)]
def build_cuts(ids,C=None):
    """家の壁の切り口の絵 iso:<id>:cut-e・cut-s。色は、いまの壁の絵の色からえらぶ（色をふやすと、256色にへらすときに、いまの壁の絵の色までかわる）"""
    C=C or chipsrc();res={}
    for iid in ids:
        top,_=wall_tex(C,iid)
        pal=np.concatenate([np.array(f.convert('RGBA')).reshape(-1,4) for k,v in C.items() if k.startswith('iso:%s:'%iid) and ':cut-' not in k for f in v['f']])
        pal=np.unique(pal[pal[:,3]>0][:,:3],axis=0).astype(float)
        for d in('e','s'):
            im,ax,ay=crop(render(cut_parts(top,d),None));a=np.array(im);o=a[...,3]>0;X=a[o][:,:3].astype(float)
            a[o,:3]=pal[((X[:,None,:]-pal[None])**2).sum(2).argmin(1)].astype(np.uint8)
            res['iso:%s:cut-%s'%(iid,d)]=(Image.fromarray(a),ax,ay)
    return res
def build_walls(out,ids,chips_=False):
    C=chipsrc();res={}
    for iid in ids:
        top,front=wall_tex(C,iid)
        for low in(False,True):
            for m in range(16):
                im=render(wall_parts(m,top,front,LH if low else WH),None);im,ax,ay=crop(im)
                k='iso:%s:%d%s'%(iid,m,'~low' if low else '');res[k]=(im,ax,ay);im.save(os.path.join(out,k.replace(':','_')+'.png'))
        print(iid)
    return res
def sheet(res,path,ids):
    """2×2・横3つ・L字にならべて、つなぎ目をたしかめる絵（ゲームと同じ置き方）"""
    import itertools
    lay=[(0,0,10),(1,0,3),(2,0,3),(3,0,9),(3,1,12),(3,2,12),(3,3,5),(0,1,12),(0,2,12),(0,3,6),(1,3,3),(2,3,3),(5,3,0)]
    W_=64*9;H_=48*9+200;cv=Image.new('RGBA',(W_*len(ids),H_),(120,150,110,255))
    for n,iid in enumerate(ids):
        for x,y,m in sorted(lay,key=lambda q:q[0]+q[1]):
            im,ax,ay=res['iso:%s:%d'%(iid,m)];cx=n*W_+W_//2+(x-y)*64;cy=180+(x+y)*48
            cv.alpha_composite(im,(cx-ax,cy-ay))
    cv.save(path)
def to_chips(res):
    import chips
    head,C=chips.load_imgs()
    for k,(im,ax,ay) in res.items():C[k]={'ax':ax,'ay':ay,'w':im.width,'h':im.height,'g':64,'f':[im]}
    chips.pack_imgs(head,C)
# ---- 柵・石の塀（fence3d.py の設計図をそのまま使う） ----
# 前の設計図は、よこの柵がマスの南のほう（y＝PCY）、たての柵が x 0.5 で、柱は (0.5, PCY)。
# クォータービューでは柱をマスのまん中にするので、ぜんぶを (0, 0.5−PCY) ずらす。
# 下（南）へのびる腕は、前の設計図では柱からマスのはしまでしかないので、下のマスのまっすぐな柵（m 12）を +1 ずらして足す。
# たての横木（y の向きにのびる箱・つつ）は、同じ線の上の物を1本にまとめる
#（前の設計図のマスのさかいが、新しいマスの中にくるので、2本のままだと、つなぎ目に線とすきまが出る）。
FPCY={'fence':0.865,'logfence':0.76,'bamboofence':0.86,'misugaki':0.90,'wall':0.80,'parkfence':0.865,'ropefence':0.865,'ashifence':0.865,'rankan':0.865,'ibara':0.865,'kuzure':0.865,'ishigaki':0.865,'sagafence':0.80}
FENCES=list(FPCY)
RAILK=('railv','ext','bamv','crmv','ropev','stonev')
def _yk(p):
    d=p.dims
    if p.kind=='box' and d[4]-d[1]>max(d[3]-d[0],d[5]-d[2])*1.5:return ('box',round(d[0],5),round(d[2],5),round(d[3],5),round(d[5],5),p.col,p.grp),d[1],d[4]
    if p.kind=='frust' and abs(d[0][0]-d[1][0])<1e-9 and abs(d[0][2]-d[1][2])<1e-9 and abs(d[2]-d[3])<1e-9:return ('frust',round(d[0][0],5),round(d[0][2],5),round(d[2],5),p.col,p.grp,p.detail),min(d[0][1],d[1][1]),max(d[0][1],d[1][1])
    return None
def fence_parts(iid,m):
    sys.path.insert(0,os.path.join(ART,'fence3d'));import fence3d as FZ,copy
    fn=FZ.FNS[iid];A=fn(m);B=fn(12) if m&8 else []
    rails={};A2=[];B2=[]
    for src,off in((A,0.0),(B,1.0)):
        for q in src:
            k=_yk(q[1])
            if k and q[0] in RAILK:rails.setdefault(k[0],[]).append([k[1]+off,k[2]+off,q])
            else:(A2 if off==0 else B2).append(q)
    for k,segs in rails.items():
        segs.sort(key=lambda v:v[0]);cur=None
        for a_,b_,q in segs:
            if cur and a_<=cur[1]+1e-6:cur[1]=max(cur[1],b_)
            else:
                if cur:A2.append(cur[3])
                cur=[a_,b_,q,None]
            base=cur[2];p=copy.copy(base[1]);d=p.dims
            p.dims=(d[0],cur[0],d[2],d[3],cur[1],d[5]) if p.kind=='box' else ((d[0][0],cur[0],d[0][2]),(d[1][0],cur[1],d[1][2]),d[2],d[3])
            cur[3]=('railv' if base[0]=='ext' else base[0],p,base[2])
        if cur:A2.append(cur[3])
    return FZ,A2,B2
def stake_side(q,lower):
    """マスのさかいに立つ、ロープの柵の細いくいなら、そのがわ（左1・右2・上4・下8）。lower：下のマスの部品（B）"""
    p=q[1]
    if q[0]!='post' or p.name!='くい' or p.kind!='cyl':return 0
    x,y=p.dims[0],p.dims[1]
    if abs(y-0.375)<1e-6:return 8 if lower else 4
    return 1 if x<1e-6 else 2 if x>1-1e-6 else 0
STAKEF=('ropefence',)   # マスのさかいにも、くいが立つ柵（となりがドアのがわは、くいをぬいた絵 ~d<がわ> も作る）
def stake_sides(iid,m):
    if iid not in STAKEF:return 0
    FZ,A,B=fence_parts(iid,m);return sum({stake_side(q,0) for q in A}|{stake_side(q,1) for q in B})
def fence_render(iid,m,nod=0):
    """nod：となりがドアのがわ。そこのマスのさかいのくいを描かない（ドアの柱と2本ならぶので）"""
    FZ,A,B=fence_parts(iid,m);dy=0.5-FPCY[iid]
    if nod:A=[q for q in A if not stake_side(q,0)&nod];B=[q for q in B if not stake_side(q,1)&nod]
    sc=O.Scene();sc.txo={};sc.txax={}
    FZ.add_parts(sc,A);na=sc.pid;FZ.add_parts(sc,B)
    def sh(v,pid):return np.array([v[0],v[1]+(dy if pid<=na else dy+1),v[2]])
    sc.t=[(sh(a,pid),sh(b,pid),sh(c,pid),col,pid) for a,b,c,col,pid in sc.t]
    for pid,(o,du,dv) in list(sc.txo.items()):sc.txo[pid]=((o[0],o[1]+(dy if pid<=na else dy+1),o[2]),du,dv)
    sc.t=[(rot(a),rot(b),rot(c),col,pid) for a,b,c,col,pid in sc.t]
    sc.txo={pid:(tuple(rot(o)),du,dv) for pid,(o,du,dv) in sc.txo.items()}
    sc.txax={pid:rot(np.array(v)+np.array([0.5,0.5,0]))-np.array([0.5,0.5,0]) for pid,v in sc.txax.items()}
    O.S=S;im=O.render_px(sc,PROJ,EXTS,DEPTH,k=0.80,lw=2,k2=0.90,merge=4)
    import furntone;im=furntone.tone(im)
    return own_mask(im,bleed=BLEED)
# ---- 生垣（hedge）：あつさ 0.74・高さ 0.73。こい緑の中身の箱を、小さな葉の部品（板）でおおう（玉にしない） ----
# 葉は、せかいのます目の点に、場所から決まるずれ・向き・色でならべる（1マスでくりかえすので、となりとつながる）。
HT,HH,HL=0.74,0.73,0.075
HEDGEIN=(84,128,60);HEDGEC=[(164,208,104),(144,194,90),(122,174,78),(104,156,68),(86,136,60)]
HFACE={'t':(0,1),'s':(1,3),'e':(2,4)}   # 面ごとの葉の色（上は明るく、南は中、東はこく）
def _hh(*a):
    v=0
    for q in a:v=(v*1103515245+int(round(q*1000))*2654435761+12345)&0xffffffff
    return (v>>8)/16777216.0
def hedge_parts(m):
    L,R,U,D=m&1,m&2,m&4,m&8;t=HT/2;boxes=[];hz=L or R
    if hz:boxes.append((-EXT if L else 0.5-t,0.5-t,1+EXT if R else 0.5+t,0.5+t))
    if U and D and not hz:boxes.append((0.5-t,-EXT,0.5+t,1+EXT))
    else:
        if U:boxes.append((0.5-t,-EXT,0.5+t,0.5 if hz else 0.5+t))
        if D:boxes.append((0.5-t,0.5 if hz else 0.5-t,0.5+t,1+EXT))
    if not boxes:boxes.append((0.5-t,0.5-t,0.5+t,0.5+t))
    inside=lambda x,y:any(b[0]-1e-6<=x<=b[2]+1e-6 and b[1]-1e-6<=y<=b[3]+1e-6 for b in boxes)
    P=[(Part('中','box',(b[0]+0.02,b[1]+0.02,0,b[2]-0.02,b[3]-0.02,HH-0.03),HEDGEIN,grp='hin'),None) for b in boxes]
    def leaf(x,y,z,nx,ny,nz):
        f=HFACE['t' if nz>0.5 else 's' if abs(ny)>0.5 else 'e'];n_=f[1]-f[0]+1
        r=_hh(x,y,z);col=HEDGEC[f[0]+int(_hh(y,z,x)*n_)%n_]
        a=np.array([x,y,z]);n=np.array([nx,ny,nz],float)
        tg=np.cross(n,[0,0,1.0]) if abs(nz)<0.9 else np.array([1.0,0,0])
        ang=(r-0.5)*2.4;tg=tg*math.cos(ang)+np.cross(n,tg)*math.sin(ang)   # 葉の向きは、場所できまる
        b=a+tg*HL*1.1+n*0.02
        P.append((Part('葉','plate',(tuple(a-tg*HL*0.1+n*0.005),tuple(b),HL*0.7,0.008),col,grp='lf'),None))
    seen=set()
    x0=min(b[0] for b in boxes);x1=max(b[2] for b in boxes);y0=min(b[1] for b in boxes);y1=max(b[3] for b in boxes)
    g=lambda a,b_,st=HL:np.arange(math.floor(a/st)*st,b_+1e-9,st)
    for X in g(x0,x1):
        for Y in g(y0,y1):   # 上の面
            jx,jy=(_hh(X,Y,1)-0.5)*HL*0.8,(_hh(Y,X,2)-0.5)*HL*0.8;x,y=X+jx,Y+jy
            if inside(x,y):leaf(x,y,HH-0.01+_hh(X,Y,3)*0.02,0.15*(_hh(X,Y,4)-0.5),0.15*(_hh(X,Y,5)-0.5),1)
    for b in boxes:   # 4つのよこの面（ほかの箱の中になる所はのぞく）
        for side in range(4):
            for T in (g(b[0],b[2],HL*0.8) if side<2 else g(b[1],b[3],HL*0.8)):
                for Z in np.arange(0.03,HH-0.02,HL*0.7):
                    tt=T+(_hh(T,Z,side)-0.5)*HL*0.8;z=Z+(_hh(Z,T,7)-0.5)*HL*0.5
                    if side==0:x,y,n=tt,b[3],(0,1,0)
                    elif side==1:x,y,n=tt,b[1],(0,-1,0)
                    elif side==2:x,y,n=b[2],tt,(1,0,0)
                    else:x,y,n=b[0],tt,(-1,0,0)
                    if not(b[0]-1e-6<=x<=b[2]+1e-6 and b[1]-1e-6<=y<=b[3]+1e-6):continue
                    if any(o is not b and o[0]+1e-6<x<o[2]-1e-6 and o[1]+1e-6<y<o[3]-1e-6 for o in boxes):continue
                    k=(round(x,4),round(y,4),round(z,4))
                    if k in seen:continue
                    seen.add(k);leaf(x,y,z,*n)
    return P
def hedge_render(m):
    sc=O.Scene()
    for p,_ in hedge_parts(m):build(sc,[p])
    sc.t=[(rot(a),rot(b),rot(c),col,pid) for a,b,c,col,pid in sc.t]
    O.S=S;im=O.render_px(sc,PROJ,EXTS,DEPTH,k=0.84,lw=1,k2=0.92,merge=4)
    return own_mask(im,bleed=BLEED)
def build_all(out,ids):
    """ids の物を、つなぎ方 m 0〜15（家の壁は ~low も）ぜんぶ写す"""
    res={};C=None
    for iid in ids:
        for m in range(16):
            if iid in WALLS:
                if C is None:C=chipsrc()
                top,front=wall_tex(C,iid)
                for low in(False,True):res['iso:%s:%d%s'%(iid,m,'~low' if low else '')]=crop(render(wall_parts(m,top,front,LH if low else WH),None))
                if m==0 and any(k.startswith('iso:%s:'%iid) for k in C):res.update(build_cuts([iid],C))   # 新しい壁は、まだ絵がないので、絵を入れたあとの --cut でつくる
            elif iid=='hedge':res['iso:hedge:%d'%m]=crop(hedge_render(m))
            else:
                res['iso:%s:%d'%(iid,m)]=crop(fence_render(iid,m));sd=stake_sides(iid,m)
                for d in range(1,16):   # となりがドアのがわ d（m の中）に、くいがあるときだけ
                    if d&m==d and d&sd:res['iso:%s:%d~d%d'%(iid,m,d)]=crop(fence_render(iid,m,d))
        print(iid,flush=True)
    for k,(im,ax,ay) in res.items():im.save(os.path.join(out,k.replace(':','_')+'.png'))
    json.dump({k:[ax,ay,im.width,im.height] for k,(im,ax,ay) in res.items()},open(os.path.join(out,'_info.json'),'w'))
    return res
ALL=WALLS+FENCES+['hedge']
if __name__=='__main__':
    a=[q for q in sys.argv[1:] if not q.startswith('--')];out=a[0];ids=a[1:] or ALL;os.makedirs(out,exist_ok=True)
    if '--cut' in sys.argv:   # 家の壁の切り口の絵だけ（ほかの絵は写しなおさない）
        res=build_cuts([q for q in ids if q in WALLS])
        for k,(im,ax,ay) in res.items():im.save(os.path.join(out,k.replace(':','_')+'.png'))
        if '--chips' in sys.argv:to_chips(res)
        sys.exit()
    res=build_all(out,ids)
    for n in range(0,len(ids),4):sheet(res,os.path.join(out,'_sheet%d.png'%(n//4)),ids[n:n+4])
    if '--chips' in sys.argv:to_chips(res)
