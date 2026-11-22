"""gameview_boot.cjs で写した絵に、ひし形のマス目と、置くマスの黄色のわくをつけて webp にする（クォータービュー）。
つかいかた：python3 tools/gameview_grid.py <写した絵のフォルダ> <出力フォルダ>
写した絵のフォルダの info.json（id → 置いたマスの大きさ sz）を使う。写した絵は3倍（info.json の k 倍）で、置く所のまん中の地面の点が (240,300)。
ひし形のマスは、せかいの1マスが画面で よこ 64×3・たて 48×3（js/iso.js の IQW・IQH）。"""
import json,os,sys
from PIL import Image,ImageDraw
src,dst=sys.argv[1],sys.argv[2];gi=json.load(open(os.path.join(src,'info.json')))
os.makedirs(dst,exist_ok=True)
CX,CY=240,300
for f in sorted(os.listdir(src)):
    if not f.endswith('.png'):continue
    id=f[:-4];z=gi.get(id,{'sz':[1,1]})['sz']
    K=gi.get(id,{}).get('k',3);A=64/2*K;B=48/2*K   # gameview_boot.cjs と同じ倍率
    P=lambda u,v:(CX+(u-v)*A,CY+(u+v)*B)   # 置く所のまん中からのマスの数 (u,v) → 写した絵の点
    u0,v0=-z[0]/2,-z[1]/2
    im=Image.open(os.path.join(src,f)).convert('RGBA');ov=Image.new('RGBA',im.size,(0,0,0,0));d=ImageDraw.Draw(ov)
    for k in range(-8,9):
        d.line((P(u0+k,v0-8),P(u0+k,v0+8)),fill=(255,255,255,110))
        d.line((P(u0-8,v0+k),P(u0+8,v0+k)),fill=(255,255,255,110))
    d.polygon([P(u0,v0),P(u0+z[0],v0),P(u0+z[0],v0+z[1]),P(u0,v0+z[1])],outline=(255,214,74,230),width=2)
    Image.alpha_composite(im,ov).convert('RGB').save(os.path.join(dst,id+'.webp'),'WEBP',quality=88)
