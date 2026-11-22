# 柵・塀のドアと門を、3Dで組んで、ゲームの見え方（oblique3d.game）のドット絵に写す（fence3d.py と同じやり方）。
# 使い方：python3 tools/art/fence3d/doors3d.py <出力フォルダ> [id...] [--chips]
#   id：gate（柵のドア）・logdoor（丸太の塀のドア）・loggate（丸太の大門）・sdoor（石の塀のドア）・stonegate（石の大門）・misugaki.gate（御簾垣の戸）
#   コマ：<id>#h0〜h3（よこ置き。0しまる→3ひらく）・<id>#v0〜v3（たて置き。gate・logdoor・sdoor）。<id>（アイコン）は #h0 と同じ絵。
#   とびらは、ちょうつがいのたての軸のまわりに、じっさいにまわして写す（0・30・60・85度）。よこ置きは手前（南）へ、たて置きは東へひらく。
#
# 設計図（マス。u＝柵ののびる向き・w＝おく行き。よこ置きは x=u・y=w、たて置きは x=w・y=u）
#   よこ置きの柱は、マスのさかい（u=0・1、大門は 0・2）にまたがって立つ。右どなりの柵・塀は、柱にかかる所を描かない（ゲームの GLX＝柱のはばの半分）。
#   たて置きの柱は、マスの中（u 0〜・〜1）に立つ（下のマスの柵が、あとから柱の上に描かれないように）。
#   柵のドア：柱 0.16角・高さ1.0（四角すいの先）。とびら：くい3〜4まい（はば0.16・あつさ0.05・先は三角）・横木2本・すじかい（Z）・ちょうつがい・取っ手。
#   丸太の塀のドア：柱は半径0.2（たては0.15）・高さ1.33の丸太、鉄の輪と根もとの石。とびら：丸太（半径0.1）・板2まい・鉄の帯・輪の取っ手。
#   丸太の大門：柱は半径0.22・高さ1.5、とびら2まい（丸太4本ずつ）。
#   石の塀のドア：石の柱 0.36角（石3だん＋かさ石）。とびら：上のまるい板戸（たて板・鉄の帯2本・輪の取っ手）。
#   石の大門：石の柱 0.4角・高さ1.2、板戸2まい。
#   御簾垣の戸：竹の柱（マスの中）、とびらは竹のわくに御簾（細い竹をよこにつむ）。
#   白い塀のドア（風）：白い柱 0.18角・高さ1.02、上に水色の玉（たて置きはマスの中）。とびら：上のまるい白い板3まい・水色の横木・白い横木・取っ手。
#   ロープの戸（風。ロープの手すりのとなりの柵のドアの絵 ropefence.gate#h0〜3・#v0〜3）：アカシアの丸い柱、とびらは細いわくにロープ3本。
#   入場ゲート（風）：白い柱 0.22角・高さ1.6、水色の玉。上に白い横木（高さ1.42〜1.54）と、そこからつるした布の三角の旗5まい（うすい色）。とびら2まい（白い板・水色の横木）。
import sys,os,math
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
import fence3d as F
from fence3d import Part,tube,FENCEC,NAIL,LOGC,IRON,STONE,ST,STC,CRM,CRMP,PARKW,PARKB
import numpy as np
from PIL import Image
DOORW=(176,118,72);DOORD=(150,98,60)   # 石の塀のドア・石の大門の板戸の木の色
ANG=[0,30,60,85]
class B:
    """u・w の向きで部品を書き、よこ置き（x=u,y=w）・たて置き（x=w,y=u）へなおす"""
    def __init__(s,v):s.v=v;s.P=[]
    def xy(s,u,w):return (w,u) if s.v else (u,w)
    def box(s,kind,nm,u0,w0,z0,u1,w1,z1,col,org=None,grp=None):
        (x0,y0),(x1,y1)=s.xy(u0,w0),s.xy(u1,w1);s.P.append((kind,Part(nm,'box',(min(x0,x1),min(y0,y1),z0,max(x0,x1),max(y0,y1),z1),col,grp=grp),org))
    def tube(s,kind,nm,a,b,r,col,org=None,det=12):
        A=(*s.xy(a[0],a[1]),a[2]);Bq=(*s.xy(b[0],b[1]),b[2]);s.P.append((kind,tube(nm,A,Bq,r,col,det),org))
    def log(s,nm,u,w,z1,r,col=LOGC,org=None):x,y=s.xy(u,w);s.P.append(('log',Part(nm,'log',((x,y,0),(x,y,z1),r),col),org))
    def cyl(s,kind,nm,u,w,r,z0,z1,col,org=None):x,y=s.xy(u,w);s.P.append((kind,Part(nm,'cyl',(x,y,r,z0,z1),col),org))
    def ball(s,nm,u,w,z,r,col=STONE):x,y=s.xy(u,w);s.P.append(('stone',Part(nm,'ball',(x,y,z,r,0.6),col),None))
    def pyr(s,kind,nm,u,w,h,z0,z1,col):x,y=s.xy(u,w);s.P.append((kind,Part(nm,'pyr',(x,y,h,h,z0,z1),col),None))
    def prism(s,kind,nm,pts,w0,w1,col,org=None):   # 正面（u・z）の形を、おくへのばす
        s.P.append((kind,Part(nm,'prism',(pts,w0,w1,'x') if s.v else (pts,w0,w1),col),org))
    def plate(s,kind,nm,a,b,w,t,col,org=None):
        A=(*s.xy(a[0],a[1]),a[2]);Bq=(*s.xy(b[0],b[1]),b[2]);s.P.append((kind,Part(nm,'plate',(A,Bq,w,t),col),org))
    def hinge(s,hu,hw,deg):
        """ここまでの「とびら」の部品（leaf=True で足した物）を、ちょうつがい (hu,hw) のまわりにまわす印をつける"""
        hx,hy=s.xy(hu,hw);return ('rot',hx,hy,(-deg if s.v else deg))
