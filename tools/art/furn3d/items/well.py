# 井戸（well）：いまの絵のデザインのまま。石をまるくつんだ井戸がわ・中の水・左右の柱・柱にわたした横木・なわでつるしたおけ・板をはった切妻の屋根。
# 設計図（じっさいに建てられる組み方。単位はマス。大きさは、いまの絵（63×107ドット）に合わせる）
#   井戸がわ：石を、まるく（外の半径0.36・内の半径0.27）つむ。石は、どれも同じ大きさ（かべにそった長さ 外がわで0.15・高さ0.08・あつさ0.09）。
#     1だんに15こ、3だん（高さ0〜0.24）。1だんごとに半分ずらしてつむ。石の角は面取りしない（ドット絵では面取りのかげが孤立ドットになる）。石ごとに少し色がちがう。白い石なので、テクスチャははらない（もようで灰色に見えないように）。
#     井戸がわの内の面は、光がとどかないので、外よりくらく、下ほどくらい。
#   水：井戸がわの中、高さ0.15。すけて見える・つやがある（'clear'）。おくは空をうつして明るい。
#   柱：左右に1本ずつ（0.07角・高さ0〜1.10）。井戸がわの外、地面に立てる。
#   横木：左右の柱のあいだにわたす（0.05角、高さ0.82〜0.87）。柱にほぞでさしこむ。
#   棟木：柱の上にのせる（0.06角、高さ1.10〜1.16、柱の外まで0.06ずつ出す）。
#   たる木：左右の柱の上で、棟木から前・うしろへ、ななめにおろす（あつさ0.04、軒の高さ1.05。ゆるい勾配）。
#   屋根板：たる木の上に、よこ長の板（あつさ0.025、同じはば）を、前・うしろ4まいずつ、すきまなくならべてはる。屋根は柱の外まで0.07出す。
#   なわ：横木のまん中から、おけのつる（取っ手）まで。
#   おけ：木の板をまるくならべたおけ（半径0.09・高さ0.09）、鉄の輪1本・底板・鉄のつる。水の上にうかせてつるす（底の高さ0.21）。
from blueprint import Part as P
from common import *
import math
ID='well';BOTTOM=60;GRAD=True
VIEWS=[('well',0)]
CX,CY=0.50,0.58
RO,RI=0.36,0.27;SH=0.08;NS=15;ROWS=3;BEV=0
ZW=0.15   # 水の高さ
STONES=[(236,234,230),(226,224,222),(242,240,236),(220,218,218),(232,228,224),(238,236,230)]
WATER=(96,170,226);SKY=(212,236,250)
PX=0.42;PW=0.035   # 柱のまん中の、まん中からのはなれ・柱の半分のはば
ZT=1.10;ZE=1.05;YE=0.36   # 柱のてっぺん・軒の高さ・軒の、まん中からのはなれ（前・うしろ）
RX=0.49   # 屋根の、まん中からの左右のはし
def MT(p):p.metal=True;return p
def inner(x,y,z):   # 井戸がわの内の面：外よりくらく、下ほどくらい
    r=math.hypot(x-CX,y-CY)
    if r<RI+0.006:t=max(0,min(1,(ROWS*SH-z)/0.14));return (int(176-44*t),int(174-44*t),int(172-42*t))
    return None
def sector(a0,a1,r0,r1,n=6):
    o=[(CX+r1*math.cos(a0+(a1-a0)*i/n),CY+r1*math.sin(a0+(a1-a0)*i/n)) for i in range(n+1)]
    i_=[(CX+r0*math.cos(a1-(a1-a0)*i/n),CY+r0*math.sin(a1-(a1-a0)*i/n)) for i in range(n+1)]
    return o+i_
