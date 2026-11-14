# 家具の設計図で使う色。木材は、どの部品も同じ色 WOOD（持ち主がきめた：木材のマテリアルはぜんぶ同じ）（木箱 tools/art/crate3d と同じ、明るい木の色。ゲームのほかの絵に合わせた、明るくやわらかい色）
WOOD=(230,183,117);METAL=(168,176,190);BOOKS=[(118,172,214),(232,122,95),(141,196,111),(240,204,114),(190,138,214),(238,223,178)]
LOG=(196,146,96)   # まきの皮の色（家具の木材ではない）
CLOTH=(238,234,208)   # いす・ソファの布（クリーム色。いまの絵に合わせる）
SOFA=(222,228,200)   # ソファの布（うすい緑がかったクリーム色。いまの絵に合わせる）
SACK=(236,218,186)   # あさぶくろの布
PAGE=(248,244,230)   # 本の中の紙
def notex(p):p.tex=False;return p
def rrect(x0,y0,x1,y1,r,front_only=False,n=4):
    """上から見て角を丸めた四角の点（prism の 'z' 用）。front_only：手前（y1 がわ）の2つの角だけ丸める"""
    import math;pts=[]
    for cx,cy,a0,rr in((x1-r,y1-r,0,r),(x0+r,y1-r,90,r),(x0+r,y0+r,180,0 if front_only else r),(x1-r,y0+r,270,0 if front_only else r)):
        if rr==0:pts.append((x0 if a0==180 else x1,y0));continue
        for k in range(n+1):a=math.radians(a0+90*k/n);pts.append((cx+rr*math.cos(a),cy+rr*math.sin(a)))
    return pts
def soft(x0,y0,x1,y1,z0,z1,rc=0.06,re=0.05,lean=0.0,n=4,bottom=True,flare=(0,0),bulge=0.0):
    """布でつつんだ、まるい形の loft の層（Part の 'loft' にわたす）。rc：上から見た角の丸み、re：上・下のふちの丸み（4分の1の円）。
    lean：上へいくほど、うしろ（y の小さいほう）へたおす角度（度。背もたれを反らせる）。bottom=False なら下のふちは丸めない。
    flare=(左,右)：上へいくほど、左・右へひろげる長さ（上のはしで。ソファのひじかけを上ほど太くする）。
    bulge：まわりの面を、高さのまん中で外へふくらませる長さ（ふわっとした布の形）。n：上下のふちの丸みの段の数"""
    import math
    sh=lambda z:-math.tan(math.radians(lean))*(z-z0)
    L=[]
    fx=lambda z:(z-z0)/max(1e-6,z1-z0)
    bg=lambda z:-bulge*math.sin(math.pi*min(1,max(0,fx(z))))
    def lay(d,z):e=d+bg(z);L.append((rrect(x0-flare[0]*fx(z)+e,y0+e+sh(z),x1+flare[1]*fx(z)-e,y1-e+sh(z),max(0.01,rc-max(0,e)*0.6),n=8),z))
    if bottom:
        for k in range(n+1):a=math.pi/2*k/n;lay(re*(1-math.sin(a)),z0+re*(1-math.cos(a)))
    else:lay(0,z0)
    for k in range(n+1):a=math.pi/2*k/n;lay(re*(1-math.cos(a)),z1-re+re*math.sin(a))
    return L
def hfield(sc,x0,y0,x1,y1,top,col,bot=None,n=(24,16),shape=None):
    """高さの面（なだらかな砂・ふっくらしたまくらなど）を三角形で組む。top(x,y)：上の面の高さ。bot(x,y)：下の面の高さ（なければ上の面だけ）。
    まわりのふちは、上と下をたての面でつなぐ（とじた形にする）。col は色か、col(x,y) で場所ごとの色（水の深さなど）。
    shape(u,v)→(x,y)：0〜1 のます目を、形にあわせて動かす（まくらの角をつまむ など）"""
    nx,ny=n;X=[x0+(x1-x0)*i/nx for i in range(nx+1)];Y=[y0+(y1-y0)*j/ny for j in range(ny+1)]
    cf=col if callable(col) else (lambda x,y:col)
    mv=(lambda x,y:shape((x-x0)/(x1-x0),(y-y0)/(y1-y0))) if shape else (lambda x,y:(x,y))
    sc.part()
    for i in range(nx):
        for j in range(ny):
            a,b,c,d=(X[i],Y[j]),(X[i+1],Y[j]),(X[i+1],Y[j+1]),(X[i],Y[j+1])
            P=lambda q,f:(*mv(*q),f(*q));cc=cf((a[0]+c[0])/2,(a[1]+c[1])/2)
            sc.quad(P(a,top),P(b,top),P(c,top),P(d,top),cc)
            if bot:sc.quad(P(d,bot),P(c,bot),P(b,bot),P(a,bot),cc)
    if bot:
        ring=[(x,Y[0]) for x in X]+[(X[-1],y) for y in Y[1:]]+[(x,Y[-1]) for x in X[-2::-1]]+[(X[0],y) for y in Y[-2:0:-1]]
        for q,r in zip(ring,ring[1:]+ring[:1]):sc.quad((*mv(*q),bot(*q)),(*mv(*r),bot(*r)),(*mv(*r),top(*r)),(*mv(*q),top(*q)),cf(*q))
