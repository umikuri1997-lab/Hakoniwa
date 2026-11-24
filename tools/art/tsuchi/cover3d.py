# 土のステージの表紙（マップえらびのカード 190×70）の、うしろの景色：3Dの谷を組んで、その大きさのまま写す（ちぢめない）。
# 使い方：python3 tools/art/tsuchi/cover3d.py <出力フォルダ> [--chips]（--chips：チップ cover:tsuchi に入れる）
#   空はすける（ゲームの PXSCENE が、空の色と雲を先に描く。雲は、ほかの表紙と同じに動く）。せいれいは、ゲームが上に描く。
# 設計図（マス。x=東・y=北（おく）・z=上。カメラは谷の南から、北を見る）
#   谷の地面：高さ0。おくの北のがけ：y がおよそ 10 より北、高さ 3〜4（2だんのテラス）。東・西のはしにも、がけ。
#   地われ：谷を南北にたてに割る1本（右よりの x≒6、はば1.8）。底は見えない（ふかいほど、こげ茶）。おくのがけの中までつづく。
#   岩の橋：地われの上の、うすい岩の板（y 3〜4.4、あつさは まん中0.35・はし0.9 のアーチ）。
#   あなぐまの巣穴：おくのがけのふもと（x≒−4）の、まるい穴と、まわりの岩・ほり出した土。
#   ころがる岩：谷の地面に、いくつか。
#   オリーブ：谷の木（tree~t の設計図 furn3d/items/nat_olive.py）を、その場所の大きさ（1マスのドット数）で写して立てる（ちぢめない）。
#   色：岩は、谷のがけの絵（cliff:block）と同じ、すなの岩。光は左上の手前から（夕方の16時）。かげは4だん。遠い所は、空の色へ少しまぜる。
import sys,os,math
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
for p in(ART,os.path.join(ROOT,'tools')):sys.path.insert(0,p)
import numpy as np
from PIL import Image
GW,GH=190,70
CAM=np.array((0.0,-15.0,7.0));LOOK=np.array((1.0,7.0,0.4));FOV=56.0   # カメラ（よこの見える角度）
LIGHT=np.array((-0.55,-0.45,0.70));LIGHT/=np.linalg.norm(LIGHT)
GROUND=np.array((190,170,132.0));SOIL=np.array((172,132,98.0))
STRATA=[np.array(c,float) for c in((216,178,144),(194,156,128),(230,194,158),(184,146,120))]
DARKC=np.array((46,34,28.0));HOLE=np.array((64,46,36.0));SKY=np.array((214,228,232.0))
TONE=(1.0,0.86,0.72,0.60)
RX=lambda y:6.2+0.7*np.sin(y*0.42+0.5)   # 地われのまん中
RW=1.15
BY0,BY1=3.0,4.4   # 橋
BUR=np.array((-4.2,0.0,0.55));BURR=np.array((0.95,0.9,0.72))   # 巣穴の穴（だ円の玉。y はがけのふもと）
ROCKS=[(-9.8,1.0,0.95),(-8.4,-1.8,0.6),(10.6,-0.5,0.9),(-6.1,8.7,0.75),(10.8,6.8,1.0)]
def back(x):return 10.2+1.0*np.sin(x*0.45+0.7)+0.3*np.sin(0.9*x+2.0)   # 北のがけのふもと
def height(x,y):
    yb=back(x)
    h1=np.clip((y-yb)/0.35,0,1)*(2.0+0.25*np.sin(x*0.9))
    h2=np.clip((y-yb-2.6-0.8*np.sin(x*0.5))/0.35,0,1)*(1.5+0.6*np.sin(x*0.55+1)+0.35*np.sin(x*1.4))   # 2だんめ（おくへひっこんだテラス。上のふちは、でこぼこ）
    side=np.clip((np.abs(x-0.6)-12.5-0.8*np.sin(y*0.5))/0.4,0,1)*(2.6+0.4*np.sin(y*0.8))
    h=np.maximum(h1+h2,side)
    yb0=back(BUR[0]);h=np.maximum(h,np.clip(0.28-0.28*np.hypot((x-BUR[0])/1.4,(y-yb0+1.0)/0.9),0,None))   # 巣穴の前の、ほり出した土の山
    for rx,ry,rr in ROCKS:   # ころがる岩（ひらたい玉）
        d=(x-rx)**2+(y-ry)**2;h=np.maximum(h,np.sqrt(np.clip(rr*rr-d,0,None))*0.8)
    return h
