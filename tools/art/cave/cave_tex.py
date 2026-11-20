#!/usr/bin/env python3
"""洞窟の下絵の、つながる絵を作る（1マス64ドット）。
- cave:face（256×48）・cave:cliff（256×28）：3Dで写した岩はだ（furn3d の cave_face。4マスでくりかえす）から、4マスぶんを切る。
  face は下の48行（岩の正面）、cliff は下の28行（がけの正面。少し明るく）。すきまは、岩のかげの色でうめる。
- cave:floor（128×128）・cave:top（128×128）：CC0 の岩のテクスチャ（tools/art/textures/rock030.png、ambientCG Rock030）を、
  BOX でちぢめ、ぼかしてから、3つのこさの色にする（ざらざらの点を出さない）（くりかえしてもつながる）。floor は明るい床、top は岩の上の面（暗い）。
使いかた：python3 tools/art/furn3d/furn3d.py cave_face <フォルダ> → python3 tools/art/cave/cave_tex.py <フォルダ>/cave_face.png <出すフォルダ> [--chips]
  --chips：ほかの洞窟の絵（<出すフォルダ> の中の cave:*.png と、そのずれ offs.json）といっしょに、チップに入れる"""
import sys,os,json
import numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..')
FLOOR=[(118,104,90),(134,119,103),(148,132,115),(160,144,126),(174,158,140)]   # 床：暗い→明るい
TOP=[(46,39,34),(54,46,40),(62,53,46),(71,61,53),(82,71,62)]                   # 岩の上の面
GAP=(70,60,54)
def tones(src,n,pal,blur=0):
    im=Image.open(src).convert('L').resize((n,n),Image.BOX)
    if blur:   # ざらざらの点をなくす：はしをつなげたまま、ぼかしてから色をわける
        from PIL import ImageFilter
        t=Image.new('L',(n*3,n*3));[t.paste(im,(x*n,y*n)) for x in range(3) for y in range(3)];im=t.filter(ImageFilter.GaussianBlur(blur)).crop((n,n,2*n,2*n))
    a=np.asarray(im,float)
    q=np.quantile(a,np.linspace(0,1,len(pal)+1)[1:-1]);idx=np.digitize(a,q)
    return Image.fromarray(np.array(pal,np.uint8)[idx],'RGB').convert('RGBA')
def strip(face,h,gain=0):
    im=Image.open(face).convert('RGBA');W=im.width;x0=(W-256)//2;c=im.crop((x0,im.height-h,x0+256,im.height))
    a=np.asarray(c).astype(int);bg=np.zeros_like(a);bg[...,:3]=GAP;bg[...,3]=255
    al=a[...,3:4]/255.0;o=a*al+bg*(1-al);o[...,3]=255
    if gain:o[...,:3]=np.clip(o[...,:3]+gain,0,255)
    return Image.fromarray(o.astype(np.uint8),'RGBA')
def main(face,out,chips):
    os.makedirs(out,exist_ok=True);T=os.path.join(ROOT,'tools','art','textures','rock030.png')
    R={'cave:floor':tones(T,128,FLOOR[1:4],4),'cave:top':tones(T,128,TOP[1:4],4),'cave:face':strip(face,48),'cave:cliff':strip(face,28,10)}
    for k,i in R.items():i.save(os.path.join(out,k+'.png'))
    # つながりのたしかめ：2つならべた絵
    for k in('cave:face','cave:floor'):
        i=R[k];c=Image.new('RGBA',(i.width*2,i.height*(2 if k=='cave:floor' else 1)))
        for x in(0,1):
            for y in range(c.height//i.height):c.paste(i,(x*i.width,y*i.height))
        c.resize((c.width*2,c.height*2),Image.NEAREST).save(os.path.join(out,k.replace(':','_')+'_tile.png'))
    if chips:
        sys.path.insert(0,os.path.join(ROOT,'tools'));import chips as CHP
        head,CC=CHP.load_imgs();offs=json.load(open(os.path.join(out,'offs.json')));ch=[]
        for k,i in R.items():CC[k]={'g':64,'ax':0,'ay':0,'w':i.width,'h':i.height,'f':[i]};ch.append(k)
        for k,(ax,ay) in offs.items():
            i=Image.open(os.path.join(out,k+'.png')).convert('RGBA');CC[k]={'g':64,'ax':ax,'ay':ay,'w':i.width,'h':i.height,'f':[i]};ch.append(k)
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(ch));print('チップに入れた',len(ch))
if __name__=='__main__':main(sys.argv[1],sys.argv[2],'--chips' in sys.argv)
