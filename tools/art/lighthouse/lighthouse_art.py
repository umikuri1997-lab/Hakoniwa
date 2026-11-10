# もらった灯台の絵（lighthouse.png）から、チップ lighthouse（g64、2×2マス）を作る。
# 透過と色はそのまま、BOX でちぢめる。はばは基礎のはば（2マス＝128ドット）、下のはし（石段の前）を置くマスの下のはしにそろえる。
# 光の筋：4コマ（前の絵と同じ出方。1・2コマめはなし、3コマめは短く、4コマめは長く）。灯室のガラスの左右から外へひろがる、うすい光のドット絵。
# 本体はどのコマも1コマめとまったく同じ絵で、光の筋だけがかわる（光は本体のうしろ）。
import sys,os
sys.dont_write_bytecode=True
from PIL import Image
ROOT=os.path.join(os.path.dirname(__file__),'..','..','..')
sys.path.insert(0,os.path.join(ROOT,'tools'));import chips
W=128          # 本体のはば（基礎のはば＝2マス）
PAD=40         # 光の筋のために、左右へひろげるはば
src=Image.open(os.path.join(os.path.dirname(__file__),'lighthouse.png')).convert('RGBA')
box=src.split()[3].point(lambda a:255 if a>20 else 0).getbbox()
body=src.crop(box);H=round(body.height*W/body.width);body=body.resize((W,H),Image.BOX)
GX0,GX1,GY0,GY1=41,86,76,105   # 灯室のガラス（本体の絵の中のドット）
LIGHT=(255,244,200)
def beam(reach):
    """光の筋（左右）。ガラスのはしから reach ドット外へ。外へいくほど少しひろがり、3だんでうすくなる"""
    im=Image.new('RGBA',(W+2*PAD,H),(0,0,0,0));px=im.load();cy=(GY0+GY1)/2;h0=(GY1-GY0)/2-2
    for d in range(reach):
        hh=int(h0+d*0.22);a=150 if d<reach*0.35 else 105 if d<reach*0.7 else 65
        for x in (PAD+GX0-1-d,PAD+GX1+1+d):
            for y in range(int(cy-hh),int(cy+hh)+1):px[x,y]=LIGHT+(a,)
    return im
frames=[]
for reach in (0,0,PAD+GX0-24,PAD+GX0):
    f=beam(reach) if reach else Image.new('RGBA',(W+2*PAD,H),(0,0,0,0))
    f.alpha_composite(body,(PAD,0));frames.append(f)
h,C=chips.load_imgs()
C['lighthouse']={'g':64,'ax':-PAD,'ay':128-H,'w':W+2*PAD,'h':H,'f':frames}
chips.pack_imgs(h,C)
print('lighthouse',W+2*PAD,H,'ax',-PAD,'ay',128-H)