def PARTS():
    L=[];prev=('ground',)
    da=2*math.pi/NS;gap=0.0015/RO   # 石と石のあいだの目地（ほんの少しあける）
    for r in range(ROWS):
        names=[];off=da/2 if r%2 else 0
        for i in range(NS):
            a0=off+da*i+gap;a1=off+da*(i+1)-gap
            p=P('石%d-%d'%(r+1,i+1),'prism',(sector(a0,a1,RI,RO),r*SH+0.002,(r+1)*SH,'z'),STONES[(i*5+r*3)%len(STONES)],on=prev,bevel=BEV,note='井戸がわの石。%dだんめ'%(r+1))
            p.tex=False;p.decal=inner;L.append(p);names.append(p.name)
        prev=tuple(names)
    L.append(notex(P('井戸の中','cyl',(CX,CY,RI-0.002,0.0,ZW-0.03),(92,104,116),detail=40,note='水の下の、くらい井戸の中（水がすけて見える）')))
    for nx,sx in(('左',-1),('右',1)):
        x=CX+sx*PX
        L.append(P('%sの柱'%nx,'box',(x-PW,CY-PW,0.0,x+PW,CY+PW,ZT),WOOD,note='井戸がわの外、地面に立てる'))
    L.append(P('横木','box',(CX-PX+PW,CY-0.025,0.82,CX+PX-PW,CY+0.025,0.87),WOOD,on=('左の柱','右の柱'),note='柱にほぞでさしこむ'))
    L.append(P('棟木','box',(CX-PX-PW-0.03,CY-0.03,ZT,CX+PX+PW+0.03,CY+0.03,ZT+0.06),WOOD,on=('左の柱','右の柱'),note='柱の上にのせる'))
    # たる木：棟木の上のはしから、軒へ（横から見た形）
    th=0.04
    for nx,sx in(('左',-1),('右',1)):
        x=CX+sx*PX
        for ny,sy in(('前',1),('うしろ',-1)):
            pts=[(CY,ZT+0.06),(CY+sy*YE,ZE),(CY+sy*YE,ZE-th),(CY,ZT+0.06-th)]
            L.append(P('%sのたる木（%s）'%(nx,ny),'prism',(pts,x-0.025,x+0.025,'x'),WOOD,on=('棟木','%sの柱'%nx),note='棟木から軒へ。柱の上'))
    # 屋根板：たる木の上。軒から棟へ、よこ長の板4まいを少しずつかさねる
    NB=4;bt=0.025
    for ny,sy in(('前',1),('うしろ',-1)):
        L0=math.hypot(YE+0.04,ZT+0.06-ZE+0.01)   # 棟から軒の外まで（軒は0.04出す）
        uy,uz=sy*(YE+0.04)/L0,-(ZT+0.06-ZE+0.01)/L0   # 棟から軒へ向かう向き
        ny_,nz_=-uz*sy,uy*sy   # 外へ向く向き（上）
        if nz_<0:ny_,nz_=-ny_,-nz_
        for b in range(NB):
            s0=L0*b/NB;s1=L0*(b+1)/NB-0.002   # 板の、棟からの場所。すきまなくならべる
            def pt(s,h):return(CY+uy*s+ny_*h,ZT+0.06+uz*s+nz_*h)
            pts=[pt(s0,0),pt(s1,0),pt(s1,bt),pt(s0,bt)]
            p=P('屋根板（%s%d）'%(ny,b+1),'prism',(pts,CX-RX,CX+RX,'x'),WOOD,on=('左のたる木（%s）'%ny,'右のたる木（%s）'%ny),note='たる木の上にくぎでとめる');L.append(p)
    # なわ・おけ
    zb=0.21;bh=0.09;br=0.09
    L.append(P('なわ','rope',((CX,CY,0.82),(CX,CY,zb+bh+0.06),0.009),(232,220,190),on=('横木',),note='横木にむすぶ'))
    L.append(MT(P('おけのつる','tube',([(CX-br,CY,zb+bh-0.01),(CX-0.05,CY,zb+bh+0.045),(CX,CY,zb+bh+0.06),(CX+0.05,CY,zb+bh+0.045),(CX+br,CY,zb+bh-0.01)],0.008),METAL,on=('なわ',),note='なわにむすぶ')))
    L.append(P('おけ','ring',(CX,CY,br-0.014,br,zb,zb+bh),WOOD,detail=24,on=('おけのつる',),note='板をまるくならべる'))
    L.append(P('おけの底','cyl',(CX,CY,br-0.012,zb,zb+0.02),WOOD,detail=24,on=('おけ',),note='おけの下のはし'))
    L.append(MT(P('おけの輪','ring',(CX,CY,br-0.002,br+0.006,zb+0.02,zb+0.04),METAL,detail=24,on=('おけ',),note='おけにはめる')))
    return L
def EXTRA(sc):   # 水：井戸がわの中。すけて見える・つやがある。おくは空をうつして明るい
    r=RI-0.004
    def col(x,y):t=max(0,min(1,(CY+r*0.2-y)/(r*1.2)))**1.4;return tuple(WATER[k]*(1-t)+SKY[k]*t for k in range(3))
    def disk(u,v):U,V=2*u-1,2*v-1;return (CX+r*U*math.sqrt(max(0,1-V*V/2)),CY+r*V*math.sqrt(max(0,1-U*U/2)))
    def top(x,y):u=(x-(CX-r))/(2*r);v=(y-(CY-r))/(2*r);return ZW+0.006*math.sin(u*13.0+v*4.0)+0.004*math.sin(v*17.0-u*6.0+1.3)
    sc.material('clear');hfield(sc,CX-r,CY-r,CX+r,CY+r,top,lambda x,y:col(*disk((x-(CX-r))/(2*r),(y-(CY-r))/(2*r))),n=(40,40),shape=disk);sc.material(None)
