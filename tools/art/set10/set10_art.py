# もらった絵（src/）から、set10 の家具のチップを作る：ベンチ・キャビネット（前・右向き）・かざり棚・本棚（前・右向き）・木箱。
# ちぢめ方は tools/art/pixdown.py（セルごとの色の多いほう・中の線を1ドット・外の輪郭を1ドット。ドットのますめにそろう）。設定と、手でなおす所は set10_pix.py。
# 食料箱・素材箱は、前の絵のまま（src/stor_old・src/mbox_old）。左向きは、ゲームで右向きの絵を反転して使う。
# 置く場所（よこのまん中・下のはし）は、前のチップと同じ実数。
import sys,os,json
sys.dont_write_bytecode=True
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..')
sys.path.insert(0,os.path.join(ROOT,'tools'));sys.path.insert(0,os.path.join(ROOT,'tools','art'));sys.path.insert(0,HERE)
import chips,pixdown,set10_pix as CFG
S=os.path.join(HERE,'src')
h,C=chips.load_imgs()
def put(id,im,cx,bottom):
    w,hh=im.size;C[id]={'g':64,'ax':round(cx-w/2),'ay':bottom-hh,'w':w,'h':hh,'f':[im]};print(id,w,hh,'ax',C[id]['ax'],'ay',C[id]['ay'])
def pix(id):
    c=CFG.OBJS[id];return pixdown.make(CFG.source(c['src']),c['box'],c.get('w'),c.get('h'),c.get('sc'),c.get('lines'),CFG.FIX.get(id))
PLACE={'bench':(63.5,64),'cabinet':(32,39),'cabinet>1':(27,60),'shelf2':(32,42),'shelf1':(32,44),'shelf1>1':(32,59),'crate':(32,45)}
for id,(cx,bt) in PLACE.items():put(id,pix(id),cx,bt)
for id in ('stor','mbox'):   # 前の絵のまま
    d=os.path.join(S,id+'_old');C[id]=dict(json.load(open(os.path.join(d,'meta.json'))),f=[Image.open(os.path.join(d,'0.png')).convert('RGBA')])
chips.pack_imgs(h,C)