def leaf(b,rot,fn):
    """fn(b) で足した部品を、とびらとして rot でまわす"""
    n0=len(b.P);fn(b)
    for i in range(n0,len(b.P)):k,p,_=b.P[i];b.P[i]=(k,p,rot)
def gate(v,n):
    b=B(v);W0,W1=(0.885,0.945) if not v else (0.45,0.51);PW=0.865 if not v else 0.5;FR=W1
    posts=[0.0,1.0] if not v else [0.08,0.92];h=0.08
    for pu in posts:b.box('post','柱',pu-h,PW-h,0,pu+h,PW+h,0.92,FENCEC);b.P.append(('post',Part('柱の先','pyr',(*b.xy(pu,PW),h,h,0.92,1.0),FENCEC),None))
    u0,u1=posts[0]+h,posts[1]-h;rot=b.hinge(u0,FR+0.04,ANG[n])
    def body(b):
        k=4 if not v else 3;wd=0.15;sp=(u1-u0-0.02-wd)/(k-1)
        for i in range(k):
            c=u0+0.01+wd/2+i*sp;b.prism('picket','くい',[(c-wd/2,0.04),(c+wd/2,0.04),(c+wd/2,0.84),(c,0.93),(c-wd/2,0.84)],W0,W1,FENCEC)
        for z0,z1 in((0.60,0.72),(0.18,0.30)):b.box('railh','横木',u0+0.01,FR,z0,u1-0.01,FR+0.04,z1,FENCEC)
        b.plate('railh','すじかい',(u0+0.06,FR+0.02,0.30),(u1-0.06,FR+0.02,0.60),0.04,0.09,FENCEC)
        for z in(0.66,0.24):b.box('iron','ちょうつがい',u0+0.0,FR+0.04,z-0.035,u0+0.10,FR+0.055,z+0.035,(96,96,104))
        b.box('iron','取っ手',u1-0.08,FR+0.04,0.42,u1-0.04,FR+0.07,0.50,(96,96,104))
    leaf(b,rot,body);return b.P,((-0.2,1.2) if not v else (0,1))
