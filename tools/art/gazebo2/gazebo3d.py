# ガゼボの大まかな形（3D）を、ゲームと同じ見え方で写す：x=東, y=南, z=上。画面 = (x, y-0.8z)。横の面（東・西）は見えない、北の面も見えない。
from PIL import Image, ImageDraw
S=128  # 1マスの大きさ（ドット）
X0,X1,Y0,Y1=-1.0,3.0,-3.0,3.0  # 写す範囲（マス）
W,H=int((X1-X0)*S),int((Y1-Y0)*S)
BG=(235,230,211);GRID=(201,194,168)
TOP=(248,238,200);FRONT=(214,190,148);LINE=(168,145,107)
ROOF_S=(224,214,186);ROOF_N=(205,196,170);ROOF_EW=(214,205,178);FASCIA=(196,178,140)
def P(x,y,z):return ((x-X0)*S,(y-0.8*z-Y0)*S)
def poly(d,pts,fill):d.polygon([P(*p) for p in pts],fill=fill,outline=LINE)
def box(d,x0,y0,x1,y1,z0,z1):
    poly(d,[(x0,y1,z0),(x1,y1,z0),(x1,y1,z1),(x0,y1,z1)],FRONT)   # 南の面
    poly(d,[(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)],TOP)     # 上の面
PH=1.7            # 柱の高さ（屋根の下が、いまのゲームの絵と同じくらいあく）
INS,PW=0.03,0.16   # 柱の位置（四すみによせる）・太さ
O=0.2              # 屋根ののき（外へ出る長さ）
RZ=PH+0.08         # 屋根の下のはし
AZ=RZ+0.6          # 屋根のてっぺん
posts={'back':[(INS,INS),(2-INS-PW,INS)],'front':[(INS,2-INS-PW),(2-INS-PW,2-INS-PW)]}
def back_layer(d):
    for (x,y) in posts['back']:box(d,x,y,x+PW,y+PW,0,PH)
    box(d,INS,INS,2-INS,INS+PW*0.6,PH-0.12,PH)  # うしろのはり
def front_layer(d):
    for (x,y) in posts['front']:box(d,x,y,x+PW,y+PW,0,PH)
    box(d,INS,2-INS-PW*0.6,2-INS,2-INS,PH-0.12,PH)  # 前のはり
    a=(1,1,AZ);c=[(-O,-O,RZ),(2+O,-O,RZ),(2+O,2+O,RZ),(-O,2+O,RZ)]
    poly(d,[c[0],c[1],a],ROOF_N)            # 北の屋根
    poly(d,[c[3],c[0],a],ROOF_EW)           # 西の屋根
    poly(d,[c[1],c[2],a],ROOF_EW)           # 東の屋根
    poly(d,[c[2],c[3],a],ROOF_S)            # 南の屋根
    poly(d,[(-O,2+O,RZ-0.1),(2+O,2+O,RZ-0.1),(2+O,2+O,RZ),(-O,2+O,RZ)],FASCIA)  # のき先の板（前）
    box(d,0.94,0.94,1.06,1.06,AZ,AZ+0.2)    # てっぺんのかざり
def base(grid):
    im=Image.new('RGBA',(W,H),BG+(255,) if grid else (0,0,0,0));d=ImageDraw.Draw(im)
    if grid:
        for i in range(int(X1-X0)+1):d.line([(i*S,0),(i*S,H)],fill=GRID,width=2)
        for j in range(int(Y1-Y0)+1):d.line([(0,j*S),(W,j*S)],fill=GRID,width=2)
        d.rectangle([P(0,0,0),P(2,2,0)],outline=(214,170,70),width=3)  # 置くマス（2×2）
    return im,d
import sys
out=sys.argv[1]
for grid in (True,False):
    sfx='' if grid else '_nogrid'
    im,d=base(grid);back_layer(d);front_layer(d);im.save(f'{out}/gazebo_full{sfx}.png')
    im,d=base(grid);front_layer(d);im.save(f'{out}/gazebo_front{sfx}.png')
    im,d=base(grid);back_layer(d);im.save(f'{out}/gazebo_back{sfx}.png')
print('ok',W,H)
