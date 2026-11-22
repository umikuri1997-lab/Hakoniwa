#!/usr/bin/env python3
"""洞窟の下絵の絵（1マス64ドット）を、「こさの番号」（0〜5の6だん、灰色 0・50・100・150・200・250）だけの絵にして作る。
ゲーム（js/cave.js の CVTHEMES）が、階ごとの色（6色のならび）にぬりかえるので、1まいの絵で、どの階の色にもなる。0 は輪郭・すきま、5 はいちばん明るい所。
- cave:cols（256×H）：3Dで写した柱の岩のがけ（furn3d の cave_cols。4マスでくりかえす）の、まん中の4マス。上のすきとおった所はそのまま。
- cave:ccols（256×H）：水晶のほらあなの、水晶のかべ（furn3d の cave_ccols。外のモデルの水晶をならべる）。作り方は cave:cols と同じ。
- cave:crys#0〜7・cave:steps：3Dで写した水晶のかたまり（外のモデル、furn3d の cave_crys0〜2）・岩の段（cave_steps）。こさの番号で、階ごとの色にぬりかえる。
- cave:moss（128×128）：コケの地面。CC0 のコケのテクスチャ（moss002）を、こさの番号の6だんに。
- cave:ash（192）・cave:lava（192）・cave:frost（160）・cave:pebble（192）：CC0 のテクスチャ（lava001＋光る所 lava001_e・lava004・ice003・rocks023）を、こさの番号の6だんに。マグマのかさぶたの地面・溶岩・氷のほらあなの霜の地面・化石の大ひろまの小石の地面
- cave:caus（128×128）：水の底の光の網目（1 が網目）。ゆがんだボロノイのふち。
- cave:ground（128×128）：自然の洞窟の地面。コードで1ドットずつ作る（人の作った石だたみにしない。持ち主がきめた）：ふぞろいな色のかたまり・先がとぎれる細いひび・小石・砂つぶ。
使いかた：python3 tools/art/furn3d/furn3d.py cave_cols <フォルダ>/cave_cols
  → python3 tools/art/cave/cave_tex.py <フォルダ> <出すフォルダ> [--chips]
  --chips：ほかの洞窟の絵（<出すフォルダ> の中の cave:*.png と、そのずれ offs.json）といっしょに、チップに入れる"""
import sys,os,json
import numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..')
LV=[0,50,100,150,200,250]
TONED={**{'cave:crys#%d'%n:'cave_crys%d'%n for n in range(8)},'cave:steps':'cave_steps','cave:down':'cave_down'}   # 3Dで写して、こさの番号にする物
PALL=[235,200,160,120,85]   # 3Dで写したときの5だんの灰色（furn3d の PAL）→ こさの番号 5・4・3・2・1。これより暗い輪郭は 0
def tone(a):
    """3Dの絵（RGBA）→ こさの番号の灰色。すきとおった所はそのまま"""
    L=a[...,:3].astype(float).mean(2);idx=np.zeros(L.shape,int)
    for n,p in enumerate(PALL):idx[np.abs(L-p)<18]=5-n
    al=a[...,3]>0;P=np.pad(np.where(al,idx,-1),1,constant_values=-1)   # 輪郭はうすく：となりの明るいほうの面より2だんだけ暗い色（黒にしない。持ち主のきまり）
    nb=np.stack([P[1+dy:1+dy+L.shape[0],1+dx:1+dx+L.shape[1]] for dy,dx in((-1,0),(1,0),(0,-1),(0,1))]).max(0)
    ol=al&(idx==0)&(nb>0);idx[ol]=np.maximum(1,nb[ol]-2)
    o=np.zeros_like(a);g=np.array(LV)[idx];o[...,0]=o[...,1]=o[...,2]=g;o[...,3]=np.where(a[...,3]>0,255,0);return o
def cols(f):
    im=np.asarray(Image.open(f).convert('RGBA'));W=im.shape[1];x0=(W-256)//2;o=tone(im[:,x0:x0+256])
    for x in range(256):   # 岩の上のふちより下のすきまは、いちばん暗いこさでうめる
        ys=np.nonzero(o[:,x,3]>0)[0]
        if len(ys):m=o[ys[0]:,x,3]==0;o[ys[0]:,x][m]=[LV[1],LV[1],LV[1],255]
    return Image.fromarray(o.astype(np.uint8),'RGBA')
