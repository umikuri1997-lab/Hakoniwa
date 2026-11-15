# とり小屋（coop）：ハネマリ（にわとりのような生き物、0.6マス）が3羽まで住む、小さな木の小屋。1×1マス。
# 設計図（じっさいに作れる組み方。単位はマス）
#   脚：4本（0.06角・高さ0〜0.12）。地面に立てる。前とうしろの脚のあいだに、ぬき（0.03×0.03）を1本ずつ。
#   床板：脚の上にのせる（0.12〜0.15、x 0.12〜0.88・y 0.36〜0.90）。
#   柱：床板の四すみに4本（0.05角・高さ0.15〜0.58）。
#   かべ：柱の外がわに、たての板（はば0.095・あつさ0.02）をならべてくぎでとめる。板と板のあいだは0.004あける。
#     前のかべは、まん中の出入り口（はば0.24・高さ0.26）の所だけ、板を出入り口の上で切る。
#     出入り口のまわりに、わく（0.03×0.025）。中は暗く、ゆかにわらをしく（わらは出入り口から少し見える）。
#     四すみに、かべの外から、たての見切り板（0.035×0.035）。軒の高さに、よこの帯板（高さ0.035）。
#   切妻：左右のかべは、上が三角（0.58〜0.76）。棟は左右（x）にのびる。三角のふちに破風板（はば0.04）。
#   棟木：左右の切妻の上にわたす（0.04角）。
#   屋根：棟から前・うしろへ、こけら板（あつさ0.02・ながさ0.13）を、下の段から少しずつかさねて4段ふく。かべの外まで0.07出す。
#     棟の上に、山の形の棟包み板（はば0.035ずつ）。
#   はしご板：出入り口の下から、前の地面へななめにおろす板（はば0.16・あつさ0.02）に、よこ桟4本。
from blueprint import Part as P
from common import *
import math
ID='coop';BOTTOM=60;GRAD=True
VIEWS=[('coop',0)]
X0,X1,Y0,Y1=0.12,0.88,0.36,0.90
ZF=0.15;ZE=0.58;ZR=0.76   # 床の上・軒・棟
YM=(Y0+Y1)/2
DX0,DX1,DH=0.38,0.62,0.26   # 出入り口
BT=0.02;PW=0.095;PG=0.0
DARK=(120,92,70);STRAW=(240,214,140);STRAW2=(222,190,112)
def planks(name,x0,x1,y0,y1,z0,top,hole=None,on=()):
    """たて板を x0〜x1 にならべる。top(x)：その x での板の上のはし。hole=(hx0,hx1,hz)：そこは板を hz から上だけにする"""
    L=[];n=max(1,round((x1-x0)/(PW+PG)));w=(x1-x0)/n
    for i in range(n):
        a=x0+i*w+PG/2;b=x0+(i+1)*w-PG/2;zb=z0
        if hole and a<hole[1]-1e-6 and b>hole[0]+1e-6:
            if a<hole[0]-0.01 or b>hole[1]+0.01:   # 出入り口のふちにかかる板は、出入り口の所だけ切りかく
                pts=[]
                if a<hole[0]:pts+= [(a,z0),(hole[0],z0),(hole[0],hole[2])]
                else:pts+=[(a,hole[2])]
                if b>hole[1]:pts+= [(hole[1],hole[2]),(hole[1],z0),(b,z0)]
                else:pts+=[(b,hole[2])]
                pts+=[(b,top(b)),(a,top(a))]
                L.append(P('%s%d'%(name,i+1),'prism',(pts,y0,y1),WOOD,on=on,note='柱にくぎでとめる'));continue
            zb=hole[2]
        pts=[(a,zb),(b,zb),(b,top(b))]
        mid=(a+b)/2
        if top(mid)>max(top(a),top(b))+1e-4:pts.append((mid,top(mid)))   # 棟の所は山の形
        pts.append((a,top(a)))
        L.append(P('%s%d'%(name,i+1),'prism',(pts,y0,y1),WOOD,on=on,note='柱にくぎでとめる'))
    return L
