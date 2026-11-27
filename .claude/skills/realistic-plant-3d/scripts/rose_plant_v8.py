"""Textured garden-rose geometry study. Not a cultivar-accurate finished asset.
Requires numpy, trimesh, Pillow. Z-up metres; exports Y-up GLB.
"""
from pathlib import Path
import numpy as np
import trimesh
from PIL import Image
from plant_geometry import leaf, frame, unit, export_glb
from flower_geometry import surface
ROOT=Path(__file__).resolve().parents[1]

def material(name,double=True):
    p=ROOT/'assets'/'textures'/name
    base=Image.open(p/'basecolor.png').convert('RGB')
    normal=Image.open(p/'normal.png').convert('RGB')
    rough=np.array(Image.open(p/'roughness.png').convert('L'))
    # glTF uses roughness in G and metallic in B; metallic is zero.
    mr=Image.fromarray(np.stack([np.full_like(rough,255),rough,np.zeros_like(rough)],-1))
    return trimesh.visual.material.PBRMaterial(name=name,baseColorTexture=base,normalTexture=normal,metallicRoughnessTexture=mr,baseColorFactor=[255]*4,metallicFactor=0,roughnessFactor=1,doubleSided=double)

def assign(m,mat):
    m.visual=trimesh.visual.TextureVisuals(uv=m.visual.uv,material=mat)
    return m

def petal(angle,R,H,span,opening,phase,inner=False,rows=20,cols=18):
    """Cupped petals with broad rounded margins and pinched bases; no pointed rim.
    Central petals curl toward the axis rather than leaving an open funnel.
    """
    v=[]; uv=[]; f=[]
    for i in range(rows+1):
        t=i/rows
        for j in range(cols+1):
            q=2*j/cols-1
            width=(.58+.66*np.sin(np.pi*.83*t)**.72)*(1-.22*t**8)
            a=angle+span*q*width/2+.16*t*t*np.sin(phase)+.12*t*t*q*q
            base=.16*R
            r=base+(R-base)*np.sin(np.pi*.45*t)**.86
            r*=1+.15*q*np.sin(np.pi*t*.75)-.055*q*q*np.sin(np.pi*t*.8)-.16*q*q*t**7
            # Rim turns outward for open outer petals and inward for the bud core.
            r+=R*(.22*opening-.42*inner)*t**6
            r+=R*.024*t*t*np.sin(q*3.1+phase)
            r=max(.00065,r)
            z=H*(.02+.98*t-.16*q*q*t**4-.16*opening*t**7)
            z+=H*(.045*np.sin(phase+q*3.4)*t**5+.045*q*t*t)
            v.append([r*np.cos(a),r*np.sin(a),z]);uv.append([(q+1)/2,t])
    for i in range(rows):
        for j in range(cols):
            a=i*(cols+1)+j;b=a+cols+1
            f.extend([(a,b,a+1),(a+1,b,b+1)])
    return surface(v,f,(225,120,153,255),np.asarray(uv))

def stem(points,radii,mat,sides=12):
    p=np.asarray(points); v=[];uv=[];f=[]
    for i,(x,r) in enumerate(zip(p,radii)):
        d=unit(p[min(i+1,len(p)-1)]-p[max(i-1,0)]);_,a,b=frame(d)
        for j in range(sides+1):
            th=2*np.pi*j/sides; v.append(x+r*(a*np.cos(th)+b*np.sin(th)));uv.append((j/sides,i/(len(p)-1)))
    for i in range(len(p)-1):
        for j in range(sides):
            a=i*(sides+1)+j;b=a+sides+1;f.extend([(a,a+1,b+1),(a,b+1,b)])
    m=surface(v,f,(72,122,50,255),np.asarray(uv)); return assign(m,mat)

