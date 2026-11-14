# 風車（windmill、1×1マス）：いまの絵のデザインのまま。石の台に、白いしっくいの、上ほど細いまるい塔。前に石のふちのアーチの戸口と木の戸、上に小さな窓。赤くぬった板金の円すいの屋根。屋根の前から軸が出て、木のわくに布をはった羽4まいが、ハブのまわりで回る。
# 素材の質感：しっくい（Plaster001）・石（Rock030）・木（Wood049）・赤くぬった板金の屋根（Metal032）のテクスチャ。かげは、こまかい段（面のかくかくを見せない）。
# 設計図（じっさいに建てられる組み方。単位はマス。大きさは、いまの絵（本体68×126・羽116×124ドット、g64）に合わせる）
#   台：石を、まるく（外の半径0.47・内の半径0.30）1だんならべる（高さ0〜0.09）。石はどれも同じ大きさ（外がわで長さ0.25）、12こ。中は石の床（見えない）。
#   塔：しっくいの塔（下の半径0.41・てっぺんの半径0.33、高さ0.09〜1.20）。台の上にたてる。
#   しきいの石：戸口の前（はば0.30、高さ0〜0.10）。地面におく。
#   戸口：しきいの石の上、塔の前の下。石のふち（U字、外のはば0.30・高さ0.47、ふちのはば0.04）を、塔のかべにうめこむ。中に木の戸（はば0.22・高さ0.43、ふちより0.008おく）と、鉄のノブ（半径0.017）。
#   窓：戸口の上（高さ0.70〜0.84、はば0.07）。石のわく（はば0.03）と、うすい色のガラス。
#   屋根：塔のてっぺんにのせる、赤くぬった板金の円すいの屋根（のきの半径0.41、高さ1.17〜1.76）。てっぺんに玉。
#   軸：屋根の中から、前へ出る木の軸（半径0.04、高さ1.42）。屋根をつらぬく。羽が塔・屋根のかべにあたらないように、ハブは塔のまん中から0.50前。
#   羽：軸のさきのハブ（木の玉、半径0.075）に、木の腕木4本（ハブから0.94、はば0.05）をさしこむ。腕木の片がわに、木のわく（はば0.24、ハブから0.24〜0.92、わくの材のはば0.035）と、わくを3つにわける横の桟2本。わくのうしろに布（クリーム色、かげなし）をはる。
#     羽は、カメラのほうを向く面にならべる（ゲームで2Dのままくるくる回すので、写した形がまるくなるように、たての寸法を K 倍にのばして、たてにした面に組む）。
#   動く部品（ゲームで回る）：羽（腕木・わく・桟・布・ハブ）。回る支点はハブのまん中。
from blueprint import Part as P
from common import *
import math
ID='windmill';BOTTOM=62;GRAD=True
VIEWS=[('windmill',0)]
CX,CY=0.50,0.50
STONES=[(214,212,210),(204,202,200),(222,220,216),(198,196,196)]
PLASTER=(255,251,244);STONEF=(206,204,206);GLASS=(150,164,186);ROOF=(244,138,112);CLOTH_=(244,234,214)
ZT=1.20;HZ=1.42;HY=CY+0.50   # 塔のてっぺん・ハブの高さ・ハブの南北の場所
K=0.96   # 羽の面の、たてののばし（写した羽がまるく見えるように）
def ramp(c0,c1,n):return [tuple(round(c0[k]+(c1[k]-c0[k])*i/(n-1)) for k in range(3)) for i in range(n)]
PLW=ramp((255,251,244),(212,198,182),7)   # 白いしっくいの、光からかげまで（こまかい段で、面のかくかくを見せない）
def tone(T,l,hi,lo):   # 光との向き l（hi より上は光、lo より下はかげ）を、T の段にする
    return T[max(0,min(len(T)-1,int((hi-l)/(hi-lo)*(len(T)-1)+0.5)))]
def plw(x,y,z):   # 白いしっくいのかげ：場所ごとの色（左まえが光、右うしろほどかげ）。ふつうのかげでは、前の面がぜんぶ半かげで灰色に見える
    import math;a=math.atan2(y-CY,x-CX);return tone(PLW,math.cos(a-2.6),0.9,-0.6)
ROOFS=ramp((248,166,140),(194,94,78),6)   # 屋根の赤の、光からかげまで
def roofc(x,y,z):   # 屋根のかげ：場所ごとの色（円すいの面の向きと光）。ふつうのかげでは、にごった茶色になる
    import math;rho=math.hypot(x-CX,y-CY) or 1e-6;n=((x-CX)/rho*0.59,(y-CY)/rho*0.59,0.41);m=math.sqrt(sum(q*q for q in n));l=(-0.55*n[0]+0.35*n[1]+0.76*n[2])/m
    return tone(ROOFS,l,0.85,0.0)
def RF(p):p.mtex=True;p.flat=True;p.decal=roofc;return p   # 赤くぬった板金（金属のテクスチャ・場所ごとの色のかげ）
def WH(p):p.plaster=True;p.flat=True;p.decal=plw;return p   # 白いしっくい（しっくいのテクスチャ・場所ごとの色のかげ）
def towr(z):return 0.41+(0.33-0.41)*(z-0.09)/(ZT-0.09)
def arch_u(cx,w,h,f,z0=0.09,n=16):   # U字のアーチのふち（外のはば w・高さ h・ふちのはば f）
    ro=w/2;ri=w/2-f;zo=z0+h-ro;pts=[(cx-ro,z0)]
    pts+=[(cx-ro*math.cos(math.pi*i/n),zo+ro*math.sin(math.pi*i/n)) for i in range(n+1)]
    pts+=[(cx+ro,z0),(cx+ri,z0)]
    pts+=[(cx+ri*math.cos(math.pi*i/n),zo+ri*math.sin(math.pi*i/n)) for i in range(n+1)]
    pts+=[(cx-ri,z0)];return pts
