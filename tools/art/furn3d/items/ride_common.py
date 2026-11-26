# 遊園地の遊具（merry・cup・skyswing・wheel）の、設計図の共通の部分。
# 組み方は tools/art/handoff3d/rides.py（床の中心が原点・南と上が正）。ここでは、置くマスの左上を (0,0) にそろえるため、
# まん中を (CX,CY) へずらして、Scene に足す。動く絵は FRAMES=16 コマ：1コマめから最後のコマで、動き全体の「くりかえしの1まわり」。
import os,sys,math
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..','..')
for p in (os.path.join(ART,'handoff3d'),os.path.join(ART,'kowaino3d')):
    if p not in sys.path:sys.path.append(p)
import importlib.util
def _load(name,path):
    s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);sys.modules[name]=m;s.loader.exec_module(m);return m
R=_load('ride_render',os.path.join(ART,'handoff3d','render.py'))   # Model（遊具の部品を足す道具）
import rides as RD
Model=R.Model
FRAMES=16
def put(sc,make,cx,cy,phase,broken=False,**kw):
    """遊具をつくり、まん中を (cx,cy) へずらして sc に足す。かえすのは、座席の点（ずらしたあと）"""
    n0=len(sc.t);m=Model();m.sc=sc;seats=[];make(m,phase,broken,seats,**kw)
    d=__import__('numpy').array([cx,cy,0.0])
    for i in range(n0,len(sc.t)):
        a,b,c,col,pid=sc.t[i];sc.t[i]=(a+d,b+d,c+d,col,pid)
    return [(x+cx,y+cy,z) for x,y,z in seats]
def box(cx,cy,rx,ry,h):
    """写す範囲をそろえる点（すべてのコマで、絵のわくを同じにする。PBOX）"""
    return [(cx+sx*rx,cy+sy*ry,z) for sx in(-1,1) for sy in(-1,1) for z in(0,h)]
