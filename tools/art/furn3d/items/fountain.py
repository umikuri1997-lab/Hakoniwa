# 噴水（fountain、2×2マス）：石をつんだ、まるい池。まん中に台と上のはち。ふき出し口から水がふき上がって、はちへおち、
# はちのふちの4つの口からあふれて、池へおちる（6コマで動く）。
# 設計図（じっさいに作れる組み方。単位はマス。はばは、いまの絵（2マス）に合わせた）
#   底石：池の中の床。うすい円板（半径 RI+0.02・高さ0〜0.03）。地面におく。
#   池のかべ：石を1だんならべる。NS こ、同じ大きさのまがった石（外の半径 RO・内の半径 RI・高さ CH）。
#   笠石：かべの上に NS こ。かべより少し外・内へ出る（RI-0.02〜RO+0.02・あつさ 0.06）。下のだんと同じならび。
#   台：底石の上にたてる、くびれた石の柱（lathe、高さ BH まで）。
#   上のはち：台の上の、まるい石のはち（外の半径 BR）。はちの体（BH〜BW-RH）の上に、ふちの石を4こ（RH の高さ）。
#     ふちの石のあいだ4か所は、はちの体の上にのせた、外へつき出た石の口（あふれ口）。口の上の面はふちより RH ひくい。
#   ふき出し口：はちのまん中の、小さな石のつぼみ。
# 水の流れ（すじは、コマで流れる向きに動く）
#   ふき上がる水・おちる水は、粒（PWATER）。どの粒も、重さで放物線をえがく（コマでループ）。
#   ふき出し口 → まっすぐ上へ（てっぺんは JZ のあたり）→ 外へひろがって、はちの水面へおちる。
#   はちの水面は、あふれ口の上の面より少し上 → 4つの口の上を外へ流れ、口のさきから放物線で池の水面へ。おちた所で、しぶきの粒がはねる。
#   池の水・はちの水はすける（'clear'、さざなみがコマで外へひろがる）。
from blueprint import Part as P
from common import *
import math
ID='fountain';SZ=(2,2);BOTTOM=126;GRAD=True;FRAMES=8;FULLPERSP=True
VIEWS=[('fountain',0)]
FR=0
CX,CY=1.0,1.0;RO=0.94;RI=0.78;CH=0.20;NS=16;CT=0.06
STONE=(246,238,226);FLOOR=(150,178,196);WATER=(72,178,240);SKY=(200,234,252);JET=(150,212,248);JETM=(196,232,252);JETL=(240,250,255)
BH=0.50;BR=0.32;RH=0.05;BW=0.64   # 上のはち：底の高さ・外の半径・ふちの石の高さ・ふちのてっぺん
LIPA=[math.radians(a) for a in(45,135,225,315)];LIPW=0.08;LIPO=0.07   # あふれ口：場所・はば・つき出る長さ
LZ=BW-RH                  # あふれ口の上の面
WZ=CH-0.04             # 池の水面
BWZ=LZ+0.008             # はちの水面
JZ=BW+0.32               # ふき上がる水のてっぺん
def ST(p):p.tex=False;return p
def arc(r0,r1,a0,a1,n=6):   # まがった石の上から見た形
    o=[(CX+r1*math.cos(a0+(a1-a0)*i/n),CY+r1*math.sin(a0+(a1-a0)*i/n)) for i in range(n+1)]
    return o+[(CX+r0*math.cos(a1-(a1-a0)*i/n),CY+r0*math.sin(a1-(a1-a0)*i/n)) for i in range(n+1)]
def PARTS():
    L=[ST(P('底石','cyl',(CX,CY,RI+0.02,0,0.03),FLOOR,detail=64,note='地面におく'))]
    da=2*math.pi/NS;gap=0.004
    for c in range(1):
        z0,z1=c*CH,(c+1)*CH;sh=da/2*c
        for i in range(NS):
            a0=i*da+sh+gap;a1=(i+1)*da+sh-gap
            L.append(ST(P('かべの石%d-%d'%(c+1,i+1),'prism',(arc(RI,RO,a0,a1),z0,z1-0.002,'z'),STONE,on=('ground',) if c==0 else tuple('かべの石1-%d'%(j+1) for j in range(NS)),note='地面におく' if c==0 else '下のだんに半こずらしてのせる')))
    for i in range(NS):
        a0=i*da+gap;a1=(i+1)*da-gap
        L.append(ST(P('笠石%d'%(i+1),'prism',(arc(RI-0.02,RO+0.02,a0,a1),CH,CH+CT,'z'),STONE,on=tuple('かべの石1-%d'%(j+1) for j in range(NS)),note='かべの上にのせる')))
    L.append(ST(P('台','lathe',(CX,CY,[(0.0,0.03),(0.18,0.03),(0.16,0.09),(0.11,0.16),(0.085,0.24),(0.085,0.36),(0.11,0.44),(0.15,BH),(0.0,BH)]),STONE,detail=48,on=('底石',),note='底石の上にたてる')))
    L.append(ST(P('はちの体','lathe',(CX,CY,[(0.0,BH),(0.16,BH),(0.27,BH+0.04),(BR,LZ-0.03),(BR,LZ),(BR-0.05,LZ),(BR-0.07,BH+0.06),(0.0,BH+0.05)]),STONE,detail=48,on=('台',),note='台の上にのせる')))
    hw=(LIPW/2)/BR   # あふれ口のはば（角度）
    for i,a in enumerate(LIPA):   # ふちの石：あふれ口のあいだ
        a0=a+hw;a1=LIPA[(i+1)%4]+(2*math.pi if i==3 else 0)-hw
        L.append(ST(P('はちのふち%d'%(i+1),'prism',(arc(BR-0.05,BR,a0,a1,n=10),LZ,BW,'z'),STONE,on=('はちの体',),note='はちの体の上にのせる')))
    for i,a in enumerate(LIPA):   # あふれ口：はちの体の上にのせ、外へつき出す（上の面に水のみぞ）
        c,s=math.cos(a),math.sin(a);u=(-s,c)
        r0,r1=BR-0.06,BR+LIPO
        pts=[(CX+r*c+w*u[0],CY+r*s+w*u[1]) for r,w in((r0,-LIPW/2),(r1,-LIPW/2),(r1,LIPW/2),(r0,LIPW/2))]
        L.append(ST(P('あふれ口%d'%(i+1),'prism',(pts,LZ-0.035,LZ,'z'),STONE,on=('はちの体',),note='はちの体のふちにのせ、外へつき出す')))
    L.append(ST(P('ふき出し口','lathe',(CX,CY,[(0.0,BH+0.05),(0.06,BH+0.05),(0.07,BH+0.10),(0.05,BWZ+0.04),(0.025,BWZ+0.07),(0.0,BWZ+0.07)]),STONE,detail=32,on=('はちの体',),note='はちのまん中')))
    return L
