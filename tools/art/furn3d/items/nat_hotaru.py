# ヨルボシの草むら（hotaru、草原の夜の守りの植物）：ワスレグサ（ヘメロカリス）の作りの株。夜に光るドットは、ゲームのコード（hotaruDots）が上にかさねる。つぼみは昼も見える。
# 植物の作り（持ち主がきめた：ほんとうの植物の作りで組む）
#   株もと（クラウン）：3つ（大きい株1・小さい株2）。葉も花のくきも、ここからだけ出る。
#   葉：株ごとに、1まいの面（扇）にそって、左右にかわるがわる出る（2列にならぶ葉）。根もとは、さや（はば0.018）で、たがいにかさなる。中ほど（長さの3わり）がいちばん広く（0.046）、さきへ細くとがる。
#       まん中にすじがあり、少しV字におれる（すじを0.006もちあげる）。うちがわの葉ほど立ち、そとの葉ほど外へ弓なりにたれる（重さで、さきほどまがる。さきは水平より下へたらしすぎない）。
#   花のくき（花茎）：大きい株のまん中（葉のさやの中）から2本。根もとが太く（0.011）さきほど細い（0.006）。葉より上へのび、ゆるくまがる（まっすぐにしない）。
#   枝分かれ：くきのさきで、2〜3本の短い枝にわかれる。わかれ目に、小さな葉（苞）。枝は、画面のよこへひらく。
#   つぼみ：枝のさきに、短い柄（小花柄）で2つずつ。がくにつつまれた細長い形（はば0.026・長さ0.12）で、さきがとがる（まるい玉にしない）。大きさがちがう（さきにひらく物ほど大きい）。根もとは緑、さきほどうすい黄緑。
import math,random
import numpy as np
ID='hotaru';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
from natcommon import SUN
LIGHT=SUN
VIEWS=[('hotaru',0)]
CX,CY=0.5,0.5
DARK=(84,150,104);LITE=(150,204,128)   # 葉（根もと→さき）。草原のベリーの茂みより少し青みの緑
STEM=(112,170,108);BRACT=(128,184,116);BUD=[(150,196,120),(206,228,148),(236,244,184)]   # つぼみ（根もと→さき）
SCR=math.radians(-45)   # 画面の右の向き（クォータービューで、物は45度まわる）
def V(*a):return np.array(a,float)
def unit(v):return v/np.linalg.norm(v)
def PARTS():return[]
def leaf(sc,base,e,n,L,th0,bend,wmax):
    """葉：base から、面（e：扇の向き・n：扇の面の向き）の中で、e のほうへ th0 たおれて立ち、さきほど bend まがる"""
    m=14;pts=[];p=base.copy();a=th0
    for i in range(m+1):
        pts.append(p.copy());t=i/m;a=th0+bend*t**1.6
        p=p+(L/m)*(math.sin(a)*e+math.cos(a)*V(0,0,1))
    zt=max(q[2] for q in pts)
    def col(x,y,z):
        u=min(2,int(3*z/max(zt,1e-6)))/2;return tuple(DARK[k]+(LITE[k]-DARK[k])*u for k in range(3))
    sc.decal(col);sc.part()
    def wid(t):return 0.018+(wmax-0.018)*(t/0.3) if t<0.3 else wmax*((1-t)/0.7)**0.9+0.001   # さや→中ほどがいちばん広い→さきへとがる
    for i in range(m):
        t0,t1=i/m,(i+1)/m;a0,a1=pts[i],pts[i+1];d=unit(a1-a0);up=unit(np.cross(d,n))   # up：葉の面の、おもての向き
        if up[2]<0:up=-up
        w0,w1=wid(t0)/2,wid(t1)/2;k0,k1=0.006*(w0/wmax*2),0.006*(w1/wmax*2)
        L0,M0,R0=a0-n*w0,a0+up*k0,a0+n*w0;L1,M1,R1=a1-n*w1,a1+up*k1,a1+n*w1   # すじ（M）をもちあげて、V字に
        sc.quad(L0,M0,M1,L1,DARK);sc.quad(M0,R0,R1,M1,DARK)
