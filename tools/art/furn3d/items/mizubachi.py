# 苔むした石の水ばち（mizubachi）：宝箱だけの家具。ひくい、まるい石の水ばちに、すんだ水。まわりの石に苔。
# 設計図（じっさいに作れる組み方。単位はマス）
#   台石：平たい石（半径0.34・高さ0〜0.06）。地面におく。
#   はち：石の、ふちのあつい、まるいはち（外の半径0.32・高さ0.06〜0.34、ふちのあつさ0.07、中のふかさ0.20）。台石の上。
#   水：はちの中、ふちの0.04下。すけて見える（'clear'）。
#   苔：はちの外がわの下のほうと、ふちの一部に、みどりのまだら（石の面のもよう）。
from blueprint import Part as P
from common import *
import math
ID='mizubachi';BOTTOM=63;GRAD=True
VIEWS=[('mizubachi',0)]
CX,CY=0.50,0.58;STONE=(206,204,196);MOSS=(132,184,96);MOSS2=(164,206,118);WATER=(120,192,236);SKY=(220,240,252)
def moss(x,y,z):
    n=math.sin(x*37+y*11)*math.sin(y*29-x*7)+math.sin(z*41+x*13)*0.6
    if z<0.16 and n>-0.2:return MOSS if n>0.4 else MOSS2
    if z>0.30 and n>0.7:return MOSS2
    return None
def PARTS():
    a=P('台石','lathe',(CX,CY,[(0.0,0.0),(0.34,0.0),(0.33,0.04),(0.29,0.06),(0.0,0.06)]),STONE,detail=40,note='地面におく');a.tex=False;a.stone=True
    b=P('はち','lathe',(CX,CY,[(0.0,0.06),(0.28,0.06),(0.32,0.14),(0.32,0.30),(0.30,0.34),(0.25,0.34),(0.24,0.30),(0.20,0.16),(0.0,0.14)]),STONE,detail=48,on=('台石',),note='台石の上');b.tex=False;b.stone=True;b.decal=lambda x,y,z:moss(x,y,z) or STONE
    return [a,b]
def EXTRA(sc):
    zw=0.30;r=0.24
    def col(x,y):t=max(0,min(1,(CY-y)/(r*1.4)+0.3))**1.4;return tuple(WATER[k]*(1-t)+SKY[k]*t for k in range(3))
    def disk(u,v):U,V=2*u-1,2*v-1;return (CX+r*U*math.sqrt(max(0,1-V*V/2)),CY+r*V*math.sqrt(max(0,1-U*U/2)))
    top=lambda x,y:zw+0.003*math.sin(x*25+y*8)
    sc.material('clear');hfield(sc,CX-r,CY-r,CX+r,CY+r,top,lambda x,y:col(*disk((x-(CX-r))/(2*r),(y-(CY-r))/(2*r))),n=(32,32),shape=disk);sc.material(None)
TONE5=True
