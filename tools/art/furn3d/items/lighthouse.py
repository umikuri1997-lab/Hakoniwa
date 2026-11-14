# 灯台（lighthouse、2×2マス）：いまの絵のデザインのまま（前の設計図 tools/art/lighthouse/lighthouse3d.py と同じ納まり）。
# 素材の質感：しっくい（Plaster001）・石（Rock030）・木（Wood049）・鉄と、赤くぬった金属の屋根・枠（Metal032）のテクスチャ。ガラスはあかりの色のグラデーション。
# 設計図（じっさいに建てられる組み方。単位はマス。大きさは、いまの絵（本体はば128・高さ347ドット、g64）に合わせる）
#   基礎：石を、まるく（外の半径1.00・内の半径0.62）2だんつむ（高さ0〜0.24、1だん0.12）。石はどれも同じ大きさ（外がわで長さ0.26）、1だん24こ。1だんごとに半分ずらす。
#     入口の前は、はば0.50を切りこみ、石段を2だん（高さ0.12・0.24）。中は石の床（塔の下、見えない）。
#   塔：しっくいの塔（下の半径0.78・上の半径0.53、高さ0.24〜3.10）。基礎の上にたてる。中はらせん階段なので、窓はずれた高さ・場所。
#   入口：塔の前の下。石のふち（U字、外のはば0.50・高さ0.84、ふちのはば0.06）を、塔のかべにうめこむ。中に木の戸（はば0.38・高さ0.78）と、鉄のノブ（半径0.026）。
#   窓：3つ（下のはしの高さ1.10・1.70・2.30、よこにずらす −0.14・0.10・−0.06）。石のわく（はば0.18・高さ0.30）と、うすい色のガラス。
#   持ち送り：塔のてっぺんの下に、石の腕木16本（高さ2.80〜3.10）。下ほど塔により、上で見はらし台の床をささえる。
#   見はらし台：石の床（半径0.84、高さ3.10〜3.20）。持ち送りの上にのる。ふちに鉄の手すり（柱16本・高さ0.26、上とまん中の横木）。
#   当直室：しっくいのまるい部屋（半径0.46、高さ3.20〜3.60）。見はらし台へ出る小さな木の戸（はば0.18・高さ0.32）と鉄のノブ。
#   灯室：石の腰（半径0.44、高さ3.60〜3.72）。その上に、八角形のガラス（半径0.40、高さ3.72〜4.28。あかりのついた色）と、赤い枠（たての枠8本・まん中と上の横の枠）。
#   屋根：赤い、少しふくらんだ円すいの屋根（のきの半径0.46、高さ4.28〜4.66）。てっぺんに換気の玉（半径0.07）、その上に避雷針（高さ0.20）。
from blueprint import Part as P
from common import *
import math
from shapely.geometry import Polygon,box as sbox
ID='lighthouse';BOTTOM=128;GRAD=True;PARALLEL=True   # 高い建物：遠近をかけると、上ほど大きくのびる
VIEWS=[('lighthouse',0)]
CX,CY=1.0,1.0
STONES=[(220,220,226),(210,210,218),(228,228,232),(204,204,212)]
STONE=(214,214,220);STONE2=(200,200,210);PLASTER=(255,251,244);IRON=(150,160,178);GLASSW=(170,182,204)
FRAME=(214,98,80);ROOF=(252,166,138);GLASS=(255,214,112);GLASS2=(255,238,172)
BH=0.24;R0,R1,ZT=0.78,0.53,3.10;GZ=ZT+0.10;WR=GZ+0.40;LB=WR+0.12;LT=LB+0.56;RT=LT+0.38
SW=0.50   # 石段のはば
def towr(z):return R0+(R1-R0)*(z-BH)/(ZT-BH)
def ys(x,z):return CY+math.sqrt(max(0,towr(z)**2-(x-CX)**2))   # 塔のかべの前の面
def arch_u(cx,w,h,f,z0,n=16):
    ro=w/2;ri=w/2-f;zo=z0+h-ro;pts=[(cx-ro,z0)]
    pts+=[(cx-ro*math.cos(math.pi*i/n),zo+ro*math.sin(math.pi*i/n)) for i in range(n+1)]
    pts+=[(cx+ro,z0),(cx+ri,z0)]+[(cx+ri*math.cos(math.pi*i/n),zo+ri*math.sin(math.pi*i/n)) for i in range(n+1)]+[(cx-ri,z0)];return pts
