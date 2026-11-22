# ためし：神殿・こわれた神殿・御神木の切り株を、クォータービューの角度で3Dから写す（チップには入れない）。
# 見え方：物を上から見て45度まわし（正面＝南が左下、東が右下を向く）、見おろし32度・遠近なし。
#   地面の1マスは、はば√2・高さ√2/2 のひし形（2:1。iso_mock.cjs の地面と同じ）。高さは、いまと同じ1マス0.8。
# 写し方・かげ・色は、いまの道具のまま（furn3d.py・sacred_tripo.py）。かえるのは、まわす角度と見おろしの角度だけ。
# 使い方：python3 tools/art/iso/iso3d.py <出力フォルダ>
import sys,os,math
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..')
for p in(ART,os.path.join(ART,'furn3d'),os.path.join(ART,'furn3d','items'),os.path.join(ART,'sacred-tree')):sys.path.insert(0,p)
import numpy as np
from PIL import Image
import oblique3d as O
ISOELEV,ISOKEEP,ISOANG=32.0,51.34,45.0   # tan(32)*0.8 ≒ 0.5：地面のたては、よこの半分。keep=51.34：高さは1マス0.8（いまのゲームと同じ）
_persp=O.persp
def persp(elev=51.34,fov=40.0,frame=None,center=(0.5,0.65,0.3),full=False,keep=None):return _persp(ISOELEV,fov,None,center,False,ISOKEEP)
O.persp=persp
_turn=O.Scene.turn
def turn(self,k,foot=None):
    _turn(self,k,foot);f0,dc0=self.fwd,self.dc
    V=np.array([v for t_ in self.t for v in t_[:3]]);x0,y0,x1,y1=V[:,0].min(),V[:,1].min(),V[:,0].max(),V[:,1].max();cx,cy=(x0+x1)/2,(y0+y1)/2
    c,s=math.cos(math.radians(ISOANG)),math.sin(math.radians(ISOANG))
    R=lambda v:np.array([cx+c*(v[0]-cx)-s*(v[1]-cy),cy+s*(v[0]-cx)+c*(v[1]-cy),v[2]])
    self.t=[(R(a),R(b),R(d),col,pid) for a,b,d,col,pid in self.t];self.fwd=lambda v:R(f0(v))
    def inv(f):
        def g(x,y,z):return f(cx+c*(x-cx)+s*(y-cy),cy-s*(x-cx)+c*(y-cy),z)
        return g
    self.dc={pid:inv(f) for pid,f in dc0.items()}
O.Scene.turn=turn
import furn3d as F3
def main(out):
    os.makedirs(out,exist_ok=True);res={}
    for iid in('statueb','statue'):
        CH=F3.run(iid,os.path.join(out,iid));res[iid]=CH[iid][0]
    import sacred_tripo as ST
    V,comps=ST.load();im,ax,ay=ST.shot(ST.Stage(V,comps,'stump'));res['stump']=im
    for k,im in res.items():im.save(os.path.join(out,k+'.png'));print(k,im.size)
if __name__=='__main__':main(sys.argv[1])
