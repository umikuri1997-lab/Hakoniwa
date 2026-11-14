# ブリキのじょうろ（joro）：いまの絵と同じデザイン・同じ大きさ。空き缶でつくった、ブリキのまるい缶のじょうろ。上に取っ手、右に注ぎ口とはす口。中に土を入れて、芽が出ている。ところどころ、さび。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（56×54ドット）に合わせた）
#   缶：ブリキのまるい缶（半径0.20・板のあつさ0.008・高さ0〜0.42、そこつき）。上のふちは、まきこんだ輪（半径0.20〜0.212・高さ0.40〜0.425）。缶のまん中に、たがの線（高さ0.20〜0.215）。
#   取っ手：ブリキの帯をまげた輪（太さ0.022）。缶の左のふちから、まん中の上を通って、右のふちへ（いちばん上は高さ0.715）。両はしは、ふちにはんだづけ。
#   注ぎ口：ブリキの細い管（太さ0.03）。缶の右の下（高さ0.08）から、右上へ（はしは高さ0.36）。缶にはんだづけ。
#   はす口：注ぎ口のさきに、ひらいた円すい台（半径0.03 → 0.095、長さ0.06）。前の面に小さな穴のもよう。
#   土：缶の中、上のふちの0.04下（高さ0.38）に、こげ茶の土。
#   芽：土のまん中から、くき（高さ0.38〜0.47）と、さきのとがった葉5まい（長さ0.15〜0.19・はば0.10）。外へななめ上にひらく。
#   色：ブリキは、白っぽい明るい灰色（金属のつや）。さびは、だいだい茶色のしみ（もよう）。
from blueprint import Part as P
from common import *
import math
ID='joro';GRAD=True;BOTTOM=35
VIEWS=[('joro',0)]
CX,CY=0.40,0.56;R=0.20;TIN=(226,228,232);RUST=(206,128,80);SOIL=(130,96,72);LEAF=(116,176,84);LEAF2=(150,202,100)
def MT(p):p.metal=True;return p
def rust(x,y,z):   # さびのしみ：場所で決まる、ところどころのまるいしみ
    v=math.sin(x*19+z*13+1.3)*math.sin(y*17-z*11+0.4)+0.45*math.sin(x*31-y*23+z*29)
    return RUST if v>0.78 else None
def PARTS():
    c=MT(P('缶','ring',(CX,CY,R-0.008,R,0.0,0.42),TIN,detail=28,note='地面におく。ブリキの板をまるめた筒（上はあいている）'));c.decal=rust;L=[c]
    L.append(MT(P('缶のそこ','cyl',(CX,CY,R-0.008,0.0,0.01),TIN,detail=28,on=('缶',),note='筒の下にはんだづけ')))
    L.append(MT(P('ふち','ring',(CX,CY,R-0.004,R+0.012,0.40,0.425),TIN,detail=28,on=('缶',),note='上のふち。まきこんだ輪')))
    L.append(MT(P('たが','ring',(CX,CY,R-0.004,R+0.006,0.20,0.215),TIN,detail=28,on=('缶',),note='缶のまん中の線')))
    A0=(CX-R*0.97,CY,0.415);A1=(CX+R*0.97,CY,0.415)   # 取っ手：左のふちから、まん中の上を通って、右のふちへ
    arc=[(A0[0]+(A1[0]-A0[0])*t,A0[1]+(A1[1]-A0[1])*t,0.415+0.30*math.sin(math.pi*t)) for t in [i/12 for i in range(13)]]
    h=MT(P('取っ手','tube',(arc,0.022),TIN,on=('ふち',),note='ふちの左と右に、はんだづけ'));h.decal=rust;L.append(h)
    a=(CX+R-0.02,CY+0.02,0.08);b=(CX+R+0.20,CY+0.02,0.36)
    s=MT(P('注ぎ口','tube',([a,b],0.03),TIN,on=('缶',),note='缶の右の下にはんだづけ'));s.decal=rust;L.append(s)
    d=[b[k]-a[k] for k in range(3)];n=math.sqrt(sum(q*q for q in d));d=[q/n for q in d];e=[b[k]+0.06*d[k] for k in range(3)]
    def holes(x,y,z):   # はす口の前の面の穴
        if (x-e[0])*d[0]+(z-e[2])*d[2]>-0.006 and int(round(y*90))%2==0 and int(round(z*90))%2==0:return (150,154,162)
        return None
    r=MT(P('はす口','frust',(b,tuple(e),0.03,0.095),TIN,on=('注ぎ口',),note='注ぎ口のさき'));r.decal=holes;L.append(r)
    L.append(notex(P('土','cyl',(CX,CY,R-0.01,0.0,0.38),SOIL,detail=24,on=('缶',),note='缶の中')))
    L.append(notex(P('くき','tube',([(CX,CY,0.38),(CX+0.005,CY,0.47)],0.012),LEAF,on=('土',),note='土のまん中から')))
    return L
def EXTRA(sc):   # 芽の葉：さきのとがった葉5まい。くきのさきから、外へななめ上にひらく（まん中のすじが少しもりあがる）
    sc.smooth(True)
    for k,(ang,up,ln,col) in enumerate(((200,0.65,0.19,LEAF),(-20,0.70,0.19,LEAF2),(115,0.85,0.16,LEAF2),(285,0.80,0.17,LEAF),(60,1.05,0.15,LEAF2))):
        a=math.radians(ang);base=(CX,CY,0.47);dx,dy=math.cos(a),math.sin(a)*0.9;sc.part()
        n=7;W=0.05
        mid=[(base[0]+dx*ln*t,base[1]+dy*ln*t,base[2]+ln*t*(up-0.5*t)) for t in [i/n for i in range(n+1)]]
        wid=[W*math.sin(math.pi*min(1,t*1.15))**0.8 for t in [i/n for i in range(n+1)]]
        px,py=-dy,dx
        for i in range(n):
            for sg in(1,-1):
                p0,p1=mid[i],mid[i+1];e0=(p0[0]+sg*px*wid[i],p0[1]+sg*py*wid[i],p0[2]-0.012*wid[i]/W);e1=(p1[0]+sg*px*wid[i+1],p1[1]+sg*py*wid[i+1],p1[2]-0.012*wid[i+1]/W)
                sc.quad(p0,p1,e1,e0,col)
    sc.smooth(False)
