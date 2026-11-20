# つらら石（cave:stalac#1）：洞窟の天井から、下へたれた石。2本。岩の正面の上のふちに、かさねる。
# 設計図（単位はマス）：どちらも、ろくろの形（上が太く、下へ細く）。天井（高さ0.92）からたれる。
from blueprint import Part as P
from common import *
ID='cave_stalac1';GRAD=True;BOTTOM=40;PARALLEL=True;ELEV=6
VIEWS=[('cave:stalac#1',0)]
STONE=(138,123,110)
def PARTS():
    a=P('つらら石','lathe',(0.52,0.5,[(0.0,0.44),(0.035,0.56),(0.06,0.70),(0.09,0.84),(0.12,0.92),(0.0,0.92)]),STONE,detail=18,on=(),note='天井からたれる');a.tex=False
    b=P('小さいつらら石','lathe',(0.3,0.5,[(0.0,0.36),(0.025,0.5),(0.045,0.66),(0.07,0.82),(0.095,0.92),(0.0,0.92)]),STONE,detail=14,on=(),note='天井からたれる');b.tex=False
    return [a,b]
TONE5=True
