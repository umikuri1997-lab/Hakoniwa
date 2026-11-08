# パラソルの3Dの下絵：立体（三角形のあつまり）を作り、かげをつけて、ゲームと同じ見え方で写す。
# x=東, y=南, z=上（単位はマス）。画面 = (x, y-0.8z)。見る向きは (0,0.8,1)（南の上から見おろす）。
# 奥行きは z バッファ（手前の面だけ見える）。2倍の細かさで描いて、BOX でちぢめる。
# 出す絵：
#   parasol_full.png         ゲームの見え方（マス目・置くマスのわくつき）
#   parasol_full_nogrid.png  ゲームの見え方（マス目なし）
#   parasol_xray.png         かさを半分すかした絵（柱がかさのまん中をとおって、てっぺんまでのびているのがわかる）
#   parasol_side.png         まよこ（南）から見た形（形のたしかめ用。ゲームの見え方ではない）
import math,sys
import numpy as np
from PIL import Image,ImageDraw

S=128                      # 1マスのドット
SS=2                       # 2倍の細かさで描く
X0,X1,Y0,Y1=-1.0,2.0,-2.0,2.0

# 形の数字（マス）
CX,CY=0.5,0.5              # 柱のまん中＝置くマスのまん中
R=0.65                     # かさの半径
RZ=1.40                    # かさのふち（骨の先）の高さ
AZ=1.78                    # かさのてっぺん（柱の先）の高さ
NP=8                       # 布のまい数（骨の数）
SAG=0.05                   # 骨と骨のあいだの布のたるみ（ふちが波になる）
PR=0.045                   # 柱の太さ（半径）
BR,BH=0.22,0.12            # 台（丸いおもし）の半径・高さ
KR,KH=0.055,0.10           # てっぺんの玉

PINK=np.array([240,178,158]);CREAM=np.array([250,236,206])
WOOD=np.array([206,160,104]);WOODD=np.array([178,132,82])
LIGHT=np.array([-0.35,0.25,1.0]);LIGHT=LIGHT/np.linalg.norm(LIGHT)
VIEW=np.array([0,0.8,1.0]);VIEW=VIEW/np.linalg.norm(VIEW)

tris=[]  # (p0,p1,p2,color,alpha)
def tri(a,b,c,col,alpha=1.0):tris.append((np.array(a,float),np.array(b,float),np.array(c,float),np.array(col,float),alpha))
def quad(a,b,c,d,col,alpha=1.0):tri(a,b,c,col,alpha);tri(a,c,d,col,alpha)

def cylinder(r,z0,z1,col,n=32,cap=True,colcap=None):
    for i in range(n):
        a0=2*math.pi*i/n;a1=2*math.pi*(i+1)/n
        p=lambda a,z:(CX+r*math.cos(a),CY+r*math.sin(a),z)
        quad(p(a0,z0),p(a1,z0),p(a1,z1),p(a0,z1),col)
        if cap:tri((CX,CY,z1),p(a0,z1),p(a1,z1),colcap if colcap is not None else col)

def sphere(r,zc,col,n=16,m=10):
    for j in range(m):
        t0=math.pi*j/m;t1=math.pi*(j+1)/m
        for i in range(n):
            a0=2*math.pi*i/n;a1=2*math.pi*(i+1)/n
            p=lambda t,a:(CX+r*math.sin(t)*math.cos(a),CY+r*math.sin(t)*math.sin(a),zc+r*math.cos(t))
            quad(p(t0,a0),p(t1,a0),p(t1,a1),p(t0,a1),col)

def canopy(alpha=1.0):
    # かさ：てっぺんから骨の先へ、少しふくらんだ面。骨と骨のあいだは、ふちが少したれる
    NR,NA=14,12  # 半径方向・1まいの布の中の分け方
    for k in range(NP):
        col=PINK if k%2==0 else CREAM
        for i in range(NR):
            for j in range(NA):
                def P(ri,aj):
                    s=ri/NR; u=aj/NA                       # s:まん中0→ふち1、u:布の中の位置
                    a=2*math.pi*(k+u)/NP-math.pi/2
                    bulge=0.10*math.sin(math.pi*s)          # 少しふくらむ（ドーム）
                    sag=SAG*math.sin(math.pi*u)*s**2        # 骨のあいだはたれる
                    rr=R*s*(1-0.04*math.sin(math.pi*u)*s)   # 骨のあいだは少し内がわ
                    z=AZ-(AZ-RZ)*s+bulge-sag
                    return (CX+rr*math.cos(a),CY+rr*math.sin(a),z)
                quad(P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1),col,alpha)
    # 骨（細い線）：てっぺんから骨の先へ
    for k in range(NP):
        a=2*math.pi*k/NP-math.pi/2
        for i in range(14):
            s0=i/14;s1=(i+1)/14
            def Q(s,o):
                z=AZ-(AZ-RZ)*s+0.10*math.sin(math.pi*s)+0.006
                return (CX+R*s*math.cos(a)+o*math.sin(a),CY+R*s*math.sin(a)-o*math.cos(a),z)
            quad(Q(s0,-0.008),Q(s1,-0.008),Q(s1,0.008),Q(s0,0.008),(232,214,186),alpha)

