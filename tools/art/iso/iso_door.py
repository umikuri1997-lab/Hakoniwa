# クォータービューのドア・門・壁にかける物（H-14 の後半）を3Dで組んで写す。写し方・つなぎ目のけし方は iso_conn.py と同じ。
# 使い方：python3 tools/art/iso/iso_door.py <出力フォルダ> [id...] [--chips]
#   家のドア（door・yozoradoor・canvasdoor・archdoor・niwadoor）：iso:<id>:<h|v>（しまる）・#1〜#3（ひらく）・~low（屋根をはずした手前のドア）
#   柵・塀のドア（gate・logdoor・parkdoor・sdoor、となりの柵の戸 ropefence.gate など）：iso:<id>:<h|v>・#1〜#3
#   2マスの門（stonegate・loggate・parkgate・canalgate・irongate）：iso:<id>:h・#1〜#3（左のマスのチップが2マスぶん）
#   壁にかける物：iso:win:<id>:<h|v>（壁の面）・iso:win:wreath:d・d#1（ドアの板の面のリース）・iso:win:window:lit:<h|v>（夜の窓のあかり）
# 設計図（マス。x=東・y=南・z=上。マスのまん中が(0.5,0.5)）
#   家のドア：わくは家の壁（hwall）と同じあつさ0.3・高さ1.0。両わきの柱（はば0.15。となりの壁と同じく、となりのマスまでのばして切る）・
#     上のかもい（高さ0.8〜1.0）・しきい（高さ0.03）。わくの面は hwall の壁の絵。
#     とびら：はば0.7・高さ0.8・あつさ0.06。面は、いまのチップ hwall.<id>#h0 の板（わくの内がわ 56×56）。うらの面は左右反対。
#     ちょうつがいは西（たては北）の柱。よこ置きは北へ、たて置きは西へ（家の中へ）、0・30・60・85度まわす。
#     ひらいたとびらは、マスの外へ出ても切らない（そのマスの物より先に描かれるおくのマスへ出るので、かさなりはただしい）。
#     ~low：しきい（高さ0.02）と、ひくい壁と同じ高さ（0.2）の柱。かもいととびらはなし。
#   柵・塀のドア：doors3d.py の設計図（とびらは、家のドアと同じく、おくへひらく）。よこ置きも、柱をたて置きと同じくマスの中に立てる（INPOST）
#     （よこ置きの柱がマスのさかいにまたがると、となりの柵の絵に柱がないので、マスのさかいで切れる）。
#   2マスの門：doors3d.py の設計図の柱を、マスの中（BIGIN）にうつす。
#   壁にかける物：いまのチップの絵を、壁の正面（よこ置きは南の面 y=0.65、たて置きは東の面 x=0.65）に、1マス64ドットではる。
#     いまの見え方で壁の正面の上のはし（y）から描いていた所を、壁の面の高さ 1.0 の所にあわせる（上へはみ出す分は、壁の中へさげる）。
import sys,os,math,json
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
for p in(ART,HERE,os.path.join(ROOT,'tools'),os.path.join(ART,'fence3d')):sys.path.insert(0,p)
import numpy as np
from PIL import Image
import oblique3d as O
import iso_conn as IC
from blueprint import Part,build
S=IC.S
HDOORS=['door','yozoradoor','canvasdoor','archdoor','niwadoor']
GATES=['gate','logdoor','parkdoor','sdoor','ropefence.gate','ashifence.gate','rankan.gate','ibara.gate','kuzure.gate','misugaki.gate']
BIG=['stonegate','loggate','parkgate','canalgate','irongate']
HANG=['window','curtain1','curtain2','paint1','paint2','paint3','wshelf','wreath','kabebukuro','yonaka']
ANG=[0,30,60,85]
JW,LZ,LT=0.15,0.8,0.06   # 柱のはば・とびらの高さ・とびらのあつさ
def frame(px0,py0,wp,hp,own):
    """写すわくをかえる（2マスの門は大きく）"""
    IC.PX0,IC.PY0,IC.WP,IC.HP,IC.OWN=px0,py0,wp,hp,own
    IC.EXTS=(0.5-px0/S,0.5+(wp-px0)/S,0.5-py0/S,0.5+(hp-py0)/S)
