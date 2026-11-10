# もらった灯台の絵（lighthouse.png）から、チップ lighthouse（g64、2×2マス）を作る。
# 透過と色はそのまま、BOX でちぢめる。はばは基礎のはば（2マス＝128ドット）、下のはし（石段の前）を置くマスの下のはしにそろえる。
import sys,os
sys.dont_write_bytecode=True
from PIL import Image
ROOT=os.path.join(os.path.dirname(__file__),'..','..','..')
sys.path.insert(0,os.path.join(ROOT,'tools'));import chips
W=128
src=Image.open(os.path.join(os.path.dirname(__file__),'lighthouse.png')).convert('RGBA')
box=src.split()[3].point(lambda a:255 if a>20 else 0).getbbox()
im=src.crop(box);H=round(im.height*W/im.width);im=im.resize((W,H),Image.BOX)
h,C=chips.load_imgs()
C['lighthouse']={'g':64,'ax':0,'ay':128-H,'w':W,'h':H,'f':[im]}
chips.pack_imgs(h,C)
print('lighthouse',W,H,'ay',128-H)