def bridge_T(x,y):
    c=RX((BY0+BY1)/2);u=np.abs(x-c)/RW
    return 0.35+0.55*np.clip(u,0,1)**3
def field(x,y,z):
    h=height(x,y)
    rift=np.abs(x-RX(y))<RW
    h=np.where(rift,-30.0,h)
    f=h-z
    inb=rift&(y>=BY0)&(y<=BY1)
    fb=np.where(inb,np.minimum(0.12-z,z+bridge_T(x,y)),-9.0)
    f=np.maximum(f,fb)
    yb=back(BUR[0]);e=np.sqrt(((x-BUR[0])/BURR[0])**2+((y-yb)/BURR[1])**2+((z-BUR[2])/BURR[2])**2)
    f=np.minimum(f,(e-1)*0.6)
    return f
def render():
    fwd=LOOK-CAM;fwd/=np.linalg.norm(fwd);rt=np.cross(fwd,(0,0,1.0));rt/=np.linalg.norm(rt);up=np.cross(rt,fwd)
    tw=math.tan(math.radians(FOV/2));th=tw*GH/GW
    v,u=np.mgrid[0:GH,0:GW].astype(float)
    sx=((u+0.5)/GW*2-1)*tw;sy=(1-(v+0.5)/GH*2)*th
    D=fwd[None,None,:]+sx[...,None]*rt+sy[...,None]*up;D/=np.linalg.norm(D,axis=2,keepdims=True)
    D=D.reshape(-1,3);n=D.shape[0];t=np.full(n,-1.0);done=np.zeros(n,bool)
    tt=4.0
    while tt<70 and not done.all():
        i=np.where(~done)[0];P=CAM+D[i]*tt
        f=field(P[:,0],P[:,1],P[:,2]);h=f>0
        t[i[h]]=tt;done[i[h]]=True;tt+=0.025+tt*0.0015
    hit=t>0;i=np.where(hit)[0];lo=t[i]-0.06;hi=t[i].copy()
    for _ in range(10):
        m=(lo+hi)/2;P=CAM+D[i]*m[:,None];f=field(P[:,0],P[:,1],P[:,2])
        hi=np.where(f>0,m,hi);lo=np.where(f>0,lo,m)
    P=CAM+D[i]*hi[:,None];x,y,z=P[:,0],P[:,1],P[:,2]
    e=0.01;g=np.stack([(field(x+e,y,z)-field(x-e,y,z)),(field(x,y+e,z)-field(x,y-e,z)),(field(x,y,z+e)-field(x,y,z-e))],1)
    N=-g/np.maximum(np.linalg.norm(g,axis=1,keepdims=True),1e-9)
    dl=N@LIGHT;lv=np.select([dl>0.75,dl>0.45,dl>0.15],[0,1,2],3);k=np.array(TONE)[lv]
    # 色
    yb=back(x);band=((z+0.12*np.sin(x*1.7+y)+0.9*(y>back(x)+2.4))/0.38).astype(int)%len(STRATA)   # 2だんめは、しまをずらす
    rock=np.stack(STRATA)[band]
    col=np.where((z>0.12)[:,None]|(N[:,2]<0.75)[:,None],rock,GROUND)
    col=np.where(((z>0.5)&(N[:,2]>0.8))[:,None],np.array((228,206,170.0)),col)   # がけのだんの上の面：白っぽい、かわいた土（だんが分かるように）
    inrift=np.abs(x-RX(y))<RW+0.02
    isb=inrift&(y>=BY0-0.02)&(y<=BY1+0.02)&(z>-1.0)
    col=np.where(isb[:,None],np.array((206,174,144.0)),col)
    rgb=col*k[:,None]
    fd=np.clip((-z+0.1)/1.0,0,1);fd=np.round(fd*4)/4;fd=np.where(isb,0,fd)   # 地われの中は、すぐにくらく（道に見えない）
    rgb=rgb*(1-fd[:,None])+DARKC*fd[:,None]
    yb0=back(BUR[0]);eb=np.sqrt(((x-BUR[0])/BURR[0])**2+((y-yb0)/BURR[1])**2+((z-BUR[2])/BURR[2])**2)
    hole=(eb<1.06)&(y>yb0-0.3)
    dh=np.clip((y-(yb0-0.2))/0.9,0,1);dh=np.round(dh*3)/3
    rgb=np.where(hole[:,None],HOLE*(1.25-0.45*dh)[:,None],rgb)
    soil=(np.hypot((x-BUR[0])/1.4,(y-yb0+1.0)/0.9)<1)&(z<0.3)&~hole   # ほり出した土
    rgb=np.where(soil[:,None],SOIL*k[:,None],rgb)
    far=np.clip((y-2)/14,0,1)*0.06;far=np.round(far*20)/20
    rgb=rgb*(1-far[:,None])+SKY*far[:,None]
    out=np.zeros((n,4));out[i,:3]=rgb;out[i,3]=255
    return Image.fromarray(np.clip(out,0,255).astype(np.uint8).reshape(GH,GW,4))