F1=(108,150,216,200,(0,1,0,1));F2=(108,170,300,270,(0,2,0,1))
# ---- 家のドア ----
def leaf_img(C,iid):
    a=np.array(C['hwall.'+iid+'#h0']['f'][0].convert('RGBA'))[4:60,4:60,:3].astype(float);return a
def frame_deco(top,front,v,h):
    """わくの面：家の壁と同じ（上の面は断面の絵、ほかは正面の絵を、世界の場所ではる）"""
    def f(x,y,z):
        if z>h-5e-3:
            u=y if v else x;w=(x if v else y)-0.35;c=top[min(top.shape[0]-1,max(0,int(w/0.3*top.shape[0]))),math.floor(u*64)%64]*IC.FACE[0]
        else:
            if not v:u,k=(x,IC.FACE[1]) if abs(abs(y-0.5)-0.15)<1e-4 else (y,IC.FACE[2])
            else:u,k=(y,IC.FACE[2]) if abs(abs(x-0.5)-0.15)<1e-4 else (x,IC.FACE[1])
            c=front[min(63,max(0,int((1.0-z)*64))),math.floor(u*64)%64]*k
        return tuple(np.clip(c,0,255))
    return f
def hdoor_parts(C,iid,v,n,low):
    top,front=IC.wall_tex(C,'hwall');P=[];h=IC.LH if low else IC.WH;t=IC.WT/2;E=IC.EXT
    fd=frame_deco(top,front,v,h)
    def bx(u0,u1,z0,z1,grp='fr',col=(200,200,200),deco=None,w0=0.5-t,w1=0.5+t):
        d=(w0,u0,z0,w1,u1,z1) if v else (u0,w0,z0,u1,w1,z1);P.append((Part('わく','box',d,col,grp=grp),deco or fd,None))
    bx(-E,JW,0,h);bx(1-JW,1+E,0,h)
    if low:bx(JW,1-JW,0,0.02);return P   # ひくいドア：柱はひくい壁と同じ高さ（壁の線がとぎれない）と、しきい
    bx(JW,1-JW,LZ,h)
    L=leaf_img(C,iid);edge=np.clip(L.reshape(-1,3).mean(0)*0.78,0,255)
    a=math.radians(ANG[n]);ca,sa=math.cos(a),math.sin(a)
    hu,hw=JW,0.5+LT/2   # ちょうつがい（u：柵ののびる向き、w：おく行き）
    def local(x,y):   # せかいの場所 → とびらの中の場所（u：ちょうつがいからのきょり、w：おもての面からのふかさ）。とびらは、おく（北・西）へ a だけまわす
        U,Wv=(y,x) if v else (x,y);du,dw=U-hu,Wv-hw;return du*ca-dw*sa,du*sa+dw*ca   # 逆にまわす
    def ld(x,y,z):
        lu,lw=local(x,y)
        if abs(lw)<2e-3 or abs(lw+LT)<2e-3:   # おもて（南・東）とうら
            front_=abs(lw)<2e-3;s=lu/(1-2*JW);s=s if front_ else 1-s
            nx,ny=(sa,ca) if front_ else (-sa,-ca)   # 面の向き（よこ置きのとき。たて置きは x と y をいれかえる）
            if v:nx,ny=ny,nx
            k=IC.FACE[1]*ny*ny+IC.FACE[2]*nx*nx;c=L[min(55,max(0,int((LZ-z)/LZ*56))),min(55,max(0,int(s*56)))]*k
        else:c=edge
        return tuple(np.clip(c,0,255))
    lp=Part('とびら','box',((0.5-LT/2,JW+0.004,0.035,0.5+LT/2,1-JW-0.004,LZ-0.004) if v else (JW+0.004,0.5-LT/2,0.035,1-JW-0.004,0.5+LT/2,LZ-0.004)),(200,200,200),grp='leaf')
    P.append((lp,ld,('rot',(hw if v else hu),(hu if v else hw),(ANG[n] if v else -ANG[n])),1))
    return P
