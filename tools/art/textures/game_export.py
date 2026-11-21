#!/usr/bin/env python3
"""ゲームの地面・床・道のチップと、洞窟の水を、tools/art/textures/game に書き出す（GPT・3Dの道具が使えるように）。
  python3 tools/art/textures/game_export.py
チップの絵がかわったら、もう一度動かす。"""
import sys,os,re,glob
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0,os.path.join(ROOT,'tools'));import chips
from PIL import Image,ImageDraw
OUT=os.path.join(ROOT,'tools/art/textures/game');os.makedirs(OUT+'/edge',exist_ok=True)
os.chdir(ROOT);head,A,C=chips.load_js();pages=[Image.open(a).convert('RGBA') for a in A]
def img(k):
    f=C[k]['f'][0]
    if isinstance(f,str):return chips.from_uri(f)
    p,x,y,w,h=f;return pages[p].crop((x,y,x+w,y+h))
BASE=('ground','groundr','path','gravel','stone','brick','floor','stonefloor','herrfloor','carpet','farm','farmw','fringeg','rug1','rug2','hoshirug')
for k in C:
    b=re.split('[#:]',k)[0]
    if not(k.startswith('tex:') or b in BASE):continue
    n=k.replace(':','-').replace('#','_')
    img(k).save(os.path.join(OUT,('edge/' if re.match(r'(brick|stone|carpet|farm|farmw|fringeg)-',n) else '')+n+'.png'))
def sheet(b,n):
    s=Image.new('RGBA',(32*n,32*n))
    for i in range(n*n):
        f=os.path.join(OUT,f'{b}_{i}.png');s.paste(Image.open(f),((i%n)*32,(i//n)*32));os.remove(f)
    s.save(os.path.join(OUT,f'{b}_{n}x{n}.png'))
for b in('stone','brick','floor','herrfloor'):sheet(b,2)
sheet('stonefloor',4)
# 洞窟の水（js/cave.js の cvPaintCell と同じ描き方。1マス64ドット）
M=0xffffffff
def hsh(i):
    i&=M;i=(i^61)^(i>>16);i=(i+(i<<3))&M;i^=i>>4;i=(i*0x27d4eb2d)&M;i^=i>>15;return i/4294967296
TS=32;RND=[9,7,5,4,3,2,2,1,1]
def water(GW,GH,name):
    im=Image.new('RGBA',(GW*TS,GH*TS),(0,0,0,0));d=ImageDraw.Draw(im)
    WT=lambda x,y:0<=x<GW and 0<=y<GH
    for y in range(GH):
        for x in range(GW):
            ox,oy=x*TS,y*TS;h=lambda n:hsh((y*GW+x)*7+n*131+977)
            F=lambda c,a,b,w,hh:d.rectangle([ox+a,oy+b,ox+a+w-1,oy+b+hh-1],fill=c)
            F('#22394a',0,0,TS,TS)
            for i in range(5):F('#1c3142' if h(i)<.5 else '#294456',int(h(i+20)*28),int(h(i+40)*30),4,1)
            if not WT(x,y-1):F('#16242f',0,0,TS,5);F('#2f5266',0,5,TS,1)
            if not WT(x-1,y):F('#2c4b5e',0,0,2,TS)
            if not WT(x+1,y):F('#2c4b5e',TS-2,0,2,TS)
            if not WT(x,y+1):F('#33566b',0,TS-2,TS,2)
            for sx,sy in((-1,-1),(1,-1),(-1,1),(1,1)):
                if WT(x+sx,y) or WT(x,y+sy):continue
                for i,w in enumerate(RND):
                    a=0 if sx<0 else TS-w;b=i if sy<0 else TS-1-i;d.rectangle([ox+a,oy+b,ox+a+w-1,oy+b],fill=(0,0,0,0))
    im=im.resize((im.width*2,im.height*2),Image.NEAREST);im.save(os.path.join(OUT,name));return im
t=water(3,3,'cave-water_3x3.png');water(5,4,'cave-water_pool5x4.png');t.crop((64,64,128,128)).save(os.path.join(OUT,'cave-water_1.png'))