def logdoor(v,n):
    b=B(v);PW=0.76 if not v else 0.5;PR=0.2 if not v else 0.15;posts=[0.0,1.0] if not v else [0.15,0.85]
    for pu in posts:
        b.log('柱',pu,PW,1.33,PR);b.cyl('iron','鉄の輪',pu,PW,PR+0.018,1.02,1.12,IRON)
        for k in range(5):a=math.pi*(0.1+0.8*k/4);b.ball('石',pu+math.cos(a)*(PR+0.02),PW+math.sin(a)*(PR+0.02),0.02,0.055)
    u0,u1=posts[0]+PR,posts[1]-PR;LW=PW+0.06;FR=LW+0.1;rot=b.hinge(u0,FR,ANG[n])
    def body(b):
        k=max(2,round((u1-u0)/0.2));r=(u1-u0)/k/2
        for i in range(k):b.log('丸太',u0+r+2*r*i,LW,1.02,r)
        for z0,z1 in((0.62,0.74),(0.18,0.30)):
            b.box('railh','板',u0+0.02,FR,z0,u1-0.02,FR+0.04,z1,LOGC)
            for bu in(u0+0.06,u1-0.06):b.box('iron','鉄の帯',bu-0.025,FR-0.006,z0-0.012,bu+0.025,FR+0.05,z1+0.012,IRON)
        b.cyl('iron','輪の取っ手',u1-0.09,FR+0.055,0.035,0.44,0.46,IRON) if not v else b.box('iron','取っ手',u1-0.1,FR+0.04,0.42,u1-0.06,FR+0.07,0.5,IRON)
    leaf(b,rot,body);return b.P,((-0.4,1.4) if not v else (0,1))
def loggate(v,n):
    b=B(0);PW=0.76;PR=0.22
    for pu in(0.0,2.0):
        b.log('柱',pu,PW,1.5,PR)
        for z in(1.02,0.4):b.cyl('iron','鉄の輪',pu,PW,PR+0.018,z,z+0.1,IRON)
        for k in range(5):a=math.pi*(0.1+0.8*k/4);b.ball('石',pu+math.cos(a)*(PR+0.02),PW+math.sin(a)*(PR+0.02),0.02,0.06)
    LW=PW+0.06;FR=LW+0.1
    for side in(0,1):
        u0,u1=(PR,1.0) if side==0 else (1.0,2-PR);hu=u0 if side==0 else u1;rot=('rot',hu,FR,ANG[n] if side==0 else -ANG[n])
        def body(b,u0=u0,u1=u1,side=side):
            k=4;r=(u1-u0)/k/2
            for i in range(k):b.log('丸太',u0+r+2*r*i,LW,1.14,r)
            for z0,z1 in((0.70,0.82),(0.18,0.30)):
                b.box('railh','板',u0+0.02,FR,z0,u1-0.02,FR+0.04,z1,LOGC)
                for bu in(u0+0.06,u1-0.06):b.box('iron','鉄の帯',bu-0.025,FR-0.006,z0-0.012,bu+0.025,FR+0.05,z1+0.012,IRON)
            hu2=u1-0.1 if side==0 else u0+0.1;b.cyl('iron','輪の取っ手',hu2,FR+0.055,0.035,0.48,0.5,IRON)
        leaf(b,rot,body)
    return b.P,(-0.4,2.4)
def pillar(b,pu,PW,hw,nc,ch):
    for c in range(nc):b.box('stone','柱の石',pu-hw,PW-hw,c*ch,pu+hw,PW+hw,(c+1)*ch,ST,org=(pu%1,20+c))
    b.box('stone','柱のかさ',pu-hw-0.03,PW-hw-0.03,nc*ch,pu+hw+0.03,PW+hw+0.03,nc*ch+0.12,STC,org=(pu%1,30))
