# いす（chair）：4本の脚・座面・うしろの脚がそのまま背もたれの柱・上の横木・たての桟2本。前・右・後ろ・左の4つの向き。
# 後ろ向きでは、すわったせいれいの手前に背もたれがくるので、背もたれだけの絵（chair>2.front）も作る。すわった子の足は、座面の下のはしでかくす（cut）。
from blueprint import Part as P
from common import *
ID='chair';BOTTOM=51
VIEWS=[('chair',0),('chair>1',1),('chair>2',2),('chair>3',3)]
X0,X1,Y0,Y1=0.17,0.83,0.20,0.83;LG=0.105;ZS=0.51;TS=0.15;ZTOP=1.14;RL=0.18   # はば0.66・おくゆき0.63・高さ1.14。座面のあつみ0.15
BACK=lambda n:n.startswith('背')
FRONT={'chair>2.front':BACK}
CUT=('chair>2',)   # 後ろ向きのいすにすわった子は、座面の下のはしより下（足）を描かない（チップに cut を書く）
def PARTS():
    L=[]
    for nx,x in(('左',X0),('右',X1-LG)):
        L.append(P('前の脚（%s）'%nx,'box',(x,Y1-LG,0,x+LG,Y1,ZS),WOOD,bevel=0,note='地面にたてる'))
        L.append(P('背もたれの柱（%s）'%nx,'box',(x,Y0,0,x+LG,Y0+LG,ZTOP),WOOD,bevel=0,note='うしろの脚が、そのまま背もたれの柱'))
    BV=0.033;o=rrect(X0,Y0,X1,Y1+0.015,0.09,True);i_=rrect(X0+BV,Y0,X1-BV,Y1+0.015-BV,0.07,True)   # 柱のそとがわにそろえる。うしろの角は柱があるので丸めない（前の角だけ）
    L.append(P('座面','loft',[(o,ZS),(o,ZS+TS-BV*0.7),(i_,ZS+TS)],WOOD,on=('前の脚（左）','前の脚（右）','背もたれの柱（左）','背もたれの柱（右）'),note='4本の脚の上。角を丸め、上のふちをななめにけずる'))
    L.append(P('背もたれの横木','box',(X0,Y0+0.0075,ZTOP-RL,X1,Y0+LG-0.0075,ZTOP),WOOD,on=('背もたれの柱（左）','背もたれの柱（右）'),bevel=0,note='柱のあいだ'))
    n=2;w=0.0675;gap=(X1-X0-2*LG-n*w)/(n+1)
    for i in range(n):
        x=X0+LG+gap*(i+1)+w*i
        L.append(P('背もたれの桟%d'%(i+1),'box',(x,Y0+0.03,ZS+TS,x+w,Y0+LG-0.03,ZTOP-RL),WOOD,on=('座面','背もたれの横木'),bevel=0,note='座面と横木のあいだ'))
    return L