def fan(sc,c,az,nl,L,rd):
    """株：扇の面の向き az に、nl まいの葉を左右かわるがわる。うちほど立って短く、そとほどたれて長い"""
    e=V(math.cos(az),math.sin(az),0);n=V(-math.sin(az),math.cos(az),0)
    for j in range(nl):
        s=1 if j%2 else -1;r=j//2/max(1,(nl-1)//2)   # 0：うち 1：そと
        b=c+e*s*0.004*(j//2)
        leaf(sc,b,e*s,n,L*(0.72+0.28*r)*rd.uniform(0.94,1.06),math.radians(6+26*r),math.radians(20+38*r),0.046)
def taper(sc,pts,r0,r1,col):   # くき：根もとが太く、さきほど細い管
    sc.part()
    for k in range(len(pts)-1):
        a,b=pts[k],pts[k+1];d=unit(b-a);u=np.cross(d,[0,0,1.0]);u=unit(u) if np.linalg.norm(u)>1e-6 else V(1,0,0);v=np.cross(d,u)
        ra=r0+(r1-r0)*k/(len(pts)-1);rb=r0+(r1-r0)*(k+1)/(len(pts)-1)
        for i in range(6):
            t0,t1=2*math.pi*i/6,2*math.pi*(i+1)/6
            sc.quad(a+ra*(math.cos(t0)*u+math.sin(t0)*v),b+rb*(math.cos(t0)*u+math.sin(t0)*v),b+rb*(math.cos(t1)*u+math.sin(t1)*v),a+ra*(math.cos(t1)*u+math.sin(t1)*v),col)
def curve(p0,d0,L,bend_axis,ang,m=8):   # 長さ L を、bend_axis のまわりに ang だけ、ゆるくまげながらのばす
    pts=[p0.copy()];p=p0.copy();d=unit(d0)
    for i in range(m):
        th=ang/m;k=unit(bend_axis);d=d*math.cos(th)+np.cross(k,d)*math.sin(th)+k*np.dot(k,d)*(1-math.cos(th))
        p=p+d*(L/m);pts.append(p.copy())
    return pts,d
def bract(sc,p,d,side):   # 苞：わかれ目の、小さなとがった葉
    u=unit(np.cross(d,[0,0,1.0])) if abs(d[2])<0.99 else V(1,0,0);q=unit(d*0.5+u*side*0.9)
    sc.decal(None);sc.part();sc.tri(p-u*0.009,p+u*0.009,p+q*0.045,BRACT)
def bud(sc,b,d,s):
    """つぼみ：がくにつつまれた、さきのとがった細長い形。s：大きさ（1が、いちばん大きい）"""
    PROF=[(0.0,0.0),(0.007,0.006),(0.011,0.022),(0.013,0.045),(0.012,0.070),(0.008,0.094),(0.004,0.110),(0.0,0.120)]
    u=np.cross(d,[0,0,1.0]);u=unit(u) if np.linalg.norm(u)>1e-6 else V(1,0,0);v=np.cross(d,u);n=10;Ln=PROF[-1][1]*s
    def col(x,y,z):
        t=float(np.dot(V(x,y,z)-b,d))/Ln;return BUD[0] if t<0.25 else BUD[1] if t<0.62 else BUD[2]
    sc.decal(col);sc.part()
    ring=lambda r,h,a:b+d*h*s+r*s*(math.cos(a)*u+math.sin(a)*v)
    for j in range(len(PROF)-1):
        (r0,h0),(r1,h1)=PROF[j],PROF[j+1]
        for i in range(n):
            a0,a1=2*math.pi*i/n,2*math.pi*(i+1)/n
            sc.quad(ring(r0,h0,a0),ring(r1,h1,a0),ring(r1,h1,a1),ring(r0,h0,a1),BUD[0])
    sc.decal(None)
def scape(sc,c,lean_az,H,rd,seed):
    """花のくき：株のまん中から、ゆるくまがってのび、さきで枝分かれして、柄つきのつぼみ"""
    la=V(math.cos(lean_az),math.sin(lean_az),0);ax=np.cross(V(0,0,1),la)
    pts,d=curve(c+V(0,0,0.01),V(0,0,1)+la*0.08,H,ax,math.radians(22))
    sc.decal(None);taper(sc,pts,0.011,0.006,STEM);top=pts[-1]
    for k,(off,ang,ln,bs) in enumerate(((-1,40,0.08,(1.0,0.62)),(1,35,0.07,(0.92,0.55)),(0,8,0.05,(0.78,0.5)))):   # 枝：左・右・まん中
        sr=V(math.cos(SCR),math.sin(SCR),0);side=unit(sr-d*np.dot(sr,d))   # 枝は、画面のよこへひらく（おくへひらくと、画面でかさなる）
        bd=unit(d*math.cos(math.radians(ang))+side*off*math.sin(math.radians(ang)))
        bp,bdir=curve(top,bd,ln,np.cross(bd,V(0,0,1)) if abs(bd[2])<0.99 else V(1,0,0),math.radians(-18*abs(off)),m=4)
        taper(sc,bp,0.006,0.0045,STEM);bract(sc,top,bd,off or 1)
        for q,(pa,sz) in enumerate(zip((0,1),bs)):   # つぼみ2つ：枝のさきと、枝のとちゅう
            at=bp[-1] if q==0 else bp[len(bp)//2]
            pd=unit(bdir*0.7+V(0,0,1)*0.6+side*(off or (1 if q else -1))*0.25*(q*2-1 or 1))
            pp=[at,at+pd*0.022];taper(sc,pp,0.004,0.0035,STEM)   # 小花柄
            bud(sc,pp[-1],pd,sz)
def EXTRA(sc):
    rd=random.Random(7);sc.smooth(True);sc.outline(None,0.86)
    fan(sc,V(CX,CY,0),SCR,8,0.60,rd)   # 大きい株：扇の面は画面のよこ
    fan(sc,V(CX-0.10,CY+0.06,0),SCR+math.radians(55),6,0.50,rd)
    fan(sc,V(CX+0.09,CY-0.07,0),SCR-math.radians(50),6,0.50,rd)
    scape(sc,V(CX,CY,0),SCR+math.radians(180),0.66,rd,0.0)
    scape(sc,V(CX+0.01,CY-0.005,0),SCR+math.radians(20),0.56,rd,1.2)
