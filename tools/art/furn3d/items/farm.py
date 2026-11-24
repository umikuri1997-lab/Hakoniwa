# 畑の畝（うね）：クォータービューの絵だけ（python3 tools/art/iso/iso3d.py <出力> farm --chips）。
# 設計図（1マス＝1、x＝東・y＝南・z＝上。マスの左上が(0,0)）：
#   1マスに畝1本、東西にのびる。畝のまん中はマスのまん中（y 0.5）、高さ H、はばの半分 RW。畝のあいだ（マスの北と南のふち）は、みぞ（z 0）。
#   となりの畑（西 1・東 2。ゲームの farm:<m> の m の下2ビット）へは、畝をマスのふちまで切れ目なくのばす。つながらない向きは、ふちから IN あけて、長さ CL でまるくおわる。
#   みぞもふくめてマスぜんたいをおおう（下の平らな土の絵 farm:<m> の、描いた畝の線をかくす。草とのさかいは、下の絵のふちのまま）。
#   色：土の色1つ（TOP）。みぞの底の近くだけ、みぞの色（FLOOR）へ少しまぜる（グラデーションにしない）。かげは2だん（soft1）・まわりの輪郭線なし（olk 1）。下の平らな土の絵（farm:15・farmw:15）のみぞとてっぺんの色。ぬれた畑（farm.ridgew）は、こい色。
# チップ：farm.ridge:<0〜3>・farm.ridgew:<0〜3>（ax・ay はマスのまん中の地面の点）。芽・作物（crop.py）は、畝のてっぺん（z H）に立てる。
import math
from blueprint import Part as P
from natcommon import SUN
ID='farm';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=64;LIGHT=SUN
H=0.15;RW=0.44;TOPW=0.45;IN=0.05;CL=0.20;N=48   # 畝の高さ（0.15だん）・はばの半分・てっぺんの平らな所（はばの半分のうちの割合）・はしのあき・まるいはしの長さ・こまかさ
FLOOR={False:(122,88,70),True:(90,68,60)};TOP={False:(186,135,97),True:(146,104,84)}
VIEWS=[('farm.ridge%s:%d'%('w' if w else '',m),0,(m,w)) for w in(False,True) for m in range(4)]
VAR=None
def height(x,y,m):
    x0=0.0 if m&1 else IN+CL;x1=1.0 if m&2 else 1-IN-CL   # まるくない所（芯）
    dx=(x0-x if x<x0 else x-x1 if x>x1 else 0.0)/CL*RW   # はしは、長さ CL で、はばの半分 RW ぶんの丸み
    d=math.hypot(y-0.5,dx)/RW
    if d>=1:return 0.0
    u=max(0.0,(d-TOPW)/(1-TOPW));return H*0.5*(1+math.cos(math.pi*u))   # てっぺんは平ら、すそはなだらか（かまぼこにしない）
def ridge(m,wet):
    t=[i/N for i in range(N+1)];V=[(x,y,height(x,y,m)) for y in t for x in t];F=[];C=[]
    fl,tp=FLOOR[wet],TOP[wet]
    def col(*z):k=1.0 if sum(z)/len(z)>H*0.25 else 0.55;return tuple(fl[i]+(tp[i]-fl[i])*k for i in range(3))
    for j in range(N):
        for i in range(N):
            a=j*(N+1)+i;b=a+1;c=a+N+1;d=c+1
            for f in((a,c,b),(b,c,d)):F.append(f);C.append(col(*[V[q][2] for q in f]))
    p=P('畝','mesh',(V,F,C),fl,on=('ground',),note='畑の土');p.tex=False;p.soft1=True;p.olk=1.0;return p
def PARTS():
    m,w=VAR or (0,False);return [ridge(m,w)]