def render_parts(P,merge=0,k=0.86,lw=1,k2=0.93,tone=False,hook=None):
    sc=O.Scene();sc.material('flat')
    free=set()
    for q in P:
        p,f,r=q[:3];p0=sc.pid;sc.decal(f);build(sc,[p]);sc.decal(None)
        if len(q)>3:free|=set(range(p0+1,sc.pid+1))
        if r:
            _,hx,hy,deg=r;c_,s_=math.cos(math.radians(deg)),math.sin(math.radians(deg));ids=set(range(p0+1,sc.pid+1))
            R=lambda q:np.array([hx+(q[0]-hx)*c_-(q[1]-hy)*s_,hy+(q[0]-hx)*s_+(q[1]-hy)*c_,q[2]])
            sc.t=[(R(a_),R(b_),R(c__),col,pid) if pid in ids else (a_,b_,c__,col,pid) for a_,b_,c__,col,pid in sc.t]
    sc.material(None)
    sc.t=[(IC.rot(a),IC.rot(b),IC.rot(c),col,pid) for a,b,c,col,pid in sc.t]
    sc.dc={pid:(lambda f:(lambda x,y,z:f(*IC.unrot(x,y),z)))(f) for pid,f in sc.dc.items()}
    O.S=S;im=O.render_px(sc,IC.PROJ,IC.EXTS,IC.DEPTH,k=k,lw=lw,k2=k2,merge=merge)
    return IC.own_mask(im,free)
def build_hdoor(C,iid):
    res={};frame(*F1)
    for v in(0,1):
        o='v' if v else 'h'
        for n in range(4):res['iso:%s:%s%s'%(iid,o,'#%d'%n if n else '')]=IC.crop(render_parts(hdoor_parts(C,iid,v,n,False)))
        res['iso:%s:%s~low'%(iid,o)]=IC.crop(render_parts(hdoor_parts(C,iid,v,0,True)))
    return res
# ---- 柵・塀のドア・門（doors3d の設計図） ----
def gate_scene(P,dy,stub=()):
    """部品 P（doors3d・fence3d の形）を写す。stub：となりの柵の腕（fence_parts の形 (A,B)。B は1マス下）"""
    import fence3d as FZ
    sc=O.Scene();sc.txo={};sc.txax={};free=set();sid=set();shf={}
    for q in P:
        p0=sc.pid;FZ.add_parts(sc,[q])
        if isinstance(q[2],tuple) and q[2] and q[2][0]=='rot':free|=set(range(p0+1,sc.pid+1))
    for src,off,d2 in stub:
        for q in src:
            p0=sc.pid;FZ.add_parts(sc,[q]);ids=range(p0+1,sc.pid+1);sid|=set(ids)
            for i in ids:shf[i]=(off,d2)
    def sh(q,pid):o,d2=shf.get(pid,(0.0,dy));return np.array([q[0],q[1]+d2+o,q[2]])
    sc.t=[(IC.rot(sh(a,pid)),IC.rot(sh(b,pid)),IC.rot(sh(c,pid)),col,pid) for a,b,c,col,pid in sc.t]
    sc.txo={pid:(tuple(IC.rot(sh(np.array(o,float),pid))),du,dv) for pid,(o,du,dv) in sc.txo.items()}
    sc.txax={pid:IC.rot(np.array(q)+np.array([0.5,0.5,0]))-np.array([0.5,0.5,0]) for pid,q in sc.txax.items()}
    O.S=S;im=O.render_px(sc,IC.PROJ,IC.EXTS,IC.DEPTH,k=0.80,lw=2,k2=0.90,merge=4)
    import furntone;im=furntone.tone(im);ids=O.LAST_IDS.copy();zb=O.LAST_ZB.copy()
    return IC.own_mask(im,free),ids,zb,sid
