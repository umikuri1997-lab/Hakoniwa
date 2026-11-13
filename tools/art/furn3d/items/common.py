# 家具の設計図で使う色。木材は、どの部品も同じ色 WOOD（持ち主がきめた：木材のマテリアルはぜんぶ同じ）（木箱 tools/art/crate3d と同じ、明るい木の色。ゲームのほかの絵に合わせた、明るくやわらかい色）
WOOD=(230,183,117);METAL=(168,176,190);BOOKS=[(118,172,214),(232,122,95),(141,196,111),(240,204,114),(190,138,214),(238,223,178)]
LOG=(176,124,82)   # まきの皮の色（家具の木材ではない）
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
