# こわれた神殿のチップ（statueb、g64）を作って chips.js・アトラスに入れる。
# いまは3Dのお手本の絵（ruin3d.py の ruin_full_nogrid.png、1マス128）を BOX で半分にした絵。もらった絵がとどいたら、それにかえる。
# 置き方：像のマス（左上）が、お手本の絵の (1,3) マス目（ruin3d.EXT の x0=−1・y0=−3）。
import os,sys
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..')
sys.path.insert(0,os.path.join(ROOT,'tools'))
from PIL import Image
import chips
src=sys.argv[1] if len(sys.argv)>1 else os.path.join(HERE,'ruin_full_nogrid.png')
im=Image.open(src).convert('RGBA');im=im.resize((im.width//2,im.height//2),Image.BOX)
bb=im.getchannel('A').point(lambda a:255 if a>=8 else 0).getbbox();im=im.crop(bb)
ax,ay=bb[0]-64,bb[1]-192
head,C=chips.load_imgs()
C['statueb']={'ax':ax,'ay':ay,'w':im.width,'h':im.height,'g':64,'f':[im]}
chips.pack_imgs(head,C);print('statueb',ax,ay,im.size)
