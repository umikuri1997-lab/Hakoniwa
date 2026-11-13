# 大きな食卓（dtable、2×2マス）：食卓（table）と同じ作りで、大きい。
# 設計図（じっさいに作れる組み方。単位はマス）
#   脚4本：0.11角・高さ0.39。地面にたてる。
#   幕板4まい：高さ0.08。脚と脚のあいだに入れ、脚にとめる（前・うしろ・左・右）。
#   天板：よこ（x）にのびる板4まい。どれも同じはば（WB）・あつさ0.07・長さ1.80。板と板のあいだは GAP。
#         板の両はしは、左・右の幕板と脚の上にのせて、とめる（はば1.80の板を、左右の2か所でささえる）。そとの角だけ丸める。
import math
from blueprint import Part as P
from common import *
ID='dtable';SZ=(2,2);BOTTOM=110
VIEWS=[('dtable',0)]
X0,X1,Y0,Y1=0.10,1.90,0.28,1.80;H=0.46;TT=0.07;LG=0.11;IN=0.07;AP=0.08
def PARTS():
    L=[];xs=(X0+IN,X1-IN-LG);ys=(Y0+IN,Y1-IN-LG)
    for nx,x in zip('左右',xs):
        for ny,y in zip(('うしろ','前'),ys):L.append(P('脚（%s%s）'%(nx,ny),'box',(x,y,0,x+LG,y+LG,H-TT),WOOD,bevel=0,note='地面にたてる'))
    L.append(P('幕板（前）','box',(xs[0]+LG,ys[1]+0.02,H-TT-AP,xs[1],ys[1]+LG-0.02,H-TT),WOOD,on=('脚（左前）','脚（右前）'),bevel=0,note='脚のあいだ'))
    L.append(P('幕板（うしろ）','box',(xs[0]+LG,ys[0]+0.02,H-TT-AP,xs[1],ys[0]+LG-0.02,H-TT),WOOD,on=('脚（左うしろ）','脚（右うしろ）'),bevel=0,note='脚のあいだ'))
    for nx,x in zip('左右',xs):L.append(P('幕板（%s）'%nx,'box',(x+0.02,ys[0]+LG,H-TT-AP,x+LG-0.02,ys[1],H-TT),WOOD,on=('脚（%sうしろ）'%nx,'脚（%s前）'%nx),bevel=0,note='脚のあいだ'))
    NB=4;RC=0.09;GAP=0.008;WB=(Y1-Y0-GAP*(NB-1))/NB   # 天板：よこにのびる板4まい。どれも同じはば WB（そとの角だけ丸める。板と板のあいだは GAP）
    for i in range(NB):
        ya=Y0+i*(WB+GAP);yb=ya+WB;pts=[]
        for cx,cy,a0,rd in((X1,yb,0,i==NB-1),(X0,yb,90,i==NB-1),(X0,ya,180,i==0),(X1,ya,270,i==0)):
            if not rd:pts.append((cx,cy));continue
            ox=-RC if cx==X1 else RC;oy=-RC if cy==yb else RC
            for k in range(6):a=math.radians(a0+90*k/5);pts.append((cx+ox+RC*math.cos(a),cy+oy+RC*math.sin(a)))
        L.append(P('天板の板%d'%(i+1),'prism',(pts,H-TT,H,'z'),WOOD,on=('幕板（左）','幕板（右）'),note='両はしを、左・右の幕板の上にのせてとめる。そとの角を丸める'))
    return L
