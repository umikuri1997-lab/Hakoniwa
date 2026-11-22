# しまもようのハンモック（shimahammock、風）：2×1。アカシアの柱2本のあいだに、帆布の壁と同じ、ピンクとクリーム色のしまの布をつるす。
# 設計図（じっさいに作れる組み方。単位はマス）
#   柱：アカシアの丸い柱（半径0.055・高さ0〜1.05）を、x 0.16 と 1.84、y 0.55 に立てる。根もとに、ささえの台（半径0.10・高さ0.06）。
#   つりなわ：柱のさき（高さ0.95）から、布のはし（x 0.40・1.60、高さ0.62）へ、なびき草のなわ（太さ0.016）を2本ずつ（布の手前・おくのはし）。
#   布：x 0.40〜1.60、はば0.40（y 0.35〜0.75）。まん中がたれる（はしの高さ0.62 → まん中0.36、2次の曲線）。布のはしは、細い木のぼう（半径0.022）にまきつける。
#   しま：布ののびる向きに直角の帯、はば0.15ごとにピンクとクリーム色（帆布の壁と同じ色）。
from blueprint import Part as P
from common import *
import math
ID='shimahammock';BOTTOM=60;GRAD=True;SZ=(2,1)
VIEWS=[('shimahammock',0)]
CY=0.55;ACAC=(222,170,108);ROPE=(226,206,152);PINK=(246,190,182);CREAM=(252,240,214)
X0,X1,ZE,ZM,HW=0.40,1.60,0.62,0.36,0.20
def zf(x):u=(x-1.0)/(X1-1.0);return ZM+(ZE-ZM)*u*u
def PARTS():
    L=[]
    for k,x in enumerate((0.16,1.84)):
        L.append(P('台%d'%k,'cyl',(x,CY,0.10,0.0,0.06),ACAC,detail=20,note='地面におく'))
        L.append(P('柱%d'%k,'cyl',(x,CY,0.055,0.06,1.05),ACAC,detail=16,on=('台%d'%k,),note='台の穴にさす'))
    for k,(xp,xe) in enumerate(((0.16,X0),(1.84,X1))):
        for dy in(-HW,HW):L.append(notex(P('つりなわ%d'%k,'rope',((xp,CY,0.95),(xe,CY+dy,ZE),0.016),ROPE,on=('柱%d'%k,),note='柱のさきにむすぶ')))
        L.append(P('ぼう%d'%k,'beam',((xe,CY-HW-0.03,ZE),(xe,CY+HW+0.03,ZE),0.022),ACAC,on=('つりなわ%d'%k,),note='布のはしをまきつける'))
    return L
def EXTRA(sc):   # 布：まん中がたれる、しまの布（帆布）
    sc.group('布');sc.material('soft1');sc.part();sc.smooth(True);n=48;Y0,Y1=CY-HW,CY+HW
    for i in range(n):
        xa=X0+(X1-X0)*i/n;xb=X0+(X1-X0)*(i+1)/n;c=PINK if int((xa-X0+0.001)/0.15)%2==0 else CREAM
        for ya,yb in((Y0,CY),(CY,Y1)):
            sag=lambda x,y:zf(x)-0.03*(1-((y-CY)/HW)**2)
            sc.quad((xa,ya,sag(xa,ya)),(xb,ya,sag(xb,ya)),(xb,yb,sag(xb,yb)),(xa,yb,sag(xa,yb)),c)
    sc.smooth(False);sc.material(None);sc.group(None)
TONE5=True
