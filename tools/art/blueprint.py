"""設計図から3Dを組む道具。
物を「部品の表」で書く。部品ごとに、形・寸法（マス）・色・のる所（on：ささえる部品の名前。地面は 'ground'）を書く。
同じ表から、設計図（正面・右横・上からの3つの図と、部品の表）と、3D（oblique3d の Scene）の両方を作る。
のる所のたしかめ（check）：部品の下のはしが、ささえる部品の上のはし（か地面）にとどいていて、上から見て重なっているか。とどかない・重ならない部品は、設計図に赤で出す。
x=東, y=南, z=上（マス）。置くマスの左上が(0,0)。
形：
  box(x0,y0,z0,x1,y1,z1)            四角い材
  cyl(cx,cy,r,z0,z1)                 まるい柱
  ring(cx,cy,r0,r1,z0,z1)            まるい筒（井戸のふち）
  cone(cx,cy,r,z0,z1)                円すい（z1 がとがる）
  pyr(cx,cy,hw,hd,z0,z1)             四角すい
  plate(a,b,w,t)                     a→b の線にそった板（はば w は横、あつさ t）。ななめの材・すべり面・屋根
  beam(a,b,r)                        a→b の角材（はば・あつさ 2r）
  wheel(cx,cy,cz,r,t)                車輪（正面を向いた円板、あつさ t）
  ball(cx,cy,cz,r)                   丸いかたまり（葉・花・荷物）
  rope(a,b,r)                        なわ
  tube(点の一覧,r)                    折れ線の管（取っ手の輪など）
  model(path,cx,cy,z0,size,rot,tilt)      フリーの3Dモデル（glTF の .glb。models/ にある CC0 の物）。size はモデルの高さ（マス）、rot は上から見てまわす角度・tilt は東西へたおす角度（度）
  lathe(cx,cy,[(半径,高さ),...])     まわした形（つぼ）。上から下への形
  prism([(x,z),...],y0,y1)            正面（南から見た形）の多角形を、y0〜y1 へのばした板（すじかいのはしを、ほかの材にそって切るときなど）
  prism([(y,z),...],x0,x1,'x')        横（東から見た形）の多角形を、x0〜x1 へのばした板（横の面のすじかい）
  prism([(x,y),...],z0,z1,'z')        上から見た形の多角形を、z0〜z1 へのばした板（角を丸めた天板など）
  loft([([(x,y),...],z),...])          上から見た形（点の数は同じ）を、高さごとにかえながらつないだ板。下から上へ。ふちをななめにけずる（ベベル）など
  box は bevel=（面取りのはば）を部品ごとにかえられる
  grp=（名前）：同じ名前の部品どうしのさかいには、ドット絵の輪郭線（oblique3d.render_px）を引かない
"""
import math,os
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from oblique3d import Scene,render,game,side,VIEW,SIDE,grid_bg

