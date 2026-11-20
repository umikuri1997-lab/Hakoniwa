# Quaternius のパックごとの一覧の絵（quaternius/<パック>/catalog.png）を作る。家具と同じ写し方（furn3d の shot、1マス64ドット）
# 使い方：python3 tools/art/models/quaternius_catalog.py [パック...]。写す大きさは、いちばん長い辺を SIZE（マス）にそろえる
import os,sys,types,gc
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.dirname(HERE);sys.path.insert(0,os.path.join(ART,'furn3d'));sys.path.insert(0,ART)
from PIL import Image,ImageDraw,ImageFont
import furn3d as F, oblique3d as O, blueprint as BP, trimesh
from blueprint import Part as P
SIZE={'furniture':0.8,'furniture2':0.8,'food':0.35,'props':0.6,'survival':0.7}
def main():
    Q=os.path.join(HERE,'quaternius')
    for k in sys.argv[1:] or SIZE:
        D=os.path.join(Q,k);ims=[]
        for f in sorted(x[:-4] for x in os.listdir(D) if x.endswith('.glb')):
            e=trimesh.load(os.path.join(D,f+'.glb'),force='scene').extents;h=max(0.05,SIZE[k]*e[1]/max(e[1],e[0]*0.8,e[2]*0.8))
            M=types.SimpleNamespace(ID=f,GRAD=True,VIEWS=[(f,0)])
            def PARTS(f=f,h=h):
                p=P(f,'model',('quaternius/%s/%s.glb'%(k,f),0.5,0.5,0.0,h,0),(200,200,200));p.tex=False;return [p]
            M.PARTS=PARTS;O.GRAD=True;O.OSAT=0
            im=F.shot(M,0)[0];im.thumbnail((240,240));ims.append((f,im));BP._MC.clear();gc.collect()
        cols=8;cw=max([im.width for _,im in ims]+[140])+12;ch=max(im.height for _,im in ims)+26;rows=(len(ims)+cols-1)//cols
        S=Image.new('RGBA',(cols*cw,rows*ch),(150,190,120,255));d=ImageDraw.Draw(S);fn=ImageFont.load_default()
        for i,(f,im) in enumerate(ims):
            x,y=(i%cols)*cw,(i//cols)*ch;S.alpha_composite(im,(x+(cw-im.width)//2,y+ch-20-im.height));d.text((x+4,y+ch-16),f[:24],fill=(30,40,20),font=fn);d.rectangle([x,y,x+cw-1,y+ch-1],outline=(120,160,96))
        S.save(os.path.join(D,'catalog.png'));print(k,len(ims),S.size,flush=True)
if __name__=='__main__':main()