def build(alpha=1.0):  # alpha はつかわない（すかした絵は、かさだけ別に写してかさねる）
    tris.clear()
    cylinder(BR,0,BH,WOODD,colcap=WOOD)       # 台
    cylinder(PR,BH,AZ,WOOD,n=16)              # 柱：台からかさのてっぺんまで、まっすぐ
    canopy(alpha)
    sphere(KR,AZ+KH*0.5,WOOD)                 # てっぺんの玉（柱の先）

def render(proj,ext,depthv,alpha_mode=False):
    x0,x1,y0,y1=ext;Wp=int((x1-x0)*S*SS);Hp=int((y1-y0)*S*SS)
    img=np.zeros((Hp,Wp,4));zb=np.full((Hp,Wp),-1e9)
    # 不透明 → すける物（奥から）の順に描く
    order=sorted(range(len(tris)),key=lambda i:(tris[i][4]<1, float(np.dot((tris[i][0]+tris[i][1]+tris[i][2])/3,depthv))))
    for i in order:
        a,b,c,col,al=tris[i]
        n=np.cross(b-a,c-a);ln=np.linalg.norm(n)
        if ln<1e-12:continue
        n/=ln
        if np.dot(n,depthv)<0:n=-n                       # 見えている側の向き
        sh=0.55+0.45*max(0.0,float(np.dot(n,LIGHT)))
        cc=np.clip(col*sh+ (255-col)*0.08,0,255)
        P=[proj(p) for p in (a,b,c)]
        P=[((px-x0)*S*SS,(py-y0)*S*SS) for px,py in P]
        D=[float(np.dot(p,depthv)) for p in (a,b,c)]
        xs=[p[0] for p in P];ys=[p[1] for p in P]
        bx0=max(int(math.floor(min(xs))),0);bx1=min(int(math.ceil(max(xs))),Wp-1)
        by0=max(int(math.floor(min(ys))),0);by1=min(int(math.ceil(max(ys))),Hp-1)
        if bx1<bx0 or by1<by0:continue
        gx,gy=np.meshgrid(np.arange(bx0,bx1+1)+0.5,np.arange(by0,by1+1)+0.5)
        (ax,ay),(bx,by),(cx,cy)=P
        den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
        if abs(den)<1e-9:continue
        w0=((by-cy)*(gx-cx)+(cx-bx)*(gy-cy))/den
        w1=((cy-ay)*(gx-cx)+(ax-cx)*(gy-cy))/den
        w2=1-w0-w1
        m=(w0>=-1e-6)&(w1>=-1e-6)&(w2>=-1e-6)
        if not m.any():continue
        z=w0*D[0]+w1*D[1]+w2*D[2]
        sub_zb=zb[by0:by1+1,bx0:bx1+1];sub=img[by0:by1+1,bx0:bx1+1]
        if al>=1:
            vis=m&(z>sub_zb)
            sub_zb[vis]=z[vis];sub[vis,:3]=cc;sub[vis,3]=255
        else:
            vis=m&(z>sub_zb-1e-4)
            sub[vis,:3]=sub[vis,:3]*(1-al)+cc*al if True else 0
            sub[vis,3]=np.maximum(sub[vis,3],255*al)
    im=Image.fromarray(img.astype(np.uint8),'RGBA')
    return im.resize((Wp//SS,Hp//SS),Image.BOX)

def game_proj(p):return (p[0],p[1]-0.8*p[2])
def side_proj(p):return (p[0],-p[2])

def grid_bg(ext,foot=True):
    x0,x1,y0,y1=ext;W=int((x1-x0)*S);H=int((y1-y0)*S)
    im=Image.new('RGBA',(W,H),(235,230,211,255));d=ImageDraw.Draw(im)
    for i in range(int(x1-x0)+1):d.line([(i*S,0),(i*S,H)],fill=(201,194,168),width=2)
    for j in range(int(y1-y0)+1):d.line([(0,j*S),(W,j*S)],fill=(201,194,168),width=2)
    if foot:d.rectangle([((0-x0)*S,(0-y0)*S),((1-x0)*S,(1-y0)*S)],outline=(214,170,70),width=3)
    return im

out=sys.argv[1] if len(sys.argv)>1 else '.'
ext=(X0,X1,Y0,Y1)
build();fg=render(game_proj,ext,VIEW)
bg=grid_bg(ext);bg.alpha_composite(fg);bg.save(f'{out}/parasol_full.png')
fg.save(f'{out}/parasol_full_nogrid.png')
tris.clear();cylinder(BR,0,BH,WOODD,colcap=WOOD);cylinder(PR,BH,AZ,WOOD,n=16);sphere(KR,AZ+KH*0.5,WOOD);inner=render(game_proj,ext,VIEW)
tris.clear();canopy();cv=render(game_proj,ext,VIEW);a=np.array(cv);a[...,3]=(a[...,3]*0.4).astype(np.uint8);cv=Image.fromarray(a)
bg=grid_bg(ext);bg.alpha_composite(inner);bg.alpha_composite(cv);bg.save(f'{out}/parasol_xray.png')  # かさだけ40%のうすさ
build();sext=(X0,X1,-2.5,0.5)
sd=render(side_proj,sext,np.array([0,1.0,0]))
bg=grid_bg(sext,foot=False);bg.alpha_composite(sd);bg.save(f'{out}/parasol_side.png')
print('ok')