def build(seed=19):
    rng=np.random.default_rng(seed);sc=trimesh.Scene(); mats={n:material(n) for n in ('petal_rose','leaf_rose','stem_green')}
    def add(m,name,mat=None,offset=None):
        if mat: assign(m,mats[mat])
        if offset is not None: m.apply_translation(offset)
        sc.add_geometry(m,geom_name=name,node_name=name)
    tip=np.array([.014,.005,.24]); points=[(0,0,0),(-.005,.003,.05),(-.009,.006,.105),(-.003,.009,.16),(.008,.008,.205),tip]
    add(stem(points,[.0031,.0028,.0025,.002,.0017,.0014],mats['stem_green']),'main_stem')
    # Individual petals; approximate a moderately double garden rose.
    tiers=[(6,.049,.025,1.67,1.0),(7,.039,.032,1.47,.75),(6,.029,.039,1.66,.46),(5,.020,.043,2.05,.18),(4,.011,.045,2.45,0),(3,.0058,.042,3.1,0)]
    for k,(n,r,h,span,op) in enumerate(tiers):
        for i in range(n):
            a=2*np.pi*i/n+k*2.39996+rng.uniform(-.07,.07)
            m=petal(a,r*rng.uniform(.985,1.015),h*rng.uniform(.985,1.015),span,op,rng.uniform(0,2*np.pi),k>=4)
            add(m,f'petal_{k}_{i}','petal_rose',tip)
    # A tightly folded inner petal crosses the floral axis, concealing the central
    # aperture from above without substituting a sphere or green plug.
    vv=[]; ff=[]; uv=[]
    for i in range(19):
        t=i/18
        for j in range(13):
            q=2*j/12-1
            w=.00055+.0039*np.sin(np.pi*.74*t)**.8
            vv.append((.0027*np.cos(np.pi*1.15*t)+q*w*.28, q*w, .010+.032*t-.003*q*q*t**3+.0018*np.sin(np.pi*t)*q))
            uv.append(((q+1)/2,t))
    for i in range(18):
        for j in range(12):
            a=i*13+j;b=a+13;ff.extend([(a,b,a+1),(a+1,b,b+1)])
    add(surface(vv,ff,(225,120,153,255),np.asarray(uv)),'folded_center','petal_rose',tip)
    for i in range(5):
        a=2*np.pi*i/5
        add(leaf(tip-np.array([0,0,.002]),(np.cos(a),np.sin(a),-.55),.020,.006,bend=-.20,cup=.035,twist=.15,segments=18,columns=6),'sepal_'+str(i),'leaf_rose')
    # Four alternate compound leaves, each with distinct rachis and 5/7 leaflets.
    for k,idx in enumerate([1,2,3,4]):
        o=np.array(points[idx]);a=k*2.40+.35;d=unit([np.cos(a),np.sin(a),.18]);s=unit(np.cross([0,0,1],d)); L=.066-k*.006
        def rach(t): return o+d*L*t+np.array([0,0,-.012*t*t])
        add(stem([rach(t) for t in np.linspace(0,1,7)],np.linspace(.00085,.00034,7),mats['stem_green']),f'rachis_{k}')
        for j,t in enumerate([.28,.60] if k>=2 else [.22,.45,.68]):
            for side in [-1,1]:
                p=rach(t);f=unit(d*.53+s*side*.82+np.array([0,0,rng.uniform(-.12,.15)]));base=p+f*.004
                add(stem([p,base],[.00043,.00031],mats['stem_green']),f'petiolule_{k}_{j}_{side}')
                l=(.032-.006*t)*(1-.06*k)*rng.uniform(.90,1.09)
                add(leaf(base,f,l,l*.53,profile=lambda t: np.sin(np.pi*t)**.72*(1.16-.40*t),bend=rng.uniform(-.18,-.08),cup=-.035,twist=rng.uniform(-.22,.22),ripple=.012,teeth=10,serration=.09,asym=.05,segments=42,columns=6),f'leaflet_{k}_{j}_{side}','leaf_rose')
        l=.034*(1-.06*k);add(leaf(rach(1),d,l,l*.52,profile=lambda t: np.sin(np.pi*t)**.72*(1.16-.40*t),bend=-.14,cup=-.035,twist=.13,teeth=10,serration=.09,segments=42,columns=6),f'terminal_{k}','leaf_rose')
    return sc

if __name__=='__main__':
    out=ROOT/'assets'/'rose_plant_v8.glb';export_glb(build(),out); print(out)
