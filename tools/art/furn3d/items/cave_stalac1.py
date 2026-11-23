# つらら石（cave:stalac#1）：洞窟の天井から、下へたれた石。2本。岩の正面の上のふちに、かさねる。
# 設計図（単位はマス）：どちらも、ろくろの形（上が太く、下へ細く）。岩のかべのマスの手前の面（y=1.0、半分かべにうまる）の上のはし（高さ1.0＝かべの1だん）からたれる（クォータービュー）。
from blueprint import Part as P
from common import *
ID='cave_stalac1';TONE5=True;DITHER=0;BOTTOM=40;PARALLEL=True;ELEV=6
VIEWS=[('cave:stalac#1',0)]
STONE=(138,123,110)
def PARTS():
    a=P('つらら石','lathe',(0.52,1.0,[(0.0,0.52),(0.035,0.64),(0.06,0.78),(0.09,0.92),(0.12,1.00),(0.0,1.00)]),STONE,detail=18,on=(),note='天井からたれる');a.tex=False
    b=P('小さいつらら石','lathe',(0.3,1.0,[(0.0,0.44),(0.025,0.58),(0.045,0.74),(0.07,0.90),(0.095,1.00),(0.0,1.00)]),STONE,detail=14,on=(),note='天井からたれる');b.tex=False
    return [a,b]
TONE5=True
