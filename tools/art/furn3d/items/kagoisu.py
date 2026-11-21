# 気球のかごのいす（kagoisu、風）：ほうき草であんだ、気球のかごの形のいす。中に、まるいクッション。
# 設計図（じっさいに作れる組み方。単位はマス）
#   かご：ほうき草をあんだ、まるいかご（下の半径0.26・上の半径0.30・高さ0〜0.46）。あみめは、たて・よこの帯（はば0.05）の市松の色。
#   ふち：かごの上に、なびき草をまいた太いふち（半径0.30、太さ0.035）。
#   クッション：中に、うすいピーチ色のまるいクッション（半径0.25・高さ0.32〜0.46）。
#   なわ：ふちの左右から、上へみじかいなわの輪（太さ0.014、高さ0.46〜0.60）。気球につないでいたなごり。
from blueprint import Part as P
from common import *
import math
ID='kagoisu';BOTTOM=56;GRAD=True
VIEWS=[('kagoisu',0)]
CX,CY=0.50,0.58;STRAW=(232,206,142);STRAWD=(212,182,118);ROPE=(226,206,152);CUSH=(250,226,206)
def PARTS():
    k=P('かご','lathe',(CX,CY,[(0.0,0.0),(0.26,0.0),(0.27,0.06),(0.29,0.30),(0.30,0.46),(0.0,0.46)]),STRAW,detail=40,note='地面におく');k.tex=False
    k.decal=lambda x,y,z:STRAW if (int(z/0.05)+int((math.atan2(y-CY,x-CX)+math.pi)/0.17))%2==0 else STRAWD;L=[k]
    L.append(notex(P('ふち','ring',(CX,CY,0.27,0.33,0.44,0.49),ROPE,detail=40,on=('かご',),note='かごの上')))
    c=notex(P('クッション','egg',(CX,CY,0.42,0.25,0.25,0.07,0),CUSH,on=('かご',),note='かごの中'));c.soft=True;L.append(c)
    for sx in(-1,1):
        pts=[(CX+sx*(0.29+0.05*math.cos(math.radians(a))),CY,0.54+0.06*math.sin(math.radians(a))) for a in range(-80,261,20)]
        L.append(notex(P('なわ','tube',(pts,0.014),ROPE,on=('ふち',),note='ふちにむすぶ')))
    return L
TONE5=True
