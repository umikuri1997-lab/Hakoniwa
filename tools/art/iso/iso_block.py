# クォータービューの土のブロックのタイルセット：ブロックの1だんを3Dで組んで、角の形ごとの完成したチップに写す（壁の iso_conn.py と同じ写し方・切り方）。
# 使い方：python3 tools/art/iso/iso_block.py <出力フォルダ> [--sample]（--sample：見本の4つのならびを写す）
#
# 設計図（1マスの1だん。x=東・y=南・z=上。マスの左上が(0,0)、1だんの高さ1）
#   形は、まるい箱（rounded box）：外に出ている所（となりのマスのそのだんが空・上が空）だけ、箱を R ちぢめた芯から R はなれた面にする。
#     外に出ている辺は、まるくなる（手前のたての角・左右のはしのたての角・上の面のふち）。となりがつづく向きは、まるめずに平らなふたの面にする。
#     箱はマスの中だけ（1×1×1）。ゲームと同じに奥から（x+y・下のだんから）かさねると、手前のマスが、ふたの面をかくす。
#     となりとのさかいの断面は、どちらのマスも同じまるみ・同じでこぼこ（せかいの場所できめる）なので、線もすきまも出ない。
#   でこぼこ：横の面を、がけの絵（cliff:block・cliff:blockm）の暗い所ほど、面の向きに DEP へこませる（岩のみぞがへこみ、まるい角のふちがガタガタになる）。
#     上の面はへこませない（まるいふちの上のほうは、少しずつ）。
#   色：横の面は、がけの絵（いちばん上のだん cliff:block・その下 cliff:blockm。ゲームの icFace と同じ写し方：左の面は x、右の面は 1−y、たては 1−z）。
#     上の面と、まるいふちの上のほうは、地面の絵（草 tex:grass・かれた地面 tex:dry。画面の場所でくりかえす）。草は、ふちから少したれる。
#     明るさ：上 1・左の面（南）.94・右の面（東）.74（ゲームの ICLF・ICRT）。まるい所は、面の向きでまぜて、段にする。
# チップのなまえ（--chips はまだ）：iso:blk-<g|d|m>:<n><s><e><w>（g 草の上のだん・d かれた地面の上のだん・m 上にブロックがつづくだん。nsew は外に出ていれば1）
import sys,os,math
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
for p in(ART,HERE,os.path.join(ROOT,'tools')):sys.path.insert(0,p)
import numpy as np
from PIL import Image
import oblique3d as O
import iso_conn as IC
R=0.11     # 角のまるみの半径（マス）
DEP=0.045  # でこぼこのふかさ（マス）
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
def build(n,s,e,w,top,var):
    """var：'g' 草・'d' かれた地面・'m' 上につづく"""
    core,ex=shape(n,s,e,w,top)
    tex=arr('cliff:block' if top else 'cliff:blockm');L=soft(lum(tex))
    gt=arr('tex:grass' if var=='g' else 'tex:dry')
    sc=O.Scene();sc.material('flat')
    def droop(x,y):   # 草が横の面にたれる長さ（だん）
        if var!='g':return 0.0
        h=(math.sin(x*41.3+y*17.1)*43758.5453)%1;return 0.02+0.05*h
    def col(x,y,z):
        lo=np.array(core[0::2]);hi=np.array(core[1::2]);p=np.array([x,y,z]);c=np.clip(p,lo,hi);d=p-c;ln=np.linalg.norm(d)
        nrm=d/ln if ln>1e-6 else np.array([0,0,1.0])
        tz=(R if top else 0)
        if top and (z>core[5]+R*0.45-droop(x,y) or nrm[2]>0.62):   # 上の面・まるいふちの上のほう：地面の絵
            sx=((x-y)*32)%gt.shape[1];sy=((x+y)*24)%gt.shape[0];c0=gt[int(sy),int(sx)];k=1.0
            if nrm[2]<0.9:k=0.97
        else:
            r_,c_,side=facetex(p,nrm,None);c0=tex[r_,c_]
            a=max(0,nrm[1]);b=max(0,nrm[0]);t=max(0,nrm[2]);sm=a+b+t+1e-6
            k=(a*0.94+b*0.74+t*1.0)/sm
            if nrm[1]<0 and nrm[0]<0:k=0.9
        k=min(LEV,key=lambda v:abs(v-k))
        return np.clip(c0*k,0,255)
    sc.decal(col);sc.part()
    for p,nrm,(ax,sg) in surf(core,ex):
        # でこぼこ：横むきの所だけ、がけの絵の暗い所をへこます
        side=sum(np.maximum(0,nrm[...,i]*sg_) for i,sg_,on in((0,1,e),(0,-1,w),(1,1,s),(1,-1,n)) if on)   # 外に出ている向きの面だけ（となりへつづくふたの面はへこまさない）
        P=p.copy()
        if True:
            zz=np.clip(P[...,2],0,1);rr=np.minimum(63,((1-zz)*64).astype(int))
            uu=np.where(nrm[...,1]>=nrm[...,0],P[...,0]%1,(1-(P[...,1]%1))%1);cc=np.minimum(63,(uu*64).astype(int))
            dd=DEP*(1-L[rr,cc])*np.clip(side*1.25-0.15,0,1)
            if top:dd=dd*np.clip((core[5]+R*0.7-P[...,2])/(R*0.7),0,1)   # 上の面のまん中はへこまさない
            P=P-nrm*dd[...,None]
        for i in range(NG):
            for j in range(NG):
                a,b,c,d=P[i,j],P[i,j+1],P[i+1,j+1],P[i+1,j]
                sc.tri(a,b,c,(0.5,0.5,0.5));sc.tri(a,c,d,(0.5,0.5,0.5))
    sc.material(None)
    sc.t=[(IC.rot(a),IC.rot(b),IC.rot(c),cc,pid) for a,b,c,cc,pid in sc.t]
    sc.dc={pid:(lambda f:(lambda x,y,z:f(*IC.unrot(x,y),z)))(f) for pid,f in sc.dc.items()}
    O.S=IC.S
    im=O.render_px(sc,IC.PROJ,IC.EXTS,IC.DEPTH,k=0.92,lw=1,k2=0.96,merge=0)
    return IC.crop(im)
