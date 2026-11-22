# かざぐるまの花壇（kazakadan、風）：アカシアの小さな花壇に、たんぽぽと、風の羽でつくったかざぐるまを3本。
# 設計図（じっさいに作れる組み方。単位はマス）
#   わく：アカシアの板のわく（x 0.12〜0.88・y 0.36〜0.86・高さ0〜0.24、板のあつさ0.04）。中は土（高さ0.20）。
#   花：たんぽぽの黄色い花（半径0.05）を4こ、葉（だ円）を土の上に。
#   かざぐるま：細い棒（半径0.014、高さ0.20〜0.70・0.84・0.62）のさきに、羽4まい（はば0.13の三角の板、白・水色・うすいピンク）。正面を向く。まん中に木のくぎ。
from blueprint import Part as P
from common import *
import math
ID='kazakadan';BOTTOM=58;GRAD=True
VIEWS=[('kazakadan',0)]
ACAC=(222,170,108);SOIL=(170,128,96);YEL=(250,214,90);LEAF=(156,200,120);STICK=(214,170,116)
WINGS=[(252,250,244),(184,218,240),(246,196,200)]
MILLS=[(0.30,0.62,0.70),(0.52,0.66,0.86),(0.72,0.60,0.64)]
def PARTS():
    L=[]
    for nm,b in(('おくの板',(0.12,0.36,0,0.88,0.40,0.24)),('手前の板',(0.12,0.82,0,0.88,0.86,0.24)),('左の板',(0.12,0.40,0,0.16,0.82,0.24)),('右の板',(0.84,0.40,0,0.88,0.82,0.24))):L.append(P(nm,'box',b,ACAC,note='板を組む'))
    L.append(notex(P('土','box',(0.16,0.40,0,0.84,0.82,0.20),SOIL,on=(),note='わくの中')))
    for k,(x,y) in enumerate(((0.24,0.76),(0.44,0.74),(0.66,0.76),(0.78,0.70))):
        L.append(notex(P('葉%d'%k,'egg',(x,y,0.21,0.06,0.03,0.015,30*k),LEAF,on=('土',))))
        L.append(notex(P('花%d'%k,'ball',(x,y-0.01,0.25,0.045),YEL,on=('葉%d'%k,))))
    for k,(x,y,h) in enumerate(MILLS):
        L.append(P('棒%d'%k,'cyl',(x,y,0.014,0.20,h),STICK,detail=8,on=('土',),note='土にさす'))
        for q in range(4):
            a=math.radians(45+90*q);a2=a+math.radians(70)
            pts=[(x,h),(x+0.13*math.cos(a),h+0.13*math.sin(a)),(x+0.08*math.cos(a2),h+0.08*math.sin(a2))]
            L.append(notex(P('羽%d_%d'%(k,q),'prism',(pts,y+0.012,y+0.02),WINGS[(k+q)%3],on=('棒%d'%k,),note='風の羽を三角に切って、棒のさきにとめる')))
        L.append(P('くぎ%d'%k,'ball',(x,y+0.024,h,0.018),STICK,on=('棒%d'%k,)))
    return L
TONE5=True
