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
#   置き方：幹のまん中を x=2.0（4×4のまん中）、いちばん手前の根の下のはしを y=3.85 に。
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
FRONT=3.85      # いちばん手前の根の下のはし（マス）
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
    V=np.stack([v[:,0],v[:,2],v[:,1]],1);Fc=Fc[:,[0,2,1]]   # glTF（y上・z手前）→ x・y南・z上（軸を入れかえると裏表がかわるので、面のならびを逆に）
    comps=[]
    for i in np.unique(fl):
        s=np.where(fl==i)[0];p=V[Fc[s]].reshape(-1,3);c=col[s].mean(0)
        kind='glow' if c[0]>215 and c[1]>200 else 'leaf' if c[1]>c[0] else 'wood'
        q=p.mean(0);grp=('L' if q[0]<0 else 'R')+('B' if q[1]<0 else 'F')   # LB=育った木・RB=切り株・LF=若木・RF=芽
        if grp[0]=='L' and 100<=len(s)<=130 and (p.max(0)-p.min(0)).max()<0.03:kind='glow'   # 光のつぶ（小さな玉。色が木の色に近い物も）
        comps.append(dict(f=Fc[s],col=col[s],kind=kind,grp=grp,n=len(s),lo=p.min(0),hi=p.max(0)))
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
LEAFIN=(134,159,92)   # かたまりの中（玉と玉のすきまから見える、こい緑。お手本の絵の、かたまりの下のかげの色）
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
    st=big('RB');out=[(V[st['f']],st,'bark')]
    if name=='stump':return out
    if name in('bud','leaf'):
        src=big('RF');sp=[c for c in comps if c['grp']=='RF' and c is not src]
        P=[move(c,src,st) for c in sp];allp=np.concatenate([p.reshape(-1,3) for p in P]);anc=allp[allp[:,2].argmin()]   # 芽の根もと
        return out+[(move(c,src,st,LEAFK if name=='leaf' else 1.0,anc),c,'leaf' if c['kind']!='wood' else 'stem') for c in sp]
    if name=='sapling':
        src=big('LF');its=[(move(c,src,st),c,{'wood':'bark','leaf':'leaf','glow':'glow'}[c['kind']]) for c in comps if c['grp']=='LF' and c is not src and c['kind']!='glow']   # 若木には光のつぶを出さない（いまの絵と同じ）
        tr=max((it for it in its if it[2]=='bark'),key=lambda it:it[1]['n'])[0].reshape(-1,3)   # 若木の幹
        zl=tr[:,2].min();b0=tr[tr[:,2]<zl+0.02*(tr[:,2].max()-zl)].mean(0);t0=tr[tr[:,2]>tr[:,2].max()-0.25*(tr[:,2].max()-zl)].mean(0)
        a=math.atan2(t0[1]-b0[1],t0[2]-b0[2])   # うしろ（北）へのかたむき。根もとのまわりに、まっすぐ立てる（モデルでは、うしろへたおれていた）
        R=np.array([[1,0,0],[0,math.cos(a),-math.sin(a)],[0,math.sin(a),math.cos(a)]])
        return out+[(((p_-b0)@R.T)+b0,c,k) for p_,c,k in its]
    return [(V[c['f']],c,{'wood':'bark','leaf':'leaf','glow':'glow'}[c['kind']]) for c in comps if c['grp']=='LB']

