# 灯台（lighthouse、2×2マス）：3Dの設計図（tools/art/furn3d/items/lighthouse.py）から写した本体に、光の筋の4コマをつけて、チップにする（スキル model3d-pixel）。
# 使い方：python3 tools/art/lighthouse/lighthouse_px.py <出力フォルダ> [--chips]
# 光の筋：前の絵と同じ出方（1・2コマめはなし、3コマめは短く、4コマめは長く）。灯室のガラスの左右から外へひろがる、うすい光のドット絵。
# 本体はどのコマも1コマめとまったく同じ絵で、光の筋だけがかわる（光は本体のうしろ）。
import sys,os
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..')
sys.path.insert(0,os.path.join(HERE,'..','furn3d'));sys.path.insert(0,os.path.join(ROOT,'tools'))
import furn3d
PAD=40   # 光の筋のために、左右へひろげるはば
LIGHT=(255,244,200)
def glass_box(im):
    """灯室のガラス（あかりのついた黄色）のある所"""
    a=np.array(im).astype(int);m=(a[...,3]>0)&(a[...,0]>235)&(a[...,1]>195)&(a[...,2]<205)&(a[...,0]-a[...,2]>50)
    ys,xs=np.nonzero(m);return xs.min(),xs.max(),ys.min(),ys.max()
def beam(W,H,box,reach):
    """光の筋（左右）。ガラスのはしから reach ドット外へ。外へいくほど少しひろがり、3だんでうすくなる"""
    GX0,GX1,GY0,GY1=box;im=Image.new('RGBA',(W+2*PAD,H),(0,0,0,0));px=im.load();cy=(GY0+GY1)/2;h0=(GY1-GY0)/2-2
    for d in range(reach):
        hh=int(h0+d*0.22);a=150 if d<reach*0.35 else 105 if d<reach*0.7 else 65
        for x in (PAD+GX0-1-d,PAD+GX1+1+d):
            if not 0<=x<W+2*PAD:continue
            for y in range(int(cy-hh),int(cy+hh)+1):
                if 0<=y<H:px[x,y]=LIGHT+(a,)
    return im
def main(out,chips=False):
    CH=furn3d.run('lighthouse',out);body,ax,ay=CH['lighthouse'];W,H=body.size;box=glass_box(body)
    print('ガラス',box)
    frames=[]
    for reach in (0,0,PAD+box[0]-24,PAD+box[0]):
        f=beam(W,H,box,reach) if reach else Image.new('RGBA',(W+2*PAD,H),(0,0,0,0))
        f.alpha_composite(body,(PAD,0));frames.append(f)
    can=Image.new('RGBA',(sum(f.width+4 for f in frames),H),(150,190,120,255));x=0
    for f in frames:can.alpha_composite(f,(x,0));x+=f.width+4
    can.resize((can.width*2,can.height*2),Image.NEAREST).save(os.path.join(out,'lighthouse_frames_x2.png'))
    if chips:
        import chips as CHP
        h,C=CHP.load_imgs();C['lighthouse']={'g':64,'ax':ax-PAD,'ay':ay,'w':W+2*PAD,'h':H,'f':frames}
        CHP.pack_imgs(h,C);open(os.path.join(ROOT,'.chips_changed'),'w').write('lighthouse');print('チップに入れた lighthouse',W+2*PAD,H,'ax',ax-PAD,'ay',ay)
if __name__=='__main__':main(sys.argv[1],'--chips' in sys.argv)