def arch_full(cx,w,h,z0,n=16):
    r=w/2;zo=z0+h-r;return [(cx-r,z0)]+[(cx-r*math.cos(math.pi*i/n),zo+r*math.sin(math.pi*i/n)) for i in range(n+1)]+[(cx+r,z0)]
def sector(a0,a1,r0,r1,n=6):
    o=[(CX+r1*math.cos(a0+(a1-a0)*i/n),CY+r1*math.sin(a0+(a1-a0)*i/n)) for i in range(n+1)]
    return Polygon(o+[(CX+r0*math.cos(a1-(a1-a0)*i/n),CY+r0*math.sin(a1-(a1-a0)*i/n)) for i in range(n+1)])
def ramp(c0,c1,n):return [tuple(round(c0[k]+(c1[k]-c0[k])*i/(n-1)) for k in range(3)) for i in range(n)]
PLW=ramp((255,251,244),(212,198,182),7)   # 白いしっくいの、光からかげまで（こまかい段で、面のかくかくを見せない）
def tone(T,l,hi,lo):   # 光との向き l（hi より上は光、lo より下はかげ）を、T の段にする
    return T[max(0,min(len(T)-1,int((hi-l)/(hi-lo)*(len(T)-1)+0.5)))]
def plw(x,y,z):   # 白いしっくいのかげ：場所ごとの色（左まえが光、右うしろほどかげ）。ふつうのかげでは、前の面がぜんぶ半かげで灰色に見える
    import math;a=math.atan2(y-CY,x-CX);return tone(PLW,math.cos(a-2.6),0.9,-0.6)
ROOFS=ramp((248,166,140),(194,94,78),6)   # 屋根の赤の、光からかげまで
def roofc(x,y,z):   # 屋根のかげ：場所ごとの色（ドームの面の向きと光）。ふつうのかげでは、にごった茶色になる
    import math;n=((x-CX)/0.46,(y-CY)/0.46,max(0.0,z-LT)/(RT-LT));m=math.sqrt(sum(q*q for q in n)) or 1;l=(-0.55*n[0]+0.35*n[1]+0.76*n[2])/m
    return tone(ROOFS,l,0.85,0.0)
def cylc(base,ztop,dark=0.80):   # まるい物（石の床・腰）のかげ：上の面は光、横の面は場所ごとの、こまかい段（面ごとの段で、かくかくに見えないように）
    T=ramp(base,tuple(int(c*dark) for c in base),6)
    def f(x,y,z):
        import math
        if z>ztop-1e-4:return base
        a=math.atan2(y-CY,x-CX);return tone(T,math.cos(a-2.6),0.9,-0.6)
    return f
def RC(p,base,ztop):p.flat=True;p.decal=cylc(base,ztop);return p
def RF(p):p.mtex=True;p.flat=True;p.decal=roofc;return p   # 赤くぬった金属の板（金属のテクスチャ・場所ごとの色のかげ）
def WH(p):p.plaster=True;p.flat=True;p.decal=plw;return p   # 白いしっくい（しっくいのテクスチャ・場所ごとの色のかげ）
def PM(p):p.mtex=True;return p   # 赤くぬった金属の枠（金属のテクスチャ）
def ST(p):p.stone=True;return p
def MT(p):p.metal=True;p.mtex=True;p.olk=0.85;return p   # 鉄（金属のテクスチャ・つや）
def glassc(x,y,z):   # 灯室のガラス：下ほど白っぽい黄（中のレンズのあかり）
    t=max(0.0,min(1.0,(z-LB)/(LT-LB)));return tuple(int(GLASS2[k]*(1-t)+GLASS[k]*t) for k in range(3))
