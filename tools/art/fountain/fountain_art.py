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
    すきまをうめ、行ごとに左はしから右はしまでを水にする（水のまん中の、池と同じような色の所もふくめる）"""
    from scipy import ndimage
    r,g,b=o[...,0],o[...,1],o[...,2]
    L=(o[...,3]>0)&(lum(o)>200)&(b>=r+8)
    E=(o[...,3]>0)&(b<240)&(g<184)&(b>r+60)            # 水のふちの、少しこい青の線
    C=ndimage.binary_closing(L,iterations=2)|L
    lab0,_=ndimage.label(C|E);keep=np.unique(lab0[L]);C=np.isin(lab0,keep[keep>0])   # 明るい水につながる、ふちの線もふくめる
    lab,n=ndimage.label(C)
    if not n:return L
    k=1+int(np.argmax(ndimage.sum(C,lab,range(1,n+1))));body=lab==k
    for y in np.where(body.any(1))[0]:              # 水のふち（少しこい青の線）のあいだは、ぜんぶ水（すけて見える池の色もふくめて、もらった絵のまま）
        xs=np.where(body[y])[0];body[y,xs.min():xs.max()+1]=True
    return (body|L)&(o[...,3]>0)
def ped(o):
    """台：池の中の、クリーム色のドット（台の上の面とよこ）。その下のはしと、よこのまん中"""
    r,g,b=o[...,0],o[...,1],o[...,2];h,w=r.shape
    m=(o[...,3]>0)&(r>190)&(b<r+10)&(abs(r-g)<25)
    ys,xs=np.where(m[h//4:h*3//4,w//3:w*2//3]);ys+=h//4;xs+=w//3
    return ys.max(),(xs.min()+xs.max())/2
def build():
    src=Image.open(SRC).convert('RGBA')
    F=[frame(src,*f) for f in FR]
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
        for y,x in zip(*np.where(J)):
            yy,xx=y+dy,x+dx
            if 0<=yy<h and 0<=xx<w:f[yy,xx]=o[y,x]
        out.append(f)
    # 3コマを同じ大きさで、ぜんぶの絵が入るように切る
    al=np.zeros((h,w),bool)
    for f in out:al|=f[...,3]>0
    ys,xs=np.where(al);cut=(ys.min(),ys.max()+1,xs.min(),xs.max()+1)
    return [Image.fromarray(f[cut[0]:cut[1],cut[2]:cut[3]].round().astype(np.uint8),'RGBA') for f in out],F
if __name__=='__main__':
    dst=sys.argv[1];os.makedirs(dst,exist_ok=True)
    ims,F=build()
    for i,im in enumerate(ims):im.save(f'{dst}/fountain{i}.png')
    for i,o in enumerate(F):Image.fromarray(o.round().astype(np.uint8),'RGBA').save(f'{dst}/raw{i}.png')
    W,H=ims[0].size;sheet=Image.new('RGBA',(W*3+20,H),(90,140,80,255))
    for i,im in enumerate(ims):sheet.alpha_composite(im,(i*(W+10),0))
    sheet.resize((sheet.width*6,sheet.height*6),Image.NEAREST).save(f'{dst}/sheet.png');print(W,H)
