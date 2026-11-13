# 木箱を、設計図（crate_parts.py）から3Dに組み、ドット絵に写す（スキル model3d-pixel のお手本）。
# 使い方：python3 tools/art/crate3d/crate3d.py <出力フォルダ> [--elev 見おろしの角度] [--frame 画角に入れる上下の範囲（マス）] [--fov 画角（度）] [--chips]（--chips で、ゲームのチップ crate・crate>1〜3 と、ふたの開く絵 #o1〜#o3 に入れる）
# 出す物：bp_crate.png（設計図）・crate.png・crate_1.png・crate_2.png・crate_3.png（前・右・後ろ・左のドット絵、1マス64ドット。チップの crate・crate>1〜3）・
#         <それぞれ>_x10.png（10倍）・views_x4.png（4つの向きをならべた4倍）・crate_big.png（3Dのたしかめ用、1マス512ドット）・cmp_x4.png（いまのチップとならべた4倍）
import sys,os
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
sys.path.insert(0,ART);sys.path.insert(0,HERE)
import oblique3d as O
from blueprint import build,blueprint,check
from PIL import Image
import numpy as np
import crate_parts as C
out=sys.argv[1];os.makedirs(out,exist_ok=True)
def opt(k,d):
    return float(sys.argv[sys.argv.index(k)+1]) if k in sys.argv else d
ELEV=opt('--elev',42);FRAME=opt('--frame',1)   # 見おろしの角度（度。ゲームのほかの絵は51.34）・画角に入れる上下の範囲（マス。0で遠近なし）。木箱は42度・画角10度・木箱ひとつ分（持ち主がえらんだ）
FOV=opt('--fov',10)
PROJ,DEPTH=O.persp(ELEV,FOV,FRAME or None,((C.X0+C.X1)/2,(C.Y0+C.Y1)/2,C.ZT/2))
L=C.parts();bad=check(L);print('ささえのたしかめ',bad or 'まちがいなし')
blueprint(os.path.join(out,'bp_crate.png'),'木箱',L,(1,1),(-0.1,1.1,0.1,1.1,0.8))
LIDANG=[0,35,70,105]   # ふたの開く角度（度）。0がしまった絵、1〜3が開くとちゅう・開いた絵（チップの #o1〜#o3）
def scene(k=0,ang=0):
    sc=O.Scene();sc.texture(O.Tex(os.path.join(ART,'textures','wood049.png')));lid=set()
    for p in L:
        if C.INNER(p.name):sc.outline(0)
        p0=sc.pid;build(sc,[p]);sc.outline()
        if C.LIDP(p.name):lid|=set(range(p0+1,sc.pid+1))
    if ang:   # ふたを、ちょうつがい（y=Y0, z=ZT の線）のまわりに、うしろ・上へまわす
        t=np.radians(ang);ct,st=np.cos(t),np.sin(t)
        def R(v):
            dy,dz=v[1]-C.Y0,v[2]-C.ZT;return np.array([v[0],C.Y0+dy*ct-dz*st,C.ZT+dy*st+dz*ct])
        sc.t=[(R(a_),R(b_),R(c_),col,pid) if pid in lid else (a_,b_,c_,col,pid) for a_,b_,c_,col,pid in sc.t]
    sc.turn(k,(C.X0,C.Y0,C.X1,C.Y1));return sc
BOTTOM=45   # いまの木箱のチップの下のはし（g64のドット。ゲームで、物の下のはしをそろえる所）
def shot(k,ang=0,S_=64):
    sc=scene(k,ang);V=np.array([v for t in sc.t for v in t[:3]]);P=np.array([PROJ(v) for v in V]);m=2/64
    ext=(P[:,0].min()-m,P[:,0].max()+m,P[:,1].min()-m,P[:,1].max()+m);O.S=S_
    im=O.render_px(sc,PROJ,ext,DEPTH,k=0.72,lw=2);bb=im.getbbox();im=im.crop(bb)   # 輪郭線2ドット（家具と同じ）
    base=round((PROJ((0.5,C.Y1,0))[1]-ext[2])*S_)-bb[1]   # 置くマスの手前のはし（地面、y=1）の行
    ax=round(ext[0]*S_)+bb[0];return im,ax,base
NAMES=['crate','crate>1','crate>2','crate>3'];VIEWS=['前','右','後ろ','左'];ims=[];CH={}
for k,nm in enumerate(NAMES):
    row=[]
    for f,ang in enumerate(LIDANG):
        im,ax,base=shot(k,ang)
        if f==0:b0=base;h0=im.height
        ay=BOTTOM-h0-(base-b0)   # しまった絵の下のはしを BOTTOM にそろえ、開いた絵も同じ地面の所に
        cid=nm+('#o%d'%f if f else '');CH[cid]=(im,ax,ay);row.append(im)
        fn=cid.replace('>','_').replace('#','_');im.save(os.path.join(out,fn+'.png'))
        print('%s（%s・ふた%d度） %dx%d  ax %d  ay %d'%(cid,VIEWS[k],ang,im.width,im.height,ax,ay))
    ims.append(row[0])
    if k==0:shot(0,0,512)[0].save(os.path.join(out,'crate_big.png'));shot(0,LIDANG[-1],512)[0].save(os.path.join(out,'crate_open_big.png'))
    W_=sum(i.width+8 for i in row)+8;HB=140;can=Image.new('RGBA',(W_,HB),(150,190,120,255));x=8
    for i_,f in zip(row,range(4)):
        a_=CH[nm+('#o%d'%f if f else '')][2];can.alpha_composite(i_,(x,HB-6-(BOTTOM-a_)));x+=i_.width+8   # 地面の所をそろえてならべる
    can.resize((can.width*4,can.height*4),Image.NEAREST).save(os.path.join(out,'open_%s_x4.png'%nm.replace('>','_')))
if '--chips' in sys.argv:   # ゲームのチップ（chips.js とアトラス）に入れる
    sys.path.insert(0,os.path.join(ROOT,'tools'));import chips as CHP
    head,CC=CHP.load_imgs()
    for cid,(im_,ax_,ay_) in CH.items():CC[cid]={'g':64,'ax':ax_,'ay':ay_,'w':im_.width,'h':im_.height,'f':[im_]}
    CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(CH));print('チップに入れた',len(CH))
im=ims[0]
can=Image.new('RGBA',(4*74+6,110),(150,190,120,255))
for i,b in enumerate(ims):can.alpha_composite(b,(5+i*74,110-b.height-6))
can.resize((can.width*4,can.height*4),Image.NEAREST).save(os.path.join(out,'views_x4.png'))
sys.path.insert(0,os.path.join(ROOT,'tools'))
try:
    import chips;_,CH=chips.load_imgs();cur=CH['crate']['f'][0].convert('RGBA')
    can=Image.new('RGBA',(150,84),(150,190,120,255))
    for i,b in enumerate([cur,im]):can.alpha_composite(b,(5+i*74,84-b.height-6))
    can.resize((can.width*4,can.height*4),Image.NEAREST).save(os.path.join(out,'cmp_x4.png'))
except Exception as e:print('いまのチップとならべられなかった',e)
print('ドット絵',im.size)
