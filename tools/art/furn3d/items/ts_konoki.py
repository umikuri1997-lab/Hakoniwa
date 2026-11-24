# たおれたオリーブ（tskonoki、土のステージ）：地われの夜に、根ごとたおれた、コノハの家のそばのオリーブ。1マス。
# 設計図（マス。x=東・y=南・z=上。置くマスの左上が(0,0)）
#   幹と枝：オリーブ（tree~t）と同じトリポのモデル（olive.glb の幹と枝、太さ1.4倍）を、1.25の大きさにして、根もとを東（x=1.0）に、こずえを西へ、よこにねかせる（warp）。地面より下へ出る枝は、地面にそわせる。
#   葉：同じモデルの葉（まだのこっている、くすんだ緑の葉）。
#   根の板：根もとに、たてにうきあがった、土のついた根のかたまり（角ばった土のかたまり hullrock：はば0.10・おく0.26・高さ0.42、こい土の色）。そこから、まわりへ根を9本（tube、太さ0.025。根のかたまりの手前から、まわりへ0.34のばす）。
#   根の穴：根の板の東の地面に、ぬけたあとの、くぼんだ土（egg、ひくい）。
#   色：幹は、かれたオリーブと同じ皮の色（すこしこく）。根の板・穴は、ほった土の色。
import math
from blueprint import Part as P
from natcommon import nat,deep,flat,barktexdecal,post_clean,tone5,sunscreen,hullrock,widen,SUN
ID='ts_konoki';GRAD=True;SHADE4=[(10,-2),(21,-4),(33,-6)];ELEV=25;BOTTOM=60
LIGHT=SUN
VIEWS=[('tskonoki',0)]
BARKC=(160,134,110);BARK=deep(BARKC);SOIL=(150,116,82);SOILD=(120,92,66)
LEAFC=(150,170,120)
LEAF=lambda a:a[...,1].astype(int)>a[...,0].astype(int)
SOILM=lambda a:a[...,0].astype(int)<118   # 根の土（皮より、ずっとこい）
POST=lambda im:tone5(post_clean(im),BARKC,mask=lambda a:~LEAF(a)&~SOILM(a),light=sunscreen(ELEV))   # 皮だけ5色に（根の土は、そのままのこい色）
S0=1.25
def lay(V):
    x,y,z=V[:,0].copy(),V[:,1].copy(),V[:,2].copy()
    V[:,0]=1.0-z*0.78;   # 高さは、よこへねかせて、0.38にちぢめる（地面にそってねる）
    V[:,1]=0.5+(y-0.5)*0.8;V[:,2]=0.10+(x-0.5)*0.38
    V[:,2]=[max(0.02,v) for v in V[:,2]];return V
def PARTS():
    W2=lambda V:lay(widen(0.5,0.5,1.4)(V))
    t=barktexdecal(nat('幹と枝','olive.glb',S0,BARK,'bark',warp=W2),[(170,144,118),(160,134,110),(150,125,102),(138,115,94)],axis='screen')
    lf=flat(nat('葉','olive.glb',S0,LEAFC,'leaf',warp=W2))
    h=P('根の穴','egg',(1.08,0.52,0.0,0.10,0.22,0.03,0),SOILD,on=('ground',),note='ぬけたあとの土');h.tex=False
    L=[t,lf,h]
    for i in range(9):
        a=math.radians(10+i*40);y1=0.50+0.30*math.cos(a);z1=0.20+0.28*math.sin(a)
        r=P('根%d'%i,'tube',([(0.99,0.50+0.10*math.cos(a),0.22+0.12*math.sin(a)),(0.98,0.50+0.24*math.cos(a),0.22+0.24*math.sin(a)),(0.97,0.50+0.34*math.cos(a),max(0.02,0.22+0.32*math.sin(a)))],0.025),BARK,on=('幹と枝',));r.tex=False;L.append(r)
    return L
SOILP=[(112,84,60),(102,76,55),(94,70,51),(86,64,47),(78,58,43)]
def EXTRA(sc):hullrock(sc,(1.04,0.50),(0.07,0.28),0.48,SOILP,seed=5,gi='soil',peak=(0,0),ring=((0,0.9,9),(0.3,1.0,9),(0.7,0.9,8),(1.0,0.4,5)))   # 根の板（土のついた根のかたまり）
