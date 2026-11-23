# クォータービューの、家具・建物・自然の物（H-15）：いまの3Dの設計図を、クォータービューの角度で写しなおす。
# 使い方：python3 tools/art/iso/iso3d.py <出力フォルダ> [設計図...] [--chips]
#   設計図：tools/art/furn3d/items/<名前>.py の名前（statue・nat_tree など）か sacred（御神木の切り株〜御神木）。なければ BATCH1。
#   --chips：チップ（chips.js とアトラス）に、いまと同じ名前で入れかえ、iso:1 の印をつける。落ち影（自然の物 SHADOWS）も :sh を入れかえる。
# 見え方：物を上から見て45度まわし（正面＝南が左下、東が右下を向く）、見おろし48.59度・遠近なし。
#   地面の1マスは 128×96 のひし形（よこ:たて＝4:3。sin48.59＝0.75）。高さは、その角度のとおり（1マスの高さは、マスの1辺の cos48.59＝0.66）。
#   1マスの1辺は 90.51 ドット（128/√2）で写す（ひし形のはばが128になる）。
# かげ・色・あみかけ・輪郭は、それぞれの設計図の設定のまま（furn3d.py・sacred_tripo.py）。かえるのは、まわす角度と見おろしの角度だけ。
# 置き方（iso-obj.js）：ax・ay は、置いたマス（ゲームの BL の sz。向きでかわる）のまん中の地面の点から、絵の左上までのずれ（g64 のドット。左上は −）。
# 向き：左の向きを右の反転にしていた物（>1 があって >3 がない物）は、>3 も写す（クォータービューでは反転しない）。
import sys,os,math,re,json
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
for p in(ART,os.path.join(ART,'furn3d'),os.path.join(ART,'furn3d','items'),os.path.join(ART,'sacred-tree'),os.path.join(ROOT,'tools')):sys.path.insert(0,p)
import numpy as np
from PIL import Image
import oblique3d as O
ISOELEV=math.degrees(math.asin(0.75));ISOANG=45.0;ISOS=128/math.sqrt(2)   # 地面のたては、よこの0.75
ISOKEEP=math.degrees(math.acos(math.cos(math.radians(ISOELEV))*math.sin(math.radians(51.34))))   # persp の大きさ k を1にする角度（地面0.75・高さ0.66 の、ほんとうの見え方）
_persp=O.persp
def persp(elev=51.34,fov=40.0,frame=None,center=(0.5,0.65,0.3),full=False,keep=None):return _persp(ISOELEV,fov,None,center,False,ISOKEEP)
O.persp=persp
_turn=O.Scene.turn
def turn(self,k,foot=None):
    _turn(self,k,foot);f0,dc0=self.fwd,self.dc
    V=np.array([v for t_ in self.t for v in t_[:3]]);x0,y0,x1,y1=V[:,0].min(),V[:,1].min(),V[:,0].max(),V[:,1].max();cx,cy=(x0+x1)/2,(y0+y1)/2
    c,s=math.cos(math.radians(ISOANG)),math.sin(math.radians(ISOANG))
    R=lambda v:np.array([cx+c*(v[0]-cx)-s*(v[1]-cy),cy+s*(v[0]-cx)+c*(v[1]-cy),v[2]])
    self.t=[(R(a),R(b),R(d),col,pid) for a,b,d,col,pid in self.t];self.fwd=lambda v:R(f0(v))
    def inv(f):
        def g(x,y,z):return f(cx+c*(x-cx)+s*(y-cy),cy-s*(x-cx)+c*(y-cy),z)
        return g
    self.dc={pid:inv(f) for pid,f in dc0.items()}
O.Scene.turn=turn
import furn3d as F3
_shot=F3.shot
def shot(M,k,only=None,S_=64,filt=None,info=None):return _shot(M,k,only,ISOS,filt,info)
F3.shot=shot
BATCH1=['statue','statueb','obox','board','sacred','nat_tree','nat_tree_aki','nat_deadtree','nat_rock','nat_boulder','nat_bush']   # 草原で目に入る物から（神殿まわり・御神木・自然の物）
SHADOWS={'nat_tree','nat_tree_aki','nat_deadtree','nat_rock','nat_boulder','nat_bush','sacred'}   # 落ち影も写す物
def bl_sizes():
    """ゲームの BL の大きさ sz（id → (よこ,たて)）"""
    s=open(os.path.join(ROOT,'js','data.js'),encoding='utf8').read();R={}
    for m in re.finditer(r"([A-Za-z_]\w*):\{([^{}]*)\}",s):
        z=re.search(r"\bsz:\[(\d+),(\d+)\]",m.group(2))
        if z:R.setdefault(m.group(1),(int(z.group(1)),int(z.group(2))))
    return R