def SOFT(p):p.soft=True;return p   # 布・砂：なだらかなふくらみにも、かげをつける（oblique3d の SOFTLV）
def flame(nm,cx,cy,z0,h,R,on,note=''):
    """火（ろうそく・ランタンの火）：しずくの形（下はまるく、上へとがる）。光るのでかげをつけず、場所ごとの色（もよう）でグラデーション：
    まん中の下は白っぽい黄色 → 黄色 → ふちと上はだいだい → さきは赤みのだいだい。根もとのふちに少し青"""
    import math
    from blueprint import Part
    prof=[(0.0,z0),(0.55*R,z0+0.06*h),(0.92*R,z0+0.2*h),(R,z0+0.32*h),(0.85*R,z0+0.5*h),(0.55*R,z0+0.7*h),(0.25*R,z0+0.86*h),(0.0,z0+h)]
    def rad(z):   # その高さの、しずくの半径
        for (r0,a),(r1,b) in zip(prof,prof[1:]):
            if a<=z<=b:return r0+(r1-r0)*(z-a)/max(1e-9,b-a)
        return 1e-6
    def col(x,y,z):
        t=(z-z0)/h;u=abs(x-cx)/max(1e-6,rad(z))
        if t<0.14 and u>0.5:return (170,190,255)   # 根もとのふち：青
        if t<0.55 and u<0.42*(1-t*0.8):return (255,252,226)   # まん中：白っぽい黄色
        if t<0.78 and u<0.78*(1-t*0.5):return (255,224,104)   # 黄色
        if t>0.86:return (246,122,56)   # さき：赤みのだいだい
        return (255,162,62)   # ふち：だいだい
    p=Part(nm,'lathe',(cx,cy,prof),(255,162,62),on=on,note=note,detail=24);p.glow=True;p.tex=False;p.decal=col;return p
def fire(nm,cx,cy,z0,H,R,on,fr=0,seed=1,small=3,lift=True,note=''):
    """リアルな火（たき火・たいまつ）：いくつもの炎の舌（tongue）。まん中の大きな舌3本（上でわかれて、それぞれちがう向きにゆれる）と、まわりの小さな舌 small 本、
    はなれて上にうかぶ小さな炎（lift）。舌ごとに、芯からのはなれぐあいと高さで色をかえる（根もとの青・まん中の白っぽい黄色・黄色・だいだい・さきの赤み）。
    fr：コマの番号（舌の高さ・ゆれがかわる）。H：いちばん高い舌の高さ。R：まん中の舌の太さ。かげはつけない（光る）"""
    import math,random
    from blueprint import Part
    rnd=random.Random(seed*97+fr*13);out=[]
    def tongue(name,bx,by,h,r,lean,ph,core=True):
        n=9;sp=[];rs=[]
        for i in range(n+1):
            t=i/n;sw=lean*t+0.35*r*math.sin(ph+t*3.2)*t
            sp.append((bx+sw*math.cos(ph*0.7),by+0.3*sw*math.sin(ph*0.7),z0+h*t));rs.append(max(0.0,r*math.sin(math.pi*min(1,t*1.9+0.08))**0.5*(1-t)**0.4))   # さきまで太めにして、急にとがらせる（細い線・はなれた点にならない）
        def col(x,y,z,sp=sp,rs=rs):
            t=max(0,min(1,(z-z0)/h));i=min(n-1,int(t*n));f=t*n-i;q=[sp[i][k]*(1-f)+sp[i+1][k]*f for k in range(3)];rr=max(1e-4,rs[i]*(1-f)+rs[i+1]*f)
            u=abs(x-q[0])/rr   # 見る向き（手前）から見た、芯からのよこのはなれぐあい
            if core and t<0.12 and u>0.55:return (150,176,255)   # 根もとのふち：青
            if core and t<0.5 and u<0.5*(1-t*0.9):return (255,250,222)   # 芯：白っぽい黄色
            if t<0.72 and u<0.8*(1-t*0.55):return (255,218,92)   # 黄色
            if t>0.8:return (238,96,52)   # さき：赤みのだいだい
            return (255,148,54)   # まわり：だいだい
        p=Part(name,'tongue',(sp,rs),(255,148,54),on=on,note=note or '火');p.glow=True;p.tex=False;p.decal=col;return p
    for k,(dx,lean) in enumerate(((0.0,0.0),(-0.9,-0.8),(0.9,0.8))):   # まん中の大きな舌3本
        h=H*(1.0 if k==0 else 0.68)*rnd.uniform(0.84,1.08);out.append(tongue(nm+'（まん中%d）'%(k+1),cx+dx*R,cy+0.02,h,R*(1.0 if k==0 else 0.8),lean*R*rnd.uniform(0.6,1.4),rnd.uniform(0,6.28)))
    for k in range(small):   # まわりの小さな舌
        a=2*math.pi*k/small+rnd.uniform(-0.4,0.4);d=R*rnd.uniform(0.9,1.3)
        out.append(tongue(nm+'（小%d）'%(k+1),cx+d*math.cos(a),cy+0.6*d*math.sin(a),H*rnd.uniform(0.32,0.55),R*rnd.uniform(0.42,0.58),d*0.35*math.cos(a),rnd.uniform(0,6.28)))
    if lift:   # はなれて上にうかぶ小さな炎（コマごとに高さがかわる）
        zz=z0;h0=H*0.24;bx=cx+R*rnd.uniform(-0.5,0.5);hh=H*rnd.uniform(0.55,0.68)
        p=tongue(nm+'（うかぶ炎）',bx,cy,h0,R*0.4,0.0,rnd.uniform(0,6.28),core=False);p.deco=True;sp,rs=p.dims;p.dims=([(q[0],q[1],q[2]+hh) for q in sp],rs);p.on=on
        f0=p.decal;p.decal=lambda x,y,z,f0=f0,hh=hh:f0(x,y,z-hh);out.append(p)
    return out
