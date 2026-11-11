# もらったノームの石像の絵（gnome.png）から、チップ stele（g64、1×1マス）を作る。
# 透過と色はそのまま、BOX でちぢめる。まわりの、ほとんど見えないゴミの点（うすさ20以下で、絵から6ドットより遠い所）だけ消す。
# はばは台座のはば（52ドット＝3Dのお手本の0.8マス）、台座の手前の下のはしを、マスの上から60ドットにそろえる。
import sys,os
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageFilter
ROOT=os.path.join(os.path.dirname(__file__),'..','..','..')
sys.path.insert(0,os.path.join(ROOT,'tools'));import chips
W,BOT=52,60
src=Image.open(os.path.join(os.path.dirname(__file__),'gnome.png')).convert('RGBA')
a=src.split()[3];near=a.point(lambda v:255 if v>20 else 0).filter(ImageFilter.MaxFilter(13))
arr=np.array(src);arr[...,3]=np.where(np.array(near)>0,arr[...,3],0);src=Image.fromarray(arr)
box=a.point(lambda v:255 if v>20 else 0).getbbox()
im=src.crop(box);H=round(im.height*W/im.width);im=im.resize((W,H),Image.BOX)
h,C=chips.load_imgs()
C['stele']={'g':64,'ax':32-W//2,'ay':BOT-H,'w':W,'h':H,'f':[im]}
chips.pack_imgs(h,C)
print('stele',W,H,'ax',32-W//2,'ay',BOT-H)