class Stage:
    """furn3d.shot にわたす設計図（PARTS は空、EXTRA で三角形を足す）"""
    def __init__(s,V,comps,name):
        s.name=name;s.ID='story:'+name;s.items=stage(V,comps,name);s.GRAD=True;s.PARALLEL=True   # 遠近なし：furn3d の遠近は1マスの物に合わせた強さなので、大きな木では、上ほど大きくゆがむ
        P=np.concatenate([p.reshape(-1,3) for p,_,_ in s.items]);bark=np.concatenate([p.reshape(-1,3) for p,c,k in s.items if c is s.items[0][1]])
        if name=='tree':
            w=STUMPW if False else TREEW;k=w/(P[:,0].max()-P[:,0].min());base=P[P[:,2]<P[:,2].min()+0.02]   # 幹のまん中：根もとの点のまん中
        else:
            k=STUMPW/(bark[:,0].max()-bark[:,0].min());base=bark[bark[:,2]<bark[:,2].min()+0.02]
        tcx=(base[:,0].max()+base[:,0].min())/2;fy=P[:,1].max() if name=='tree' else bark[:,1].max()
        s.T=lambda p,k=k,tcx=tcx,fy=fy,z0=P[:,2].min():np.stack([(p[...,0]-tcx)*k+TX,(p[...,1]-fy)*k+FRONT,(p[...,2]-z0)*k],-1)
    def leafbox(s):
        if not hasattr(s,'_lb'):s._lb=[(s.T(p).reshape(-1,3).min(0),s.T(p).reshape(-1,3).max(0)) for p,c,k in s.items if k=='leaf' and c['n']>200]
        return s._lb
    def PARTS(s):return []
    def EXTRA(s,sc):
        sc.smooth(True);s._gid=[]
        for kind in('bark','stem','leaf','glow'):
            its=[(p,c) for p,c,k in s.items if k==kind]
            if not its:continue
            allc=np.concatenate([c['col'] for p,c in its]);mean=allc.mean(1).mean()
            for p,c in its:
                q=s.T(p);n=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]);nz=n[:,2]/np.maximum(np.linalg.norm(n,axis=1),1e-12)
                if kind=='glow':   # 光のつぶ：小さくして、かげなしで光らせる
                    m=q.reshape(-1,3).mean(0);q=(q-m)*MOTEK+m;sc.part();sc.material('flat');sc.outline(0)
                    for t in q:sc.tri(t[0],t[1],t[2],GLOW)
                    sc.material(None);sc.outline();continue
                if kind=='bark':
                    top=q[...,2].max();cut=(nz>0.75)&(q[:,:,2].mean(1)>top*0.7)&(c is s.items[0][1])   # 切り口（上を向いた、高い所の面）
                    LB=[(lo+(hi-lo)*0.18,hi-(hi-lo)*0.18) for lo,hi in s.leafbox()]   # 葉のかたまりの中（ふちから少し内がわ）
                    keep=np.array([not ct and not any((t.mean(0)>lo).all() and (t.mean(0)<hi).all() for lo,hi in LB) for t,ct in zip(q,cut)])   # 葉のかたまりをつきぬけた枝のさきは描かない（モデルでは葉の中から茶色の点が出ていた）
                    zl,zh=q[...,2].min(),q[...,2].max();H=zh-zl
                    if c is s.items[0][1] and s.name!='tree':src=lambda K:K[:,2]>zh-0.08*H   # 切り株：切り口のふちから、幹を下へ・根の先へ
                    elif s.name=='tree':src=lambda K:np.abs(K[:,2]-(zl+0.30*H))<0.02*H   # 御神木：幹のなかほどから、上は枝へ・下は根へ
                    else:src=lambda K:K[:,2]<zl+0.04*H   # 若木：根もとから、枝の先へ
                    cen,g,n=flowfield(q[keep],src)
                    sc.decal(barkpat(cen,g,n));sc.part()   # 木の皮：流れにそった、みぞとすじ
                    for t in q[keep]:sc.tri(t[0],t[1],t[2],BARK[1])
                    sc.decal(None)
                    if cut.any():   # 切り口：いまの絵と同じ、少しゆがんだ年輪（もよう）
                        cq=q[cut].reshape(-1,3);cx,cy=(cq[:,0].max()+cq[:,0].min())/2,(cq[:,1].max()+cq[:,1].min())/2;R=max(cq[:,0].max()-cq[:,0].min(),cq[:,1].max()-cq[:,1].min())/2
                        def ring(x,y,z,cx=cx,cy=cy,R=R):
                            a=math.atan2(y-cy,x-cx);r=math.hypot(x-cx,y-cy)/R*(1+0.05*math.sin(3*a+1)+0.03*math.sin(5*a))
                            if r>0.86:return CUT[0]
                            return CUT[2] if any(abs(r-q_)<0.035 for q_ in(0.16,0.36,0.56,0.74)) else CUT[1]
                        sc.decal(ring);sc.part()
                        for t in q[cut]:sc.tri(t[0],t[1],t[2],CUT[1])
                        sc.decal(None)
                    continue
                if kind=='leaf' and s.name=='tree':   # 葉のかたまり（御神木）
                    if not hasattr(s,'_lc'):s._lc=np.array([s.T(p_).reshape(-1,3).mean(0) for p_,c_,k_ in s.items if k_=='leaf'])
                    m0=q.reshape(-1,3).mean(0);dd=np.sort(np.linalg.norm(s._lc-m0,axis=1))
                    if len(dd)>1 and dd[1]>0.9 or (q.reshape(-1,3).max(0)-q.reshape(-1,3).min(0)).max()<0.12:continue   # はなれて1つだけうかぶ葉（モデルのこぼれ）は描かない：お手本の絵と同じ、小さなまるい葉の玉がかさなる形に作りなおす（lobes）
                    lobes(sc,q,n,len(s._gid));s._gid.append(1);continue
                sc.part()   # 若木の葉・芽：モデルの葉の形のまま
                for t in q:sc.tri(t[0],t[1],t[2],LEAF[1])
        sc.smooth(False)

def shot(M):
    """furn3d と同じ見え方で写し、ゲームの置き方（ax・ay、g64のドット）をきめる：幹の根もと (TX, y, 0) の写る所が、ゲームの (TX, y) に来るように"""
    O.GRAD=True;inf={};im,ex0,base,yb=F3.shot(M,0,info=inf)
    PROJ,E,S_,fw=inf['PROJ'],inf['ext'],inf['S'],inf['fwd']
    gy=FRONT-0.6;u,v=PROJ(fw((TX,gy,0)));px,py=(u-E[0])*S_,(v-E[2])*S_   # 根もとの近くの地面の点
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
