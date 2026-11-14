# 家具を、設計図（items/<id>.py）から3Dに組んで、ゲームと同じ見え方のドット絵に写す（スキル model3d-pixel）。木箱 tools/art/crate3d と同じやり方。
# 使い方：python3 tools/art/furn3d/furn3d.py <id> <出力フォルダ> [--chips]
#   見え方：見おろし42度・左右は平行で奥行きだけ遠近（画角10度・1マスぶん、oblique3d.persp）。
#   出す物：<chip>.png（向きごと）・<chip>_x10.png・views_x4.png（向きをならべた4倍）・cmp_x4.png（いまのチップとならべた4倍）・bp.png（設計図）
#   --chips：ゲームのチップ（chips.js とアトラス）に入れ、.chips_changed に id を書く。
# items/<id>.py に書く物：
#   ID（チップの名前）・PARTS()（blueprint.Part の表。木目をはらない部品は p.tex=False、金属の部品は p.metal=True、布・砂のなだらかな部品は p.soft=True（ゆるいふくらみにも、かげがつく）・うすいかげだけの部品は p.soft1=True・サテンの布（つやのある布）は p.satin=True・石の部品は p.stone=True（石のテクスチャ）・べつのテクスチャをはる部品は p.texobj=oblique3d.Tex(...)・しっくいの部品は p.plaster=True（しっくいのテクスチャ）・金属の板は p.mtex=True（金属のテクスチャ）・レンガの部品は p.brick=True（こまかい、ざらざらしたテクスチャ）・光る部品（火・あかりのガラス）は p.glow=True（かげをつけない）・面のもようは p.decal=f(x,y,z)→色・ひくいドームなど、なだらかなふくらみは p.curve=True（かげのグラデーションを出す）・輪郭線をうすくする部品は p.olk=0.86（もとの色にかける数）)・EXTRA(sc)（Part で書けない形。なければ書かない）
#   VIEWS=[(チップの名前, まわす数k), ...]（k：0前・1右・2後ろ・3左）・BOTTOM（絵の下のはし。g64のドット。いまのチップに合わせる）
#   SZ=(よこ,たて)（置くマスの数。2×1 の物は (2,1)。たてにした向きを、置いたマスから下へのびる所に写す）
#   FRAMES=n（うごく絵のコマの数。PARTS・EXTRA は M.FR（0〜n−1）を見て、動く所だけかえる）
#   PFIRE=[(cx,cy,z0,高さ,根もとの半径,粒の数,seed), ...]（粒の火とけむり。FRAMES のコマでループする。本体は1回だけ写す）
#   PFIRE の8つめ（なくてよい）：{'smoke':けむりの粒の数か False,'sparks':False}。PSMOKE=[(x,y,z,高さ,半径,粒の数,seed)]（けむりだけ。煙突など）
#   PWATER(sc_info)=関数（粒の水。FRAMES のコマでループ。M.FR を見て、粒の一覧 [(x,y,z,半径,色,奥へ描く順)] をかえす）。本体もコマごとに写す（水面のさざなみ）
#   PFIRE_HIDE=部品の名前を見る関数（粒の火が、そのうしろにかくれる部品。ほかの部品には、火を上にかさねる。なければ、ぜんぶ）
#   MERGE=n（にた色をまとめるさかい。色の数が多いとき）
#   PARALLEL=True（奥行きのない物。遠近をかけずに写す）
#   OUTERK=True か数（まわりのふちの輪郭線は、部品の olk でうすくしない。目地の線だけうすくするとき。数なら、まわりの線の色＝となりの色×その数）
#   POUT=k（粒（PWATER）のかたまりのまわりに、粒の色×k の1ドットの輪郭線を引く）
#   CONTRAST=c（ぬった色のコントラストを c 倍に上げる。輪郭線は、そのあとの色から作るので、線はこくならない）
#   FULLPERSP=True（左右にも、上下と同じ遠近をかける。まるい池など、奥行きだけの遠近ではたまごの形になる物）
#   MOVE={チップの名前: {'sel':部品の名前を見る関数, 'pivot':(x,y,z)}}（動く部品より手前の本体は、奥行きをくらべて、動く部品の上に重ねる絵を自動で作る）（動く部品。本体の絵からのぞいて、べつの絵 parts にし、のびちぢみ・回る支点 px・py をつける。ゲームの PARTMV で動かす）
#   FRONT={チップの名前: 部品の名前を見る関数}（せいれいの手前にかさねる絵 .front。その向きで、その部品だけを写す）
import sys,os,importlib
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
sys.path.insert(0,ART);sys.path.insert(0,os.path.join(HERE,'items'))
import numpy as np
from PIL import Image
import oblique3d as O
from blueprint import build,blueprint,check
ROUND={'egg','tongue','log','frust','lathe','cyl','ball','tube','rope','ring','loft','wheel','logy','maki','model','cone'}   # まるい物（GRAD のとき、なめらかなかげ）
ELEV,FOV,FRAME=42,10,1   # 見おろしの角度・画角・画角に入れる範囲（マス）。木箱と同じ
LW=2   # 輪郭線のはば（持ち主がきめた：2ドット）
def load(iid):return importlib.import_module(iid)
PN={}
def scene(M,k,only=None,filt=None,foot=None):
    sc=O.Scene();T=O.Tex(os.path.join(ART,'textures','wood049.png'));TS=O.Tex(os.path.join(ART,'textures','rock030.png'),span=1.0,flow=2,minrun=2,dark=(0.16,0.92),light=(0.14,1.06));TB=O.Tex(os.path.join(ART,'textures','rock030.png'),span=0.5,flow=1,minrun=1,dark=(0.18,0.90),light=(0.12,1.07));TP=O.Tex(os.path.join(ART,'textures','plaster001.png'),span=2.0,flow=3,minrun=3,dark=(0.18,0.96),light=(0.16,1.03));TMT=O.Tex(os.path.join(ART,'textures','metal032.png'),span=1.0,flow=3,minrun=2,dark=(0.16,0.94),light=(0.14,1.05));L=[p for p in M.PARTS() if not filt or filt(p.name)];keep=set()   # filt：写す部品をえらぶ（動く部品だけ・動く部品のほか）   # TS：石の部品（p.stone）のテクスチャ
    for p in L:
        mt=getattr(p,'metal',False);sc.texture(getattr(p,'texobj',None) or (TP if getattr(p,'plaster',False) else TMT if getattr(p,'mtex',False) else (TB if getattr(p,'brick',False) else TS if getattr(p,'stone',False) else T) if getattr(p,'tex',True) or getattr(p,'brick',False) and not mt else None));sc.material('metal' if mt else 'satin' if getattr(p,'satin',False) else 'flat' if getattr(p,'glow',False) or getattr(p,'flat',False) else 'soft1' if getattr(p,'soft1',False) else 'soft' if getattr(p,'soft',False) else None);p0=sc.pid;sc.decal(getattr(p,'decal',None));sc.smooth(O.GRAD and p.kind in ROUND);sc.curve(getattr(p,'curve',False));sc.outline(None,getattr(p,'olk',None));build(sc,[p]);sc.outline();sc.material(None);sc.decal(None);sc.smooth(False);sc.curve(False)
        if only and only(p.name):keep|=set(range(p0+1,sc.pid+1))
        for q in range(p0+1,sc.pid+1):PN[q]=p.name   # 部品の番号 → 名前（粒の火で、かくれる物をえらぶ）
    if hasattr(M,'EXTRA') and not filt:sc.texture(None);M.EXTRA(sc)
    sc.texture(None)
    if foot is None:V=np.array([v for t in sc.t for v in t[:3]]);foot=(V[:,0].min(),V[:,1].min(),V[:,0].max(),V[:,1].max())
    sc.turn(k,foot);sc.foot=foot;return sc,keep
