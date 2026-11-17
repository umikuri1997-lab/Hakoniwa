# ほこら（hokora）：石の台にのせた、小さな木の社（和風・火山）。ほこらまいりで使う。
# 設計図（単位はマス）
#   石の台：下の段（0.76×0.60・高さ0〜0.10）と上の段（0.58×0.46・0.10〜0.18）。地面におく。
#   社：木の箱（0.42×0.32・高さ0.18〜0.56）。上の段にのせる。前に格子の戸（もよう）。
#   屋根：切妻（棟は左右へのびる。軒は社より0.08ずつ外。高さ0.56〜0.80）。うすい緑の銅板。棟に木の棟木（0.05角）。
from blueprint import Part as P
from common import *
import math
ID='hokora';GRAD=True;BOTTOM=63
VIEWS=[('hokora',0)]
CX,CY=0.50,0.58;STONE=(176,170,164);ROOF=(150,190,166);DOOR=(176,128,84)
def ST(p):p.stone=True;return p
def lattice(x,y,z):
    if y<CY+0.155 or not(0.24<z<0.50) or abs(x-CX)>0.14:return None
    return DOOR if (int((x-CX+0.14)/0.035)%2==0 or int((z-0.24)/0.04)%2==0) else (120,86,60)
def PARTS():
    L=[]
    L.append(ST(P('下の段','box',(CX-0.38,CY-0.30,0.0,CX+0.38,CY+0.30,0.10),STONE,bevel=0,on=('ground',),note='地面におく')))
    L.append(ST(P('上の段','box',(CX-0.29,CY-0.23,0.098,CX+0.29,CY+0.23,0.18),STONE,bevel=0,on=('下の段',),note='下の段の上')))
    s=P('社','box',(CX-0.21,CY-0.16,0.178,CX+0.21,CY+0.16,0.56),WOOD,bevel=0,on=('上の段',),note='上の段の上');s.decal=lattice;L.append(s)
    for nm,x in(('左',CX-0.21),('右',CX+0.19)):L.append(P('つま（%s）'%nm,'prism',([(CY+0.16,0.558),(CY-0.16,0.558),(CY,0.79)],x,x+0.02,'x'),WOOD,on=('社',),note='社の左右のかべの上。屋根の板をささえる'))
    L.append(P('棟木','box',(CX-0.31,CY-0.025,0.775,CX+0.31,CY+0.025,0.83),WOOD,bevel=0,on=('つま（左）','つま（右）'),note='屋根の棟（つまの三角の上にのせる）'))
    return L
def EXTRA(sc):
    # 屋根：2まいの、かたむいた板（前の面・おくの面）と、つまの三角。棟（z0.74）から軒（z0.56）へ
    sc.part();x0,x1=CX-0.29,CX+0.29;yr=CY;ye1=CY+0.25;ye0=CY-0.25;zt=0.80;ze=0.56;th=0.03
    sc.quad((x0,ye1,ze),(x1,ye1,ze),(x1,yr,zt),(x0,yr,zt),ROOF)
    sc.quad((x0,yr,zt),(x1,yr,zt),(x1,ye0,ze),(x0,ye0,ze),ROOF)
    sc.quad((x0,ye1,ze-th),(x1,ye1,ze-th),(x1,ye1,ze),(x0,ye1,ze),(120,160,136))

TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
