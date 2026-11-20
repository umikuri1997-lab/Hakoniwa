#!/usr/bin/env python3
"""洞窟の下絵の、つながる絵を作る（1マス64ドット）。
- cave:face（256×60）・cave:cliff（256×28）：3Dで写した岩はだ（furn3d の cave_wall。4マスでくりかえす）から、4マスぶんを切る。
  face は下の48行（岩の正面）、cliff は下の28行（がけの正面。少し明るく）。すきまは、岩のかげの色でうめる。
- cave:floor（128×128）・cave:top（128×128）：CC0 の岩のテクスチャ（tools/art/textures/rock030.png、ambientCG Rock030）を、
  法線マップで左上の光のかげをつけ、BOX でちぢめて、4つのこさの色にする（1〜2ドットの点はまわりの色に）（くりかえしてもつながる）。floor は明るい床、top は岩の上の面（暗い）。
使いかた：python3 tools/art/furn3d/furn3d.py cave_wall <フォルダ> → python3 tools/art/cave/cave_tex.py <フォルダ>/cave_wall.png <出すフォルダ> [--chips]
  --chips：ほかの洞窟の絵（<出すフォルダ> の中の cave:*.png と、そのずれ offs.json）といっしょに、チップに入れる"""
import sys,os,json
import numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..')
FLOOR=[(98,90,84),(107,98,91),(116,106,98),(126,115,106)]   # 床：暗い→明るい（つめたい灰色がかった茶）
TOP=[(30,27,27),(37,33,32),(45,40,38),(54,48,45)]            # 岩の上の面（ほとんど黒）
GAP=(56,51,49)
def tones(src,n,pal,blur=0):
    """CC0 の岩のテクスチャ（色と法線）から、左上の光でかげをつけ、BOX でちぢめて、色の数を pal にする（くりかえしてもつながる）"""
    from PIL import ImageFilter
    al=np.asarray(Image.open(src).convert('L').resize((n,n),Image.BOX),float)/255
    nm=np.asarray(Image.open(src.replace('.png','_n.png')).convert('RGB').resize((n,n),Image.BOX),float)/127.5-1
    L=np.array([-0.5,-0.6,0.62]);L/=np.linalg.norm(L);sh=np.clip((nm*L).sum(2),0,1)
    v=0.55*sh+0.45*al
    if blur:
        t=Image.fromarray((v*255).astype(np.uint8));b=Image.new('L',(n*3,n*3));[b.paste(t,(x*n,y*n)) for x in range(3) for y in range(3)]
        v=np.asarray(b.filter(ImageFilter.GaussianBlur(blur)).crop((n,n,2*n,2*n)),float)/255
    q=np.quantile(v,np.linspace(0,1,len(pal)+1)[1:-1]);idx=np.digitize(v,q)
    # 1〜2ドットだけの点は、まわりの多い色にする（ざらざらの点を出さない。はしはつなげて見る）
    for _ in range(2):
        P=np.pad(idx,1,mode='wrap');nb=np.stack([P[1+dy:1+dy+n,1+dx:1+dx+n] for dy in(-1,0,1) for dx in(-1,0,1) if dx or dy])
        same=(nb==idx[None]).sum(0);mode=np.apply_along_axis(lambda c:np.bincount(c,minlength=len(pal)).argmax(),0,nb)
        idx=np.where(same<=1,mode,idx)
    return Image.fromarray(np.array(pal,np.uint8)[idx],'RGB').convert('RGBA')
def strip(face,h,gain=0):
    """3Dで写した岩はだ（cave_wall）の、まん中の4マスを、下から h 行切る。岩の上のふちより上はすきとおったまま（岩の上の面が見える）、
    岩のあいだのすきまは、岩のかげの色でうめる"""
    im=Image.open(face).convert('RGBA');W=im.width;x0=(W-256)//2;c=im.crop((x0,im.height-h,x0+256,im.height))
    a=np.asarray(c).astype(int);o=a.copy()
    for x in range(256):
        col=a[:,x,3];ys=np.nonzero(col>0)[0]
        if not len(ys):continue
        for y in range(ys[0],h):
            if col[y]==0:o[y,x,:3]=GAP;o[y,x,3]=255
    if gain:o[...,:3]=np.where(o[...,3:4]>0,np.clip(o[...,:3]+gain,0,255),o[...,:3])
    return Image.fromarray(o.astype(np.uint8),'RGBA')
def main(face,out,chips):
    os.makedirs(out,exist_ok=True);T=os.path.join(ROOT,'tools','art','textures','rock030.png')
    R={'cave:floor':tones(T,128,FLOOR,1.5),'cave:top':tones(T,128,TOP,3),'cave:face':strip(face,60),'cave:cliff':strip(face,28,8)}
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
