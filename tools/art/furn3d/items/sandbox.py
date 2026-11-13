# 砂場（sandbox、2×1マス）：まるい丸太のわく（四すみの太い柱・まわりの丸太）と、中の砂（ふたつの小山）。横（sandbox）とたて（sandbox>1）の2つの向き。
# 設計図（じっさいに作れる組み方。単位はマス）
#   四すみの柱：まるい丸太（半径0.09・高さ0.26）。地面にうめてたてる。
#   まわりの丸太：横に2本ずつ、上と下（半径0.065）。柱のあいだにわたし、柱にほぞでとめる（前・うしろ・左・右）。
#   砂：わくの内がわを、地面から0.10の砂でうめ、なだらかなまるい小山を3つ（高さ0.30まで。わくより上に出る。1まいの面。EXTRA）。
from blueprint import Part as P
from common import *
import math
ID='sandbox';SZ=(2,1);BOTTOM=62
VIEWS=[('sandbox',0),('sandbox>1',1)]
X0,X1,Y0,Y1=0.04,1.96,0.18,0.96;RP=0.09;ZP=0.26;RL=0.065
SAND=(240,216,166)
def circ(c0,c1,r,n=14):return [(c0+r*math.cos(2*math.pi*k/n),c1+r*math.sin(2*math.pi*k/n)) for k in range(n)]
def PARTS():
    L=[];cs={('左','うしろ'):(X0+RP,Y0+RP),('右','うしろ'):(X1-RP,Y0+RP),('左','前'):(X0+RP,Y1-RP),('右','前'):(X1-RP,Y1-RP)}
    for (nx,ny),(x,y) in cs.items():L.append(P('柱（%s%s）'%(nx,ny),'cyl',(x,y,RP,0,ZP),WOOD,detail=20,note='地面にうめてたてる'))
    for z in(RL,RL*3):
        for ny,y in(('うしろ',Y0+RP),('前',Y1-RP)):L.append(P('丸太（%s・%.2f）'%(ny,z),'prism',(circ(y,z,RL),X0+2*RP-0.01,X1-2*RP+0.01,'x'),WOOD,on=('柱（左%s）'%ny,'柱（右%s）'%ny),note='柱のあいだにわたす'))
        for nx,x in(('左',X0+RP),('右',X1-RP)):L.append(P('丸太（%s・%.2f）'%(nx,z),'prism',(circ(x,z,RL),Y0+2*RP-0.01,Y1-2*RP+0.01,'y'),WOOD,on=('柱（%sうしろ）'%nx,'柱（%s前）'%nx),note='柱のあいだにわたす'))
    return L

def EXTRA(sc):   # 砂：わくの内がわを、なだらかな小山のある1まいの面でうめる（高さ0.10〜0.30）
    import math
    xa,xb,ya,yb=X0+RP*0.6,X1-RP*0.6,Y0+RP*0.6,Y1-RP*0.6
    def top(x,y):
        u=(x-xa)/(xb-xa);v=(y-ya)/(yb-ya)
        z=0.10
        for cu,cv,h,r in((0.25,0.55,0.20,0.22),(0.70,0.50,0.18,0.24),(0.48,0.30,0.07,0.14)):z+=h*math.exp(-(((u-cu)*(xb-xa))**2+((v-cv)*(yb-ya))**2)/(2*(r*(yb-ya)*1.6)**2))   # なだらかな、まるい小山（ガウスの形）
        return z
    sc.group('砂');sc.material('soft');hfield(sc,xa,ya,xb,yb,top,SAND,bot=lambda x,y:0.0,n=(96,36));sc.material(None);sc.group(None)
