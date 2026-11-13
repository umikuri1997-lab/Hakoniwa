# まき棚（makidana）：4本の柱と2だんの棚に、まきをつむ棚。前・右・左の3つの向き（右は makidana>1、左はその反転）。
# 設計図（じっさいに作れる組み方。単位はマス）
#   柱4本：0.06角・高さ0.80。地面にたてる。
#   棚2だん：どれも同じ作り。前とうしろの横木（0.05×0.04）を柱のあいだにわたし、その上に すのこ板（はば0.86・おく0.32・あつさ0.025）をのせる（高さ0.06・0.42）。
#   まき：まるい丸太を、おく向きにねかせてつむ（1だんに下5本・上4本。どれも同じ太さ0.15・長さ0.33）。
from blueprint import Part as P
from common import *
ID='makidana';BOTTOM=34
VIEWS=[('makidana',0),('makidana>1',1)]
X0,X1,Y0,Y1=0.04,0.96,0.58,0.92;PS=0.06;H=0.80;ZS=(0.06,0.42);BT=0.025
def PARTS():
    L=[]
    for nx,x in(('左',X0),('右',X1-PS)):
        for ny,y in(('うしろ',Y0),('前',Y1-PS)):L.append(P('柱（%s%s）'%(nx,ny),'box',(x,y,0,x+PS,y+PS,H),WOOD,bevel=0,note='地面にたてる'))
    for i,z in enumerate(ZS):
        n='%dだん'%(i+1)
        for ny,y in(('うしろ',Y0),('前',Y1-0.04)):L.append(P('横木（%s・%s）'%(n,ny),'box',(X0+PS,y,z-BT-0.05,X1-PS,y+0.04,z-BT),WOOD,on=('柱（左%s）'%ny,'柱（右%s）'%ny),bevel=0,note='柱のあいだにわたす'))
        L.append(P('すのこ板（%s）'%n,'box',(X0+PS,Y0,z-BT,X1-PS,Y1,z),WOOD,on=('横木（%s・前）'%n,'横木（%s・うしろ）'%n),bevel=0,note='横木の上'))
        R=0.075;xs=[X0+PS+R+0.004+k*(2*R+0.012) for k in range(5)]
        for k,x in enumerate(xs):L.append(P('まき（%s下%d）'%(n,k+1),'logy',(x,Y0+0.02,Y1-0.01,z+R,R),LOG,on=('すのこ板（%s）'%n,),grp='まき%s下%d'%(n,k)))
        for k in range(4):x=(xs[k]+xs[k+1])/2;L.append(P('まき（%s上%d）'%(n,k+1),'logy',(x,Y0+0.03,Y1-0.02,z+R+R*1.72,R),LOG,on=('まき（%s下%d）'%(n,k+1),),grp='まき%s上%d'%(n,k)))
    return L
