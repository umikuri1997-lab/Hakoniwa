"""gameview.js で写した絵に、マス目（96ドット）と、置くマスの黄色のわくをつけて webp にする。
つかいかた：python3 tools/gameview_grid.py <写した絵のフォルダ> <出力フォルダ> <gameinfo.json>
gameinfo.json は {id:{sz:[よこ,たて]}}（ゲームの BL の sz）。"""
import json,os,sys
from PIL import Image,ImageDraw
src,dst,gi=sys.argv[1],sys.argv[2],json.load(open(sys.argv[3]))
os.makedirs(dst,exist_ok=True)
for f in sorted(os.listdir(src)):
    if not f.endswith('.png'):continue
    id=f[:-4];z=gi.get(id,{'sz':[1,1]})['sz']
    if id in('rug1','rug2','hoshirug'):z=[2,2]
    im=Image.open(os.path.join(src,f)).convert('RGBA');ov=Image.new('RGBA',im.size,(0,0,0,0));d=ImageDraw.Draw(ov)
    ox=(240-z[0]*48)%96;oy=(240-z[1]*48)%96
    for x in range(ox,480,96):d.line((x,0,x,480),fill=(255,255,255,110))
    for y in range(oy,480,96):d.line((0,y,480,y),fill=(255,255,255,110))
    x0=240-z[0]*48;y0=240-z[1]*48;d.rectangle((x0,y0,x0+z[0]*96,y0+z[1]*96),outline=(255,214,74,230),width=2)
    Image.alpha_composite(im,ov).convert('RGB').save(os.path.join(dst,id+'.webp'),'WEBP',quality=88)