def gate_render(iid,fn,v,n,big=False):
    import doors3d as D
    D.INPOST=True;D.BIGIN=BIGIN.get(fn.__name__,0.0) if big else 0.0
    A0=D.ANG;D.ANG=[-a for a in A0]   # とびらは、おく（北・西）へひらく（手前のマスの物より先に描くので、手前へ出すと、その物にかくれる）
    try:P,_=fn(v,n)
    finally:D.INPOST=False;D.BIGIN=0.0;D.ANG=A0
    dy=0.0 if v else 0.5-PWOF[iid]   # よこ置きは、となりの柵・塀と同じだけ南北にずらす（柱がマスのまん中・とびらの面が柵の面とそろう）
    base,_,_,_=gate_scene(P,dy)
    fid=NBF.get(iid)
    if not fid:return base
    # となりの柵の腕を、柱の所まで描く（柱がマスの中なので、柵の横木がマスのさかいで切れて、柱とのあいだにすきまが出る）。
    # 柵の絵と同じ形を1つの絵に写し、柵の腕の部品で、柱のはばの所（マスのさかい〜柱のそと）にある見えているドットだけを、ドアの絵にかさねる
    FZ_,A,B=IC.fence_parts(fid,(1|2) if not v else (4|8));fdy=0.5-IC.FPCY[fid]
    A=[q for q in A if q[0] not in NOSTUB];B=[q for q in B if q[0] not in NOSTUB]   # 柵の柱・くいは描かない（ドアの柱と2本になる）
    W2=2 if big else 1;stub=[(A,0.0,fdy),(B,1.0,fdy)] if v else [(A,0.0,fdy)]+([(A,1.0*(W2-1),fdy)] if big else [])
    if not v and big:stub=[([q for q in A],float(k),fdy) for k in range(W2)]
    full,ids,zb,sid=gate_scene(P,dy,stub)
    wx,wy=IC.world_of(np.where(zb>-1e8,zb,0));u=wy if v else wx;w_=wx if v else wy;L=W2;pe=POSTE[iid]
    inr=((u>=-1e-6)&(u<pe))|((u>L-pe)&(u<L-1e-6))
    m=np.isin(ids,list(sid))&inr&(w_>-0.2)&(w_<1.2)
    a=np.array(base).copy();f=np.array(full)
    from scipy import ndimage
    ol=ndimage.binary_dilation(m)&(f[...,3]>0)&(a[...,3]==0)&(ids<0)   # かさねた横木のまわりの線
    m=m|ol;a[m]=f[m];return Image.fromarray(a)
NOSTUB=('post','picket','cap')
NBF={'sdoor':'wall','stonegate':'wall','gate':'fence','logdoor':'logfence','parkdoor':'parkfence','ropefence.gate':'ropefence','ashifence.gate':'ashifence','rankan.gate':'rankan','ibara.gate':'ibara','kuzure.gate':'kuzure','misugaki.gate':'misugaki','loggate':'logfence','parkgate':'parkfence','canalgate':'rankan','irongate':'kuzure'}   # となりにくる柵・塀
POSTE={'sdoor':0.3,'stonegate':0.46,'gate':0.16,'logdoor':0.3,'parkdoor':0.18,'ropefence.gate':0.17,'ashifence.gate':0.16,'rankan.gate':0.24,'ibara.gate':0.15,'kuzure.gate':0.24,'misugaki.gate':0.115,'loggate':0.44,'parkgate':0.22,'canalgate':0.3,'irongate':0.3}   # マスのさかいから、柱のそとまで（この中だけ柵の腕を描く）
BIGIN={'loggate':0.22,'stonegate':0.23,'parkgate':0.11,'canalgate':0.15,'irongate':0.15}   # 柱のはばの半分（かさ石もふくめて、柱のそとがわが、マスのさかいにそろう）
PWOF={'loggate':0.76,'stonegate':0.8,'parkgate':0.865,'canalgate':0.865,'irongate':0.865,'gate':0.865,'logdoor':0.76,'parkdoor':0.865,'sdoor':0.8,'misugaki.gate':0.9,'ropefence.gate':0.865,'ashifence.gate':0.865,'rankan.gate':0.865,'ibara.gate':0.865,'kuzure.gate':0.865}   # よこ置きの柱のおく行き（設計図の PW。となりの柵の FPCY と同じ）
def build_gate(iid):
    import doors3d as D
    fn,hasv=D.DOORS[iid];res={};big=iid in BIG;frame(*(F2 if big else F1))
    for o in(['h'] if big else ['h','v']):
        for n in range(4):
            im=gate_render(iid,fn,o=='v',n,big)
            res['iso:%s:%s%s'%(iid,o,'#%d'%n if n else '')]=IC.crop(im)
    frame(*F1);return res
# ---- 壁にかける物 ----
def hang_src(C,iid):
    """いまの見え方の絵（壁のマスの左上 x,y を原点、1マス64ドット）に、かける物をかさねる。カーテンは窓の上"""
    can=np.zeros((176,176,4),np.uint8);OX,OY=56,56   # 原点のずれ（上・左へはみ出す分）
    for k in(['window',iid] if iid.startswith('curtain') else [iid]):
        c=C[k];im=np.array(c['f'][0].convert('RGBA'));x=OX-c['ax'];y=OY-c['ay']-3   # いまの見え方は、壁にかける物を1.5（g64で3）上へ
        sub=can[y:y+im.shape[0],x:x+im.shape[1]];m=im[...,3:4]>0;sub[...]=np.where(m,im,sub)
    ys=np.where(can[...,3].any(1))[0];top=ys.min()-OY
    if top<2:OY-=2-top   # 壁の上のはしから2ドットより上へは出さない（壁の中へさげる）
    return can,OX,OY
