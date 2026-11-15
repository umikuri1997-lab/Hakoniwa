# 柵のドア（gate）の木の色を、オークの柵（fence3d.py）にそろえる。木の所（あたたかい色：r≥g≥b・r−b>30）だけ、柵の正面の色の比でかける。金具（灰色）はそのまま。
# 使い方：python3 tools/art/fence3d/gate_oak.py [--chips]（1回だけ。もとの赤茶色の絵にかける）
import sys,os
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..');sys.path.insert(0,os.path.join(ROOT,'tools'))
import numpy as np
from PIL import Image
import chips as C
K=np.array([177/190,140/123,85/72])   # 柵の正面の色（オーク）÷ 前のドアの正面の色
def oak(im):
    a=np.array(im.convert('RGBA')).astype(float);r,g,b=a[...,0],a[...,1],a[...,2];m=(r>=g)&(g>=b)&(r-b>30)
    a[m,:3]=np.clip(a[m,:3]*K,0,255);return Image.fromarray(a.astype(np.uint8))
if __name__=='__main__':
    h,CC=C.load_imgs();ks=[k for k in CC if k=='gate' or k.startswith('gate#')]
    for k in ks:CC[k]['f']=[oak(f) for f in CC[k]['f']]
    can=Image.new('RGBA',(sum(CC[k]['w']+6 for k in ks),80),(150,190,120,255));x=0
    for k in ks:can.alpha_composite(CC[k]['f'][0],(x,0));x+=CC[k]['w']+6
    if sys.argv[-1].endswith('.png'):can.resize((can.width*4,can.height*4),Image.NEAREST).save(sys.argv[-1])   # たしかめの絵
    if '--chips' in sys.argv:C.pack_imgs(h,CC);open(os.path.join(ROOT,'.chips_changed'),'a').write('\n'+'\n'.join(ks));print('入れた',ks)