def PARTS():
    L=[]
    legs=[]
    for nx,x in(('左',X0+0.02),('右',X1-0.08)):
        for ny,y in(('うしろ',Y0+0.02),('前',Y1-0.08)):p=P('脚（%s%s）'%(nx,ny),'box',(x,y,0,x+0.06,y+0.06,0.12),WOOD,bevel=0,note='地面に立てる');L.append(p);legs.append(p.name)
    for ny,y in(('うしろ',Y0+0.035),('前',Y1-0.065)):L.append(P('ぬき（%s）'%ny,'box',(X0+0.08,y,0.04,X1-0.08,y+0.03,0.07),WOOD,bevel=0,on=('脚（左%s）'%ny,'脚（右%s）'%ny),note='脚にほぞでさしこむ'))
    L.append(P('床板','box',(X0,Y0,0.12,X1,Y1,ZF),WOOD,on=tuple(legs),bevel=0,note='脚の上にのせる'))
    for nx,x in(('左',X0),('右',X1-0.05)):
        for ny,y in(('うしろ',Y0),('前',Y1-0.05)):L.append(P('柱（%s%s）'%(nx,ny),'box',(x,y,ZF,x+0.05,y+0.05,ZE),WOOD,bevel=0,on=('床板',),note='床板にたてる'))
    flat=lambda x:ZE
    L+=planks('前のかべの板',X0,X1,Y1,Y1+BT,ZF,flat,hole=(DX0,DX1,ZF+DH),on=('柱（左前）','柱（右前）'))
    L+=planks('うしろのかべの板',X0,X1,Y0-BT,Y0,ZF,flat,on=('柱（左うしろ）','柱（右うしろ）'))
    for nx,x0,x1 in(('左',X0-BT,X0),('右',X1,X1+BT)):
        side=[(Y0-BT,ZF),(Y1+BT,ZF),(Y1+BT,ZE),(YM,ZR),(Y0-BT,ZE)]
        L.append(P('%sのかべ'%nx,'prism',(side,x0,x1,'x'),WOOD,on=('柱（%s前）'%nx,'柱（%sうしろ）'%nx),note='柱の外。上は三角の切妻'))
        for sy,ys in((1,Y1+BT),(-1,Y0-BT)):   # 破風板：三角のふち
            ye=ys+sy*0.07;ze=ZE-(ZR-ZE)*0.07/(YM-Y0+BT)
            L.append(P('%sの破風板（%s）'%(nx,'前' if sy>0 else 'うしろ'),'prism',([(YM,ZR+0.012),(ye,ze+0.012),(ye,ze-0.03),(YM,ZR-0.03)],x0-0.012 if nx=='左' else x0,x1 if nx=='左' else x1+0.012,'x'),WOOD,on=('%sのかべ'%nx,),note='切妻のふちにくぎでとめる'))
    # 見切り板・帯板
    for nx,x in(('左',X0-BT-0.012),('右',X1+BT-0.023)):L.append(P('見切り板（%s前）'%nx,'box',(x,Y1+BT-0.012,ZF,x+0.035,Y1+BT+0.023,ZE),WOOD,bevel=0,on=('柱（%s前）'%nx,),note='かべの角にくぎでとめる'))
    L.append(P('帯板（前）','box',(X0-BT,Y1+BT,ZE-0.035,X1+BT,Y1+BT+0.015,ZE),WOOD,bevel=0,on=('柱（左前）','柱（右前）'),note='軒の下にくぎでとめる'))
    # 出入り口：わく・中・わら
    for nm,b in(('左',(DX0-0.03,ZF,DX0,ZF+DH+0.03)),('右',(DX1,ZF,DX1+0.03,ZF+DH+0.03)),('上',(DX0,ZF+DH,DX1,ZF+DH+0.03))):
        L.append(P('出入り口のわく（%s）'%nm,'box',(b[0],Y1+BT,b[1],b[2],Y1+BT+0.018,b[3]),WOOD,bevel=0,on=('前のかべの板1',),note='かべにくぎでとめる'))
    L.append(notex(P('中のかげ','box',(X0+0.02,Y0+0.02,ZF+0.002,X1-0.02,Y1-0.002,ZE-0.01),DARK,on=('床板',),note='小屋の中（くらい）')))
    def straw(x,y,z):
        return None
    p=notex(P('わら','box',(DX0+0.005,Y1-0.14,ZF+0.004,DX1-0.005,Y1+0.004,ZF+0.04),STRAW,on=('床板',),note='ゆかにしく'));p.decal=straw;L.append(p)
    L.append(P('棟木','box',(X0-BT-0.03,YM-0.02,ZR-0.04,X1+BT+0.03,YM+0.02,ZR),WOOD,on=('左のかべ','右のかべ'),note='切妻の上にのせる'))
    # 屋根：こけら板を下からかさねる
    NB=4;bt=0.02;RX0,RX1=X0-BT-0.05,X1+BT+0.05
    for ny,sy in(('前',1),('うしろ',-1)):
        ye=(Y1+BT+0.07) if sy>0 else (Y0-BT-0.07);ze=ZE-(ZR-ZE)*0.07/(YM-Y0+BT)
        L0=math.hypot(ye-YM,ZR-ze);uy,uz=(ye-YM)/L0,(ze-ZR)/L0;ny_,nz_=(-uz,uy) if sy>0 else (uz,-uy)
        pt=lambda s,h:(YM+uy*s+ny_*h,ZR+uz*s+nz_*h)
        step=L0/NB
        for b in range(NB):   # 軒の段が下（いちばん外）。上の段の板は、下の段に0.03かさなり、少し浮く
            s0=max(0,L0-step*(b+1)-0.03);s1=L0-step*b;h0=bt*b*0.5
            L.append(P('こけら板（%s%d）'%(ny,b+1),'prism',([pt(s0,h0),pt(s1,h0),pt(s1,h0+bt),pt(s0,h0+bt)],RX0,RX1,'x'),WOOD,on=('棟木','左のかべ','右のかべ'),note='下の段にかさねてくぎでとめる'))
        L.append(P('棟包み（%s）'%ny,'prism',([pt(-0.002,bt*2),pt(0.05,bt*2),pt(0.05,bt*3.2),pt(-0.002,bt*3.2)],RX0,RX1,'x'),WOOD,on=('棟木',),note='棟の上にかぶせる'))
    # はしご板
    ya,za,yb=Y1+BT+0.018,ZF,Y1+0.30
    L.append(P('はしご板','plate',((0.5,ya,za),(0.5,yb,0.0),0.16,BT),WOOD,on=('床板',),note='床板のふちにかける'))
    for k in range(4):
        t=(k+0.6)/4.4;y=ya+(yb-ya)*t;z=za*(1-t)+BT
        L.append(P('桟%d'%(k+1),'box',(0.43,y-0.011,z,0.57,y+0.011,z+0.016),WOOD,on=('はしご板',),bevel=0,note='はしご板にくぎでとめる'))
    return L
