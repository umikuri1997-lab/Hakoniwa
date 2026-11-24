# 畑の畝（うね）：クォータービューの絵だけ（python3 tools/art/iso/iso3d.py <出力> farm --chips）。
# 設計図（1マス＝1、x＝東・y＝南・z＝上。マスの左上が(0,0)）：
#   1マスに畝1本、東西にのびる。畝のまん中はマスのまん中（y 0.5）、高さ H、はばの半分 RW。畝のあいだ（マスの北と南のふち）は、みぞ（z 0）。
#   となりの畑（西 1・東 2。ゲームの farm:<m> の m の下2ビット）へは、畝をマスのふちまで切れ目なくのばす。つながらない向きは、ふちから IN あけて、長さ CL でまるくおわる。
#   みぞもふくめてマスぜんたいをおおう（下の平らな土の絵 farm:<m> の、描いた畝の線をかくす。草とのさかいは、下の絵のふちのまま）。
#   色：土の色1つ（TOP）。みぞの底の近くだけ、みぞの色（FLOOR）へ少しまぜる（グラデーションにしない）。かげは面の向きで、土のブロック（iso_block.py の LEV）と同じ明るさの段に（平らな面は1、かたむきが急なほど、向きごとの KS・KN・KE・KW だけ暗く。光は北西の上から。北の面を暗くすると、上がわがこい丸はくぼみに見える）。
#     写すときのかげはつけない（p.flat。ひくい畝は、ふつうのかげだと段が出ない）・まわりの輪郭線なし（olk 1）。下の平らな土の絵（farm:15・farmw:15）のみぞとてっぺんの色。ぬれた畑（farm.ridgew）は、こい色。
# チップ：farm.ridge:<0〜3>・farm.ridgew:<0〜3>（ax・ay はマスのまん中の地面の点）。芽・作物（crop.py）は、畝のてっぺん（z H）に立てる。
import math
from blueprint import Part as P
from natcommon import SUN
ID='farm';GRAD=False;LW=1;   # LW 1：まわりのふちの内がわに、明るい線を出さない
SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=64;LIGHT=SUN
H=0.15;RW=0.44;TOPW=0.45;IN=0.05;CL=0.20;N=48   # 畝の高さ（0.15だん）・はばの半分・てっぺんの平らな所（はばの半分のうちの割合）・はしのあき・まるいはしの長さ・こまかさ
LEV=(1.0,0.94,0.86,0.80,0.74);HI=1.10;KS=0.30;KN=0.06;KE=0.34;KW=0.06   # 明るさの段・向き（南・北・東・西）ごとの暗くなる数（向きの成分1あたり）。光は北西の上から（手前の南・東の面がかげ）
FLOOR={False:(122,88,70),True:(90,68,60)};TOP={False:(186,135,97),True:(146,104,84)}
VIEWS=[('farm.ridge%s:%d'%('w' if w else '',m),0,(m,w)) for w in(False,True) for m in range(4)]
VAR=None
def height(x,y,m):
    x0=0.0 if m&1 else IN+CL;x1=1.0 if m&2 else 1-IN-CL   # まるくない所（芯）
    dx=(x0-x if x<x0 else x-x1 if x>x1 else 0.0)/CL*RW   # はしは、長さ CL で、はばの半分 RW ぶんの丸み
    d=((y-0.5)**4+dx**4)**0.25/RW   # はしは、かどのまるい四角（まるくしすぎると、まくらに見える）
    if d>=1:return 0.0
    u=max(0.0,(d-TOPW)/(1-TOPW));return H*0.5*(1+math.cos(math.pi*u))   # てっぺんは平ら、すそはなだらか（かまぼこにしない）
def shade(V,F,fl,tp,zf,hi=0.0,ks=1.0):
    """面ごとの色：面の向きで明るさの段（LEV）をえらぶ。高さ zf より下の面は、みぞの色（fl）へまぜる。hi：光（北西）を向いた面を明るくする数（小さなもりあがりを、しみに見せない）。ks：かげのこさ（急な丸い面で、かげの段ばかりにならないように）"""
    C=[]
    for f in F:
        A,B,C_=(V[q] for q in f);u=[B[i]-A[i] for i in range(3)];v=[C_[i]-A[i] for i in range(3)]
        n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];nn=math.sqrt(sum(q*q for q in n)) or 1;n=[q/nn for q in n]
        if n[2]<0:n=[-q for q in n]
        b=1-ks*(KS*max(0,n[1])+KN*max(0,-n[1])+KE*max(0,n[0])+KW*max(0,-n[0]))+hi*max(0,-n[0]-n[1]);b=min(LEV+((HI,) if hi else ()),key=lambda l:abs(l-b))   # いちばん近い段へ
        k=1.0 if (A[2]+B[2]+C_[2])/3>zf else 0.55;C.append(tuple((fl[i]+(tp[i]-fl[i])*k)*b for i in range(3)))
    return C
def grid(x0,y0,x1,y1,hf,n):
    """高さの表（hf(x,y)→z）の形の点と面"""
    V=[(x0+(x1-x0)*i/n,y0+(y1-y0)*j/n,0) for j in range(n+1) for i in range(n+1)];V=[(x,y,hf(x,y)) for x,y,_ in V];F=[]
    for j in range(n):
        for i in range(n):
            a=j*(n+1)+i;b=a+1;c=a+n+1;d=c+1;F+=[(a,c,b),(b,c,d)]
    return V,F
def mesh(name,V,F,C,col,on):
    p=P(name,'mesh',(V,F,C),col,on=on,note='畑の土');p.tex=False;p.flat=True;p.olk=1.0;return p
def ridge(m,wet):
    V,F=grid(0,0,1,1,lambda x,y:height(x,y,m),N);return mesh('畝',V,F,shade(V,F,FLOOR[wet],TOP[wet],H*0.25),FLOOR[wet],('ground',))
def dome(name,cx,cy,z0,r,h,wet):
    """畝のてっぺんにのせる、まるい低い丘（たねの印のもりあがり）。すそは z0（畝に少しうめる）"""
    def hf(x,y):
        d=math.hypot(x-cx,y-cy)/r;return z0+h*max(0.0,1-d*d)**0.8 if d<1 else z0
    V,F=grid(cx-r,cy-r,cx+r,cy+r,hf,24);keep=[f for f in F if any(math.hypot(V[q][0]-cx,V[q][1]-cy)<r for q in f)]
    return mesh(name,V,keep,shade(V,keep,TOP[wet],TOP[wet],-1,0.25,0.5),TOP[wet],())
def PARTS():
    m,w=VAR or (0,False);return [ridge(m,w)]