def planks(b,u0,u1,w0,w1,top,col,arch=False):
    k=max(3,round((u1-u0)/0.11));wd=(u1-u0)/k;cu=(u0+u1)/2;R_=(u1-u0)/2
    for i in range(k):
        a,c=u0+i*wd,u0+(i+1)*wd
        if arch:   # 上のまるい戸：板ごとに、上のはしを円にそって切る
            f=lambda u:top-R_+math.sqrt(max(0,R_*R_-(u-cu)**2));pts=[(a,0.02),(c,0.02)]+[(c-(c-a)*j/4,f(c-(c-a)*j/4)) for j in range(5)]
        else:pts=[(a,0.02),(c,0.02),(c,top),(a,top)]
        b.prism('door','板',pts,w0,w1,col if i%2==0 else DOORD)
def sdoor(v,n):
    b=B(v);PW=0.8 if not v else 0.5;hw=0.18 if not v else 0.15;posts=[0.0,1.0] if not v else [0.15,0.85]
    for pu in posts:pillar(b,pu,PW,hw,3,0.32)
    u0,u1=posts[0]+hw,posts[1]-hw;W0,W1=PW-0.03,PW+0.03;rot=b.hinge(u0,W1,ANG[n])
    def body(b):
        planks(b,u0,u1,W0,W1,0.98,DOORW,arch=True)
        for z in(0.22,0.62):b.box('iron','鉄の帯',u0+0.01,W1,z,u1-0.01,W1+0.015,z+0.05,IRON)
        b.cyl('iron','輪の取っ手',u1-0.08,W1+0.03,0.03,0.42,0.44,IRON) if not v else b.box('iron','取っ手',u1-0.09,W1,0.4,u1-0.05,W1+0.03,0.48,IRON)
    leaf(b,rot,body);return b.P,((-0.3,1.3) if not v else (0,1))
def stonegate(v,n):
    b=B(0);PW=0.8;hw=0.2
    for pu in(0.0,2.0):pillar(b,pu,PW,hw,3,0.37)
    W0,W1=PW-0.03,PW+0.03
    for side in(0,1):
        u0,u1=(hw,1.0) if side==0 else (1.0,2-hw);hu=u0 if side==0 else u1;rot=('rot',hu,W1,ANG[n] if side==0 else -ANG[n])
        def body(b,u0=u0,u1=u1,side=side):
            planks(b,u0,u1,W0,W1,1.0,DOORW)
            for z in(0.2,0.7):b.box('iron','鉄の帯',u0+0.01,W1,z,u1-0.01,W1+0.015,z+0.05,IRON)
            hu2=u1-0.08 if side==0 else u0+0.08;b.cyl('iron','輪の取っ手',hu2,W1+0.03,0.03,0.46,0.48,IRON)
        leaf(b,rot,body)
    return b.P,(-0.3,2.3)
def misugate(v,n):
    b=B(0);PW=0.9;posts=[0.06,0.94];H=0.98
    for pu in posts:
        b.tube('crm','親柱',(pu,PW,0),(pu,PW,H+0.08),0.055,CRMP,det=16)
        for z in(0.35,0.7):b.tube('crm','ふし',(pu,PW,z),(pu,PW,z+0.02),0.06,CRMP,det=16)
    u0,u1=posts[0]+0.055,posts[1]-0.055;rot=b.hinge(u0,PW+0.03,ANG[n])
    def body(b):
        for z in(0.04,H):b.tube('crm','わく',(u0,PW,z),(u1,PW,z),0.03,CRMP)
        for u in(u0+0.03,u1-0.03):b.tube('crm','わく',(u,PW,0.04),(u,PW,H),0.03,CRMP)
        for k in range(18):z=0.09+k*(H-0.16)/17;b.tube('crm','御簾',(u0+0.05,PW,z),(u1-0.05,PW,z),0.022,F.CRM,det=8)
        for bu in((u0+u1)/2,):b.box('crm','押縁',bu-0.02,PW+0.022,0.06,bu+0.02,PW+0.048,H-0.04,CRMP)
    leaf(b,rot,body);return b.P,(0,1)
