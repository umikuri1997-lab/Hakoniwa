# 岩（rock・rock#1〜#4）：小さな岩のある2つは、入れてあるトリポのモデル（tools/art/models/tripo の rock・stone_round・stone_chunk・pebble_a）で作る（持ち主がきめた。三角・四角など、コードで組んだ形にしない）。
# ならびは5とおり（VIEWS の3つめ）。ゲームはマスごとに hash でえらぶ（draw-objects.js の chipOf）：
#   0 岩（rock）の左おくに、まるい石（stone_round）・1 石のかけら（stone_chunk）の右おくに、小石（pebble_a）
#   2〜4 大きな岩だけ：点をつつむ形（natcommon.hullrock）の3つ（持ち主がえらんだ。前の岩の作り方。かげも前のまま、面ごとの5だん）
# 小さな岩があるのは2つ、小さな岩は1こ（持ち主がきめた。2こまで）。同じモデルを2どつかわない（持ち主：同じ物をまわしてならべない）。
# 小さな岩の大きさ・置き方は、持ち主のお手本（あつ森の岩）に合わせる（LAYOUT の上）。
# かげは、木と同じ5色（tone5：写した奥行きから面の向き・太陽 natcommon.SUN。blur を大きくして、モデルの面の折れ目をやわらかく）。色は、前の岩の色（5だん）。
import math
import numpy as np
from natcommon import SUN,notex,tone5,post_clean,sunscreen,hullrock
from blueprint import Part as P,model_tris
from scipy.spatial import ConvexHull
ID='rock';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
LIGHT=SUN   # 光は木と同じ太陽（natcommon.SUN）
VIEWS=[('rock',0,0)]+[('rock#%d'%v,0,v) for v in range(1,5)]
PAL=[(212,208,212),(197,193,204),(174,175,194),(159,164,186),(146,152,177)]   # お手本の岩の色（明るい→暗い）
POST=lambda im:im if LAYOUT[VAR or 0][0][0]=='hull' else tone5(post_clean(im),PAL[2],mix=0.0,blur=2.2,streak=(0,0),pal=PAL[::-1],olc=(128,132,158),light=sunscreen(ELEV))
# お手本（持ち主がくれた、あつ森の岩）：大きさは、どれもほぼそろう。小さな岩は、大きな岩のはばの0.6で、大きな岩のよこの少しおく。
#   手前の大きな岩が、小さな岩の1/4〜1/3をかくす（SINK）。
# 岩ごとに、画面の上の はば を そろえる（fit：大きな岩 WBIG・小さな岩 WSML ドット）。形はモデルのまま（たてだけちぢめない。持ち主：平べったくしない）。
# ならび：大きな岩・小さな岩は (モデル, まわす角度, よこにたおす角度)。小さな岩には、さらに 画面の向き（180度＝左・0度＝右。おくは 180〜360度）
LAYOUT=[
    (('tripo/rock.glb',0,0),('tripo/stone_round.glb',40,0,205)),
    (('tripo/stone_chunk.glb',0,0),('tripo/pebble_a.glb',-30,0,-28)),
    (('hull',(0.66,0.6),0.42,(0,0),61),None),         # 大きな岩だけ：ひくく、はばひろい
    (('hull',(0.5,0.46),0.92,(-0.08,0.04),67),None),  # 大きな岩だけ：ほそく高く、てっぺんが左へ
    (('hull',(0.57,0.52),0.80,(0.06,-0.03),71),None), # 大きな岩だけ：ふつうの大きさ
]
WBIG,WSML=104,62   # 画面の上の はば（g64 のドット。1マスのひし形は128）
SINK=0.6   # 小さな岩を、足もとがふれるきょりの何倍の所に置くか（1より小さいほど、大きな岩のうしろへ入る）
VAR=0
def scr(V):
    """せかいの点 → 画面の点（g64 のドット。iso3d.py の見え方：マスの右の角が (64,48)・高さ1は72）"""
    return np.stack([(V[:,0]-V[:,1])*64,(V[:,0]+V[:,1])*48-V[:,2]*72],1)
def fit(path,rot,tilt,W):
    """画面の はば が W になる倍 k（高さ1にしたモデルに、よこ・たて同じだけかける）"""
    V=model_tris(path,0,0,0,1.0,rot,tilt)[0];S=scr(V);return W/(S[:,0].max()-S[:,0].min()),1.0
def tris(path,cx,cy,rot,tilt,W):
    k,zs=fit(path,rot,tilt,W);V=model_tris(path,0,0,0,1.0,rot,tilt)[0]*[k,k,k*zs];return V+[cx,cy,0]
def foot(path,cx,cy,rot,tilt,W):
    """モデルの足もとの形（地面に写した点をつつむ多角形）"""
    V=tris(path,cx,cy,rot,tilt,W)[:,:2];return V[ConvexHull(V).vertices]
def apart(A,B):
    """2つの多角形（どちらも凸）がはなれているか（わける線がある）"""
    for Pg in(A,B):
        for i in range(len(Pg)):
            e=Pg[(i+1)%len(Pg)]-Pg[i];n=np.array([-e[1],e[0]])
            if (A@n).max()<(B@n).min() or (B@n).max()<(A@n).min():return True
    return False
def place(big,sm):
    """大きな岩（足もとの形 big）から、画面の向き deg に、小さな岩のすそがちょうどふれるきょりの SINK 倍の所（せかいのマスの場所。iso3d.py が45度まわす前）"""
    path,rot,tilt,deg=sm;c=math.sqrt(0.5);X,Y=math.cos(math.radians(deg)),math.sin(math.radians(deg));ux,uy=c*(X+Y),c*(Y-X)   # 画面の向き → せかいの向き（45度もどす）
    f0=foot(path,0,0,rot,tilt,WSML);lo,hi=0.0,2.0
    for _ in range(30):
        d=(lo+hi)/2
        if apart(big,f0+[0.5+ux*d,0.5+uy*d]):hi=d
        else:lo=d
    hi*=SINK
    return(0.5+ux*hi,0.5+uy*hi)
def part(nm,path,cx,cy,rot,tilt,W):
    k,zs=fit(path,rot,tilt,W)
    p=P(nm,'model',(path,cx,cy,0,1.0,rot,tilt),PAL[1],on=('ground',),note='地面に置く');p.recol=PAL[1];p.recolk=0.0;notex(p)
    def warp(V,cx=cx,cy=cy,k=k,zs=zs):V[:,0]=cx+(V[:,0]-cx)*k;V[:,1]=cy+(V[:,1]-cy)*k;V[:,2]*=k*zs;return V
    p.warp=warp;return p
def PARTS():
    big,sm=LAYOUT[VAR or 0]
    if big[0]=='hull':return[]
    L=[part('岩',big[0],0.5,0.5,big[1],big[2],WBIG)]
    if sm:x,y=place(foot(big[0],0.5,0.5,big[1],big[2],WBIG),sm);L.append(part('小さな岩',sm[0],x,y,sm[1],sm[2],WSML))
    return L
def EXTRA(sc):
    big,_=LAYOUT[VAR or 0]
    if big[0]=='hull':_,r,h,pk,sd=big;hullrock(sc,(0.5,0.5),r,h,PAL,seed=sd,peak=pk,gi='r0')
