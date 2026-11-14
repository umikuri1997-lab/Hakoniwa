# 見張り台（watch・watch@2〜watch@10）：2×2マス。強化の段階（Lv1〜10）ごとに1まい。M.VAR に段階。旗・星・屋根はつけない（持ち主がきめた）。
# 段階で、材料がじょうぶになっていく（前の段階の物に、たしていく。かわる物は、そこに書く）：
#   Lv1：木だけの台（柱0.22角）。柱の下に方づえ・さく（横木2本と子柱）・前にハシゴ。
#   Lv2：4つの面につなぎ・前に長い方づえ。
#   Lv3：柱が太く（0.24角）、石づみの台座（柱よりひとまわり大きい・高さ0.36）の上に立つ。
#   Lv4：柱に鉄の帯・さくの下半分に腰板。
#   Lv5：右前の柱に、あかり（つりさげたランタン）。夜につく。
#   Lv6：石をつんだ土台（置くマスいっぱい、木の部分よりひとまわり大きい、高さ1.08）の上に太い柱（0.28角）、柱のあいだは板かべ（つなぎ・方づえ・台座のかわり）。
#   Lv7：さくの外に、とがった板の胸壁（腰板のかわり）。
#   Lv8：床を左右に広げる（はね出しの床と、うけの方づえ）。2人立てる。
#   Lv9：鉄でかためる（胸壁の鉄の帯・土台の角の鉄の板・柱の上の鉄の帯）。
#   Lv10：あかりを4つ（4本の柱）に。土台のかさ石に、ふちのでっぱり。
# 設計図（じっさいに建てられる組み方。単位はマス）
#   柱：4本（PW 角）。置くマスのふちから0.08内がわ。高さは、さくのてっぺんまで（DZ+RH）。てっぺんに柱の頭（PW+0.06 角・あつさ0.06）。
#   石づみの台座（Lv3〜5）：同じ大きさの石（よこ PW+0.10・おく半分・高さ0.12）を、1だんに2こ、だんごとに向きをかえてつむ。柱は台座のまん中に立てる。
#   石の土台（Lv6〜）：置くマスいっぱい（0〜2）、かべのあつさ0.16。同じ大きさの石（長さ0.23・高さ0.12）を、だんごとに半分ずらしてつむ（角を通る石の向きも、だんごとにかえる）。はしは切った石。
#     中は小石と土でうめ、上に平らなかさ石（4×4まい、あつさ0.06）。前のまん中に、ハシゴを入れるくぼみ（x 0.62〜1.38・おく0.10）。
#   板かべ（Lv6〜）：石の土台の上、柱と柱のあいだに、たての板（はば0.14・あつさ0.04）を柱の内の面にそって、すきまなくならべ（すきまから中が見えないように）、かさ石にのせて、けたにくぎでとめる。前・うしろの外に鉄の帯を2本。
#   床の高さ DZ=2.45（床の上の面）。上に立つせいれい（ゲームの WPLIFT 98）の足が、前のさくのすぐうしろにくる高さ。
#   けた：床の下、柱と柱のあいだに4本（はば0.12・高さ0.14）。柱にボルトでとめる（柱の外の面にそろえる）。
#   根太：左右のけたのあいだに3本。床板：よこにのびる板8まい（同じはば・あつさ0.07）。柱にかかる板は、柱の所を切りかく。
#   はね出しの床（Lv8〜）：根太を左右のけたの外へ EXT 出す。柱の外の面に、はね出しのはり（柱にボルト）と小げた、はしにふちげたを組み、床板をはる。根太の下に、けたにとめた三角の方づえ。
#   方づえ（Lv1〜5）：柱からけたへ45度（はば0.08）。はしは柱・けたの面にそって切る（prism）。
#   つなぎ（Lv2〜5）：4つの面の柱と柱のあいだに（はば0.08・高さ0.10）。前の方づえ（Lv2〜5）：つなぎの上（柱のきわ）から、前のけたの下（はしの柱の下）へ。
#   鉄の帯（Lv4〜）：柱のまわりにまく（あつさ0.012・高さ0.05）。
#   さく：横木2本（上 DZ+RH・まん中 DZ+RH*0.5、はば0.10・あつさ0.08）。子柱（0.08角）はうしろ・左・右に3本ずつ（Lv7〜は胸壁のうしろなので、つけない）。
#     前は、ハシゴの口（x 0.70〜1.30）をあける：口の両わきに、はしの柱（0.10角、頭つき）を前のけたにとめる。
#   腰板（Lv4〜6）：さくの横木の外に、たての板（はば0.14・あつさ0.03）を、床からまん中の横木まで。
#   胸壁（Lv7〜）：さくの外に、たての板（はば0.14・あつさ0.05、上をとがらせる）を、けたの下から、さくの上0.12まで。Lv8〜は、はね出しの床のはしにそって。
#   あかり：柱から前（うしろの柱はうしろ）へ出した腕木（0.05角）に、鉄のわくのランタンを、くさりでつるす。ガラスは光る（かげなし）。
#   ハシゴ：前に、まっすぐ立てる（かたむけない）。地面から床の上0.40まで（手すり）。段は同じ間かく0.27で、床の高さまで（9段）。
from blueprint import Part as P
from common import *
import math,os
ID='watch';BOTTOM=127;GRAD=True
VIEWS=[('watch',0,1)]+[('watch@%d'%n,0,n) for n in range(2,11)]
VAR=1
PARALLEL=True   # 背の高い物なので、遠近なしで写す（遠近をかけると、ハシゴの段が下ほどつまる）
IN=0.08;F=2-IN                  # 柱の、置くマスのふちからの内がわ・柱の外がわ（右・前）
DZ=2.45;BT=0.07                 # 床の上の面・床板のあつさ
GH=0.14;GW=0.12                 # けたの高さ・はば
RH=0.45;RW=0.10;RT=0.08;BW=0.08 # さくの高さ・横木のはば・あつさ・子柱のふとさ
LX0,LX1=0.70,1.30;SW=0.08       # ハシゴの口（ハシゴの柱の外がわ）・ハシゴの柱のふとさ
EW=0.10                         # はしの柱のふとさ
EXT=0.14                        # はね出しの床（Lv8〜）の出
STONES=[(238,232,220),(228,222,210),(244,238,226),(222,216,204),(234,228,216)]
IRON=(150,158,172);GLASS=(255,226,140);GLASSC=(255,246,206)
def MT(p):p.metal=True;p.tex=False;return p
def STN(p):p.tex=False;p.soft1=True;return p   # 白い石：木目なし・かげはうすく
def run(a,b,gap=0.003):
    n=max(1,round((b-a)/0.14));w=(b-a)/n;return [(a+i*w+gap,a+(i+1)*w-gap) for i in range(n)]