PFLAG=[(246,196,196),(250,226,170),(190,222,240),(206,232,196),(222,206,240)]   # 入場ゲートの旗の色（うすい赤・黄・水色・緑・むらさき）
def parkboards(b,u0,u1,W0,W1,FR,top):
    """白い塀のとびら：上のまるい白い板をすきまなくならべ、前に水色の横木と白い横木"""
    k=max(2,round((u1-u0)/0.25));wd=(u1-u0-0.02)/k;w=wd/2-0.004
    for i in range(k):
        c=u0+0.01+wd/2+i*wd;b.prism('picket','板',[(c-w,0.04),(c+w,0.04),(c+w,top-0.08),(c+w*0.6,top-0.02),(c,top),(c-w*0.6,top-0.02),(c-w,top-0.08)],W0,W1,PARKW)
    b.box('railh','横木',u0+0.01,FR,0.56,u1-0.01,FR+0.04,0.65,PARKB);b.box('railh','横木',u0+0.01,FR,0.12,u1-0.01,FR+0.04,0.20,PARKW)
def parkpost(b,pu,PW,h,z1):
    b.box('post','柱',pu-h,PW-h,0,pu+h,PW+h,z1,PARKW);x,y=b.xy(pu,PW);b.P.append(('cap',Part('柱の玉','ball',(x,y,z1+0.06,h*0.9,1.0),PARKB),None))
def parkdoor(v,n):
    b=B(v);W0,W1=(0.885,0.945) if not v else (0.45,0.51);PW=0.865 if not v else 0.5;FR=W1;h=0.09
    posts=[0.0,1.0] if not v else [0.09,0.91]
    for pu in posts:parkpost(b,pu,PW,h,1.02)
    u0,u1=posts[0]+h,posts[1]-h;rot=b.hinge(u0,FR+0.04,ANG[n])
    def body(b):
        parkboards(b,u0,u1,W0,W1,FR,0.86)
        b.box('iron','取っ手',u1-0.08,FR+0.04,0.40,u1-0.04,FR+0.07,0.48,(150,150,160))
    leaf(b,rot,body);return b.P,((-0.2,1.2) if not v else (0,1))
def parkgate(v,n):
    b=B(0);PW=0.865;W0,W1=0.885,0.945;FR=W1;h=0.11
    for pu in(0.0,2.0):parkpost(b,pu,PW,h,1.6)
    b.box('railh','上の横木',-0.08,PW-0.06,1.42,2.08,PW+0.06,1.54,PARKW)
    for i in range(5):   # 布の三角の旗（横木からつるす）
        c=0.3+i*0.35;b.prism('flag','旗',[(c-0.1,1.42),(c+0.1,1.42),(c,1.24)],PW+0.07,PW+0.09,PFLAG[i])
    for side in(0,1):
        u0,u1=(h,1.0) if side==0 else (1.0,2-h);hu=u0 if side==0 else u1;rot=('rot',hu,FR+0.04,ANG[n] if side==0 else -ANG[n])
        def body(b,u0=u0,u1=u1,side=side):
            parkboards(b,u0+0.005,u1-0.005,W0,W1,FR,0.96)
            hu2=u1-0.08 if side==0 else u0+0.04;b.box('iron','取っ手',hu2,FR+0.04,0.44,hu2+0.04,FR+0.07,0.52,(150,150,160))
        leaf(b,rot,body)
    return b.P,(-0.4,2.4)
