"""噴水（もらった絵 image.png：3コマ。ドットは約7.2ピクセル）→ チップ fountain の3コマ（g32）。
1. コマごとに、そのコマのドットのさかいに合わせて切り、1ドット＝1ドットにちぢめる（pixdown の shrink・outline）。
2. 動かない所（水ばち・台・池）は、3コマとも1コマめの絵にそろえる。動く所（ふき上げる水・しぶき）だけ、
   それぞれのコマの絵から、台のまん中に合わせてかさねる（CLAUDE.md の動く絵の決まり）。
つかいかた：python3 tools/art/fountain/fountain_art.py <出力フォルダ>"""
import sys,os,math
import numpy as np
from PIL import Image
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..'))
import pixdown
SRC=os.path.join(os.path.dirname(__file__),'image.png')
P=7.2;PY=0.17                                   # ドットの大きさ・たての位置
FR=[(139,632,3.15),(822,1333,0.19),(1501,2010,1.35)]   # コマ：左はし・右はし・よこの位置
Y0,Y1=60,640
def frame(src,a,b,ph):
    X0=ph+math.floor((a-8-ph)/P)*P;nx=math.ceil((b+8-X0)/P)
    y0=PY+math.floor((Y0-PY)/P)*P;ny=math.ceil((Y1-y0)/P)
    box=(round(X0),round(y0),round(X0+nx*P),round(y0+ny*P))
    bb=np.asarray(src.crop(box)).astype(float)
    o=pixdown.shrink(bb,nx,ny);o=pixdown.outline(o,bb);return o
def lum(o):return o[...,:3]@(.3,.59,.11)
def jet(o):
    """動く水：とても明るい青白いドット（ふき上げる水・しぶき）。いちばん大きなかたまり（ふき上げる水）は、
    すきまをうめ、ふちの線でかこまれた中も水にする（水のまん中の、池と同じような色の所もふくめる）"""
    from scipy import ndimage
    r,g,b=o[...,0],o[...,1],o[...,2]
    L=(o[...,3]>0)&(lum(o)>200)&(b>=r+8)
    E=(o[...,3]>0)&(b<240)&(g<184)&(b>r+60)            # 水のふちの、少しこい青の線
    C=ndimage.binary_closing(L,iterations=2)|L
    lab0,_=ndimage.label(C|E);keep=np.unique(lab0[L]);C=np.isin(lab0,keep[keep>0])   # 明るい水につながる、ふちの線もふくめる
    lab,n=ndimage.label(C)
    if not n:return L
    k=1+int(np.argmax(ndimage.sum(C,lab,range(1,n+1))));body=lab==k
    body=ndimage.binary_fill_holes(body)             # 水のふちの線でかこまれた中を、水にする
    return (body|L)&(o[...,3]>0)