def hang_render(C,iid,v,plane=None,ang=0):
    """壁の面（v=0：南の面、v=1：東の面）に、絵をはる。面の点 → 画面の点は、平行な写し方なので一次の式。画面のドットごとに、逆の式で絵のドットをえらぶ"""
    can,OX,OY=hang_src(C,iid);frame(*F1)
    w0=plane if plane is not None else 0.5+IC.WT/2+0.004
    a=math.radians(ang);hu=JW
    def W(u,z):   # 絵の中の場所（u：よこ、1マス=1）→ せかい
        if ang:   # とびらの面：ちょうつがいのまわりにまわす
            du=u-hu;U,Wv=hu+du*math.cos(a),w0-du*math.sin(a)   # おくへひらく
        else:U,Wv=u,w0
        return np.array([Wv,U,z]) if v else np.array([U,Wv,z])
    def scr(p):q=IC.PROJ(IC.rot(p));return np.array([(q[0]-IC.EXTS[0])*S,(q[1]-IC.EXTS[2])*S])
    o=scr(W(0,1));du=scr(W(1,1))-o;dz=scr(W(0,0))-o   # 絵の (1マスよこ・1マス下) の画面のずれ
    M=np.array([du,dz]).T/64.0;Mi=np.linalg.inv(M)
    gx,gy=np.meshgrid(np.arange(IC.WP)+0.5,np.arange(IC.HP)+0.5);P=np.stack([gx-o[0],gy-o[1]],-1)@Mi.T
    sx=np.floor(P[...,0]+OX).astype(int);sy=np.floor(P[...,1]+OY).astype(int)
    ok=(sx>=0)&(sy>=0)&(sx<can.shape[1])&(sy<can.shape[0]);out=np.zeros((IC.HP,IC.WP,4),np.uint8)
    out[ok]=can[sy[ok],sx[ok]]
    nx,ny=(math.sin(a),math.cos(a)) if not v else (math.cos(a),math.sin(a))
    kf=1.0 if iid=='window:lit' else IC.FACE[2] if v and not ang else IC.FACE[1];   # 光る窓のあかりは、面の向きのかげをつけないout[...,:3]=np.clip(out[...,:3]*kf,0,255).astype(np.uint8)
    return IC.crop(Image.fromarray(out))
def build_hang(C):
    res={}
    for iid in HANG:
        for v in(0,1):res['iso:win:%s:%s'%(iid,'v' if v else 'h')]=hang_render(C,iid,v)
    for v in(0,1):res['iso:win:window:lit:%s'%('v' if v else 'h')]=hang_render(C,'window:lit',v)   # 夜の窓のあかり（灯りのある家の窓ガラス）
    res['iso:win:wreath:d']=hang_render(C,'wreath',0,plane=0.5+LT/2+0.004)
    for n in(1,2,3):res['iso:win:wreath:d#%d'%n]=hang_render(C,'wreath',0,plane=0.5+LT/2+0.004,ang=ANG[n])
    return res
def build_all(out,ids):
    C=IC.chipsrc();res={}
    for iid in ids:
        if iid in HDOORS:res.update(build_hdoor(C,iid))
        elif iid in GATES or iid in BIG:res.update(build_gate(iid))
        elif iid=='hang':res.update(build_hang(C))
        print(iid,flush=True)
    for k,(im,ax,ay) in res.items():im.save(os.path.join(out,k.replace(':','_')+'.png'))
    json.dump({k:[ax,ay,im.width,im.height] for k,(im,ax,ay) in res.items()},open(os.path.join(out,'_info.json'),'w'))
    return res
ALL=HDOORS+GATES+BIG+['hang']
if __name__=='__main__':
    a=[q for q in sys.argv[1:] if not q.startswith('--')];out=a[0];ids=a[1:] or ALL;os.makedirs(out,exist_ok=True)
    res=build_all(out,ids)
    if '--chips' in sys.argv:IC.to_chips(res)
