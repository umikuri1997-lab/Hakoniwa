# たる（taru）：ふくらんだ形の板（たて板14まい）・鉄の輪2本・ふたの板3まい。丸い物なので EXTRA で組む。
import math
from common import *
ID='taru';BOTTOM=44
VIEWS=[('taru',0)]
CX,CY=0.5,0.62;H=0.62;N=12
def R(z):return 0.27+0.05*math.sin(math.pi*z/H)   # たる板のふくらみ（まん中がいちばん太い）
def PARTS():return []   # 丸い物なので、ぜんぶ EXTRA で組む
def EXTRA(sc):
    import oblique3d as O,os
    T=O.Tex(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','textures','wood049.png'))
    sc.texture(T);NZ=10
    for i in range(N):   # たて板：1まいずつべつの部品（さかいに輪郭線が入る）
        a0=2*math.pi*i/N;a1=2*math.pi*(i+1)/N;sc.part();col=WOOD if i%2 else WOOD2
        for j in range(NZ):
            z0=H*j/NZ;z1=H*(j+1)/NZ;p=lambda a,z:(CX+R(z)*math.cos(a),CY+R(z)*math.sin(a),z)
            sc.quad(p(a0,z0),p(a1,z0),p(a1,z1),p(a0,z1),col)
    r=R(H)-0.025;ws=[-r,-r/3,r/3,r]
    for i in range(3):   # ふたの板（たて板のふちより少し下）
        sc.part();a,b=ws[i],ws[i+1];zt=H-0.03;pts=[]
        for t in [k/12 for k in range(13)]:
            x=a+(b-a)*t;pts.append((CX+x,CY-math.sqrt(max(r*r-x*x,0))))
        for t in [1-k/12 for k in range(13)]:
            x=a+(b-a)*t;pts.append((CX+x,CY+math.sqrt(max(r*r-x*x,0))))
        c=(sum(p[0] for p in pts)/len(pts),sum(p[1] for p in pts)/len(pts),zt)
        for k in range(len(pts)):sc.tri(c,(pts[k][0],pts[k][1],zt),(pts[(k+1)%len(pts)][0],pts[(k+1)%len(pts)][1],zt),WOOD)
    sc.texture(None)
    for zc in(0.13,0.49):   # 鉄の輪
        sc.part();z0,z1=zc-0.03,zc+0.03
        for i in range(48):
            a0=2*math.pi*i/48;a1=2*math.pi*(i+1)/48;p=lambda a,z:(CX+(R(z)+0.012)*math.cos(a),CY+(R(z)+0.012)*math.sin(a),z)
            sc.quad(p(a0,z0),p(a1,z0),p(a1,z1),p(a0,z1),METAL)
