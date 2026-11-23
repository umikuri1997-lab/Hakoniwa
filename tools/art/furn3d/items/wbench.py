# 作業台（wbench）：依頼のあいだだけ、依頼ボードのそばに出る台。運んだ素材は、ゲームが天板の上に積んで描く。
# 設計図：脚4本（0.10角、地面にたてる）→ 下の貫（左右・前後、脚にほぞでとめる）→ 下の棚板（左右の貫にのせる）
#   → 上の幕板（脚のあいだ）→ 天板（よこにのびる板3まい、脚と幕板の上）→ 万力（天板の左手前の下に、あご板と鉄のねじ）。
from blueprint import Part as P
from common import *
ID='wbench';BOTTOM=64;GRAD=True
VIEWS=[('wbench',0),('wbench>1',1),('wbench>2',2)]   # 前・右・後ろ（左は右の反転）
X0,X1,Y0,Y1=0.0,1.0,0.0,0.56;H=0.32;TT=0.08;LG=0.10;IN=0.05;AP=0.06;LZ=0.06;LT=0.05   # 天板の高さ0.32：せいれいの手（もの作りの動き）がとどく高さ   # はば1.0（マスのはばぴったり）。うしろの面はマスのうしろのふち（壁にそう。持ち主がきめた）
def PARTS():
    L=[];xs=(X0+IN,X1-IN-LG);ys=(Y0+IN,Y1-IN-LG)
    for nx,x in zip('左右',xs):
        for ny,y in zip(('うしろ','前'),ys):L.append(P('脚（%s%s）'%(nx,ny),'box',(x,y,0,x+LG,y+LG,H-TT),WOOD,bevel=0,note='地面にたてる'))
    for nx,x in zip('左右',xs):L.append(P('下の貫（%s）'%nx,'box',(x+0.02,ys[0]+LG,LZ,x+LG-0.02,ys[1],LZ+LT),WOOD,on=('脚（%sうしろ）'%nx,'脚（%s前）'%nx),bevel=0,note='脚にほぞでとめる'))
    # 下の棚板：左右の貫にのせる板2まい（前後にならべる。すきま0.02）
    w=(ys[1]-ys[0]-LG-0.02)/2
    for k,nm in enumerate(('うしろ','前')):
        y=ys[0]+LG+k*(w+0.02)
        L.append(P('棚板（%s）'%nm,'box',(xs[0]+0.02,y,LZ+LT,xs[1]+LG-0.02,y+w,LZ+LT+0.03),WOOD,on=('下の貫（左）','下の貫（右）'),bevel=0,note='貫の上にのせる'))
    L.append(P('幕板（前）','box',(xs[0]+LG,ys[1]+0.02,H-TT-AP,xs[1],ys[1]+LG-0.02,H-TT),WOOD,on=('脚（左前）','脚（右前）'),bevel=0,note='脚のあいだ'))
    L.append(P('幕板（うしろ）','box',(xs[0]+LG,ys[0]+0.02,H-TT-AP,xs[1],ys[0]+LG-0.02,H-TT),WOOD,on=('脚（左うしろ）','脚（右うしろ）'),bevel=0,note='脚のあいだ'))
    for nx,x in zip('左右',xs):L.append(P('幕板（%s）'%nx,'box',(x+0.02,ys[0]+LG,H-TT-AP,x+LG-0.02,ys[1],H-TT),WOOD,on=('脚（%sうしろ）'%nx,'脚（%s前）'%nx),bevel=0,note='脚のあいだ'))
    # 天板：よこにのびる板3まい（同じはば、すきま0.006）
    n=3;g=0.006;pw=(Y1-Y0-g*(n-1))/n
    for k in range(n):
        y=Y0+k*(pw+g);L.append(P('天板%d'%(k+1),'box',(X0,y,H-TT,X1,y+pw,H),WOOD,on=('幕板（左）','幕板（右）'),bevel=0,note='幕板と脚の上にのせて、くぎでとめる'))
    # 万力：天板の左手前、天板のふちの下にあご板。鉄のねじと、まわす棒
    vx0,vx1=X0+0.10,X0+0.34
    L.append(P('万力のあご板','box',(vx0,Y1+0.002,H-TT-0.06,vx1,Y1+0.05,H-0.004),WOOD,on=('天板3',),bevel=0,note='天板の手前のふちにそわせる'))
    cx=(vx0+vx1)/2
    L.append(P('万力のねじ','box',(cx-0.015,Y1+0.05,H-TT-0.045,cx+0.015,Y1+0.10,H-TT-0.015),METAL,on=('万力のあご板',),bevel=0,note='あご板をつらぬく'))
    L.append(P('万力の棒','box',(cx-0.07,Y1+0.085,H-TT-0.04,cx+0.07,Y1+0.105,H-TT-0.02),METAL,on=('万力のねじ',),bevel=0,note='ねじのはしにさす'))
    return L

TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
