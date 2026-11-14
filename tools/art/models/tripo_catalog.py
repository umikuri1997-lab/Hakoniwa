# トリポのモデルの一覧の絵と、大きさの表を作る（ほかの会話でも、どのモデルがあって、どう見えるかがわかるように）
# 使い方：python3 tools/art/models/tripo_catalog.py
#   出る物：tools/art/models/tripo/catalog.png（どのモデルも、家具と同じ写し方（furn3d の shot、1マス64ドット）で、ゲームの見え方のドット絵に）
#           tools/art/models/tripo/catalog.json（ファイルごとの、もとの形のよこ・おく・高さの比と、三角形の数）
#   モデルを足したら、下の SIZE（一覧で写す高さ。マス）に足して、作りなおす。
import os,sys,json,types
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.dirname(HERE);sys.path.insert(0,os.path.join(ART,'furn3d'))
import numpy as np
from PIL import Image,ImageDraw,ImageFont
import furn3d as F
import oblique3d as O
from blueprint import Part as P
TRIPO=os.path.join(HERE,'tripo')
# 一覧で写す高さ（マス）。ゲームでよく使う大きさのめやす
SIZE={'oak':2.4,'oak_dead':2.2,'cedar':2.6,'maple':2.2,'acacia':2.0,'appletree':2.0,'bamboo':2.2,'berrybush':0.7,'rock':0.5,
      'rosevine':1.0,'rose':0.25,'roseleaf':0.3,'takenoko':0.35,'clover':0.25,'bellflower':0.45,'salvia':0.45,'lily':0.5,'lotus':0.35,
      'mushrooms':0.3,'grass':0.35,'grass2':0.35,'plant':0.6,'sack':0.5,'sacks2':0.6,'jar_band':0.5,'terracotta':0.5,'candle':0.3,
      'lantern':0.45,'wateringcan':0.35,'veggies':0.3,'bathtub':0.6,'cutboard':0.2,'bird':0.2,
      'stump':0.43,'stone_big':0.38,'stone_mid':0.3,'stone_round':0.32,'stone_slab':0.1,'stone_chunk':0.25,'pebbles2':0.08,'pebbles3a':0.08,'pebbles3b':0.08,
      'pebble_a':0.06,'pebble_b':0.04,'pebble_c':0.06,'log_lying':0.22,'firewood':0.12,'sprig':0.18}
def shot1(f,h):
    M=types.SimpleNamespace(ID=f,GRAD=True,VIEWS=[(f,0)])
    def PARTS():
        p=P(f,'model',('tripo/'+f+'.glb',0.5,0.5,0.0,h,0),(200,200,200));p.tex=False;return [p]
    M.PARTS=PARTS;O.GRAD=True;O.OSAT=0
    return F.shot(M,0)[0]
def main():
    import trimesh
    fs=sorted(x[:-4] for x in os.listdir(TRIPO) if x.endswith('.glb'));info={};ims=[]
    for f in fs:
        m=trimesh.load(os.path.join(TRIPO,f+'.glb'),force='mesh');e=m.extents;w,h,d=e[0],e[1],e[2]   # glTF は y が上
        info[f]={'w_per_h':round(float(w/h),3),'d_per_h':round(float(d/h),3),'tris':int(len(m.faces)),'catalog_h':SIZE.get(f,0.5)}
        ims.append((f,shot1(f,SIZE.get(f,0.5))));print(f,info[f])
    json.dump(info,open(os.path.join(TRIPO,'catalog.json'),'w'),ensure_ascii=False,indent=1)
    cw=max(max(im.width for _,im in ims),120)+16;ch=max(im.height for _,im in ims)+30;cols=6;rows=(len(ims)+cols-1)//cols
    sheet=Image.new('RGBA',(cols*cw,rows*ch),(150,190,120,255));d=ImageDraw.Draw(sheet);fnt=ImageFont.load_default()
    for i,(f,im) in enumerate(ims):
        x,y=(i%cols)*cw,(i//cols)*ch;sheet.alpha_composite(im,(x+(cw-im.width)//2,y+ch-22-im.height));d.text((x+6,y+ch-18),f,fill=(30,40,20),font=fnt)
        d.rectangle([x,y,x+cw-1,y+ch-1],outline=(120,160,96))
    sheet.save(os.path.join(TRIPO,'catalog.png'));print('catalog.png',sheet.size)
if __name__=='__main__':main()
