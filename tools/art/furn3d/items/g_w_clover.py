# クローバーのテーブル（g_w_clover、特別な家具・木）。もらったデザインの形・色に合わせる。
# 設計図（単位はマス）：台（木の輪切り、半径0.26・高さ0〜0.05）→ 根もとの葉（台の上に4まい）→ 脚（木のくき、ろくろ、高さ0.05〜0.4）
#   → 天板の木のうけ（4まいの葉の形の木の板、あつさ0.025、高さ0.4〜0.425）→ 葉（そのうえ、少し小さい緑の葉4まい、高さ0.425〜0.44、まん中からすじ）
#   → ティーポット（クリーム色のやきもの、葉のもよう、つや）・カップとうけ皿（お茶入り）。
from blueprint import Part as P
from common import *
from gfcommon import *
import math
ID='g_w_clover';BOTTOM=60;GRAD=True;STREAK=(0.3,0.15)
VIEWS=[('g_w_clover',0)]
CX,CY=0.50,0.52;WOODL=(216,168,112);LEAF=(184,182,118);VEIN=(166,164,104);POT=(236,222,196);POTL=(176,178,116);TEA=(200,140,80)
def heart(a,r,n=28):
    pts=[]
    for i in range(n):
        t=2*math.pi*i/n;x=16*math.sin(t)**3;y=13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t)
        u,v=x/17*r,(y+5)/17*r;ca,sa=math.cos(a),math.sin(a);pts.append((CX+(v*ca-u*sa),CY+(v*sa+u*ca)))
    return pts
def PARTS():
    L=[W(P('台','cyl',(CX,CY,0.26,0.0,0.05),WOODL,detail=40,note='地面におく'))]
    L.append(W(P('脚','lathe',(CX,CY,[(0.0,0.05),(0.1,0.05),(0.07,0.09),(0.055,0.2),(0.06,0.32),(0.1,0.4),(0.0,0.4)]),WOODL,detail=32,on=('台',),note='台のまん中にたてる')))
    for k in range(4):
        a=math.radians(45+90*k)
        L.append(W(P('木のうけ%d'%k,'prism',(heart(a,0.32),0.4,0.425,'z'),WOODL,on=('脚',),note='脚の上')))
        p=P('葉%d'%k,'prism',(heart(a,0.285),0.425,0.44,'z'),LEAF,on=('木のうけ%d'%k,),note='木のうけの上');p.tex=False
        def dc(x,y,z,aa=a):
            u=(x-CX)*math.cos(aa)+(y-CY)*math.sin(aa);v=-(x-CX)*math.sin(aa)+(y-CY)*math.cos(aa)
            if z<0.437:return None
            if abs(v)<0.007 and u>0.02:return VEIN
            for s in(-1,1):
                if abs(v-s*(u-0.06)*0.7)<0.006 and 0.08<u<0.22 and s*v>0:return VEIN
            return None
        p.decal=dc;L.append(p)
    t=P('ティーポット','lathe',(CX+0.08,CY-0.07,[(0.0,0.44),(0.07,0.44),(0.105,0.49),(0.1,0.55),(0.065,0.59),(0.0,0.6)]),POT,detail=32,on=('葉0',),note='天板の上');t.tex=False;t.shiny=True
    def pl(x,y,z):
        a=math.atan2(y-(CY-0.07),x-(CX+0.08));
        if abs(a-math.pi/2)<0.5 and 0.47<z<0.56:
            u=(z-0.515)/0.04;w=(a-math.pi/2)/0.5
            if abs(w)<0.12 or (u*u+((abs(w)-0.45)/0.35)**2<0.5 and abs(w)>0.12):return POTL
        return None
    t.decal=pl;L.append(t)
    L.append(notex(P('ふた','ball',(CX+0.08,CY-0.07,0.6,0.05,0.35),POT,on=('ティーポット',),note='ポットの上')))
    L.append(notex(P('ふたのつまみ','ball',(CX+0.08,CY-0.07,0.625,0.02),POTL,on=('ふた',),note='ふたの上')))
    L.append(notex(P('そそぎ口','frust',((CX-0.01,CY-0.07,0.5),(CX-0.08,CY-0.07,0.57),0.024,0.012),POT,on=('ティーポット',),note='ポットの左')))
    L.append(notex(P('取っ手','tube',([(CX+0.18,CY-0.07,0.48),(CX+0.22,CY-0.07,0.52),(CX+0.18,CY-0.07,0.57)],0.014),POT,on=('ティーポット',),note='ポットの右')))
    s=P('うけ皿','cyl',(CX-0.1,CY+0.09,0.06,0.44,0.45),POT,detail=24,on=('葉2',),note='天板の上');s.tex=False;s.shiny=True;s.decal=lambda x,y,z:POTL if math.hypot(x-(CX-0.1),y-(CY+0.09))>0.05 else None;L.append(s)
    c=P('カップ','lathe',(CX-0.1,CY+0.09,[(0.0,0.45),(0.028,0.45),(0.04,0.5),(0.0,0.5)]),POT,detail=24,on=('うけ皿',),note='うけ皿の上');c.tex=False;c.shiny=True;L.append(c)
    L.append(notex(P('お茶','cyl',(CX-0.1,CY+0.09,0.034,0.495,0.498),TEA,detail=20,on=('カップ',),note='カップの中')))
    return L
def EXTRA(sc):
    for k in range(4):   # 根もとの葉
        a=math.radians(20+90*k);leaf(sc,(CX+0.07*math.cos(a),CY+0.07*math.sin(a),0.055),(math.cos(a),math.sin(a),0.15),0.13,0.06,LEAF,curl=0.12)
TONE5=True;TONE3=True   # かげは3だん・あみなし（特別な家具。持ち主がきめた）
