# 石じゅん（cave:stalag#0）：洞窟の床から、上へのびた石。太い1本と、そばに細い1本。
# 設計図（単位はマス）：どちらも、ろくろの形（下が太く、だんだん細く、先はまるい）。地面から生える。
from blueprint import Part as P
from common import *
ID='cave_stalag0';GRAD=True;BOTTOM=60
VIEWS=[('cave:stalag#0',0)]
STONE=(160,144,128)
def PARTS():
    a=P('石じゅん','lathe',(0.50,0.56,[(0.0,0.0),(0.2,0.0),(0.17,0.08),(0.13,0.2),(0.115,0.3),(0.085,0.45),(0.075,0.52),(0.05,0.68),(0.025,0.84),(0.0,0.92)]),STONE,detail=20,note='地面から生える');a.tex=False;a.curve=True
    b=P('小さい石じゅん','lathe',(0.76,0.70,[(0.0,0.0),(0.11,0.0),(0.085,0.1),(0.06,0.22),(0.03,0.36),(0.0,0.44)]),STONE,detail=16,note='地面から生える');b.tex=False;b.curve=True
    return [a,b]
TONE5=True
