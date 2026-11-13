# 木箱を、設計図（crate_parts.py）から3Dに組み、ドット絵に写す（スキル model3d-pixel のお手本）。
# 使い方：python3 tools/art/crate3d/crate3d.py <出力フォルダ>
# 出す物：bp_crate.png（設計図）・crate.png（ドット絵、1マス64ドット）・crate_big.png（3Dのたしかめ用、1マス512ドット）・
#         crate_x10.png（10倍）・cmp_x4.png（いまのチップ crate とならべた4倍）
import sys,os
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
sys.path.insert(0,ART);sys.path.insert(0,HERE)
import oblique3d as O
from blueprint import build,blueprint,check
from PIL import Image
import crate_parts as C
out=sys.argv[1];os.makedirs(out,exist_ok=True)
L=C.parts();bad=check(L);print('ささえのたしかめ',bad or 'まちがいなし')
blueprint(os.path.join(out,'bp_crate.png'),'木箱',L,(1,1),(-0.1,1.1,0.3,1.1,0.8))
def scene():
    sc=O.Scene();sc.texture(O.Tex(os.path.join(ART,'textures','wood049.png')));build(sc,L);return sc
m=2/64;ext=(-m,1+m,C.Y0-0.8*0.665-m,C.Y1+m)       # 置く範囲＋まわり2ドット（外の輪郭が入るように）
O.S=64;im=O.render_px(scene(),O.game,ext,O.VIEW,k=0.72);im=im.crop(im.getbbox());im.save(os.path.join(out,'crate.png'))
O.S=512;O.render_px(scene(),O.game,ext,O.VIEW).save(os.path.join(out,'crate_big.png'))
im.resize((im.width*10,im.height*10),Image.NEAREST).save(os.path.join(out,'crate_x10.png'))
sys.path.insert(0,os.path.join(ROOT,'tools'))
try:
    import chips;_,CH=chips.load_imgs();cur=CH['crate']['f'][0].convert('RGBA')
    can=Image.new('RGBA',(150,84),(150,190,120,255))
    for i,b in enumerate([cur,im]):can.alpha_composite(b,(5+i*74,84-b.height-6))
    can.resize((can.width*4,can.height*4),Image.NEAREST).save(os.path.join(out,'cmp_x4.png'))
except Exception as e:print('いまのチップとならべられなかった',e)
print('ドット絵',im.size)