def shot(M,k,only=None,S_=64,filt=None,info=None):
    sc,keep=scene(M,k,only);V=np.array([v for t in sc.t for v in t[:3]])   # 見え方（中心・はんい）は、いつも、ぜんぶの部品からきめる（動く部品と本体の絵の場所をそろえる）
    if filt:sc,keep=scene(M,k,only,filt,foot=sc.foot)   # まわす中心も、ぜんぶの部品の床の範囲で
    c=((V[:,0].min()+V[:,0].max())/2,(V[:,1].min()+V[:,1].max())/2,V[:,2].max()/2)
    PROJ,DEPTH=O.persp(ELEV,FOV,None if getattr(M,'PARALLEL',False) else FRAME,c,full=getattr(M,'FULLPERSP',False))   # FULLPERSP：左右にも上下と同じ遠近   # PARALLEL：奥行きのない物（リース・のれんなど）は、遠近をかけない（平行投影）
    P=np.array([PROJ(v) for v in V]+[PROJ(sc.fwd(q)) for q in pfire_box(M)+list(getattr(M,'PBOX',()))]);m=2/64;ext=(P[:,0].min()-m,P[:,0].max()+m,P[:,1].min()-m,P[:,1].max()+m);O.S=S_
    im=O.render_px(sc,PROJ,ext,DEPTH,k=0.80 if O.GRAD else 0.72,lw=LW,k2=0.90 if O.GRAD else 0.86,merge=getattr(M,'MERGE',6 if O.GRAD else 12),outerk=getattr(M,'OUTERK',False),contrast=getattr(M,'CONTRAST',0))   # CONTRAST：輪郭線を作る前の色にかける   # OUTERK：まわりのふちは、部品の olk でうすくしない   # MERGE：にた色をまとめるさかい（設計図でかえられる）   # GRAD：にた色をまとめるさかいを小さく（グラデーションの段をのこす）   # GRAD の家具は、輪郭線もやわらかい色（持ち主がきめた）
    if only:   # その部品だけ（ほかの部品のドットは消す。輪郭線もふくめて、その部品のまわり1ドットまで）
        full=np.array(im);ids=O.LAST_IDS
        from scipy.ndimage import binary_dilation;mk=binary_dilation(np.isin(ids,list(keep)))
        full[~mk]=0;im=Image.fromarray(full)
    yb=V[:,1].max();base=(PROJ((c[0],yb,0))[1]-ext[2])*S_
    if info is not None:info.update(PROJ=PROJ,ext=ext,S=S_,fwd=sc.fwd,depth=DEPTH)
    return im,round(ext[0]*S_),base,yb   # yb：いちばん手前の地面（マス）。向きをかえると、かわる
