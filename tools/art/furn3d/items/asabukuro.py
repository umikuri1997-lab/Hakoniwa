# あさぶくろ（asabukuro）：いまの絵と同じデザイン・同じ大きさ。口をひもでしばった、あさのふくろ2つ（うしろに大きい1つ、右手前にもう1つ）。
# 設計図：ふくろは、トリポで作ったモデル（models/tripo/sack.glb）を2つ、大きさ・向きをかえて地面に置く（うしろの大きいふくろ：高さ0.70・20度まわす。右手前の小さいふくろ：高さ0.54・−25度まわし、6度かたむける）。色は、ふくろをあさの色（SACKW）、ひも（モデルの暗い所）を茶色（TIE）に。
TIE=(196,124,64);SACKW=(240,206,162)   # ひもの色・ふくろの色（いまの絵に合わせた、あたたかいあさの色）
from blueprint import Part as P
from common import *
ID='asabukuro';BOTTOM=44
VIEWS=[('asabukuro',0)]
def PARTS():
    L=[]
    for nm,cx,cy,h,rot,tilt in(('大きいふくろ',0.33,0.52,0.70,20,0),('小さいふくろ',0.70,0.74,0.54,-25,6)):
        p=P(nm,'model',('tripo/sack.glb',cx,cy,0,h,rot,tilt),on=('ground',),note='地面に置く');p.recol2=(0.965,TIE,SACKW);p.recolk=0.3;L.append(notex(p))
    return L
