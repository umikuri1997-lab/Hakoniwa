# 水おけ（tub）：木の板をまるくならべた低いおけ。鉄の輪2本・水。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（46×50ドット）に合わせた）
#   おけ：まるい板のかべ（外の半径0.34・あつさ0.045・高さ0.24）と、底板。地面におく。
#   はばの広い鉄の輪1本：おけのまわり（高さ0.06〜0.13）。かべにはめる。
#   水：おけの中、ふちの0.15下まで。すけて見える（底板とかべが、水ごしに見える）。おくのほうは空をうつして明るい（EXTRA）。
from blueprint import Part as P
from common import *
ID='tub';BOTTOM=43
VIEWS=[('tub',0)]
CX,CY=0.50,0.58;R=0.34;TH=0.045;H=0.24
WATER=(120,192,240);SKY=(226,242,252)   # 水の色・うつりこむ空の色
def MT(p):p.metal=True;return p
def PARTS():
    L=[P('おけ','ring',(CX,CY,R-TH,R,0,H),WOOD,detail=40,note='地面におく。板をまるくならべる')]
    L.append(P('底板','cyl',(CX,CY,R-TH+0.002,0,0.03),WOOD,detail=40,note='おけの下のはし'))
    for z in(0.06,):L.append(MT(P('鉄の輪','ring',(CX,CY,R-0.002,R+0.008,z,z+0.07),METAL,detail=40,on=('おけ',),note='かべにはめる')))
    return L

def EXTRA(sc):   # 水：おけの中、ふちの0.15下。すけて見える（'clear'）。おくのほうは空をうつして明るく（反射）、手前ほどすけて底が見える
    import math
    zw=H-0.15;r=R-TH-0.002;n=48;m=8
    def col(y):   # おく（y が小さい）ほど、空の色 SKY に近い（うつりこみ）
        t=max(0,min(1,(CY+r*0.2-y)/(r*1.2)))**1.4;return tuple(WATER[k]*(1-t)+SKY[k]*t for k in range(3))
    sc.material('clear');sc.part()
    for i in range(n):
        a0=2*math.pi*i/n;a1=2*math.pi*(i+1)/n
        for j in range(m):
            r0,r1=r*j/m,r*(j+1)/m;P=lambda rr,a:(CX+rr*math.cos(a),CY+rr*math.sin(a),zw);yc=CY+(r0+r1)/2*math.sin((a0+a1)/2)
            if j==0:sc.tri(P(0,0),P(r1,a0),P(r1,a1),col(yc))
            else:sc.quad(P(r0,a0),P(r1,a0),P(r1,a1),P(r0,a1),col(yc))
    sc.material(None)
