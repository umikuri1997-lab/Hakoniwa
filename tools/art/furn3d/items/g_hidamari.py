# ひだまりのランタン（g_hidamari、火のせいれいのお返し）：四角い木のわくのランタン。あたたかい、だいだいのガラスが光る。屋根は四角いかさ、上に取っ手。
# 設計図（単位はマス）：台（四角い板、0.36角・高さ0〜0.04）→ 柱4本（太さ0.03・高さ0.04〜0.34）→ ガラス（柱のあいだ、光る）→ 屋根（四角すいのかさ、0.42角・高さ0.34〜0.44）→ 取っ手（輪）。
from blueprint import Part as P
from common import *
import math
ID='g_hidamari';BOTTOM=46;GRAD=True
VIEWS=[('g_hidamari',0)]
CX,CY=0.50,0.58;RED=(214,112,84);GLASS=(255,176,96);GLC=(255,230,150)
def PARTS():
    h=0.18;L=[P('台','box',(CX-h,CY-h,0.0,CX+h,CY+h,0.04),RED,note='地面におく')]
    for k,(sx,sy) in enumerate([(-1,-1),(1,-1),(1,1),(-1,1)]):L.append(notex(P('柱%d'%k,'cyl',(CX+sx*(h-0.02),CY+sy*(h-0.02),0.016,0.04,0.34),RED,detail=8,on=('台',),note='台の角')))
    g=P('ガラス','box',(CX-h+0.012,CY-h+0.012,0.04,CX+h-0.012,CY+h-0.012,0.34),GLASS,on=('台',),note='柱のあいだ。中の火で光る');g.glow=True;g.tex=False
    g.decal=lambda x,y,z:GLC if math.hypot(x-CX,(z-0.13)*0.85)<0.09 else (255,206,128) if math.hypot(x-CX,(z-0.13)*0.85)<0.14 else None;L.append(g)
    L.append(notex(P('屋根','box',(CX-0.2,CY-0.2,0.34,CX+0.2,CY+0.2,0.365),RED,on=('柱0','柱2'),note='柱の上。のきの板')))
    L.append(notex(P('屋根の上','box',(CX-0.09,CY-0.09,0.365,CX+0.09,CY+0.09,0.39),RED,on=('屋根',),note='のきの板の上')))
    ring=[(CX+0.045*math.cos(math.radians(a)),CY,0.435+0.045*math.sin(math.radians(a))) for a in range(-90,271,30)]
    L.append(P('取っ手','tube',(ring,0.018),(146,140,150),on=('屋根の上',),note='屋根の上'));L[-1].metal=True
    L.append(flame('火',CX,CY+0.15,0.04,0.17,0.05,('台',),'ガラスの中'))
    return L
TONE5=True