def key(n,s,e,w):return '%d%d%d%d'%(n,s,e,w)
def tiles_for(cells,var):
    """cells：{(x,y):高さ}。マスごと・だんごとのチップ（同じ形は1回だけ写す）"""
    memo={};out=[]
    hv=lambda x,y:cells.get((x,y),0)
    for (x,y),h in cells.items():
        for L in range(1,h+1):
            ex=[hv(x,y-1)<L,hv(x,y+1)<L,hv(x+1,y)<L,hv(x-1,y)<L];top=L==h
            v=var if top else 'm';k=(v,)+tuple(ex)
            if k not in memo:memo[k]=build(*ex,top,v)
            out.append((x,y,L,memo[k]))
    return out,memo
def compose(cells,var,pad=40):
    """ゲームと同じならべ方（x+y の順・下のだんから）で、地面の上にならべた見本"""
    T,_=tiles_for(cells,var);gt=Image.open if False else None
    xs=[x for x,y in cells];ys=[y for x,y in cells];mh=max(cells.values())
    X0=min((x-y)*64 for x,y in cells)-128-pad;X1=max((x-y)*64 for x,y in cells)+128+pad
    Y0=min((x+y)*48 for x,y in cells)-48-mh*72-pad-60;Y1=max((x+y)*48 for x,y in cells)+96+pad
    bg=arr('tex:grass' if var=='g' else 'tex:dry').astype(np.uint8);B=Image.fromarray(bg)
    can=Image.new('RGBA',(X1-X0,Y1-Y0))
    for yy in range(0,can.height,bg.shape[0]//1):
        for xx in range(0,can.width,bg.shape[1]):can.paste(B.resize((bg.shape[1],bg.shape[0])),(xx,yy))
    for x,y,L,(im,ax,ay) in sorted(T,key=lambda t:(t[0]+t[1],t[2])):
        cx=(x-y)*64-X0;cy=(x+y)*48+48-X0*0-Y0-(L-1)*72
        can.alpha_composite(im,(int(cx-ax),int(cy-ay)))
    return can
if __name__=='__main__':
    out=sys.argv[1];os.makedirs(out,exist_ok=True)
    if '--sample' in sys.argv:
        S1={(0,0):1}
        S2={(x,y):1 for x in range(3) for y in range(2)}
        S3={(0,0):2,(1,0):1,(0,1):1,(0,2):1,(1,1):0}
        S3={k:v for k,v in S3.items() if v}
        S4={(1,1):3,(2,1):1,(1,2):1,(0,1):2,(1,0):2}
        for i,(c,v) in enumerate(((S1,'g'),(S2,'g'),(S3,'d'),(S4,'d'))):
            im=compose(c,v);im.save(os.path.join(out,'sample%d.png'%(i+1)))
            im.resize((im.width*2,im.height*2),Image.NEAREST).save(os.path.join(out,'sample%dx2.png'%(i+1)))
            print('sample',i+1,im.size)
