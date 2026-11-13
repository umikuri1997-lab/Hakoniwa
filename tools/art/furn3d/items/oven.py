# かまど（oven）：いまの絵のデザインのまま。正面から見て、たて長でうえがまるい形の、石をつんだかまど。
#   前の下にレンガのアーチの口があり、口のおくは、本体の中までつづく火のへや。火はその中でもえる（3コマでうごく）。屋根の上に煙突。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（66×75ドット）に合わせた）
#   本体のかたち：正面から見て、はば0.92、まっすぐな所が高さ0〜0.30、その上が半円にちかいアーチ屋根（てっぺん0.62）。おく0.60。
#   本体は、石をつんだ2つのかたまり：
#     前のかたまり（おく0.30）：まん中に、アーチの形のトンネル（はば0.50・高さ0〜0.49）がぬけている。これが火のへや。
#     うしろのかたまり（おく0.30）：トンネルのない、つまったかたまり。トンネルのおくのかべになる。
#     石のつみ目（よこ0.18・たて0.11、1だんごとに半分ずらす）のもよう。石のテクスチャ。
#   火のへや：トンネルのかべ・ゆか・おくのかべは、すすでくらい灰茶（くろくしない）。おくほど、くらい。
#   レンガ：前の面の、トンネルのまわりにアーチ11こ（あつさ0.04、前の面から0.03出る）と、口の両わき（本体のはしまで3だん）。
#   火：火のへやの中（前の面から0.14おく）のゆかに、まき2本と、火3つ（まん中が大きい）。コマごとに火の形がかわる（common.flame）。
#   煙突：屋根のてっぺんの、うしろより（おくのかたまりの上）に、こい灰色の石のまるい煙突（半径0.12・高さ0.55〜0.72）。
from blueprint import Part as P
from common import *
import math
ID='oven';BOTTOM=43;GRAD=True;FRAMES=3
VIEWS=[('oven',0)]
FR=0
CX,CY=0.50,0.60;HW=0.46;ZS=0.30;ZT=0.62;STONE=(206,196,184);JOINT=(176,164,152);BRICK=(204,108,74)
SOOT=(128,104,94);SOOT2=(104,86,80)
YF=CY+0.30;YM=CY;YB=CY-0.30   # 前の面・2つのかたまりのさかい・うしろの面
AW,AH=0.25,0.49   # トンネル（口）の半はば・高さ
def outline():   # 本体の正面の形（x,z）：まっすぐな所と、アーチ屋根
    pts=[(CX-HW,0.0),(CX+HW,0.0),(CX+HW,ZS)]
    for i in range(1,16):a=math.pi*i/16;pts.append((CX+HW*math.cos(a),ZS+(ZT-ZS)*math.sin(a)))
    pts.append((CX-HW,ZS));return pts
def arch(n=12):   # トンネルの形（右下 → アーチ → 左下）
    r=AW;zc=AH-r
    return [(CX+AW,0.0)]+[(CX+r*math.cos(math.pi*i/n),zc+r*math.sin(math.pi*i/n)) for i in range(n+1)]+[(CX-AW,0.0)]
def in_tunnel(x,z):
    r=AW;zc=AH-r
    return abs(x-CX)<AW-0.003 and (z<zc or (x-CX)**2+(z-zc)**2<(r-0.003)**2)
def stone_col(x,y,z):   # 石のつみ目。トンネルの中（すす）は、おくほどくらい
    if in_tunnel(x,z) and y<YF-0.004:return SOOT2 if y<YF-0.18 else SOOT
    row=int(z/0.11);u=(x+(0.09 if row%2 else 0))/0.18
    if abs(z/0.11-round(z/0.11))*0.11<0.006 or (abs(u-round(u))*0.18<0.006 and z<ZS+0.15):return JOINT
    return None
