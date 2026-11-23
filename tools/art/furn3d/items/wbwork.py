# 作業台の上の、作っている物（wbwork）：依頼の家具を作るあいだ、作業台（wbench）の天板の上に、進みぐあいで3だんの形を出す（どの家具も同じ形）。
#   wbwork#0 板の山：材料の板。天板の上に、長い板3まいをすこしずらして重ね、その上に短い角材2本。
#   wbwork#1 木のわく：板を組んだ、ひくい四角いわく（4まいの板を角でつきあてる）と、まん中の桟1本。わきに、のこりの板1まい。
#   wbwork#2 布をかけた形：わくの上に、布をかけた形（できあがる前の、なにか分からない形）。布は、わくより少し大きく、ふちが下へたれる。
# 設計図（単位はマス。作業台の天板の上の面は高さ0.32。天板は x 0〜1・y 0〜0.56。うしろは壁にそう）
#   板：はば0.10・あつさ0.03・長さ0.50。角材：0.05角・長さ0.30。わく：外0.46×0.28・高さ0.12・板のあつさ0.03。桟：はば0.05。
#   布：わくの外へ0.03ずつ大きく、高さ0.32〜0.48（上はなだらか、角は丸い）。色はうすい水色の布。
#   板・角材・わくは、けずったばかりの明るい木の色（作業台の木と見分ける）。
from blueprint import Part as P
from common import *
ID='wbwork';BOTTOM=41;GRAD=True   # 絵の下のはし。作業台の絵では、天板の上の面が y 15〜46：見た目のまん中にのるように、手前のふちから5ドット上
VIEWS=[('wbwork#0',0,0),('wbwork#1',0,1),('wbwork#2',0,2)]
VAR=None;Z=0.32;PW=0.11;PT=0.04;CX=0.50;CY=0.28
NEW=(244,212,160)   # けずったばかりの材料の色（作業台の木より明るい。台の上で見分けられるように）
CLOTHW=(214,232,240)   # かける布（うすい水色。クリーム色だと、かげが灰色ににごった）
def board(nm,x0,y0,x1,y1,z,on=(),note='天板の上におく'):return P(nm,'box',(x0,y0,z,x1,y1,z+PT),NEW,on=on,bevel=0,note=note)
def PARTS():
    v=VAR or 0;L=[]
    if v==0:
        for k,(dx,dy) in enumerate(((0.0,0.0),(0.03,-0.06),(-0.02,0.07))):
            x0=CX-0.25+dx;y=CY+dy-PW/2
            L.append(board('板%d'%(k+1),x0,y,x0+0.50,y+PW,Z+0.002*k,note='天板の上に、すこしずらしておく'))
        zt=Z+PT+0.006
        for k,dy in enumerate((-0.04,0.04)):
            L.append(P('角材%d'%(k+1),'box',(CX-0.15+0.03*k,CY+dy-0.025,zt,CX+0.15+0.03*k,CY+dy+0.025,zt+0.05),NEW,on=('板1',),bevel=0,note='板の上にのせる'))
        return L
    x0,x1,y0,y1=CX-0.23,CX+0.23,CY-0.14,CY+0.14;h=0.12
    L.append(P('わく（おく）','box',(x0,y0,Z,x1,y0+PT,Z+h),NEW,bevel=0,note='天板の上'))
    L.append(P('わく（前）','box',(x0,y1-PT,Z,x1,y1,Z+h),NEW,bevel=0,note='天板の上'))
    L.append(P('わく（左）','box',(x0,y0+PT,Z,x0+PT,y1-PT,Z+h),NEW,on=('わく（おく）','わく（前）'),bevel=0,note='おくと前の板のあいだにつきあてる'))
    L.append(P('わく（右）','box',(x1-PT,y0+PT,Z,x1,y1-PT,Z+h),NEW,on=('わく（おく）','わく（前）'),bevel=0,note='おくと前の板のあいだにつきあてる'))
    L.append(P('桟','box',(CX-0.025,y0+PT,Z+h-PT,CX+0.025,y1-PT,Z+h),NEW,on=('わく（おく）','わく（前）'),bevel=0,note='おくと前の板にのせる'))
    if v==1:
        L.append(board('のこりの板',x1+0.04,y0+0.02,x1+0.14,y1-0.02,Z,note='天板の右におく'))
        return L
    c=P('布','loft',soft(x0-0.03,y0-0.03,x1+0.03,y1+0.03,Z,Z+h+0.02,rc=0.06,re=0.07,n=6,bottom=False,bulge=-0.015),CLOTHW,on=('わく（おく）','わく（前）'),note='わくの上にかける')
    L.append(SOFT(notex(c)))
    return L

TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
