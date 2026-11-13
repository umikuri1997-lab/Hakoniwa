# いす（chair）：4本の脚・座面・うしろの脚がそのまま背もたれの柱・上の横木・たての桟3本。前・右・後ろ・左の4つの向き。
# 後ろ向きでは、すわったせいれいの手前に背もたれがくるので、背もたれだけの絵（chair>2.front）も作る。
from blueprint import Part as P
from common import *
ID='chair';BOTTOM=51
VIEWS=[('chair',0),('chair>1',1),('chair>2',2),('chair>3',3)]
X0,X1,Y0,Y1=0.24,0.76,0.38,0.80;LG=0.07;ZS=0.34;TS=0.05;ZTOP=0.76
BACK=lambda n:n.startswith('背')
FRONT={'chair>2.front':BACK}
def PARTS():
    L=[]
    for nx,x in(('左',X0),('右',X1-LG)):
        L.append(P('前の脚（%s）'%nx,'box',(x,Y1-LG,0,x+LG,Y1,ZS),WOOD2,bevel=0,note='地面にたてる'))
        L.append(P('背もたれの柱（%s）'%nx,'box',(x,Y0,0,x+LG,Y0+LG,ZTOP),WOOD2,bevel=0,note='うしろの脚が、そのまま背もたれの柱'))
    L.append(P('座面','box',(X0-0.01,Y0,ZS,X1+0.01,Y1+0.01,ZS+TS),WOOD,on=('前の脚（左）','前の脚（右）','背もたれの柱（左）','背もたれの柱（右）'),bevel=0,note='4本の脚の上'))
    L.append(P('背もたれの横木','box',(X0,Y0+0.005,ZTOP-0.12,X1,Y0+LG-0.005,ZTOP),WOOD,on=('背もたれの柱（左）','背もたれの柱（右）'),bevel=0,note='柱のあいだ'))
    n=3;w=0.05;gap=(X1-X0-2*LG-n*w)/(n+1)
    for i in range(n):
        x=X0+LG+gap*(i+1)+w*i
        L.append(P('背もたれの桟%d'%(i+1),'box',(x,Y0+0.02,ZS+TS,x+w,Y0+LG-0.02,ZTOP-0.12),WOOD2,on=('座面','背もたれの横木'),bevel=0,note='座面と横木のあいだ'))
    return L