class Part:
    def __init__(s,name,kind,dims,col=(200,200,200),on=('ground',),note='',deco=False,detail=36,bevel=None,grp=None):
        s.name,s.kind,s.dims,s.col,s.on,s.note,s.deco,s.detail,s.bevel,s.grp=name,kind,dims,col,tuple(on) if on else (),note,deco,detail,bevel,grp
    def bbox(s):
        k,d=s.kind,s.dims
        if k=='box':return d
        if k in('cyl','cone'):cx,cy,r,z0,z1=d;return(cx-r,cy-r,z0,cx+r,cy+r,z1)
        if k=='logy':cx,y0,y1,cz,r=d;return(cx-r,y0,cz-r,cx+r,y1,cz+r)
        if k=='maki':cx,y0,y1,cz,r=d[:5];return(cx-r,y0,cz-r,cx+r,y1,cz+r)
        if k=='ring':cx,cy,r0,r,z0,z1=d;return(cx-r,cy-r,z0,cx+r,cy+r,z1)
        if k=='pyr':cx,cy,hw,hd,z0,z1=d;return(cx-hw,cy-hd,z0,cx+hw,cy+hd,z1)
        if k=='wheel':cx,cy,cz,r,t=d;return(cx-r,cy-t/2,cz-r,cx+r,cy+t/2,cz+r)
        if k=='ball':cx,cy,cz,r=d;return(cx-r,cy-r,cz-r,cx+r,cy+r,cz+r)
        if k=='tube':a=np.array(d[0],float);r=d[1];return(*(a.min(0)-r),*(a.max(0)+r))
        if k=='model':V,F,C=model_tris(*d);return(*V.min(0),*V.max(0))
        if k=='loft':a=np.array([q for P_,z in d for q in P_],float);zs=[z for _,z in d];return(a[:,0].min(),a[:,1].min(),min(zs),a[:,0].max(),a[:,1].max(),max(zs))
        if k=='prism':
            pts,c0,c1=d[:3];a=np.array(pts,float)
            if len(d)>3 and d[3]=='x':return(c0,a[:,0].min(),a[:,1].min(),c1,a[:,0].max(),a[:,1].max())
            if len(d)>3 and d[3]=='z':return(a[:,0].min(),a[:,1].min(),c0,a[:,0].max(),a[:,1].max(),c1)
            return(a[:,0].min(),c0,a[:,1].min(),a[:,0].max(),c1,a[:,1].max())
        if k=='lathe':cx,cy,pr=d;r=max(q[0] for q in pr);return(cx-r,cy-r,min(q[1] for q in pr),cx+r,cy+r,max(q[1] for q in pr))
        pts=s.corners();a=np.array(pts);return(*a.min(0),*a.max(0))
    def corners(s):
        k,d=s.kind,s.dims
        if k in('plate','beam','rope'):
            a,b=np.array(d[0],float),np.array(d[1],float)
            w,t=(d[2],d[3]) if k=='plate' else (2*d[2],2*d[2])
            ax=b-a;ax/=np.linalg.norm(ax);u=np.cross(ax,[0,0,1.0])
            if np.linalg.norm(u)<1e-6:u=np.array([1.0,0,0])
            u/=np.linalg.norm(u);v=np.cross(u,ax);v/=np.linalg.norm(v)
            return [p+su*w/2*u+sv*t/2*v for p in(a,b) for su in(-1,1) for sv in(-1,1)]
        x0,y0,z0,x1,y1,z1=s.bbox();return [(x,y,z) for x in(x0,x1) for y in(y0,y1) for z in(z0,z1)]
    def size(s):b=s.bbox();return(b[3]-b[0],b[4]-b[1],b[5]-b[2])

def check(parts,tol=0.035):
    """のる所のたしかめ。まちがいの一覧（部品の名前と理由）をかえす"""
    by={p.name:p for p in parts};bad=[]
    for p in parts:
        if p.deco or not p.on:continue
        x0,y0,z0,x1,y1,z1=p.bbox();ok=False
        for o in p.on:
            if o=='ground':ok=ok or abs(z0)<=tol;continue
            q=by.get(o)
            if not q:bad.append((p.name,'のる所「%s」がない'%o));continue
            a=q.bbox()
            over=x0<a[3]+tol and x1>a[0]-tol and y0<a[4]+tol and y1>a[1]-tol
            touch=z0<=a[5]+tol and z1>=a[2]-tol   # 下のはしが上にのる、または、くみこむ・とおす（z が重なる）
            ok=ok or(over and touch)
        if not ok:bad.append((p.name,'ささえにとどかない'))
    return bad

