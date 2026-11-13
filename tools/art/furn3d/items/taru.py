# たる（taru）：ふくらんだ形のたる板（あつみつき）・鉄の輪2本（金属）・ふたの板3まい（たる板の内がわ、ふちより少し下）。丸い物なので EXTRA で組む。
import math
from common import *
ID='taru';BOTTOM=44
VIEWS=[('taru',0)]
CX,CY=0.5,0.62;H=0.62;N=12
def R(z):return 0.324+0.06*math.sin(math.pi*z/H)   # たる板のふくらみ（まん中がいちばん太い）。はばは前の1.2倍（高さはそのまま）
def PARTS():return []   # 丸い物なので、ぜんぶ EXTRA で組む
TH=0.035   # たる板のあつみ
SUB=3      # 1まいのたる板を、横に分ける数（まるめる）
HOOP=0.006 # 鉄の輪が、たる板から出る長さ
def EXTRA(sc):
    import oblique3d as O,os
    T=O.Tex(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','textures','wood049.png'))
    sc.texture(T);NZ=10;ZL=H-0.025   # ふたは、たる板のふちより少し下
    for i in range(N):   # たる板の外の面：1まいずつべつの部品（さかいに輪郭線が入る）
        sc.tag('板');sc.part();col=WOOD if i%2 else WOOD2
        p=lambda a,z,d=0:(CX+(R(z)-d)*math.cos(a),CY+(R(z)-d)*math.sin(a),z)
        for u in range(SUB):   # 1まいの板を、横に SUB に分けてまるめる（まわりの形をなめらかに）
            a0=2*math.pi*(i+u/SUB)/N;a1=2*math.pi*(i+(u+1)/SUB)/N
            for j in range(NZ):
                z0=H*j/NZ;z1=H*(j+1)/NZ;sc.quad(p(a0,z0),p(a1,z0),p(a1,z1),p(a0,z1),col)
    sc.tag('ふち');sc.join('板','ふち');sc.part()   # 上のふち（たる板のあつみの面と、ふたより上の内がわの面）：つながった1つの輪（中に線を入れない。たる板とのあいだにも線を入れない）
    for i in range(48):
        a0=2*math.pi*i/48;a1=2*math.pi*(i+1)/48;p=lambda a,z,d=0:(CX+(R(z)-d)*math.cos(a),CY+(R(z)-d)*math.sin(a),z)
        sc.quad(p(a0,H),p(a1,H),p(a1,H,TH),p(a0,H,TH),WOOD2);sc.quad(p(a0,ZL,TH),p(a1,ZL,TH),p(a1,H,TH),p(a0,H,TH),WOOD2)
    sc.tag(None);r=R(ZL)-TH;ws=[-r,-r/3,r/3,r]
    for i in range(3):   # ふたの板（たる板の内がわ）
        sc.part();a,b=ws[i],ws[i+1];pts=[]
        for t in [k/12 for k in range(13)]:
            x=a+(b-a)*t;pts.append((CX+x,CY-math.sqrt(max(r*r-x*x,0))))
        for t in [1-k/12 for k in range(13)]:
            x=a+(b-a)*t;pts.append((CX+x,CY+math.sqrt(max(r*r-x*x,0))))
        c=(sum(q[0] for q in pts)/len(pts),sum(q[1] for q in pts)/len(pts),ZL)
        for k in range(len(pts)):sc.tri(c,(pts[k][0],pts[k][1],ZL),(pts[(k+1)%len(pts)][0],pts[(k+1)%len(pts)][1],ZL),WOOD)
    sc.texture(None);sc.material('metal')
    for zc in(0.13,0.49):   # 鉄の輪（金属：つやのすじ）
        sc.part();z0,z1=zc-0.03,zc+0.03
        for i in range(48):
            a0=2*math.pi*i/48;a1=2*math.pi*(i+1)/48;q=lambda a,z:(CX+(R(z)+HOOP)*math.cos(a),CY+(R(z)+HOOP)*math.sin(a),z)
            sc.quad(q(a0,z0),q(a1,z0),q(a1,z1),q(a0,z1),METAL)
            sc.quad(q(a0,z1),q(a1,z1),(CX+R(z1)*math.cos(a1),CY+R(z1)*math.sin(a1),z1),(CX+R(z1)*math.cos(a0),CY+R(z1)*math.sin(a0),z1),METAL)   # 輪の上の面（あつみ）
    sc.material(None)
