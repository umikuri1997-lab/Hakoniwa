# あなぐまの巣穴（anagura、土のステージ）：北のがけのふもとの、岩でふちどられた、まるい穴。はばは2マスくらい（置くのは1マス）。
# 設計図（マス。x=東・y=南・z=上。置くマスの左上が(0,0)。北（y<0）は、がけ）
#   土手：がけの前に、土と岩がもりあがった所（角ばった岩の形。まん中 (0.5,0.16)・はば1.9・おく0.5・高さ0.78）。
#   穴：土手の南の面に、南を向いてあく、まるい穴（はば0.62・高さ0.5。中はおくほどくらい、こげ茶）。
#   ふちの岩：穴の左右と上に、大きさのちがう岩を5こ（土手より手前・穴にかからない所）。
#   根：土手の上から穴の上のふちへ、たれる木の根を2本（太さ0.022）。
#   ひさしの岩：穴の上のふちに、手前へ出てかぶさる岩（高さ0.44〜0.66。左右の岩にのる）。
#   ほり出した土：穴の前に、ひくい土の山（はば0.84・おく0.44・高さ0.15。角ばった土のかたまり）と、はなれた所に小石。
#   色：岩は、谷のがけの絵（cliff:block）と同じ、すなの岩の色（5だん）。土は、ほったばかりの、しめった土の色。
from blueprint import Part as P
from natcommon import hullrock,SUN
import math
ID='anagura';GRAD=True;ELEV=25;BOTTOM=60
LIGHT=SUN
VIEWS=[('anagura',0)]
PAL=[(212,178,150),(198,164,138),(182,150,128),(164,134,116),(146,118,102)]   # すなの岩（明るい→暗い）
SOIL=(170,140,110);SPAL=[(184,154,122),(170,140,110),(156,127,100),(142,115,91),(128,104,84)]   # ほった土（明るい→暗い）
ROOT=(124,88,62)
HOLE=(0.5,0.30,0.22,0.31,0.25)   # 穴：まん中 x・y（土手の南の面）・高さ・よこの半径・たての半径
INLIT=(112,82,62);INDARK=(60,44,36)   # 穴の中の色（ふち → おく）
def PARTS():
    hx,hy,hz,rx,rz=HOLE
    h=P('穴','egg',(hx,hy,hz,rx,0.07,rz),INDARK,deco=True,note='土手の南の面に、半分うめた、たまごの形')
    def hc(x,y,z):
        r=min(1.0,math.hypot((x-hx)/rx,(z-hz)/rz));t=max(0.0,(r-0.3)/0.7)   # ふちほど明るく
        t=t*(0.55+0.45*min(1.0,max(0.0,(hz-z)/rz+0.5)))   # 上のふちは、ひさしのかげで くらい・下（穴のゆか）は明るい
        t=round(t*4)/4
        return tuple(INDARK[k]+(INLIT[k]-INDARK[k])*t for k in range(3))
    h.decal=hc;h.tex=False
    r1=P('根1','tube',([(0.30,0.14,0.70),(0.31,0.26,0.56),(0.30,0.37,0.44),(0.33,0.39,0.34)],0.032),ROOT,deco=True,note='土手の上から、穴の左上のふちへ')
    r2=P('根2','tube',([(0.66,0.12,0.72),(0.66,0.26,0.62),(0.65,0.40,0.56)],0.028),ROOT,deco=True,note='土手の上から、ひさしの岩の右へ（穴にはかからない）')
    for p in(r1,r2):p.tex=False
    return [h,r1,r2]
def EXTRA(sc):
    hullrock(sc,(0.50,0.14),(0.95,0.25),0.78,PAL,seed=11,gi='bank')   # 土手
    hullrock(sc,(0.12,0.38),(0.19,0.15),0.46,PAL,seed=3,gi='rL')     # 穴の左
    hullrock(sc,(-0.22,0.22),(0.16,0.14),0.30,PAL,seed=4,gi='rL2')
    hullrock(sc,(0.88,0.40),(0.17,0.14),0.40,PAL,seed=5,gi='rR')     # 穴の右
    hullrock(sc,(1.20,0.24),(0.15,0.13),0.26,PAL,seed=6,gi='rR2')
    hullrock(sc,(0.52,0.10),(0.24,0.12),0.86,PAL,seed=8,gi='rT',peak=(0.02,0))   # 穴の上
    lintel(sc,(0.50,0.36),(0.40,0.11),0.44,0.66,PAL,seed=9,gi='rH')   # ひさしの岩：穴の上のふちに、手前へ出てかぶさる（左右の岩にのる）
    hullrock(sc,(0.48,0.62),(0.42,0.22),0.15,SPAL,seed=13,gi='soil')   # ほり出した土（ひくい土の山。穴の下のふちにつづく）
    for i,(x,y,r) in enumerate(((-0.12,0.80,0.06),(1.08,0.76,0.055),(0.88,1.02,0.045))):hullrock(sc,(x,y),(r,r*0.9),r*1.2,PAL,seed=20+i,gi='s%d'%i)   # 小石（土の山からはなれた地面）
def lintel(sc,c,r,z0,z1,pal,seed=0,gi='h'):
    """高さ z0〜z1 の、角ばった岩（hullrock と同じ作り。下の面も見える所はのこす）。左右の岩の上にのる"""
    import numpy as np,oblique3d as O
    from scipy.spatial import ConvexHull
    rs=np.random.RandomState(seed);P=[]
    for z,k,n in((0.0,0.85,8),(0.4,1.0,9),(0.8,0.8,7),(1.0,0.3,3)):
        for i in range(n):
            a=2*np.pi*(i+rs.uniform(-0.3,0.3))/n;rr=k*rs.uniform(0.85,1.08)
            P.append((c[0]+np.cos(a)*r[0]*rr,c[1]+np.sin(a)*r[1]*rr,z0+(z1-z0)*z))
    P=np.array(P);H=ConvexHull(P);t=P[H.simplices];c0=P.mean(0)
    n=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]);n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-12;n*=np.sign(((t.mean(1)-c0)*n).sum(1))[:,None]
    d=n@O.LIGHT;cut=np.quantile(d,np.linspace(1,0,len(pal)+1)[1:-1])
    sc.texture(None);sc.material('flat');sc.smooth(False);sc.group(gi);sc.part()
    for tt,dd in zip(t,d):sc.tri(tt[0],tt[1],tt[2],pal[int((dd<cut).sum())])
    sc.group(None);sc.material(None)
