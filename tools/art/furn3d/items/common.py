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
def soft(x0,y0,x1,y1,z0,z1,rc=0.06,re=0.05,lean=0.0,n=4,bottom=True):
    """布でつつんだ、まるい形の loft の層（Part の 'loft' にわたす）。rc：上から見た角の丸み、re：上・下のふちの丸み（4分の1の円）。
    lean：上へいくほど、うしろ（y の小さいほう）へたおす角度（度。背もたれを反らせる）。bottom=False なら下のふちは丸めない"""
    import math
    sh=lambda z:-math.tan(math.radians(lean))*(z-z0)
    L=[]
    def lay(d,z):L.append((rrect(x0+d,y0+d+sh(z),x1-d,y1-d+sh(z),max(0.01,rc-d*0.6),n=4),z))
    if bottom:
        for k in range(n+1):a=math.pi/2*k/n;lay(re*(1-math.sin(a)),z0+re*(1-math.cos(a)))
    else:lay(0,z0)
    for k in range(n+1):a=math.pi/2*k/n;lay(re*(1-math.cos(a)),z1-re+re*math.sin(a))
    return L
