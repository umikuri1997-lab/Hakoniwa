# リース（wreath）：いまの絵と同じデザイン・同じ大きさ。枝をまるく編んだ輪に、緑の葉をさし、白い小さな花を4つ。地面に立てておく。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（45×43ドット）に合わせた）
#   輪：枝を編んだ輪（輪の半径0.20、枝の太さ0.035）。ほとんど寝かせて置く（輪の面を、たてから80.7度うしろへたおす。輪のまん中は高さ0.06）。下のはしは地面。
#   葉：輪にそって、だ円の葉（長さ0.12）を30まい。少しずつ向きをかえて、外がわと内がわへ。
#   花：白い花4つ（半径0.05、まん中に黄色）。輪の右上・右下・左・下。
from blueprint import Part as P
from common import *
import math
ID='wreath';GRAD=True;PARALLEL=True;BOTTOM=49
VIEWS=[('wreath',0)]
CX,CY,CZ,RR=0.50,0.55,0.06,0.20
SA,CA=math.sin(math.radians(80.7)),math.cos(math.radians(80.7))   # 輪の面のたての向きを、たてから80.7度うしろへたおす（ゲームの見え方で、輪がまん丸に見える角度：1.28×cos(80.7−42)=1）
def W(dx,dz,dy=0.0):return(CX+dx,CY-dz*SA+dy*CA,CZ+dz*CA+dy*SA)   # 輪の面の上の点（dx よこ・dz たて・dy 面から手前へ）
TWIG=(176,128,92);LEAF=(134,176,92);LEAF2=(160,196,106);LEAF3=(116,158,82);FLW=(250,250,244);FLC=(240,214,110)
def PARTS():
    ring=[W(RR*math.cos(2*math.pi*i/32),RR*math.sin(2*math.pi*i/32)) for i in range(33)]
    L=[notex(P('輪','tube',(ring,0.035),TWIG,on=('ground',),note='枝を編んだ輪。正面を向けて地面に立てる'))]
    for i in range(30):
        a=2*math.pi*i/30+0.13;off=0.035 if i%2 else -0.03;r=RR+off
        x,y,z=W(r*math.cos(a),r*math.sin(a),0.02*(1 if i%3 else -1))
        L.append(notex(P('葉%d'%(i+1),'egg',(x,y,z,0.06,0.04,0.035,math.degrees(a)+90+(25 if i%2 else -25)),[LEAF,LEAF2,LEAF3][i%3],on=('輪',),note='輪にさす')))
    for k,a in enumerate((40,-35,180,-95)):
        r_=math.radians(a);p=W(RR*math.cos(r_),RR*math.sin(r_),0.05);q=W(RR*math.cos(r_),RR*math.sin(r_),0.09)
        L.append(notex(P('花%d'%(k+1),'ball',(*p,0.05),FLW,on=('輪',),note='輪にさす白い花')))
        L.append(notex(P('花のまん中%d'%(k+1),'ball',(*q,0.017),FLC,on=('花%d'%(k+1),),note='花のまん中')))
    return L
