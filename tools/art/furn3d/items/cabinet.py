# キャビネット（cabinet）：とびら2まいの低い棚。前・右・左の3つの向き（右は cabinet>1、左はその反転）。
# 設計図（じっさいに作れる組み方。単位はマス）
#   足4本：0.08角・高さ0.06。地面にたてる。
#   底板：はば0.84・おく0.44・あつさ0.03。足の上にのせる。
#   側板2まい：あつさ0.04・おく0.46。底板の左右のはしに、底板をはさんでたてる（地面から0.06の高さから天板の下まで）。
#   背板：あつさ0.02。側板のあいだ・底板のうしろにはめる。
#   天板：0.94×0.50・あつさ0.04。側板と背板の上にのせ、前と左右へ0.02ずつ出す。
#   中の棚板：側板のあいだにわたす（とびらの中。外からは見えない）。
#   とびら2まい：同じ大きさ。わく（たて框・横框 0.05）と、少しひっこんだ鏡板。側板の前のはしに、ちょうつがいでとめる。とってはまるい木のつまみ。
from blueprint import Part as P
from common import *
ID='cabinet';BOTTOM=39
VIEWS=[('cabinet',0),('cabinet>1',1)]
X0,X1,Y0,Y1=0.05,0.95,0.44,0.90;FT=0.06;SD=0.04;TT=0.04;H=0.68;FR=0.05;DT=0.025
def PARTS():
    L=[]
    for nx,x in(('左',X0+0.03),('右',X1-0.11)):
        for ny,y in(('うしろ',Y0+0.03),('前',Y1-0.11)):L.append(P('足（%s%s）'%(nx,ny),'box',(x,y,0,x+0.08,y+0.08,FT),WOOD,bevel=0,note='地面にたてる'))
    L.append(P('底板','box',(X0+SD,Y0,FT,X1-SD,Y1-DT,FT+0.03),WOOD,on=('足（左前）','足（右うしろ）'),bevel=0,note='足の上'))
    for nx,x in(('左',X0),('右',X1-SD)):L.append(P('側板（%s）'%nx,'box',(x,Y0,FT,x+SD,Y1,H-TT),WOOD,on=('足（%s前）'%nx,'足（%sうしろ）'%nx),bevel=0,note='底板をはさむ'))
    L.append(P('背板','box',(X0+SD,Y0,FT+0.03,X1-SD,Y0+0.02,H-TT),WOOD,on=('底板',),bevel=0,note='側板のあいだ'))
    L.append(P('中の棚板','box',(X0+SD,Y0+0.02,0.36,X1-SD,Y1-DT-0.01,0.385),WOOD,on=('側板（左）','側板（右）'),bevel=0,note='側板にわたす'))
    L.append(P('天板','box',(X0-0.02,Y0-0.01,H-TT,X1+0.02,Y1+0.02,H),WOOD,on=('側板（左）','側板（右）','背板'),bevel=0,note='側板・背板の上'))
    W=(X1-X0-2*SD-0.006)/2;z0,z1=FT+0.005,H-TT-0.005;yd=Y1-DT
    for i,nd in enumerate(('左','右')):
        x0=X0+SD+i*(W+0.006);x1=x0+W;g='とびら'+nd;hx,ax_=(x0,x1-FR) if i==0 else (x1-FR,x0);hn='とびら（%s）たて框（ちょうつがい）'%nd;on=(hn,)
        L.append(P(hn,'box',(hx,yd,z0,hx+FR,Y1,z1),WOOD,on=('側板（%s）'%nd,),bevel=0,grp=g,note='ちょうつがいで側板の前のはしにとめる'))
        L.append(P('とびら（%s）たて框（あわせ）'%nd,'box',(ax_,yd,z0,ax_+FR,Y1,z1),WOOD,on=('とびら（%s）横框（上）'%nd,'とびら（%s）横框（下）'%nd),bevel=0,grp=g,note='横框でつなぐ'))
        L.append(P('とびら（%s）横框（上）'%nd,'box',(x0+FR,yd,z1-FR,x1-FR,Y1,z1),WOOD,on=on,bevel=0,grp=g,note='たて框のあいだ'))
        L.append(P('とびら（%s）横框（下）'%nd,'box',(x0+FR,yd,z0,x1-FR,Y1,z0+FR),WOOD,on=on,bevel=0,grp=g,note='たて框のあいだ'))
        L.append(P('とびら（%s）鏡板'%nd,'box',(x0+FR,yd,z0+FR,x1-FR,Y1-0.012,z1-FR),WOOD,on=('とびら（%s）横框（下）'%nd,),bevel=0,note='わくのみぞにはめる。わくより少しひっこめる'))
        L.append(P('とびら（%s）つまみ'%nd,'ball',(ax_+FR/2,Y1+0.012,(z0+z1)/2,0.022),WOOD,on=('とびら（%s）たて框（あわせ）'%nd,),note='まるい木のつまみ'))
    return L
