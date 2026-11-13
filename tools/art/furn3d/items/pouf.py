# まるクッション（pouf）：いまの絵と同じデザイン・同じ大きさ。布でつつんだ、まるい低いクッション。上の面に、まん中から8本のぬい目（へこみ）。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（45×37ドット）に合わせた）
#   クッション：上から見てまるい（半径0.34）。高さ0.15。まわりの面はほぼたてで、ふちはまるく、上はなだらか。地面におく。
#   ぬい目：まん中から外へ8本。ぬい目とぬい目のあいだの8つの布が、それぞれふくらむ（ぬい目の所は0.025ひくい）。まん中は、ぬい目があつまって0.03へこむ。
from blueprint import Part as P
from common import *
import math
ID='pouf';BOTTOM=53
VIEWS=[('pouf',0)]
CX,CY=0.50,0.60;R=0.34;H=0.15;POUF=(232,236,212)   # 布の色（いまの絵に合わせた、うすい緑がかったクリーム色）
def PARTS():return []
def disk(u,v):
    U,V=2*u-1,2*v-1;return (CX+R*U*math.sqrt(max(0,1-V*V/2)),CY+R*V*math.sqrt(max(0,1-U*U/2)))
def EXTRA(sc):
    def top(x,y):
        dx,dy=x-CX,y-CY;r=min(1.0,math.hypot(dx,dy)/R);a=math.atan2(dy,dx)
        side=max(0.0,1-r**10)**0.3   # まわりは、ふっくらまるく
        puff=abs(math.sin(4*a))**0.6   # 8つの布のふくらみ（ぬい目で0）
        mid=0.03*max(0.0,1-r/0.14)
        return 0.02+(H-0.02-0.025)*side+0.025*side*puff*min(1,r*4)-mid if r<1 else 0.02
    f=lambda x,y:top(*disk((x-(CX-R))/(2*R),(y-(CY-R))/(2*R)))
    sc.material('soft1');hfield(sc,CX-R,CY-R,CX+R,CY+R,f,POUF,bot=lambda x,y:0.0,n=(56,56),shape=disk);sc.material(None)