def build(sc,parts):
    for p in parts:
        k,d,c=p.kind,p.dims,np.array(p.col,float);sc.group(p.grp)
        if k=='box':sc.box(*d,tuple(c),bevel=p.bevel)
        elif k=='lathe':cx,cy,pr=d;sc.revolve(cx,cy,pr,lambda k_,i:tuple(c),n=p.detail)
        elif k=='model':
            V,F,C=model_tris(*d);sc.part()
            rc=getattr(p,'recol',None)
            if rc is not None:   # 色をかえる（その色に、モデルの明るさのちがいだけをのこす。例：つぼをクリーム色・青に）
                L_=C.mean(1);L_=L_/max(1.0,L_.mean());kk=getattr(p,'recolk',1.0);L_=1+(L_-1)*kk;C=np.clip(np.array(rc,float)[None,:]*L_[:,None],0,255)   # recolk：明るさのちがいをのこす分（0でむらなし）
            r2=getattr(p,'recol2',None)
            if r2 is not None:   # 2つの色にわける：モデルの明るさが、まん中の明るさ×sep より暗い所は dark の色、ほかは light の色（ふくろとひも など）。明るさのちがいは recolk の分だけのこす
                sep,cd,cl=r2;L_=C.mean(1);md=np.median(L_);kk=getattr(p,'recolk',1.0);lo=L_<md*sep
                C=np.array([np.array(cd if q else cl,float)*(1+(l/max(1.0,(L_[lo].mean() if q and lo.any() else L_[~lo].mean()))-1)*kk) for q,l in zip(lo,L_)]);C=np.clip(C,0,255)
            for f,cc in zip(F,C):sc.tri(V[f[0]],V[f[1]],V[f[2]],tuple(cc*(1-MODEL_SOFT)+255*MODEL_SOFT))   # モデルの色は、ゲームに合わせて少しうすく
        elif k=='cyl':   # plainwall：まわりのかべには木目をはらない（まるいかべの木目は、ドットでは、ぶつぶつのすじになる）
            cx,cy,r,z0,z1=d;t=sc.tcur
            if getattr(p,'plainwall',False):sc.texture(None)
            sc.ring_wall(cx,cy,r,z0,z1,lambda *a:tuple(c),n=p.detail);sc.texture(t);sc.annulus(cx,cy,0,r,z1,lambda *a:tuple(c),n=p.detail)
        elif k=='ring':cx,cy,r0,r,z0,z1=d;sc.ring_wall(cx,cy,r,z0,z1,lambda i,a0,a1:tuple(c),n=p.detail);sc.ring_wall(cx,cy,r0,z0,z1,lambda *a:tuple(c),n=p.detail);sc.annulus(cx,cy,r0,r,z1,lambda *a:tuple(c),n=p.detail)
        elif k=='cone':cx,cy,r,z0,z1=d;sc.revolve(cx,cy,[(0.0,z1),(r,z0)],lambda k_,i:tuple(c),n=p.detail)
        elif k=='pyr':
            cx,cy,hw,hd,z0,z1=d;A=(cx,cy,z1);R=[(cx-hw,cy-hd),(cx+hw,cy-hd),(cx+hw,cy+hd),(cx-hw,cy+hd)];sc.part()
            for i in range(4):(xa,ya),(xb,yb)=R[i],R[(i+1)%4];sc.tri(A,(xa,ya,z0),(xb,yb,z0),tuple(c))
        elif k in('plate','beam'):
            P=p.corners();sc.part()
            # 6つの面：ならびは a の4点（su,sv）と b の4点
            idx=[(0,1,3,2),(4,5,7,6),(0,1,5,4),(2,3,7,6),(0,2,6,4),(1,3,7,5)]
            for q in idx:sc.quad(*[P[i] for i in q],tuple(c))
        elif k=='prism':
            pts,y0,y1=d[:3];sc.part();n=len(pts);X=len(d)>3 and d[3]=='x'
            AX=d[3] if len(d)>3 else 'y';V={'x':(lambda u,w,z:(w,u,z)),'y':(lambda u,w,z:(u,w,z)),'z':(lambda u,w,z:(u,z,w))}[AX]   # u・z：形の2つの向き・w：のばす向き
            for i in range(n):(xa,za),(xb,zb)=pts[i],pts[(i+1)%n];sc.quad(V(xa,y0,za),V(xb,y0,zb),V(xb,y1,zb),V(xa,y1,za),tuple(c))
            for yy in(y0,y1):
                for i in range(1,n-1):sc.tri(V(pts[0][0],yy,pts[0][1]),V(pts[i][0],yy,pts[i][1]),V(pts[i+1][0],yy,pts[i+1][1]),tuple(c))
        elif k=='loft':
            sc.part();R_=d;n=len(R_[0][0])
            for (A,za),(B,zb) in zip(R_,R_[1:]):
                for i in range(n):(x0,y0),(x1,y1)=A[i],A[(i+1)%n];(u0,v0),(u1,v1)=B[i],B[(i+1)%n];sc.quad((x0,y0,za),(x1,y1,za),(u1,v1,zb),(u0,v0,zb),tuple(c))
            for P_,z in(R_[0],R_[-1]):
                for i in range(1,n-1):sc.tri((P_[0][0],P_[0][1],z),(P_[i][0],P_[i][1],z),(P_[i+1][0],P_[i+1][1],z),tuple(c))
        elif k=='rope':sc.tube([d[0],d[1]],d[2],tuple(c),n=6)
        elif k=='tube':sc.tube(list(d[0]),d[1],tuple(c),n=8)   # 折れ線の管（取っ手の輪など）。d=(点の一覧, 太さ)
        elif k=='logy':   # まき・丸太：おく向き（y）にねかせた円柱。まわりは皮の色（col）、両はしの切り口は LOGEND
            cx,y0,y1,cz,r=d;sc.part();n=20
            for yy in(y0,y1):
                for i in range(n):
                    a0=2*math.pi*i/n;a1=2*math.pi*(i+1)/n;P_=lambda a:(cx+r*math.cos(a),yy,cz+r*math.sin(a))
                    sc.tri((cx,yy,cz),P_(a0),P_(a1),LOGEND)
            for i in range(n):
                a0=2*math.pi*i/n;a1=2*math.pi*(i+1)/n;P_=lambda a,yy:(cx+r*math.cos(a),yy,cz+r*math.sin(a))
                sc.quad(P_(a0,y0),P_(a1,y0),P_(a1,y1),P_(a0,y1),tuple(c))
        elif k=='maki':   # わったまき：おく向き（y）にねかせる。d=(cx,y0,y1,cz,r,形,まわす角度,太さ)。形 'round' 丸のまま・'half' 半分・'quarter' 4分の1。
            # まわり：皮（col）、わった面 MAKISPLIT。切り口：皮のふち・明るい木 LOGEND・まん中（しん）MAKIHEART。r の円の中におさめる
            cx,y0,y1,cz,r,sh,rot=d[:7];fr=d[7] if len(d)>7 else 1.0;sc.part();n=16
            a0={'round':0,'half':0,'quarter':0}[sh];span={'round':2*math.pi,'half':math.pi,'quarter':math.pi/2}[sh]
            arc=[(math.cos(a0+span*i/n*(1 if sh=='round' else 1)),math.sin(a0+span*i/n)) for i in range(n if sh=='round' else n+1)]
            if sh=='round':P0=arc;pith=(0.0,0.0);isarc=[True]*len(P0)
            else:P0=arc+[(0.0,0.0)];pith=(0.0,0.0);isarc=[True]*len(arc)+[False]
            cr,sr=math.cos(math.radians(rot)),math.sin(math.radians(rot))
            Q=[(u*cr-v*sr,u*sr+v*cr) for u,v in P0];pq=(0.0,0.0)
            ux=[q[0] for q in Q];vz=[q[1] for q in Q];mu,mv=(max(ux)+min(ux))/2,(max(vz)+min(vz))/2;ex=max(max(ux)-min(ux),max(vz)-min(vz))/2
            k_=r*fr/ex;Q=[((u-mu)*k_,(v-mv)*k_) for u,v in Q];pq=((0-mu)*k_,(0-mv)*k_)
            V_=lambda q,yy:(cx+q[0],yy,cz+q[1]);m=len(Q);cl=sh=='round';t_=sc.tcur;sc.texture(barktex() if getattr(p,'bark',True) else None);sc.part()
            for i in range(m if cl else m):
                j=(i+1)%m
                if not cl and j==0 and i==m-1:pass
                bark=isarc[i] and isarc[j] and (cl or j!=0)
                sc.quad(V_(Q[i],y0),V_(Q[j],y0),V_(Q[j],y1),V_(Q[i],y1),tuple(c) if bark else MAKISPLIT)
            sc.texture(None);sc.part();sc.texture(t_)   # 切り口は木目なし（同じグループなので線は引かない）
            for yy in(y0,y1):   # 切り口（皮のうすいふち・明るい木・年輪の線・しん。かさならない輪にわけて描く）
                In=[(pq[0]+(q[0]-pq[0])*0.88,pq[1]+(q[1]-pq[1])*0.88) if a_ else q for q,a_ in zip(Q,isarc)]
                for i in range(m):
                    j=(i+1)%m
                    if isarc[i] and isarc[j]:sc.quad(V_(Q[i],yy),V_(Q[j],yy),V_(In[j],yy),V_(In[i],yy),tuple(c))
                Rg=lambda f:[(pq[0]+(q[0]-pq[0])*f,pq[1]+(q[1]-pq[1])*f) for q in In]
                bands=[(1.0,0.66,LOGEND),(0.66,0.52,MAKIRING),(0.52,0.30,LOGEND)]
                for fa,fb,cc_ in bands:
                    A_,B_=Rg(fa),Rg(fb)
                    for i in range(m):j=(i+1)%m;sc.quad(V_(A_[i],yy),V_(A_[j],yy),V_(B_[j],yy),V_(B_[i],yy),cc_)
                Hc=Rg(0.30)
                for i in range(m):j=(i+1)%m;sc.tri(V_(pq,yy),V_(Hc[i],yy),V_(Hc[j],yy),MAKIHEART)
        elif k=='wheel':
            cx,cy,cz,r,t=d;sc.part()
            for yy in(cy-t/2,cy+t/2):
                for i in range(24):
                    a0=2*math.pi*i/24;a1=2*math.pi*(i+1)/24;P_=lambda a:(cx+r*math.cos(a),yy,cz+r*math.sin(a))
                    sc.tri((cx,yy,cz),P_(a0),P_(a1),tuple(c))
            for i in range(24):
                a0=2*math.pi*i/24;a1=2*math.pi*(i+1)/24;P_=lambda a,yy:(cx+r*math.cos(a),yy,cz+r*math.sin(a))
                sc.quad(P_(a0,cy-t/2),P_(a1,cy-t/2),P_(a1,cy+t/2),P_(a0,cy+t/2),tuple(c))   # まわりも同じ色（木材の色はひとつ）
        elif k=='ball':cx,cy,cz,r=d;sc.sphere(cx,cy,cz,r,tuple(c),n=14,m=8)