def ground(n=256,seed=3):
    """自然の洞窟の地面（こさの番号）。4マスでくりかえす（はしはつながる）。持ち主のたのみで、もやもやの色むら・1ドットの砂つぶをやめた：
    ふつうの土（3）の上に、ふちのはっきりした少しくらい土（2）のかたまりを少し・床にうまった平らな石（上の面4・左上のふち5・右下のふち2）・小石（4と5、下にかげ2）・短いひび（2）"""
    rs=np.random.RandomState(seed);idx=np.full((n,n),3)
    yy,xx=np.mgrid[0:n,0:n]
    def wrapd(cx,cy):dx=(xx-cx+n/2)%n-n/2;dy=(yy-cy+n/2)%n-n/2;return dx,dy
    def blob(cx,cy,r,k,seed2):
        dx,dy=wrapd(cx,cy);a=np.arctan2(dy,dx);rr=np.hypot(dx/1.0,dy/0.8)
        q=np.random.RandomState(seed2);w=r*(1+sum(q.uniform(.05,.16)*np.sin(m*a+q.uniform(0,6.3)) for m in(2,3,5)))
        return rr<w
    for t in range(9):   # くらい土のかたまり（ふちのはっきりした、ゆるいでこぼこの形）
        m=blob(rs.randint(0,n),rs.randint(0,n),rs.uniform(8,15),2,100+t);idx[m]=2
    for t in range(12):   # うまった平らな石：上の面4、左上のふち5、右下のふち2
        cx,cy=rs.randint(0,n),rs.randint(0,n);r=rs.uniform(3.5,7);m=blob(cx,cy,r,4,200+t)
        idx[m]=2;idx[blob(cx-1,cy-1,r-1,4,200+t)]=5;idx[blob(cx-.5,cy-.5,r-1.7,4,200+t)]=4
    for t in range(40):   # 小石
        cx,cy=rs.randint(0,n),rs.randint(0,n);w=rs.randint(2,4);h=2
        for dy in range(h):
            for dx in range(w):idx[(cy+dy)%n,(cx+dx)%n]=4
        idx[cy%n,cx%n]=5
        for dx in range(w):idx[(cy+h)%n,(cx+dx)%n]=2
    for t in range(8):   # 短いひび：まがりながらのびる
        x,y=rs.uniform(0,n),rs.uniform(0,n);a=rs.uniform(0,6.3)
        for k in range(rs.randint(8,15)):
            if idx[int(y)%n,int(x)%n]==3:idx[int(y)%n,int(x)%n]=2
            a+=rs.uniform(-.5,.5);x+=np.cos(a);y+=np.sin(a)
    g=np.array(LV)[idx];o=np.zeros((n,n,4),np.uint8);o[...,0]=o[...,1]=o[...,2]=g;o[...,3]=255
    return Image.fromarray(o,'RGBA')
def moss(n=128):
    """コケの地面（こさの番号）：CC0 のコケのテクスチャ（textures/moss002.png、くりかえしてつながる）を、色の平均（BOX）で n にちぢめ、明るさを6だんにわける（だんの広さはきめた割合）。
    1〜2ドットの点は、まわりの多いだんに（ざらざらにしない）。2マスでくりかえす"""
    im=Image.open(os.path.join(ROOT,'tools','art','textures','moss002.png')).convert('RGB').resize((n,n),Image.BOX)
    a=np.asarray(im,float);L=a[...,0]*.3+a[...,1]*.59+a[...,2]*.11;q=np.quantile(L,[.08,.25,.5,.75,.93]);idx=np.searchsorted(q,L)
    for _ in range(2):
        P=np.pad(idx,1,mode='wrap');nb=np.stack([P[1+dy:1+dy+n,1+dx:1+dx+n] for dy in(-1,0,1) for dx in(-1,0,1) if dx or dy])
        same=(nb==idx[None]).sum(0);mode=np.apply_along_axis(lambda c:np.bincount(c,minlength=6).argmax(),0,nb);idx=np.where(same<=2,mode,idx)
    g=np.array(LV)[idx];o=np.zeros((n,n,4),np.uint8);o[...,0]=o[...,1]=o[...,2]=g;o[...,3]=255
    return Image.fromarray(o,'RGBA')
