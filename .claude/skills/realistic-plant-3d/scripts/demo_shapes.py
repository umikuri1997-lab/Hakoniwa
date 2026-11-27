"""Create technique sample GLB + reference image, not a finished species model.
Usage: python demo_shapes.py /path/to/output (numpy, trimesh, matplotlib)
"""
from pathlib import Path
import sys, math
import numpy as np
import trimesh
from plant_geometry import leaf,tube,azimuths,export_glb


def samples():
    colors=[(84,135,63,255),(93,151,68,255),(107,155,78,255)]
    leaves=[]
    for i,(w,b,c,t,r,n) in enumerate([(0.25,-.12,.035,.26,.012,0),(.50,-.20,.11,-.35,.03,9),(.72,.19,.22,.24,.045,0)]):
        leaves.append(leaf((0,0,0),(0,1,.15),1,w,bend=b,cup=c,twist=t,ripple=r,teeth=n,color=colors[i]))
    # A short branch: true opposite pairs, length/angle differences, connected petioles.
    branch=[tube([(0,0,0),(.025,0,.35),(.02,.02,.75),(-.05,.04,1.05)],[.035,.028,.017,.006],color=(105,82,47,255))]
    rng=np.random.default_rng(72)
    for i,angle in azimuths(5,'opposite'):
        z=.13+i*.17; base=np.array([.025,.01,z]); a=math.radians(angle+rng.uniform(-9,9)); d=np.array([math.cos(a),math.sin(a),rng.uniform(.12,.5)])
        attach=base+.08*d; branch.append(tube([base,attach],[.009,.005],sides=8,color=(91,121,58,255)))
        branch.append(leaf(attach,d,rng.uniform(.27,.38)*(1-i*.06),.11,bend=-.12,cup=.04,twist=rng.uniform(-.3,.3),color=colors[i%3]))
    # Rosette demonstrating differential age and nested cupped blades.
    rosette=[]
    for i in range(22):
        a=math.radians(i*137.5+rng.uniform(-8,8)); age=i/21
        d=np.array([math.cos(a),math.sin(a),.16+.95*age]); base=np.array([0,0,.018+.12*age]); L=(.48-.26*age)*rng.uniform(.9,1.1)
        rosette.append(leaf(base,d,L,L*(.66+.12*age),bend=.08+.20*age,cup=.16+.07*age,twist=rng.uniform(-.22,.22),ripple=.025,color=(int(65+63*age),int(120+44*age),int(55+36*age),255)))
    return leaves,branch,rosette


def render(out,groups):
    import matplotlib; matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d.art3d import Poly3DCollection
    fig=plt.figure(figsize=(15,8),facecolor='#f7f8f4')
    def plot(ax, ms, elev, azim):
        allv=[]
        for m in ms:
            v=m.vertices; allv.append(v); tris=v[m.faces]; normals=m.face_normals
            mat=getattr(m.visual,'material',None)
            c=np.asarray(mat.baseColorFactor[:3] if mat is not None else m.visual.face_colors[0,:3],dtype=float)/255
            lighting=.60+.40*np.abs(normals@np.array([.30,-.35,.887]))
            coll=Poly3DCollection(tris,facecolors=np.clip(c[None,:]*lighting[:,None],0,1),edgecolor='none',antialiased=False); ax.add_collection3d(coll)
        v=np.concatenate(allv); lo=v.min(0); hi=v.max(0); mid=(lo+hi)/2; rad=max(hi-lo)*.55
        ax.set_xlim(mid[0]-rad,mid[0]+rad); ax.set_ylim(mid[1]-rad,mid[1]+rad); ax.set_zlim(mid[2]-rad,mid[2]+rad); ax.set_box_aspect([1,1,1]); ax.view_init(elev,azim); ax.set_axis_off(); ax.set_facecolor('#f7f8f4')
    leaves,branch,rosette=groups
    for i,l in enumerate(leaves):
        ax=fig.add_subplot(2,3,i+1,projection='3d'); plot(ax,[l],36,-35); ax.set_title(['01  Narrow / twisted','02  Serrated / curved','03  Broad / cupped'][i],loc='left',fontsize=14,color='#26452e')
    for i,(ms,e,a,title) in enumerate([(branch,18,25,'04  Opposite leaf pairs'),(rosette,24,35,'05  Nested rosette'),(rosette,85,20,'06  Rosette from above')]):
        ax=fig.add_subplot(2,3,i+4,projection='3d'); plot(ax,ms,e,a); ax.set_title(title,loc='left',fontsize=14,color='#26452e')
    fig.suptitle('PLANT GEOMETRY  /  Shape construction samples',fontsize=22,weight='bold',x=.06,ha='left',color='#183b2a')
    fig.text(.06,.03,'Procedural mesh previews • construction references, not photographs or species-accurate final assets',fontsize=11,color='#4e6253')
    fig.subplots_adjust(left=.04,right=.97,top=.90,bottom=.08,wspace=.03,hspace=.15); fig.savefig(out/'geometry_samples.png',dpi=140); plt.close(fig)

if __name__=='__main__':
    out=Path(sys.argv[1]); out.mkdir(parents=True,exist_ok=True); g=samples()
    sc=trimesh.Scene()
    for i,items in enumerate([[m] for m in g[0]]+[g[1],g[2]]):
        for j,m in enumerate(items):
            m=m.copy(); m.apply_translation((i*1.35,0,0)); sc.add_geometry(m,node_name=f'sample_{i}_{j}',geom_name=f'sample_{i}_{j}')
    export_glb(sc,out/'geometry_samples.glb'); render(out,g)
