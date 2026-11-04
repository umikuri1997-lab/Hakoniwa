# ベリージュース・りんごジュースのアイコン（32x32 のドット絵を3倍）を assets/g に作る。名前は中身の sha1 の先10文字
from PIL import Image
import hashlib,sys
def glass(liq,liqd,gar):
    im=Image.new('RGBA',(32,32),(0,0,0,0));p=im.putpixel
    G=(232,244,250,150);E=(176,198,212,255);H=(255,255,255,230)
    for y in range(9,29):
        w0=9+(y-9)//10; w1=22-(y-9)//10
        for x in range(w0,w1+1):
            if x in(w0,w1) or y==28: p((x,y),E)
            elif y>=13: p((x,y),liq if x<w1-3 else liqd)
            else: p((x,y),G)
        if 12<y<26: p((w0+2,y),H)
    for x in range(10,22): p((x,13),tuple(min(255,c+40) for c in liq[:3])+(255,))
    for y in range(4,20): p((19+(y<9 and (8-y)//3 or 0),y),(240,120,130,255)); 
    for y in range(4,20): p((20+(y<9 and (8-y)//3 or 0),y),(255,190,195,255))
    gar(p);return im
def apple(p):
    for (x,y) in [(6,10),(7,10),(8,10),(5,11),(6,11),(7,11),(8,11),(9,11),(5,12),(6,12),(7,12),(8,12),(9,12),(6,13),(7,13),(8,13)]:p((x,y),(232,96,90,255))
    for (x,y) in [(6,11),(7,11),(6,12),(7,12)]:p((x,y),(255,236,190,255))
    p((7,9),(120,180,90,255));p((8,8),(140,200,100,255))
def berry(p):
    for cx,cy in[(6,11),(9,10)]:
        for dx,dy in[(0,0),(1,0),(0,1),(1,1),(-1,0),(0,-1)]:p((cx+dx,cy+dy),(150,80,170,255))
        p((cx,cy-1),(210,160,225,255))
    p((8,8),(120,180,90,255))
for name,liq,liqd,g in[('applejuice',(250,214,120,255),(236,190,96,255),apple),('berryjuice',(214,128,190,255),(190,104,170,255),berry)]:
    im=glass(liq,liqd,g).resize((96,96),Image.NEAREST);import io;b=io.BytesIO();im.save(b,'WEBP',lossless=True,exact=True);d=b.getvalue();h=hashlib.sha1(d).hexdigest()[:10];open('assets/g/%s.webp'%h,'wb').write(d);print(name,h)
