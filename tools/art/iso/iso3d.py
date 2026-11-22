# ためし：神殿・こわれた神殿・御神木の切り株を、クォータービューの角度で3Dから写す（チップには入れない）。
# 見え方：物を上から見て45度まわし（正面＝南が左下、東が右下を向く）、見おろし48.59度・遠近なし。
#   地面の1マスは 128×96 のひし形（よこ:たて＝4:3。sin48.59＝0.75）。高さは、その角度のとおり（1マスの高さは、マスの1辺の cos48.59＝0.66）。
#   1マスの1辺は 90.51 ドット（128/√2）で写す（ひし形のはばが128になる）。
# 写し方・かげ・色は、いまの道具のまま（furn3d.py・sacred_tripo.py）。かえるのは、まわす角度と見おろしの角度だけ。
# 使い方：python3 tools/art/iso/iso3d.py <出力フォルダ>
import sys,os,math
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..')
for p in(ART,os.path.join(ART,'furn3d'),os.path.join(ART,'furn3d','items'),os.path.join(ART,'sacred-tree')):sys.path.insert(0,p)
import numpy as np
from PIL import Image
import oblique3d as O
ISOELEV=math.degrees(math.asin(0.75));ISOANG=45.0;ISOS=128/math.sqrt(2)   # 地面のたては、よこの0.75
ISOKEEP=math.degrees(math.acos(math.cos(math.radians(ISOELEV))*math.sin(math.radians(51.34))))   # persp の大きさ k を1にする角度（地面0.75・高さ0.66 の、ほんとうの見え方）
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
_shot=F3.shot
def shot(M,k,only=None,S_=64,filt=None,info=None):return _shot(M,k,only,ISOS,filt,info)
F3.shot=shot
def main(out):
    os.makedirs(out,exist_ok=True);res={}
    for iid in('statueb','statue'):
        CH=F3.run(iid,os.path.join(out,iid));res[iid]=CH[iid][0]
    import sacred_tripo as ST
    V,comps=ST.load();im,ax,ay=ST.shot(ST.Stage(V,comps,'stump'));res['stump']=im
    for k,im in res.items():im.save(os.path.join(out,k+'.png'));print(k,im.size)
if __name__=='__main__':main(sys.argv[1])