def EXTRA(sc):
    ph=FR/FRAMES
    def pool(zw,r,ripk):   # すける水面。さざなみは、まん中から外へひろがる（コマで動く）
        def col(x,y):t=max(0,min(1,(CY+r*0.2-y)/(r*1.2)))**1.4;return tuple(WATER[k]*(1-t)+SKY[k]*t for k in range(3))
        def disk(u,v):U,V=2*u-1,2*v-1;return (CX+r*U*math.sqrt(max(0,1-V*V/2)),CY+r*V*math.sqrt(max(0,1-U*U/2)))
        def top(x,y):
            X,Y=disk((x-(CX-r))/(2*r),(y-(CY-r))/(2*r));d=math.hypot(X-CX,Y-CY)
            return zw+0.006*math.sin(d*ripk-ph*2*math.pi)
        sc.material('clear');hfield(sc,CX-r,CY-r,CX+r,CY+r,top,lambda x,y:col(*disk((x-(CX-r))/(2*r),(y-(CY-r))/(2*r))),n=(56,56),shape=disk);sc.material(None)
    pool(WZ,RI-0.004,22)
    pool(BWZ,BR-0.055,40)
RUN=0.12   # あふれ口のさきから、おちる所までの長さ
PBOX=[(CX,CY,JZ+0.03)]   # 粒のとどく所（見え方のはんいに入れる）
PCOL=[JETL,JETM,JET,JET]   # 粒の色（白っぽい・水色）
def PWATER():
    """粒の水。重さ（g=1）で、どの粒も放物線。粒ごとの年は (コマ/FRAMES + 生まれる時) のあまり（ループ）"""
    import random;t=FR/FRAMES;P=[]
    rnd=random.Random(7);z0=BWZ+0.06;H=JZ-z0;vz=math.sqrt(2*H)
    for i in range(360):   # ふき上がる水：上へ、少しずつ外へひろがり、はちの水面へおちる
        ph=rnd.random();an=rnd.uniform(0,2*math.pi);land=rnd.uniform(0.10,0.22);h=H*rnd.uniform(0.85,1.05);v=math.sqrt(2*h)
        T=v+math.sqrt(2*(h+z0-BWZ));vr=land/T;tau=((t+ph)%1.0)*T
        r=vr*tau;z=z0+v*tau-tau*tau/2
        P.append((CX+r*math.cos(an),CY+r*math.sin(an),z,rnd.uniform(0.010,0.016),rnd.choice(PCOL),0))
    for a in LIPA:   # あふれ口：口の上を外へ流れ、さきから池へおちる
        c,s=math.cos(a),math.sin(a);u=(-s,c);d=LZ+0.012-WZ;Tf=math.sqrt(2*d)
        for i in range(130):
            ph=rnd.random();w=rnd.uniform(-0.022,0.022);age=(t+ph)%1.0;run=RUN*rnd.uniform(0.85,1.1)
            if age<0.3:r=BR-0.05+(LIPO+0.05)*age/0.3;z=LZ+0.012   # 口の上
            else:tau=(age-0.3)/0.7*Tf;r=BR+LIPO+run/Tf*tau;z=LZ+0.012-tau*tau/2
            P.append((CX+r*c+w*u[0],CY+r*s+w*u[1],z,rnd.uniform(0.011,0.017),rnd.choice(PCOL),0))
        lx,ly=CX+(BR+LIPO+RUN)*c,CY+(BR+LIPO+RUN)*s
        for i in range(20):   # しぶき：おちた所で、まわりへはねる
            ph=rnd.random();an=rnd.uniform(0,2*math.pi);age=(t+ph)%1.0;up=rnd.uniform(0.03,0.06);v=math.sqrt(2*up);T=2*v;tau=age*T;rr=rnd.uniform(0.02,0.06)*age
            P.append((lx+rr*math.cos(an),ly+rr*math.sin(an),WZ+v*tau-tau*tau/2,0.009,JETL,0))
    return P
