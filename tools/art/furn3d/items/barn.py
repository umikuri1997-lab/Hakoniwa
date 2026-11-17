# 家畜小屋（barn）：モコダマ・ツノクサ（1マス）が2頭まで住む、木の小屋。2×2マス。
# 設計図（じっさいに建てられる組み方。単位はマス）
#   土台：地面に、角材（0.06角）をまわりにまわす（x 0.14〜1.86・y 0.62〜1.86）。
#   柱：四すみに4本（0.08角・高さ0.06〜0.92）。
#   かべ：棟は前うしろ（y）にのびる。前とうしろのかべは、上が三角の切妻（軒0.92・棟1.40）。
#     前とうしろは、たて板（はば0.095・あつさ0.025）を、すきまなくならべて柱・土台にくぎでとめる。前は出入り口（はば0.72・高さ0.78）の所だけ、板を出入り口の上で切る。
#     左右のかべは、柱の外がわの板かべ（見おろしでは見えない）。
#   胴縁：前とうしろの柱のあいだに、よこの角材（0.05×0.03、高さ0.30・0.66、切妻は0.97）。かべ板のうらで、板をとめる。前は出入り口の所で切る。
#   出入り口：わく（0.05角）。中は暗く、ゆかにわら。おくの右に、ほし草のたば（0.32×0.22×0.19。ひも2本でしばる）。
#   とびら：左右2まい（1まいのはば0.36）を、ひらいて前のかべにぴったりつける。たて板3まい＋上と下のよこ桟（0.06）＋ななめのすじかい（はば0.06）。ちょうつがいは鉄の帯2本。
#   ほし草まど：切妻の三角に、わく（0.04）つきのまど（0.30×0.22、高さ1.00〜1.22）。中は暗く、下からほし草がのぞく。
#   屋根：棟から左・右へ、よこ長の板（あつさ0.03）を4まいずつ。かべの外まで0.09、前・うしろへも0.09出す。棟の上に、山の形の棟包み板。
#   破風板：前の切妻の屋根のふちにそって、はば0.05の板。
#   棟木：前とうしろの切妻の上にわたす（0.05角）。
from blueprint import Part as P
from common import *
import math
from coop import planks
ID='barn';SZ=(2,2);BOTTOM=128;GRAD=True
VIEWS=[('barn',0)]
X0,X1,Y0,Y1=0.14,1.86,0.62,1.86
ZB=0.06;ZE=0.92;ZR=1.40
XM=(X0+X1)/2
DX0,DX1,DH=XM-0.36,XM+0.36,0.78
BT=0.025;PS=0.08
DARK=(118,90,68);STRAW=(240,214,140);STRAW2=(222,190,112);HAY=(214,206,126);HAY2=(196,186,104)
def gtop(x):return ZE+(ZR-ZE)*max(0.0,1-abs(x-XM)/(XM-X0))
def MT(p):p.metal=True;p.tex=False;return p
def PARTS():
    L=[]
    L.append(P('土台（前）','box',(X0,Y1-0.06,0,X1,Y1,ZB),WOOD,bevel=0,note='地面におく'))
    L.append(P('土台（うしろ）','box',(X0,Y0,0,X1,Y0+0.06,ZB),WOOD,bevel=0,note='地面におく'))
    for nx,x in(('左',X0),('右',X1-0.06)):L.append(P('土台（%s）'%nx,'box',(x,Y0+0.06,0,x+0.06,Y1-0.06,ZB),WOOD,bevel=0,note='地面におく'))
    for nx,x in(('左',X0),('右',X1-PS)):
        for ny,y in(('うしろ',Y0),('前',Y1-PS)):L.append(P('柱（%s%s）'%(nx,ny),'box',(x,y,ZB,x+PS,y+PS,ZE),WOOD,bevel=0,on=('土台（%s）'%ny,),note='土台にほぞでたてる'))
    for ny,y0,y1 in(('前',Y1-0.03,Y1),('うしろ',Y0,Y0+0.03)):
        for k,z in enumerate((0.30,0.66)):
            segs=[(X0+PS,X1-PS)] if ny=='うしろ' or z>DH else [(X0+PS,DX0-0.05),(DX1+0.05,X1-PS)]
            for i,(a,b) in enumerate(segs):L.append(P('胴縁（%s%d-%d）'%(ny,k+1,i+1),'box',(a,y0,z,b,y1-0.002,z+0.05),WOOD,bevel=0,on=('柱（左%s）'%ny,'柱（右%s）'%ny),note='柱にほぞでさしこむ。かべ板をとめる'))
        L.append(P('胴縁（%s・切妻）'%ny,'box',(X0+0.3,y0,ZE+0.05,X1-0.3,y1-0.002,ZE+0.1),WOOD,bevel=0,on=('柱（左%s）'%ny,'柱（右%s）'%ny),note='切妻のかべ板をとめる'))
    L+=planks('前のかべの板',X0,X1,Y1,Y1+BT,0.0,gtop,hole=(DX0,DX1,DH),on=('柱（左前）','柱（右前）','土台（前）','胴縁（前1-1）','胴縁（前2-1）','胴縁（前・切妻）'))
    L+=planks('うしろのかべの板',X0,X1,Y0-BT,Y0,0.0,gtop,on=('柱（左うしろ）','柱（右うしろ）','土台（うしろ）','胴縁（うしろ1-1）','胴縁（うしろ2-1）','胴縁（うしろ・切妻）'))
    for nx,x0,x1 in(('左',X0-BT,X0),('右',X1,X1+BT)):L.append(P('%sのかべ'%nx,'box',(x0,Y0-BT,0,x1,Y1+BT,ZE),WOOD,on=('柱（%s前）'%nx,'柱（%sうしろ）'%nx),note='柱の外にくぎでとめる'))
    yf=Y1+BT
    # 出入り口：わく・中・わら・ほし草のたば
    L.append(P('わく（左）','box',(DX0-0.05,yf,0,DX0,yf+0.02,DH+0.05),WOOD,bevel=0,on=('前のかべの板1',),note='かべにくぎでとめる'))
    L.append(P('わく（右）','box',(DX1,yf,0,DX1+0.05,yf+0.02,DH+0.05),WOOD,bevel=0,on=('前のかべの板1',),note='かべにくぎでとめる'))
    L.append(P('わく（上）','box',(DX0,yf,DH,DX1,yf+0.02,DH+0.05),WOOD,bevel=0,on=('前のかべの板1',),note='かべにくぎでとめる'))
    L.append(notex(P('中のかげ','box',(X0+0.03,Y0+0.03,0.002,X1-0.03,Y1-0.46,ZE),DARK,on=('土台（うしろ）',),note='小屋の中のおく（くらい）')))
    def dim(c,y):   # 小屋の中は、おくほど暗い（屋根の下で光がとどかない）
        t=max(0.0,min(1.0,(Y1-y)/0.45));k=0.94-0.16*t;return tuple(int(v*k) for v in c)
    straw=lambda x,y,z:dim(STRAW,y)
    p=notex(P('わら','box',(DX0+0.01,Y1-0.42,0.004,DX1-0.01,Y1-0.004,0.03),STRAW,on=('土台（前）',),note='ゆかにしく'));p.decal=straw;L.append(p)
    hayd=lambda x,y,z:HAY2 if int(z*90)%3==0 else None
    BX0,BX1=DX1-0.36,DX1-0.04;TWINE=(184,134,88);HAYD=(212,176,100);HAYL=(250,232,170)
    def hayin(x,y,z):   # ほし草のたば：わらのすじ（ながい向きにそって）と、ひもが2本
        u=(x-BX0)/(BX1-BX0)
        if abs(u-0.27)<0.045 or abs(u-0.73)<0.045:return TWINE
        top=z>0.22-0.004;r=int((Y1-0.20-y)*64/0.62) if top else int((0.22-z)*64/0.8)   # 行（1ドットずつ。上の面はおくゆき、前の面は高さ）
        seg=int(x*64/4+r*1.7)   # すじは4ドットくらいで切れる（わら1本ずつ）
        if r%2==1 and (seg*37+r*11)%5!=0:return HAYD
        if r%2==0 and (seg*53+r*5)%5==0:return HAYL
        return STRAW
    p=notex(P('ほし草のたば','box',(BX0,Y1-0.42,0.03,BX1,Y1-0.20,0.22),STRAW,on=('わら',),note='ゆかにおく。ひも2本でしばったたば'));p.decal=hayin;L.append(p)
    # とびら：ひらいて、かべにぴったりつける（ちょうつがいは出入り口のがわ）
    yd0,yd1=yf+0.02,yf+0.045
    for nx,sx,xa,xb in(('左',-1,DX0-0.05-0.36,DX0-0.05),('右',1,DX1+0.05,DX1+0.05+0.36)):
        w=(xb-xa)/3
        for k in range(3):L.append(P('%sのとびら板%d'%(nx,k+1),'box',(xa+k*w,yd0,0.03,xa+(k+1)*w,yd1,DH),WOOD,bevel=0,on=('わく（%s）'%nx,),note='桟にくぎでとめる'))
        for nz,z0 in(('下',0.08),('上',DH-0.14)):L.append(P('%sのとびらの桟（%s）'%(nx,nz),'box',(xa,yd1,z0,xb,yd1+0.02,z0+0.06),WOOD,bevel=0,on=('%sのとびら板1'%nx,),note='とびら板にくぎでとめる'))
        # すじかい：下の桟の、ちょうつがいのがわから、上の桟の外のがわへ
        hx=xb if sx<0 else xa;ox=xa if sx<0 else xb;z0,z1=0.14,DH-0.14;bw=0.06*(1 if sx<0 else -1)
        L.append(P('%sのとびらのすじかい'%nx,'prism',([(hx,z0),(hx-bw,z0),(ox,z1),(ox+bw,z1)],yd1,yd1+0.02),WOOD,on=('%sのとびらの桟（下）'%nx,'%sのとびらの桟（上）'%nx),note='桟のあいだに、つきあててくぎでとめる'))
        for nz,zc in(('下',0.11),('上',DH-0.11)):
            ex0,ex1=(hx-0.20,hx+0.02) if sx<0 else (hx-0.02,hx+0.20)
            L.append(MT(P('%sのちょうつがい（%s）'%(nx,nz),'box',(ex0,yd1+0.02,zc-0.018,ex1,yd1+0.03,zc+0.018),METAL,bevel=0,on=('%sのとびらの桟（%s）'%(nx,nz),),note='とびらとわくに、くぎでとめる')))
    # ほし草まど
    wx0,wx1,wz0,wz1=XM-0.14,XM+0.14,0.95,1.13
    L.append(notex(P('まどの中','box',(wx0,yf,wz0,wx1,yf+0.004,wz1),DARK,on=('前のかべの板1',),note='まどの中（くらい）')))
    for nm,b in(('左',(wx0-0.04,wz0-0.04,wx0,wz1+0.04)),('右',(wx1,wz0-0.04,wx1+0.04,wz1+0.04)),('上',(wx0,wz1,wx1,wz1+0.04)),('下',(wx0,wz0-0.04,wx1,wz0))):
        L.append(P('まどのわく（%s）'%nm,'box',(b[0],yf,b[1],b[2],yf+0.022,b[3]),WOOD,bevel=0,on=('前のかべの板1',),note='かべにくぎでとめる'))
    tuft=[(wx0+0.01,wz0),(wx1-0.01,wz0),(wx1-0.02,wz0+0.05),(wx1-0.06,wz0+0.075),(XM+0.03,wz0+0.06),(XM,wz0+0.09),(XM-0.04,wz0+0.065),(wx0+0.05,wz0+0.08),(wx0+0.02,wz0+0.05)]
    hz=lambda x,y,z:STRAW2 if int(x*140)%3==0 else None
    p=notex(P('まどのほし草','prism',(tuft,yf+0.004,yf+0.03),STRAW,on=('まどのわく（下）',),note='まどの下のふちから、のぞく'));p.decal=hz;L.append(p)
    L.append(P('棟木','box',(XM-0.025,Y0-BT-0.09,ZR-0.05,XM+0.025,Y1+BT+0.09,ZR),WOOD,on=('前のかべの板1','うしろのかべの板1'),note='切妻の上にのせる'))
    NB=4;bt=0.03;RY0,RY1=Y0-BT-0.09,Y1+BT+0.09
    for nx,sx in(('左',-1),('右',1)):
        xe=(X1+BT+0.09) if sx>0 else (X0-BT-0.09);ze=ZE-(ZR-ZE)*0.09/(XM-X0+BT)
        L0=math.hypot(xe-XM,ZR-ze);ux,uz=(xe-XM)/L0,(ze-ZR)/L0;nx_,nz_=(-uz,ux) if sx>0 else (uz,-ux)
        pt=lambda s,h:(XM+ux*s+nx_*h,ZR+uz*s+nz_*h)
        for b in range(NB):
            s0=L0*b/NB;s1=L0*(b+1)/NB-0.002
            L.append(P('屋根板（%s%d）'%(nx,b+1),'prism',([pt(s0,0),pt(s1,0),pt(s1,bt),pt(s0,bt)],RY0,RY1),WOOD,on=('棟木','%sのかべ'%nx),note='切妻と棟木にくぎでとめる'))
        L.append(P('棟包み（%s）'%nx,'prism',([pt(-0.002,bt),pt(0.07,bt),pt(0.07,bt*1.9),pt(-0.002,bt*1.9)],RY0,RY1),WOOD,on=('棟木',),note='棟の上にかぶせる'))
        L.append(P('破風板（%s）'%nx,'prism',([pt(0,bt+0.002),pt(L0,bt+0.002),pt(L0,-0.05),pt(0,-0.05)],RY1,RY1+0.025),WOOD,on=('屋根板（%s1）'%nx,),note='屋根のふちにくぎでとめる'))
    return L

TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