OLIVES=[(-7.2,3.2),(-10.6,7.4),(3.2,8.4)]   # オリーブの木の場所（根もと）
def project(p):
    fwd=LOOK-CAM;fwd/=np.linalg.norm(fwd);rt=np.cross(fwd,(0,0,1.0));rt/=np.linalg.norm(rt);up=np.cross(rt,fwd)
    tw=math.tan(math.radians(FOV/2));th=tw*GH/GW;d=np.asarray(p,float)-CAM;z=d@fwd
    return ((d@rt)/z/tw+1)/2*GW,(1-(d@up)/z/th)/2*GH,GW/(2*tw*z)   # 画面の点・1マスのドット数
_OL={}
def olive(px):
    """オリーブを、1マス px ドットで写した絵と、根もとの点"""
    if px in _OL:return _OL[px]
    sys.path.insert(0,os.path.join(ART,'furn3d'));sys.path.insert(0,os.path.join(ART,'furn3d','items'))
    import tempfile,furn3d as F3
    _s=F3.shot;F3.shot=lambda M,k,only=None,S_=64,filt=None,info=None:_s(M,k,only,px,filt,info)
    try:
        F3.META.clear();d=tempfile.mkdtemp();CH=F3.run('nat_olive',d);im,ax,ay=CH['tree~t'];bb,inf=F3.META['tree~t']
        P=inf['PROJ'](inf['fwd']((0.5,0.5,0.0)));E=inf['ext'];S_=inf['S'];fx=(P[0]-E[0])*S_-bb[0];fy=(P[1]-E[2])*S_-bb[1]
    finally:F3.shot=_s
    _OL[px]=(im,fx,fy);return _OL[px]
def add_olives(im):
    for x,y in sorted(OLIVES,key=lambda q:-q[1]):   # おくから
        sx,sy,px=project((x,y,height(np.array([x]),np.array([y]))[0]));o,fx,fy=olive(max(4,int(round(px))))
        im.alpha_composite(o,(int(round(sx-fx)),int(round(sy-fy))))
    return im
if __name__=='__main__':
    out=sys.argv[1];os.makedirs(out,exist_ok=True)
    im=add_olives(render());im.save(os.path.join(out,'cover_tsuchi.png'))
    bg=Image.new('RGBA',im.size,tuple(int(c) for c in SKY)+(255,));bg.alpha_composite(im)
    bg.resize((GW*4,GH*4),Image.NEAREST).save(os.path.join(out,'cover_tsuchi_x4.png'))
    if '--chips' in sys.argv:
        import chips
        head,C=chips.load_imgs();C['cover:tsuchi']={'ax':0,'ay':0,'w':GW,'h':GH,'g':32,'f':[im]};chips.pack_imgs(head,C);print('chips cover:tsuchi')
