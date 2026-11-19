# 土やきの花びん（g_kabin、土のせいれいの手紙のお礼）：素焼きの土の花びん（ざらっとした土の質感）。ほそい首、ぽってりした胴、肩に白い線の帯。
#   トリポの花（ききょう・サルビア・ゆり）を3本いける。
# 設計図（単位はマス）：花びん（ろくろ：底の半径0.12・胴の半径0.2（高さ0.15）・首の半径0.07（高さ0.36）・口の半径0.09（高さ0.41））→ 花3本（口にさす、少しずつかたむける）。
from blueprint import Part as P
from common import *
from gfcommon import *
ID='g_kabin';BOTTOM=46;GRAD=True;STREAK=(0.3,0.15)
VIEWS=[('g_kabin',0)]
CX,CY=0.50,0.55;TERRA=(214,150,104);BAND=(244,232,210)
def PARTS():
    p=CL(P('花びん','lathe',(CX,CY,[(0.0,0.0),(0.12,0.0),(0.17,0.05),(0.2,0.15),(0.19,0.24),(0.13,0.31),(0.075,0.35),(0.07,0.38),(0.09,0.41),(0.06,0.41),(0.0,0.39)]),TERRA,detail=48,note='地面におく'))
    p.decal=lambda x,y,z:BAND if 0.235<z<0.26 or 0.09<z<0.105 else None;L=[p]
    for k,(m,dx,h,rot,tilt) in enumerate([('lily.glb',0.0,0.36,20,0),('bellflower.glb',-0.06,0.3,-30,-14),('salvia.glb',0.06,0.28,60,14)]):
        L.append(P('花%d'%k,'model',('tripo/'+m,CX+dx,CY,0.3,h,rot,tilt),(255,255,255),on=('花びん',),note='口にさす'))
    return L
TONE5=True;TONE3=True   # かげは3だん・あみ少し（限定の家具。持ち主がきめた）
