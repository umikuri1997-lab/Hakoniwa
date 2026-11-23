# つらら石（cave:stalac#0）：洞窟の天井から、下へたれた石。2本。岩の正面の上のふちに、かさねる。
# 設計図（単位はマス）：どちらも、ろくろの形（上が太く、下へ細く）。岩のかべのマスの手前の面（y=1.0、半分かべにうまる）の上のはし（高さ1.0＝かべの1だん）からたれる（クォータービュー）。
from blueprint import Part as P
from common import *
ID='cave_stalac0';TONE5=True;DITHER=0;BOTTOM=40;PARALLEL=True;ELEV=6
VIEWS=[('cave:stalac#0',0)]
STONE=(138,123,110)
def PARTS():
    a=P('つらら石','lathe',(0.52,1.0,[(0.0,0.38),(0.03,0.50),(0.055,0.64),(0.08,0.78),(0.11,0.92),(0.14,1.00),(0.0,1.00)]),STONE,detail=18,on=(),note='天井からたれる');a.tex=False
    b=P('小さいつらら石','lathe',(0.74,1.0,[(0.0,0.64),(0.03,0.78),(0.055,0.92),(0.08,1.00),(0.0,1.00)]),STONE,detail=14,on=(),note='天井からたれる');b.tex=False
    return [a,b]
TONE5=True
