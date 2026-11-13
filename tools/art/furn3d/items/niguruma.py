# にぐるま（niguruma、2×1マス）：荷台・まわりの板・車輪4つ・ひく柄。あさぶくろを1つのせる（あさぶくろは、トリポで作ったモデルにかえる予定。まだチップに入れていない）。
# 設計図（じっさいに作れる組み方。単位はマス）
#   荷台のわく：左右の長い材（長さ1.50・0.06角）を、柄までのばす（そのまま柄になる、長さ1.90）。前とうしろの横木でつなぐ。
#   荷台の床板：わくの上に、同じはばの板4まいをならべる（x 0.05〜1.45）。
#   まわりの板：前・うしろ・左に、柱（0.05角・高さ0.20）と横板2本。右（柄のがわ）はあける。
#   じく2本：荷台の下、x 0.38 と 1.12 に、おく向きの丸い棒（太さ0.05）。荷台の下の受け木にとめる。
#   車輪4つ：どれも同じ（半径0.20・あつさ0.04）。わ（12本の短い材をつなぐ）・スポーク6本・まん中のこしき。じくの両はしにはめる。
#   柄のはしの横木：のばした2本の長い材を、右のはしでつなぐ（にぎる所）。
#   あさぶくろ：荷台の上にのせる。
from blueprint import Part as P
from common import *
ID='niguruma';BOTTOM=64
VIEWS=[('niguruma',0)]
X0,X1,Y0,Y1=0.05,1.45,0.34,0.84;ZB=0.30;FW=0.06;XH=1.92;XAS=(0.38,1.12);RW=0.20
def PARTS():
    L=[]
    for ny,y in(('うしろ',Y0),('前',Y1-FW)):L.append(P('長い材（%s）'%ny,'box',(X0,y,ZB-0.06,XH,y+FW,ZB),WOOD,on=('受け木（1%s）'%ny,'受け木（2%s）'%ny),bevel=0,note='右へのばして柄にする'))
    for nx,x in(('左',X0),('右',X1-FW)):L.append(P('横木（%s）'%nx,'box',(x,Y0+FW,ZB-0.06,x+FW,Y1-FW,ZB),WOOD,on=('長い材（前）','長い材（うしろ）'),bevel=0,note='長い材のあいだ'))
    NB=4;w=(X1-X0-0.006*(NB-1))/NB
    for i in range(NB):x=X0+i*(w+0.006);L.append(P('床板%d'%(i+1),'box',(x,Y0,ZB,x+w,Y1,ZB+0.03),WOOD,on=('長い材（前）','長い材（うしろ）'),bevel=0,note='わくの上にならべる'))
    ZT=ZB+0.03
    for ny,y in(('うしろ',Y0),('前',Y1-0.05)):
        for k,x in enumerate((X0,(X0+X1)/2-0.025,X1-0.05)):L.append(P('柱（%s%d）'%(ny,k+1),'box',(x,y,ZT,x+0.05,y+0.05,ZT+0.20),WOOD,on=('床板1','床板2','床板3','床板4'),bevel=0,note='床板にたてる'))
        for z in(ZT+0.06,ZT+0.15):L.append(P('横板（%s・%.2f）'%(ny,z),'box',(X0,y+0.005,z,X1,y+0.045,z+0.05),WOOD,on=('柱（%s1）'%ny,'柱（%s3）'%ny),bevel=0,note='柱にくぎでとめる'))
    for z in(ZT+0.06,ZT+0.15):L.append(P('横板（左・%.2f）'%z,'box',(X0+0.005,Y0+0.05,z,X0+0.045,Y1-0.05,z+0.05),WOOD,on=('柱（うしろ1）','柱（前1）'),bevel=0,note='柱にくぎでとめる'))
    import math
    for a,XA in enumerate(XAS):
        n='%d'%(a+1)
        for ny,y in(('うしろ',Y0),('前',Y1-FW)):L.append(P('受け木（%s%s）'%(n,ny),'box',(XA-0.05,y,RW-0.03,XA+0.05,y+FW,ZB-0.06),WOOD,on=('じく%s'%n,),bevel=0,note='じくを長い材にとめる'))
        L.append(P('じく%s'%n,'wheel',(XA,(Y0+Y1)/2,RW,0.025,Y1-Y0+0.14),WOOD,on=('受け木（%sうしろ）'%n,'受け木（%s前）'%n),note='受け木にとめる。車輪のあいだ'))
        for ny,y in(('うしろ',Y0-0.06),('前',Y1+0.06)):
            k='%s%s'%(n,ny);hub='こしき（%s）'%k
            L.append(P(hub,'wheel',(XA,y,RW,0.05,0.05),WOOD,on=('じく%s'%n,),note='じくのはしにはめる。車輪のまん中',grp='車輪'+k))
            pts=[(XA+RW*math.cos(2*math.pi*q/12),RW+RW*math.sin(2*math.pi*q/12)) for q in range(13)]
            for q in range(12):L.append(P('わ（%s）'%k if q==0 else 'わ（%s・%d）'%(k,q),'beam',((pts[q][0],y,pts[q][1]),(pts[q+1][0],y,pts[q+1][1]),0.025),WOOD,on=tuple('スポーク（%s・%d）'%(k,r) for r in range(6)),note='車輪のわ。スポークのはしにとめる',grp='車輪'+k))
            for q in range(6):t=2*math.pi*(q+0.5)/6;L.append(P('スポーク（%s・%d）'%(k,q),'beam',((XA+0.04*math.cos(t),y,RW+0.04*math.sin(t)),(XA+(RW-0.02)*math.cos(t),y,RW+(RW-0.02)*math.sin(t)),0.012),WOOD,on=(hub,),note='こしきからわへ',grp='車輪'+k))
    L.append(P('柄のはしの横木','box',(XH-0.06,Y0+FW,ZB-0.06,XH,Y1-FW,ZB),WOOD,on=('長い材（前）','長い材（うしろ）'),bevel=0,note='柄の右のはしをつなぐ'))
    p=P('あさぶくろ','ball',(0.36,(Y0+Y1)/2,ZT+0.16,0.17),SACK,on=('床板1','床板2'),note='荷台にのせる');L.append(notex(p))
    L.append(notex(P('あさぶくろの口','ball',(0.36,(Y0+Y1)/2,ZT+0.34,0.06),SACK,on=('あさぶくろ',),note='しばった口')))
    return L