def pfire_box(M):   # 粒の火のとどく、はんい（見え方のはんいに入れる）
    out=[]
    for cx,cy,z0,H,R,N,seed,*_ in list(getattr(M,'PFIRE',()))+[(x,y,z,Hs,Rs,0,0) for x,y,z,Hs,Rs,Ns,sd in getattr(M,'PSMOKE',())]:out+=[(cx-R*1.6,cy,z0),(cx+R*1.6,cy,z0),(cx,cy,z0+H*1.9),(cx+R*1.8,cy,z0+H*1.9)]
    return out
FIRECOL=[(0.30,(255,230,96)),(0.46,(255,198,74)),(0.66,(255,152,60)),(0.84,(238,100,52))]   # 粒の年（0〜1）ごとの色：まん中の黄色 → こがね色 → だいだい → 赤み。それより年をとった粒は消える（持ち主：中心は黄色）
SMOKECOL=[(0.35,(176,170,168)),(0.7,(196,192,190)),(1.0,(214,212,210))]   # けむりの色：上がるほど、うすい灰色
def pdraw(im,inf,zb,P,pout=None):
    """粒をかさねる（粒の水など）。P=[(x,y,z,半径,色,順)]。順の大きい粒から描く。3Dの物より手前のドットだけ。
    pout：粒のかたまりのまわり（上下左右で、粒でないドット）に、となりの粒の色×pout の1ドットの輪郭線を引く（コケ・草むら）"""
    a=np.array(im).copy();PROJ,E,S_,fw,dep=inf['PROJ'],inf['ext'],inf['S'],inf['fwd'],inf['depth'];Hh,Ww=a.shape[:2];pm=np.zeros((Hh,Ww),bool)
    for x,y,z,r,c,o in sorted(P,key=lambda q:-q[5]):
        q=fw((x,y,z));u,v=PROJ(q);px,py=(u-E[0])*S_,(v-E[2])*S_;zp=float(np.dot(q,dep));rp=max(0.5,r*S_)
        for yy in range(int(py-rp),int(py+rp)+1):
            for xx in range(int(px-rp),int(px+rp)+1):
                if not(0<=yy<Hh and 0<=xx<Ww):continue
                if (xx+0.5-px)**2+(yy+0.5-py)**2>rp*rp:continue
                if a[yy,xx,3]>0 and zb[yy,xx]>zp:continue
                a[yy,xx]=(*c,255);pm[yy,xx]=True
    if pout:
        pc=a[...,:3].astype(float).copy();ring=np.zeros((Hh,Ww),bool);rc=np.zeros((Hh,Ww,3))
        for dy,dx in((0,1),(0,-1),(1,0),(-1,0)):
            sm=np.roll(np.roll(pm,dy,0),dx,1);sc_=np.roll(np.roll(pc,dy,0),dx,1)
            if dy==1:sm[0]=False
            if dy==-1:sm[-1]=False
            if dx==1:sm[:,0]=False
            if dx==-1:sm[:,-1]=False
            new=sm&~pm&~ring;rc[new]=sc_[new];ring|=new
        a[ring,:3]=np.clip(rc[ring]*pout,0,255).astype(np.uint8);a[ring,3]=255
    return Image.fromarray(a)