def arch_full(cx,w,h,z0=0.09,n=16):
    r=w/2;zo=z0+h-r;return [(cx-r,z0)]+[(cx-r*math.cos(math.pi*i/n),zo+r*math.sin(math.pi*i/n)) for i in range(n+1)]+[(cx+r,z0)]
def sector(a0,a1,r0,r1,n=6):
    o=[(CX+r1*math.cos(a0+(a1-a0)*i/n),CY+r1*math.sin(a0+(a1-a0)*i/n)) for i in range(n+1)]
    return o+[(CX+r0*math.cos(a1-(a1-a0)*i/n),CY+r0*math.sin(a1-(a1-a0)*i/n)) for i in range(n+1)]
def sail(s,t,a):   # 羽の面の場所（s：ハブから腕木にそって、t：腕木をよこぎる向き）→ (x, z)
    c,d=math.cos(a),math.sin(a);return (CX+s*c-t*d,HZ+(s*d+t*c)*K)
def quad(s0,s1,t0,t1,a):return [sail(s0,t0,a),sail(s1,t0,a),sail(s1,t1,a),sail(s0,t1,a)]
def PARTS():
    L=[];da=2*math.pi/12;gap=0.0015/0.47
    for i in range(12):
        p=P('台の石%d'%(i+1),'prism',(sector(da*(i+0.5)+gap,da*(i+1.5)-gap,0.30,0.47),0.0,0.09,'z'),STONES[(i*3)%4],note='地面にならべる');p.stone=True;L.append(p)
    p=P('台の床','cyl',(CX,CY,0.30,0.0,0.088),STONES[0],note='台の中の石の床（塔の下）');p.stone=True;L.append(p)
    L.append(WH(P('塔','lathe',(CX,CY,[(0.0,ZT),(towr(ZT),ZT),(towr(0.09),0.09),(0.0,0.09)]),PLASTER,detail=96,on=('台の床',),note='台の上にたてる。しっくいぬり')))
    yf=CY+towr(0.10)
    p=P('戸口のふち','prism',(arch_u(CX,0.30,0.47,0.04,z0=0.10),yf-0.06,yf+0.012),STONEF,on=('しきいの石',),note='塔のかべにうめこむ');p.stone=True;L.append(p)
    L.append(P('戸','prism',(arch_full(CX,0.222,0.432,z0=0.10),yf-0.06,yf+0.004),WOOD,on=('しきいの石',),note='ふちの中。ちょうつがいでとめる'))
    k=P('戸のノブ','ball',(CX+0.07,yf+0.016,0.30,0.017),(168,176,190),on=('戸',),note='戸にねじでとめる');k.metal=True;k.mtex=True;L.append(k)
    p=P('しきいの石','box',(CX-0.15,yf-0.07,0.0,CX+0.15,CY+0.485,0.10),STONES[2],note='戸口の前。地面におく');p.stone=True;L.append(p)
    yw=CY+towr(0.77)
    p=P('窓のわく','box',(CX-0.065,yw-0.05,0.68,CX+0.065,yw+0.012,0.86),STONEF,on=('塔',),note='塔のかべにうめこむ');p.stone=True;L.append(p)
    L.append(notex(P('窓のガラス','box',(CX-0.035,yw-0.04,0.71,CX+0.035,yw+0.018,0.83),GLASS,on=('窓のわく',),note='わくの中')))
    prof=[(0.0,1.76),(0.41,1.17),(0.33,1.17),(0.0,1.17)]   # 円すいの板金の屋根
    L.append(RF(P('屋根','lathe',(CX,CY,prof),ROOF,detail=96,on=('塔',),note='塔のてっぺんにのせる。赤くぬった板金')))
    L.append(RF(P('屋根の玉','ball',(CX,CY,1.78,0.04),ROOF,on=('屋根',),note='屋根のてっぺん')))
    L.append(P('軸','frust',((CX,CY+0.10,HZ),(CX,HY-0.05,HZ),0.04,0.04),WOOD,on=('屋根',),note='屋根をつらぬく'))
    L.append(P('羽のハブ','ball',(CX,HY,HZ,0.075),WOOD,on=('軸',),note='軸のさき'))
    y0=HY-0.035   # 布のうしろの面
    for k in range(4):
        a=math.pi/4+k*math.pi/2;n='羽%d'%(k+1)
        L.append(P(n+'の腕木','prism',(quad(0.05,0.94,-0.024,0.024,a),y0+0.030,y0+0.052),WOOD,on=('羽のハブ',),note='ハブにさしこむ'))
        fr=[('わく（外）',quad(0.24,0.92,0.205,0.24,a)),('わく（さき）',quad(0.885,0.92,0.0,0.24,a)),('わく（もと）',quad(0.24,0.275,0.0,0.24,a)),
            ('桟1',quad(0.460,0.485,0.0,0.24,a)),('桟2',quad(0.675,0.700,0.0,0.24,a))]
        for nm,q in fr:L.append(P(n+'の'+nm,'prism',(q,y0+0.012,y0+0.030),WOOD,on=(n+'の腕木',),note='腕木にくぎでとめる',grp=n+'わく'))
        c=notex(P(n+'の布','prism',(quad(0.25,0.91,0.01,0.23,a),y0,y0+0.012),CLOTH_,on=(n+'のわく（外）',),note='わくのうしろにはる'));c.flat=True;L.append(c)   # 布はかげなし（回るので、どの向きでも同じ明るさ）
    return L
MOVE={'windmill':{'sel':lambda n:n.startswith('羽'),'pivot':(CX,HY,HZ)}}