def ST(p):p.stone=True;p.decal=stone_col;p.grp='本体';return p
def PARTS():
    o=outline();a=arch()
    # 前のかたまり：正面の形から、トンネルをぬいた形（左の足 → 屋根 → 右の足 → トンネルのふち）
    i0=0;front=[(CX-HW,0.0),(CX-AW,0.0)]+a[::-1][1:-1]+[(CX+AW,0.0),(CX+HW,0.0),(CX+HW,ZS)]+[(CX+HW*math.cos(math.pi*i/16),ZS+(ZT-ZS)*math.sin(math.pi*i/16)) for i in range(1,16)]+[(CX-HW,ZS)]
    L=[ST(P('前のかたまり','prism',(front,YM,YF,'y'),STONE,note='地面におく。まん中にトンネル（火のへや）'))]
    L.append(ST(P('うしろのかたまり','prism',(o,YB,YM,'y'),STONE,note='地面におく。前のかたまりのうしろにつける')))
    L.append(notex(P('火のへやのゆか','box',(CX-AW+0.004,YM,0.0,CX+AW-0.004,YF-0.004,0.012),SOOT,on=('ground',),bevel=0,note='トンネルのゆか（すす）')))
    for i in range(11):   # アーチのレンガ
        a0=math.pi*i/11;a1=math.pi*(i+1)/11;ri,ro=AW,AW+0.09;zc=AH-AW
        pts=[(CX+ri*math.cos(a0),zc+ri*math.sin(a0)),(CX+ro*math.cos(a0),zc+ro*math.sin(a0)),(CX+ro*math.cos(a1),zc+ro*math.sin(a1)),(CX+ri*math.cos(a1),zc+ri*math.sin(a1))]
        q=P('レンガ%d'%(i+1),'prism',(pts,YF-0.01,YF+0.03,'y'),BRICK,on=('前のかたまり',),note='トンネルのまわりにアーチ');q.tex=False;L.append(q)
    zc=AH-AW
    for nx,xs in(('左',(CX-HW+0.02,CX-AW-0.09,CX-AW)),('右',(CX+AW,CX+AW+0.09,CX+HW-0.02))):   # 口の両わき：本体のはしまで、レンガ3だん
        for j in range(3):
            z0=j*zc/3;cuts=xs if j%2==0 else (xs[0],(xs[0]+xs[2])/2,xs[2])
            for a_,b_ in zip(cuts,cuts[1:]):
                q=P('レンガの柱（%s%d-%.2f）'%(nx,j+1,a_),'box',(a_+0.003,YF-0.01,z0+0.003,b_-0.003,YF+0.03,z0+zc/3),BRICK,on=('前のかたまり',),bevel=0,note='口の両わき。前の面にモルタルでつける');q.tex=False;L.append(q)
    L.append(ST(P('煙突','cyl',(CX,CY-0.12,0.12,0.55,0.72),(132,124,122),detail=24,on=('うしろのかたまり',),note='屋根のてっぺんのうしろより')))
    L[-1].decal=None;L[-1].grp=None
    yl=YF-0.14
    for k,(ang) in enumerate((15,-20)):   # まき：火のへやのゆかに
        r_=math.radians(ang);L.append(notex(P('まき%d'%(k+1),'beam',((CX-0.13*math.cos(r_),yl-0.05*math.sin(r_),0.035+0.02*k),(CX+0.13*math.cos(r_),yl+0.05*math.sin(r_),0.035+0.02*k),0.025),LOG,on=('火のへやのゆか',),note='火のへやのゆか')))
    H=[(0.30,0.14,0.12),(0.34,0.15,0.11),(0.28,0.12,0.14)][FR]   # コマごとの火の高さ（まん中・左・右）
    L.append(flame('火（まん中）',CX,yl,0.05,H[0],0.10,('まき1','まき2')))
    L.append(flame('火（左）',CX-0.12,yl,0.045,H[1],0.06,('まき1',)))
    L.append(flame('火（右）',CX+0.12,yl,0.045,H[2],0.06,('まき2',)))
    return L