def ropedoor(v,n):   # ロープの戸（風）：アカシアの丸い柱（半径0.08・高さ0.85、たて置きはマスの中）。とびら：アカシアの細いわく（上・下・はし）に、ロープを3本と、なかほどをむすぶロープ
    b=B(v);PW=0.865 if not v else 0.5;FR=PW+0.03;r=0.08
    posts=[0.0,1.0] if not v else [0.09,0.91]
    for pu in posts:
        b.cyl('post','柱',pu,PW,r,0,0.85,F.ACAC,(0,0))
        for z in(0.62,0.34):b.cyl('rope','巻いたロープ',pu,PW,r+0.01,z-0.035,z+0.035,F.ROPED)
    u0,u1=posts[0]+r,posts[1]-r;rot=b.hinge(u0,FR,ANG[n])
    def body(b):
        for z in(0.70,0.12):b.box('railh','わく',u0+0.01,FR-0.02,z,u1-0.01,FR+0.02,z+0.06,F.ACAC,(0,0))
        for uu in(u0+0.01,u1-0.07):b.box('post','わく',uu,FR-0.02,0.12,uu+0.06,FR+0.02,0.76,F.ACAC,(0,0))
        for z in(0.58,0.44,0.30):b.tube('rope','ロープ',(u0+0.06,FR,z),(u1-0.06,FR,z),0.022,F.ROPE)
        c=(u0+u1)/2;b.tube('rope','むすぶロープ',(c,FR+0.005,0.18),(c,FR+0.005,0.70),0.022,F.ROPED)
    leaf(b,rot,body);return b.P,((-0.2,1.2) if not v else (0,1))
def ashidoor(v,n):   # あしの戸（水。あしの垣のとなりの柵のドアの絵）：木の丸い柱、とびらは細い木のわくに、あしをならべ、なわでしばる
    b=B(v);PW=0.865 if not v else 0.5;FR=PW+0.02;r=0.07
    posts=[0.0,1.0] if not v else [0.09,0.91]
    for pu in posts:b.cyl('post','柱',pu,PW,r,0,0.95,F.RPOST,(0,0))
    u0,u1=posts[0]+r,posts[1]-r;rot=b.hinge(u0,FR,ANG[n])
    def body(b):
        for z in(0.74,0.08):b.box('railh','わく',u0+0.01,FR-0.02,z,u1-0.01,FR+0.02,z+0.05,F.RPOST,(0,0))
        k=9;sp=(u1-u0-0.06)/(k-1)
        for i in range(k):c=u0+0.03+i*sp;b.cyl('reed','あし',c,FR,0.03,0.08,0.80,F.REED if i%3 else F.REEDG)
        for z in(0.26,0.58):b.tube('rope','なわ',(u0+0.02,FR+0.035,z),(u1-0.02,FR+0.035,z),0.02,F.BIND)
    leaf(b,rot,body);return b.P,((-0.2,1.2) if not v else (0,1))
def rankandoor(v,n):   # 欄干の戸（水。運河の石の欄干のとなりの柵のドアの絵）：石の柱（0.2角・高さ0.86、かさ石）、とびらは鉄のわくに、たての鉄の棒
    b=B(v);PW=0.865 if not v else 0.5;FR=PW+0.02;h=0.10;IR=(150,156,168)
    posts=[0.0,1.0] if not v else [0.11,0.89]
    for pu in posts:b.box('stone','石の柱',pu-h,PW-h,0,pu+h,PW+h,0.80,F.RSTN);b.box('stone','かさ石',pu-h-0.02,PW-h-0.02,0.80,pu+h+0.02,PW+h+0.02,0.86,F.RSTN)
    u0,u1=posts[0]+h,posts[1]-h;rot=b.hinge(u0,FR,ANG[n])
    def body(b):
        for z in(0.60,0.10):b.box('iron','わく',u0+0.01,FR-0.015,z,u1-0.01,FR+0.015,z+0.04,IR)
        k=6;sp=(u1-u0-0.06)/(k-1)
        for i in range(k):c=u0+0.03+i*sp;b.box('iron','棒',c-0.012,FR-0.012,0.10,c+0.012,FR+0.012,0.68,IR)
    leaf(b,rot,body);return b.P,((-0.2,1.2) if not v else (0,1))
