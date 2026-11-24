# クォータービューの、家具・建物・自然の物（H-15）：いまの3Dの設計図を、クォータービューの角度で写しなおす。
# 使い方：python3 tools/art/iso/iso3d.py <出力フォルダ> [設計図...] [--chips]
#   設計図：tools/art/furn3d/items/<名前>.py の名前（statue・nat_tree など）か sacred（御神木の切り株〜御神木）。なければ BATCH1。
#   --chips：チップ（chips.js とアトラス）に、いまと同じ名前で入れかえ、iso:1 の印をつける。落ち影（自然の物 SHADOWS）も :sh を入れかえる。
# 見え方：物を上から見て45度まわし（正面＝南が左下、東が右下を向く）、見おろし48.59度・遠近なし。
#   地面の1マスは 128×96 のひし形（よこ:たて＝4:3。sin48.59＝0.75）。高さは、マスの1辺の0.8（72ドット。ほんとうの見え方の0.66より高く。持ち主がきめた）。
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
import natcommon;natcommon.ISO=True   # 自然の物の、クォータービューだけの形（nat_tree の LIFT）
ISOS=128/math.sqrt(2);ISOANG=45.0   # 1マスの1辺（ひし形のはばが128）
ISOH=72/ISOS   # 1マスの高さは、マスの1辺の0.8（g64 で72ドット＝ゲームの IQL 36。持ち主がきめた）
ISOLIGHT=math.degrees(math.asin(0.75))   # ほんとうのカメラの見おろし（地面のたては、よこの0.75）。光の向き（sunscreen）はこの角度
ISOELEV=math.degrees(math.atan(0.75/ISOH));ISOK=0.75/math.sin(math.radians(ISOELEV))   # 地面0.75・高さ ISOH になる、写す角度と大きさ（画面の上下だけ ISOK 倍）
ISOKEEP=math.degrees(math.acos(ISOH*math.sin(math.radians(51.34))))   # persp の大きさ k を ISOK にする角度（高さの画面の長さが ISOH）
_persp=O.persp
def persp(elev=51.34,fov=40.0,frame=None,center=(0.5,0.65,0.3),full=False,keep=None):return _persp(ISOELEV,fov,None,center,False,ISOKEEP)
O.persp=persp
_turn=O.Scene.turn
def turn(self,k,foot=None):
    _turn(self,k,foot);f0,dc0=self.fwd,self.dc
    V=np.array([v for t_ in self.t for v in t_[:3]]);x0,y0,x1,y1=foot if foot else (V[:,0].min(),V[:,1].min(),V[:,0].max(),V[:,1].max());cx,cy=(x0+x1)/2,(y0+y1)/2   # foot（置く物の床の範囲）があれば、そのまん中でまわす（上にのせる物で、まわす中心がずれない。cooktop.py）
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
SKIP={'kabebukuro','wreath','wshelf','nat_eda','g_w_acorn','g_w_clover','g_w_shelf','g_w_stump'}   # 壁にかける物（H-14 の iso:win）・落とし物の枝（物の絵ではない）・トリポの _t がある前の限定の家具
BATCH2=['crate','bed','wbench','loom','taru','chair','table']   # はじめの家具
BATCH1=['statue','statueb','obox','board','altar','sacred','nat_tree','nat_tree_aki','nat_deadtree','nat_rock','nat_boulder','nat_bush']   # 草原で目に入る物から（神殿まわり・御神木・自然の物）
WBUP=10
SHADOWS={'nat_tree','nat_tree_aki','nat_deadtree','nat_rock','nat_boulder','nat_bush','sacred'}   # 落ち影も写す物
def bl_sizes():
    """ゲームの BL の大きさ sz（id → (よこ,たて)）。BL は1行に1つ（中に {} がある行も、その行の中の sz を見る）"""
    R={}
    for ln in open(os.path.join(ROOT,'js','data.js'),encoding='utf8'):
        m=re.match(r"\s*([A-Za-z_]\w*):\{",ln);z=m and re.search(r"\bsz:\[(\d+),(\d+)\]",ln)
        if z:R.setdefault(m.group(1),(int(z.group(1)),int(z.group(2))))
    return R
SZ=bl_sizes()
def base(nm):return re.split(r'[>#@~:.]',nm)[0]
SZN={'site:s1':(1,1),'site:s2':(2,1),'site:s2d':(2,2),'site:s2t':(2,1),'site:s3':(1,1)}   # 足場：建てる物の大きさ（siteKey・siteSpan。s2t は風車の1マスの足場で、絵はそのマスから左右へ半マスずつ＝設計図の2マスのまん中。s3 は神殿の1マス）
def szof(nm):
    for k,v in SZN.items():
        if nm==k or nm.startswith(k+'#') or nm.startswith(k+'>'):return v
    return SZ.get(base(nm),(1,1))
