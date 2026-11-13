# 道しるべ（signpost）：木の台に立てた、まるい柱と、矢じるしの板2まい。
# 設計図（じっさいに作れる組み方。単位はマス）
#   台：0.28×0.24・高さ0.10。地面におく。
#   柱：まるい柱（半径0.075・高さ1.20）。台のまん中にたてる。てっぺんは、まるいかさ（半径0.08）。
#   矢じるしの板2まい：同じ大きさ（長さ0.49・高さ0.20・あつさ0.05）。柱の前に、くぎでとめる。上の板は左むき（高さ0.86〜1.06）、下の板は右むき（高さ0.60〜0.80）。
from blueprint import Part as P
from common import *
ID='signpost';BOTTOM=63
VIEWS=[('signpost',0)]
CX,CY=0.50,0.66;R=0.075;H=1.20
def arrow(x0,x1,z0,z1,left):   # 矢じるしの形（x・z）。left なら左がとがる
    m=(z0+z1)/2;t=0.08
    return [(x0,m),(x0+t,z1),(x1,z1),(x1,z0),(x0+t,z0)] if left else [(x1,m),(x1-t,z0),(x0,z0),(x0,z1),(x1-t,z1)]
def PARTS():
    L=[P('台','box',(CX-0.14,CY-0.12,0,CX+0.14,CY+0.12,0.10),WOOD,bevel=0,note='地面におく')]
    L.append(P('柱','cyl',(CX,CY,R,0.10,H),WOOD,on=('台',),detail=16,note='台のまん中にたてる'))
    L.append(P('かさ','ball',(CX,CY,H,0.08),WOOD,on=('柱',),note='柱のてっぺん'))
    yf=CY+R
    L.append(P('上の板','prism',(arrow(CX-0.42,CX+0.07,0.86,1.06,True),yf,yf+0.05,'y'),WOOD,on=('柱',),note='柱の前にくぎでとめる。左むき'))
    L.append(P('下の板','prism',(arrow(CX-0.07,CX+0.42,0.60,0.80,False),yf,yf+0.05,'y'),WOOD,on=('柱',),note='柱の前にくぎでとめる。右むき'))
    return L
