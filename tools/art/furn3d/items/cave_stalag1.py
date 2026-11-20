# 石じゅん（cave:stalag#1）：洞窟の床から、上へのびた石。太い1本と、そばに細い1本。
# 設計図（単位はマス）：どちらも、ろくろの形（下が太く、だんだん細く、先はまるい）。地面から生える。
from blueprint import Part as P
from common import *
ID='cave_stalag1';GRAD=True;BOTTOM=60
VIEWS=[('cave:stalag#1',0)]
STONE=(160,144,128)
def PARTS():
    a=P('石じゅん','lathe',(0.50,0.56,[(0.0,0.0),(0.24,0.0),(0.2,0.06),(0.16,0.16),(0.14,0.24),(0.1,0.36),(0.08,0.44),(0.04,0.58),(0.0,0.66)]),STONE,detail=20,note='地面から生える');a.tex=False;a.curve=True
    b=P('小さい石じゅん','lathe',(0.24,0.70,[(0.0,0.0),(0.13,0.0),(0.1,0.1),(0.07,0.26),(0.04,0.42),(0.0,0.54)]),STONE,detail=16,note='地面から生える');b.tex=False;b.curve=True
    return [a,b]
TONE5=True
