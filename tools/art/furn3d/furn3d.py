# 家具を、設計図（items/<id>.py）から3Dに組んで、ゲームと同じ見え方のドット絵に写す（スキル model3d-pixel）。木箱 tools/art/crate3d と同じやり方。
# 使い方：python3 tools/art/furn3d/furn3d.py <id> <出力フォルダ> [--chips]
#   見え方：見おろし42度・左右は平行で奥行きだけ遠近（画角10度・1マスぶん、oblique3d.persp）。
#   出す物：<chip>.png（向きごと）・<chip>_x10.png・views_x4.png（向きをならべた4倍）・cmp_x4.png（いまのチップとならべた4倍）・bp.png（設計図）
#   --chips：ゲームのチップ（chips.js とアトラス）に入れ、.chips_changed に id を書く。
# items/<id>.py に書く物：
#   ID（チップの名前）・PARTS()（blueprint.Part の表。木目をはらない部品は p.tex=False、金属の部品は p.metal=True、布・砂のなだらかな部品は p.soft=True（ゆるいふくらみにも、かげがつく）・うすいかげだけの部品は p.soft1=True・石の部品は p.stone=True（石のテクスチャ）・光る部品（火・あかりのガラス）は p.glow=True（かげをつけない）・面のもようは p.decal=f(x,y,z)→色・ひくいドームなど、なだらかなふくらみは p.curve=True（かげのグラデーションを出す）)・EXTRA(sc)（Part で書けない形。なければ書かない）
#   VIEWS=[(チップの名前, まわす数k), ...]（k：0前・1右・2後ろ・3左）・BOTTOM（絵の下のはし。g64のドット。いまのチップに合わせる）
#   SZ=(よこ,たて)（置くマスの数。2×1 の物は (2,1)。たてにした向きを、置いたマスから下へのびる所に写す）
#   FRONT={チップの名前: 部品の名前を見る関数}（せいれいの手前にかさねる絵 .front。その向きで、その部品だけを写す）
import sys,os,importlib
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
sys.path.insert(0,ART);sys.path.insert(0,os.path.join(HERE,'items'))
import numpy as np
from PIL import Image
import oblique3d as O
from blueprint import build,blueprint,check
ROUND={'lathe','cyl','ball','tube','rope','ring','loft','wheel','logy','maki','model','cone'}   # まるい物（GRAD のとき、なめらかなかげ）
ELEV,FOV,FRAME=42,10,1   # 見おろしの角度・画角・画角に入れる範囲（マス）。木箱と同じ
LW=2   # 輪郭線のはば（持ち主がきめた：2ドット）
def load(iid):return importlib.import_module(iid)
def scene(M,k,only=None):
    sc=O.Scene();T=O.Tex(os.path.join(ART,'textures','wood049.png'));TS=O.Tex(os.path.join(ART,'textures','rock030.png'),span=1.0,flow=3,minrun=2,dark=(0.12,0.95),light=(0.10,1.04));L=M.PARTS();keep=set()   # TS：石の部品（p.stone）のテクスチャ
    for p in L:
        mt=getattr(p,'metal',False);sc.texture((TS if getattr(p,'stone',False) else T) if getattr(p,'tex',True) and not mt else None);sc.material('metal' if mt else 'flat' if getattr(p,'glow',False) else 'soft1' if getattr(p,'soft1',False) else 'soft' if getattr(p,'soft',False) else None);p0=sc.pid;sc.decal(getattr(p,'decal',None));sc.smooth(O.GRAD and p.kind in ROUND);sc.curve(getattr(p,'curve',False));build(sc,[p]);sc.material(None);sc.decal(None);sc.smooth(False);sc.curve(False)
        if only and only(p.name):keep|=set(range(p0+1,sc.pid+1))
    if hasattr(M,'EXTRA'):sc.texture(None);M.EXTRA(sc)
    sc.texture(None)
    V=np.array([v for t in sc.t for v in t[:3]]);foot=(V[:,0].min(),V[:,1].min(),V[:,0].max(),V[:,1].max())
    sc.turn(k,foot);return sc,keep
def shot(M,k,only=None,S_=64):
    sc,keep=scene(M,k,only);V=np.array([v for t in sc.t for v in t[:3]])
    c=((V[:,0].min()+V[:,0].max())/2,(V[:,1].min()+V[:,1].max())/2,V[:,2].max()/2)
    PROJ,DEPTH=O.persp(ELEV,FOV,FRAME,c)
    P=np.array([PROJ(v) for v in V]);m=2/64;ext=(P[:,0].min()-m,P[:,0].max()+m,P[:,1].min()-m,P[:,1].max()+m);O.S=S_
    im=O.render_px(sc,PROJ,ext,DEPTH,k=0.80 if O.GRAD else 0.72,lw=LW,k2=0.90 if O.GRAD else 0.86,merge=6 if O.GRAD else 12)   # GRAD：にた色をまとめるさかいを小さく（グラデーションの段をのこす）   # GRAD の家具は、輪郭線もやわらかい色（持ち主がきめた）
    if only:   # その部品だけ（ほかの部品のドットは消す。輪郭線もふくめて、その部品のまわり1ドットまで）
        full=np.array(im);ids=O.LAST_IDS
        from scipy.ndimage import binary_dilation;mk=binary_dilation(np.isin(ids,list(keep)))
        full[~mk]=0;im=Image.fromarray(full)
    yb=V[:,1].max();base=(PROJ((c[0],yb,0))[1]-ext[2])*S_
    return im,round(ext[0]*S_),base,yb   # yb：いちばん手前の地面（マス）。向きをかえると、かわる
