# 御神木（草原）の切り株・芽・若葉・若木と、育った御神木の3Dの下絵。4×4マスの物（置くマスは左上が(0,0)）。
# 根のまん中は、いまのチップと同じ所（x=2.0、根のいちばん手前の下はし y=3.81）。
# 出す絵：<名前>_full.png（ゲームの見え方・マス目と置くマスのわく）、<名前>_full_nogrid.png、<名前>_side.png（まよこ）
import math,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..'))
from oblique3d import *
CX,CY=2.0,3.0          # 幹のまん中
BARK=[(214,170,124),(200,156,112),(222,180,134)]   # 木の皮（たてのすじ）
ROOT=(206,162,118)
RING=[(246,224,184),(236,208,164)]                 # 切り口の年輪
LEAF=[(196,226,128),(176,212,112),(214,236,150)]   # 葉のかたまり

def roots(sc,r0,z0,reach,thick,n=7):
    """幹のすそから、ななめ下へのびて地面をはう根（つけ根が太く、先へいくほど細く低い）。手前・うしろは reach まで、よこは1.45倍"""
    for k in range(n):
        a=2*math.pi*(k+0.35)/n
        rx=reach*1.45;R=1/math.hypot(math.cos(a)/rx,math.sin(a)/reach)   # よこへは長く、手前・うしろへは reach まで
        for i in range(17):
            u=i/16;r=r0*0.8+(R-r0*0.8)*u;t=thick*(1-0.75*u)
            z=z0*(1-u)**2+t*0.45
            sc.sphere(CX+r*math.cos(a),CY+r*math.sin(a),z,t,ROOT,n=12,m=6,zs=0.75)

def stump(sc):
    R,HT=0.62,0.72     # 幹の半径・切り口の高さ
    sc.revolve(CX,CY,[(R,HT),(R,0.3),(R*1.08,0.12),(R*1.18,0.0)],lambda k,i:BARK[i%3],n=36)
    for k in range(5):  # 切り口：年輪
        sc.annulus(CX,CY,R*k/5,R*(k+1)/5,HT,lambda *a,k=k:RING[k%2],n=36)
    sc.ring_wall(CX,CY,R,HT-0.05,HT,lambda *a:(190,146,104),n=36)   # 切り口のふちの皮
    roots(sc,R,0.32,0.8,0.17)

SPX,SPY=CX+0.3,CY-0.12   # 芽の出る所（切り口の右おく）
def sprout(sc,h,leaves):
    """切り口から出る芽：細いくき（高さ h）と、葉（leaves：[(向き, 大きさ)]）"""
    top=(SPX,SPY,0.72+h);sc.tube([(SPX,SPY,0.70),(SPX+0.02,SPY,0.72+h*0.6),top],0.025,(150,196,96),n=8)
    for a,L in leaves:   # 葉はうすい楕円（たまごの形）
        dx,dz=math.cos(a)*L*0.55,math.sin(a)*L*0.3
        sc.sphere(top[0]+dx,top[1],top[2]+dz,L*0.5,(176,218,112),n=16,m=8,zs=0.35)

def bud(sc): stump(sc);sprout(sc,0.1,[(0.6,0.1)])
def leaf(sc): stump(sc);sprout(sc,0.2,[(0.5,0.18),(2.6,0.16)])

def sapling(sc):
    """切り株の右おくから、細い幹の若木がのびる（高さ2.3マスくらい）"""
    stump(sc)
    b=(SPX,SPY,0.70);t=(SPX+0.05,SPY,1.9)
    sc.tube([b,(SPX+0.03,SPY,1.3),t],0.07,BARK[0],n=10)
    for a,L,z in ((-2.6,0.55,1.55),(-0.4,0.55,1.6),(2.6,0.4,1.85),(0.5,0.4,1.9)):
        sc.tube([(SPX,SPY,z),(SPX+math.cos(a)*L,SPY+math.sin(a)*0.15,z+0.35)],0.03,BARK[0],n=8)
    for dx,dy,z,r in ((-0.45,0.05,2.0,0.3),(0.45,0.05,2.05,0.3),(0,-0.1,2.35,0.32),(-0.15,0.15,1.85,0.22),(0.25,0.15,1.8,0.22)):
        sc.sphere(SPX+dx,SPY+dy,z,r,LEAF[int(dx*10)%3],n=20,m=12,zs=0.8)

def tree(sc):
    sc.revolve(CX,CY,[(0.42,2.9),(0.46,1.8),(0.52,0.9),(0.6,0.35),(0.7,0.0)],lambda k,i:BARK[i%3],n=36)
    roots(sc,0.6,0.45,0.8,0.22,n=8)
    for a,zt,L in ((-2.6,2.3,1.6),(-0.5,2.3,1.6),(2.0,2.4,1.2),(-1.6,2.0,1.4),(0.9,2.0,1.3)):   # 太い枝
        ex,ey=math.cos(a)*L,math.sin(a)*L*0.5
        sc.tube([(CX,CY,zt-0.5),(CX+ex*0.5,CY+ey*0.5,zt+0.3),(CX+ex,CY+ey,zt+0.8)],0.14,BARK[1],n=10)
    blobs=[(0,-0.1,3.9,1.15),(-1.4,0.1,3.4,1.0),(1.4,0.1,3.5,1.0),(-0.75,-0.7,4.3,0.95),(0.8,-0.7,4.35,0.95),
           (-2.15,0.5,2.85,0.75),(2.15,0.5,2.9,0.75),(-0.75,0.75,3.0,0.85),(0.8,0.75,3.05,0.85),(0,-0.3,4.85,0.8)]
    for k,(dx,dy,z,r) in enumerate(blobs): sc.sphere(CX+dx,CY+dy,z,r,LEAF[k%3],n=32,m=18,zs=0.85)

out=sys.argv[1] if len(sys.argv)>1 else os.path.dirname(__file__)
for name,f,ext,sext in (('stump',stump,(-1.0,5.0,-1.0,5.0),(-1.0,5.0,-1.5,0.5)),
                        ('bud',bud,(-1.0,5.0,-1.0,5.0),(-1.0,5.0,-1.5,0.5)),
                        ('leaf',leaf,(-1.0,5.0,-1.0,5.0),(-1.0,5.0,-1.5,0.5)),
                        ('sapling',sapling,(-1.0,5.0,-1.0,5.0),(-1.0,5.0,-3.0,0.5)),
                        ('tree',tree,(-2.0,6.0,-3.0,5.0),(-2.0,6.0,-6.0,0.5))):
    sc=Scene();f(sc)
    fg=render(sc,game,ext,VIEW);bg=grid_bg(ext,(4,4));bg.alpha_composite(fg);bg.save(f'{out}/{name}3d_full.png');fg.save(f'{out}/{name}3d_full_nogrid.png')
    sd=render(sc,side,sext,SIDE);bg=grid_bg(sext);bg.alpha_composite(sd);bg.save(f'{out}/{name}3d_side.png')
print('ok')
