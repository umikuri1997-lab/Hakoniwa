"""もらった横のベッドの絵（tools/art/bed2/bed.png、77×77、うしろが白）を、横のベッドのチップ bed>1 にする。
まわりの白（はしからつながった白）だけを透明にして、大きさはそのまま（トリミングしてそのまま）。"""
from PIL import Image
from collections import deque
def make(src='tools/art/bed2/bed.png'):
    im=Image.open(src).convert('RGBA');W,H=im.size;px=im.load()
    white=lambda p:min(p[:3])>=248
    seen=set();q=deque((x,y) for x in range(W) for y in (0,H-1))
    q.extend((x,y) for y in range(H) for x in (0,W-1))
    while q:
        x,y=q.popleft()
        if (x,y) in seen or not(0<=x<W and 0<=y<H) or not white(px[x,y]):continue
        seen.add((x,y));px[x,y]=(255,255,255,0)
        q.extend(((x+1,y),(x-1,y),(x,y+1),(x,y-1)))
    return im.crop(im.getbbox())
if __name__=='__main__':
    o=make();print(o.size);o.save('/tmp/bed2.png')