FOOTOFF={'wbench':[(0.5,0),(0,0.5),(-0.5,0),(0,-0.5)]};FOOTOFF['wbwork']=FOOTOFF['wbench']   # 絵は1マス（設計図のマス）で、置く所はもっと大きい物：向きごとの、置く所のまん中の、設計図のマスのまん中からのずれ（ゲームの wbCells）
def anchor(inf,nm,k):
    """置いたマスのまん中の地面の点が、写した絵（切る前）のどこに写るか（ドット）。設計図のマスは左上が (0,0)、大きさはゲームの sz"""
    a,b=szof(nm);f=inf['fwd']
    if base(nm) in FOOTOFF:
        A=f((0.5,0.5,0.0));ox,oy=FOOTOFF[base(nm)][k%4];c=s=math.sqrt(0.5);q=np.array([A[0]+c*ox-s*oy,A[1]+s*ox+c*oy,A[2]])
    else:q=f((a/2,b/2,0.0))
    P=inf['PROJ'](q);E=inf['ext'];S_=inf['S']
    return (P[0]-E[0])*S_,(P[1]-E[2])*S_
def rots():
    """ゲームの向きの数 ROTS（js/world.js）"""
    m=re.search(r"const ROTS=\{([^}]*)\}",open(os.path.join(ROOT,'js','world.js'),encoding='utf8').read())
    return {k:int(v) for k,v in re.findall(r"(\w+):(\d+)",m.group(1))} if m else {}
ROTN=rots()
def add_left(M):
    """向きが4つ（ROTS 4）で、>1 があって >3 がない物は、>3（左の向き）も写す。向き3つ（前・右・左）の物の左は、まだ（反転のまま）"""
    V=list(M.VIEWS);have={v[0] for v in V}
    if ROTN.get(M.ID)==3:   # 向き3つ（前・右・左）：左（r 2）は >2 の名前で、左を向いた絵（k 3）
        for v in list(V):
            if '>1' in v[0] and v[0].replace('>1','>2') not in have:V.append((v[0].replace('>1','>2'),3)+tuple(v[2:]))
        M.VIEWS=V;return
    if ROTN.get(M.ID)!=4:return
    for v in list(V):
        if '>1' in v[0] and v[0].replace('>1','>3') not in have:V.append((v[0].replace('>1','>3'),3)+tuple(v[2:]))
    M.VIEWS=V