def pfire(M,im,inf,zb,f,NF):
    """粒（パーティクル）の火：火の根もとから、粒が上がりながら、まん中へよって、小さくなり、色が白→黄→だいだい→赤とかわって消える。
    粒ごとの年は (コマ/NF + 生まれる時) を1でわったあまり（コマがひとまわりすると、もとにもどる＝ループ）。
    はなれて高く上がる小さな火の粉も。粒は、3Dの物より手前のときだけ描く（奥行き LAST_ZB とくらべる）。古い粒（赤）から先に描き、若い粒（白っぽい黄）を上に"""
    import random
    hid=getattr(M,'PFIRE_HIDE',lambda n:True);hide=lambda q:q>=0 and hid(PN.get(int(q),''));ids=inf['ids']
    a=np.array(im).copy();PROJ,E,S_,fw,dep=inf['PROJ'],inf['ext'],inf['S'],inf['fwd'],inf['depth'];Hh,Ww=a.shape[:2];t=f/NF;P=[]
    for cx,cy,z0,H,R,N,seed,*op in list(getattr(M,'PFIRE',()))+[(x,y,z,Hs,Rs,0,sd,{'smoke':Ns}) for x,y,z,Hs,Rs,Ns,sd in getattr(M,'PSMOKE',())]:
        op=op[0] if op else {};rnd=random.Random(seed)
        for i in range(N):
            ph=rnd.random();an=rnd.uniform(0,6.283);rr=R*rnd.random()**0.5;hk=rnd.uniform(0.45,1.0);sz=rnd.uniform(0.7,1.1);sw=rnd.uniform(0,6.283);age=(t+ph)%1.0
            if age>FIRECOL[-1][0]:continue
            x=cx+rr*np.cos(an)*(1-age*0.9)+0.22*R*np.sin(sw+age*7)*age;y=cy+0.5*rr*np.sin(an)*(1-age*0.9);z=z0+age*H*hk
            ea=min(0.84,age+0.22*rr/R)   # 色：根もとのまん中ほど白っぽく、ふちの粒は早く色がかわる
            P.append((age,(x,y,z),R*0.55*sz*(1-age)**0.55,next(c for e,c in FIRECOL if ea<=e)))
        for i in range(max(2,N//30) if N and op.get('sparks',True) else 0):   # 火の粉：小さく、高く上がる
            ph=rnd.random();an=rnd.uniform(0,6.283);age=(t+ph)%1.0;x=cx+R*0.8*np.cos(an)+0.3*R*np.sin(age*9+an);z=z0+H*(0.55+age*0.6)
            if age<0.85:P.append((0.9,(x,cy,z),0.0,(255,170,70) if age<0.5 else (240,110,56)))
        sm=op.get('smoke',True);sm=N//6 if sm is True else (sm or 0)
        for i in range(sm):   # けむり：火の上から、ふくらみながら上がって、右へながれる。火よりうしろに描く
            ph=rnd.random();an=rnd.uniform(0,6.283);age=(t+ph)%1.0;sz=rnd.uniform(0.7,1.1)
            x=cx+0.4*R*np.cos(an)+age*R*1.1+0.25*R*np.sin(age*6+an);z=z0+H*((0.7 if N else 0.0)+age*0.7)
            if age<0.92:P.append((2+age,(x,cy-0.05,z),R*sz*(0.32+0.38*age),next(c for e,c in SMOKECOL if age<=e)))
    P.sort(key=lambda q:-q[0])
    for age,p,r,c in P:
        q=fw(p);u,v=PROJ(q);px,py=(u-E[0])*S_,(v-E[2])*S_;zp=float(np.dot(q,dep));rp=max(0.5,r*S_)
        for yy in range(int(py-rp),int(py+rp)+1):
            for xx in range(int(px-rp),int(px+rp)+1):
                if not(0<=yy<Hh and 0<=xx<Ww):continue
                if (xx+0.5-px)**2+(yy+0.5-py)**2>rp*rp:continue
                if a[yy,xx,3]>0 and zb[yy,xx]>zp and hide(ids[yy,xx]):continue   # 3Dの物のうしろ（PFIRE_HIDE の部品だけ。ほかの部品には、火を上にかさねる）
                a[yy,xx]=(*c,255)
    return Image.fromarray(a)
def run(iid,out,chips=False):
    M=load(iid);os.makedirs(out,exist_ok=True);O.GRAD=getattr(M,'GRAD',False);O.OSAT=getattr(M,'OSAT',0)   # GRAD=True の家具は、かげを4だんに。OSAT：輪郭線のあざやかさに足す量
    L=M.PARTS();bad=check(L);print(iid,'ささえのたしかめ',bad or 'まちがいなし')
    if L:
      try:blueprint(os.path.join(out,'bp.png'),M.ID,L,(1,1),(-0.2,1.2,-0.2,1.2,1.6))
      except Exception as e:print('設計図をかけなかった',e)
    CH={};ref=None;SZ=getattr(M,'SZ',(1,1));rowsh=lambda k:(SZ[0]-SZ[1])*64 if k%2 else 0   # SZ：置くマスの数（よこ・たて）
    PARTS_OUT={}   # 動く部品の絵（MOVE）
    CHF={}   # うごく絵のコマ（FRAMES=n の家具。M.FR にコマの番号を入れて写す。動かない所は、どのコマも同じ絵）
    for v_ in M.VIEWS:
        nm,k=v_[:2];M.VAR=v_[2] if len(v_)>2 else None   # VIEWS の3つめ：同じ向きのべつの絵（みずがめの水あり・なし など。PARTS・EXTRA は M.VAR を見る）
        NF=getattr(M,'FRAMES',1);fr=[]
        if hasattr(M,'PWATER'):   # 粒の水：コマごとに本体を写し（水面がうごく）、粒をかさねる
            for q in range(NF):
                M.FR=q;inf={};b0=shot(M,k,info=inf);zb=O.LAST_ZB.copy()
                fr.append((pdraw(b0[0],inf,zb,M.PWATER(),getattr(M,'POUT',None)),)+tuple(b0[1:]))
        elif hasattr(M,'PFIRE') or hasattr(M,'PSMOKE'):   # 粒の火：本体は1回だけ写し、コマごとに粒をかさねる（本体はどのコマも同じ絵）
            M.FR=0;inf={};b0=shot(M,k,info=inf);zb=O.LAST_ZB.copy();inf['ids']=O.LAST_IDS.copy()
            for q in range(NF):fr.append((pfire(M,b0[0],inf,zb,q,NF),)+tuple(b0[1:]))
        else:
          for q in range(NF):
            M.FR=q;fr.append(shot(M,k))
        M.FR=0;im,ex0,base,yb=fr[0]
        mv=getattr(M,'MOVE',{}).get(nm)   # 動く部品（ブランコの座面など）：本体の絵からのぞき、べつの絵（parts）にする
        if mv:
            inf={};im,ex0,base,yb=shot(M,k,filt=lambda n:not mv['sel'](n),info=inf);fr=[(im,ex0,base,yb)];zs=O.LAST_ZB.copy();imfull=im
            pim=shot(M,k,filt=mv['sel'])[0];zm=O.LAST_ZB.copy()
            from scipy.ndimage import maximum_filter,binary_dilation   # 本体のうち、動く部品より手前にある所（ゆれてもかさなる、まわり4〜6ドットまで）
            zmd=maximum_filter(np.where(zm>-1e8,zm,-1e9),size=(9,13));sa=np.array(im)[...,3]>0
            omask=binary_dilation((zs>-1e8)&(zmd>-1e8)&(zs>zmd),iterations=2)&sa
        bbs=[f[0].getbbox() for f in fr];bb=(min(b[0] for b in bbs),min(b[1] for b in bbs),max(b[2] for b in bbs),max(b[3] for b in bbs))
        if NF>1:CHF[nm]=[f[0].crop(bb) for f in fr]
        im=im.crop(bb);base-=bb[1]
        if ref is None:ref=im.height-base   # 前の向きで、地面の行と絵の下のはしの差
        ay=round(M.BOTTOM+rowsh(k)-base-ref);ax=ex0+bb[0];CH[nm]=(im,ax,ay)
        if mv:   # 動く部品の絵と、のびちぢみ・回る支点（ゲームの点。g64のドット、マスの左上から）
            pb=pim.getbbox();P_=inf['PROJ'](inf['fwd'](mv['pivot']));E=inf['ext'];S_=inf['S']
            PARTS_OUT[nm]=[{'ax':ex0+pb[0],'ay':ay+pb[1]-bb[1],'w':pb[2]-pb[0],'h':pb[3]-pb[1],'px':ex0+(P_[0]-E[0])*S_,'py':ay+(P_[1]-E[2])*S_-bb[1],'f':[pim.crop(pb)]}]
            print(nm,'動く部品',PARTS_OUT[nm][0]['w'],'x',PARTS_OUT[nm][0]['h'],'支点',round(PARTS_OUT[nm][0]['px'],1),round(PARTS_OUT[nm][0]['py'],1))
            if omask.any():   # 動く部品より手前の本体（横木・手前の柱など）：動かさずに、動く部品の上に重ねる絵（fix）。奥行きをくらべて、自動でえらぶ
                oa=np.array(imfull).copy();oa[~omask]=0;oim=Image.fromarray(oa);ob=oim.getbbox()
                if ob:PARTS_OUT[nm].append({'ax':ex0+ob[0],'ay':ay+ob[1]-bb[1],'w':ob[2]-ob[0],'h':ob[3]-ob[1],'px':0,'py':0,'fix':1,'f':[oim.crop(ob)]});print(nm,'手前に重ねる部品',ob[2]-ob[0],'x',ob[3]-ob[1])   # 2×1 などをたてにした向きは、ゲームでは置いたマスから下へのびるので、そのぶん下へずらす（rowsh）
        print('%s %dx%d ax %d ay %d'%(nm,im.width,im.height,ax,ay))
    for nm,f in getattr(M,'FRONT',{}).items():
        k=dict(v[:2] for v in M.VIEWS)[nm.rsplit('.',1)[0]];im,ex0,base,yb=shot(M,k,f);full,_,_,_=shot(M,k);bb=full.getbbox()
        im=im.crop(bb);base-=bb[1];CH[nm]=(im,ex0+bb[0],round(M.BOTTOM+rowsh(k)-base-ref));print('%s %dx%d'%(nm,im.width,im.height))
    for nm,fs in CHF.items():   # コマをならべた絵
        can=Image.new('RGBA',(sum(f.width+4 for f in fs),fs[0].height),(150,190,120,255));x=0
        for f in fs:can.alpha_composite(f,(x,0));x+=f.width+4
        can.resize((can.width*6,can.height*6),Image.NEAREST).save(os.path.join(out,nm.replace('>','_')+'_frames_x6.png'))
    for nm,(im,ax,ay) in CH.items():
        fn=nm.replace('>','_').replace('#','_');im.save(os.path.join(out,fn+'.png'));im.resize((im.width*10,im.height*10),Image.NEAREST).save(os.path.join(out,fn+'_x10.png'))
    for nm,pl in PARTS_OUT.items():   # 動く部品を本体にかさねた絵（たしかめ用。ゲームでも本体の上にかさねる）
        im,ax,ay=CH[nm];x0=min([ax]+[q['ax'] for q in pl]);y0=min([ay]+[q['ay'] for q in pl]);x1=max([ax+im.width]+[q['ax']+q['w'] for q in pl]);y1=max([ay+im.height]+[q['ay']+q['h'] for q in pl])
        can=Image.new('RGBA',(x1-x0,y1-y0),(0,0,0,0));can.alpha_composite(im,(ax-x0,ay-y0))
        for q in pl:can.alpha_composite(q['f'][0],(q['ax']-x0,q['ay']-y0))
        can.save(os.path.join(out,nm+'_all.png'));can.resize((can.width*10,can.height*10),Image.NEAREST).save(os.path.join(out,nm+'_all_x10.png'))
    vs=[CH[v[0]][0] for v in M.VIEWS];HB=max(i.height for i in vs)+12
    can=Image.new('RGBA',(sum(i.width+8 for i in vs)+8,HB),(150,190,120,255));x=8
    for n,i in zip([v[0] for v in M.VIEWS],vs):can.alpha_composite(i,(x,HB-6-(M.BOTTOM-CH[n][2])));x+=i.width+8
    can.resize((can.width*4,can.height*4),Image.NEAREST).save(os.path.join(out,'views_x4.png'))
    sys.path.insert(0,os.path.join(ROOT,'tools'));import chips as CHP
    head,CC=CHP.load_imgs();cur=[v[0] for v in M.VIEWS if v[0] in CC]
    if cur:   # いまのチップとくらべる（新しい家具は、いまのチップがないので出さない）
      row=[(CC[n]['f'][0].convert('RGBA'),CC[n]['ay']) for n in cur]+[(CH[n][0],CH[n][2]) for n in cur]
      HB=int(max(i.height+max(0,M.BOTTOM-(a+i.height)) for i,a in row))+12
      can=Image.new('RGBA',(sum(i.width+8 for i,_ in row)+16,HB),(150,190,120,255));x=8
      for j,(i,a) in enumerate(row):
          if j==len(cur):x+=8
          can.alpha_composite(i,(x,int(round(HB-6-(M.BOTTOM-a)))));x+=i.width+8
      can.resize((can.width*4,can.height*4),Image.NEAREST).save(os.path.join(out,'cmp_x4.png'))
    if chips:
        for nm,(im,ax,ay) in CH.items():
            CC[nm]={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':CHF.get(nm,[im])}
            if nm in PARTS_OUT:CC[nm]['parts']=PARTS_OUT[nm]
        for nm in getattr(M,'CUT',()):   # すわった子の足をかくす行（座面の下のはし）：まん中の列で、はじめて色のある行から10ドットより下の、はじめてすきとおる行。ゲームの点（1マス32）
            im,ax,ay=CH[nm];a=np.array(im);col=a[:,a.shape[1]//2,3];t0=next(i for i in range(len(col)) if col[i]>0);row=next(i for i in range(max(10,t0+10),len(col)) if col[i]==0)   # 上のすきとおった所（ひじかけのあいだ など）はとばす
            CC[nm]['cut']=(ay+row)/2;print(nm,'cut',CC[nm]['cut'])
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(CH));print('チップに入れた',len(CH))
    run.parts=PARTS_OUT;return CH   # run.parts：動く部品の絵（たしかめ用）
if __name__=='__main__':run(sys.argv[1],sys.argv[2],'--chips' in sys.argv)