LOGEND=(236,206,150)   # まきの切り口の色（年輪のある明るい木）
MAKISPLIT=(222,178,118)   # わったまきの、たてにわれた面
MAKIHEART=(222,180,122)   # まきの切り口のまん中（しん）
MAKIRING=(228,192,136)   # まきの切り口の年輪の線
_BT=[]
def barktex():
    """まきの皮のテクスチャ（ambientCG Bark001、textures/bark001.png）"""
    if not _BT:
        from oblique3d import Tex;_BT.append(Tex(os.path.join(os.path.dirname(os.path.abspath(__file__)),'textures','bark001.png'),span=1.0,flow=6,minrun=3,dark=(0.16,0.93),light=(0.16,1.06)))
    return _BT[0]
MODELS=os.path.join(os.path.dirname(os.path.abspath(__file__)),'models')
_MC={};MODEL_SOFT=0.3   # モデルの色を白にまぜる分
POTCOL=(226,196,166)   # 観葉植物のはち（モデルではこい灰色）を、ゲームに合わせたやきものの色に
def model_tris(path,cx,cy,z0,size,rot=0,tilt=0):
    """glTF のモデルを読んで、ゲームの向き（x=東, y=南, z=上）の三角形にする。モデルの正面（+Z）を南（手前）へ。色はモデルの色（テクスチャの色をとる）"""
    key=(path,cx,cy,z0,size,rot,tilt)
    if key in _MC:return _MC[key]
    import trimesh
    sc_=trimesh.load(os.path.join(MODELS,path),force='scene');VS,FS,CS=[],[],[];n=0
    for node in sc_.graph.nodes_geometry:   # 部品ごとに色をとる（テクスチャの色か、材質の色）
        T_,gname=sc_.graph[node];g=sc_.geometry[gname].copy();g.apply_transform(T_);vis=g.visual;col=None
        try:
            vc=np.asarray((vis if getattr(vis,'kind',None)=='vertex' else vis.to_color()).vertex_colors,float)   # 色が点ごとにある物（トリポのモデル）は、そのまま
            if vc.ndim==2 and len(vc)==len(g.vertices):col=vc[:,:3][np.array(g.faces)].mean(1)
        except Exception:pass
        if col is None:
            mat=getattr(vis,'material',None);bc=None
            for a in('baseColorFactor','main_color','diffuse'):
                v=getattr(mat,a,None)
                if v is not None:bc=np.asarray(v,float)[:3];break
            if bc is not None and bc.max()<=1.0:bc=bc*255
            col=np.tile(bc if bc is not None else [200.0,200,200],(len(g.faces),1))
        VS.append(np.asarray(g.vertices,float));FS.append(np.asarray(g.faces)+n);CS.append(col);n+=len(g.vertices)
    class _M:pass
    m=_M();m.vertices=np.concatenate(VS);m.faces=np.concatenate(FS);col=np.concatenate(CS)
    if path.startswith('tripo/'):   # トリポのモデル：くらい色・色むらをへらし、あざやかにして、トゥーンの色に（持ち主：黒っぽいかげを使わない）
        import colorsys
        H=np.array([colorsys.rgb_to_hsv(*(c_/255)) for c_ in col]);vm=H[:,2].mean()
        H[:,2]=np.clip(vm+(H[:,2]-vm)*0.4,0.6,1.0);H[:,1]=np.clip(H[:,1]*1.12+0.04,0,1)
        col=np.array([colorsys.hsv_to_rgb(*h_) for h_ in H])*255
    if 'Houseplant' in path:col[(col.mean(1)<90)&(col.max(1)-col.min(1)<18)]=POTCOL   # 灰色のはちだけ（葉の緑はそのまま）
    v=np.array(m.vertices,float);V=np.stack([v[:,0],v[:,2],v[:,1]],1)   # glTF（y上・z手前）→ x・y南・z上
    k=size/(V[:,2].max()-V[:,2].min())   # size は、たおす前のモデルの高さ
    t=math.radians(tilt);T=np.array([[math.cos(t),0,math.sin(t)],[0,1,0],[-math.sin(t),0,math.cos(t)]]);V=V@T.T   # よこにたおす（東西の向きに）
    a=math.radians(rot);R=np.array([[math.cos(a),-math.sin(a),0],[math.sin(a),math.cos(a),0],[0,0,1]]);V=V@R.T
    V=(V-[(V[:,0].max()+V[:,0].min())/2,(V[:,1].max()+V[:,1].min())/2,V[:,2].min()])*k+[cx,cy,z0]
    _MC[key]=(V,np.array(m.faces),col);return _MC[key]

