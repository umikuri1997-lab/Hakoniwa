# 生垣の3Dの下絵：つなぎ方の見本（長い横・たて・角・T・十字・1マス）を、ゲームと同じ見え方で写す。
# 生垣の形（マス）：1マスのまん中の四角（よこ HX0〜HX1・たて HY0〜1.0）に、つながる向きへのばした四角を足した形。
#   よこにつながると、マスのはしまで。上につながると、上のはしまで（下は、下のマスの「上へのばした所」がうめる）。
# 高さ H。上のふちは、まるく落とす（ER）。ぜんぶを1つの高さの面（ハイトフィールド）にするので、つなぎ目に線が出ない。
# 出す絵：hedge_ref.png（マス目・置くマスのわくつき）、hedge_ref_nogrid.png、hedge_side.png（まよこ）
import sys,os
import numpy as np
from PIL import ImageDraw
from scipy.ndimage import distance_transform_edt
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..'))
from oblique3d import *

LAYOUT=["1111.1..1",
        ".....1...",
        "1111.1.1.",
        "1..1..111",
        "1111...1."]
HX0,HX1=0.15,0.85      # たてにつながる所のはば（左右）
HY0=0.30               # 1マスの中で、生垣のうしろのはし（前のはしはマスの下のはし）
H=0.60                 # 高さ（画面で0.48マス）
ER=0.10                # 上のふちのまるみ
EH=0.70                # ふちの高さ（H に対する）
N=25                   # 1マスを何こに分けるか
GREEN=(150,196,104)

def footprint():
    R,C=len(LAYOUT),len(LAYOUT[0]);on=lambda r,c:0<=r<R and 0<=c<C and LAYOUT[r][c]=='1'
    m=np.zeros((R*N,C*N),bool);u=lambda a:int(round(a*N))
    for r in range(R):
        for c in range(C):
            if not on(r,c):continue
            x0=c*N;y0=r*N
            m[y0+u(HY0):y0+N,x0+u(HX0):x0+u(HX1)]=1                       # まん中
            if on(r,c-1):m[y0+u(HY0):y0+N,x0:x0+u(HX0)]=1                  # 左へ
            if on(r,c+1):m[y0+u(HY0):y0+N,x0+u(HX1):x0+N]=1                # 右へ
            if on(r-1,c):m[y0:y0+u(HY0),x0+u(HX0):x0+u(HX1)]=1             # 上へ
    return m

def build(sc):
    m=footprint();R,C=m.shape;d=distance_transform_edt(np.pad(m,1))[1:-1,1:-1]/N
    k=np.clip(d/ER,0,1);h=np.where(m,H*(EH+(1-EH)*np.sqrt(1-(1-k)**2)),0)    # ふちはまるく
    V=np.zeros((R+1,C+1));cnt=np.zeros((R+1,C+1))                            # 頂点の高さ＝まわりの中のマスの平均
    for dy in (0,1):
        for dx in (0,1):V[dy:dy+R,dx:dx+C]+=h;cnt[dy:dy+R,dx:dx+C]+=m
    V=np.where(cnt>0,V/np.maximum(cnt,1),0)
    P=lambda y,x,z:(x/N,y/N,z)
    for y,x in zip(*np.where(m)):
        sc.quad(P(y,x,V[y,x]),P(y,x+1,V[y,x+1]),P(y+1,x+1,V[y+1,x+1]),P(y+1,x,V[y+1,x]),GREEN)
        for dy,dx,a,b in ((1,0,(y+1,x),(y+1,x+1)),(-1,0,(y,x),(y,x+1)),(0,1,(y,x+1),(y+1,x+1)),(0,-1,(y,x),(y+1,x))):
            yy,xx=y+dy,x+dx
            if 0<=yy<R and 0<=xx<C and m[yy,xx]:continue
            sc.quad(P(*a,0),P(*b,0),P(*b,V[b]),P(*a,V[a]),GREEN)            # まわりのかべ（まっすぐ立つ）

out=sys.argv[1] if len(sys.argv)>1 else os.path.dirname(__file__)
R,C=len(LAYOUT),len(LAYOUT[0])
ext=(-0.5,C+0.5,-1.0,R+0.5)
sc=Scene();build(sc);fg=render(sc,game,ext,VIEW)
bg=grid_bg(ext);dr=ImageDraw.Draw(bg)
for r in range(R):
    for c in range(C):
        if LAYOUT[r][c]=='1':dr.rectangle([((c-ext[0])*S,(r-ext[2])*S),((c+1-ext[0])*S,(r+1-ext[2])*S)],outline=(214,170,70),width=3)
bg.alpha_composite(fg);bg.save(f'{out}/hedge_ref.png');fg.save(f'{out}/hedge_ref_nogrid.png')
sext=(-0.5,C+0.5,-1.5,0.5);sd=render(sc,side,sext,SIDE);bg=grid_bg(sext);bg.alpha_composite(sd);bg.save(f'{out}/hedge_side.png')
print('ok')