def ibaradoor(v,n):   # いばらの戸（闇。いばらの生垣のとなりの柵のドアの絵）：古木のくい、とびらは古木の細いわくに、いばらのくきをからめる
    b=B(v);PW=0.865 if not v else 0.5;FR=PW+0.02;r=0.06;OLD=(150,132,120)
    posts=[0.0,1.0] if not v else [0.09,0.91]
    for pu in posts:b.cyl('post','くい',pu,PW,r,0,0.85,OLD,(0,0))
    u0,u1=posts[0]+r,posts[1]-r;rot=b.hinge(u0,FR,ANG[n])
    def body(b):
        for z in(0.72,0.08):b.box('railh','わく',u0+0.01,FR-0.02,z,u1-0.01,FR+0.02,z+0.05,OLD,(0,0))
        for uu in(u0+0.01,u1-0.06):b.box('post','わく',uu,FR-0.02,0.08,uu+0.05,FR+0.02,0.77,OLD,(0,0))
        b.plate('railh','すじかい',(u0+0.05,FR,0.12),(u1-0.05,FR,0.70),0.04,0.03,OLD,(0,0))
        import math as _m
        for z,ph in((0.24,0.0),(0.44,1.7),(0.62,3.1)):
            pts=[(u0+0.03+(u1-u0-0.06)*i/8,FR+0.035,z+0.05*_m.sin(i*1.5+ph)) for i in range(9)]
            b.P.append(('vine',F.Part('くき','tube',([(*b.xy(p[0],p[1]),p[2]) for p in pts],0.024),F.IBS),None))
    leaf(b,rot,body);return b.P,((-0.2,1.2) if not v else (0,1))
def kuzuredoor(v,n):   # くずれた欄干の戸（闇）：欄干の戸と同じ形で、こけむした灰色の石
    P,xr=rankandoor(v,n)
    for k,p,o in P:p.col=F.MSTONE if p.col==F.RSTN else p.col
    return P,xr
def biggate(n,STN,cap,bars,top):   # 水・闇の大門：石の柱2本（0.24角・高さ1.40、かさ石）と、鉄のとびら2まい（わく・たての棒・上のかざり）
    b=B(0);PW=0.865;FR=0.885;h=0.12;IR=(146,152,164)
    for pu in(0.0,2.0):
        b.box('stone','石の柱',pu-h,PW-h,0,pu+h,PW+h,1.40,STN)
        b.box('stone','かさ石',pu-h-0.03,PW-h-0.03,1.40,pu+h+0.03,PW+h+0.03,1.48,STN)
        cap(b,pu,PW)
    for side in(0,1):
        u0,u1=(h,1.0) if side==0 else (1.0,2-h);hu=u0 if side==0 else u1;rot=('rot',hu,FR,ANG[n] if side==0 else -ANG[n])
        def body(b,u0=u0,u1=u1):
            for z in(1.02,0.10):b.box('iron','わく',u0+0.01,FR-0.015,z,u1-0.01,FR+0.015,z+0.04,IR)
            for uu in(u0+0.01,u1-0.04):b.box('iron','わく',uu,FR-0.015,0.10,uu+0.03,FR+0.015,1.06,IR)
            k=bars;sp=(u1-u0-0.08)/(k-1)
            for i in range(k):c=u0+0.04+i*sp;b.box('iron','棒',c-0.012,FR-0.012,0.14,c+0.012,FR+0.012,1.02,IR)
            top(b,u0,u1,FR,IR)
        leaf(b,rot,body)
    return b.P,(-0.4,2.4)
