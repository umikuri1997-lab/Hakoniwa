# 雨の水たまり・こおった水たまり・水面の雨の輪（feel.js がクォータービューの地面に置く絵）。
# 設計図（単位はマス。地面＝z0。どれもマスのまん中 (0.5,0.5) のまわり）
#   水たまり iso:pud:<大きさ>#<形>：地面のくぼみにたまった、うすい水。まわりがでこぼこの形（半径を角度ごとに少しかえる。形2しゅるい）。
#     大きさ 0・1・2 は、雨がふえるほど大きい（半径 PUDR）。水面は地面の 0.004 上、ごく小さなさざなみ。色は場所ごと（'flat'）：おく（画面の上）ほど空の色をうつす（水おけ tub と同じ）。
#     チップの絵はすけない（すけて見える 'clear' は、下に何もないと写らない）。下の地面がすけるのは、ゲームでかけるうすさ。
#   氷 iso:pudi:<大きさ>#<形>：同じ形の、うすい水色の氷（冬）。すけない。白いつやのすじは、氷の面のもよう（decal）。
#   雨の輪 iso:rip#<コマ>：水面にひろがる、ほそい輪（4コマ。半径 RIPR、はば RIPW）。うすさはゲームでかける。
import math
from blueprint import Part as P
from common import *
ID='fx_water';BOTTOM=40
PUDR=(0.17,0.25,0.33)   # 水たまりの半径（大きさ 0・1・2）
SHAPES=((0.16,0.6,0.09,2.1,1.35),(0.12,2.4,0.13,0.4,1.5))   # 形：半径のゆれ（2つの波の大きさと、ずれ）と、画面のよこ（せかいの x−y の向き）へのばす倍（水たまりは、ひらたく広がる）
RIPR=(0.07,0.12,0.17,0.22);RIPW=(0.022,0.022,0.02,0.018)   # 雨の輪の半径と、はば（コマごと）
WATER=(112,172,224);SKY=(196,228,248);ICE=(226,242,250);RING=(236,247,253)
VIEWS=[('iso:pud:%d#%d'%(n,s),0,('pud',n,s)) for n in range(3) for s in range(2)]+[('iso:pudi:%d#%d'%(n,s),0,('ice',n,s)) for n in range(3) for s in range(2)]+[('iso:rip#%d'%f,0,('rip',f,0)) for f in range(4)]
VAR=None
def PARTS():return []
def blob(n,s):
    """0〜1 のます目を、でこぼこの丸にうつす"""
    R=PUDR[n];a1,p1,a2,p2,st=SHAPES[s];c=1/math.sqrt(2)
    def f(u,v):
        U,V=2*u-1,2*v-1;x,y=U*math.sqrt(max(0,1-V*V/2)),V*math.sqrt(max(0,1-U*U/2));t=math.atan2(y,x);r=R*(1+a1*math.sin(2*t+p1)+a2*math.sin(3*t+p2))/math.sqrt(st)
        a,b=(x-y)*c*st,(x+y)*c;return (0.5+r*(a+b)*c,0.5+r*(b-a)*c)   # 画面のよこ（x−y）へ st 倍、たてへはそのまま（広さは R の丸と同じ）
    return f
def EXTRA(sc):
    k,n,s=VAR
    if k=='rip':   # ほそい輪：水面の 0.004 上の、たいらな輪（たてのかべはつけない）
        r0,r1=RIPR[n]-RIPW[n]/2,RIPR[n]+RIPW[n]/2;N=64;z=0.004;sc.outline(0);sc.material('flat');sc.part()
        for i in range(N):
            a,b=2*math.pi*i/N,2*math.pi*(i+1)/N;q=lambda r,t:(0.5+r*math.cos(t),0.5+r*math.sin(t),z)
            sc.quad(q(r0,a),q(r1,a),q(r1,b),q(r0,b),RING)
        sc.material(None);sc.outline();return
    f=blob(n,s);R=PUDR[n]
    if k=='ice':
        def streak(x,y,z):   # 白いつや：左上から右下へのびる、みじかいすじ2本
            d=(x-0.5)-(y-0.5);w=(x-0.5)+(y-0.5)
            return (250,253,255) if abs(w+R*0.35)<R*0.07 and abs(d)<R*0.45 or abs(w+R*0.05)<R*0.05 and abs(d+R*0.1)<R*0.22 else None
        sc.material('flat');sc.decal(streak);hfield(sc,0,0,1,1,lambda x,y:0.006,ICE,n=(28,28),shape=f);sc.decal(None);sc.material(None);return
    def col(x,y):   # 水の色。おくのふちの近くに、空のうつりこみの帯（画面のよこにのびる、うすい色）
        u,v=f(x,y);d=((0.5-u)+(0.5-v))/(2*R);t=max(0.0,1-abs(d-0.42)/0.16)*0.85;return tuple(WATER[i]*(1-t)+SKY[i]*t for i in range(3))
    def top(x,y):return 0.004+0.003*math.sin(x*15.0+y*5.0)+0.002*math.sin(y*19.0-x*7.0+1.3)
    sc.material('flat');hfield(sc,0,0,1,1,top,col,n=(28,28),shape=f);sc.material(None)
TONE5=True
