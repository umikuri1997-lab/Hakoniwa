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
BARK=[(236,186,140),(216,160,118),(190,134,98)]
CUT=[(248,226,186),(238,210,166),(222,190,146)]
LEAF=[(216,236,140),(178,214,106),(140,188,88)]
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
LEAFS=0.20    # 葉のならぶ間かく（マス）
def _h(i,j,k):
    n=(i*73856093)^(j*19349663)^(k*83492791);n=(n^(n>>13))*1274126177&0xffffffff;return ((n&0xffff)/65535.0,((n>>16)&0xffff)/65535.0)
def _leaf(u,v,cu,cv,ang,L):
    """1まいの葉（先のとがった、たまごの形）の中か。中なら、葉のすじからどちらがわか（+ が左上）"""
    c,s_=math.cos(ang),math.sin(ang);du,dv=u-cu,v-cv;a=du*c+dv*s_;b=-du*s_+dv*c   # a：葉ののびる向き
    t=a/L
    if not -0.5<=t<=0.5:return None
    w=0.36*L*math.sin(math.pi*(t+0.5))**0.8*(1.15-0.3*t)   # 根もとが丸く、先がとがる
    return b/w if abs(b)<w else None
def leafpat(x,y,z):
    """葉の柄：画面の上での場所（よこ x・たて z−0.75y）に、葉を1まいずつ、ばらばらの向き・大きさで、すきまをあけて置く。
    葉の左上がわは明るく、右下がわはふつう、葉のすぐ右下にかげ。葉のない所は、かたまりの色のまま（かげの段は形から）"""
    u=x/LEAFS;v=-(z-0.75*y)/LEAFS;iu,iv=math.floor(u),math.floor(v);sh=False
    for dj in(1,0,-1):
        for di in(1,0,-1):
            i,j=iu+di,iv+dj;a,b=_h(i,j,7);a2,b2=_h(i,j,11)
            if a2>0.62:continue   # 葉のないマス（ならびが目立たないように）
            cu=i+0.25+0.5*a;cv=j+0.25+0.5*b;ang=(b2-0.5)*2.0+(-0.6 if a>0.5 else 0.6);L=0.85+0.4*a2
            r=_leaf(u,v,cu,cv,ang,L)
            if r is not None:return LEAF[0] if r<0.15 else LEAF[1]
            if _leaf(u-0.10,v-0.14,cu,cv,ang,L) is not None:sh=True   # 葉のかげ（右下に少しずらした所）
    return LEAF[2] if sh else LEAF[1]
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
        sc.smooth(True)
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
                    sc.texture(BARKTEX());sc.part();sc.txax[sc.pid]=np.array([0,0,1.0])   # 木の皮：皮のテクスチャ（ambientCG Bark001）で、たてのすじ
                    LB=[(lo+(hi-lo)*0.18,hi-(hi-lo)*0.18) for lo,hi in s.leafbox()]   # 葉のかたまりの中（ふちから少し内がわ）
                    for t,ct in zip(q,cut):
                        m_=t.mean(0)
                        if ct or any((m_>lo).all() and (m_<hi).all() for lo,hi in LB):continue   # 葉のかたまりをつきぬけた枝のさきは描かない（モデルでは葉の中から茶色の点が出ていた）
                        sc.tri(t[0],t[1],t[2],BARK[1])
                    sc.texture(None)
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
                sc.decal(leafpat if kind=='leaf' else None);sc.part()   # 葉：小さな葉がかさなる柄（leafpat）。かたまりの明るい・暗いは、かげの段で
                for t in q:sc.tri(t[0],t[1],t[2],LEAF[1])
                sc.decal(None)
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