SZ=bl_sizes()
def base(nm):return re.split(r'[>#@~:.]',nm)[0]
def anchor(inf,nm,k):
    """置いたマスのまん中の地面の点が、写した絵（切る前）のどこに写るか（ドット）。設計図のマスは左上が (0,0)、大きさはゲームの sz"""
    a,b=SZ.get(base(nm),(1,1));P=inf['PROJ'](inf['fwd']((a/2,b/2,0.0)));E=inf['ext'];S_=inf['S']
    return (P[0]-E[0])*S_,(P[1]-E[2])*S_
def add_left(M):
    """>1 があって >3 がない物は、>3（左の向き）も写す"""
    V=list(M.VIEWS);have={v[0] for v in V}
    for v in list(V):
        if '>1' in v[0] and v[0].replace('>1','>3') not in have:V.append((v[0].replace('>1','>3'),3)+tuple(v[2:]))
    M.VIEWS=V
def run_item(iid,out):
    """furn3d の設計図を写し、iso の置き方にする。→ {名前: チップの中身}"""
    M=F3.load(iid);add_left(M)
    if hasattr(M,'ELEV'):M.ELEV=ISOELEV   # 光を画面の向きにする所（sunscreen(ELEV)）も、この角度で
    F3.META.clear();CH=F3.run(iid,os.path.join(out,iid));parts=getattr(F3.run,'parts',{});R={}
    for nm,(im,ax0,ay0) in CH.items():
        bb,inf=F3.META[nm];k=dict((v[0],v[1]) for v in M.VIEWS).get(nm.rsplit('.',1)[0],0);u,v=anchor(inf,nm,k)
        ax,ay=round(bb[0]-u),round(bb[1]-v);dx,dy=ax-ax0,ay-ay0
        c={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':[im],'iso':1}
        fr=getattr(F3.run,'frames',{}).get(nm)
        if fr:c['f']=fr
        if nm in parts:c['parts']=[dict(q,ax=q['ax']+dx,ay=q['ay']+dy,px=q['px']+dx,py=q['py']+dy) for q in parts[nm]]
        R[nm]=c;print('iso',nm,'%dx%d ax %d ay %d'%(im.width,im.height,ax,ay),flush=True)
    if iid in SHADOWS:R.update(shadows(M,R,out))
    return R
def run_sacred(out):   # 落ち影は作らない（御神木は落ち影の描き方を通らない）
    import sacred_tripo as ST
    V,comps=ST.load();R={};SZ['story']=(4,4)
    for name in('stump','bud','leaf','sapling','tree'):
        M=ST.Stage(V,comps,name);im,ax,ay=ST.shot(M)   # ax＝round(TX*64−根もとの点)＋bb（g64、マスの左上から）
        ax-=round(ST.TX*64);ay-=round(ST.TY*64)   # 根もと（4×4のまん中）から
        R[M.ID]={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':[im],'iso':1};print('iso',M.ID,'%dx%d ax %d ay %d'%(im.width,im.height,ax,ay),flush=True)
        im.save(os.path.join(out,'story_'+name+'.png'))
    return R
def shadows(M,R,out,anc=None):
    """落ち影（castshadow.py と同じ作り）を、クォータービューの見え方で。光（natcommon.SUN）は、物といっしょに45度まわす（画面の上で、前と同じ向きに落ちる）"""
    import castshadow as CS
    from PIL import ImageDraw
    from scipy.ndimage import gaussian_filter
    L=np.array(CS.SUN,float);c,s=math.cos(math.radians(ISOANG)),math.sin(math.radians(ISOANG));L=np.array([c*L[0]-s*L[1],s*L[0]+c*L[1],L[2]])
    res={}
    for v_ in M.VIEWS if hasattr(M,'VIEWS') else [(M.ID,0)]:
        nm,k=v_[:2];M.VAR=v_[2] if len(v_)>2 else None
        if nm not in R:continue
        sc,_=F3.scene(M,k);T=np.array([[a,b,c_] for a,b,c_,col,pid in sc.t])
        inf={};F3.shot(M,k,info=inf);P,E,S_=inf['PROJ'],inf['ext'],inf['S']
        a,b=anc or SZ.get(base(nm),(1,1));A=P(inf['fwd']((a if anc else a/2,b if anc else b/2,0.0)))
        G=T-T[...,2:3]/L[2]*L;G[...,2]=0
        Q=np.array([[((P(g)[0]-A[0])*S_,(P(g)[1]-A[1])*S_) for g in t] for t in G])
        x0,y0=int(np.floor(Q[...,0].min()))-1,int(np.floor(Q[...,1].min()))-1;x1,y1=int(np.ceil(Q[...,0].max()))+1,int(np.ceil(Q[...,1].max()))+1
        m=Image.new('L',(x1-x0,y1-y0),0);d=ImageDraw.Draw(m)
        for t in Q:d.polygon([(p-x0,q-y0) for p,q in t],fill=255)
        P_=int(np.ceil(CS.BLUR*3));g=gaussian_filter(np.pad(np.array(m,float)/255,P_),CS.BLUR);x0-=P_;y0-=P_;Hh,Ww=g.shape
        yy,xx=np.mgrid[0:Hh,0:Ww];ck=((xx+x0+yy+y0)%2)==0
        b0,b1,b2,b3=CS.BANDS;lt=((g>=b0)&(g<b1)&ck)|((g>=b1)&(g<b2))|((g>=b2)&(g<b3)&~ck);dk=((g>=b2)&(g<b3)&ck)|(g>=b3)
        o=np.zeros((Hh,Ww,4),np.uint8);o[lt]=CS.SHL;o[dk]=CS.SHD;im=Image.fromarray(o);bx=im.getbbox();im=im.crop(bx)
        res[nm+':sh']={'g':64,'ax':x0+bx[0],'ay':y0+bx[1],'w':im.width,'h':im.height,'f':[im],'iso':1}
        if M.ID in CS.FLIPIDS:res[nm+':shf']=dict(res[nm+':sh'])   # 反転の絵でも、クォータービューでは反転しないので同じ影
        im.save(os.path.join(out,(nm+'_sh').replace('#','_').replace(':','_').replace('>','_')+'.png'))
    return res
def build(out,ids):
    os.makedirs(out,exist_ok=True);R={}
    for iid in ids:R.update(run_sacred(out) if iid=='sacred' else run_item(iid,out))
    D=os.path.join(out,'_chips');os.makedirs(D,exist_ok=True)   # チップの絵（--from で、写しなおさずにチップへ入れる）
    for k,c in R.items():
        for n,im in enumerate(c['f']):im.save(os.path.join(D,safe(k)+'_%d.png'%n))
    json.dump({k:{q:v for q,v in c.items() if q not in('f','parts')}|{'n':len(c['f'])} for k,c in R.items() if not c.get('parts')},open(os.path.join(out,'_info.json'),'w'),ensure_ascii=False)
    return R
def safe(k):import hashlib;return re.sub(r'[^0-9A-Za-z~@_-]','_',k)+'_'+hashlib.md5(k.encode()).hexdigest()[:6]   # ファイルの名前（tree:sh と tree_sh がぶつからないように）
def load_out(out):
    """build で書いた絵と _info.json から、チップの中身を作りなおす（写しなおさない）"""
    I=json.load(open(os.path.join(out,'_info.json'),encoding='utf8'));D=os.path.join(out,'_chips');R={}
    for k,c in I.items():n=c.pop('n');R[k]=dict(c,f=[Image.open(os.path.join(D,safe(k)+'_%d.png'%i)).convert('RGBA') for i in range(n)])
    return R
def to_chips(R):
    import chips as CHP
    head,C=CHP.load_imgs();C.update(R);CHP.pack_imgs(head,C)
    open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(R));print('チップに入れた',len(R))
if __name__=='__main__':
    a=[q for q in sys.argv[1:] if not q.startswith('--')];R=load_out(a[0]) if '--from' in sys.argv else build(a[0],a[1:] or BATCH1)
    if '--chips' in sys.argv:to_chips(R)
