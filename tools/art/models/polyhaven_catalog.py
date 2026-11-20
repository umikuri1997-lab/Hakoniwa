# Poly Haven のモデルの一覧の絵（tools/art/models/polyhaven/catalog.png）を作る。家具と同じ写し方（furn3d の shot、1マス64ドット）
# 写す高さは、モデルの高さ（m）×0.6 マス（めやす。0.15〜2.4）
import os,sys,types
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.dirname(HERE);sys.path.insert(0,os.path.join(ART,'furn3d'));sys.path.insert(0,ART)
from PIL import Image,ImageDraw,ImageFont
import furn3d as F, oblique3d as O, trimesh
from blueprint import Part as P
D=os.path.join(HERE,'polyhaven')
def shot1(f,h):
    M=types.SimpleNamespace(ID=f,GRAD=True,VIEWS=[(f,0)])
    def PARTS():
        p=P(f,'model',('polyhaven/'+f+'.glb',0.5,0.5,0.0,h,0),(200,200,200));p.tex=False;return [p]
    M.PARTS=PARTS;O.GRAD=True;O.OSAT=0
    return F.shot(M,0)[0]
def main():
    ims=[]
    for f in sorted(x[:-4] for x in os.listdir(D) if x.endswith('.glb')):
        h=trimesh.load(os.path.join(D,f+'.glb'),force='scene').extents[1];ims.append((f,shot1(f,max(0.15,min(h*0.6,2.4)))));print(f,flush=True)
    cw=max(max(im.width for _,im in ims),150)+16;ch=max(im.height for _,im in ims)+30;cols=6;rows=(len(ims)+cols-1)//cols
    S=Image.new('RGBA',(cols*cw,rows*ch),(150,190,120,255));d=ImageDraw.Draw(S);fn=ImageFont.load_default()
    for i,(f,im) in enumerate(ims):
        x,y=(i%cols)*cw,(i//cols)*ch;S.alpha_composite(im,(x+(cw-im.width)//2,y+ch-22-im.height));d.text((x+6,y+ch-18),f,fill=(30,40,20),font=fn);d.rectangle([x,y,x+cw-1,y+ch-1],outline=(120,160,96))
    S.save(os.path.join(D,'catalog.png'));print(S.size)
if __name__=='__main__':main()
