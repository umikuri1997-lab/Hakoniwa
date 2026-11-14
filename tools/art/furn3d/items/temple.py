# 神殿（statue）と、こわれた神殿（statueb）の共通の設計図。いまの絵と同じデザイン：白い石の基壇と段・前の2本の柱（金の輪）・左右とおくのかべ・
# 柱の上のはり・前うしろへのびる切妻の屋根（前の三角に金の星・てっぺんに金の星）・左右の青い旗（金の星）・まるい台の上にうかぶ水色の水晶・つた。
# 設計図（じっさいに建てられる組み方。単位はマス。神殿のマス（像のマス）の左上が(0,0)。大きさは、いまの絵（176×233ドット）に合わせる）
#   基壇の下段：石板（よこ0.34・おく0.29・あつさ0.13）を、よこ8まい×おく5まい、目地0.004であけてならべる。地面にすえる（x −0.86〜1.86）。
#   基壇の上段：同じ大きさの石板（あつさ0.16）を、よこ7まい×おく4まい。下段の上（x −0.69〜1.69・y −0.46〜0.70）。手前の0.26は下段がふみ段になる。
#   柱：前に2本（中心 x −0.17・1.17、y 0.50）。四角い台石（0.42角・0.10）→ まるい柱（半径0.15。石のつつ0.355ずつ4こ）→ 金の輪（下と上）→ 四角い柱頭（0.40角）。
#   かべ：おくだけ（x −0.66〜1.66・y −0.24〜−0.14）。左右はかべにしない。はりは、前の2本の柱とおくのかべにのり、左右のはしは、はり出す。かべ石（高さ0.2375・おく0.32）を6だん、だんごとに半分ずらしてつむ。
#     おくのかべの内がわには、青みのある灰色のしっくい（光がとどかない神殿の中）。
#   はり：柱頭とかべの上にのる石のはり（x −0.82〜1.82・y −0.46〜0.76、高さ1.72〜1.96）。石材を、よこ4本にわけてのせる（つなぎ目は柱・かべの上）。
#   屋根：むねから青い帯までは勾配、青い帯（軒の石板）の所でくっきり折れて、ほぼ平ら。はりの上に、前の三角（ペディメント）とおくの三角をのせ、そのあいだに、左右の屋根の石板（ながれ4まい×おく4まい、あつさ0.06）をはる。むね石を上に。
#   金の星：前の三角のまん中（うすい金の板）と、むねの前のはしの上（金の玉の上に、4つのとがりの星）。
#   旗：はりの前の左右のはしから、金のさおでつるす青い布（下はつばめの尾の形）。金の星のもよう。
#   水晶の台：神殿の中のまん中。まるい石の台2だん。その上に、ひし形の水晶がうく（光る）。
#   つた・草：段・柱の下に、小さな葉の玉。
from blueprint import Part as P
from common import *
import math,random,os
import oblique3d as O
STONETEX=O.Tex(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','textures','rock030.png'),span=2.0,flow=5,minrun=3,dark=(0.10,0.95),light=(0.07,1.03))   # 白い石の質感：うすい、ながれるむら（点のぶつぶつにしない）
ST=(248,238,232);ST2=(238,227,222);OLD=(234,226,220);OLD2=(222,213,208)
BACK=(176,180,212);EAVEC=(146,170,224);EAVEC0=(172,182,206);BACKO=(206,206,216)
GOLD=(236,196,98);GOLD0=(206,184,128)
BAN=(108,146,214);BAN0=(150,168,200);STARC=(244,212,110);STARC0=(214,198,150)
CRY=(118,192,248);CRY0=(176,192,204)
LEAF=(126,184,92);LEAF2=(150,200,104)
CL,CR,CYC,COLR=-0.17,1.17,0.50,0.15
EZ0,EZ1=1.66,1.82
RX0,RX1,RY0,RY1,RZ=-0.80,1.80,-0.30,0.80,2.36
MX=0.5
def S_(p):p.texobj=STONETEX;p.soft1=True;p.olk=0.96;return p   # 白い石：うすい石の質感（STONETEX）
def MT(p):p.metal=True;p.tex=False;return p
def GL(p):p.glow=True;p.tex=False;return p
def LF(p):p.tex=False;p.olk=0.86;p.deco=True;return p
def star(cx,cz,r,ri=None,n=4,rot=90):
    ri=ri or r*0.36;pts=[]
    for k in range(2*n):
        a=math.radians(rot+180*k/n);rr=r if k%2==0 else ri;pts.append((cx+rr*math.cos(a),cz+rr*math.sin(a)))
    return pts
def roofpath(sx):
    """屋根の勾配の折れ線（むね → 青い帯のはじまり → 青い帯のおわり → 軒のはし）。path(seg,t)→(x,z,外向きの法線)"""
    ex=RX0 if sx<0 else RX1
    P0=(MX,RZ);P1=(ex-sx*0.24,EZ1+0.05);P2=(ex-sx*0.12,EZ1+0.035);P3=(ex,EZ1+0.02)   # 青い帯の所で、くっきり折れて、ほぼ平らになる。青い帯の外は、白い石の軒
    def nrm(a,b):
        dx,dz=b[0]-a[0],b[1]-a[1];l=math.hypot(dx,dz);n=(-dz/l,dx/l)
        return n if n[1]>0 else (-n[0],-n[1])
    def path(seg,t):
        a,b=((P0,P1),(P1,P2),(P2,P3))[seg];return (a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,nrm(a,b))
    return path
def flute(cx):
    def f(x,y,z):   # 柱のたてのみぞ（16本）：みぞは、少しくらい石の色
        a=math.atan2(y-CYC,x-cx)
        return (226,214,212) if math.cos(16*a)>0.82 and 0.48<z<EZ0-0.30 else None
    return f
def slabs(name,x0,x1,nx,y0,y1,ny,z0,z1,col,on,skip=()):
    L=[];g=0.004;w=(x1-x0)/nx;d=(y1-y0)/ny
    for i in range(nx):
        for j in range(ny):
            if (i,j) in skip:continue
            c=col if (i*3+j*5)%4 else tuple(v-6 for v in col)
            L.append(S_(P('%s%d-%d'%(name,i+1,j+1),'box',(x0+i*w+g,y0+j*d+g,z0,x0+(i+1)*w-g,y0+(j+1)*d-g,z1),c,on=on,bevel=0.012,note='石板')))
    return L
def wall(name,x0,x1,y0,y1,z0,z1,col,top=None,on=()):
    """かべ石を6だん、だんごとに半分ずらしてつむ（いちばん長い向きにそって）。top(t)：こわれたかべの、その場所（0〜1）の高さ（なければ z1）"""
    L=[];n=6;h=(z1-z0)/n;g=0.003;alongx=(x1-x0)>(y1-y0);a0,a1=(x0,x1) if alongx else (y0,y1);ln=0.40
    for r in range(n):
        za=z0+r*h;zb=za+h-g;off=ln/2 if r%2 else 0.0;s=a0-off;k=0
        while s<a1-1e-6:
            e=min(a1,s+ln);sa=max(a0,s)
            t=((sa+e)/2-a0)/(a1-a0)
            if top is None or top(t)>=zb:
                b=(sa+g,y0,za,e-g,y1,zb) if alongx else (x0,sa+g,za,x1,e-g,zb)
                L.append(S_(P('%s%d-%d'%(name,r+1,k+1),'box',b,col if (r+k)%3 else tuple(v-6 for v in col),on=on if r==0 else tuple(p.name for p in L if p.name.startswith('%s%d-'%(name,r))),bevel=0.012,note='かべ石')))
            s=e;k+=1
    return L
def PARTS_T(ruin=False):
    s,s2=(OLD,OLD2) if ruin else (ST,ST2);L=[]
    L+=slabs('下段',-0.86,1.86,8,-0.36,0.96,4,0.0,0.10,s2,('ground',));LOW=tuple(p.name for p in L)
    L+=slabs('中段',-0.78,1.78,8,-0.33,0.84,4,0.10,0.20,s,LOW);MID=tuple(p.name for p in L if p.name.startswith('中段'))
    L+=slabs('上段',-0.70,1.70,7,-0.30,0.72,3,0.20,0.30,s2,MID);UP=tuple(p.name for p in L if p.name.startswith('上段'))
    for nm,x in(('左',CL),('右',CR)):   # 前の2本のまるい柱（はりの左右のはしは、柱とおくのかべから、はり出す）
        broken=ruin and nm in('右','右はし');nb=1 if nm=='右はし' else 2
        L.append(S_(P('%sの台石'%nm,'box',(x-0.21,CYC-0.21,0.30,x+0.21,CYC+0.21,0.40),s2,on=UP,bevel=0.015)))
        top=EZ0-0.12;nd=4;dh=(top-0.40)/nd
        for d in range(nd if not broken else nb):
            L.append(S_(P('%sの柱%d'%(nm,d+1),'cyl',(x,CYC,COLR,0.40+d*dh+0.002,0.40+(d+1)*dh),s,on=('%sの台石'%nm,) if d==0 else ('%sの柱%d'%(nm,d),),detail=40,grp='柱'+nm,note='石のつつ')));L[-1].texobj=None;L[-1].tex=False;L[-1].decal=flute(x)
        if broken:
            L.append(S_(P('%sの柱（おれた所）'%nm,'lathe',(x,CYC,[(0.0,0.40+nb*dh+0.10),(COLR*0.6,0.40+nb*dh+0.08),(COLR,0.40+nb*dh+0.03),(COLR,0.40+nb*dh)]),s,on=('%sの柱%d'%(nm,nb),),detail=40,grp='柱'+nm,note='おれた上')))
        L.append(MT(P('%sの金の輪（下）'%nm,'ring',(x,CYC,COLR-0.01,COLR+0.018,0.42,0.47),GOLD0 if ruin else GOLD,on=('%sの台石'%nm,),detail=40)))
        if not broken:
            L.append(MT(P('%sの金の輪（上）'%nm,'ring',(x,CYC,COLR-0.01,COLR+0.02,top-0.17,top-0.11),GOLD0 if ruin else GOLD,on=('%sの柱%d'%(nm,nd),),detail=40)))
            L.append(S_(P('%sの柱頭'%nm,'box',(x-0.20,CYC-0.20,top,x+0.20,CYC+0.20,EZ0),s,on=('%sの柱%d'%(nm,nd),),bevel=0.015)))
    rtop=lambda t:EZ0 if t<0.40 else max(0.62,EZ0-1.6*(t-0.40)+0.10*math.sin(t*41))   # こわれたおくのかべの高さ（右ほどくずれた。ぎざぎざ）
    L+=wall('おくのかべ',-0.66,1.66,-0.24,-0.14,0.30,EZ0,s2,top=rtop if ruin else None,on=UP)
    if not ruin:b=P('おくのかべの中','box',(-0.66,-0.14,0.30,1.66,-0.135,EZ0-0.002),BACK,on=UP,note='しっくい')
    else:   # こわれた神殿：しっくいは、のこったかべ石の上のはしより低く、ぎざぎざにはがれた形
        xs=[-0.66+2.32*k/40 for k in range(41)];top=[(x,rtop((x+0.66)/2.32)-0.10-0.05*abs(math.sin(x*23))) for x in xs]
        b=P('おくのかべの中','prism',([(-0.66,0.30),(1.66,0.30)]+top[::-1],-0.14,-0.135),BACKO,on=UP,note='しっくい（はがれた）')
    b.tex=False;b.soft1=True
    if not ruin:b.decal=lambda x,y,z:(206,220,246) if math.hypot(x-MX,(z-0.84)*0.8)<0.20 else (190,200,234) if math.hypot(x-MX,(z-0.84)*0.8)<0.33 else None   # 水晶の光が、おくのかべを明るくする
    L.append(b)
    # はり：石材4本（つなぎ目は柱・かべの上）
    cut=[RX0+0.04,CL,0.5,CR,RX1-0.04];by=(-0.30,0.76)
    for i in range(4):
        xa,xb=cut[i],cut[i+1]
        if ruin and i==3:continue   # 右はしの石材はおちた
        if ruin and i==2:   # まん中の右の石材は、とちゅうでおれた（左の柱頭とかべにかかって、のこる）
            pts=[(xa+0.002,EZ0),(xa+0.30,EZ0),(xa+0.36,EZ0+0.06),(xa+0.28,EZ0+0.11),(xa+0.40,EZ1),(xa+0.002,EZ1)]
            L.append(S_(P('はり%d'%(i+1),'prism',(pts,by[0],by[1]),s,on=('はり2',),note='右がおれた')));L[-1].deco=True
        else:L.append(S_(P('はり%d'%(i+1),'box',(xa+0.002,by[0],EZ0,xb-0.002,by[1],EZ1),s,on=('左の柱頭',) if i<2 else ('右の柱頭',),bevel=0.015,note='柱頭・かべの上')))
    # 屋根
    hw=(RX1-RX0)/2-0.14
    tri=[(MX-hw,EZ1),(MX+hw,EZ1),(MX,RZ-0.04)]
    tri0=tri
    if ruin:
        tri=[(MX-hw,EZ1),(MX+0.26,EZ1),(MX+0.20,EZ1+0.07),(MX+0.24,EZ1+0.13),(MX+0.10,EZ1+0.22),(MX+0.12,RZ-0.16),(MX,RZ-0.04)]
        tri0=[(MX-hw,EZ1),(MX+0.34,EZ1),(MX+0.42,EZ1+0.08),(MX+0.30,EZ1+0.16),(MX+0.32,RZ-0.24),(MX+0.18,RZ-0.12),(MX,RZ-0.04)]
    L.append(S_(P('前の三角','prism',(tri,0.70,0.76),s,bevel=0.012,on=('はり2',),note='はりの上')))
    L.append(S_(P('おくの三角','prism',(tri0,-0.30,-0.24),s2,on=('はり2',),note='はりの上')))
    # 屋根の石板：むねから青い帯までは勾配（ながれ4まい・おく2まいを半分ずらす）。青い帯（軒の石板）の所でくっきり折れて、ほぼ平ら
    nr,nc=5,2;th=0.06;BEV=0.012
    for side,sx in(('左',-1),('右',1)):
        ex=RX0 if sx<0 else RX1;path=roofpath(sx)
        ys=[RY0+(RY1-RY0)*c/nc for c in range(nc+1)]
        for r in range(nr+1):   # r=nr-1：青い帯、r=nr：その外の白い軒
            for c in range(nc+(r%2) if r<nr-1 else 1):
                if ruin and sx>0 and (r,c)!=(0,0):continue   # 右の屋根は、むねの近くのおくだけのこった
                if r%2:ya,yb_=max(RY0,RY0+(RY1-RY0)*(c-0.5)/nc),min(RY1,RY0+(RY1-RY0)*(c+0.5)/nc)   # 1だんごとに半分ずらす
                else:ya,yb_=ys[c],ys[c+1]
                if r>=nr-1:ya,yb_=RY0,RY1
                if r<nr-1:a,b=path(0,r/(nr-1)),path(0,(r+1)/(nr-1))
                else:a,b=path(r-nr+2,0.0),path(r-nr+2,1.0)
                n=a[2];pts=[(a[0]+n[0]*0.002,a[1]+n[1]*0.002),(b[0],b[1]),(b[0]+n[0]*th,b[1]+n[1]*th),(a[0]+n[0]*th,a[1]+n[1]*th)]
                if r<nr-1:   # すきま（目地）
                    d=(b[0]-a[0],b[1]-a[1]);ln=math.hypot(*d);d=(d[0]/ln*0.002,d[1]/ln*0.002);pts=[(pts[0][0]+d[0],pts[0][1]+d[1]),(pts[1][0]-d[0],pts[1][1]-d[1]),(pts[2][0]-d[0],pts[2][1]-d[1]),(pts[3][0]+d[0],pts[3][1]+d[1])]
                col=s if sx<0 else s2
                col=col if (r+c)%3 else tuple(v-5 for v in col)
                if r==nr-1:col=EAVEC0 if ruin else EAVEC   # 青い帯の石板は、青くぬる
                p=S_(P('%sの屋根%d-%d'%(side,r+1,c+1),'prism',(pts,ya+0.003,yb_-0.003),col,on=('前の三角','おくの三角'),bevel=BEV,note='三角の上にのせる'));p.deco=True;L.append(p)
    L.append(S_(P('むね','frust',((MX,RY0-0.02,RZ+0.03),(MX,(RY1 if not ruin else RY1-0.30)+0.04,RZ+0.03),0.065,0.065),s,on=('左の屋根1-1',),detail=24)));L[-1].deco=True
    # 屋根の前のふち（青い帯の所で折れる屋根にそって折れる、ふち石）・左右の軒のふち
    for side,sx in(('左',-1),('右',1)):
        if ruin and sx>0:continue
        ex=RX0 if sx<0 else RX1;path=roofpath(sx);t=0.13
        R_,B_,E_=path(0,0.0),path(1,0.0),path(2,1.0);nB=((R_[2][0]+E_[2][0])/2,(R_[2][1]+E_[2][1])/2)
        E2=(E_[0]+sx*0.03,E_[1]-0.02)
        pts=[(R_[0],R_[1]),(B_[0],B_[1]),E2,(E2[0]+E_[2][0]*t,E2[1]+E_[2][1]*t),(B_[0]+nB[0]*t,B_[1]+nB[1]*t),(R_[0]+R_[2][0]*t,R_[1]+R_[2][1]*t)]
        if sx>0:pts=pts[::-1]
        p=S_(P('%sのふち石'%side,'prism',(pts,RY1-0.04,RY1+0.06),s,on=('前の三角',),bevel=BEV,note='屋根の前のはし'));p.deco=True;L.append(p)
        x0,x1=(ex-0.05,ex+0.05)
        p=S_(P('%sの軒のふち'%side,'box',(x0+sx*0.03,RY0-0.02,EZ1-0.10,x1+sx*0.03,RY1+0.06,EZ1-0.01),s,on=('はり1',) if sx<0 else ('はり4',),bevel=BEV,note='軒のはし'));p.deco=True;L.append(p)
    L.append(S_(P('コーニス','box',(RX0+0.08 if True else 0,0.74,EZ1-0.03,(RX1-0.08) if not ruin else MX+0.24,0.84,EZ1+0.04),s,on=('はり2',),bevel=0.012,note='前の三角の下、はり出したふち')));L[-1].deco=True
    if not ruin:
        # 金の星
        L.append(MT(P('てっぺんの玉','ball',(MX,RY0+0.06,RZ+0.13,0.06),GOLD,on=('むね',),deco=True)))
        L.append(MT(P('前の玉','ball',(MX,RY1+0.05,RZ+0.11,0.055),GOLD,on=('むね',),deco=True)))
        # 水晶の台と水晶
        L.append(S_(P('水晶の台（下）','cyl',(MX,0.20,0.26,0.30,0.38),s2,on=UP,detail=40)))
        L.append(S_(P('水晶の台（上）','cyl',(MX,0.20,0.19,0.38,0.47),s,on=('水晶の台（下）',),detail=40)));L[-1].decal=lambda x,y,z:((210,236,252) if math.hypot(x-MX,y-0.20)<0.08 else (226,238,248) if math.hypot(x-MX,y-0.20)<0.13 else None) if z>0.465 else None
        for k,(dx,dz,r) in enumerate(((-0.25,0.80,0.022),(0.25,0.84,0.022),(-0.20,1.08,0.016),(0.22,1.04,0.016))):
            L.append(GL(P('光のつぶ%d'%(k+1),'ball',(MX+dx,0.20,dz-0.08,r),(214,240,255),on=(),deco=True)))
        cr=GL(P('水晶','lathe',(MX,0.20,[(0.0,1.06),(0.16,0.79),(0.0,0.52)]),CRY,detail=4,on=(),deco=True,note='台の上にうく'))
        cr.decal=lambda x,y,z:(226,246,255) if (x-MX)<-0.01 and z>0.79 else (170,222,252) if (x-MX)<0.02 else (92,162,234) if z<0.79 else None;L.append(cr)
    else:
        L.append(S_(P('水晶の台（下）','cyl',(MX,0.20,0.26,0.30,0.38),s2,on=UP,detail=40)))
        L.append(S_(P('水晶の台（上）','cyl',(MX,0.20,0.19,0.38,0.47),s,on=('水晶の台（下）',),detail=40)))
    # 旗
    for nm,x in(('左',-0.66),('右',1.66)):
        if ruin and nm=='右':continue
        bw=0.15;zt=EZ0-0.04;zb=(1.00 if not ruin else 1.24)
        L.append(MT(P('%sの旗のさお'%nm,'box',(x-bw-0.03,0.775,zt-0.01,x+bw+0.03,0.83,zt+0.05),GOLD0 if ruin else GOLD,on=('はり1',) if nm=='左' else ('はり4',),deco=True)))
        shape=[(x-bw,zt),(x+bw,zt),(x+bw,zb),(x,zb+0.10),(x-bw,zb)] if not ruin else [(x-bw,zt),(x+bw,zt),(x+bw,zb+0.06),(x+0.06,zb),(x-0.02,zb+0.08),(x-0.08,zb-0.02),(x-bw,zb+0.10)]
        f=P('%sの旗'%nm,'prism',(shape,0.78,0.80),BAN0 if ruin else BAN,on=('%sの旗のさお'%nm,),deco=True);f.tex=False;f.soft1=True
        sc_=star(x,zt-0.24,0.075)
        def deco(x_,y_,z_,x=x,zt=zt,zb=zb,bw=bw,ruin=ruin):
            # 金の星と、上のはしの金の帯
            if not ruin and z_<zb+0.10-abs(x_-x)/bw*0.10+0.045:return GOLD   # 下のつばめの尾のふちの金
            dx,dz=x_-x,z_-(zt-0.27);r=math.hypot(dx,dz);a=math.atan2(dz,dx)
            if r<0.095*(0.35+0.65*abs(math.cos(2*a))**3):return STARC0 if ruin else STARC
            return None
        f.decal=deco;L.append(f)
    return L
def vines(L,seed,ruin):
    """つた：段のすみ・柱の下から、段をつたって下へのびる、小さな葉のならび"""
    rd=random.Random(seed);k=0
    runs=[(CL-0.10,CYC+0.16,0.42,(-0.02,0.10),9),(CR+0.10,CYC+0.16,0.42,(0.03,0.10),9),(-0.62,0.70,0.30,(0.0,0.09),7),(1.62,0.70,0.30,(0.01,0.09),6),(0.25,0.95,0.13,(0.02,0.0),3),(-0.70,0.95,0.13,(0.03,0.0),3)]
    if ruin:runs+=[(-0.64,0.24,1.2,(0.0,0.0),6),(1.0,0.70,0.30,(0.03,0.04),5),(1.62,0.24,0.9,(0.0,0.0),5)]
    for x,y,z,(dx,dy),n in runs:
        for i in range(n):
            k+=1;zz=z-(0.0 if dy==0 and dx==0 else 0.0)
            if dy==0 and dx==0:zz=z-i*0.09   # かべをつたって下へ
            for q in range(2):   # 1か所に、葉を2まい（小さな葉のかたまり）
                k+=1;L.append(LF(P('葉%d'%k,'ball',(x+rd.uniform(-0.04,0.04),min(0.97,y+rd.uniform(-0.01,0.015)),max(0.03,zz+rd.uniform(-0.01,0.05)),rd.uniform(0.03,0.045),0.6),(LEAF,LEAF2,(104,164,80))[(i+q)%3],on=())))
            x+=dx+rd.uniform(-0.03,0.03);y+=dy
            if y>0.72 and z>0.2:z=0.15   # 上段のはしから、下段へ
            if y>0.96:y=0.96;z=max(0.03,z-0.07)
    return L
def tufts(L,spots,seed,n=7):
    """足もとの草むら：大きさのちがう葉の玉を、ひくくまとめる"""
    rd=random.Random(seed);k=len([p for p in L if p.name.startswith('草')])
    for x,y in spots:
        for i in range(n):
            k+=1;a=rd.uniform(0,6.283);r=rd.uniform(0,0.06)
            L.append(LF(P('草%d'%k,'ball',(x+r*math.cos(a),y+0.5*r*math.sin(a),0.03+rd.uniform(0,0.04)*(1-r/0.07),rd.uniform(0.035,0.055),0.75),LEAF if i%3 else LEAF2,on=())))
    return L
def star3d(sc,cx,y,cz,r,ri,h,col,n=4,back=0.02):
    """立体の星（金）：まん中が前へもり上がった、とがりごとに2つの面をもつ星。前の面（y の大きいほう）を向く。
    とがりの線（まん中 → さき）で面がおれるので、光の当たる面と、かげの面にわかれる"""
    pts=[(cx+(r if k%2==0 else ri)*math.cos(math.radians(90+180*k/n)),cz+(r if k%2==0 else ri)*math.sin(math.radians(90+180*k/n))) for k in range(2*n)]
    C=(cx,y+h,cz);m=len(pts);sc.material('metal');sc.part()
    for k in range(m):
        a,b=pts[k],pts[(k+1)%m];sc.tri(C,(a[0],y,a[1]),(b[0],y,b[1]),col)
        sc.quad((a[0],y,a[1]),(b[0],y,b[1]),(b[0],y-back,b[1]),(a[0],y-back,a[1]),col)
    sc.material(None)
def stars(sc):
    """神殿の金の星：前の三角のまん中と、てっぺん"""
    star3d(sc,MX,0.76,EZ1+0.24,0.22,0.08,0.12,GOLD)
    star3d(sc,MX,RY0+0.08,RZ+0.30,0.15,0.06,0.08,GOLD)
MOSSC=[(92,146,70),(120,178,88),(150,200,104),(176,214,120)]
def stairpt(x,t):
    """段をつたう道の上の点。t：0（上段の上、柱のそば y0.58）→ 上段の前のはし → 中段 → 下段 → 地面。かえす (y,z)"""
    P=[(0.56,0.30),(0.72,0.30),(0.72,0.20),(0.84,0.20),(0.84,0.10),(0.96,0.10),(0.96,0.0)]
    seg=[math.hypot(b[0]-a[0],b[1]-a[1]) for a,b in zip(P,P[1:])];tot=sum(seg);d=t*tot
    for (a,b),l in zip(zip(P,P[1:]),seg):
        if d<=l:f=d/l;return (a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f)
        d-=l
    return P[-1]
def moss(ruin,seed=11):
    """コケ・つた（粒）：地面・段のすみから、くねりながら段をのぼり、柱の下までのびるつた。
    くき（こい緑の小さな粒）にそって、大きさのちがう葉のかたまりがつき、ところどころで横へ枝わかれする。柱の下・段のすみには、こんもりしたコケ。
    粒は、面から少し手前（カメラのほう）にうかせて描く（面にかくれないように）"""
    rd=random.Random(seed);out=[]
    def put(x,y,z,r,c):out.append((x,y+0.025,z+0.02,r,c,-z))
    def leaf(x,y,z,s):   # 葉のかたまり：まん中ほど明るい
        for i in range(int(8+s*300)):
            a=rd.uniform(0,6.283);d=s*rd.random()**0.6
            c=MOSSC[min(3,int(rd.random()*2+(1.6 if d<s*0.45 else 0.2)))]
            put(x+d*math.cos(a),y,z+0.6*d*math.sin(a),rd.uniform(0.010,0.016),c)
    def vine(x,t0,t1,ph,amp,side_ok=True):
        t=t0;a=ph;k=0
        while t>t1:   # 下（t 大）から上（t 小）へのぼる
            y,z=stairpt(x,t);xx=x+amp*math.sin(a)
            put(xx,y,z,0.008,MOSSC[0])   # くき
            if k%2==0:leaf(xx+rd.uniform(-0.025,0.025),y,z,rd.uniform(0.022,0.050))
            if side_ok and rd.random()<0.06:   # 横への枝
                d=rd.choice((-1,1));L_=rd.uniform(0.08,0.18);n=int(L_/0.02)
                for q in range(n):
                    put(xx+d*q*0.02,y,z+0.01*math.sin(q),0.008,MOSSC[0])
                    if q%3==2:leaf(xx+d*q*0.02,y,z,rd.uniform(0.012,0.028))
            a+=rd.uniform(0.04,0.22);t-=0.018;k+=1
        leaf(x+amp*math.sin(a),*stairpt(x,t1),0.035)
    vine(CL-0.18,1.0,0.02,0.0,0.05);vine(CR+0.17,1.0,0.10,2.0,0.06);vine(-0.55,1.0,0.35,1.0,0.04)
    vine(1.48,0.95,0.45,3.0,0.05);vine(0.28,1.0,0.78,0.5,0.03,False)
    if ruin:vine(0.92,1.0,0.15,1.5,0.05);vine(-0.20,1.0,0.60,2.5,0.04)
    for x,y,z,sz in((CL-0.17,CYC+0.17,0.40,0.06),(CR+0.17,CYC+0.17,0.40,0.05),(-0.70,0.93,0.10,0.04),(1.72,0.93,0.10,0.045),(-0.62,0.70,0.30,0.035)):leaf(x,y,z,sz)   # 柱の下・段のすみのコケ
    if ruin:
        for x,z in((-0.50,0.9),(-0.20,1.2),(1.20,0.7),(1.45,0.55)):leaf(x,-0.13,z,0.045)   # おくのかべをつたうコケ
    return out
def grass(spots,seed,flowers=(),n=200,R=0.13,H=0.22):
    """足もとの草むら（粒）：地面から、こんもりした葉の粒。下はこい色、上ほど明るい。flowers：白い花（花びら5つと黄色いしん）の場所"""
    rd=random.Random(seed);out=[]
    for x,y in spots:
        for i in range(n):
            a=rd.uniform(0,6.283);d=R*rd.random()**0.7;h=H*(1-(d/R)**2)**0.5*rd.uniform(0.3,1.0)
            t=h/H;c=MOSSC[0 if t<0.3 else 1 if t<0.6 else 2 if t<0.85 else 3]
            out.append((x+d*math.cos(a),y+0.5*d*math.sin(a),h,rd.uniform(0.010,0.016),c,-h))
    for x,y,z in flowers:
        for q in range(5):
            an=2*math.pi*q/5+0.3;out.append((x+0.026*math.cos(an),y+0.014*math.sin(an),z+0.018*math.sin(an),0.016,(252,250,242),-9))
        out.append((x,y+0.008,z,0.014,(244,206,90),-10))
    return out
def gbox(spots,R=0.13,H=0.22):   # 草むらの粒がとどく所（写す範囲に入れる。furn3d の PBOX）
    return [q for x,y in spots for q in((x-R,y,0),(x+R,y,0),(x,y,H+0.02),(x,y+R*0.5,0))]
def fallen_crystal(sc):
    """こわれた神殿の水晶：光をうしない、台からころげおちて、上の段の床にたおれている（ひし形の玉の軸を、ほぼ横にたおす）"""
    cx,cy,cz=MX+0.30,0.38,0.30+0.10;L=0.36;R_=0.10;ang=math.radians(72);rot=math.radians(30)
    ax=(math.sin(ang)*math.cos(rot),math.sin(ang)*math.sin(rot),math.cos(ang))   # 軸の向き
    up=(0,0,1);u=(ax[1]*up[2]-ax[2]*up[1],ax[2]*up[0]-ax[0]*up[2],ax[0]*up[1]-ax[1]*up[0]);ul=math.hypot(*u);u=tuple(q/ul for q in u)
    v=(ax[1]*u[2]-ax[2]*u[1],ax[2]*u[0]-ax[0]*u[2],ax[0]*u[1]-ax[1]*u[0])
    P_=lambda a,b,c:(cx+ax[0]*a+u[0]*b+v[0]*c,cy+ax[1]*a+u[1]*b+v[1]*c,cz+ax[2]*a+u[2]*b+v[2]*c)
    T,B=P_(L*0.55,0,0),P_(-L*0.45,0,0);E=[P_(0,R_*math.cos(k*math.pi/2+0.4),R_*math.sin(k*math.pi/2+0.4)) for k in range(4)]
    sc.part();cols=[(196,210,222),(170,186,200),(150,166,182),(184,198,212)]
    for k in range(4):sc.tri(T,E[k],E[(k+1)%4],cols[k]);sc.tri(B,E[(k+1)%4],E[k],cols[(k+2)%4])