def run(iid,out,chips=False):
    M=load(iid);os.makedirs(out,exist_ok=True);O.GRAD=getattr(M,'GRAD',False);O.OSAT=getattr(M,'OSAT',0)   # GRAD=True の家具は、かげを4だんに。OSAT：輪郭線のあざやかさに足す量
    L=M.PARTS();bad=check(L);print(iid,'ささえのたしかめ',bad or 'まちがいなし')
    if L:
      try:blueprint(os.path.join(out,'bp.png'),M.ID,L,(1,1),(-0.2,1.2,-0.2,1.2,1.6))
      except Exception as e:print('設計図をかけなかった',e)
    CH={};ref=None;SZ=getattr(M,'SZ',(1,1));rowsh=lambda k:(SZ[0]-SZ[1])*64 if k%2 else 0   # SZ：置くマスの数（よこ・たて）
    for nm,k in M.VIEWS:
        im,ex0,base,yb=shot(M,k);bb=im.getbbox();im=im.crop(bb);base-=bb[1]
        if ref is None:ref=im.height-base   # 前の向きで、地面の行と絵の下のはしの差
        ay=round(M.BOTTOM+rowsh(k)-base-ref);ax=ex0+bb[0];CH[nm]=(im,ax,ay)   # 2×1 などをたてにした向きは、ゲームでは置いたマスから下へのびるので、そのぶん下へずらす（rowsh）
        print('%s %dx%d ax %d ay %d'%(nm,im.width,im.height,ax,ay))
    for nm,f in getattr(M,'FRONT',{}).items():
        k=dict(M.VIEWS)[nm.rsplit('.',1)[0]];im,ex0,base,yb=shot(M,k,f);full,_,_,_=shot(M,k);bb=full.getbbox()
        im=im.crop(bb);base-=bb[1];CH[nm]=(im,ex0+bb[0],round(M.BOTTOM+rowsh(k)-base-ref));print('%s %dx%d'%(nm,im.width,im.height))
    for nm,(im,ax,ay) in CH.items():
        fn=nm.replace('>','_').replace('#','_');im.save(os.path.join(out,fn+'.png'));im.resize((im.width*10,im.height*10),Image.NEAREST).save(os.path.join(out,fn+'_x10.png'))
    vs=[CH[n][0] for n,_ in M.VIEWS];HB=max(i.height for i in vs)+12
    can=Image.new('RGBA',(sum(i.width+8 for i in vs)+8,HB),(150,190,120,255));x=8
    for (n,_),i in zip(M.VIEWS,vs):can.alpha_composite(i,(x,HB-6-(M.BOTTOM-CH[n][2])));x+=i.width+8
    can.resize((can.width*4,can.height*4),Image.NEAREST).save(os.path.join(out,'views_x4.png'))
    sys.path.insert(0,os.path.join(ROOT,'tools'));import chips as CHP
    head,CC=CHP.load_imgs();cur=[n for n,_ in M.VIEWS if n in CC]
    if cur:   # いまのチップとくらべる（新しい家具は、いまのチップがないので出さない）
      row=[(CC[n]['f'][0].convert('RGBA'),CC[n]['ay']) for n in cur]+[(CH[n][0],CH[n][2]) for n in cur]
      HB=int(max(i.height+max(0,M.BOTTOM-(a+i.height)) for i,a in row))+12
      can=Image.new('RGBA',(sum(i.width+8 for i,_ in row)+16,HB),(150,190,120,255));x=8
      for j,(i,a) in enumerate(row):
          if j==len(cur):x+=8
          can.alpha_composite(i,(x,int(round(HB-6-(M.BOTTOM-a)))));x+=i.width+8
      can.resize((can.width*4,can.height*4),Image.NEAREST).save(os.path.join(out,'cmp_x4.png'))
    if chips:
        for nm,(im,ax,ay) in CH.items():CC[nm]={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':[im]}
        for nm in getattr(M,'CUT',()):   # すわった子の足をかくす行（座面の下のはし）：まん中の列で、はじめて色のある行から10ドットより下の、はじめてすきとおる行。ゲームの点（1マス32）
            im,ax,ay=CH[nm];a=np.array(im);col=a[:,a.shape[1]//2,3];t0=next(i for i in range(len(col)) if col[i]>0);row=next(i for i in range(max(10,t0+10),len(col)) if col[i]==0)   # 上のすきとおった所（ひじかけのあいだ など）はとばす
            CC[nm]['cut']=(ay+row)/2;print(nm,'cut',CC[nm]['cut'])
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(CH));print('チップに入れた',len(CH))
    return CH
if __name__=='__main__':run(sys.argv[1],sys.argv[2],'--chips' in sys.argv)
