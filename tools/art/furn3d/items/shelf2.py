# かざり棚（shelf2）：4本の柱と4まいの棚板だけの、うしろのない棚。小物（つぼ・はち植え・本）をかざる。前・右・左の3つの向き（右は shelf2>1、左はその反転）。
# 設計図（じっさいに作れる組み方。単位はマス）
#   柱4本：0.05角・高さ1.34（上の棚板より0.04上へ出す）。地面にたてる。
#   棚板4まい：どれも同じ大きさ（はば0.76・おく0.28・あつさ0.03）。柱のあいだに入れ、左右の柱にほぞでとめる（高さ0.07・0.50・0.93・1.30。あいだは0.43）。
#   小物：CC0の3Dモデルを、いまの絵（お手本）と同じならびで置く（棚板のあいだ0.40より低い物）：
#     いちばん上：クリーム色のつぼ・はち植え／3だんめ：はち植え・青いまるいつぼ／2だんめ：なし／いちばん下：クリーム色のつぼ・ねかせてつんだ本2さつ（表紙0.22×0.16・あつさ0.045）
from blueprint import Part as P
from common import *
ID='shelf2';BOTTOM=42
VIEWS=[('shelf2',0),('shelf2>1',1)]
X0,X1,Y0,Y1=0.07,0.93,0.64,0.92;PS=0.05;H=1.34;BT=0.03;ZS=(0.07,0.50,0.93,1.30)
K='kenney/';Q='quaternius/'
def M(nm,path,cx,cy,z0,size,on,rot=0,recol=None):
    p=P(nm,'model',(path,cx,cy,z0,size,rot,0),on=(on,),deco=True);p.recol=recol;return p
CREAM=(236,224,200);BLUE=(122,150,204)
def PARTS():
    L=[]
    for nx,x in(('左',X0),('右',X1-PS)):
        for ny,y in(('うしろ',Y0),('前',Y1-PS)):L.append(P('柱（%s%s）'%(nx,ny),'box',(x,y,0,x+PS,y+PS,H),WOOD,bevel=0,note='地面にたてる'))
    for i,z in enumerate(ZS):L.append(P('棚板%d'%(i+1),'box',(X0+PS,Y0+0.0,z-BT,X1-PS,Y1,z),WOOD,on=('柱（左前）','柱（右前）'),bevel=0,note='左右の柱にほぞでとめる'))
    cy=(Y0+Y1)/2
    L+= [M('つぼ（1だん）',K+'nature/pot_small.glb',0.30,cy,ZS[0],0.15,'棚板1',recol=CREAM),
         M('はち植え（3だん）',Q+'Houseplant_7.obj',0.30,cy,ZS[2],0.30,'棚板3'),M('まるいつぼ（3だん）',K+'nature/pot_small.glb',0.68,cy,ZS[2],0.17,'棚板3',recol=BLUE),
         M('つぼ（上）',K+'nature/pot_small.glb',0.30,cy,ZS[3],0.18,'棚板4',recol=CREAM),M('はち植え（上）',Q+'Houseplant_5.obj',0.66,cy,ZS[3],0.30,'棚板4')]
    for k,(x0,col) in enumerate(((0.55,BOOKS[3]),(0.57,BOOKS[2]))):   # ねかせてつんだ本2さつ：表紙（上下）と中の紙。2さつめは少しずらす
        z=ZS[0]+k*0.045;g='本%d'%k;on=('棚板1',) if k==0 else ('本0（上の表紙）',);nm='本%d'%k
        L.append(notex(P(nm+'（下の表紙）','box',(x0,cy-0.08,z,x0+0.22,cy+0.08,z+0.008),col,on=on,bevel=0,grp=g)))
        L.append(notex(P(nm+'（中の紙）','box',(x0+0.004,cy-0.076,z+0.008,x0+0.212,cy+0.076,z+0.037),PAGE,on=(nm+'（下の表紙）',),bevel=0,grp=g)))
        L.append(notex(P(nm+'（上の表紙）','box',(x0,cy-0.08,z+0.037,x0+0.22,cy+0.08,z+0.045),col,on=(nm+'（中の紙）',),bevel=0,grp=g)))
        L.append(notex(P(nm+'（背）','box',(x0,cy-0.08,z,x0+0.012,cy+0.08,z+0.045),col,on=(nm+'（下の表紙）',),bevel=0,grp=g)))
    return L