def canalgate(v,n):   # 運河の町の門（水）：うすい青みの灰色の石の柱に、ランプの玉。鉄のとびらの上は、ゆるい弓の形
    def cap(b,pu,PW):x,y=b.xy(pu,PW);b.P.append(('glow',F.Part('ランプの玉','ball',(x,y,1.56,0.07,1.0),(255,224,150)),None))
    def top(b,u0,u1,FR,IR):
        import math as _m
        pts=[(u0+0.02+(u1-u0-0.04)*t,FR,1.06+0.10*_m.sin(_m.pi*t)) for t in [i/8 for i in range(9)]]
        b.P.append(('iron',F.Part('弓','tube',([(*b.xy(p[0],p[1]),p[2]) for p in pts],0.018),IR),None))
    return biggate(n,F.RSTN,cap,6,top)
def irongate(v,n):   # 古い庭の鉄の門（闇）：こけむした灰色の石の柱に、月光石の玉。鉄のとびらの上に、三日月のかざり
    def cap(b,pu,PW):x,y=b.xy(pu,PW);b.P.append(('glow',F.Part('月光石','ball',(x,y,1.56,0.07,1.0),(214,230,252)),None))
    def top(b,u0,u1,FR,IR):
        import math as _m
        c=(u0+u1)/2;pts=[(c+0.10*_m.cos(_m.radians(a)),FR,1.16+0.10*_m.sin(_m.radians(a))) for a in range(-60,241,30)]
        b.P.append(('iron',F.Part('三日月','tube',([(*b.xy(p[0],p[1]),p[2]) for p in pts],0.016),IR),None))
        for uu in(u0+0.06,u1-0.06):b.P.append(('iron',F.Part('やりの先','cone',(*b.xy(uu,FR),0.02,1.06,1.16),IR),None))
    return biggate(n,F.MSTONE,cap,5,top)
DOORS={'canalgate':(canalgate,False),'irongate':(irongate,False),'ibara.gate':(ibaradoor,True),'kuzure.gate':(kuzuredoor,True),'ashifence.gate':(ashidoor,True),'rankan.gate':(rankandoor,True),'ropefence.gate':(ropedoor,True),'gate':(gate,True),'logdoor':(logdoor,True),'loggate':(loggate,False),'sdoor':(sdoor,True),'stonegate':(stonegate,False),'misugaki.gate':(misugate,False),'parkdoor':(parkdoor,True),'parkgate':(parkgate,False)}
def build_door(iid):
    fn,hasv=DOORS[iid];out={}
    for o in(['h','v'] if hasv else ['h']):
        for n in range(4):
            P,xr=fn(o=='v',n);out[iid+'#'+o+str(n)]=F.render(P,xr)
    return out
if __name__=='__main__':
    out=sys.argv[1];os.makedirs(out,exist_ok=True);ids=[a for a in sys.argv[2:] if not a.startswith('-')] or list(DOORS);R={}
    for iid in ids:
        res=build_door(iid);R[iid]=res
        ks=list(res);can=Image.new('RGBA',(sum(res[k][0].width+60 for k in ks)+40,260),(150,190,120,255));x=30
        for k in ks:
            im,ax,ay=res[k];can.alpha_composite(im,(x,150+ay));x+=im.width+60;print(k,im.size,ax,ay)
        can.resize((can.width*3,can.height*3),Image.NEAREST).save(os.path.join(out,iid+'_x3.png'))
    if '--chips' in sys.argv:
        sys.path.insert(0,os.path.join(F.ROOT,'tools'));import chips as CHP
        head,CC=CHP.load_imgs();names=[]
        for iid,res in R.items():
            for k,(im,ax,ay) in res.items():CC[k]={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':[im]};names.append(k)
            if iid+'#h0' in res and (iid in CC or iid in('parkdoor','parkgate','canalgate','irongate')):im,ax,ay=res[iid+'#h0'];CC[iid]={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':[im]};names.append(iid)
        CHP.pack_imgs(head,CC);open(os.path.join(F.ROOT,'.chips_changed'),'a').write('\n'+'\n'.join(names));print('チップに入れた',len(names))
