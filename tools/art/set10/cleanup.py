# もらった小さな絵の仕上げ：ちぢめたあとに、ふちのうすい所・色のぶつぶつ・輪郭線のむらを直す。
#  1) うすさを2だんにする（ドット絵なので、半分すけた所をなくす）。3ドットより小さい、はなれたかけらはけす
#  2) まわりの4ドットのどれともちがう色の1ドット（ぶつぶつ）は、まわりの色の平均にする（つまみ・線など、2ドット以上つづく物はそのまま）
#  3) 外の輪郭は、1ドットの同じ色の線にする（となりの色より少しこい茶色。黒にしない）
import numpy as np
from PIL import Image
def _nb(m):
    H,W=m.shape;out=[]
    for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
        s=np.zeros((H,W),bool);s[max(-dy,0):H+min(-dy,0),max(-dx,0):W+min(-dx,0)]=m[max(dy,0):H+min(dy,0),max(dx,0):W+min(dx,0)];out.append(s)
    return out
def cleanup(im,out=None,athr=128,speck=46):
    a=np.array(im.convert('RGBA')).astype(float);H,W=a.shape[:2];m=a[...,3]>=athr
    # 小さなかけらをけす
    seen=np.zeros((H,W),bool)
    for y in range(H):
        for x in range(W):
            if m[y,x] and not seen[y,x]:
                st=[(y,x)];seen[y,x]=1;comp=[]
                while st:
                    p=st.pop();comp.append(p)
                    for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
                        q=(p[0]+dy,p[1]+dx)
                        if 0<=q[0]<H and 0<=q[1]<W and m[q] and not seen[q]:seen[q]=1;st.append(q)
                if len(comp)<3:
                    for p in comp:m[p]=False
    rgb=a[...,:3].copy()
    # 輪郭（外がわのふち）
    edge=m&np.any([~n for n in _nb(m)],0)
    inner=m&~edge
    # ぶつぶつ：まわり4ドットのどれとも色の差が speck より大きい1ドット
    for y in range(1,H-1):
        for x in range(1,W-1):
            if not inner[y,x]:continue
            ns=[rgb[y+dy,x+dx] for dy,dx in((1,0),(-1,0),(0,1),(0,-1)) if inner[y+dy,x+dx]]
            if len(ns)>=3 and min(np.abs(rgb[y,x]-n).sum() for n in ns)>speck:rgb[y,x]=np.mean(ns,0)
    if out is None:out=np.median(rgb[edge],0)
    rgb[edge]=out
    res=np.zeros((H,W,4),np.uint8);res[...,:3]=np.clip(np.round(rgb),0,255);res[...,3]=np.where(m,255,0)
    return Image.fromarray(res),out

def outline_unify(im,k=0.62,athr=128):
    """輪郭線をそろえる：外のふちを1ドットにし、その色は、すぐ内がわの色を k 倍にこくした色（木なら こい茶色、葉なら こい緑）。
    内がわの2ドットめが、3ドットめよりずっとこい（前の太い輪郭のなごり）ときは、3ドットめの色にして、輪郭の太さを1ドットにそろえる"""
    a=np.array(im.convert('RGBA')).astype(float);H,W=a.shape[:2];m=a[...,3]>=athr
    def ring(mask):return mask&np.any([~n for n in _nb(mask)],0)
    r1=ring(m);m2=m&~r1;r2=ring(m2);m3=m2&~r2
    rgb=a[...,:3].copy();lum=lambda c:c@np.array([.3,.59,.11])
    def inward(y,x,mask):
        best=None
        for dy,dx in((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
            yy,xx=y+dy,x+dx
            if 0<=yy<H and 0<=xx<W and mask[yy,xx]:return (yy,xx)
        return best
    for y,x in zip(*np.nonzero(r2)):   # 2ドットめが太い輪郭のなごりなら、3ドットめの色に
        q=inward(y,x,m3)
        if q is not None and lum(rgb[y,x])<lum(rgb[q])-28:rgb[y,x]=rgb[q]
    base=rgb.copy()
    for y,x in zip(*np.nonzero(r1)):
        q=inward(y,x,m2) or inward(y,x,m3)
        c=base[q] if q is not None else base[y,x]
        rgb[y,x]=c*k
    res=np.zeros((H,W,4),np.uint8);res[...,:3]=np.clip(np.round(rgb),0,255);res[...,3]=np.where(m,255,0)
    return Image.fromarray(res)
