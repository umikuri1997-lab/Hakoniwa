# パラソルの大まかな形（3D）を、ゲームと同じ見え方で写す：x=東, y=南, z=上。画面 = (x, y-0.8z)。
# 横の面（東・西）・北の面は見えない。上を向いた面は、上から見た形のまま（ちぢまない）。
import math,sys
from PIL import Image, ImageDraw
S=128                       # 1マスの大きさ（ドット）
X0,X1,Y0,Y1=-1.0,2.0,-2.0,2.0
W,H=int((X1-X0)*S),int((Y1-Y0)*S)
BG=(235,230,211);GRID=(201,194,168);LINE=(168,145,107)
PINK=(240,184,164);CREAM=(250,236,206);WOOD=(214,170,112);WOODF=(190,146,92)
CX,CY=0.5,0.5               # 柱のまん中（置くマスのまん中）
R=0.65                      # かさの半径（直径1.3マス）
RZ=1.4                      # かさのふちの高さ（柱が見えるように高め）
AZ=1.75                     # かさのてっぺんの高さ
N=8                         # かさの布のまい数
def P(x,y,z):return ((x-X0)*S,(y-0.8*z-Y0)*S)
def poly(d,pts,fill):d.polygon([P(*p) for p in pts],fill=fill,outline=LINE)
def box(d,x0,y0,x1,y1,z0,z1,top,front):
    poly(d,[(x0,y1,z0),(x1,y1,z0),(x1,y1,z1),(x0,y1,z1)],front)
    poly(d,[(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)],top)
def cyl(d,r,z0,z1,top,front,n=24):  # 丸い物：手前半分の側面と、上の面（円）
    south=lambda z,rev:[(CX+r*math.cos(a),CY+r*math.sin(a),z) for a in ([math.pi*i/12 for i in range(13)][::-1] if rev else [math.pi*i/12 for i in range(13)])]
    poly(d,south(z0,False)+south(z1,True),front)
    poly(d,[(CX+r*math.cos(a),CY+r*math.sin(a),z1) for a in [2*math.pi*i/n for i in range(n)]],top)
def pole(d,z1):
    w=0.06;box(d,CX-w,CY-w,CX+w,CY+w,0,z1,WOOD,WOODF)
def canopy(d):
    apex=(CX,CY,AZ)
    segs=[]
    for i in range(N):
        a0=2*math.pi*i/N-math.pi/2-math.pi/N;a1=a0+2*math.pi/N
        p0=(CX+R*math.cos(a0),CY+R*math.sin(a0),RZ);p1=(CX+R*math.cos(a1),CY+R*math.sin(a1),RZ)
        segs.append(((p0[1]+p1[1])/2,i,p0,p1))
    for _,i,p0,p1 in sorted(segs):  # 北（奥）の布から先に
        col=PINK if i%2==0 else CREAM
        # ふちは、布ごとに少し下へたれる（なみなみ）
        am=(math.atan2(p0[1]-CY,p0[0]-CX)+math.atan2(p1[1]-CY,p1[0]-CX))/2
        if abs(math.atan2(p0[1]-CY,p0[0]-CX)-math.atan2(p1[1]-CY,p1[0]-CX))>math.pi:am+=math.pi
        mid=(CX+R*1.0*math.cos(am),CY+R*1.0*math.sin(am),RZ-0.07)
        poly(d,[apex,p0,mid,p1],col)
def finial(d):cyl(d,0.05,AZ,AZ+0.12,WOOD,WOODF,12)
def base(grid):
    im=Image.new('RGBA',(W,H),BG+(255,) if grid else (0,0,0,0));d=ImageDraw.Draw(im)
    if grid:
        for i in range(int(X1-X0)+1):d.line([(i*S,0),(i*S,H)],fill=GRID,width=2)
        for j in range(int(Y1-Y0)+1):d.line([(0,j*S),(W,j*S)],fill=GRID,width=2)
        d.rectangle([P(0,0,0),P(1,1,0)],outline=(214,170,70),width=3)  # 置くマス（1×1）
    return im,d
out=sys.argv[1] if len(sys.argv)>1 else '.'
for grid in (True,False):
    im,d=base(grid)
    cyl(d,0.22,0,0.12,WOOD,WOODF)   # 台（丸いおもし）
    pole(d,AZ)
    canopy(d);finial(d)
    im.save(f'{out}/parasol_full{"" if grid else "_nogrid"}.png')
print('ok',W,H)