def PARTS():
    lv=VAR;L=[];zg0,zg1=DZ-BT-GH,DZ-BT
    PW=0.22 if lv<3 else 0.24 if lv<6 else 0.28
    ZB=0.0 if lv<3 else 0.36 if lv<6 else 1.08;CH=0.12
    ZT=0.62 if lv<3 else 0.72
    X0,X1=(IN-EXT,F+EXT) if lv>=8 else (IN,F)   # 床・胸壁の左右のはし
    posts=[('左うしろ',IN,IN),('右うしろ',F-PW,IN),('左前',IN,F-PW),('右前',F-PW,F-PW)]
    if lv>=6:   # 石の土台
        WT=0.16;SL=0.23;nc=round((ZB-0.06)/CH);prev=('ground',);GAP=0.003;B0,B1=0.0,2.0;NX0,NX1,ND=0.62,1.38,0.10
        def lay(a,b,off):
            out=[];u=a;first=True
            while u<b-0.01:
                e=min(b,u+(off if first else SL));out.append((u+GAP/2,e-GAP/2));u=e;first=False
            return out
        for c in range(nc):
            za,zb_=c*CH+0.002,(c+1)*CH;cur=[];thru=c%2==0   # だんごとに、角を通る石の向きをかえる
            if thru:walls=[('うしろ',B0,B1,'x',(B0,B0+WT)),('前・左',B0,NX0,'x',(B1-WT,B1)),('前・右',NX1,B1,'x',(B1-WT,B1)),('左',B0+WT,B1-WT,'y',(B0,B0+WT)),('右',B0+WT,B1-WT,'y',(B1-WT,B1))]
            else:walls=[('うしろ',B0+WT,B1-WT,'x',(B0,B0+WT)),('前・左',B0+WT,NX0,'x',(B1-WT,B1)),('前・右',NX1,B1-WT,'x',(B1-WT,B1)),('左',B0,B1,'y',(B0,B0+WT)),('右',B0,B1,'y',(B1-WT,B1))]
            walls.append(('くぼみ',NX0,NX1,'x',(B1-ND-WT,B1-ND)))   # くぼみのおくのかべ
            for wn,a,b,ax,(w0,w1) in walls:
                for k,(u0,u1) in enumerate(lay(a,b,SL/2 if c%2 else SL)):
                    sn='土台の石%d（%s%d）'%(c+1,wn,k+1);cur.append(sn)
                    bx=(u0,w0,za,u1,w1,zb_) if ax=='x' else (w0,u0,za,w1,u1,zb_)
                    L.append(STN(P(sn,'box',bx,STONES[(c*3+k*2+len(wn))%len(STONES)],on=prev,bevel=0,note='石のかべ。%dだんめ'%(c+1))))
            prev=tuple(cur)
        L.append(STN(P('中のつめ石','box',(B0+WT+0.004,B0+WT+0.004,0,B1-WT-0.004,B1-ND-WT-0.004,nc*CH),STONES[3],note='石のかべの中を、小石と土でうめる')));prev=prev+('中のつめ石',)
        lip=0.04 if lv>=10 else 0.0;w=(B1-B0)/4
        for i in range(4):
            for j in range(4):
                a,b=B0+i*w+GAP/2,B0+(i+1)*w-GAP/2;c_,d=B0+j*w+GAP/2,B0+(j+1)*w-GAP/2
                if j==3 and i in(1,2):   # くぼみにかかる石：くぼみの所を切りかく
                    q=B1-ND;nx=NX0 if i==1 else NX1
                    pts=[(a,c_),(b,c_),(b,q),(nx,q),(nx,B1+lip),(a,B1+lip)] if i==1 else [(a,c_),(b,c_),(b,B1+lip),(nx,B1+lip),(nx,q),(a,q)]
                    L.append(STN(P('かさ石%d-%d'%(i+1,j+1),'prism',(pts,nc*CH+0.002,ZB,'z'),STONES[(i*2+j*3)%len(STONES)],on=prev,bevel=0,note='石のかべの上にしく。くぼみの所を切りかく')));continue
                a2=a-(lip if i==0 else 0);b2=b+(lip if i==3 else 0);c2=c_-(lip if j==0 else 0);d2=d+(lip if j==3 else 0)
                L.append(STN(P('かさ石%d-%d'%(i+1,j+1),'box',(a2,c2,nc*CH+0.002,b2,d2,ZB),STONES[(i*2+j*3)%len(STONES)],on=prev,bevel=0,note='石のかべの上にしく')))
        if lv>=9:   # 土台の角の鉄の板（L の形に2まい）
            t=0.012;l=0.06
            for nm,cx,cy in (('左前',B0,B1),('右前',B1,B1),('左うしろ',B0,B0),('右うしろ',B1,B0)):
                sx=1 if cx==B0 else -1;sy=1 if cy==B0 else -1
                fy=(cy,cy+t) if cy==B1 else (cy-t,cy);fx=(cx-t,cx) if cx==B0 else (cx,cx+t)
                L.append(MT(P('土台の鉄の板（%s・よこ）'%nm,'box',(min(cx,cx+sx*l),fy[0],0.04,max(cx,cx+sx*l),fy[1],ZB-0.04),IRON,on=prev,note='土台の角に、くぎでとめる')))
                L.append(MT(P('土台の鉄の板（%s・おく）'%nm,'box',(fx[0],min(cy,cy+sy*l),0.04,fx[1],max(cy,cy+sy*l),ZB-0.04),IRON,on=prev,note='土台の角に、くぎでとめる')))
    for pi,(nm,x,y) in enumerate(posts):
        on=('ground',)
        if lv>=6:on=('かさ石%s'%{'左うしろ':'1-1','右うしろ':'4-1','左前':'1-4','右前':'4-4'}[nm],)
        elif lv>=3:   # 石づみの台座：柱よりひとまわり大きい
            m=0.05;x0,y0,x1,y1=x-m,y-m,x+PW+m,y+PW+m;n=round(ZB/CH);prev=('ground',)
            for c in range(n):
                za,zb_=c*CH+0.002,(c+1)*CH;cur=[]
                halves=[(x0,y0,(x0+x1)/2-0.002,y1),((x0+x1)/2+0.002,y0,x1,y1)] if (c+pi)%2 else [(x0,y0,x1,(y0+y1)/2-0.002),(x0,(y0+y1)/2+0.002,x1,y1)]
                for k,(a,b,c2,d) in enumerate(halves):
                    sn='石%d-%d（%s）'%(c+1,k+1,nm);cur.append(sn)
                    L.append(STN(P(sn,'box',(a,b,za,c2,d,zb_),STONES[(c*3+k*2+pi)%len(STONES)],on=prev,bevel=0,note='石づみ。%dだんめ'%(c+1))))
                prev=tuple(cur)
            on=prev
        L.append(P('柱（%s）'%nm,'box',(x,y,ZB,x+PW,y+PW,DZ+RH),WOOD,on=on,note='石の上に立て、鉄のかなものでとめる' if ZB>0 else '地面に立てる'))
        L.append(P('柱の頭（%s）'%nm,'box',(x-0.03,y-0.03,DZ+RH,x+PW+0.03,y+PW+0.03,DZ+RH+0.06),WOOD,on=('柱（%s）'%nm,),note='柱の上にのせる'))
        if lv>=4:
            zz=(ZT+0.06,zg0-0.08) if lv<6 else (ZB+0.05,ZB+0.45,zg0-0.08,DZ+0.06)
            if lv>=9:zz=zz+(DZ+RH-0.05,)
            for i,zb in enumerate(zz):
                L.append(MT(P('鉄の帯%d（%s）'%(i+1,nm),'box',(x-0.012,y-0.012,zb-0.025,x+PW+0.012,y+PW+0.012,zb+0.025),IRON,on=('柱（%s）'%nm,),note='柱にまいて、くぎでとめる')))
    # けた
    L.append(P('けた（うしろ）','box',(IN+PW,IN,zg0,F-PW,IN+GW,zg1),WOOD,on=('柱（左うしろ）','柱（右うしろ）'),note='柱にボルトでとめる'))
    L.append(P('けた（前）','box',(IN+PW,F-GW,zg0,F-PW,F,zg1),WOOD,on=('柱（左前）','柱（右前）'),note='柱にボルトでとめる'))
    L.append(P('けた（左）','box',(IN,IN+PW,zg0,IN+GW,F-PW,zg1),WOOD,on=('柱（左うしろ）','柱（左前）'),note='柱にボルトでとめる'))
    L.append(P('けた（右）','box',(F-GW,IN+PW,zg0,F,F-PW,zg1),WOOD,on=('柱（右うしろ）','柱（右前）'),note='柱にボルトでとめる'))
    jt=(0.62,1.00,1.38)
    for t in jt:
        L.append(P('根太（%.2f）'%t,'box',(X0 if lv>=8 else IN+GW,t-0.04,zg0,X1 if lv>=8 else F-GW,t+0.04,zg1-0.003),WOOD,on=('けた（左）','けた（右）'),note='左右のけたにかける（Lv8〜は、けたの外へはね出す）'))
    bw=(F-IN)/8
    for k in range(8):
        y0=IN+k*bw+0.003;y1=IN+(k+1)*bw-0.003;nm='床板%d'%(k+1);a,b=IN+PW+0.003,F-PW-0.003
        if y1<=IN+PW+0.003 or y0>=F-PW-0.003:L.append(P(nm,'box',(a,y0,DZ-BT,b,y1,DZ),WOOD,on=('けた（うしろ）',) if k==0 else ('けた（前）',),note='柱と柱のあいだ'))
        elif y0<IN+PW:
            q=IN+PW+0.003;L.append(P(nm,'prism',([(a,y0),(b,y0),(b,q),(X1,q),(X1,y1),(X0,y1),(X0,q),(a,q)],DZ-BT,DZ,'z'),WOOD,on=('けた（左）','けた（右）'),note='柱の所を切りかいて、けたの上にくぎでとめる'))
        elif y1>F-PW:
            q=F-PW-0.003;L.append(P(nm,'prism',([(X0,y0),(X1,y0),(X1,q),(b,q),(b,y1),(a,y1),(a,q),(X0,q)],DZ-BT,DZ,'z'),WOOD,on=('けた（左）','けた（右）'),note='柱の所を切りかいて、けたの上にくぎでとめる'))
        else:L.append(P(nm,'box',(X0,y0,DZ-BT,X1,y1,DZ),WOOD,on=('けた（左）','けた（右）'),note='けた・根太の上にくぎでとめる'))
    OH=[]
    if lv>=8:   # はね出しの床：柱の外にはり・ふちげた・小げたを組み、床板をはる。根太の下に三角の方づえ
        for nm,(a,b) in (('左',(X0,IN)),('右',(F,X1))):
            fx=(X0,X0+0.08) if nm=='左' else (X1-0.08,X1)
            for side,y in (('うしろ',IN),('前',F-PW)):
                cy=y+PW/2;L.append(P('はね出しのはり（%s%s）'%(nm,side),'box',(a,cy-0.04,zg0,b,cy+0.04,zg1-0.003),WOOD,on=('柱（%s%s）'%(nm,side),),note='柱の外の面にボルトでとめる'))
                yy=(IN,IN+0.08) if side=='うしろ' else (F-0.08,F)
                L.append(P('はね出しの小げた（%s%s）'%(nm,side),'box',(a,yy[0],zg0,b,yy[1],zg1-0.003),WOOD,on=('はね出しのはり（%s%s）'%(nm,side),'柱（%s%s）'%(nm,side)),note='はりと柱にとめる'))
                OH+=['はね出しのはり（%s%s）'%(nm,side),'はね出しの小げた（%s%s）'%(nm,side)]
            L.append(P('はね出しのふちげた（%s）'%nm,'box',(fx[0],IN,zg0,fx[1],F,zg1-0.003),WOOD,on=('はね出しのはり（%sうしろ）'%nm,'はね出しのはり（%s前）'%nm,'根太（1.00）'),note='はり・根太のはしにとめる'));OH.append('はね出しのふちげた（%s）'%nm)
            for side,(c0,c1) in (('うしろ',(IN+0.003,IN+PW)),('前',(F-PW,F-0.003))):
                L.append(P('はね出しの床板（%s%s）'%(nm,side),'box',(a+0.003,c0,DZ-BT,b-0.003,c1,DZ),WOOD,on=('はね出しのはり（%s%s）'%(nm,side),),note='はりの上にくぎでとめる'))
            s_=-1 if nm=='左' else 1;u0=IN if nm=='左' else F
            for t in jt:
                L.append(P('はね出しの方づえ（%s%.2f）'%(nm,t),'prism',([(u0,zg0-0.24),(u0,zg0),(u0+s_*(EXT-0.02),zg0)],t-0.035,t+0.035),WOOD,on=('けた（%s）'%nm,'根太（%.2f）'%t),note='けたにボルトでとめ、根太をうける'))
    if lv<6:   # 方づえ
        D=0.34;bw2=0.08
        def brace(u0,s):return [(u0,zg0-D),(u0,zg0-D+bw2*1.414),(u0+s*(D-bw2*1.414),zg0),(u0+s*D,zg0)]
        for side,yy in (('前',(F-GW+0.02,F-0.02)),('うしろ',(IN+0.02,IN+GW-0.02))):
            for nm,u0,s in (('左',IN+PW,1),('右',F-PW,-1)):
                L.append(P('方づえ（%s・%s）'%(side,nm),'prism',(brace(u0,s),yy[0],yy[1]),WOOD,on=('柱（%s%s）'%(nm,side),'けた（%s）'%side),note='柱とけたにボルトでとめる'))
        for side,xx in (('左',(IN+0.02,IN+GW-0.02)),('右',(F-GW+0.02,F-0.02))):
            for nm,u0,s in (('うしろ',IN+PW,1),('前',F-PW,-1)):
                L.append(P('方づえ（%s・%s）'%(side,nm),'prism',(brace(u0,s),xx[0],xx[1],'x'),WOOD,on=('柱（%s%s）'%(side,nm),'けた（%s）'%side),note='柱とけたにボルトでとめる'))
    if 2<=lv<6:   # つなぎ・前の方づえ
        tw,th=0.08,0.10
        L.append(P('つなぎ（うしろ）','box',(IN+PW,IN,ZT-th,F-PW,IN+tw,ZT),WOOD,on=('柱（左うしろ）','柱（右うしろ）'),note='柱にボルトでとめる'))
        L.append(P('つなぎ（前）','box',(IN+PW,F-tw,ZT-th,F-PW,F,ZT),WOOD,on=('柱（左前）','柱（右前）'),note='柱にボルトでとめる。ハシゴもここにとめる'))
        L.append(P('つなぎ（左）','box',(IN,IN+PW,ZT-th,IN+tw,F-PW,ZT),WOOD,on=('柱（左うしろ）','柱（左前）'),note='柱にボルトでとめる'))
        L.append(P('つなぎ（右）','box',(F-tw,IN+PW,ZT-th,F,F-PW,ZT),WOOD,on=('柱（右うしろ）','柱（右前）'),note='柱にボルトでとめる'))
        for nm,u0,u1 in (('左',IN+PW,LX0-EW),('右',F-PW,LX1+EW)):
            s_=1 if nm=='左' else -1;w_=0.09
            L.append(P('前の方づえ（%s）'%nm,'prism',([(u0,ZT),(u0+s_*w_*1.3,ZT),(u1,zg0),(u1-s_*w_*1.3,zg0)],F-0.07,F-0.01),WOOD,on=('つなぎ（前）','けた（前）'),note='つなぎと、けたにとめる'))
    if lv>=6:   # 板かべ
        for wn,ax,(w0,w1),gn in (('前','y',(F-0.045,F-0.005),'前'),('うしろ','y',(IN+0.005,IN+0.045),'うしろ'),('左','x',(IN+0.005,IN+0.045),'左'),('右','x',(F-0.045,F-0.005),'右')):
            for i,(u0,u1) in enumerate(run(IN+PW,F-PW,0.0)):
                bx=(u0,w0,ZB,u1,w1,zg0) if ax=='y' else (w0,u0,ZB,w1,u1,zg0)
                L.append(P('板かべ（%s%d）'%(wn,i+1),'box',bx,WOOD,on=('かさ石2-2','けた（%s）'%gn),note='かさ石にのせ、けたにくぎでとめる'))
            if ax=='y':
                e0,e1=(F-0.005,F+0.007) if wn=='前' else (IN-0.007,IN+0.005)
                for k,zc in enumerate((ZB+0.30,zg0-0.30)):
                    L.append(MT(P('板かべの鉄の帯%d（%s）'%(k+1,wn),'box',(IN+PW,e0,zc-0.025,F-PW,e1,zc+0.025),IRON,on=('板かべ（%s1）'%wn,),note='板かべの外にまいて、くぎでとめる')))
    # さく
    zs=(DZ+RH,DZ+RH*0.5)
    for i,z in enumerate(zs):
        L.append(P('横木%d（うしろ）'%(i+1),'box',(IN+PW,IN,z-RT,F-PW,IN+RW,z),WOOD,on=('柱（左うしろ）','柱（右うしろ）'),note='柱にほぞでさしこむ'))
        L.append(P('横木%d（左）'%(i+1),'box',(IN,IN+PW,z-RT,IN+RW,F-PW,z),WOOD,on=('柱（左うしろ）','柱（左前）'),note='柱にほぞでさしこむ'))
        L.append(P('横木%d（右）'%(i+1),'box',(F-RW,IN+PW,z-RT,F,F-PW,z),WOOD,on=('柱（右うしろ）','柱（右前）'),note='柱にほぞでさしこむ'))
        L.append(P('横木%d（前・左）'%(i+1),'box',(IN+PW,F-RW,z-RT,LX0-EW,F,z),WOOD,on=('柱（左前）','はしの柱（左）'),note='柱とはしの柱にさしこむ'))
        L.append(P('横木%d（前・右）'%(i+1),'box',(LX1+EW,F-RW,z-RT,F-PW,F,z),WOOD,on=('柱（右前）','はしの柱（右）'),note='柱とはしの柱にさしこむ'))
    if lv<7:
        for t in (0.62,1.00,1.38):
            L.append(P('子柱（うしろ%.2f）'%t,'box',(t-BW/2,IN+0.01,DZ,t+BW/2,IN+RW-0.01,DZ+RH-RT),WOOD,on=('床板1',),note='床の上に立てて、横木を受ける'))
            L.append(P('子柱（左%.2f）'%t,'box',(IN+0.01,t-BW/2,DZ,IN+RW-0.01,t+BW/2,DZ+RH-RT),WOOD,on=('床板%d'%(1+int((t-IN)/bw)),),note='床の上に立てる'))
            L.append(P('子柱（右%.2f）'%t,'box',(F-RW+0.01,t-BW/2,DZ,F-0.01,t+BW/2,DZ+RH-RT),WOOD,on=('床板%d'%(1+int((t-IN)/bw)),),note='床の上に立てる'))
    if lv>=4:   # 腰板（Lv4〜6）・胸壁（Lv7〜）
        if lv>=7:pt=0.05;zb0=zg0;top=DZ+RH+0.12;tip=0.10;nm0='胸壁'
        else:pt=0.03;zb0=DZ-BT;top=zs[1];tip=0.0;nm0='腰板'
        def plank(u0,u1):m=(u0+u1)/2;return [(u0,zb0),(u1,zb0),(u1,top),(m,top+tip),(u0,top)] if tip else [(u0,zb0),(u1,zb0),(u1,top),(u0,top)]
        if lv>=8:
            segs=[('うしろ',run(X0,X1),'y',(IN-pt,IN-0.002),'うしろ','うしろ'),('左',run(IN,F),'x',(X0-pt,X0-0.002),'左','左'),('右',run(IN,F),'x',(X1+0.002,X1+pt),'右','右'),
                  ('前・左',run(X0,LX0-EW),'y',(F+0.002,F+pt),'前・左','前'),('前・右',run(LX1+EW,X1),'y',(F+0.002,F+pt),'前・右','前')]
        else:
            segs=[('うしろ',run(IN+PW,F-PW),'y',(IN-pt,IN-0.002),'うしろ','うしろ'),('左',run(IN+PW,F-PW),'x',(IN-pt,IN-0.002),'左','左'),('右',run(IN+PW,F-PW),'x',(F+0.002,F+pt),'右','右'),
                  ('前・左',run(IN+PW,LX0-EW),'y',(F+0.002,F+pt),'前・左','前'),('前・右',run(LX1+EW,F-PW),'y',(F+0.002,F+pt),'前・右','前')]
        for nm,us,ax,(w0,w1),rn,gn in segs:
            for i,(u0,u1) in enumerate(us):
                d=(plank(u0,u1),w0,w1,'x') if ax=='x' else (plank(u0,u1),w0,w1)
                sup=('横木2（%s）'%rn,'けた（%s）'%gn)+tuple(OH)
                L.append(P('%s（%s%d）'%(nm0,nm,i+1),'prism',d,WOOD,on=sup,note='横木・床のはしにくぎでとめる'))
            if lv>=9 and ax=='y':   # 胸壁の外の鉄の帯（前・うしろの面）
                a,b=us[0][0]-0.003,us[-1][1]+0.003;e0,e1=(w0-0.012,w0) if w0<1 else (w1,w1+0.012)
                for k,zc in enumerate((zs[0]-0.02,zg0+0.07)):
                    L.append(MT(P('胸壁の鉄の帯%d（%s）'%(k+1,nm),'box',(a,e0,zc-0.025,b,e1,zc+0.025),IRON,on=('%s（%s1）'%(nm0,nm),),note='胸壁の外にまいて、くぎでとめる')))
    for nm,x0 in (('左',LX0-EW),('右',LX1)):
        L.append(P('はしの柱（%s）'%nm,'box',(x0,F-EW,zg0,x0+EW,F,DZ+RH+0.04),WOOD,on=('けた（前）',),note='前のけたにボルトでとめ、床板をぬけて立てる'))
        L.append(P('はしの柱の頭（%s）'%nm,'box',(x0-0.025,F-EW-0.025,DZ+RH+0.04,x0+EW+0.025,F+0.025,DZ+RH+0.09),WOOD,on=('はしの柱（%s）'%nm,),note='柱の上にのせる'))
    # ハシゴ：前に、まっすぐ立てる。Lv6〜は土台のくぼみの中から
    LY=F+(0.012 if lv>=6 else 0.002)
    for nm,x0 in (('左',LX0),('右',LX1-SW)):
        L.append(P('ハシゴの柱（%s）'%nm,'box',(x0,LY,0,x0+SW,LY+0.078,DZ+0.40),WOOD,note='地面に立て、前のけたにボルトでとめる'))
    for i in range(1,int(DZ/0.27+1e-6)+1):
        z=i*0.27
        L.append(P('ハシゴの段%d'%i,'box',(LX0+SW,LY+0.014,z-0.045,LX1-SW,LY+0.064,z+0.005),WOOD,on=('ハシゴの柱（左）','ハシゴの柱（右）'),note='ハシゴの柱にさしこむ'))
    if lv>=5:   # あかり：Lv5〜 右前の柱、Lv10 は4本とも
        for nm,x,y in (posts if lv>=10 else [posts[3]]):
            cx=x+PW/2;front=y>1;sy=1 if front else -1;arm=0.20
            ay0=y+PW if front else y;ly=ay0+sy*(arm-0.05);zt=DZ+RH-0.02
            L.append(P('腕木（%s）'%nm,'box',(cx-0.025,min(ay0,ay0+sy*arm),zt-0.05,cx+0.025,max(ay0,ay0+sy*arm),zt),WOOD,on=('柱（%s）'%nm,),note='柱にほぞでさしこみ、くさびでとめる'))
            L.append(MT(P('くさり（%s）'%nm,'box',(cx-0.008,ly-0.008,zt-0.12,cx+0.008,ly+0.008,zt-0.05),IRON,on=('腕木（%s）'%nm,),note='腕木にかける')))
            h=0.17;w=0.065;zl=zt-0.12-0.03-h
            L.append(MT(P('ランタンのかさ（%s）'%nm,'pyr',(cx,ly,w+0.012,w+0.012,zl+h,zl+h+0.03),IRON,on=('くさり（%s）'%nm,),note='くさりにつるす')))
            g=P('ランタンのガラス（%s）'%nm,'box',(cx-w+0.008,ly-w+0.008,zl+0.02,cx+w-0.008,ly+w-0.008,zl+h),GLASS,on=('ランタンのかさ（%s）'%nm,),note='鉄のわくにはめる')
            g.glow=True;g.tex=False;g.decal=(lambda X,Y,Z,zl=zl,h=h:GLASSC if zl+h*0.25<Z<zl+h*0.65 else GLASS);L.append(g)
            L.append(MT(P('ランタンの台（%s）'%nm,'box',(cx-w,ly-w,zl,cx+w,ly+w,zl+0.02),IRON,on=('ランタンのガラス（%s）'%nm,),note='わくの下')))
            for sx in (-1,1):
                for sy2 in (-1,1):
                    bx=((cx+w-0.010,cx+w) if sx>0 else (cx-w,cx-w+0.010))+((ly+w-0.010,ly+w) if sy2>0 else (ly-w,ly-w+0.010))
                    L.append(MT(P('ランタンのわく（%s%d%d）'%(nm,sx,sy2),'box',(bx[0],bx[2],zl+0.02,bx[1],bx[3],zl+h),IRON,on=('ランタンの台（%s）'%nm,),note='わくの柱')))
    return L