def run_item(iid,out):
    """furn3d の設計図を写し、iso の置き方にする。→ {名前: チップの中身}"""
    M=F3.load(iid);add_left(M)
    if M.ID=='wbwork':M.VIEWS=list(M.VIEWS)+[('wbwork>%d#%d'%(k,v),k,v) for k in(1,2,3) for v in range(3)]   # 作業台の上の形：作業台の4つの向きごとに（作業台と同じだけまわす）
    if hasattr(M,'ELEV'):M.ELEV=ISOLIGHT   # 光を画面の向きにする所（sunscreen(ELEV)）は、ほんとうのカメラの角度で
    F3.META.clear();CH=F3.run(iid,os.path.join(out,iid));parts=getattr(F3.run,'parts',{});R={}
    for nm,(im,ax0,ay0) in CH.items():
        bb,inf=F3.META[nm];k=dict((v[0],v[1]) for v in M.VIEWS).get(nm.rsplit('.',1)[0],0);u,v=anchor(inf,nm,k)
        ax,ay=round(bb[0]-u),round(bb[1]-v);dx,dy=ax-ax0,ay-ay0
        c={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':[im],'iso':1}
        fr=getattr(F3.run,'frames',{}).get(nm)
        if fr:c['f']=fr
        if nm in parts:c['parts']=[dict(q,ax=q['ax']+dx,ay=q['ay']+dy,px=q['px']+dx,py=q['py']+dy) for q in parts[nm]]
        if base(nm) in('wbench','wbwork'):c['ay']-=WBUP   # 作業台の絵は、写した位置より10ドット上（CLAUDE.md の WBUP）
        if nm in getattr(M,'CUT',()):   # すわった子の足をかくす行：いまのチップの数のまま（せいれいは、いままでの立てる形で描くので）
            import chips as CHP
            old=CHP.load_imgs()[1].get(nm)
            if old and 'cut' in old:c['cut']=old['cut']
        R[nm]=c;print('iso',nm,'%dx%d ax %d ay %d'%(im.width,im.height,ax,ay),flush=True)
    import chips as CHP
    if not hasattr(run_item,'old'):run_item.old=CHP.load_imgs()[1]
    if any(nm+':sh' in run_item.old for nm in R):R.update({k:v for k,v in shadows(M,R,out).items() if k in run_item.old or re.sub(r'#\d+(?=:)','',k) in run_item.old})   # 落ち影：いま落ち影のある物だけ（足したならび #n は、もとの物に落ち影があれば）
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
def run_crate(out):
    """木箱（tools/art/crate3d）：4つの向き・ふたの開くコマ #o1〜#o3・中身のだん #f<だん>o<コマ>（crate3d.py と同じ名前と組み方）"""
    sys.path.insert(0,os.path.join(ART,'crate3d'));import crate_parts as C
    from blueprint import build as B
    import furntone
    L=C.parts();LIDANG=[0,35,70,105];R={}
    PROJ,DEPTH=O.persp(38,10,1,((C.X0+C.X1)/2,(C.Y0+C.Y1)/2,C.ZT/2),keep=42)
    def scene(k,ang,lv):
        sc=O.Scene();T=O.Tex(os.path.join(ART,'textures','wood049.png'));sc.texture(T);lid=set()
        for p in L:
            if C.INNER(p.name):sc.outline(0)
            p0=sc.pid;B(sc,[p]);sc.outline()
            if C.LIDP(p.name):lid|=set(range(p0+1,sc.pid+1))
        C.contents(sc,lv);sc.texture(T)
        if ang:
            t=np.radians(ang);ct,st=np.cos(t),np.sin(t)
            def Rt(v):dy,dz=v[1]-C.Y0,v[2]-C.ZT;return np.array([v[0],C.Y0+dy*ct-dz*st,C.ZT+dy*st+dz*ct])
            sc.t=[(Rt(a_),Rt(b_),Rt(c_),col,pid) if pid in lid else (a_,b_,c_,col,pid) for a_,b_,c_,col,pid in sc.t]
        sc.turn(k,(C.X0,C.Y0,C.X1,C.Y1));return sc
    for lv in range(4):
        for k,nm in enumerate(['crate','crate>1','crate>2','crate>3']):
            r0=C.REST[lv]
            for f in range(4):
                if lv and not f:continue   # 中身のあるしまった絵は、空のしまった絵と同じ（crate3d.py と同じ）
                ang=r0+(LIDANG[-1]-r0)*f/3;sc=scene(k,ang,lv)
                V=np.array([v for t in sc.t for v in t[:3]]);P=np.array([PROJ(v) for v in V]);m=2/64
                ext=(P[:,0].min()-m,P[:,0].max()+m,P[:,1].min()-m,P[:,1].max()+m);O.S=ISOS
                im=O.render_px(sc,PROJ,ext,DEPTH,k=0.72,lw=2);im=furntone.tone(im,world=furntone.worldlight(42));bb=im.getbbox();im=im.crop(bb)
                A=PROJ(sc.fwd((0.5,0.5,0.0)));u,v=(A[0]-ext[0])*ISOS,(A[1]-ext[2])*ISOS
                cid=nm+('#f%d'%lv+('o%d'%f if f else '') if lv else ('#o%d'%f if f else ''))
                R[cid]={'g':64,'ax':round(bb[0]-u),'ay':round(bb[1]-v),'w':im.width,'h':im.height,'f':[im],'iso':1};print('iso',cid,im.size,R[cid]['ax'],R[cid]['ay'],flush=True)
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
        a,b=anc or szof(nm);A=P(inf['fwd']((a if anc else a/2,b if anc else b/2,0.0)))
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
# ---- 洞窟（cave_tex.py を通る物）----
# かべの帯（cave_cols・cave_ccols）：帯の3Dを、この見え方で写し、左の面（南の面）の、1だん（高さ1）・4マスぶんを、マスごとの面の絵にならべる（256×120、g64）。
#   マス n の面の絵は、そのマスの面の左上（x=2+n・y=FACEY・高さ1）から、よこ64・たて120ドット（ゲームの cvqFace の絵と同じわく）。右の面は、ゲームで左右反対にして使う。
#   こさの番号にして（cave_tex.tone）、岩の上のふちより下で、面の中のすきまは、いちばん暗いこさでうめる。
# 水晶・岩の段・下へおりる穴（TONED）：ふつうに写して、こさの番号にする（ゲームで階ごとの色にぬる）。
FACEY=0.8   # 帯の岩の、手前の面（かべのマスの面にあわせる所）
CAVE_BAND={'cave_cols':'cave:cols','cave_ccols':'cave:ccols'}
def cave_tex():
    sys.path.insert(0,os.path.join(ART,'cave'));import cave_tex as CT;return CT
def run_band(iid,out):
    CT=cave_tex();M=F3.load(iid);F3.META.clear();CH=F3.run(iid,os.path.join(out,iid));nm=M.VIEWS[0][0];im=CH[nm][0];bb,inf=F3.META[nm]
    A=np.asarray(im.convert('RGBA'));P,E,S_=inf['PROJ'],inf['ext'],inf['S']
    def scr(p):q=P(inf['fwd'](p));return (q[0]-E[0])*S_-bb[0],(q[1]-E[2])*S_-bb[1]
    at=np.zeros((120,256,4),np.uint8)
    for n in range(4):
        tx,ty=scr((2+n,FACEY,1.0))
        for dv in range(120):
            for du in range(64):
                X,Y=int(round(tx+du)),int(round(ty+dv))
                if 0<=X<A.shape[1] and 0<=Y<A.shape[0]:at[dv,n*64+du]=A[Y,X]
    o=CT.tone(at).astype(np.uint8)
    for c in range(256):
        du=c%64;r0=max(0,int(round(du*0.75))-2);r1=min(120,int(round(du*0.75))+74);o[:r0,c,3]=0;o[r1:,c,3]=0   # 面のわくの外はすかす（ゲームのドットの丸めで、ふちが1ドットずれても、すきまが出ないよう、上下2ドットのゆとり）
        ys=np.nonzero(o[r0:r1,c,3]>0)[0]
        if len(ys):m=o[r0+ys[0]:r1,c,3]==0;o[r0+ys[0]:r1,c][m]=[CT.LV[1],CT.LV[1],CT.LV[1],255]
    img=Image.fromarray(o,'RGBA');img.save(os.path.join(out,iid,iid+'_face.png'))
    return {CAVE_BAND[iid]:{'g':64,'ax':0,'ay':0,'w':256,'h':120,'f':[img]}}
def tone_cave(R):
    """TONED の物（cave_tex.py）：こさの番号にして、ゲームのチップの名前に"""
    CT=cave_tex();inv={f:k for k,f in CT.TONED.items()}
    for f,k in inv.items():
        if f in R:c=R.pop(f);c['f']=[Image.fromarray(CT.tone(np.asarray(i.convert('RGBA'))).astype(np.uint8),'RGBA') for i in c['f']];R[k]=c
    return R
def build(out,ids):
    os.makedirs(out,exist_ok=True);R={}
    bad=[]
    for iid in ids:   # 1つがこわれても、つづける（こわれた物は _bad.txt に）
        try:R.update(run_sacred(out) if iid=='sacred' else run_crate(out) if iid=='crate' else run_band(iid,out) if iid in CAVE_BAND else tone_cave(run_item(iid,out)))
        except Exception as e:
            import traceback;traceback.print_exc();bad.append(iid)
    if bad:open(os.path.join(out,'_bad.txt'),'w').write('\n'.join(bad));print('写せなかった物',bad)
    D=os.path.join(out,'_chips');os.makedirs(D,exist_ok=True)   # チップの絵（--from で、写しなおさずにチップへ入れる）
    for k,c in R.items():
        for n,im in enumerate(c['f']):im.save(os.path.join(D,safe(k)+'_%d.png'%n))
        for pi,q in enumerate(c.get('parts') or []):
            for n,im in enumerate(q['f']):im.save(os.path.join(D,safe(k)+'_p%d_%d.png'%(pi,n)))
    json.dump({k:{q:v for q,v in c.items() if q not in('f','parts')}|{'n':len(c['f'])}|({'parts':[{a:b for a,b in q.items() if a!='f'}|{'n':len(q['f'])} for q in c['parts']]} if c.get('parts') else {}) for k,c in R.items()},open(os.path.join(out,'_info.json'),'w'),ensure_ascii=False)
    return R
def safe(k):import hashlib;return re.sub(r'[^0-9A-Za-z~@_-]','_',k)+'_'+hashlib.md5(k.encode()).hexdigest()[:6]   # ファイルの名前（tree:sh と tree_sh がぶつからないように）
def load_out(out):
    """build で書いた絵と _info.json から、チップの中身を作りなおす（写しなおさない）"""
    I=json.load(open(os.path.join(out,'_info.json'),encoding='utf8'));D=os.path.join(out,'_chips');R={}
    for k,c in I.items():
        n=c.pop('n');R[k]=dict(c,f=[Image.open(os.path.join(D,safe(k)+'_%d.png'%i)).convert('RGBA') for i in range(n)])
        for pi,q in enumerate(R[k].get('parts') or []):m=q.pop('n');q['f']=[Image.open(os.path.join(D,safe(k)+'_p%d_%d.png'%(pi,i))).convert('RGBA') for i in range(m)]
    return R
def to_chips(R):
    import chips as CHP
    head,C=CHP.load_imgs();C.update(R);CHP.pack_imgs(head,C)
    open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(R));print('チップに入れた',len(R))
if __name__=='__main__':
    a=[q for q in sys.argv[1:] if not q.startswith('--')];R=load_out(a[0]) if '--from' in sys.argv else build(a[0],(BATCH2 if a[1:]==['BATCH2'] else a[1:]) or BATCH1)
    if '--chips' in sys.argv:to_chips(R)
