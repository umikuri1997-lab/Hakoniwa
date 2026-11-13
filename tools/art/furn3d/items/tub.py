# 水おけ（tub）：木の板をまるくならべた低いおけ。鉄の輪2本・水。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（46×50ドット）に合わせた）
#   おけ：まるい板のかべ（外の半径0.34・あつさ0.045・高さ0.24）と、底板。地面におく。
#   はばの広い鉄の輪1本：おけのまわり（高さ0.06〜0.13）。かべにはめる。
#   水：おけの中、ふちの0.15下まで。すけて見える・つやがある（マテリアル 'clear'）。水面に小さなさざなみ。おくのほうは空をうつして明るい（EXTRA）。
from blueprint import Part as P
from common import *
ID='tub';BOTTOM=43
VIEWS=[('tub',0)]
CX,CY=0.50,0.58;R=0.34;TH=0.045;H=0.24
WATER=(96,178,236);SKY=(214,238,252)   # 水の色・うつりこむ空の色
def MT(p):p.metal=True;return p
def PARTS():
    L=[P('おけ','ring',(CX,CY,R-TH,R,0,H),WOOD,detail=40,note='地面におく。板をまるくならべる')]
    L.append(P('底板','cyl',(CX,CY,R-TH+0.002,0,0.03),WOOD,detail=40,note='おけの下のはし'))
    for z in(0.06,):L.append(MT(P('鉄の輪','ring',(CX,CY,R-0.002,R+0.008,z,z+0.07),METAL,detail=40,on=('おけ',),note='かべにはめる')))
    return L

def EXTRA(sc):   # 水：おけの中、ふちの0.15下。すけて見える・つやがある（'clear'）。水面に小さなさざなみ（光と目のあいだを向く山がつやで光る）。おくのほうは空をうつして明るい（反射）
    import math
    zw=H-0.15;r=R-TH-0.004
    def col(x,y):   # おく（y が小さい）ほど、空の色 SKY に近い（うつりこみ）
        t=max(0,min(1,(CY+r*0.2-y)/(r*1.2)))**1.4;return tuple(WATER[k]*(1-t)+SKY[k]*t for k in range(3))
    def disk(u,v):   # 0〜1 のます目を、まるい水面にうつす
        U,V=2*u-1,2*v-1;return (CX+r*U*math.sqrt(max(0,1-V*V/2)),CY+r*V*math.sqrt(max(0,1-U*U/2)))
    def top(x,y):   # さざなみ（ます目の場所で、ゆるい波を2つかさねる）
        u=(x-(CX-r))/(2*r);v=(y-(CY-r))/(2*r);return zw+0.006*math.sin(u*13.0+v*4.0)+0.004*math.sin(v*17.0-u*6.0+1.3)
    sc.material('clear');hfield(sc,CX-r,CY-r,CX+r,CY+r,top,lambda x,y:col(*disk((x-(CX-r))/(2*r),(y-(CY-r))/(2*r))),n=(40,40),shape=disk);sc.material(None)
