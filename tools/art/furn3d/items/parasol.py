# パラソル（parasol）：いまの絵と同じデザイン・同じ大きさ。木のまるい台に木の柱、上に、ピンクとクリーム色のしまの、まるいかさ。てっぺんに木の玉。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（74×100ドット）に合わせた）
#   台：木のまるい台（半径0.19・高さ0〜0.08、上のふちはまるい）。地面におく。
#   柱：木の丸い柱（半径0.028・高さ0.06〜1.20）。台のまん中の穴にさしこむ。
#   かさ：布をはった、まるいかさ（ふちの半径0.58・高さ1.00 → てっぺん1.22。ゆるいまるみ）。布は8まい。ピンクとクリーム色を、かわりばんこ（布の面のもよう）。柱のさきにとめる。
#   ひだ：かさのふちから下へたれる布（布1まいごとに、下のはしが半円にふくらむ。まん中で0.10・さかい目で0.03たれる）。布と同じ色のしま。かさと1まいの布なので、さかいに線を引かない。かげは3だんのかげをつけず、右がわほど少しだけ暗く（いちばん右で0.95倍、ひだは0.97倍）。
#   玉：かさのてっぺんに、木の玉（半径0.045）。
from blueprint import Part as P
from common import *
import math
ID='parasol';BOTTOM=53;GRAD=True
VIEWS=[('parasol',0)]
CX,CY=0.50,0.55;PINK=(240,166,160);CREAM=(250,238,218)
def PARTS():
    L=[P('台','lathe',(CX,CY,[(0.0,0.0),(0.19,0.0),(0.19,0.05),(0.175,0.075),(0.15,0.08),(0.0,0.08)]),WOOD,detail=32,note='地面におく')]
    L.append(P('柱','cyl',(CX,CY,0.028,0.06,1.20),WOOD,detail=12,on=('台',),note='台のまん中の穴にさしこむ'))
    prof=[(0.0,1.22),(0.14,1.21),(0.28,1.18),(0.40,1.13),(0.50,1.07),(0.58,1.00),(0.56,0.995),(0.0,1.13)]
    k=P('かさ','lathe',(CX,CY,prof),CREAM,detail=48,on=('柱',),note='柱のさきにとめる。布8まい',grp='かさ');k.tex=False;k.flat=True   # 布：かげはつけず、もようで、右がわを少しだけ暗く（shade）
    k.decal=lambda x,y,z:shade(stripe(x,y),x)
    L.append(k)
    L.append(P('玉','ball',(CX,CY,1.235,0.045),WOOD,on=('かさ',),note='かさのてっぺん'))
    return L
def shade(c,x,k=1.0):return tuple(int(round(v*k*(1-0.05*max(0.0,(x-CX)/0.58)))) for v in c)   # 光は左から：右がわほど、少しだけ暗く（いちばん右で0.95倍）
def stripe(x,y):return PINK if int(((math.atan2(y-CY,x-CX)+math.pi/8)%(2*math.pi))/(math.pi/4))%2==0 else CREAM
def EXTRA(sc):   # ひだ：かさのふちから下へたれる布。布1まいごとに、下のはしが半円にふくらむ（ほたて貝の形）。外がわへ少しひらく
    sc.group('かさ');sc.material('flat');sc.part();sc.smooth(True);n=96;R0=0.58;Z0=1.00   # かさと同じグループ（さかいに線を引かない）・うすいかげだけ
    for i in range(n):
        a0,a1=2*math.pi*i/n,2*math.pi*(i+1)/n
        def drop(a):   # 布1まい（45度）ごとの、たれる長さ：まん中0.10・さかい目0.03
            u=((a+math.pi/8)%(math.pi/4))/(math.pi/4);return 0.03+0.07*math.sin(math.pi*u)
        P_=lambda a,z,r:(CX+r*math.cos(a),CY+r*math.sin(a),z)
        t0,t1=P_(a0,Z0,R0),P_(a1,Z0,R0);b0,b1=P_(a0,Z0-drop(a0),R0+0.012),P_(a1,Z0-drop(a1),R0+0.012)
        m=P_((a0+a1)/2,Z0,R0);c=shade(stripe(*m[:2]),m[0],0.97);sc.quad(t0,t1,b1,b0,c)   # ひだは、かさより少しだけ暗く（0.97倍）
    sc.smooth(False);sc.material(None);sc.group(None)
