# つらら石（cave:stalac#0）：洞窟の天井から、下へたれた石。2本。岩の正面の上のふちに、かさねる。
# 設計図（単位はマス）：どちらも、ろくろの形（上が太く、下へ細く）。天井（高さ0.92）からたれる。
from blueprint import Part as P
from common import *
ID='cave_stalac0';TONE5=True;DITHER=0;BOTTOM=40;PARALLEL=True;ELEV=6
VIEWS=[('cave:stalac#0',0)]
STONE=(138,123,110)
def PARTS():
    a=P('つらら石','lathe',(0.52,0.5,[(0.0,0.30),(0.03,0.42),(0.055,0.56),(0.08,0.70),(0.11,0.84),(0.14,0.92),(0.0,0.92)]),STONE,detail=18,on=(),note='天井からたれる');a.tex=False
    b=P('小さいつらら石','lathe',(0.74,0.5,[(0.0,0.56),(0.03,0.70),(0.055,0.84),(0.08,0.92),(0.0,0.92)]),STONE,detail=14,on=(),note='天井からたれる');b.tex=False
    return [a,b]
TONE5=True