TOP=np.array([0,0,1.0]);EAST=np.array([1.0,0,0])
def topv(p):return(p[0],p[1])
def eastv(p):return(p[1],-p[2])
def _font(n):
    f='/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
    return ImageFont.truetype(f,n) if os.path.exists(f) else ImageFont.load_default()

def blueprint(path,title,parts,foot,ext):
    """設計図：正面・右横・上からの図（0.25マスの目もり）と、部品の表（寸法・高さ・のる所）。ext=(x0,x1,y0,y1,z1)：図の範囲"""
    x0,x1,y0,y1,z1=ext;S=128;M=40;f=_font(18);fb=_font(22);bad=dict(check(parts))
    sc=Scene();build(sc,parts)
    def view(proj,e,depth):
        im=render(sc,proj,e,depth);W,H=im.size;bg=Image.new('RGBA',(W,H),(240,244,250,255));d=ImageDraw.Draw(bg)
        for i in range(int((e[1]-e[0])*4)+1):d.line([(i*S/4,0),(i*S/4,H)],fill=(205,215,235) if i%4 else (160,180,215))
        for j in range(int((e[3]-e[2])*4)+1):d.line([(0,j*S/4),(W,j*S/4)],fill=(205,215,235) if j%4 else (160,180,215))
        bg.alpha_composite(im);return bg
    fr=view(side,(x0,x1,-z1,0.05),SIDE);ea=view(eastv,(y0,y1,-z1,0.05),EAST);tp=view(topv,(x0,x1,y0,y1),TOP)
    d0=ImageDraw.Draw(tp);fx0,fy0=(0-x0)*S,(0-y0)*S;d0.rectangle([fx0,fy0,fx0+foot[0]*S,fy0+foot[1]*S],outline=(214,170,70),width=3)
    rows=['%-0s'%'' for _ in []]
    tw=1150;H=M*2+max(fr.height,ea.height)+tp.height+60;W=M*3+fr.width+max(ea.width,tw)
    im=Image.new('RGB',(W,max(H,M*3+fr.height+30*len(parts)+120)),(240,244,250));d=ImageDraw.Draw(im);BL=(60,90,150);RD=(200,50,50)
    d.text((M,8),title+'　設計図（1目もり＝0.25マス、太い線＝1マス。高さはほんとうの高さ）',font=fb,fill=BL)
    im.paste(fr.convert('RGB'),(M,M+24));d.text((M,M+4),'正面（南から）',font=f,fill=BL)
    im.paste(ea.convert('RGB'),(M*2+fr.width,M+24));d.text((M*2+fr.width,M+4),'右横（東から）',font=f,fill=BL)
    ty=M*2+24+fr.height;im.paste(tp.convert('RGB'),(M,ty+24));d.text((M,ty+4),'上から（黄色いわく＝置くマス）',font=f,fill=BL)
    # 全体の寸法
    bb=np.array([p.bbox() for p in parts]);W_=bb[:,3].max()-bb[:,0].min();D_=bb[:,4].max()-bb[:,1].min();H_=bb[:,5].max()
    tx=M*2+fr.width;y=M*2+24+max(fr.height,ea.height);d.text((tx,y),'ぜんたい：はば %.2f・おくゆき %.2f・高さ %.2f（マス）'%(W_,D_,H_),font=fb,fill=BL);y+=34
    d.text((tx,y),'部品',font=f,fill=BL);d.text((tx+235,y),'はば×おくゆき×高さ',font=f,fill=BL);d.text((tx+430,y),'高さの所',font=f,fill=BL);d.text((tx+560,y),'のる所・とめ方',font=f,fill=BL);y+=26
    for p in parts:
        if p.deco:continue
        b=p.bbox();w,dd,h=p.size();on='・'.join('地面' if o=='ground' else o for o in p.on)
        col=RD if p.name in bad else BL
        d.text((tx,y),'%s'%p.name,font=f,fill=col);d.text((tx+235,y),'%.2f×%.2f×%.2f'%(w,dd,h),font=f,fill=col);d.text((tx+430,y),'%.2f〜%.2f'%(b[2],b[5]),font=f,fill=col)
        d.text((tx+560,y),on+(('　← '+bad[p.name]) if p.name in bad else '')+(('　'+p.note) if p.note else ''),font=f,fill=col);y+=24
    deco=[p.name for p in parts if p.deco]
    if deco:d.text((tx,y+6),'かざり（ささえのたしかめなし）：'+'・'.join(dict.fromkeys(deco)),font=f,fill=BL)
    im.save(path);return bad
