"""Curved, overlapping garden-rose bloom prototype, not a cultivar specification.
Run: python rose_curved.py. Requires numpy/trimesh. All geometry Z-up, metres.
"""
from pathlib import Path
import numpy as np
import trimesh
from plant_geometry import export_glb, tube, leaf
from flower_geometry import surface


def rose_petal(theta, radius, height, span, opening, phase, layer, rows=36, cols=36):
    # Angular wrap around the floral axis rather than a flat radial blade.
    # Broad rounded upper margin, pinched attachment, continuous recurved lip.
    v=[]; uv=[]; f=[]
    for i in range(rows+1):
        t=i/rows
        for j in range(cols+1):
            q=2*j/cols-1
            spread=.055+.945*np.sin(np.pi*.65*t)**.83
            a=theta+span*q*spread/2+.10*t*t*np.sin(phase)
            # Cup sides tuck inward; outer rim bends out gradually.
            r=radius*(.18+.76*t**.82+.16*opening*t**5)
            r*=1-.14*q*q*np.sin(np.pi*t*.65)
            r+=radius*(.025*np.sin(phase+q*2.8)*t*t+.06*q*t**3)
            z=height*(.04+.94*t-.18*opening*t**6-.17*q*q*t**6)
            z+=height*(.022*np.sin(phase+q*5.8)*t**5+.035*q*t*t)
            v.append((r*np.cos(a),r*np.sin(a),z));uv.append(((q+1)/2,t))
    for i in range(rows):
        for j in range(cols):
            a=i*(cols+1)+j;b=a+cols+1
            f.extend(((a,a+1,b),(a+1,b+1,b)))
    m=surface(v,f,(227-layer*3,123-layer*5,155-layer*4,255),np.asarray(uv))
    assert np.min(m.area_faces)>1e-12
    return m


def bloom(seed=41):
    rng=np.random.default_rng(seed);sc=trimesh.Scene()
    # Broad outer petals, smaller taller inner petals; stagger adjacent tiers.
    # Artistic parameters; adjust after comparing the target cultivar.
    tiers=[(6,.052,.027,1.55,1.0),(7,.041,.034,1.35,.76),(6,.030,.039,1.52,.48),(5,.019,.042,1.85,.25),(4,.0105,.041,2.25,.04),(3,.005,.039,2.65,0)]
    for k,(n,r,h,span,op) in enumerate(tiers):
        for i in range(n):
            angle=2*np.pi*i/n+k*2.39996+rng.uniform(-.08,.08)
            m=rose_petal(angle,r*rng.uniform(.95,1.05),h*rng.uniform(.94,1.06),span,op,rng.uniform(0,2*np.pi),k)
            sc.add_geometry(m,geom_name=f'petal_{k}_{i}')
    # Calyx prototype and stem, with a curved taper.
    for i in range(5):
        a=2*np.pi*i/5
        m=leaf((0,0,0),(np.cos(a),np.sin(a),-.28),.024,.008,bend=-.24,cup=.035,segments=28,columns=10,color=(66,105,43,255))
        sc.add_geometry(m,geom_name=f'sepal_{i}')
    pts=[(-.012,0,-.19),(-.009,.002,-.13),(.003,.003,-.067),(0,0,-.004),(0,0,.001)]
    sc.add_geometry(tube(pts,[.0025,.0023,.0018,.0015,.0015],sides=20,ridge=.015,color=(76,117,50,255)),geom_name='stem')
    return sc

if __name__=='__main__':
    out=Path(__file__).resolve().parents[1]/'assets'/'rose_bloom_prototype.glb'
    export_glb(bloom(),out)
    loaded=trimesh.load(out,force='scene')
    assert len(loaded.geometry)==37
    assert all(np.isfinite(m.vertices).all() and np.min(m.area_faces)>1e-12 for m in loaded.geometry.values())
    print(len(loaded.geometry),'meshes;',sum(len(m.faces) for m in loaded.geometry.values()),'triangles')