def PARTS():
    L=[];NS=24;da=2*math.pi/NS;gap=0.0015;notch=sbox(CX-SW/2,CY,CX+SW/2,CY+1.2)
    for r in range(2):
        off=da/2 if r%2 else 0
        for i in range(NS):
            pg=sector(off+da*i+gap,off+da*(i+1)-gap,0.62,1.00).difference(notch)
            if pg.is_empty or pg.area<1e-4:continue
            pg=pg if pg.geom_type=='Polygon' else max(pg.geoms,key=lambda g:g.area)
            L.append(ST(P('基礎の石%d-%d'%(r+1,i+1),'prism',(list(pg.exterior.coords)[:-1],r*0.12+0.001,(r+1)*0.12,'z'),STONES[(i*3+r)%4],on=('ground',) if r==0 else ('基礎の床',),note='%dだんめ。半分ずらしてつむ'%(r+1))))
    L.append(ST(P('基礎の床','cyl',(CX,CY,0.62,0.0,BH-0.002),STONE,note='基礎の中の石の床（塔の下）')))
    yd=CY+math.sqrt(1.0-(SW/2)**2)
    L.append(ST(P('石段（上）','box',(CX-SW/2+0.004,CY+0.60,0.0,CX+SW/2-0.004,CY+0.80,BH),STONE,note='切りこみの中。地面におく')))
    L.append(ST(P('石段（下）','box',(CX-SW/2+0.004,CY+0.80,0.0,CX+SW/2-0.004,yd,0.12),STONE2,note='上の段の前。地面におく')))
    L.append(WH(P('塔','lathe',(CX,CY,[(0.0,ZT),(R1,ZT),(R0,BH),(0.0,BH)]),PLASTER,detail=96,on=('基礎の床',),note='基礎の上にたてる。しっくいぬり')))
    yf=ys(CX,BH)
    L.append(ST(P('入口のふち','prism',(arch_u(CX,0.50,0.84,0.06,BH),yf-0.08,yf+0.016),STONE2,on=('石段（上）',),note='塔のかべにうめこむ')))
    L.append(P('入口の戸','prism',(arch_full(CX,0.382,0.782,BH),yf-0.08,yf+0.006),WOOD,on=('石段（上）',),note='ふちの中。ちょうつがいでとめる'))
    L.append(MT(P('入口のノブ','ball',(CX+0.12,yf+0.026,BH+0.38,0.026),IRON,on=('入口の戸',),note='戸にねじでとめる')))
    for k,(z0,dx) in enumerate(((1.10,-0.14),(1.70,0.10),(2.30,-0.06))):
        x=CX+dx;y=ys(x,z0)
        L.append(ST(P('窓%dのわく'%(k+1),'prism',(arch_full(x,0.18,0.30,z0),y-0.06,y+0.014),STONE2,on=('塔',),note='塔のかべにうめこむ')))
        L.append(notex(P('窓%dのガラス'%(k+1),'prism',(arch_full(x,0.10,0.22,z0+0.04),y-0.06,y+0.02),GLASSW,on=('窓%dのわく'%(k+1),),note='わくの中')))
    for i in range(16):
        a=2*math.pi*(i+0.5)/16;c,s=math.cos(a),math.sin(a);za=ZT-0.30
        ra=towr(za)-0.02;rb=0.80
        L.append(ST(P('持ち送り%d'%(i+1),'plate',((CX+ra*c,CY+ra*s,za),(CX+rb*c,CY+rb*s,ZT-0.01),0.08,0.07),STONE2,on=('塔',),note='塔のかべにさしこむ')))
    L.append(RC(ST(P('見はらし台の床','cyl',(CX,CY,0.84,ZT,GZ),STONE,detail=96,on=tuple('持ち送り%d'%(i+1) for i in range(16))+('塔',),note='持ち送りと塔のてっぺんにのせる')),STONE,GZ))
    for i in range(16):
        a=2*math.pi*(i+0.5)/16;x,y=CX+0.80*math.cos(a),CY+0.80*math.sin(a)
        L.append(MT(P('手すりの柱%d'%(i+1),'box',(x-0.02,y-0.02,GZ,x+0.02,y+0.02,GZ+0.26),IRON,on=('見はらし台の床',),note='床の穴にさしこむ')))
    for nm,zz in(('上',GZ+0.25),('まん中',GZ+0.13)):
        L.append(MT(P('手すりの横木（%s）'%nm,'tube',([(CX+0.80*math.cos(2*math.pi*i/48),CY+0.80*math.sin(2*math.pi*i/48),zz) for i in range(49)],0.014),IRON,on=('手すりの柱1',),note='柱にとめる')))
    L.append(WH(P('当直室','cyl',(CX,CY,0.46,GZ,WR),PLASTER,detail=96,on=('見はらし台の床',),note='見はらし台の床にたてる。しっくいぬり')))
    L.append(P('当直室の戸','prism',(arch_full(CX,0.18,0.32,GZ),CY+0.44,CY+0.47),WOOD,on=('見はらし台の床',),note='見はらし台へ出る戸'))
    L.append(MT(P('当直室の戸のノブ','ball',(CX+0.055,CY+0.482,GZ+0.17,0.016),IRON,on=('当直室の戸',),note='戸にねじでとめる')))
    L.append(RC(ST(P('灯室の腰','cyl',(CX,CY,0.44,WR,LB),STONE2,detail=96,on=('当直室',),note='当直室の上にのせる')),STONE2,LB))
    oc=[(CX+0.40*math.cos(2*math.pi*(i+0.5)/8),CY+0.40*math.sin(2*math.pi*(i+0.5)/8)) for i in range(8)]
    g=notex(P('灯室のガラス','prism',(oc,LB,LT,'z'),GLASS,on=('灯室の腰',),note='八角形のガラス'));g.glow=True;g.decal=glassc;L.append(g)
    for i,(x,y) in enumerate(oc):
        L.append(PM(P('灯室のたての枠%d'%(i+1),'box',(x-0.024,y-0.024,LB,x+0.024,y+0.024,LT),FRAME,on=('灯室の腰',),note='ガラスのかどに立てる')))
    for nm,zz in(('まん中',(LB+LT)/2),('上',LT-0.03)):
        ocr=[(CX+0.412*math.cos(2*math.pi*(i+0.5)/8),CY+0.412*math.sin(2*math.pi*(i+0.5)/8),zz) for i in range(9)]
        L.append(PM(P('灯室の横の枠（%s）'%nm,'tube',(ocr,0.018),FRAME,on=('灯室のたての枠1',),note='たての枠にとめる')))
    prof=[(0.0,RT)]+[(0.46*math.sin(math.pi/2*t/16)**0.8,LT+(RT-LT)*math.cos(math.pi/2*t/16)) for t in range(1,17)]+[(0.46,LT-0.04),(0.0,LT-0.04)]
    L.append(RF(P('屋根','lathe',(CX,CY,prof),ROOF,detail=96,on=('灯室のたての枠1',),note='たての枠の上にのせる')))
    L.append(RF(P('換気の玉','ball',(CX,CY,RT+0.06,0.07),ROOF,on=('屋根',),note='屋根のてっぺん')))
    L.append(MT(P('避雷針','rope',((CX,CY,RT+0.12),(CX,CY,RT+0.32),0.012),IRON,on=('換気の玉',),note='玉にさしこむ')))
    return L