def ped(o):
    """台：池の中の、クリーム色のドット（台の上の面とよこ）。その下のはしと、よこのまん中"""
    r,g,b=o[...,0],o[...,1],o[...,2];h,w=r.shape
    m=(o[...,3]>0)&(r>190)&(b<r+10)&(abs(r-g)<25)
    ys,xs=np.where(m[h//4:h*3//4,w//3:w*2//3]);ys+=h//4;xs+=w//3
    return ys.max(),(xs.min()+xs.max())/2
def build():
    src=Image.open(SRC).convert('RGBA')
    F=[np.pad(frame(src,*f),((12,12),(12,12),(0,0))) for f in FR]   # まわりに余白（合わせてずらしたとき、水のてっぺん・つぶが切れないように）
    base=F[0].copy();J0=jet(base);h,w=J0.shape
    # 1コマめの水をとりのぞく：よこのいちばん近い、水でないドットの色でうめる
    for y in range(h):
        for x in np.where(J0[y])[0]:
            L=[xx for xx in range(x-1,-1,-1) if not J0[y,xx]];R=[xx for xx in range(x+1,w) if not J0[y,xx]]
            c=[];c+= [base[y,L[0]]] if L and base[y,L[0],3]>0 else [];c+=[base[y,R[0]]] if R and base[y,R[0],3]>0 else []
            base[y,x]=c[0] if len(c)==1 else (c[0] if (x-L[0])<=(R[0]-x) else c[1]) if c else 0
    by0,bx0=ped(F[0]);out=[]
    for o in F:
        J=jet(o);by,bx=ped(o);dy=int(round(by0-by));dx=int(round(bx0-bx))
        f=base.copy()
        for y,x in zip(*np.where(o[...,3]>0)):
            yy,xx=y+dy,x+dx
            if not(0<=yy<h and 0<=xx<w):continue
            if J[y,x] or (base[yy,xx,3]==0 and not F[0][yy,xx,3] and o[y,x,2]>o[y,x,0]+30):f[yy,xx]=o[y,x]   # 水と、水ばちの外にはみ出した水・つぶ（青い所だけ。石のふちはとらない）
        out.append(f)
    # 3コマを同じ大きさで、ぜんぶの絵が入るように切る
    al=np.zeros((h,w),bool)
    for f in out:al|=f[...,3]>0
    ys,xs=np.where(al);cut=(ys.min(),ys.max()+1,xs.min(),xs.max()+1)
    return [Image.fromarray(f[cut[0]:cut[1],cut[2]:cut[3]].round().astype(np.uint8),'RGBA') for f in out],F,base[cut[0]:cut[1],cut[2]:cut[3]]
JETS=[None,'jet2.png','jet3.png']   # 持ち主が描いた水（1マス64ドットの細かさ）。2・3コマめはこの水にする
def build64():
    """g64 の3コマ：水ばち・台・池は1コマめ（水をとった絵）を2倍に。1コマめの水はもとの絵を2倍、2・3コマめは JETS の絵（1ドットのまま）。
    水のいちばん下のまん中を、台の水の出口（1コマめの水のいちばん下のまん中）に合わせる"""
    ims,F,base=build();b=np.repeat(np.repeat(base,2,0),2,1);f0=np.repeat(np.repeat(np.asarray(ims[0]).astype(float),2,0),2,1)
    J0=jet(np.asarray(ims[0]).astype(float));ys,xs=np.where(J0);by=ys.max();bx=(xs[ys==by].min()+xs[ys==by].max()+1)/2
    oy,ox=by*2+1,bx*2                                  # 水の出口（g64 のドット）
    PAD=24;out=[]
    for k,jp in enumerate(JETS):
        if jp is None:f=f0.copy()
        else:
            f=b.copy();a=np.asarray(Image.open(os.path.join(os.path.dirname(__file__),jp)).convert('RGBA')).astype(float)
            m=a[...,3]>100;yy,xx=np.where(m);jy=yy.max();jx=(xx[yy==jy].min()+xx[yy==jy].max()+1)/2
            dy=int(round(oy-jy));dx=int(round(ox-jx))
            for y,x in zip(yy,xx):f[y+dy,x+dx,:3]=a[y,x,:3];f[y+dy,x+dx,3]=255
        out.append(f)
    return [Image.fromarray(f.round().astype(np.uint8),'RGBA') for f in out]
def build_user(width=None):
    """持ち主の3まい（jet1：水ばちと1コマめの水、jet2・jet3：2・3コマめの水。どれも同じ128×128のわくの中で、位置がそろっている）。
    2・3コマめは、jet1 から水をとりのぞいた水ばちに、jet2・jet3 の水をそのままの位置でかさねる（水ばち・台・池は3コマとも同じ）。
    そのあと、水ばちのはばが width になるように、BOX でちぢめる（2×2マスいっぱい：g32 で 64）"""
    d=os.path.dirname(__file__)
    ld=lambda f:np.asarray(Image.open(os.path.join(d,f)).convert('RGBA')).astype(float)
    def clean(a):a=a.copy();m=a[...,3]>100;a[~m]=0;a[m,3]=255;return a   # うすい点（透明に近いにじみ）はけし、ほかは不透明に
    f1=clean(ld('jet1.png'));f1[21:23,61:76]=0   # もらった絵のなおし：水ばちのふちの上に2行だけはみ出した灰色の線をけす（ほかのふちは1行）
    base=f1.copy();J0=jet(f1);h,w=J0.shape
    for y in range(h):
        for x in np.where(J0[y])[0]:
            L=[xx for xx in range(x-1,-1,-1) if not J0[y,xx]];R=[xx for xx in range(x+1,w) if not J0[y,xx]]
            c=[(abs(x-L[0]),base[y,L[0]])] if L and base[y,L[0],3]>0 else [];c+=[(abs(R[0]-x),base[y,R[0]])] if R and base[y,R[0],3]>0 else []
            base[y,x]=min(c,key=lambda q:q[0])[1] if c else 0
    out=[f1]
    for jf in ('jet2.png','jet3.png'):
        a=clean(ld(jf));f=base.copy();m=a[...,3]>0;f[m]=a[m];out.append(f)
    al=np.zeros((h,w),bool)
    for f in out:al|=f[...,3]>0
    ys,xs=np.where(al);y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    bw=(lambda q:q.max()-q.min()+1)(np.where((base[...,3]>0).any(0))[0])      # 水ばちのはば
    k=(width or bw)/bw;W2,H2=round((x1-x0)*k),round((y1-y0)*k)
    ims=[]
    for f in out:
        im=Image.fromarray(f[y0:y1,x0:x1].round().astype(np.uint8),'RGBA')
        o=np.asarray(im.resize((W2,H2),Image.BOX)).astype(float)   # PIL の RGBA のちぢめは、うすさをかけて平均する（ふちに黒・白がまざらない）
        o[...,3]=np.where(o[...,3]>=128,255,0);o[o[...,3]==0]=0                              # ドットの絵なので、半分より多ければ不透明
        ims.append(Image.fromarray(o.clip(0,255).round().astype(np.uint8),'RGBA'))
    return ims
if __name__=='__main__' and len(sys.argv)>2 and sys.argv[2]=='user':
    dst=sys.argv[1];os.makedirs(dst,exist_ok=True);ims=build_user(64)
    for i,im in enumerate(ims):im.save(f'{dst}/fountain{i}.png')
    W,H=ims[0].size;sheet=Image.new('RGBA',(W*3+20,H),(90,140,80,255))
    for i,im in enumerate(ims):sheet.alpha_composite(im,(i*(W+10),0))
    sheet.resize((sheet.width*6,sheet.height*6),Image.NEAREST).save(f'{dst}/sheet.png');print(W,H);sys.exit()
if __name__=='__main__' and len(sys.argv)>2 and sys.argv[2]=='g64':
    dst=sys.argv[1];os.makedirs(dst,exist_ok=True);ims=build64()
    for i,im in enumerate(ims):im.save(f'{dst}/fountain{i}.png')
    W,H=ims[0].size;sheet=Image.new('RGBA',(W*3+20,H),(90,140,80,255))
    for i,im in enumerate(ims):sheet.alpha_composite(im,(i*(W+10),0))
    sheet.resize((sheet.width*4,sheet.height*4),Image.NEAREST).save(f'{dst}/sheet.png');print(W,H);sys.exit()
if __name__=='__main__':
    dst=sys.argv[1];os.makedirs(dst,exist_ok=True)
    ims,F,_=build()
    for i,im in enumerate(ims):im.save(f'{dst}/fountain{i}.png')
    for i,o in enumerate(F):Image.fromarray(o.round().astype(np.uint8),'RGBA').save(f'{dst}/raw{i}.png')
    W,H=ims[0].size;sheet=Image.new('RGBA',(W*3+20,H),(90,140,80,255))
    for i,im in enumerate(ims):sheet.alpha_composite(im,(i*(W+10),0))
    sheet.resize((sheet.width*6,sheet.height*6),Image.NEAREST).save(f'{dst}/sheet.png');print(W,H)
