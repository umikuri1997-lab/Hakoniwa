# 御神木（草原）の切り株・芽・若葉・若木と、育った御神木の3Dの下絵。4×4マスの物（置くマスは左上が(0,0)）。
# 根のまん中は、いまのチップと同じ所（x=2.0、根のいちばん手前の下はし y=3.81）。
# 出す絵：ref/sacred_sheet.png（お手本のキューブと5つの段階を1まいにならべた、ゲームの見え方の絵）
import math,sys,os
from PIL import Image
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
    R,HT=0.7,0.85     # 幹の半径・切り口の高さ
    sc.revolve(CX,CY,[(R,HT),(R,0.3),(R*1.08,0.12),(R*1.18,0.0)],lambda k,i:BARK[i%3],n=36)
    for k in range(5):  # 切り口：年輪
        sc.annulus(CX,CY,R*k/5,R*(k+1)/5,HT,lambda *a,k=k:RING[k%2],n=36)
    sc.ring_wall(CX,CY,R,HT-0.05,HT,lambda *a:(190,146,104),n=36)   # 切り口のふちの皮
    roots(sc,R,0.35,0.8,0.2)

SPX,SPY=CX+0.45,CY-0.25  # 芽の出る所（切り口の右おくのふち）
def sprout(sc,h,leaves):
    """切り口から出る芽：細いくき（高さ h）と、葉（leaves：[(向き, 大きさ)]）"""
    top=(SPX,SPY,0.85+h);sc.tube([(SPX,SPY,0.83),(SPX+0.02,SPY,0.85+h*0.6),top],0.025,(150,196,96),n=8)
    for a,L in leaves:   # 葉はうすい楕円（たまごの形）
        dx,dz=math.cos(a)*L*0.55,math.sin(a)*L*0.3
        sc.sphere(top[0]+dx,top[1],top[2]+dz,L*0.5,(176,218,112),n=16,m=8,zs=0.35)

def bud(sc): stump(sc);sprout(sc,0.1,[(0.6,0.1)])
def leaf(sc): stump(sc);sprout(sc,0.2,[(0.5,0.18),(2.6,0.16)])

def sapling(sc):
    """切り株の右のわきから、細い幹の若木がのびる（いまの絵と同じ所）"""
    stump(sc)
    x,y=CX+0.72,CY-0.05
    sc.tube([(x,y,0.0),(x+0.02,y,0.9),(x-0.03,y,1.5),(x,y,1.95)],0.07,BARK[0],n=10)
    for a,L,z in ((-2.6,0.5,1.35),(-0.4,0.45,1.45),(2.7,0.45,1.7),(0.4,0.4,1.75)):
        sc.tube([(x,y,z),(x+math.cos(a)*L,y+math.sin(a)*0.15,z+0.3)],0.03,BARK[0],n=8)
    for dx,dy,z,r in ((-0.45,0.05,1.75,0.24),(0.45,0.05,1.8,0.24),(0,-0.1,2.1,0.28),(-0.2,0.15,1.6,0.18),(0.25,0.15,1.6,0.18)):
        sc.sphere(x+dx,y+dy,z,r,LEAF[int(dx*10)%3],n=20,m=12,zs=0.8)

def tree(sc):
    sc.revolve(CX,CY,[(0.42,2.9),(0.46,1.8),(0.52,0.9),(0.6,0.35),(0.7,0.0)],lambda k,i:BARK[i%3],n=36)
    roots(sc,0.6,0.45,0.8,0.22,n=8)
    for a,zt,L in ((-2.6,2.3,1.6),(-0.5,2.3,1.6),(2.0,2.4,1.2),(-1.6,2.0,1.4),(0.9,2.0,1.3)):   # 太い枝
        ex,ey=math.cos(a)*L,math.sin(a)*L*0.5
        sc.tube([(CX,CY,zt-0.5),(CX+ex*0.5,CY+ey*0.5,zt+0.3),(CX+ex,CY+ey,zt+0.8)],0.14,BARK[1],n=10)
    blobs=[(0,-0.1,3.9,1.15),(-1.4,0.1,3.4,1.0),(1.4,0.1,3.5,1.0),(-0.75,-0.7,4.3,0.95),(0.8,-0.7,4.35,0.95),
           (-2.15,0.5,2.85,0.75),(2.15,0.5,2.9,0.75),(-0.75,0.75,3.0,0.85),(0.8,0.75,3.05,0.85),(0,-0.3,4.85,0.8)]
    for k,(dx,dy,z,r) in enumerate(blobs): sc.sphere(CX+dx,CY+dy,z,r,LEAF[k%3],n=32,m=18,zs=0.85)

out=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(__file__),'ref')
os.makedirs(out,exist_ok=True)
# 1まいの絵：上の段は、左にお手本のキューブ、そのみぎに 切り株・芽・若葉・若木・御神木 の3D（1マス64ドット）。下の段は、いまの絵（デザインのお手本）。
# どれも、置く4×4マス（黄色いわく）の同じ所に、同じ高さでならべる。
Y0,Y1=-3.0,5.0
STAGES=((stump,-1.0,5.0),(bud,-1.0,5.0),(leaf,-1.0,5.0),(sapling,-1.0,5.0),(tree,-2.0,6.0))
GAP=16
cube=Image.open(os.path.join(os.path.dirname(__file__),'..','ref','view-cube.png')).convert('RGBA')
panels=[]
for f,x0,x1 in STAGES:
    sc=Scene();f(sc);ext=(x0,x1,Y0,Y1)
    bg=grid_bg(ext,(4,4));bg.alpha_composite(render(sc,game,ext,VIEW))
    panels.append(bg.resize((bg.width//2,bg.height//2),Image.BOX))
# 下の段：いまの絵（デザインのお手本）。ゲームと同じ大きさ・同じ置き方（tools/sacred-tree-art.py の ART と同じ数）で、3Dのお手本の真下に
OLD=(('stump',128,33,75),('bud',128,33,75),('leaf',128,33,75),('sapling',128,38,59),('tree',288,-41,-94))
olds=[]
for (f,x0,x1),(n,sz,ax,ay) in zip(STAGES,OLD):
    ext=(x0,x1,Y0,Y1);bg=grid_bg(ext,(4,4));bg=bg.resize((bg.width//2,bg.height//2),Image.BOX)
    size=round(sz*4/3);ax=128-round((96-ax)*4/3);ay=244-round((180-ay)*4/3)
    im=Image.open(os.path.join(os.path.dirname(__file__),n+'.png')).convert('RGBA').resize((size,size),Image.BOX)
    bg.alpha_composite(im,(round(-x0*64)+ax,round(-Y0*64)+ay));olds.append(bg)
Hh=panels[0].height;Ww=cube.width+sum(p.width for p in panels)+GAP*len(panels)
sheet=Image.new('RGBA',(Ww,Hh*2+GAP),(255,255,255,255));sheet.paste(cube,(0,Hh-cube.height));x=cube.width+GAP
for p,o in zip(panels,olds): sheet.paste(p,(x,0));sheet.paste(o,(x,Hh+GAP));x+=p.width+GAP
sheet.convert('RGB').save(f'{out}/sacred_sheet.png')
print('ok',sheet.size)