def tex6(name,n,q=(.08,.25,.5,.75,.93),emit=None,eq=(.88,.965)):
    """フリーのテクスチャ（textures/<name>.png、くりかえしてつながる）を、こさの番号の6だんに（moss と同じ作り方）。
    emit：光る所の絵（溶岩のかさぶたの、光るすじ）。あれば、0〜3 をかさぶたの明るさ、4・5 を光るすじにする"""
    im=Image.open(os.path.join(ROOT,'tools','art','textures',name+'.png')).convert('RGB').resize((n,n),Image.BOX)
    a=np.asarray(im,float);L=a[...,0]*.3+a[...,1]*.59+a[...,2]*.11
    if emit:
        e=np.asarray(Image.open(os.path.join(ROOT,'tools','art','textures',emit+'.png')).convert('RGB').resize((n,n),Image.BOX),float).mean(2)
        idx=np.searchsorted(np.quantile(L,[.2,.5,.8]),L);qe=np.quantile(e,eq);idx=np.where(e>qe[1],5,np.where(e>qe[0],4,idx))
    else:idx=np.searchsorted(np.quantile(L,q),L)
    for _ in range(2):
        P=np.pad(idx,1,mode='wrap');nb=np.stack([P[1+dy:1+dy+n,1+dx:1+dx+n] for dy in(-1,0,1) for dx in(-1,0,1) if dx or dy])
        same=(nb==idx[None]).sum(0);mode=np.apply_along_axis(lambda c:np.bincount(c,minlength=6).argmax(),0,nb);idx=np.where(same<=2,mode,idx)
    g=np.array(LV)[idx];o=np.zeros((n,n,4),np.uint8);o[...,0]=o[...,1]=o[...,2]=g;o[...,3]=255
    return Image.fromarray(o,'RGBA')
def caus(n=128,seed=11):
    """水の底の光の網目（こさの番号：1 が網目、0 がそれ以外）。ゆがんだボロノイのふち。2マスでくりかえす"""
    rs=np.random.RandomState(seed);g=6;P=np.array([((i+.5+rs.uniform(-.35,.35))*n/g,(j+.5+rs.uniform(-.35,.35))*n/g) for j in range(g) for i in range(g)])
    yy,xx=np.mgrid[0:n,0:n].astype(float);a=2*np.pi/n
    wx=xx+3*np.sin(yy*a*2+1)+2*np.sin(yy*a*3);wy=yy+3*np.sin(xx*a*2+2)+2*np.sin(xx*a*3+1)   # ゆがみ（くりかえす波）
    d1=np.full((n,n),1e9);d2=np.full((n,n),1e9)
    for px,py in P:
        for ox in(-n,0,n):
            for oy in(-n,0,n):
                d=np.hypot(wx-px-ox,wy-py-oy);d2=np.where(d<d1,d1,np.minimum(d2,d));d1=np.minimum(d1,d)
    L=(d2-d1)<1.6;o=np.zeros((n,n,4),np.uint8);o[...,0]=o[...,1]=o[...,2]=np.where(L,LV[1],LV[0]);o[...,3]=255
    return Image.fromarray(o,'RGBA')
def main(src,out,chips):
    os.makedirs(out,exist_ok=True)
    R={'cave:cols':cols(os.path.join(src,'cave_cols','cave_cols.png')),'cave:ccols':cols(os.path.join(src,'cave_ccols','cave_ccols.png')),'cave:ground':ground(),'cave:moss':moss(),'cave:ash':tex6('lava001',192,emit='lava001_e'),'cave:lava':tex6('lava004',192,q=(.1,.3,.55,.8,.94)),'cave:frost':tex6('ice003',160),'cave:pebble':tex6('rocks023',192),'cave:caus':caus()};OF={}
    for k,f in TONED.items():   # 3Dで写した、こさの番号の物（水晶・岩の段）。ずれは <フォルダ>/<f>/offs.json（furn3d が出す ax・ay）
        R[k]=Image.fromarray(tone(np.asarray(Image.open(os.path.join(src,f,f+'.png')).convert('RGBA'))).astype(np.uint8),'RGBA');OF[k]=tuple(json.load(open(os.path.join(src,f,'offs.json'))))
    for k,i in R.items():i.save(os.path.join(out,k+'.png'))
    for k in('cave:ground',):   # つながりのたしかめ：2×2
        i=R[k];c=Image.new('RGBA',(256,256))
        for x in(0,1):
            for y in(0,1):c.paste(i,(x*128,y*128))
        c.resize((512,512),Image.NEAREST).save(os.path.join(out,k.replace(':','_')+'_tile.png'))
    if chips:
        sys.path.insert(0,os.path.join(ROOT,'tools'));import chips as CHP
        head,CC=CHP.load_imgs();offs=json.load(open(os.path.join(out,'offs.json')));ch=[]
        for k in('cave:top','cave:floor','cave:face','cave:cliff','cave:bould','cave:flag','cave:crys','cave:kinoko'):CC.pop(k,None)
        for k,i in R.items():CC[k]={'g':64,'ax':OF.get(k,(0,0))[0],'ay':OF.get(k,(0,0))[1],'w':i.width,'h':i.height,'f':[i]};ch.append(k)
        for k,(ax,ay) in offs.items():
            i=Image.open(os.path.join(out,k+'.png')).convert('RGBA');CC[k]={'g':64,'ax':ax,'ay':ay,'w':i.width,'h':i.height,'f':[i]};ch.append(k)
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(ch));print('チップに入れた',len(ch))
if __name__=='__main__':main(sys.argv[1],sys.argv[2],'--chips' in sys.argv)
