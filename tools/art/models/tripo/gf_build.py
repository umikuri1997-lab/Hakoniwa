# 限定の家具25こ（トリポ）を、はじめからおわりまで作りなおして、デザインの絵とならべた「たしかめの絵」を出す。
# 使い方：python3 tools/art/models/tripo/gf_build.py <出力フォルダ> [家具の名前...]   （名前がなければ25こぜんぶ。--chips をつけると、チップにも入れる）
#   1) gf_bake.py：デザインの絵を、テクスチャに焼く（gf/tex2.png）
#   2) gf_edit.py：形の直し（gf/base → gf/*.glb）
#   3) furn3d.py：家具ごとに、4つの向きを写す（設計図 furn3d/items/g_*_t.py）
#   4) <出力>/check.png：家具ごとに、デザインの絵（左）と、写した絵の4つの向き（3倍）をならべる
#   たしかめること（毎回、check.png を開いて見る）：
#     ・もよう（天板・本の背・びょうぶ）が、デザインと同じに読めるか。ほかの物の絵がうつっていないか（うつるなら gf_bake.py の GATE・EDGE）
#     ・白くとんで形が読めない所がないか（matcap.py の VAL）。かげ・輪郭が黒っぽくないか
#     ・点のごみ・穴・すきまがないか。4つの向きで、足もとの高さがそろっているか
#     ・光る物は光って見えるか（設計図の GLOW・PFIRE）。ガラス・水・鏡は、それらしく見えるか（uvfix・glass）
import os,sys,subprocess,numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..','..');D=os.path.join(HERE,'gf')
args=[a for a in sys.argv[1:] if not a.startswith('--')];chips='--chips' in sys.argv;out=os.path.abspath(args[0]);os.makedirs(out,exist_ok=True)
sys.path.insert(0,HERE)
N=['g_w_bed','g_w_stump','g_w_clover','g_w_shelf','g_w_acorn','g_e_planter','g_e_bath','g_e_geode','g_e_arch','g_e_lantern','g_f_table','g_f_sofa','g_f_hanger','g_f_lamp','g_f_screen','g_k_egg','g_k_screen','g_k_fan','g_k_chest','g_k_bed','g_s_sofa','g_s_table','g_s_tank','g_s_jelly','g_s_vanity']
CELL={'g_k_chest':(3,1),'g_k_bed':(3,2),'g_k_screen':(3,3),'g_k_fan':(3,4)}
names=args[1:] or N
run=lambda *c:subprocess.run([sys.executable,*c],check=True,cwd=ROOT,capture_output=True)
run(os.path.join(HERE,'gf_bake.py'));run(os.path.join(HERE,'gf_edit.py'))
from concurrent.futures import ThreadPoolExecutor
def shot(n):
    p=subprocess.run([sys.executable,os.path.join(ROOT,'tools','art','furn3d','furn3d.py'),n+'_t',os.path.join(out,n)]+(['--chips'] if chips else []),cwd=ROOT,capture_output=True)
    if p.returncode:print('しっぱい',n,p.stderr.decode()[-400:])
with ThreadPoolExecutor(1 if chips else 6) as ex:list(ex.map(shot,names))   # チップに入れるときは、1こずつ（chips.js を同時に書きかえない）
des=Image.open(os.path.join(D,'design.png')).convert('RGBA');cw=des.width/5;K=3;CW,CH,DWd=330,330,240
G=Image.new('RGB',(DWd+CW*4,CH*len(names)),(142,196,108));dr=ImageDraw.Draw(G)
for i,n in enumerate(names):
    r,c=CELL.get(n,divmod(N.index(n),5));d=des.crop((int(c*cw),int(r*cw),int((c+1)*cw),int((r+1)*cw)));d.thumbnail((DWd-10,CH-10));G.paste(d,(5,i*CH+5),d);dr.text((6,i*CH+4),n,fill=(40,60,30))
    for k,suf in enumerate(['','_1','_2','_3']):
        f=os.path.join(out,n,n+suf+'.png')
        if not os.path.exists(f):continue
        im=Image.open(f).convert('RGBA');q=max(1,min(K,(CW-6)//im.width,(CH-6)//im.height));im=im.resize((im.width*q,im.height*q),Image.NEAREST);G.paste(im,(DWd+k*CW+(CW-im.width)//2,i*CH+CH-im.height-3),im)
G.save(os.path.join(out,'check.png'));print('たしかめの絵',os.path.join(out,'check.png'))
